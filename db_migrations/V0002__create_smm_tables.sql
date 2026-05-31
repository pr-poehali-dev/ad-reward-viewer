CREATE TABLE smm_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(128) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  name VARCHAR(64) NOT NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('executor', 'advertiser')),
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  avatar VARCHAR(8) NOT NULL DEFAULT '😊',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE smm_tasks (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER NOT NULL REFERENCES smm_users(id),
  title VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  platform VARCHAR(32) NOT NULL,
  task_type VARCHAR(32) NOT NULL,
  link VARCHAR(512) NOT NULL,
  reward NUMERIC(8,2) NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 10,
  filled_slots INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done')),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE smm_executions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES smm_tasks(id),
  executor_id INTEGER NOT NULL REFERENCES smm_users(id),
  proof_url VARCHAR(512),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(task_id, executor_id)
);

CREATE TABLE smm_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES smm_users(id),
  amount NUMERIC(10,2) NOT NULL,
  type VARCHAR(32) NOT NULL,
  description VARCHAR(256),
  created_at TIMESTAMP DEFAULT now()
);
