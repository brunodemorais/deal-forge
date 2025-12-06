from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from bcrypt import gensalt, hashpw
import bcrypt
import jwt
from functools import wraps
SECRET_KEY = os.getenv('JWT_SECRET', 'your-secret-key')

load_dotenv()

app = Flask(__name__)
# Enable CORS for the application, allowing requests from your frontend's URL
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/auth/*": {"origins": "*"}}) 

# Explanation: This explicitly ensures that CORS headers are applied to
# all routes starting with /api/ AND all routes starting with /auth/

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

def transform_game_data_from_row(row):
    """Transform database row from optimized query to frontend format"""
    (app_id, name, short_description, header_image_url, release_date, metacritic_score,
     recommendation_count, platform_windows, platform_mac, platform_linux,
     genres, publishers, developers, currency, initial_price, final_price, 
     discount_percent, checked_at, lowest_price) = row
    
    # Parse JSON fields
    genres_list = parse_json_field(genres)
    publishers_list = parse_json_field(publishers)
    developers_list = parse_json_field(developers)
    
    # Extract genre names
    genre_names = [g.get('description', '') for g in genres_list if isinstance(g, dict)] or \
                  [g for g in genres_list if isinstance(g, str)]
    
    # Calculate prices
    current_price = (final_price / 100.0) if final_price else 0
    original_price = (initial_price / 100.0) if initial_price else 0
    discount_percent_val = discount_percent or 0
    historical_low = (lowest_price / 100.0) if lowest_price else current_price
    
    # Calculate price grade (forecast removed from list view for performance)
    price_grade = calculate_price_grade(current_price, historical_low, discount_percent_val)
    
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
        'discount_percent': discount_percent_val,
        'historical_low': historical_low,
        'price_grade': price_grade,
        'forecast': 'stable',  # Default for list view, calculate on detail page
        'short_description': short_description or '',
        'metacritic_score': metacritic_score,
        'recommendation_count': recommendation_count or 0
    }

def dict_fetch_all(cursor):
    """Return all rows from a cursor as a list of dicts"""
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

@app.route('/api/games', methods=['GET'])
def get_games():
    """Get all games with current prices and pagination - OPTIMIZED VERSION"""
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
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('perPage', 24, type=int)
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Convert prices to cents for database comparison
        price_min_cents = int(price_min * 100)
        price_max_cents = int(price_max * 100)
        
        # Build the optimized query with CTEs
        query = """
            WITH latest_prices AS (
                SELECT DISTINCT ON (app_id)
                    app_id,
                    currency,
                    initial_price,
                    final_price,
                    discount_percent,
                    checked_at
                FROM price_history
                ORDER BY app_id, checked_at DESC
            ),
            historical_lows AS (
                SELECT 
                    app_id,
                    MIN(final_price) as lowest_price
                FROM price_history
                WHERE checked_at >= NOW() - INTERVAL '90 days'
                GROUP BY app_id
            )
            SELECT 
                g.app_id, g.name, g.short_description, g.header_image_url, g.release_date,
                g.metacritic_score, g.recommendation_count,
                g.platform_windows, g.platform_mac, g.platform_linux,
                g.genres, g.publishers, g.developers,
                lp.currency, lp.initial_price, lp.final_price, lp.discount_percent, lp.checked_at,
                hl.lowest_price
            FROM games g
            LEFT JOIN latest_prices lp ON g.app_id = lp.app_id
            LEFT JOIN historical_lows hl ON g.app_id = hl.app_id
            WHERE 1=1
        """
        
        params = []
        
        # Apply filters
        if discount_min > 0:
            query += " AND COALESCE(lp.discount_percent, 0) >= %s"
            params.append(discount_min)
        
        if price_min > 0:
            query += " AND COALESCE(lp.final_price, 0) >= %s"
            params.append(price_min_cents)
        
        if price_max < 1000:
            query += " AND (lp.final_price <= %s OR lp.final_price IS NULL)"
            params.append(price_max_cents)
        
        if search:
            query += """ AND (
                LOWER(g.name) LIKE %s 
                OR EXISTS (
                    SELECT 1 
                    FROM jsonb_array_elements(g.genres) AS genre 
                    WHERE LOWER(genre->>'description') LIKE %s
                )
            )"""
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])
        
        # Get total count with same filters
        count_query = f"SELECT COUNT(*) FROM ({query}) as filtered_games"
        cur.execute(count_query, params)
        total_items = cur.fetchone()[0]
        
        # Add ordering and pagination
        query += " ORDER BY g.app_id LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        # Execute main query
        cur.execute(query, params)
        games = cur.fetchall()
        
        # Transform results
        result = [transform_game_data_from_row(game) for game in games]
        
        # Calculate pagination metadata
        total_pages = (total_items + per_page - 1) // per_page if total_items > 0 else 1
        
        cur.close()
        conn.close()
        
        return jsonify({
            'games': result,
            'pagination': {
                'page': page,
                'perPage': per_page,
                'totalItems': total_items,
                'totalPages': total_pages,
                'hasNext': page < total_pages,
                'hasPrev': page > 1
            }
        })
    
    except Exception as e:
        if conn:
            conn.close()
        print(f"Error in get_games: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<int:app_id>', methods=['GET'])
def get_game_details(app_id):
    """Get detailed information about a specific game with forecast calculation"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Use optimized query for single game
        query = """
            WITH latest_price AS (
                SELECT DISTINCT ON (app_id)
                    app_id,
                    currency,
                    initial_price,
                    final_price,
                    discount_percent,
                    checked_at
                FROM price_history
                WHERE app_id = %s
                ORDER BY app_id, checked_at DESC
                LIMIT 1
            ),
            historical_low AS (
                SELECT 
                    app_id,
                    MIN(final_price) as lowest_price
                FROM price_history
                WHERE app_id = %s
                    AND checked_at >= NOW() - INTERVAL '90 days'
                GROUP BY app_id
            ),
            price_history_30d AS (
                SELECT 
                    checked_at,
                    final_price
                FROM price_history
                WHERE app_id = %s
                ORDER BY checked_at DESC
                LIMIT 30
            )
            SELECT 
                g.app_id, g.name, g.short_description, g.header_image_url, g.release_date,
                g.metacritic_score, g.recommendation_count,
                g.platform_windows, g.platform_mac, g.platform_linux,
                g.genres, g.publishers, g.developers,
                lp.currency, lp.initial_price, lp.final_price, lp.discount_percent, lp.checked_at,
                hl.lowest_price,
                COALESCE(
                    json_agg(
                        json_build_object('date', ph.checked_at, 'price', ph.final_price)
                        ORDER BY ph.checked_at DESC
                    ) FILTER (WHERE ph.checked_at IS NOT NULL),
                    '[]'::json
                ) as price_history
            FROM games g
            LEFT JOIN latest_price lp ON g.app_id = lp.app_id
            LEFT JOIN historical_low hl ON g.app_id = hl.app_id
            LEFT JOIN price_history_30d ph ON g.app_id = %s
            WHERE g.app_id = %s
            GROUP BY g.app_id, g.name, g.short_description, g.header_image_url, g.release_date,
                     g.metacritic_score, g.recommendation_count, g.platform_windows, g.platform_mac, 
                     g.platform_linux, g.genres, g.publishers, g.developers,
                     lp.currency, lp.initial_price, lp.final_price, lp.discount_percent, 
                     lp.checked_at, hl.lowest_price
        """
        
        cur.execute(query, (app_id, app_id, app_id, app_id, app_id))
        game = cur.fetchone()
        
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        # Extract price history from the row
        price_history_json = game[19] if len(game) > 19 else []
        
        # Transform main game data
        game_data = transform_game_data_from_row(game[:19])
        
        # Calculate forecast from price history
        if price_history_json and len(price_history_json) >= 2:
            # Sort by date and get last 7 days
            recent_prices = sorted(price_history_json[-7:], key=lambda x: x['date'])
            
            if len(recent_prices) >= 2:
                first_price = recent_prices[0]['price'] / 100.0
                last_price = recent_prices[-1]['price'] / 100.0
                
                if first_price > 0:
                    change_percent = ((last_price - first_price) / first_price) * 100
                    
                    if change_percent < -5:
                        game_data['forecast'] = "falling"
                    elif change_percent > 5:
                        game_data['forecast'] = "rising"
                    else:
                        game_data['forecast'] = "stable"
        
        cur.close()
        conn.close()
        
        return jsonify(game_data)
    
    except Exception as e:
        if conn:
            conn.close()
        print(f"Error in get_game_details: {e}")
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
    """Get games with deals (discounts) - OPTIMIZED VERSION"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Optimized query for deals
        query = """
            WITH latest_prices AS (
                SELECT DISTINCT ON (app_id)
                    app_id,
                    currency,
                    initial_price,
                    final_price,
                    discount_percent,
                    checked_at
                FROM price_history
                WHERE discount_percent > 0
                ORDER BY app_id, checked_at DESC
            ),
            historical_lows AS (
                SELECT 
                    app_id,
                    MIN(final_price) as lowest_price
                FROM price_history
                WHERE checked_at >= NOW() - INTERVAL '90 days'
                GROUP BY app_id
            )
            SELECT 
                g.app_id, g.name, g.short_description, g.header_image_url, g.release_date,
                g.metacritic_score, g.recommendation_count,
                g.platform_windows, g.platform_mac, g.platform_linux,
                g.genres, g.publishers, g.developers,
                lp.currency, lp.initial_price, lp.final_price, lp.discount_percent, lp.checked_at,
                hl.lowest_price
            FROM games g
            INNER JOIN latest_prices lp ON g.app_id = lp.app_id
            LEFT JOIN historical_lows hl ON g.app_id = hl.app_id
            ORDER BY lp.discount_percent DESC
        """
        
        cur.execute(query)
        games = cur.fetchall()
        
        # Transform results
        result = [transform_game_data_from_row(game) for game in games]
        
        cur.close()
        conn.close()
        
        return jsonify(result)
    
    except Exception as e:
        if conn:
            conn.close()
        print(f"Error in get_deals: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password or '@' not in email or len(password) < 6:
        return jsonify({'error': 'Invalid email or password'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cur = conn.cursor()
    try:
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Insert new user
        cur.execute(
            """
            INSERT INTO users (email, password_hash, created_at)
            VALUES (%s, %s, NOW()) RETURNING id
            """,
            (email, hashed_pw)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({'success': True, 'user_id': user_id, 'email': email}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Invalid email or password'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'User not found or incorrect password'}), 401
        user_id, password_hash = user
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            return jsonify({'error': 'User not found or incorrect password'}), 401
        # Issue JWT
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return jsonify({'token': token, 'user_id': user_id, 'email': email})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

def decode_jwt_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid Authorization header'}), 401
    token = auth_header.split(' ', 1)[1]
    payload = decode_jwt_token(token)
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    user_id = payload.get('user_id')
    email = payload.get('email')
    return jsonify({'user_id': user_id, 'email': email})

def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        token = auth_header.split(' ', 1)[1]
        payload = decode_jwt_token(token)
        if not payload or 'user_id' not in payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        request.user_id = payload['user_id']
        return f(*args, **kwargs)
    return wrapper

@app.route('/api/watchlist', methods=['GET'])
@auth_required
def get_watchlist():
    """Retrieves the full watchlist for the authenticated user with the latest game price details."""
    user_id = request.user_id
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cur = conn.cursor()
    try:
        # Use a Common Table Expression (CTE) to efficiently find the LATEST price 
        # for every game (using PostgreSQL's DISTINCT ON).
        cur.execute("""
            WITH latest_prices AS (
                SELECT DISTINCT ON (app_id)
                    app_id, final_price, discount_percent, initial_price
                FROM price_history
                ORDER BY app_id, checked_at DESC
            )
            SELECT 
                g.app_id, g.name, g.header_image_url, 
                lp.final_price, lp.discount_percent, lp.initial_price,
                w.added_at
            FROM watchlist w
            JOIN games g ON w.app_id = g.app_id
            -- Join with the latest price data (lp) instead of the game table (g) for prices
            JOIN latest_prices lp ON w.app_id = lp.app_id
            WHERE w.user_id = %s
            ORDER BY w.added_at DESC;
        """, (user_id,))
        
        # NOTE: Make sure the dict_fetch_all helper function is still defined globally
        watchlist_games = dict_fetch_all(cur)
        
        # Convert datetime objects to ISO strings for JSON serialization
        for game in watchlist_games:
            if 'added_at' in game and game['added_at']:
                game['added_at'] = game['added_at'].isoformat()
        
        # Return an object with the 'games' key, which the frontend expects
        return jsonify({'games': watchlist_games}), 200 
        
    except Exception as e:
        print(f"Error fetching watchlist for user {user_id}: {e}")
        # Return an empty array wrapped in the expected format on error
        # NOTE: If the user has games on their watchlist that DO NOT have price_history, they will be excluded.
        return jsonify({'games': []}), 200 
    finally:
        cur.close()
        conn.close()

@app.route('/api/watchlist', methods=['POST'])
@auth_required
def add_to_watchlist():
    user_id = request.user_id
    data = request.get_json()
    app_id = data.get('app_id')
    if not app_id:
        return jsonify({'error': 'app_id is required'}), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cur = conn.cursor()
    try:
        # Prevent duplicates
        cur.execute("SELECT 1 FROM watchlist WHERE user_id = %s AND app_id = %s", (user_id, app_id))
        if cur.fetchone():
            return jsonify({'error': 'Game already in watchlist'}), 409
        cur.execute(
            "INSERT INTO watchlist (user_id, app_id, added_at) VALUES (%s, %s, NOW())",
            (user_id, app_id)
        )
        conn.commit()
        return jsonify({'success': True, 'app_id': app_id})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/watchlist/<int:app_id>', methods=['DELETE'])
@auth_required
def remove_from_watchlist(app_id):
    user_id = request.user_id
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM watchlist WHERE user_id = %s AND app_id = %s", (user_id, app_id))
        conn.commit()
        return jsonify({'success': True, 'app_id': app_id})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)