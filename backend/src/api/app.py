from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
        print(f"Database connection failed: {e}")
        return None

def calculate_price_grade(current_price, historical_low, discount_percent):
    """Calculate price grade based on current price vs historical low and discount"""
    if current_price == 0:
        return "A+"
    
    if current_price <= historical_low:
        return "A+"
    
    price_ratio = current_price / historical_low if historical_low > 0 else 1
    
    if price_ratio <= 1.1:
        return "A"
    elif price_ratio <= 1.2:
        return "B+"
    elif price_ratio <= 1.3:
        return "B"
    elif price_ratio <= 1.5:
        return "C+"
    elif price_ratio <= 1.8:
        return "C"
    elif price_ratio <= 2.0:
        return "D"
    else:
        return "F"

def calculate_forecast(price_history):
    """Calculate price forecast based on recent price trends"""
    if len(price_history) < 2:
        return "stable"
    
    # Get last 7 days of prices
    recent_prices = sorted(price_history[-7:], key=lambda x: x['date'])
    
    if len(recent_prices) < 2:
        return "stable"
    
    first_price = recent_prices[0]['price']
    last_price = recent_prices[-1]['price']
    
    change_percent = ((last_price - first_price) / first_price) * 100
    
    if change_percent < -5:
        return "falling"
    elif change_percent > 5:
        return "rising"
    else:
        return "stable"

def parse_json_field(field):
    """Parse JSON field that might be a string or already a Python object"""
    if field is None:
        return []
    if isinstance(field, str):
        try:
            return json.loads(field)
        except (json.JSONDecodeError, TypeError):
            return []
    return field if isinstance(field, (list, dict)) else []

def transform_game_data(game_row, price_data, price_history_data):
    """Transform database row to frontend format"""
    app_id, name, short_description, header_image_url, release_date, metacritic_score, \
    recommendation_count, platform_windows, platform_mac, platform_linux, \
    genres, publishers, developers = game_row
    
    # Parse JSON fields - psycopg2 returns JSONB as Python objects, not strings
    genres_list = parse_json_field(genres)
    publishers_list = parse_json_field(publishers)
    developers_list = parse_json_field(developers)
    
    # Extract genre names
    genre_names = [g.get('description', '') for g in genres_list if isinstance(g, dict)] or \
                  [g for g in genres_list if isinstance(g, str)]
    
    # Calculate prices
    current_price = 0
    original_price = 0
    discount_percent = 0
    historical_low = 0
    
    if price_data:
        # price_data structure: (currency, initial_price, final_price, discount_percent, checked_at)
        current_price = price_data[2] / 100.0  # final_price in cents
        original_price = price_data[1] / 100.0  # initial_price in cents
        discount_percent = price_data[3] or 0
    
    # Calculate historical low from price history
    # price_history_data structure: (currency, initial_price, final_price, discount_percent, checked_at)
    if price_history_data:
        historical_low = min([p[2] / 100.0 for p in price_history_data if p[2]]) or current_price
    else:
        historical_low = current_price
    
    # Calculate price grade and forecast
    price_grade = calculate_price_grade(current_price, historical_low, discount_percent)
    forecast = calculate_forecast([
        {'date': p[4].isoformat() if p[4] else datetime.now().isoformat(), 'price': p[2] / 100.0}
        for p in price_history_data[-30:] if p[2]
    ]) if price_history_data else "stable"
    
    return {
        'id': str(app_id),
        'name': name or 'Unknown',
        'header_image': header_image_url or '',
        'release_date': release_date.isoformat() if release_date else None,
        'developers': developers_list,
        'publishers': publishers_list,
        'genres': genre_names,
        'platforms': {
            'windows': platform_windows or False,
            'mac': platform_mac or False,
            'linux': platform_linux or False
        },
        'current_price': current_price,
        'original_price': original_price,
        'discount_percent': discount_percent,
        'historical_low': historical_low,
        'price_grade': price_grade,
        'forecast': forecast,
        'short_description': short_description or '',
        'metacritic_score': metacritic_score,
        'recommendation_count': recommendation_count or 0
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

@app.route('/api/games', methods=['GET'])
def get_games():
    """Get all games with current prices"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Get query parameters
        search = request.args.get('search', '').lower()
        discount_min = request.args.get('discountMin', 0, type=int)
        price_min = request.args.get('priceMin', 0, type=float)
        price_max = request.args.get('priceMax', 1000, type=float)
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Build query
        query = """
            SELECT DISTINCT ON (g.app_id)
                g.app_id, g.name, g.short_description, g.header_image_url, g.release_date,
                g.metacritic_score, g.recommendation_count,
                g.platform_windows, g.platform_mac, g.platform_linux,
                g.genres, g.publishers, g.developers
            FROM games g
            LEFT JOIN price_history ph ON g.app_id = ph.app_id
            WHERE 1=1
        """
        params = []
        
        if search:
            query += " AND (LOWER(g.name) LIKE %s OR EXISTS (SELECT 1 FROM jsonb_array_elements(g.genres) AS genre WHERE LOWER(genre->>'description') LIKE %s))"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])
        
        query += """
            ORDER BY g.app_id, ph.checked_at DESC NULLS LAST
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        
        cur.execute(query, params)
        games = cur.fetchall()
        
        # Get current prices for each game
        result = []
        for game in games:
            app_id = game[0]
            
            # Get latest price
            cur.execute("""
                SELECT currency, initial_price, final_price, discount_percent, checked_at
                FROM price_history
                WHERE app_id = %s
                ORDER BY checked_at DESC
                LIMIT 1
            """, (app_id,))
            price_data = cur.fetchone()
            
            # Get price history for forecast
            cur.execute("""
                SELECT currency, initial_price, final_price, discount_percent, checked_at
                FROM price_history
                WHERE app_id = %s
                ORDER BY checked_at DESC
                LIMIT 30
            """, (app_id,))
            price_history_data = cur.fetchall()
            
            game_data = transform_game_data(game, price_data, price_history_data)
            
            # Apply filters
            if game_data['discount_percent'] < discount_min:
                continue
            if game_data['current_price'] < price_min:
                continue
            if game_data['current_price'] > price_max:
                continue
            
            result.append(game_data)
        
        cur.close()
        conn.close()
        
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<int:app_id>', methods=['GET'])
def get_game_details(app_id):
    """Get detailed information about a specific game"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Get game details
        cur.execute("""
            SELECT app_id, name, short_description, header_image_url, release_date,
                   metacritic_score, recommendation_count,
                   platform_windows, platform_mac, platform_linux,
                   genres, publishers, developers
            FROM games
            WHERE app_id = %s
        """, (app_id,))
        
        game = cur.fetchone()
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        # Get latest price
        cur.execute("""
            SELECT currency, initial_price, final_price, discount_percent, checked_at
            FROM price_history
            WHERE app_id = %s
            ORDER BY checked_at DESC
            LIMIT 1
        """, (app_id,))
        price_data = cur.fetchone()
        
        # Get price history
        cur.execute("""
            SELECT currency, initial_price, final_price, discount_percent, checked_at
            FROM price_history
            WHERE app_id = %s
            ORDER BY checked_at DESC
            LIMIT 90
        """, (app_id,))
        price_history_data = cur.fetchall()
        
        game_data = transform_game_data(game, price_data, price_history_data)
        
        cur.close()
        conn.close()
        
        return jsonify(game_data)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<int:app_id>/price-history', methods=['GET'])
def get_price_history(app_id):
    """Get price history for a specific game"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Get price history (last 90 days)
        cur.execute("""
            SELECT checked_at, final_price
            FROM price_history
            WHERE app_id = %s
            ORDER BY checked_at ASC
        """, (app_id,))
        
        history = cur.fetchall()
        
        result = [
            {
                'date': row[0].isoformat() if row[0] else datetime.now().isoformat(),
                'price': row[1] / 100.0 if row[1] else 0
            }
            for row in history
        ]
        
        cur.close()
        conn.close()
        
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/deals', methods=['GET'])
def get_deals():
    """Get games with deals (discounts)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Get games with current discounts
        cur.execute("""
            SELECT DISTINCT ON (g.app_id)
                g.app_id, g.name, g.short_description, g.header_image_url, g.release_date,
                g.metacritic_score, g.recommendation_count,
                g.platform_windows, g.platform_mac, g.platform_linux,
                g.genres, g.publishers, g.developers,
                ph.final_price, ph.initial_price, ph.discount_percent
            FROM games g
            INNER JOIN price_history ph ON g.app_id = ph.app_id
            WHERE ph.discount_percent > 0
            ORDER BY g.app_id, ph.checked_at DESC
        """)
        
        games = cur.fetchall()
        
        result = []
        for game in games:
            app_id = game[0]
            
            # Get price history
            cur.execute("""
                SELECT currency, initial_price, final_price, discount_percent, checked_at
                FROM price_history
                WHERE app_id = %s
                ORDER BY checked_at DESC
                LIMIT 30
            """, (app_id,))
            price_history_data = cur.fetchall()
            
            # Create price data tuple: (currency, initial_price, final_price, discount_percent, checked_at)
            # game[13] = final_price, game[14] = initial_price, game[15] = discount_percent
            price_data = (None, game[14], game[13], game[15], datetime.now())
            
            game_data = transform_game_data(game[:13], price_data, price_history_data)
            result.append(game_data)
        
        # Sort by discount percentage
        result.sort(key=lambda x: x['discount_percent'], reverse=True)
        
        cur.close()
        conn.close()
        
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

