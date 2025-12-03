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

def get_steam_game_price(app_id, currency_code='us'):
    """
    Fetches the price and name of a Steam game in a specific currency.
    
    Args:
        app_id (int or str): The Steam App ID of the game.
        currency_code (str): The two-letter country code for the currency (e.g., 'us' for USD).
        
    Returns:
        dict: A dictionary containing the game's data, or None if the request fails.
    """
    url = (
        f"https://store.steampowered.com/api/appdetails"
        f"?appids={app_id}&cc={currency_code}"
    )
    
    try:
        response = requests.get(url, timeout=10)
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
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ An error occurred during the request: {e}")
        return None
    except (KeyError, json.JSONDecodeError) as e:
        print(f"❌ Could not parse data from the response: {e}")
        return None

def save_price_to_db(app_id, game_name, price_data, currency):
    """Save price data to the database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Insert or update game info
        cur.execute("""
            INSERT INTO games (app_id, name) 
            VALUES (%s, %s)
            ON CONFLICT (app_id) DO UPDATE SET name = EXCLUDED.name
        """, (app_id, game_name))
        
        # Insert price history
        if price_data:  # If game has price (not free-to-play)
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
            
            final_price = price_data.get('final', 0) / 100
            discount = price_data.get('discount_percent', 0)
            print(f"✓ Saved: {game_name} - ${final_price:.2f} ({discount}% off)")
        else:
            print(f"✓ Saved: {game_name} (Free to play)")
        
        conn.commit()
        
    except Exception as e:
        print(f"❌ Database error for {game_name}: {e}")
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
            price_data = game_data.get('price_overview')
            save_price_to_db(app_id, game_name, price_data, currency)
            successful += 1
            
            # Print success info
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
        time.sleep(1)
    
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