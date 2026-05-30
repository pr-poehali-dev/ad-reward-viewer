
CREATE TABLE t_p13349061_ad_reward_viewer.users (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(128) UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    yoomoney_wallet VARCHAR(64),
    frikassa_wallet VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p13349061_ad_reward_viewer.withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p13349061_ad_reward_viewer.users(id),
    amount INTEGER NOT NULL,
    system VARCHAR(20) NOT NULL,
    wallet VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    external_id VARCHAR(256),
    created_at TIMESTAMP DEFAULT NOW()
);
