-- Enhanced games table with high-value fields
CREATE TABLE IF NOT EXISTS games (
    app_id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    short_description TEXT,
    header_image_url TEXT,
    release_date DATE,
    metacritic_score INTEGER,
    recommendation_count INTEGER,
    
    -- Platform support
    platform_windows BOOLEAN DEFAULT FALSE,
    platform_mac BOOLEAN DEFAULT FALSE,
    platform_linux BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Store as JSON for flexibility
    genres JSONB,
    publishers JSONB,
    developers JSONB
);

-- Price history table to track prices over time
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES games(app_id),
    currency VARCHAR(10),
    initial_price INTEGER,
    final_price INTEGER,
    discount_percent INTEGER,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes AFTER tables are created
CREATE INDEX IF NOT EXISTS idx_app_id_checked ON price_history(app_id, checked_at);
CREATE INDEX IF NOT EXISTS idx_games_release_date ON games(release_date);
CREATE INDEX IF NOT EXISTS idx_games_metacritic_score ON games(metacritic_score);
CREATE INDEX IF NOT EXISTS idx_games_recommendation_count ON games(recommendation_count);
CREATE INDEX IF NOT EXISTS idx_games_genres ON games USING GIN (genres);

-- Table to track which games we're monitoring
CREATE TABLE IF NOT EXISTS games_to_track (
    app_id INTEGER PRIMARY KEY,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_in_top TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50),
    is_free_to_play BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' -- active, failed, removed
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_status ON games_to_track(status);
CREATE INDEX IF NOT EXISTS idx_free_to_play ON games_to_track(is_free_to_play);


-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    app_id INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);