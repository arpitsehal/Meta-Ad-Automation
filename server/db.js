const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'chemsroot.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Initialize Tables
    db.serialize(() => {
      // Settings Table (for API keys)
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        openai_key TEXT,
        meta_app_id TEXT,
        meta_app_secret TEXT,
        meta_access_token TEXT,
        meta_ad_account_id TEXT,
        meta_page_id TEXT
      )`);

      // Insert default row if it doesn't exist
      db.run(`INSERT OR IGNORE INTO settings (id, openai_key) VALUES (1, '')`);
      
      // Upgrade existing settings table if needed
      db.run(`ALTER TABLE settings ADD COLUMN meta_ad_account_id TEXT`, () => {});
      db.run(`ALTER TABLE settings ADD COLUMN meta_page_id TEXT`, () => {});

      // Campaigns Table (Drafts and Active)
      db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_audience TEXT,
        target_cities TEXT DEFAULT '[]',
        budget INTEGER,
        status TEXT DEFAULT 'draft',
        creative_id INTEGER DEFAULT NULL,
        meta_campaign_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add target_cities column if upgrading existing DB
      db.run(`ALTER TABLE campaigns ADD COLUMN target_cities TEXT DEFAULT '[]'`, () => {});
      db.run(`ALTER TABLE campaigns ADD COLUMN target_keywords TEXT DEFAULT '[]'`, () => {});
      db.run(`ALTER TABLE campaigns ADD COLUMN objective TEXT DEFAULT 'OUTCOME_TRAFFIC'`, () => {});
      db.run(`ALTER TABLE campaigns ADD COLUMN lead_gen_form_id TEXT DEFAULT NULL`, () => {});

      // Mock Analytics Data (For MVP viewing purposes)
      db.run(`CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER,
        date TEXT,
        spend REAL,
        reach INTEGER,
        cpc REAL
      )`);

      // Creatives Table (Manual Content)
      db.run(`CREATE TABLE IF NOT EXISTS creatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER,
        ad_type TEXT DEFAULT 'single',
        ad_name TEXT,
        headline TEXT,
        description TEXT,
        ad_copy TEXT,
        cta TEXT,
        image_url TEXT,
        slides_json TEXT DEFAULT NULL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add new columns if upgrading existing DB
      db.run(`ALTER TABLE creatives ADD COLUMN description TEXT`, () => {});
      db.run(`ALTER TABLE creatives ADD COLUMN image_url TEXT`, () => {});
      db.run(`ALTER TABLE creatives ADD COLUMN ad_name TEXT`, () => {});
      db.run(`ALTER TABLE creatives ADD COLUMN headline TEXT`, () => {});
      db.run(`ALTER TABLE creatives ADD COLUMN cta TEXT`, () => {});
      db.run(`ALTER TABLE creatives ADD COLUMN ad_type TEXT DEFAULT 'single'`, () => {});
      db.run(`ALTER TABLE creatives ADD COLUMN slides_json TEXT`, () => {});

      // Users Table (for Authentication)
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Seed default admin if it doesn't exist
      db.get(`SELECT id FROM users WHERE email = ?`, ['admin@chemsroot.com'], (err, row) => {
        if (!row) {
          db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, 
            ['admin@chemsroot.com', 'ads.chemsroot001', 'admin']
          );
        }
      });
    });
  }
});

module.exports = db;
