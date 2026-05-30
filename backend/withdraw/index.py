import os
import json
import hashlib
import uuid
import urllib.request
import urllib.parse
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p13349061_ad_reward_viewer")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def yoomoney_payout(wallet: str, amount_rub: int, label: str) -> dict:
    """Выплата через ЮМани API (request-payment + process-payment)."""
    token = os.environ["YOOMONEY_TOKEN"]
    amount = str(amount_rub) + ".00"

    # Step 1: request-payment
    data = urllib.parse.urlencode({
        "pattern_id": "p2p",
        "to": wallet,
        "amount": amount,
        "comment": f"Вознаграждение за просмотр рекламы #{label}",
        "message": "Вознаграждение",
        "label": label,
    }).encode()

    req = urllib.request.Request(
        "https://yoomoney.ru/api/request-payment",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        rp = json.loads(resp.read())

    if rp.get("status") != "success":
        return {"ok": False, "error": rp.get("error", "request-payment failed")}

    request_id = rp["request_id"]

    # Step 2: process-payment
    data2 = urllib.parse.urlencode({
        "request_id": request_id,
    }).encode()

    req2 = urllib.request.Request(
        "https://yoomoney.ru/api/process-payment",
        data=data2,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(req2, timeout=15) as resp2:
        pp = json.loads(resp2.read())

    if pp.get("status") in ("success", "in_progress"):
        return {"ok": True, "external_id": pp.get("payment_id", request_id)}
    return {"ok": False, "error": pp.get("error", "process-payment failed")}


def frikassa_payout(wallet: str, amount_rub: int, order_id: str) -> dict:
    """Выплата через FreeKassa Payout API."""
    shop_id = os.environ["FRIKASSA_SHOP_ID"]
    secret = os.environ["FRIKASSA_SECRET_KEY"]

    sign_str = f"{shop_id}:{amount_rub}:{secret}:{order_id}"
    sign = hashlib.md5(sign_str.encode()).hexdigest()

    payload = json.dumps({
        "shopId": int(shop_id),
        "nonce": order_id,
        "currency": "RUB",
        "amount": str(amount_rub),
        "account": wallet,
        "sign": sign,
    }).encode()

    req = urllib.request.Request(
        "https://pay.freekassa.ru/api/withdrawals/create",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())

    if result.get("type") == "success":
        return {"ok": True, "external_id": str(result.get("data", {}).get("id", order_id))}
    return {"ok": False, "error": result.get("message", "frikassa payout failed")}


def handler(event: dict, context) -> dict:
    """Выплата вознаграждения пользователю через ЮМани или Фрикасса."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "method not allowed"})}

    body = json.loads(event.get("body") or "{}")
    device_id = event.get("headers", {}).get("X-Device-Id") or body.get("device_id", "")
    amount = int(body.get("amount", 0))
    system = body.get("system", "")  # "yoomoney" | "frikassa"
    wallet = body.get("wallet", "").strip()

    if not device_id or amount <= 0 or system not in ("yoomoney", "frikassa") or not wallet:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "invalid params"})}

    conn = get_conn()
    cur = conn.cursor()

    # Получаем или создаём пользователя
    cur.execute(f"SELECT id, balance FROM {SCHEMA}.users WHERE device_id = %s", (device_id,))
    row = cur.fetchone()
    if not row:
        return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "user not found"})}

    user_id, balance = row

    if balance < amount:
        conn.close()
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "insufficient balance"})}

    order_id = str(uuid.uuid4())[:16].replace("-", "")

    # Выполняем выплату
    if system == "yoomoney":
        result = yoomoney_payout(wallet, amount, order_id)
    else:
        result = frikassa_payout(wallet, amount, order_id)

    status = "success" if result["ok"] else "failed"
    external_id = result.get("external_id", "")

    # Сохраняем в БД
    if result["ok"]:
        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s",
            (amount, user_id),
        )

    cur.execute(
        f"""INSERT INTO {SCHEMA}.withdrawals (user_id, amount, system, wallet, status, external_id)
            VALUES (%s, %s, %s, %s, %s, %s)""",
        (user_id, amount, system, wallet, status, external_id),
    )
    conn.commit()
    conn.close()

    if result["ok"]:
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True, "new_balance": balance - amount})}
    return {"statusCode": 502, "headers": cors, "body": json.dumps({"ok": False, "error": result.get("error")})}
