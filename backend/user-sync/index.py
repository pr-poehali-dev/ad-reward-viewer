import os
import json
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p13349061_ad_reward_viewer")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Синхронизация профиля пользователя: получить/создать, обновить баланс и реквизиты."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body = json.loads(event.get("body") or "{}")
    device_id = event.get("headers", {}).get("X-Device-Id") or body.get("device_id", "")

    if not device_id:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "device_id required"})}

    conn = get_conn()
    cur = conn.cursor()
    method = event.get("httpMethod", "GET")

    if method == "GET":
        cur.execute(
            f"SELECT id, balance, yoomoney_wallet, frikassa_wallet FROM {SCHEMA}.users WHERE device_id = %s",
            (device_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (device_id) VALUES (%s) RETURNING id, balance, yoomoney_wallet, frikassa_wallet",
                (device_id,),
            )
            row = cur.fetchone()
            conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({
                "id": row[0],
                "balance": row[1],
                "yoomoney_wallet": row[2] or "",
                "frikassa_wallet": row[3] or "",
            }),
        }

    if method == "POST":
        action = body.get("action")

        if action == "update_profile":
            yoomoney = body.get("yoomoney_wallet", "")
            frikassa = body.get("frikassa_wallet", "")
            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (device_id, yoomoney_wallet, frikassa_wallet)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (device_id) DO UPDATE
                    SET yoomoney_wallet = EXCLUDED.yoomoney_wallet,
                        frikassa_wallet = EXCLUDED.frikassa_wallet""",
                (device_id, yoomoney, frikassa),
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

        if action == "add_balance":
            amount = int(body.get("amount", 0))
            if amount <= 0:
                conn.close()
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "invalid amount"})}
            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (device_id, balance)
                    VALUES (%s, %s)
                    ON CONFLICT (device_id) DO UPDATE
                    SET balance = {SCHEMA}.users.balance + EXCLUDED.balance
                    RETURNING balance""",
                (device_id, amount),
            )
            new_balance = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True, "balance": new_balance})}

    conn.close()
    return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "unknown action"})}
