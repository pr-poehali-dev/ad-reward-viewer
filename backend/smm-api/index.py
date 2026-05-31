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
    """Баланс, транзакции и выполнения заданий SMM-платформы"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(event)

    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    # --- BALANCE ---

    if method == "GET" and path.endswith("/balance"):
        cur.execute("SELECT balance FROM smm_users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        cur.execute("SELECT amount, type, description, created_at FROM smm_transactions WHERE user_id=%s ORDER BY created_at DESC LIMIT 50", (user_id,))
        txs = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "balance": float(row[0]) if row else 0,
            "transactions": [{"amount": float(r[0]), "type": r[1], "description": r[2], "created_at": str(r[3])} for r in txs]
        })}

    if method == "POST" and path.endswith("/topup"):
        amount = float(body.get("amount", 0))
        if amount <= 0 or amount > 100000:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверная сумма"})}
        cur.execute("UPDATE smm_users SET balance = balance + %s WHERE id=%s", (amount, user_id))
        cur.execute("INSERT INTO smm_transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                    (user_id, amount, "topup", "Пополнение баланса"))
        conn.commit()
        cur.execute("SELECT balance FROM smm_users WHERE id=%s", (user_id,))
        new_balance = float(cur.fetchone()[0])
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True, "balance": new_balance})}

    # --- EXECUTIONS ---

    if method == "POST" and path.endswith("/submit"):
        task_id = int(body.get("task_id", 0))
        proof_url = body.get("proof_url", "").strip()
        cur.execute("SELECT id, reward, filled_slots, total_slots, status FROM smm_tasks WHERE id=%s", (task_id,))
        task = cur.fetchone()
        if not task:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Задание не найдено"})}
        if task[4] != "active":
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Задание не активно"})}
        if task[2] >= task[3]:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Все места заняты"})}
        cur.execute("SELECT id FROM smm_executions WHERE task_id=%s AND executor_id=%s", (task_id, user_id))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Ты уже выполняешь это задание"})}
        cur.execute("INSERT INTO smm_executions (task_id, executor_id, proof_url) VALUES (%s,%s,%s) RETURNING id",
                    (task_id, user_id, proof_url or None))
        exec_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": exec_id, "success": True})}

    if method == "GET" and path.endswith("/my-executions"):
        cur.execute("""
            SELECT e.id, e.task_id, t.title, t.platform, t.task_type, t.reward,
                   e.status, e.proof_url, e.created_at
            FROM smm_executions e JOIN smm_tasks t ON t.id = e.task_id
            WHERE e.executor_id=%s ORDER BY e.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {"id": r[0], "task_id": r[1], "title": r[2], "platform": r[3],
             "task_type": r[4], "reward": float(r[5]), "status": r[6],
             "proof_url": r[7], "created_at": str(r[8])} for r in rows
        ])}

    if method == "GET" and path.endswith("/for-task"):
        task_id = int(params.get("task_id", 0))
        cur.execute("SELECT advertiser_id FROM smm_tasks WHERE id=%s", (task_id,))
        row = cur.fetchone()
        if not row or row[0] != user_id:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
        cur.execute("""
            SELECT e.id, e.executor_id, u.name, u.avatar, e.status, e.proof_url, e.created_at
            FROM smm_executions e JOIN smm_users u ON u.id = e.executor_id
            WHERE e.task_id=%s ORDER BY e.created_at DESC
        """, (task_id,))
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {"id": r[0], "executor_id": r[1], "name": r[2], "avatar": r[3],
             "status": r[4], "proof_url": r[5], "created_at": str(r[6])} for r in rows
        ])}

    if method == "POST" and path.endswith("/review"):
        exec_id = int(body.get("execution_id", 0))
        action = body.get("action", "")
        if action not in ("approve", "reject"):
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверное действие"})}
        cur.execute("""
            SELECT e.id, e.executor_id, t.reward, t.advertiser_id, e.status, e.task_id
            FROM smm_executions e JOIN smm_tasks t ON t.id = e.task_id WHERE e.id=%s
        """, (exec_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}
        if row[3] != user_id:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
        if row[4] != "pending":
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Уже проверено"})}
        new_status = "approved" if action == "approve" else "rejected"
        cur.execute("UPDATE smm_executions SET status=%s WHERE id=%s", (new_status, exec_id))
        if action == "approve":
            reward, executor_id, task_id = float(row[2]), row[1], row[5]
            cur.execute("UPDATE smm_users SET balance = balance + %s WHERE id=%s", (reward, executor_id))
            cur.execute("UPDATE smm_tasks SET filled_slots = filled_slots + 1 WHERE id=%s", (task_id,))
            cur.execute("INSERT INTO smm_transactions (user_id, amount, type, description) VALUES (%s,%s,%s,%s)",
                        (executor_id, reward, "task_reward", f"Оплата задания #{task_id}"))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}