import requests
from bs4 import BeautifulSoup
import psycopg2
import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv

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

def get_steam_game_details(app_id):
    """Check if a game is free-to-play"""
    url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data and data[str(app_id)]['success']:
            game_data = data[str(app_id)]['data']
            is_free = game_data.get('is_free', False)
            name = game_data.get('name', 'Unknown')
            return {'is_free': is_free, 'name': name}
        return None
    except Exception as e:
        print(f"⚠️  Error checking App ID {app_id}: {e}")
        return None

def scrape_top_games(max_pages=10):
    """
    Scrape Steam's top sellers to get approximately top 1000 games.
    Each page has ~25 games, so 40 pages = ~1000 games
    """
    print(f"\n🔍 Scraping Steam's top sellers (up to {max_pages * 25} games)...")
    
    all_app_ids = []
    
    for page in range(1, max_pages + 1):
        url = f"https://store.steampowered.com/search/?filter=topsellers&page={page}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            games = soup.find_all('a', {'class': 'search_result_row'})
            
            if not games:
                print(f"⚠️  No games found on page {page}, stopping...")
                break
            
            for game in games:
                app_id = game.get('data-ds-appid')
                if app_id:
                    all_app_ids.append(int(app_id))
            
            print(f"✓ Page {page}/{max_pages}: Found {len(games)} games (Total: {len(all_app_ids)})")
            
            # Be nice to Steam's servers
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ Error on page {page}: {e}")
            continue
    
    # Remove duplicates while preserving order
    seen = set()
    unique_app_ids = []
    for app_id in all_app_ids:
        if app_id not in seen:
            seen.add(app_id)
            unique_app_ids.append(app_id)
    
    print(f"\n✅ Scraped {len(unique_app_ids)} unique games")
    return unique_app_ids

def filter_and_add_games(app_ids):
    """
    Check each game to see if it's free-to-play and add to tracking list.
    Only adds non-free games.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    added_count = 0
    skipped_free = 0
    already_tracked = 0
    failed_count = 0
    
    print(f"\n🎮 Processing {len(app_ids)} games...")
    print("This will take a while (checking each game individually)...\n")
    
    for idx, app_id in enumerate(app_ids, 1):
        # Check if already in tracking list
        cur.execute("SELECT app_id, is_free_to_play FROM games_to_track WHERE app_id = %s", (app_id,))
        existing = cur.fetchone()
        
        if existing:
            # Update last_seen_in_top timestamp
            cur.execute("""
                UPDATE games_to_track 
                SET last_seen_in_top = CURRENT_TIMESTAMP 
                WHERE app_id = %s
            """, (app_id,))
            already_tracked += 1
            
            if idx % 50 == 0:
                print(f"Progress: {idx}/{len(app_ids)} - Already tracking: {already_tracked}, New: {added_count}, Skipped (free): {skipped_free}")
            continue
        
        # Get game details from Steam API
        details = get_steam_game_details(app_id)
        
        if details is None:
            failed_count += 1
            continue
        
        # Skip free-to-play games
        if details['is_free']:
            skipped_free += 1
            print(f"⊗ Skipping {details['name']} (App ID: {app_id}) - Free to play")
            continue
        
        # Add to tracking list
        try:
            cur.execute("""
                INSERT INTO games_to_track (app_id, source, is_free_to_play, status)
                VALUES (%s, 'top_sellers', %s, 'active')
                ON CONFLICT (app_id) DO UPDATE 
                SET last_seen_in_top = CURRENT_TIMESTAMP
            """, (app_id, details['is_free']))
            
            # Add basic info to games table (full details will be collected by price collector)
            cur.execute("""
                INSERT INTO games (app_id, name, last_updated)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (app_id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    last_updated = CURRENT_TIMESTAMP
            """, (app_id, details['name']))
            
            conn.commit()
            added_count += 1
            print(f"✓ Added: {details['name']} (App ID: {app_id})")
            
        except Exception as e:
            print(f"❌ Error adding App ID {app_id}: {e}")
            conn.rollback()
            failed_count += 1
        
        # Progress update every 50 games
        if idx % 50 == 0:
            print(f"\n--- Progress: {idx}/{len(app_ids)} ---")
            print(f"Added: {added_count} | Already tracked: {already_tracked} | Skipped (free): {skipped_free} | Failed: {failed_count}\n")
        
        # Rate limiting - be nice to Steam's API
        time.sleep(1.5)
    
    cur.close()
    conn.close()
    
    print(f"\n{'='*60}")
    print(f"✅ SUMMARY")
    print(f"{'='*60}")
    print(f"Total processed: {len(app_ids)}")
    print(f"New games added: {added_count}")
    print(f"Already tracked (updated): {already_tracked}")
    print(f"Skipped (free-to-play): {skipped_free}")
    print(f"Failed: {failed_count}")
    print(f"{'='*60}")

def get_tracked_games_count():
    """Get statistics about tracked games"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT COUNT(*) FROM games_to_track WHERE status = 'active' AND is_free_to_play = FALSE")
        active_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM games_to_track")
        total_count = cur.fetchone()[0]
        
        return {'active': active_count, 'total': total_count}
    finally:
        cur.close()
        conn.close()

def get_tracked_game_ids():
    """Get list of active non-free game IDs to track"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT app_id 
            FROM games_to_track 
            WHERE status = 'active' AND is_free_to_play = FALSE
            ORDER BY added_at
        """)
        app_ids = [row[0] for row in cur.fetchall()]
        return app_ids
    except Exception as e:
        print(f"❌ Error fetching tracked games: {e}")
        return []
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("🎮 Steam Game List Manager")
    print("="*60)
    
    # Show current stats
    stats = get_tracked_games_count()
    print(f"Currently tracking: {stats['active']} active games (of {stats['total']} total)")
    
    # Scrape top games from Steam (40 pages ≈ 1000 games)
    app_ids = scrape_top_games(max_pages=40)
    
    if not app_ids:
        print("❌ No games found. Exiting.")
        sys.exit(1)
    
    # Filter and add non-free games
    filter_and_add_games(app_ids)
    
    # Show final stats
    final_stats = get_tracked_games_count()
    print(f"\n🎯 Now tracking: {final_stats['active']} active non-free games")