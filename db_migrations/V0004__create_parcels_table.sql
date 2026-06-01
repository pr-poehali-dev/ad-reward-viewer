CREATE TABLE IF NOT EXISTS t_p13349061_ad_reward_viewer.parcels (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(128) NOT NULL,
  track_number VARCHAR(128) NOT NULL,
  title VARCHAR(128) NOT NULL DEFAULT '',
  carrier VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'unknown',
  status_text VARCHAR(256) NOT NULL DEFAULT 'Ожидание данных',
  last_event VARCHAR(512) NOT NULL DEFAULT '',
  last_update TIMESTAMP DEFAULT now(),
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  raw_events JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parcels_device_id_idx ON t_p13349061_ad_reward_viewer.parcels(device_id);
