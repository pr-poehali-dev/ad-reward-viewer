import json, os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Token, X-Requested-With",
    "Access-Control-Max-Age": "86400",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_id(event):
    token = event.get("headers", {}).get("x-session-token", "")
    if not token or ":" not in token:
        return None
    return int(token.split(":")[0])

def handler(event: dict, context) -> dict:
    """Управление заданиями SMM-платформы"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    conn = get_conn()
    cur = conn.cursor()

    # GET /list — список заданий (для исполнителя)
    if method == "GET" and path.endswith("/list"):
        platform = params.get("platform", "")
        task_type = params.get("task_type", "")
        user_id = get_user_id(event)
        where = ["t.status = 'active'", "t.filled_slots < t.total_slots"]
        args = []
        if platform:
            where.append("t.platform = %s")
            args.append(platform)
        if task_type:
            where.append("t.task_type = %s")
            args.append(task_type)
        sql = f"""
            SELECT t.id, t.title, t.description, t.platform, t.task_type, t.link,
                   t.reward, t.total_slots, t.filled_slots, t.created_at,
                   u.name as advertiser_name,
                   CASE WHEN e.id IS NOT NULL THEN e.status ELSE NULL END as my_status
            FROM smm_tasks t
            JOIN smm_users u ON u.id = t.advertiser_id
            LEFT JOIN smm_executions e ON e.task_id = t.id AND e.executor_id = %s
            WHERE {' AND '.join(where)}
            ORDER BY t.created_at DESC LIMIT 50
        """
        cur.execute(sql, [user_id or 0] + args)
        rows = cur.fetchall()
        conn.close()
        tasks = []
        for r in rows:
            tasks.append({
                "id": r[0], "title": r[1], "description": r[2], "platform": r[3],
                "task_type": r[4], "link": r[5], "reward": float(r[6]),
                "total_slots": r[7], "filled_slots": r[8],
                "created_at": str(r[9]), "advertiser_name": r[10], "my_status": r[11]
            })
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(tasks)}

    # GET /my — задания рекламодателя
    if method == "GET" and path.endswith("/my"):
        user_id = get_user_id(event)
        if not user_id:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        cur.execute("""
            SELECT t.id, t.title, t.platform, t.task_type, t.reward,
                   t.total_slots, t.filled_slots, t.status, t.created_at,
                   COUNT(e.id) FILTER (WHERE e.status='pending') as pending_count
            FROM smm_tasks t
            LEFT JOIN smm_executions e ON e.task_id = t.id
            WHERE t.advertiser_id = %s
            GROUP BY t.id ORDER BY t.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        tasks = [{"id": r[0], "title": r[1], "platform": r[2], "task_type": r[3],
                  "reward": float(r[4]), "total_slots": r[5], "filled_slots": r[6],
                  "status": r[7], "created_at": str(r[8]), "pending_count": r[9]} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(tasks)}

    # POST /create — создать задание (рекламодатель)
    if method == "POST" and path.endswith("/create"):
        user_id = get_user_id(event)
        if not user_id:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        platform = body.get("platform", "")
        task_type = body.get("task_type", "")
        link = body.get("link", "").strip()
        reward = float(body.get("reward", 0))
        total_slots = int(body.get("total_slots", 10))
        total_cost = reward * total_slots

        if not all([title, description, platform, task_type, link]) or reward <= 0:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполни все поля"})}

        cur.execute("SELECT balance FROM smm_users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row or float(row[0]) < total_cost:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Недостаточно средств. Нужно {total_cost:.2f} ₽"})}

        cur.execute("UPDATE smm_users SET balance = balance - %s WHERE id=%s", (total_cost, user_id))
        cur.execute(
            "INSERT INTO smm_tasks (advertiser_id, title, description, platform, task_type, link, reward, total_slots) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (user_id, title, description, platform, task_type, link, reward, total_slots)
        )
        task_id = cur.fetchone()[0]
        cur.execute("INSERT INTO smm_transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                    (user_id, -total_cost, "task_create", f"Создание задания #{task_id}"))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": task_id, "success": True})}

    # PUT /status — изменить статус задания
    if method == "PUT" and path.endswith("/status"):
        user_id = get_user_id(event)
        task_id = int(body.get("task_id", 0))
        status = body.get("status", "")
        if status not in ("active", "paused"):
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный статус"})}
        cur.execute("UPDATE smm_tasks SET status=%s WHERE id=%s AND advertiser_id=%s", (status, task_id, user_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}