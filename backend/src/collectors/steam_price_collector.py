import requests
import json
import psycopg2
from datetime import datetime
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "steam_prices"),
            user=os.getenv("DB_USER", "steam_user"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def get_steam_game_price(app_id, currency_code='us', max_retries=5):
    """
    Fetches the price and name of a Steam game in a specific currency.
    Implements exponential backoff for rate limiting.
    
    Args:
        app_id (int or str): The Steam App ID of the game.
        currency_code (str): The two-letter country code for the currency (e.g., 'us' for USD).
        max_retries (int): Maximum number of retry attempts for rate limiting.
        
    Returns:
        dict: A dictionary containing the game's data, or None if the request fails.
    """
    url = f"https://store.steampowered.com/api/appdetails?appids={app_id}&cc={currency_code}"
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            
            # If rate limited, wait and retry with exponential backoff
            if response.status_code == 429:
                wait_time = (2 ** attempt) * 5  # 5, 10, 20, 40, 80 seconds
                print(f"⚠️  Rate limited! Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
            
            response.raise_for_status()
            data = response.json()
            
            # Check if the request was successful and contains data
            if data and data[str(app_id)]['success']:
                return data[str(app_id)]['data']
            else:
                print(f"⚠️  No data available for App ID {app_id}")
                return None
                
        except requests.exceptions.Timeout:
            print(f"⚠️  Timeout fetching data for App ID {app_id}")
            if attempt < max_retries - 1:
                time.sleep(5)
                continue
            return None
        except requests.exceptions.RequestException as e:
            if "429" in str(e):
                wait_time = (2 ** attempt) * 5
                print(f"⚠️  Rate limited! Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
            print(f"❌ An error occurred during the request: {e}")
            return None
        except (KeyError, json.JSONDecodeError) as e:
            print(f"❌ Could not parse data from the response: {e}")
            return None
    
    print(f"❌ Max retries exceeded for App ID {app_id}")
    return None

def save_price_to_db(app_id, game_data, currency):
    """Save price data and game details to the database"""
    # First, save comprehensive game details
    save_game_details_to_db(app_id, game_data)
    
    # Then save price history
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        price_data = game_data.get('price_overview')
        
        # Insert price history if game has pricing
        if price_data:
            cur.execute("""
                INSERT INTO price_history 
                (app_id, currency, initial_price, final_price, discount_percent)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                app_id,
                price_data.get('currency'),
                price_data.get('initial'),
                price_data.get('final'),
                price_data.get('discount_percent', 0)
            ))
            
            conn.commit()
        
    except Exception as e:
        print(f"❌ Database error saving price for App ID {app_id}: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def save_game_details_to_db(app_id, game_data):
    """Save comprehensive game details to database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Parse release date
        release_date_str = game_data.get('release_date', {}).get('date')
        release_date = None
        if release_date_str and not game_data.get('release_date', {}).get('coming_soon', False):
            try:
                # Try common date formats
                for fmt in ['%b %d, %Y', '%d %b, %Y', '%Y']:
                    try:
                        release_date = datetime.strptime(release_date_str, fmt).date()
                        break
                    except:
                        continue
            except:
                pass
        
        # Extract data with safe defaults
        name = game_data.get('name', 'Unknown')
        short_desc = game_data.get('short_description', '')
        header_image = game_data.get('header_image', '')
        
        metacritic = game_data.get('metacritic', {}).get('score')
        recommendations = game_data.get('recommendations', {}).get('total', 0)
        
        # Platforms
        platforms = game_data.get('platforms', {})
        platform_windows = platforms.get('windows', False)
        platform_mac = platforms.get('mac', False)
        platform_linux = platforms.get('linux', False)
        
        # JSON fields - convert to JSON strings
        genres = json.dumps(game_data.get('genres', []))
        publishers = json.dumps(game_data.get('publishers', []))
        developers = json.dumps(game_data.get('developers', []))
        
        # Insert or update
        cur.execute("""
            INSERT INTO games (
                app_id, name, short_description, header_image_url,
                release_date, metacritic_score, recommendation_count,
                platform_windows, platform_mac, platform_linux,
                genres, publishers, developers,
                added_at, last_updated
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT (app_id) DO UPDATE SET
                name = EXCLUDED.name,
                short_description = EXCLUDED.short_description,
                header_image_url = EXCLUDED.header_image_url,
                release_date = EXCLUDED.release_date,
                metacritic_score = EXCLUDED.metacritic_score,
                recommendation_count = EXCLUDED.recommendation_count,
                platform_windows = EXCLUDED.platform_windows,
                platform_mac = EXCLUDED.platform_mac,
                platform_linux = EXCLUDED.platform_linux,
                genres = EXCLUDED.genres,
                publishers = EXCLUDED.publishers,
                developers = EXCLUDED.developers,
                last_updated = CURRENT_TIMESTAMP
        """, (
            app_id, name, short_desc, header_image,
            release_date, metacritic, recommendations,
            platform_windows, platform_mac, platform_linux,
            genres, publishers, developers
        ))
        
        conn.commit()
        
    except Exception as e:
        print(f"❌ Error saving game details for App ID {app_id}: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def collect_prices(app_ids, currency='us'):
    """Collect prices for multiple games with progress tracking"""
    total_games = len(app_ids)
    print(f"\n🎮 Starting price collection for {total_games} games...")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")
    
    successful = 0
    failed = 0
    start_time = datetime.now()
    
    for idx, app_id in enumerate(app_ids, 1):
        print(f"[{idx}/{total_games}] Processing App ID {app_id}...", end=" ")
        
        game_data = get_steam_game_price(app_id, currency)
        if game_data:
            game_name = game_data.get('name', 'Unknown')
            
            # Save both game details and price
            save_price_to_db(app_id, game_data, currency)
            successful += 1
            
            # Print success info
            price_data = game_data.get('price_overview')
            if price_data:
                final_price = price_data.get('final', 0) / 100
                discount = price_data.get('discount_percent', 0)
                print(f"✓ {game_name} - ${final_price:.2f} ({discount}% off)")
            else:
                print(f"✓ {game_name} (Free to play)")
        else:
            failed += 1
            print(f"✗ Failed")
        
        # Progress summary every 50 games
        if idx % 50 == 0:
            elapsed = (datetime.now() - start_time).total_seconds()
            avg_time = elapsed / idx
            remaining = (total_games - idx) * avg_time
            
            print(f"\n{'─'*70}")
            print(f"📊 Progress: {idx}/{total_games} ({idx/total_games*100:.1f}%)")
            print(f"✅ Successful: {successful} | ❌ Failed: {failed}")
            print(f"⏱️  Avg time per game: {avg_time:.1f}s | Est. remaining: {remaining/60:.1f} min")
            print(f"{'─'*70}\n")
        
        # Wait between requests to avoid rate limiting
        time.sleep(3)
    
    # Final summary
    elapsed_total = (datetime.now() - start_time).total_seconds()
    print(f"\n{'='*70}")
    print(f"✅ COLLECTION COMPLETE")
    print(f"{'='*70}")
    print(f"Total games processed: {total_games}")
    print(f"Successful: {successful} ({successful/total_games*100:.1f}%)")
    print(f"Failed: {failed} ({failed/total_games*100:.1f}%)")
    print(f"Total time: {elapsed_total/60:.1f} minutes")
    print(f"Average: {elapsed_total/total_games:.1f} seconds per game")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    # Import the function to get tracked games
    try:
        from game_list_manager import get_tracked_game_ids
        games_to_track = get_tracked_game_ids()
    except Exception as e:
        print(f"❌ Could not load tracked games: {e}")
        print("Using fallback list...")
        games_to_track = [292030, 1091500, 271590]  # Fallback
    
    if not games_to_track:
        print("⚠️  No games to track. Run game_list_manager.py first.")
        sys.exit(0)
    
    print(f"📊 Tracking {len(games_to_track)} games")
    
    currency = os.getenv("CURRENCY", "us")
    collect_prices(games_to_track, currency)