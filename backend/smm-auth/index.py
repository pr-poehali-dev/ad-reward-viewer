import json, os, hashlib, secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Token, X-Requested-With",
    "Access-Control-Max-Age": "86400",
}

def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    """Регистрация и вход пользователей SMM-платформы"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor()

    # Регистрация
    if path.endswith("/register"):
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        role = body.get("role", "executor")
        avatar = body.get("avatar", "😊")

        if not email or not password or not name:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполни все поля"})}
        if role not in ("executor", "advertiser"):
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверная роль"})}

        cur.execute("SELECT id FROM smm_users WHERE email=%s", (email,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Email уже занят"})}

        cur.execute(
            "INSERT INTO smm_users (email, password_hash, name, role, avatar) VALUES (%s,%s,%s,%s,%s) RETURNING id, name, role, balance, avatar",
            (email, hash_password(password), name, role, avatar)
        )
        row = cur.fetchone()
        conn.commit()
        token = hashlib.sha256(f"{row[0]}{secrets.token_hex(8)}".encode()).hexdigest()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "token": f"{row[0]}:{token}", "id": row[0], "name": row[1], "role": row[2], "balance": float(row[3]), "avatar": row[4]
        })}

    # Вход
    if path.endswith("/login"):
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        cur.execute(
            "SELECT id, name, role, balance, avatar FROM smm_users WHERE email=%s AND password_hash=%s",
            (email, hash_password(password))
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}
        token = hashlib.sha256(f"{row[0]}{secrets.token_hex(8)}".encode()).hexdigest()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "token": f"{row[0]}:{token}", "id": row[0], "name": row[1], "role": row[2], "balance": float(row[3]), "avatar": row[4]
        })}

    # Получить профиль (по id из токена)
    if path.endswith("/me"):
        token = event.get("headers", {}).get("x-session-token", "")
        if not token or ":" not in token:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        user_id = token.split(":")[0]
        cur.execute("SELECT id, name, role, balance, avatar, email FROM smm_users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "id": row[0], "name": row[1], "role": row[2], "balance": float(row[3]), "avatar": row[4], "email": row[5]
        })}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}