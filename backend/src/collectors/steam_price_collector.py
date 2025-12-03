import requests
import json
import psycopg2
from datetime import datetime
import os
import sys
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
    """Fetches the price of a Steam game in a specific currency."""
    url = (
        f"https://store.steampowered.com/api/appdetails"
        f"?appids={app_id}&cc={currency_code}&filters=price_overview,name"
    )
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data and data[str(app_id)]['success']:
            return data[str(app_id)]['data']
        else:
            print(f"⚠️  No data available for App ID {app_id}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"⚠️  Timeout fetching data for App ID {app_id}")
        return None
    except Exception as e:
        print(f"❌ Error fetching data for {app_id}: {e}")
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
    """Collect prices for multiple games"""
    print(f"\n🎮 Starting price collection for {len(app_ids)} games...")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    successful = 0
    failed = 0
    
    for app_id in app_ids:
        game_data = get_steam_game_price(app_id, currency)
        if game_data:
            game_name = game_data.get('name', 'Unknown')
            price_data = game_data.get('price_overview')
            save_price_to_db(app_id, game_name, price_data, currency)
            successful += 1
        else:
            failed += 1
    
    print(f"\n✅ Complete: {successful} successful, {failed} failed")

if __name__ == "__main__":
    # List of game App IDs you want to track
    games_to_track = [
        292030,   # The Witcher 3: Wild Hunt
        1091500,  # Cyberpunk 2077
        271590,   # Grand Theft Auto V
        570,      # Dota 2 (free)
        730,      # Counter-Strike 2 (free)
        # Add more game IDs here
    ]
    
    # You can also specify currency
    currency = os.getenv("CURRENCY", "us")
    
    collect_prices(games_to_track, currency)