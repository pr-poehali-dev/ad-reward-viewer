CREATE TABLE IF NOT EXISTS t_p13349061_ad_reward_viewer.ad_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p13349061_ad_reward_viewer.users(id),
  coins_earned INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT now()
);
