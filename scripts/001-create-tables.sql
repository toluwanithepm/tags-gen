-- Create stop_words table
CREATE TABLE IF NOT EXISTS stop_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create domain_words table for agricultural terms with weights
CREATE TABLE IF NOT EXISTS domain_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(50) UNIQUE NOT NULL,
    weight INTEGER DEFAULT 5,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create generated_tags table to store tag history
CREATE TABLE IF NOT EXISTS generated_tags (
    id SERIAL PRIMARY KEY,
    field_id VARCHAR(100) NOT NULL,
    field_label TEXT NOT NULL,
    generated_tag VARCHAR(100) NOT NULL,
    final_tag VARCHAR(100),
    quality VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stop_words_word ON stop_words(word);
CREATE INDEX IF NOT EXISTS idx_domain_words_word ON domain_words(word);
CREATE INDEX IF NOT EXISTS idx_generated_tags_field_id ON generated_tags(field_id);
