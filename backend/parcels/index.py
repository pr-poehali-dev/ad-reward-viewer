import json, os, re, urllib.request, urllib.parse
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p13349061_ad_reward_viewer")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_device(event):
    return (event.get("headers") or {}).get("x-device-id") or (event.get("headers") or {}).get("X-Device-Id") or ""

# ── Определение перевозчика по трек-номеру ──
def detect_carrier(track: str) -> str:
    t = track.upper().strip()
    if re.match(r'^[A-Z]{2}\d{9}[A-Z]{2}$', t):
        return "pochta"
    if re.match(r'^(LO|LP|LE|LX|RR|RA|RB|RC|RE|RF|RG|RH|RI|RJ|RK|RL|RM|RN|RP|RQ|RS|RT|RU|RV|RW|RX|RY|RZ|CP|CX|EA|EB|EC|ED|EE|EF|EG|EH|EI|EJ|EK|EL|EM|EN|EP|EQ|ER|ES|ET|EU|EV|EW|EX|EY|EZ)\d{9}[A-Z]{2}$', t):
        return "pochta"
    if re.match(r'^(CNBJ|CNGD|CNSH|CNJB|CN)\d+', t) or re.match(r'^\d{20,22}$', t):
        return "cainiao"
    if re.match(r'^(AE|AEA|AEAJ)\d+', t) or re.match(r'^[A-Z0-9]{10,20}$', t) and len(t) == 14:
        return "aliexpress"
    if re.match(r'^\d{10,14}$', t):
        return "sdek"
    if re.match(r'^WB\d+$', t) or re.match(r'^\d{15,16}$', t):
        return "wildberries"
    if re.match(r'^\d{16}$', t):
        return "ozon"
    return "universal"

CARRIER_NAMES = {
    "pochta": "Почта России",
    "cainiao": "Cainiao / AliExpress",
    "aliexpress": "AliExpress",
    "sdek": "СДЭК",
    "wildberries": "Wildberries",
    "ozon": "Ozon",
    "universal": "Универсальный",
}

# ── Трекинг через track24.ru API (бесплатный, без ключа) ──
def track_package(track: str, carrier: str) -> dict:
    try:
        url = f"https://track24.ru/api/?track={urllib.parse.quote(track)}&lang=ru"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        
        if not data or data.get("error"):
            return _fallback_status(track, carrier)

        checkpoints = data.get("checkpoints") or data.get("events") or []
        if not checkpoints:
            return _fallback_status(track, carrier)

        events = []
        for cp in checkpoints[:10]:
            events.append({
                "date": cp.get("date") or cp.get("time") or "",
                "location": cp.get("location") or cp.get("city") or "",
                "description": cp.get("status") or cp.get("description") or "",
            })

        last = events[0] if events else {}
        status_text = last.get("description", "В пути")
        is_delivered = any(w in status_text.lower() for w in ["вручен", "доставлен", "получен", "delivered"])
        status = "delivered" if is_delivered else ("in_transit" if events else "unknown")

        return {
            "ok": True,
            "status": status,
            "status_text": status_text,
            "last_event": f"{last.get('date','')} — {last.get('location','')} — {status_text}".strip(" —"),
            "events": events,
        }
    except Exception as e:
        return _fallback_status(track, carrier)

# ── Трекинг через 17track API как запасной ──
def _fallback_status(track: str, carrier: str) -> dict:
    try:
        # Публичный endpoint 17track
        payload = json.dumps([{"num": track}]).encode()
        req = urllib.request.Request(
            "https://api.17track.net/track/v2/gettrackinfo",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "17token": os.environ.get("TRACK17_TOKEN", ""),
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        
        items = (data.get("data") or {}).get("accepted") or []
        if not items:
            return {"ok": False, "status": "unknown", "status_text": "Нет данных", "last_event": "Трек-номер не найден", "events": []}
        
        info = items[0].get("track") or {}
        track_info = info.get("z0") or {}
        events_raw = info.get("z1") or []
        
        events = [{"date": e.get("a",""), "location": e.get("c",""), "description": e.get("z","")} for e in events_raw[:10]]
        last = events[0] if events else {}
        status_text = last.get("description") or "В пути"
        is_delivered = info.get("e") == 40
        status = "delivered" if is_delivered else ("in_transit" if events else "pending")
        
        return {
            "ok": True,
            "status": status,
            "status_text": status_text,
            "last_event": f"{last.get('date','')} — {status_text}".strip(" —"),
            "events": events,
        }
    except:
        return {"ok": False, "status": "unknown", "status_text": "Сервис недоступен", "last_event": "Попробуй позже", "events": []}


def handler(event: dict, context) -> dict:
    """Трекинг посылок: добавление, список, обновление, удаление."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    device_id = get_device(event)

    if not device_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "device_id required"})}

    conn = get_conn()
    cur = conn.cursor()

    # GET /list — все посылки пользователя
    if method == "GET" and path.endswith("/list"):
        cur.execute(f"""
            SELECT id, track_number, title, carrier, status, status_text, last_event, last_update, delivered, created_at
            FROM {SCHEMA}.parcels WHERE device_id=%s ORDER BY delivered, created_at DESC
        """, (device_id,))
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([{
            "id": r[0], "track": r[1], "title": r[2], "carrier": r[3],
            "status": r[4], "status_text": r[5], "last_event": r[6],
            "last_update": str(r[7]), "delivered": r[8], "created_at": str(r[9]),
            "carrier_name": CARRIER_NAMES.get(r[3], r[3])
        } for r in rows])}

    # POST /add — добавить посылку
    if method == "POST" and path.endswith("/add"):
        track = body.get("track", "").strip().upper()
        title = body.get("title", "").strip() or f"Посылка {track[:8]}..."
        carrier = body.get("carrier") or detect_carrier(track)

        if not track:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введи трек-номер"})}

        # Проверка дублей
        cur.execute(f"SELECT id FROM {SCHEMA}.parcels WHERE device_id=%s AND track_number=%s", (device_id, track))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Посылка уже добавлена"})}

        # Сразу треким
        info = track_package(track, carrier)

        cur.execute(f"""
            INSERT INTO {SCHEMA}.parcels (device_id, track_number, title, carrier, status, status_text, last_event, raw_events, last_update)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,now()) RETURNING id
        """, (device_id, track, title, carrier, info["status"], info["status_text"], info["last_event"], json.dumps(info["events"])))
        pid = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": pid, "carrier": carrier, "carrier_name": CARRIER_NAMES.get(carrier, carrier), **info})}

    # POST /refresh — обновить статус посылки
    if method == "POST" and path.endswith("/refresh"):
        pid = int(body.get("id", 0))
        cur.execute(f"SELECT track_number, carrier FROM {SCHEMA}.parcels WHERE id=%s AND device_id=%s", (pid, device_id))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}

        info = track_package(row[0], row[1])
        is_delivered = info["status"] == "delivered"
        cur.execute(f"""
            UPDATE {SCHEMA}.parcels SET status=%s, status_text=%s, last_event=%s, raw_events=%s, delivered=%s, last_update=now()
            WHERE id=%s
        """, (info["status"], info["status_text"], info["last_event"], json.dumps(info["events"]), is_delivered, pid))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(info)}

    # GET /detail?id=X — детали посылки с событиями
    if method == "GET" and path.endswith("/detail"):
        pid = int(params.get("id", 0))
        cur.execute(f"""
            SELECT id, track_number, title, carrier, status, status_text, last_event, last_update, delivered, raw_events, created_at
            FROM {SCHEMA}.parcels WHERE id=%s AND device_id=%s
        """, (pid, device_id))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "id": row[0], "track": row[1], "title": row[2], "carrier": row[3],
            "status": row[4], "status_text": row[5], "last_event": row[6],
            "last_update": str(row[7]), "delivered": row[8],
            "events": row[9] or [], "created_at": str(row[10]),
            "carrier_name": CARRIER_NAMES.get(row[3], row[3])
        })}

    # DELETE /delete — удалить посылку
    if method == "DELETE" and path.endswith("/delete"):
        pid = int(body.get("id", 0))
        cur.execute(f"DELETE FROM {SCHEMA}.parcels WHERE id=%s AND device_id=%s", (pid, device_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
