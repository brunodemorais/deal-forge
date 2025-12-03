-- Games table to store basic game information
CREATE TABLE IF NOT EXISTS games (
    app_id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_id_checked ON price_history(app_id, checked_at);

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