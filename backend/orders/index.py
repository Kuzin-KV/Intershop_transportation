"""
CRUD заявок на перевозку.
Справочники, валидация этапов, автозаполнение полей из профиля пользователя.
"""
import json, os
import psycopg2

SCHEMA = "t_p68114469_cross_platform_logis"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

# stage: минимальный этап, который должен быть достигнут, чтобы роль могла редактировать
STAGE_UNLOCK = {
    "ppb":      1,   # доступно с этапа 1
    "tc":       2,   # после ППБ (этап 2)
    "tc_master": 3,  # после ТЦ (этап 3)
    "driver":   4,   # после назначения водителя
    "sender":   5,   # после этапа 5 (водитель заполнил пп.11,12)
    "receiver": 7,   # после этапа 7 (водитель заполнил пп.15,16)
    "shop_chief": 1, # создатель — всегда
    "admin":    0,   # без ограничений
}

ROLE_FIELDS = {
    "ppb":      {"priority"},
    "tc":       {"vehicle_id", "vehicle_model"},
    "tc_master": {"driver_name", "driver_id"},
    "driver":   {"arrival_load_time", "load_start_time",
                 "arrival_unload_time", "unload_start_time"},
    "sender":   {"departure_load_time", "sender_sign"},
    "receiver": {"departure_unload_time", "receiver_sign"},
    "shop_chief": {"note", "done"},
    "admin":    {
        "cargo_type_id", "cargo_name", "quantity", "execution_date",
        "load_location_id", "load_place", "unload_location_id", "unload_place",
        "priority", "vehicle_id", "vehicle_model", "driver_name", "driver_id",
        "arrival_load_time", "load_start_time", "departure_load_time", "sender_sign",
        "arrival_unload_time", "unload_start_time", "departure_unload_time",
        "receiver_sign", "note", "done"
    },
}

FIELD_STAGE = {
    "priority": 2,
    "vehicle_id": 3, "vehicle_model": 3,
    "driver_id": 4, "driver_name": 4,
    "arrival_load_time": 5, "load_start_time": 5,
    "departure_load_time": 6, "sender_sign": 6,
    "arrival_unload_time": 7, "unload_start_time": 7,
    "departure_unload_time": 8, "receiver_sign": 8,
    "note": 9, "done": 9,
}

STAGE_FIELDS = {
    1: set(),
    2: {"priority"},
    3: {"vehicle_id", "vehicle_model"},
    4: {"driver_id", "driver_name"},
    5: {"arrival_load_time", "load_start_time"},
    6: {"departure_load_time", "sender_sign"},
    7: {"arrival_unload_time", "unload_start_time"},
    8: {"departure_unload_time", "receiver_sign"},
    9: {"note", "done"},
}

STAGE_REQUIRED_FIELDS = {
    1: set(),
    2: {"priority"},
    3: {"vehicle_id"},
    4: {"driver_id"},
    5: {"arrival_load_time", "load_start_time"},
    6: {"departure_load_time", "sender_sign"},
    7: {"arrival_unload_time", "unload_start_time"},
    8: {"departure_unload_time", "receiver_sign"},
    9: {"done"},
}

def is_filled(field: str, value):
    if field == "done":
        return value is True
    return value not in (None, "")

def stage_is_complete(stage: int, data: dict) -> bool:
    if data.get("_priority_enabled") is False and stage == 2:
        return True
    # Этап 2 считаем завершенным только после действия ППБ (фиксируется ppb_name)
    if stage == 2:
        return is_filled("priority", data.get("priority")) and is_filled("ppb_name", data.get("ppb_name"))
    # Этап 3 завершен, если заполнен транспорт (id или текстовая модель)
    if stage == 3:
        return is_filled("vehicle_id", data.get("vehicle_id")) or is_filled("vehicle_model", data.get("vehicle_model"))
    # Этап 4 завершен, если назначен водитель (id или имя)
    if stage == 4:
        return is_filled("driver_id", data.get("driver_id")) or is_filled("driver_name", data.get("driver_name"))
    required = STAGE_REQUIRED_FIELDS.get(stage, set())
    return all(is_filled(f, data.get(f)) for f in required)

def derive_stage(data: dict) -> int:
    stage = 1
    while stage < 9 and stage_is_complete(stage, data):
        stage += 1
    return stage

def is_priority_enabled(cur) -> bool:
    cur.execute(f"SELECT visible FROM {SCHEMA}.column_config WHERE key = 'priority' LIMIT 1")
    row = cur.fetchone()
    if not row:
        return True
    return bool(row[0])

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token, cur):
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id, u.name, u.role, u.department_id, d.name as dept_name
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            LEFT JOIN {SCHEMA}.departments d ON d.id = u.department_id
            WHERE s.token = %s""",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    user_id = row[0]
    cur.execute(f"SELECT role FROM {SCHEMA}.user_roles WHERE user_id = %s", (user_id,))
    roles = [r[0] for r in cur.fetchall()] or [row[2]]
    return {"id": user_id, "name": row[1], "role": row[2], "roles": roles,
            "department_id": row[3], "department_name": row[4] or ""}

def log_action(cur, user, action, target):
    cur.execute(
        f"INSERT INTO {SCHEMA}.action_logs (user_id, user_name, action, target) VALUES (%s, %s, %s, %s)",
        (user["id"], user["name"], action, target)
    )

def next_order_num(cur):
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders")
    count = cur.fetchone()[0]
    return f"ЗПВ-{str(count + 1).zfill(4)}"

def to_surname_initials(full_name: str) -> str:
    parts = [p for p in (full_name or "").strip().split() if p]
    if not parts:
        return ""
    surname = parts[0]
    initials = "".join((p[0] + ".") for p in parts[1:] if p)
    return f"{surname} {initials}".strip()

def compute_stage(o: dict) -> int:
    """Вычисляет текущий этап по заполненным полям"""
    if o.get("done"):                  return 9
    if o.get("receiver_sign"):         return 9
    if o.get("unload_start_time"):     return 8
    if o.get("arrival_unload_time"):   return 8
    if o.get("departure_load_time"):   return 7
    if o.get("sender_sign"):           return 7
    if o.get("load_start_time"):       return 6
    if o.get("arrival_load_time"):     return 6
    if o.get("driver_name"):           return 5
    if o.get("vehicle_model") or o.get("vehicle_id"): return 4
    if o.get("priority") is not None:  return 2
    if o.get("applicant_name"):        return 2
    return 1

def fetch_order_dict(cur, order_id):
    cur.execute(f"""
        SELECT id, order_num, department, department_id, applicant_name, cargo_name, cargo_type_id,
               quantity, to_char(execution_date, 'YYYY-MM-DD"T"HH24:MI') as execution_date, load_place, load_location_id, unload_place, unload_location_id,
               priority, vehicle_model, vehicle_id, driver_name, driver_id,
               arrival_load_time, load_start_time, departure_load_time, sender_sign,
               arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
               note, done, created_by, stage, tc_master_name, ppb_name, tc_name,
               to_char(created_at, 'DD.MM.YYYY') as created_date
        FROM {SCHEMA}.orders WHERE id = %s
    """, (order_id,))
    cols = [d[0] for d in cur.description]
    row = cur.fetchone()
    if not row:
        return None
    result = dict(zip(cols, row))
    result["_priority_enabled"] = is_priority_enabled(cur)
    result["stage"] = derive_stage(result)
    return result

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
    action = qs.get("action", "list")
    token = qs.get("_token", "")

    conn = get_conn()
    cur = conn.cursor()
    user = get_user(token, cur)

    # ── GET ?action=refs — справочники для форм ──────────────────────────────
    if method == "GET" and action == "refs":
        cur.execute(f"SELECT id, name FROM {SCHEMA}.departments ORDER BY name")
        departments = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, name FROM {SCHEMA}.cargo_types ORDER BY name")
        cargo_types = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, name FROM {SCHEMA}.locations ORDER BY name")
        locations = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, name FROM {SCHEMA}.vehicles ORDER BY name")
        vehicles = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        # водители (для мастера ТЦ) — все у кого есть роль driver
        cur.execute(f"SELECT DISTINCT u.id, u.name FROM {SCHEMA}.users u JOIN {SCHEMA}.user_roles ur ON ur.user_id = u.id WHERE ur.role = 'driver' ORDER BY u.name")
        drivers = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]

        # названия групп
        cur.execute(f"SELECT role, label FROM {SCHEMA}.role_labels")
        role_labels = {r[0]: r[1] for r in cur.fetchall()}

        # названия и цвета статусов
        cur.execute(f"SELECT stage, label, color FROM {SCHEMA}.stage_labels ORDER BY stage")
        stage_rows = cur.fetchall()
        stage_labels = {r[0]: r[1] for r in stage_rows}
        stage_colors = {r[0]: r[2] for r in stage_rows}

        # конфигурация столбцов
        cur.execute(f"SELECT key, label, visible, sort_order FROM {SCHEMA}.column_config ORDER BY sort_order")
        column_config = [{"key": r[0], "label": r[1], "visible": r[2], "sort_order": r[3]} for r in cur.fetchall()]

        # настройки заголовка интерфейса
        app_config = {
            "header_title": "ТрансДеталь",
            "header_icon": "Truck",
            "header_icon_data": "",
            "header_title_color": "#111111",
            "process_name": "",
            "process_name_color": "#666666",
        }
        try:
            cur.execute(f"SELECT key, value FROM {SCHEMA}.app_config")
            app_config.update({r[0]: r[1] for r in cur.fetchall()})
        except Exception:
            pass

        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"departments": departments, "cargo_types": cargo_types,
             "locations": locations, "vehicles": vehicles, "drivers": drivers,
             "role_labels": role_labels, "stage_labels": stage_labels,
             "stage_colors": stage_colors, "column_config": column_config, "app_config": app_config},
            ensure_ascii=False
        )}

    # ── GET ?action=list — список заявок ─────────────────────────────────────
    if method == "GET" and action == "list":
        priority_enabled = is_priority_enabled(cur)
        # Водитель (только водитель, без других ролей) видит только свои заявки
        roles = user.get("roles") or [user["role"]] if user else []
        if user and set(roles) == {"driver"}:
            cur.execute(f"""
                SELECT id, order_num, department, applicant_name, cargo_name, quantity,
                       to_char(execution_date, 'YYYY-MM-DD"T"HH24:MI') as execution_date, load_place, unload_place, priority,
                       vehicle_model, driver_name, driver_id,
                       arrival_load_time, load_start_time, departure_load_time, sender_sign,
                       arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
                       note, done, created_by, stage, tc_master_name, ppb_name, tc_name,
                       to_char(created_at, 'DD.MM.YYYY') as created_date
                FROM {SCHEMA}.orders
                WHERE driver_id = %s
                ORDER BY created_at DESC
            """, (user["id"],))
        else:
            cur.execute(f"""
                SELECT id, order_num, department, applicant_name, cargo_name, quantity,
                       to_char(execution_date, 'YYYY-MM-DD"T"HH24:MI') as execution_date, load_place, unload_place, priority,
                       vehicle_model, driver_name, driver_id,
                       arrival_load_time, load_start_time, departure_load_time, sender_sign,
                       arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign,
                       note, done, created_by, stage, tc_master_name, ppb_name, tc_name,
                       to_char(created_at, 'DD.MM.YYYY') as created_date
                FROM {SCHEMA}.orders
                ORDER BY priority ASC NULLS LAST, created_at DESC
            """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for row in rows:
            row["_priority_enabled"] = priority_enabled
            row["stage"] = derive_stage(row)
            row.pop("_priority_enabled", None)
        conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps(rows, ensure_ascii=False, default=str)}

    # ── POST ?action=create — создать заявку (shop_chief, admin) ─────────────
    if method == "POST" and action == "create":
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}
        user_roles = set(user.get("roles") or [user["role"]])
        if not user_roles & {"shop_chief", "admin"}:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав для создания заявки"})}

        body = json.loads(event.get("body") or "{}")
        order_num = next_order_num(cur)

        # col1, col2 — автоматически из профиля
        department = user["department_name"]
        applicant_name = user["name"]

        def to_int(v):
            try: return int(v) if v else None
            except: return None

        # col3 — груз из справочника
        cargo_type_id = to_int(body.get("cargo_type_id"))
        cargo_name = body.get("cargo_name", "")
        if cargo_type_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.cargo_types WHERE id = %s", (cargo_type_id,))
            r = cur.fetchone()
            if r:
                cargo_name = r[0]

        # col6,7 — место из справочника
        load_location_id  = to_int(body.get("load_location_id"))
        unload_location_id = to_int(body.get("unload_location_id"))
        load_place = ""
        unload_place = ""
        if load_location_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.locations WHERE id = %s", (load_location_id,))
            r = cur.fetchone()
            if r: load_place = r[0]
        if unload_location_id:
            cur.execute(f"SELECT name FROM {SCHEMA}.locations WHERE id = %s", (unload_location_id,))
            r = cur.fetchone()
            if r: unload_place = r[0]

        quantity = body.get("quantity", "")
        raw_date = body.get("execution_date") or None
        execution_date = raw_date.replace("T", " ") if raw_date else None
        note = body.get("note", "")
        department_id = to_int(user.get("department_id"))

        cur.execute(
            f"""INSERT INTO {SCHEMA}.orders
                (order_num, department, department_id, applicant_name,
                 cargo_name, cargo_type_id, quantity, execution_date,
                 load_place, load_location_id, unload_place, unload_location_id, priority,
                 note, created_by, stage)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, %s, %s, 1)
                RETURNING id""",
            (order_num, department, department_id, applicant_name,
             cargo_name, cargo_type_id, quantity, execution_date,
             load_place, load_location_id, unload_place, unload_location_id,
             note, user["id"])
        )
        new_id = cur.fetchone()[0]
        log_action(cur, user, "Создал заявку", order_num)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"id": new_id, "order_num": order_num})}

    # ── POST ?action=update — обновить поля по роли ───────────────────────────
    if method == "POST" and action == "update":
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

        body = json.loads(event.get("body") or "{}")
        order_id = body.get("id")
        if not order_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не указан id заявки"})}

        # Получаем текущее состояние заявки
        order = fetch_order_dict(cur, order_id)
        if not order:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Заявка не найдена"})}

        current_stage = derive_stage(order)

        roles = user.get("roles") or [user["role"]]

        # Проверка доступа для водителя — только свои заявки
        if "driver" in roles and order.get("driver_id") != user["id"] and set(roles) == {"driver"}:
            conn.close()
            return {"statusCode": 403, "headers": CORS,
                    "body": json.dumps({"error": "Водитель может редактировать только свои заявки"})}

        def to_int(v):
            try: return int(v) if v else None
            except: return None

        # Разрешённые поля только для ролей текущего этапа
        unlocked_roles = [r for r in roles if current_stage >= STAGE_UNLOCK.get(r, 99)]
        if "admin" in roles and "admin" not in unlocked_roles:
            unlocked_roles.append("admin")

        allowed_by_roles = set()
        for r in unlocked_roles:
            allowed_by_roles |= ROLE_FIELDS.get(r, set())
        allowed_current_stage = STAGE_FIELDS.get(current_stage, set())
        allowed = allowed_by_roles & allowed_current_stage

        fields_to_update = {
            k: v for k, v in body.items()
            if k in allowed and k != "id" and current_stage == FIELD_STAGE.get(k, 0)
        }

        # ППБ может подтвердить этап 2 даже без изменения числового значения приоритета
        if not fields_to_update and current_stage == 2 and "ppb" in roles and not order.get("ppb_name"):
            fields_to_update["priority"] = order.get("priority") if order.get("priority") is not None else 0

        # Приводим integer FK к int
        for int_field in ("vehicle_id", "driver_id"):
            if int_field in fields_to_update:
                fields_to_update[int_field] = to_int(fields_to_update[int_field])

        # Автозаполнение подписи:
        # для "ответственного за сдачу" фиксируем именно того, кто ввел время выезда из цеха,
        # и храним в формате "Фамилия И.О."
        if ("sender" in roles or "admin" in roles) and "departure_load_time" in fields_to_update:
            fields_to_update["sender_sign"] = to_surname_initials(user["name"])
        elif ("sender" in roles or "admin" in roles) and "sender_sign" not in fields_to_update:
            fields_to_update["sender_sign"] = to_surname_initials(user["name"])
        if "receiver" in roles and "receiver_sign" not in fields_to_update:
            fields_to_update["receiver_sign"] = user["name"]

        # Если ТЦ выбирает технику — обновляем текстовое название
        if "vehicle_id" in fields_to_update and fields_to_update["vehicle_id"]:
            cur.execute(f"SELECT name FROM {SCHEMA}.vehicles WHERE id = %s", (fields_to_update["vehicle_id"],))
            r = cur.fetchone()
            if r:
                fields_to_update["vehicle_model"] = r[0]

        # Если мастер назначает водителя по id — записываем имя и фиксируем мастера
        if "driver_id" in fields_to_update and fields_to_update["driver_id"]:
            cur.execute(f"SELECT name FROM {SCHEMA}.users WHERE id = %s", (fields_to_update["driver_id"],))
            r = cur.fetchone()
            if r:
                fields_to_update["driver_name"] = r[0]
        if "tc_master" in roles and ("driver_id" in fields_to_update or "driver_name" in fields_to_update):
            fields_to_update["tc_master_name"] = user["name"]

        # Фиксируем имя сотрудника по роли
        if "ppb" in roles and "priority" in fields_to_update:
            fields_to_update["ppb_name"] = user["name"]
        if "tc" in roles and ("vehicle_id" in fields_to_update or "vehicle_model" in fields_to_update):
            fields_to_update["tc_name"] = user["name"]

        if not fields_to_update:
            conn.close()
            return {"statusCode": 403, "headers": CORS,
                    "body": json.dumps({"error": f"Нет доступных полей на текущем этапе ({current_stage}) для ваших групп"})}

        # Пересчитываем этап из фактически заполненных полей
        merged = {**order, **fields_to_update}
        new_stage = derive_stage(merged)
        fields_to_update["stage"] = new_stage

        set_clause = ", ".join(f"{k} = %s" for k in fields_to_update)
        values = list(fields_to_update.values()) + [order_id]
        cur.execute(
            f"UPDATE {SCHEMA}.orders SET {set_clause}, updated_at = NOW() WHERE id = %s", values
        )
        log_action(cur, user, f"Обновил поля: {', '.join(k for k in fields_to_update if k != 'stage')}", order["order_num"])
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "stage": new_stage})}

    # ── POST ?action=delete — удаление заявки (только admin) ─────────────────
    if method == "POST" and action == "delete":
        user_roles = set(user.get("roles") or [user["role"]])
        if "admin" not in user_roles:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}
        body = json.loads(event.get("body") or "{}")
        order_ids = normalize_ids(body)
        if not order_ids:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нужен id или ids"})}
        cur.execute(f"SELECT id, order_num FROM {SCHEMA}.orders WHERE id = ANY(%s)", (order_ids,))
        rows = cur.fetchall()
        if not rows:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Заявка не найдена"})}
        existing_ids = [r[0] for r in rows]
        order_nums = [r[1] for r in rows]
        cur.execute(f"DELETE FROM {SCHEMA}.orders WHERE id = ANY(%s)", (existing_ids,))
        for num in order_nums:
            log_action(cur, user, "Удалил заявку", num)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "count": len(existing_ids)})}

    # ── GET ?action=logs — история ────────────────────────────────────────────
    if method == "GET" and action == "logs":
        cur.execute(
            f"""SELECT user_name, action, target, to_char(created_at, 'DD.MM HH24:MI') as time
                FROM {SCHEMA}.action_logs ORDER BY created_at DESC LIMIT 100"""
        )
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps(rows, ensure_ascii=False)}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}