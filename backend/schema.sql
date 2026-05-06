-- SKILLX PostgreSQL Schema
-- Run this file to set up the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  otp VARCHAR(6),
  otp_expiry TIMESTAMP,
  name VARCHAR(100) DEFAULT 'User',
  trust_score FLOAT DEFAULT 0.3,
  credits FLOAT DEFAULT 5.0,
  is_flagged BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Make maiticmaitic@gmail.com an admin if the user already exists
UPDATE users SET role = 'admin' WHERE email = 'maiticmaitic@gmail.com';

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Other',
  hours_required FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table (escrow-based)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE SET NULL,
  receiver_id INT REFERENCES users(id) ON DELETE SET NULL,
  skill_id INT REFERENCES skills(id) ON DELETE SET NULL,
  credits FLOAT NOT NULL,
  status VARCHAR(20) DEFAULT 'escrow',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_minutes INT,
  status VARCHAR(20) DEFAULT 'active'
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  from_user INT REFERENCES users(id) ON DELETE CASCADE,
  to_user INT REFERENCES users(id) ON DELETE CASCADE,
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
  raised_by INT REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status VARCHAR(20) DEFAULT 'open',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Videos table (with strict constraints)
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  description TEXT,

  category VARCHAR(20) NOT NULL CHECK (category IN ('coding','music','marketing')),
  subcategory VARCHAR(50) NOT NULL,

  cloudinary_url TEXT NOT NULL,
  cloudinary_id TEXT NOT NULL,

  status VARCHAR(20) CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT NOW(),

  CHECK (
    (category = 'coding' AND subcategory IN ('web','dsa','ai')) OR
    (category = 'music' AND subcategory IN ('singing','instrument','production')) OR
    (category = 'marketing' AND subcategory IN ('seo','branding','ads'))
  )
);

-- Video Access table
CREATE TABLE IF NOT EXISTS video_access (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  video_id INT REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, video_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_sessions_transaction ON sessions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON ratings(to_user);
CREATE INDEX IF NOT EXISTS idx_disputes_transaction ON disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

-- Video Ratings table
CREATE TABLE IF NOT EXISTS video_ratings (
  id SERIAL PRIMARY KEY,
  video_id INT REFERENCES videos(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video Disputes table
CREATE TABLE IF NOT EXISTS video_disputes (
  id SERIAL PRIMARY KEY,
  video_id INT REFERENCES videos(id) ON DELETE CASCADE,
  raised_by INT REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status VARCHAR(20) DEFAULT 'open',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for new video tables
CREATE INDEX IF NOT EXISTS idx_video_ratings_video ON video_ratings(video_id);
CREATE INDEX IF NOT EXISTS idx_video_disputes_video ON video_disputes(video_id);
