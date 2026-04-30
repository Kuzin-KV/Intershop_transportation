"""
Администрирование: CRUD справочников (грузы, места, техника, подразделения) и пользователей.
Доступно только роли admin.
"""
import json, os, secrets
import psycopg2

SCHEMA = "t_p68114469_cross_platform_logis"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

ROLE_CHOICES = ["shop_chief", "ppb", "tc", "tc_master", "driver", "sender", "receiver", "analyst", "admin"]

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token, cur):
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    user_id = row[0]
    cur.execute(f"SELECT role FROM {SCHEMA}.user_roles WHERE user_id = %s", (user_id,))
    roles = [r[0] for r in cur.fetchall()] or [row[2]]
    return {"id": user_id, "name": row[1], "role": row[2], "roles": roles}

def require_admin(user):
    return user and ("admin" in (user.get("roles") or [user["role"]]))

def rows_to_list(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

def ensure_app_config_table(cur):
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.app_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    cur.execute(
        f"""INSERT INTO {SCHEMA}.app_config (key, value) VALUES
            ('header_title', 'ТрансДеталь'),
            ('header_icon', 'Truck'),
            ('header_title_color', '#111111'),
            ('process_name', ''),
            ('process_name_color', '#666666')
            ON CONFLICT (key) DO NOTHING"""
    )


def normalize_ids(body: dict):
    ids = body.get("ids")
    if isinstance(ids, list):
        cleaned = []
        for x in ids:
            try:
                cleaned.append(int(x))
            except Exception:
                continue
        return list(dict.fromkeys(cleaned))
    item_id = body.get("id")
    if item_id is None:
        return []
    try:
        return [int(item_id)]
    except Exception:
        return []

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    resource = qs.get("resource", "")
    action = qs.get("action", "list")
    token = qs.get("_token", "")

    conn = get_conn()
    cur = conn.cursor()
    user = get_user(token, cur)

    if not require_admin(user):
        conn.close()
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только для администратора"})}

    body = json.loads(event.get("body") or "{}") if method == "POST" else {}

    # ── Справочные таблицы: cargo_types, locations, vehicles, departments ───
    SIMPLE_TABLES = {
        "cargo_types":   f"{SCHEMA}.cargo_types",
        "locations":     f"{SCHEMA}.locations",
        "vehicles":      f"{SCHEMA}.vehicles",
        "departments":   f"{SCHEMA}.departments",
    }

    if resource in SIMPLE_TABLES:
        table = SIMPLE_TABLES[resource]

        if action == "list":
            cur.execute(f"SELECT id, name FROM {table} ORDER BY name")
            rows = rows_to_list(cur)
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows, ensure_ascii=False)}

        if action == "add" and method == "POST":
            name = body.get("name", "").strip()
            if not name:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Название не может быть пустым"})}
            cur.execute(f"INSERT INTO {table} (name) VALUES (%s) RETURNING id, name", (name,))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"id": row[0], "name": row[1]})}

        if action == "edit" and method == "POST":
            item_id = body.get("id")
            name = body.get("name", "").strip()
            if not item_id or not name:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужны id и name"})}
            cur.execute(f"UPDATE {table} SET name = %s WHERE id = %s", (name, item_id))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "delete" and method == "POST":
            item_ids = normalize_ids(body)
            if not item_ids:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id или ids"})}
            # Обнуляем ссылки в заявках перед удалением
            if resource == "cargo_types":
                cur.execute(f"UPDATE {SCHEMA}.orders SET cargo_type_id = NULL WHERE cargo_type_id = ANY(%s)", (item_ids,))
            elif resource == "locations":
                cur.execute(f"UPDATE {SCHEMA}.orders SET load_location_id = NULL WHERE load_location_id = ANY(%s)", (item_ids,))
                cur.execute(f"UPDATE {SCHEMA}.orders SET unload_location_id = NULL WHERE unload_location_id = ANY(%s)", (item_ids,))
            elif resource == "vehicles":
                cur.execute(f"UPDATE {SCHEMA}.orders SET vehicle_id = NULL WHERE vehicle_id = ANY(%s)", (item_ids,))
            elif resource == "departments":
                cur.execute(f"UPDATE {SCHEMA}.users SET department_id = NULL WHERE department_id = ANY(%s)", (item_ids,))
                cur.execute(f"UPDATE {SCHEMA}.orders SET department_id = NULL WHERE department_id = ANY(%s)", (item_ids,))
            cur.execute(f"DELETE FROM {table} WHERE id = ANY(%s)", (item_ids,))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "count": len(item_ids)})}

        if action == "import" and method == "POST":
            raw_names = body.get("names", [])
            if not isinstance(raw_names, list):
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен массив names"})}
            names = []
            seen = set()
            for n in raw_names:
                s = str(n or "").strip()
                if not s:
                    continue
                key = s.lower()
                if key in seen:
                    continue
                seen.add(key)
                names.append(s)
            if not names:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет данных для импорта"})}
            added = 0
            for name in names:
                cur.execute(f"INSERT INTO {table} (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", (name,))
                if cur.rowcount:
                    added += 1
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "ok": True,
                "added": added,
                "skipped": len(names) - added,
                "total": len(names)
            }, ensure_ascii=False)}

    # ── Пользователи ──────────────────────────────────────────────────────────
    if resource == "users":
        if action == "list":
            cur.execute(f"""
                SELECT u.id, u.name, u.login, u.role, u.department_id, d.name as dept_name
                FROM {SCHEMA}.users u
                LEFT JOIN {SCHEMA}.departments d ON d.id = u.department_id
                WHERE u.login NOT LIKE '%_del_%'
                ORDER BY u.name
            """)
            users_rows = rows_to_list(cur)
            # Загружаем роли для всех пользователей
            cur.execute(f"SELECT user_id, role FROM {SCHEMA}.user_roles")
            roles_map: dict = {}
            for uid, r in cur.fetchall():
                roles_map.setdefault(uid, []).append(r)
            for u in users_rows:
                u["roles"] = roles_map.get(u["id"], [u["role"]])
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(users_rows, ensure_ascii=False)}

        if action == "add" and method == "POST":
            name = body.get("name", "").strip()
            login = body.get("login", "").strip()
            password = body.get("password", "").strip()
            roles = [r for r in body.get("roles", []) if r in ROLE_CHOICES]
            department_id = body.get("department_id") or None

            if not name or not login or not password or not roles:
                conn.close()
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Заполните все обязательные поля (name, login, password, roles)"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s", (login,))
            if cur.fetchone():
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Логин уже занят"})}

            primary_role = roles[0]
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, login, password_hash, role, department_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (name, login, password, primary_role, department_id)
            )
            new_id = cur.fetchone()[0]
            for r in roles:
                cur.execute(f"INSERT INTO {SCHEMA}.user_roles (user_id, role) VALUES (%s, %s) ON CONFLICT DO NOTHING", (new_id, r))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id})}

        if action == "edit" and method == "POST":
            user_id = body.get("id")
            if not user_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id"})}

            updates = {}
            if body.get("name"): updates["name"] = body["name"].strip()
            if body.get("department_id") is not None: updates["department_id"] = body["department_id"] or None
            if body.get("password"): updates["password_hash"] = body["password"].strip()

            new_roles = [r for r in body.get("roles", []) if r in ROLE_CHOICES]
            if new_roles:
                updates["role"] = new_roles[0]

            if updates:
                set_clause = ", ".join(f"{k} = %s" for k in updates)
                cur.execute(f"UPDATE {SCHEMA}.users SET {set_clause} WHERE id = %s", list(updates.values()) + [user_id])

            if new_roles:
                cur.execute(f"SELECT role FROM {SCHEMA}.user_roles WHERE user_id = %s", (user_id,))
                existing = {r[0] for r in cur.fetchall()}
                to_add = set(new_roles) - existing
                to_remove = list(existing - set(new_roles))
                to_add_list = list(to_add)
                # Переиспользуем строки с удаляемыми ролями: меняем их на добавляемые
                for i, old_role in enumerate(to_remove):
                    if i < len(to_add_list):
                        cur.execute(
                            f"UPDATE {SCHEMA}.user_roles SET role = %s WHERE user_id = %s AND role = %s",
                            (to_add_list[i], user_id, old_role)
                        )
                    else:
                        # Больше нечем заменить — ставим первую новую роль (дубль уберётся ON CONFLICT)
                        cur.execute(
                            f"UPDATE {SCHEMA}.user_roles SET role = %s WHERE user_id = %s AND role = %s",
                            (new_roles[0], user_id, old_role)
                        )
                # Добавляем оставшиеся новые роли (которых не было пар для замены)
                for r in to_add_list[len(to_remove):]:
                    cur.execute(f"INSERT INTO {SCHEMA}.user_roles (user_id, role) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user_id, r))

            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "delete" and method == "POST":
            user_ids = normalize_ids(body)
            if not user_ids:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id или ids"})}
            cur.execute(f"UPDATE {SCHEMA}.sessions SET user_id = NULL WHERE user_id = ANY(%s)", (user_ids,))
            cur.execute(f"DELETE FROM {SCHEMA}.user_roles WHERE user_id = ANY(%s)", (user_ids,))
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET login = login || '_del_' || id::text,
                        password_hash = md5(random()::text || clock_timestamp()::text),
                        department_id = NULL
                    WHERE id = ANY(%s)""",
                (user_ids,)
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "count": len(user_ids)})}

    # ── Конфигурация столбцов ─────────────────────────────────────────────────
    if resource == "column_config":
        if action == "list":
            cur.execute(f"SELECT key, label, visible, sort_order FROM {SCHEMA}.column_config ORDER BY sort_order")
            rows = [{"key": r[0], "label": r[1], "visible": r[2], "sort_order": r[3]} for r in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows, ensure_ascii=False)}

        if action == "save" and method == "POST":
            items = body.get("items", [])
            for item in items:
                cur.execute(
                    f"UPDATE {SCHEMA}.column_config SET label = %s, visible = %s, sort_order = %s WHERE key = %s",
                    (item.get("label", ""), item["visible"], item["sort_order"], item["key"])
                )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── Статусы (stage_labels) ────────────────────────────────────────────────
    if resource == "stage_labels":
        if action == "list":
            cur.execute(f"SELECT stage, label, color FROM {SCHEMA}.stage_labels ORDER BY stage")
            rows = [{"stage": r[0], "label": r[1], "color": r[2]} for r in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows, ensure_ascii=False)}

        if action == "edit" and method == "POST":
            stage = body.get("stage")
            label = body.get("label", "").strip()
            color = body.get("color", "").strip()
            if stage is None or not label:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужны stage и label"})}
            if color:
                cur.execute(f"UPDATE {SCHEMA}.stage_labels SET label = %s, color = %s WHERE stage = %s", (label, color, stage))
            else:
                cur.execute(f"UPDATE {SCHEMA}.stage_labels SET label = %s WHERE stage = %s", (label, stage))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── Группы (role_labels) ──────────────────────────────────────────────────
    if resource == "role_labels":
        if action == "list":
            cur.execute(f"SELECT role, label FROM {SCHEMA}.role_labels ORDER BY role")
            rows = [{"role": r[0], "label": r[1]} for r in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows, ensure_ascii=False)}

        if action == "edit" and method == "POST":
            role = body.get("role", "").strip()
            label = body.get("label", "").strip()
            if not role or not label:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужны role и label"})}
            cur.execute(f"UPDATE {SCHEMA}.role_labels SET label = %s WHERE role = %s", (label, role))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── Конфигурация интерфейса (app_config) ─────────────────────────────────
    if resource == "app_config":
        ensure_app_config_table(cur)
        conn.commit()
        if action == "list":
            cur.execute(f"SELECT key, value FROM {SCHEMA}.app_config ORDER BY key")
            rows = [{"key": r[0], "value": r[1]} for r in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps(rows, ensure_ascii=False)}

        if action == "edit" and method == "POST":
            key = body.get("key", "").strip()
            value = body.get("value", "").strip()
            allowed = {
                "header_title", "header_icon", "header_icon_data", "header_title_color",
                "process_name", "process_name_color"
            }
            if key not in allowed:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Недопустимый ключ настройки"})}
            if key not in {"header_icon_data", "process_name"} and not value:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Значение не может быть пустым"})}
            cur.execute(
                f"""INSERT INTO {SCHEMA}.app_config (key, value) VALUES (%s, %s)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value""",
                (key, value)
            )
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}