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