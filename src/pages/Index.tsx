import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiLogin, apiMe, apiGetOrders, apiCreateOrder, apiUpdateOrder, apiDeleteOrder, apiGetLogs, apiGetRefs } from "@/api";
import Admin from "@/pages/Admin";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

type Tab = "orders" | "reports" | "history";

interface User {
  id: number;
  name: string;
  role: string;
  roles: string[];
  department_id: number | null;
  department_name: string;
}

interface RefItem { id: number; name: string; }
interface Refs {
  departments: RefItem[];
  cargo_types: RefItem[];
  locations: RefItem[];
  vehicles: RefItem[];
  drivers: RefItem[];
  role_labels?: Record<string, string>;
  stage_labels?: Record<number, string>;
  stage_colors?: Record<number, string>;
  column_config?: { key: string; label: string; visible: boolean; sort_order: number }[];
  app_config?: Record<string, string>;
}

interface Order {
  id: number;
  order_num: string;
  department: string;
  applicant_name: string;
  cargo_name: string;
  cargo_type_id: number | null;
  quantity: string;
  execution_date: string | null;
  load_place: string;
  load_location_id: number | null;
  unload_place: string;
  unload_location_id: number | null;
  priority: number | null;
  vehicle_model: string;
  vehicle_id: number | null;
  driver_name: string;
  driver_id: number | null;
  arrival_load_time: string;
  load_start_time: string;
  departure_load_time: string;
  sender_sign: string;
  arrival_unload_time: string;
  unload_start_time: string;
  departure_unload_time: string;
  receiver_sign: string;
  note: string;
  done: boolean;
  stage: number;
  tc_master_name: string | null;
  ppb_name: string | null;
  tc_name: string | null;
  created_date: string;
}

interface LogEntry { user_name: string; action: string; target: string; time: string; }

const ROLE_LABELS: Record<string, string> = {
  shop_chief: "Начальник цеха", ppb: "ППБ", tc: "Транспортный цех",
  tc_master: "Мастер ТЦ", driver: "Водитель",
  sender: "Ответственный за сдачу", receiver: "Ответственный за приём",
  analyst: "Аналитики", admin: "Администратор",
};

const STAGE_LABELS: Record<number, string> = {
  1: "Новая", 2: "У ППБ", 3: "ТЦ", 4: "Назначена",
  5: "Погрузка", 6: "Погрузка", 7: "В пути", 8: "Разгрузка", 9: "Выполнено",
};
const STAGE_COLOR: Record<number, string> = {
  1: "bg-slate-100 text-slate-600 border-slate-200",
  2: "bg-slate-100 text-slate-600 border-slate-200",
  3: "bg-blue-50 text-blue-700 border-blue-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  5: "bg-amber-50 text-amber-700 border-amber-200",
  6: "bg-orange-50 text-orange-700 border-orange-200",
  7: "bg-violet-50 text-violet-700 border-violet-200",
  8: "bg-cyan-50 text-cyan-700 border-cyan-200",
  9: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ORDER_COL_DEFAULTS = [
  { key: "order_num",      label: "№",                     visible: true,  sort_order: 1 },
  { key: "created_date",   label: "Дата",                  visible: true,  sort_order: 2 },
  { key: "cargo",          label: "Груз / Подразделение",  visible: true,  sort_order: 3 },
  { key: "quantity",       label: "Кол.",                  visible: true,  sort_order: 4 },
  { key: "priority",       label: "Приор.",                visible: true,  sort_order: 5 },
  { key: "places",         label: "Место погр. → выгр.",   visible: true,  sort_order: 6 },
  { key: "applicant_name", label: "Заявитель",             visible: true,  sort_order: 7 },
  { key: "ppb_name",       label: "ППБ",                   visible: true,  sort_order: 8 },
  { key: "tc_name",        label: "Транспорт назначил",    visible: true,  sort_order: 9 },
  { key: "tc_master_name", label: "Мастер ТЦ",             visible: true,  sort_order: 10 },
  { key: "driver_name",    label: "Водитель",              visible: true,  sort_order: 11 },
  { key: "sender_sign",    label: "Отв. за сдачу",         visible: true,  sort_order: 12 },
  { key: "receiver_sign",  label: "Отв. за приём",         visible: true,  sort_order: 13 },
  { key: "stage",          label: "Этап",                  visible: true,  sort_order: 14 },
];

function toSurnameInitials(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const surname = parts[0];
  const initials = parts
    .slice(1, 3)
    .map((p) => `${p[0]?.toUpperCase() || ""}.`)
    .join("");
  return `${surname} ${initials}`.trim();
}

// Минимальный этап для начала редактирования роли
const ROLE_MIN_STAGE: Record<string, number> = {
  ppb: 1, tc: 2, tc_master: 3, driver: 4, sender: 5, receiver: 7,
  shop_chief: 1, admin: 0,
};

// Поля, которые каждая роль имеет право редактировать
const ROLE_ALLOWED_FIELDS: Record<string, string[]> = {
  ppb:        ["priority"],
  tc:         ["vehicle_id", "vehicle_model"],
  tc_master:  ["driver_name", "driver_id"],
  driver:     ["arrival_load_time", "load_start_time", "arrival_unload_time", "unload_start_time"],
  sender:     ["departure_load_time", "sender_sign"],
  receiver:   ["departure_unload_time", "receiver_sign"],
  shop_chief: ["note", "done"],
  admin:      ["cargo_type_id", "cargo_name", "quantity", "execution_date", "load_location_id",
               "load_place", "unload_location_id", "unload_place", "priority", "vehicle_id",
               "vehicle_model", "driver_name", "driver_id", "arrival_load_time", "load_start_time",
               "departure_load_time", "sender_sign", "arrival_unload_time", "unload_start_time",
               "departure_unload_time", "receiver_sign", "note", "done"],
};

const FIELD_MIN_STAGE: Record<string, number> = {
  priority: 2,
  vehicle_id: 3, vehicle_model: 3,
  driver_id: 4, driver_name: 4,
  arrival_load_time: 5, load_start_time: 5,
  departure_load_time: 6, sender_sign: 6,
  arrival_unload_time: 7, unload_start_time: 7,
  departure_unload_time: 8, receiver_sign: 8,
  note: 9, done: 9,
};

// ── Экран входа ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, headerTitle, headerIcon, headerIconData, headerTitleColor, processName, processNameColor }: {
  onLogin: (user: User, token: string) => void;
  headerTitle: string;
  headerIcon: string;
  headerIconData?: string;
  headerTitleColor?: string;
  processName?: string;
  processNameColor?: string;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!login || !password) return;
    setLoading(true); setError("");
    try {
      const res = await apiLogin(login, password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        onLogin(res.user as never, res.token as string);
      } else {
        setError((res.error as string) || "Ошибка входа");
      }
    } finally {
      setLoading(false);
    }
  };

  const DEMO_USERS = [
    ["morozov", "Нач. цеха"], ["smirnova", "ППБ"], ["orlov", "Мастер ТЦ"],
    ["ivanov", "Водитель"], ["gorelov", "Сдача"], ["kuznetsova", "Приём"], ["admin", "Админ"],
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm flex items-center justify-center px-4">
      <div className="bg-white border border-[#E0E0E0] w-full max-w-sm p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${headerIconData && headerIconData !== "-" ? "" : "bg-[#111]"}`}>
            {headerIconData && headerIconData !== "-" ? (
              <img src={headerIconData} alt="Лого" className="w-6 h-6 object-cover" />
            ) : (
              <Icon name={headerIcon} size={14} className="text-white" />
            )}
          </div>
          <span
            className="font-semibold text-[22px] leading-[22px] tracking-wide uppercase"
            style={{ color: headerTitleColor || "#111111" }}
          >
            {headerTitle}
          </span>
        </div>
        {processName?.trim() && (
          <p className="text-[16px] leading-[16px] mb-6 -mt-5" style={{ color: processNameColor || "#666666" }}>{processName}</p>
        )}
        <p className="text-[10px] uppercase tracking-wider text-[#999] mb-6">Вход в систему</p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Логин</label>
            <input autoFocus className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2.5 text-sm outline-none focus:border-[#111]"
              value={login} onChange={e => setLogin(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="ivanov" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Пароль</label>
            <input type="password" className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2.5 text-sm outline-none focus:border-[#111]"
              value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <button onClick={submit} disabled={loading}
          className="w-full bg-[#111] text-white py-2.5 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
          {loading ? "Вход..." : "Войти"}
        </button>
        <div className="mt-5 border-t border-[#F0F0EE] pt-4">
          <p className="text-[10px] text-[#BBB] mb-2">Демо (пароль: 1234)</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {DEMO_USERS.map(([l, label]) => (
              <button key={l} onClick={() => { setLogin(l); setPassword("1234"); }}
                className="text-[10px] text-[#888] hover:text-[#111] transition-colors">{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Форма создания заявки (только начальник цеха) ──────────────────────────
function NewOrderForm({ user, refs, onClose, onCreated }: {
  user: User; refs: Refs; onClose: () => void; onCreated: () => void;
}) {
  const [cargo_type_id, setCargoTypeId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [execution_date, setExecutionDate] = useState("");
  const [load_location_id, setLoadLocId] = useState<string>("");
  const [unload_location_id, setUnloadLocId] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!cargo_type_id) { setError("Выберите груз"); return; }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 999) {
      setError("Кол-во: число от 1 до 999"); return;
    }
    if (!execution_date) { setError("Укажите дату и время исполнения"); return; }
    if (!load_location_id) { setError("Выберите место погрузки"); return; }
    if (!unload_location_id) { setError("Выберите место выгрузки"); return; }
    setLoading(true); setError("");
    try {
      const res = await apiCreateOrder({
        cargo_type_id, quantity, execution_date,
        load_location_id, unload_location_id, note,
      });
      if (res.id) { onCreated(); onClose(); }
      else setError((res.error as string) || "Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  const Select = ({ label, value, onChange, items, placeholder }: {
    label: string; value: string; onChange: (v: string) => void;
    items: RefItem[]; placeholder?: string;
  }) => (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">{label}</label>
      <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
        value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder || "— выберите —"}</option>
        {items.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-white border border-[#E0E0E0] mb-5 animate-fade-in">
      <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-[#FAFAFA]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#333]">Новая заявка на перевозку</p>
          <p className="text-[10px] text-[#AAA] mt-0.5">Этап 1 · Заполняет начальник цеха</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-[#F0F0EE]">
          <Icon name="X" size={14} className="text-[#888]" />
        </button>
      </div>
      <div className="p-5">
        {/* Автозаполняемые поля */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Подразделение (кол. 1)</label>
            <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-3 py-2 text-sm text-[#888]">{user.department_name || "—"}</div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Автор заявки (кол. 2)</label>
            <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-3 py-2 text-sm text-[#888]">{user.name}</div>
          </div>
        </div>
        {/* Поля для заполнения */}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Наименование груза (кол. 3)" value={cargo_type_id} onChange={setCargoTypeId} items={refs.cargo_types} />
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Кол-во, шт (кол. 4) · 1–999</label>
            <input type="number" min={1} max={999}
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
              value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Дата и время подачи (кол. 5)</label>
            <input type="datetime-local"
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
              value={execution_date} onChange={e => setExecutionDate(e.target.value)} />
          </div>
          <div />
          <Select label="Место погрузки (кол. 6)" value={load_location_id} onChange={setLoadLocId} items={refs.locations} />
          <Select label="Место выгрузки (кол. 7)" value={unload_location_id} onChange={setUnloadLocId} items={refs.locations} />
          <div className="col-span-2">
            <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Примечание</label>
            <textarea rows={2}
              className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111] resize-none"
              value={note} onChange={e => setNote(e.target.value)} placeholder="Необязательно" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={submit} disabled={loading}
            className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
            {loading ? "Создание..." : "Сохранить"}
          </button>
          <button onClick={onClose}
            className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE] transition-colors">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Панель редактирования заявки ───────────────────────────────────────────
function OrderPanel({ order, user, refs, onClose, onSaved }: {
  order: Order; user: User; refs: Refs; onClose: () => void; onSaved: () => void;
}) {
  const [fields, setFields] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const set = (k: string, v: string | number | boolean) => setFields(p => ({ ...p, [k]: v }));

  const stage = order.stage || 1;
  const roles = user.roles?.length ? user.roles : [user.role];

  const colVisible = (key: string) => {
    if (!refs.column_config || refs.column_config.length === 0) return true;
    const col = refs.column_config.find(c => c.key === key);
    return col ? col.visible : true;
  };

  const priorityEnabled = colVisible("priority");
  const effectiveMinStage = (r: string) => {
    if (r === "tc" && !priorityEnabled) return 1;
    return ROLE_MIN_STAGE[r] ?? 99;
  };
  const minStage = Math.min(...roles.map(effectiveMinStage));
  const canEdit = stage >= minStage;

  // Водитель (только водитель) — только свои заявки
  const isOnlyDriver = roles.length === 1 && roles[0] === "driver";
  const isMyOrder = !isOnlyDriver || order.driver_id === user.id;
  const editable = canEdit && isMyOrder;

  const deleteOrder = async () => {
    setDeleting(true);
    const res = await apiDeleteOrder(order.id);
    setDeleting(false);
    if (res.ok) { onSaved(); onClose(); }
    else setSaveError((res.error as string) || "Ошибка удаления");
  };

  const save = async () => {
    if (!Object.keys(fields).length && !(stage === 2 && roles.includes("ppb") && !order.ppb_name)) { onClose(); return; }
    setSaving(true); setSaveError("");
    try {
      const payload = { ...fields } as Record<string, string | number | boolean>;
      if (stage === 2 && roles.includes("ppb") && !order.ppb_name && payload.priority === undefined) {
        payload.priority = Number(val("priority") || 0);
      }
      const res = await apiUpdateOrder(order.id, payload);
      if (res.ok) { onSaved(); onClose(); }
      else setSaveError((res.error as string) || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const val = (k: string) => {
    if (fields[k] !== undefined) return String(fields[k]);
    const raw = (order as unknown as Record<string, unknown>)[k];
    if (k === "priority" && (raw === null || raw === undefined)) return "0";
    return raw === null || raw === undefined ? "" : String(raw);
  };

  const allowedFields = Array.from(new Set(roles.flatMap(r => ROLE_ALLOWED_FIELDS[r] ?? [])));
  const roleCanEditFieldAtStage = (role: string, fieldKey: string) => {
    const roleFields = ROLE_ALLOWED_FIELDS[role] ?? [];
    if (!roleFields.includes(fieldKey)) return false;
    return stage >= effectiveMinStage(role) && stage === (FIELD_MIN_STAGE[fieldKey] ?? 0);
  };
  const canEditField = (_roleFields: string[], k: string) =>
    editable && roles.some(r => roleCanEditFieldAtStage(r, k));

  const Input = ({ label, k, type = "text", roleFields }: {
    label: string; k: string; type?: string; roleFields: string[];
  }) => {
    const editable_ = canEditField(roleFields, k);
    return (
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#AAA] mb-1">{label}</label>
        {editable_ ? (
          <input type={type}
            className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1.5 text-sm outline-none focus:border-[#111]"
            value={val(k)} onChange={e => set(k, e.target.value)} placeholder="—" />
        ) : (
          <p className={`text-sm py-0.5 ${val(k) ? "text-[#111]" : "text-[#CCC]"}`}>
            {val(k) || "не заполнено"}
          </p>
        )}
      </div>
    );
  };

  const Select_ = ({ label, k, items, roleFields }: {
    label: string; k: string; items: RefItem[]; roleFields: string[];
  }) => {
    const editable_ = canEditField(roleFields, k);
    const currentVal = val(k);
    const found = items.find(i => String(i.id) === currentVal);
    return (
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#AAA] mb-1">{label}</label>
        {editable_ ? (
          <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1.5 text-sm outline-none focus:border-[#111]"
            value={currentVal} onChange={e => set(k, e.target.value)}>
            <option value="">— выберите —</option>
            {items.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
          </select>
        ) : (
          <p className={`text-sm py-0.5 ${found || currentVal ? "text-[#111]" : "text-[#CCC]"}`}>
            {found?.name || currentVal || "не заполнено"}
          </p>
        )}
      </div>
    );
  };

  // Поля по ролям
  const ppbFields = ["priority"];
  const tcFields = ["vehicle_id"];
  const masterFields = ["driver_id"];
  const driverFields = ["arrival_load_time", "load_start_time", "arrival_unload_time", "unload_start_time"];
  const senderFields = ["departure_load_time", "sender_sign"];
  const receiverFields = ["departure_unload_time", "receiver_sign", "done"];
  const noteFields = ["note"];

  const hasEdits = Object.keys(fields).length > 0;
  const canConfirmPriority = stage === 2 && roles.includes("ppb") && !order.ppb_name;

  const currentStageFields = Object.entries(FIELD_MIN_STAGE)
    .filter(([, min]) => min === stage)
    .map(([k]) => k);
  const canEditCurrentStage = roles.some(r => {
    if (stage < effectiveMinStage(r)) return false;
    const roleFields = ROLE_ALLOWED_FIELDS[r] ?? [];
    return currentStageFields.some(f => roleFields.includes(f));
  });
  const stageBlocked = !canEditCurrentStage;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="bg-white h-full w-full max-w-2xl overflow-y-auto animate-slide-in shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E0E0E0] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] text-[#999] font-mono mb-0.5">{order.order_num} · {order.created_date}</p>
            <h2 className="text-base font-semibold leading-tight">{order.cargo_name || "Заявка без груза"}</h2>
          </div>
          <div className="flex items-center gap-2">
            {(hasEdits || canConfirmPriority) && !stageBlocked && (
              <button onClick={save} disabled={saving}
                className="bg-[#111] text-white px-4 py-1.5 text-xs font-medium hover:bg-[#333] transition-colors disabled:opacity-50">
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            )}
            {roles.includes("admin") && (
              confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-red-600">Удалить?</span>
                  <button onClick={deleteOrder} disabled={deleting}
                    className="bg-red-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                    {deleting ? "..." : "Да"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 text-xs border border-[#E0E0E0] hover:bg-[#F0F0EE] transition-colors">
                    Нет
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-[#CCC] hover:text-red-500 transition-colors">
                  <Icon name="Trash2" size={15} />
                </button>
              )
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE]">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4 pb-4 border-b border-[#F0F0EE]">
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 9 }, (_, i) => {
              const stageColor = refs.stage_colors?.[i + 1] ?? "#6B7280";
              return (
                <div key={i} className="h-1.5 flex-1 rounded-sm transition-colors"
                  style={{ backgroundColor: i < stage ? stageColor : "#E8E8E8" }} />
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-[#888]">Этап {stage} из 9</p>
              <span className="text-[10px] font-medium px-2 py-0.5"
                style={{
                  backgroundColor: (refs.stage_colors?.[stage] ?? "#6B7280") + "22",
                  color: refs.stage_colors?.[stage] ?? "#6B7280",
                  border: `1px solid ${refs.stage_colors?.[stage] ?? "#6B7280"}55`
                }}>
                {refs.stage_labels?.[stage] ?? STAGE_LABELS[stage]}
              </span>
            </div>
            {stageBlocked && (
              <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5">
                Ваш этап ещё не наступил
              </span>
            )}
          </div>
          {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
        </div>

        {/* Участники заявки */}
        {(order.applicant_name || order.driver_name || order.tc_master_name || order.sender_sign || order.receiver_sign) && (
          <div className="px-6 py-3 border-b border-[#F0F0EE] bg-[#FAFAFA]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#BBB] mb-2">Участники</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {order.applicant_name && (
                <span className="text-[11px] text-[#666]">
                  <span className="text-[#BBB]">Заявитель:</span> {order.applicant_name}
                </span>
              )}
              {order.tc_master_name && (
                <span className="text-[11px] text-[#666]">
                  <span className="text-[#BBB]">Мастер ТЦ:</span> {order.tc_master_name}
                </span>
              )}
              {order.driver_name && (
                <span className="text-[11px] text-[#666]">
                  <span className="text-[#BBB]">Водитель:</span> {order.driver_name}
                </span>
              )}
              {order.sender_sign && (
                <span className="text-[11px] text-[#666]">
                  <span className="text-[#BBB]">Сдача:</span> {order.sender_sign}
                </span>
              )}
              {order.receiver_sign && (
                <span className="text-[11px] text-[#666]">
                  <span className="text-[#BBB]">Приём:</span> {order.receiver_sign}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-5 space-y-6 flex-1">

          {/* Блок 1: Заявка (кол. 1-7) — только просмотр для всех кроме admina */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className="w-5 h-5 bg-[#111] text-white flex items-center justify-center text-[9px] shrink-0">1</span>
              Заявка · Начальник цеха
              {order.applicant_name && (
                <span className="text-[#111] font-bold normal-case tracking-normal">— {order.applicant_name}</span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Подразделение</p>
                <p className="text-sm">{order.department || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Автор заявки</p>
                <p className="text-sm">{order.applicant_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Груз (кол. 3)</p>
                <p className="text-sm">{order.cargo_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Кол-во, шт (кол. 4)</p>
                <p className="text-sm">{order.quantity || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Дата/время подачи (кол. 5)</p>
                <p className="text-sm">{order.execution_date || "—"}</p>
              </div>
              <div />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Место погрузки (кол. 6)</p>
                <p className="text-sm">{order.load_place || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Место выгрузки (кол. 7)</p>
                <p className="text-sm">{order.unload_place || "—"}</p>
              </div>
            </div>
          </section>

          {/* Блок 2: ППБ — приоритет (кол. 8) — скрыт для начальника цеха и если колонка отключена */}
          {(roles.some(r => r === "ppb" || r === "admin") && colVisible("priority")) && (
          <section className={stage < 1 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 2 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>2</span>
              ППБ · Приоритет
              {order.ppb_name && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.ppb_name}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Приоритет 1–99 (кол. 8)" k="priority" type="number" roleFields={ppbFields} />
            </div>
          </section>
          )}

          {/* Блок 3: ТЦ — транспорт (кол. 9) */}
          {colVisible("vehicle_model") && (
          <section className={stage < (priorityEnabled ? 2 : 1) ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 3 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>3</span>
              Транспортный цех · Выбор техники
              {order.tc_name && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.tc_name}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select_ label="Транспорт (кол. 9)" k="vehicle_id" items={refs.vehicles} roleFields={tcFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Выбрано</p>
                <p className="text-sm">{order.vehicle_model || val("vehicle_id") && refs.vehicles.find(v => String(v.id) === val("vehicle_id"))?.name || "—"}</p>
              </div>
            </div>
          </section>
          )}

          {/* Блок 4: Мастер ТЦ — водитель (кол. 10) */}
          <section className={stage < 3 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 4 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>4</span>
              Мастер ТЦ · Назначение водителя
              {order.tc_master_name && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.tc_master_name}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select_ label="Водитель (кол. 10)" k="driver_id" items={refs.drivers} roleFields={masterFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Назначен</p>
                <p className="text-sm">{order.driver_name || "—"}</p>
              </div>
            </div>
          </section>

          {/* Блок 5: Погрузка — Водитель */}
          {colVisible("driver_name") && (
          <section className={stage < 4 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 5 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>5</span>
              Погрузка · Водитель
              {order.driver_name && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.driver_name}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Время заезда в цех (кол. 11)" k="arrival_load_time" type="time" roleFields={driverFields} />
              <Input label="Время начала погрузки (кол. 12)" k="load_start_time" type="time" roleFields={driverFields} />
            </div>
          </section>
          )}

          {/* Блок 6: Погрузка — Ответственный за сдачу */}
          {colVisible("sender_sign") && (
          <section className={stage < 5 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 6 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>6</span>
              Погрузка · Ответственный за сдачу
              {order.sender_sign && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.sender_sign}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Время выезда из цеха (кол. 13)" k="departure_load_time" type="time" roleFields={senderFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Ответственный за сдачу (кол. 14)</p>
                {roles.includes("sender") && editable ? (
                  <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-2.5 py-1.5 text-sm text-[#888]">
                    {user.name} <span className="text-[10px] text-[#AAA]">(автоматически)</span>
                  </div>
                ) : (
                  <p className={`text-sm py-0.5 ${order.sender_sign ? "text-[#111]" : "text-[#CCC]"}`}>
                    {order.sender_sign || "не заполнено"}
                  </p>
                )}
              </div>
            </div>
          </section>
          )}

          {/* Блок 7: Разгрузка — Водитель */}
          {colVisible("driver_name") && (
          <section className={stage < 6 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 7 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>7</span>
              Разгрузка · Водитель
              {order.driver_name && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.driver_name}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Время заезда в цех (кол. 15)" k="arrival_unload_time" type="time" roleFields={driverFields} />
              <Input label="Время начала разгрузки (кол. 16)" k="unload_start_time" type="time" roleFields={driverFields} />
            </div>
          </section>
          )}

          {/* Блок 8: Разгрузка — Ответственный за приём */}
          {colVisible("receiver_sign") && (
          <section className={stage < 7 ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage >= 8 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>8</span>
              Разгрузка · Ответственный за приём
              {order.receiver_sign && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.receiver_sign}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Время выезда из цеха (кол. 17)" k="departure_unload_time" type="time" roleFields={receiverFields} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Ответственный за приём (кол. 18)</p>
                {roles.includes("receiver") && editable ? (
                  <div className="border border-[#E0E0E0] bg-[#F0F0EE] px-2.5 py-1.5 text-sm text-[#888]">
                    {user.name} <span className="text-[10px] text-[#AAA]">(автоматически)</span>
                  </div>
                ) : (
                  <p className={`text-sm py-0.5 ${order.receiver_sign ? "text-[#111]" : "text-[#CCC]"}`}>
                    {order.receiver_sign || "не заполнено"}
                  </p>
                )}
              </div>
            </div>
          </section>
          )}

          {/* Блок 9: Завершение */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-3 flex items-center gap-2 flex-wrap">
              <span className={`w-5 h-5 flex items-center justify-center text-[9px] shrink-0 ${stage === 9 ? "bg-[#111] text-white" : "bg-[#E8E8E8] text-[#999]"}`}>9</span>
              Завершение · Начальник цеха + Примечание
              {order.applicant_name && <span className="text-[#111] font-bold normal-case tracking-normal">— {order.applicant_name}</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-0.5">Статус выполнения (кол. 20)</p>
                {roles.includes("shop_chief") && editable ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={Boolean(fields["done"] !== undefined ? fields["done"] : order.done)}
                      onChange={e => set("done", e.target.checked)}
                      className="w-4 h-4 accent-black" />
                    <span className="text-sm">Выполнено</span>
                  </label>
                ) : (
                  <p className={`text-sm py-0.5 font-medium ${order.done ? "text-emerald-600" : "text-[#888]"}`}>
                    {order.done ? "Выполнено" : "В работе"}
                  </p>
                )}
              </div>
              {/* Примечание — все могут видеть, shop_chief может редактировать */}
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-[#AAA] mb-1">Примечание (кол. 19)</p>
                {roles.includes("shop_chief") || roles.includes("admin") ? (
                  <textarea rows={2}
                    className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1.5 text-sm outline-none focus:border-[#111] resize-none"
                    value={String(fields["note"] !== undefined ? fields["note"] : order.note || "")}
                    onChange={e => set("note", e.target.value)} placeholder="Примечание" />
                ) : (
                  <p className={`text-sm py-0.5 ${order.note ? "text-[#111]" : "text-[#CCC]"}`}>
                    {order.note || "—"}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ──────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refs, setRefs] = useState<Refs>({ departments: [], cargo_types: [], locations: [], vehicles: [], drivers: [] });
  const [branding, setBranding] = useState({
    headerTitle: "ТрансДеталь",
    headerIcon: "Truck",
    headerIconData: "",
    headerTitleColor: "#111111",
    processName: "",
    processNameColor: "#666666",
  });
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [deletingMany, setDeletingMany] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setAuthLoading(false); return; }
    apiMe()
      .then(res => { if (res.user) setUser(res.user); })
      .catch(() => { localStorage.removeItem("token"); })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    apiGetRefs()
      .then((data) => {
        const appConfig = (data as Refs).app_config || {};
        setBranding({
          headerTitle: appConfig.header_title || "ТрансДеталь",
          headerIcon: appConfig.header_icon || "Truck",
          headerIconData: appConfig.header_icon_data || "",
          headerTitleColor: appConfig.header_title_color || "#111111",
          processName: appConfig.process_name || "",
          processNameColor: appConfig.process_name_color || "#666666",
        });
      })
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    const data = await apiGetOrders();
    if (Array.isArray(data)) setOrders(data);
  }, []);

  const handleDeleteOrder = async (id: number) => {
    setDeletingId(id);
    const res = await apiDeleteOrder(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (res.ok) loadOrders();
  };

  const existingOrderIds = new Set(orders.map(o => o.id));
  const selectedExistingOrderIds = selectedOrderIds.filter(id => existingOrderIds.has(id));

  useEffect(() => {
    setSelectedOrderIds(prev => prev.filter(id => existingOrderIds.has(id)));
  }, [orders]);

  const handleDeleteSelectedOrders = async () => {
    if (!selectedExistingOrderIds.length) {
      alert("Нет выбранных актуальных заявок для удаления.");
      return;
    }
    if (!confirm(`Удалить выбранные заявки (${selectedExistingOrderIds.length})?`)) return;
    setDeletingMany(true);
    const res = await apiDeleteOrder(selectedExistingOrderIds);
    setDeletingMany(false);
    if (res.ok) {
      setSelectedOrderIds([]);
      loadOrders();
      return;
    }
    alert(typeof res.error === "string" ? res.error : "Не удалось удалить выбранные заявки.");
  };

  const loadRefs = useCallback(async () => {
    const data = await apiGetRefs();
    if (data.vehicles) {
      if (data.stage_labels) {
        const normalized: Record<number, string> = {};
        Object.entries(data.stage_labels as Record<string, string>).forEach(([k, v]) => { normalized[Number(k)] = v; });
        data.stage_labels = normalized;
      }
      if (data.stage_colors) {
        const normalizedColors: Record<number, string> = {};
        Object.entries(data.stage_colors as Record<string, string>).forEach(([k, v]) => { normalizedColors[Number(k)] = v; });
        data.stage_colors = normalizedColors;
      }
      const appConfig = (data as Refs).app_config || {};
      setBranding({
        headerTitle: appConfig.header_title || "ТрансДеталь",
        headerIcon: appConfig.header_icon || "Truck",
        headerIconData: appConfig.header_icon_data || "",
        headerTitleColor: appConfig.header_title_color || "#111111",
        processName: appConfig.process_name || "",
        processNameColor: appConfig.process_name_color || "#666666",
      });
      setRefs(data);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    const data = await apiGetLogs();
    if (Array.isArray(data)) setLogs(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadRefs();
  }, [user, loadOrders, loadRefs]);

  useEffect(() => {
    if (!user || tab !== "history") return;
    loadLogs();
  }, [user, tab, loadLogs]);

  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  const userRoles = user?.roles?.length ? user.roles : (user?.role ? [user.role] : []);
  const isShopChief = userRoles.some(r => r === "shop_chief" || r === "admin");
  const headerTitle = refs.app_config?.header_title || branding.headerTitle || "ТрансДеталь";
  const headerIcon = refs.app_config?.header_icon || branding.headerIcon || "Truck";
  const headerIconData = refs.app_config?.header_icon_data || branding.headerIconData || "";
  const headerTitleColor = refs.app_config?.header_title_color || branding.headerTitleColor || "#111111";
  const processName = refs.app_config?.process_name || branding.processName || "";
  const processNameColor = refs.app_config?.process_name_color || branding.processNameColor || "#666666";

  const filtered = stageFilter === "all"
    ? orders
    : orders.filter(o => String(o.stage || 1) === stageFilter);
  const filteredIds = filtered.map(o => o.id);
  const isAllFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedExistingOrderIds.includes(id));

  const total = orders.length;
  const done = orders.filter(o => o.done).length;
  const canExport = userRoles.includes("admin") || userRoles.includes("analyst");

  const allConfig = refs.column_config && refs.column_config.length > 0 ? refs.column_config : ORDER_COL_DEFAULTS;
  const rowHighlightEnabled = allConfig.find(c => c.key === "row_highlight")?.visible ?? false;
  const visibleOrderCols = allConfig
    .filter(c => c.visible && c.key !== "row_highlight")
    .sort((a, b) => a.sort_order - b.sort_order);

  const orderValueByKey = (o: Order, key: string): string | number => {
    const s = o.stage || 1;
    if (key === "order_num") return o.order_num;
    if (key === "created_date") return o.execution_date || o.created_date;
    if (key === "cargo") return `${o.cargo_name || ""}${o.department ? ` (${o.department})` : ""}`.trim();
    if (key === "quantity") return o.quantity || "";
    if (key === "priority") return o.priority ?? "";
    if (key === "places") return `${o.load_place || "—"} -> ${o.unload_place || "—"}`;
    if (key === "applicant_name") return o.applicant_name || "";
    if (key === "ppb_name") return o.ppb_name || "";
    if (key === "tc_name") return toSurnameInitials(o.tc_name) || "";
    if (key === "tc_master_name") return o.tc_master_name || "";
    if (key === "driver_name") return o.driver_name || "";
    if (key === "vehicle_model") return o.vehicle_model || "";
    if (key === "sender_sign") return o.sender_sign || "";
    if (key === "receiver_sign") return o.receiver_sign || "";
    if (key === "stage") return refs.stage_labels?.[s] ?? STAGE_LABELS[s];
    return String((o as unknown as Record<string, unknown>)[key] ?? "");
  };

  const stageFillColor = (o: Order): string | null => {
    if (!rowHighlightEnabled) return null;
    const hex = refs.stage_colors?.[o.stage] ?? "#6B7280";
    return hex.replace("#", "").toUpperCase().padStart(6, "0");
  };

  const exportOrders = async (format: "csv" | "xls" | "xlsx") => {
    const headers = visibleOrderCols.map(c => c.label);
    if (format === "csv") {
      const rows = filtered.map((o) => {
        const out: Record<string, string | number> = {};
        visibleOrderCols.forEach((c) => { out[c.label] = orderValueByKey(o, c.key); });
        return out;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "orders");
      XLSX.writeFile(wb, "orders_export.csv", { bookType: "csv" });
      return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("orders");
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };

    filtered.forEach((o) => {
      const row = ws.addRow(visibleOrderCols.map((c) => orderValueByKey(o, c.key)));
      if (rowHighlightEnabled) {
        const fill = stageFillColor(o);
        if (fill) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: `FF${fill}` },
            };
          });
        }
      }
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders_export.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportRefsData = (format: "csv" | "xls" | "xlsx") => {
    const groups = [
      { name: "departments", rows: refs.departments },
      { name: "cargo_types", rows: refs.cargo_types },
      { name: "locations", rows: refs.locations },
      { name: "vehicles", rows: refs.vehicles },
    ];
    const wb = XLSX.utils.book_new();
    if (format === "csv") {
      const merged = groups.flatMap((g) => g.rows.map((r) => ({ dictionary: g.name, id: r.id, name: r.name })));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(merged), "refs");
      XLSX.writeFile(wb, "references_export.csv", { bookType: "csv" });
      return;
    }
    groups.forEach((g) => {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(g.rows.map((r) => ({ id: r.id, name: r.name }))),
        g.name.slice(0, 31)
      );
    });
    XLSX.writeFile(wb, `references_export.${format}`, { bookType: format });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] font-ibm flex items-center justify-center">
        <p className="text-sm text-[#999]">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={u => setUser(u)}
        headerTitle={branding.headerTitle}
        headerIcon={branding.headerIcon}
        headerIconData={branding.headerIconData}
        headerTitleColor={branding.headerTitleColor}
        processName={branding.processName}
        processNameColor={branding.processNameColor}
      />
    );
  }

  if (showAdmin && userRoles.includes("admin")) {
    return <Admin onBack={() => { setShowAdmin(false); loadRefs(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm text-[#111]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${headerIconData && headerIconData !== "-" ? "" : "bg-[#111]"}`}>
                {headerIconData && headerIconData !== "-" ? (
                  <img src={headerIconData} alt="Лого" className="w-6 h-6 object-cover" />
                ) : (
                  <Icon name={headerIcon} size={14} className="text-white" />
                )}
              </div>
              <span
                className="font-semibold text-[22px] leading-[22px] tracking-wide uppercase"
                style={{ color: headerTitleColor }}
              >
                {headerTitle}
              </span>
            </div>
            {processName.trim() && (
              <p className="text-[16px] leading-[16px] mt-0.5 ml-10" style={{ color: processNameColor }}>{processName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[10px] text-[#AAA]">{userRoles.map(r => (refs.role_labels?.[r]) ?? ROLE_LABELS[r] ?? r).join(", ")} · {user.department_name}</p>
            </div>
            {userRoles.includes("admin") && (
              <button onClick={() => setShowAdmin(true)} title="Администрирование"
                className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
                <Icon name="Settings" size={14} className="text-[#888]" />
              </button>
            )}
            <button onClick={logout} title="Выйти"
              className="w-8 h-8 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
              <Icon name="LogOut" size={14} className="text-[#888]" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex border border-[#E0E0E0] bg-white w-fit mb-6">
          {([
            { key: "orders", label: "Заявки", icon: "Package" },
            { key: "reports", label: "Отчёты", icon: "BarChart2" },
            { key: "history", label: "История", icon: "Clock" },
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-r border-[#E0E0E0] last:border-r-0 ${tab === t.key ? "bg-[#111] text-white" : "text-[#555] hover:bg-[#F0F0EE]"}`}>
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ЗАЯВКИ ── */}
        {tab === "orders" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <select
                  className="border border-[#E0E0E0] bg-white px-3 py-1.5 text-xs font-medium text-[#666] outline-none focus:border-[#111] min-w-[240px]"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <option value="all">Все этапы</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((stageNum) => (
                    <option key={stageNum} value={String(stageNum)}>
                      {stageNum}. {refs.stage_labels?.[stageNum] ?? STAGE_LABELS[stageNum]}
                    </option>
                  ))}
                </select>
                {canExport && (
                  <select
                    className="border border-[#E0E0E0] bg-white px-3 py-1.5 text-xs font-medium text-[#666] outline-none focus:border-[#111]"
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value as "" | "csv" | "xls" | "xlsx";
                      if (!v) return;
                      void exportOrders(v);
                      e.currentTarget.value = "";
                    }}
                  >
                    <option value="">Экспорт заявок...</option>
                    <option value="csv">CSV</option>
                    <option value="xls">XLS</option>
                    <option value="xlsx">XLSX</option>
                  </select>
                )}
              </div>
              <div className="flex gap-2 items-center">
                {userRoles.includes("admin") && (
                  <>
                    <button
                      onClick={handleDeleteSelectedOrders}
                      disabled={selectedExistingOrderIds.length === 0 || deletingMany}
                      className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 text-xs font-medium hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon name="Trash2" size={13} />
                      {deletingMany ? "Удаление..." : `Удалить выбранные (${selectedExistingOrderIds.length})`}
                    </button>
                  </>
                )}
                <button onClick={loadOrders} title="Обновить"
                  className="border border-[#E0E0E0] px-3 py-2 hover:bg-[#F0F0EE] transition-colors">
                  <Icon name="RefreshCw" size={13} className="text-[#888]" />
                </button>
                {isShopChief && (
                  <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] transition-colors">
                    <Icon name="Plus" size={13} />
                    Новая заявка
                  </button>
                )}
              </div>
            </div>

            {showForm && isShopChief && (
              <NewOrderForm user={user} refs={refs} onClose={() => setShowForm(false)} onCreated={loadOrders} />
            )}

            {/* Таблица */}
            {(() => {
              const cols = visibleOrderCols;

              const COL_WIDTHS: Record<string, string> = {
                order_num: "80px", created_date: "90px", cargo: "1fr",
                quantity: "55px", priority: "90px", places: "180px",
                applicant_name: "120px", ppb_name: "170px", tc_name: "140px", tc_master_name: "120px",
                driver_name: "120px", sender_sign: "120px", receiver_sign: "120px",
                stage: "110px",
              };
              const gridTemplate = cols.map(c => COL_WIDTHS[c.key] || "100px").join(" ");

              const renderCell = (o: Order, key: string) => {
                const s = o.stage || 1;
                if (key === "order_num") return <div className="px-3 py-3 text-[11px] font-mono text-[#888]">{o.order_num}</div>;
                if (key === "created_date") {
                  const execDate = o.execution_date
                    ? (() => {
                        const m = o.execution_date.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
                        return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : o.execution_date;
                      })()
                    : null;
                  return (
                    <div className="px-3 py-3 text-xs text-[#666]">
                      {execDate ? <div>{execDate}</div> : <div>{o.created_date}</div>}
                    </div>
                  );
                }
                if (key === "cargo") return (
                  <div className="px-3 py-3">
                    <p className="text-sm font-medium leading-tight">{o.cargo_name || <span className="text-[#CCC]">не указан</span>}</p>
                    <p className="text-[11px] text-[#AAA] mt-0.5">{o.department}</p>
                  </div>
                );
                if (key === "quantity") return <div className="px-3 py-3 text-sm text-[#555]">{o.quantity || "—"}</div>;
                if (key === "priority") return (
                  <div className="px-3 py-3">
                    <span className={`text-xs font-bold ${o.priority !== null && o.priority <= 5 ? "text-red-600" : o.priority !== null && o.priority <= 20 ? "text-amber-600" : "text-[#AAA]"}`}>
                      {o.priority ?? "—"}
                    </span>
                  </div>
                );
                if (key === "places") return (
                  <div className="px-3 py-3 text-xs text-[#666]">
                    <p className="truncate">{o.load_place || "—"}</p>
                    <p className="truncate text-[#AAA] mt-0.5">{o.unload_place || "—"}</p>
                  </div>
                );
                if (key === "applicant_name") return <div className="px-3 py-3 text-xs">{o.applicant_name || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "ppb_name") return <div className="px-3 py-3 text-xs">{o.ppb_name || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "tc_name") return <div className="px-3 py-3 text-xs">{toSurnameInitials(o.tc_name) || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "tc_master_name") return <div className="px-3 py-3 text-xs">{o.tc_master_name || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "driver_name") return <div className="px-3 py-3 text-xs">{o.driver_name || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "vehicle_model") return <div className="px-3 py-3 text-xs">{o.vehicle_model || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "sender_sign") return <div className="px-3 py-3 text-xs">{o.sender_sign || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "receiver_sign") return <div className="px-3 py-3 text-xs">{o.receiver_sign || <span className="text-[#CCC]">—</span>}</div>;
                if (key === "stage") {
                  const hexColor = refs.stage_colors?.[s] ?? "#6B7280";
                  return (
                    <div className="px-3 py-3">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 inline-block w-[15ch] text-center leading-tight break-words whitespace-normal"
                        style={{ backgroundColor: hexColor + "22", color: hexColor, border: `1px solid ${hexColor}55` }}
                      >
                        {refs.stage_labels?.[s] ?? STAGE_LABELS[s]}
                      </span>
                    </div>
                  );
                }
                return <div className="px-3 py-3" />;
              };

              const isAdmin = userRoles.includes("admin");
              const leftAdminCol = isAdmin ? "32px " : "";
              const rightAdminCol = isAdmin ? " 80px" : "";
              const fullGrid = leftAdminCol + gridTemplate + rightAdminCol;
              const minTableWidth = cols.reduce((sum, c) => {
                const w = COL_WIDTHS[c.key] || "100px";
                return sum + (w === "1fr" ? 200 : parseInt(w));
              }, isAdmin ? 112 : 0) + "px";

              return (
                <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
                  <div className="grid bg-[#F7F7F5] border-b border-[#E0E0E0]" style={{ gridTemplateColumns: fullGrid, minWidth: minTableWidth }}>
                    {isAdmin && (
                      <div className="px-1 py-2.5 flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-black"
                          checked={isAllFilteredSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrderIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                            } else {
                              setSelectedOrderIds(prev => prev.filter(id => !filteredIds.includes(id)));
                            }
                          }}
                        />
                      </div>
                    )}
                    {cols.map(c => (
                      <div key={c.key} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999] leading-tight break-words whitespace-normal">{c.label}</div>
                    ))}
                    {isAdmin && <div className="px-3 py-2.5" />}
                  </div>
                  {filtered.length === 0 && (
                    <div className="py-16 text-center text-sm text-[#BBB]">
                      {orders.length === 0 ? "Нет заявок. Нажмите «Новая заявка»." : "Нет заявок по фильтру."}
                    </div>
                  )}
                  {filtered.map((o, i) => {
                    const rowColor = rowHighlightEnabled ? (refs.stage_colors?.[o.stage] ?? "#6B7280") : null;
                    return (
                    <div key={o.id}
                      className={`grid border-b transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                      style={{
                        gridTemplateColumns: fullGrid, minWidth: minTableWidth,
                        borderBottomColor: rowColor ? rowColor + "33" : "#F0F0EE",
                        backgroundColor: rowColor ? rowColor + "0D" : undefined,
                      }}
                      onMouseEnter={e => { if (!rowColor) (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAFA"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = rowColor ? rowColor + "0D" : ""; }}
                    >
                      {isAdmin && (
                        <div className="flex items-center justify-center px-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-black"
                            checked={selectedOrderIds.includes(o.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedOrderIds(prev => checked ? (prev.includes(o.id) ? prev : [...prev, o.id]) : prev.filter(id => id !== o.id));
                            }}
                          />
                        </div>
                      )}
                      {cols.map(c => (
                        <div key={c.key} className="cursor-pointer" onClick={() => setSelectedOrder(o)}>
                          {renderCell(o, c.key)}
                        </div>
                      ))}
                      {isAdmin && (
                        <div className="flex items-center justify-center px-2" onClick={e => e.stopPropagation()}>
                          {confirmDeleteId === o.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDeleteOrder(o.id)} disabled={deletingId === o.id}
                                className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-medium hover:bg-red-700 disabled:opacity-50">
                                {deletingId === o.id ? "..." : "Да"}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 text-[10px] border border-[#E0E0E0] hover:bg-[#F0F0EE]">
                                Нет
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(o.id)}
                              className="w-7 h-7 flex items-center justify-center text-[#CCC] hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Icon name="Trash2" size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              );
            })()}
            <p className="text-[11px] text-[#AAA] mt-2">
              Показано {filtered.length} из {orders.length} · нажмите строку для заполнения
            </p>
          </div>
        )}

        {/* ── ОТЧЁТЫ ── */}
        {tab === "reports" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E0E0E0] border border-[#E0E0E0] mb-6">
              {[
                { label: "Всего заявок", value: String(total), sub: "в базе" },
                { label: "Выполнено", value: String(done), sub: total ? `${Math.round(done / total * 100)}%` : "0%" },
                { label: "В работе", value: String(total - done), sub: "активных" },
                { label: "Срочных", value: String(orders.filter(o => o.priority !== null && o.priority <= 5 && !o.done).length), sub: "приоритет ≤5" },
              ].map(s => (
                <div key={s.label} className="bg-white px-6 py-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#999] mb-1">{s.label}</p>
                  <p className="text-3xl font-semibold">{s.value}</p>
                  <p className="text-xs text-[#888] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-[#E0E0E0] p-6">
              <p className="text-[10px] uppercase tracking-wider text-[#999] mb-4">По этапам</p>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(s => {
                const count = orders.filter(o => (o.stage || 1) === s).length;
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="text-[10px] text-[#888] w-4">{s}</span>
                    <span className="text-xs w-36 shrink-0">{refs.stage_labels?.[s] ?? STAGE_LABELS[s]}</span>
                    <div className="flex-1 h-1.5 bg-[#F0F0EE]">
                      <div className="h-full bg-[#111] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[#AAA] w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ИСТОРИЯ ── */}
        {tab === "history" && (
          <div className="animate-fade-in">
            <div className="bg-white border border-[#E0E0E0] overflow-x-auto">
              <div className="grid grid-cols-[180px_1fr_220px_100px] min-w-[700px] border-b border-[#E0E0E0] bg-[#F7F7F5]">
                {["Пользователь", "Действие", "Объект", "Время"].map(h => (
                  <div key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#999]">{h}</div>
                ))}
              </div>
              {logs.length === 0 && <div className="py-12 text-center text-sm text-[#BBB]">История пуста</div>}
              {logs.map((l, i) => (
                <div key={i} className={`grid grid-cols-[180px_1fr_220px_100px] min-w-[700px] border-b border-[#F0F0EE] hover:bg-[#FAFAFA] ${i === logs.length - 1 ? "border-b-0" : ""}`}>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                      <Icon name="User" size={10} className="text-[#666]" />
                    </div>
                    <span className="text-xs text-[#555] truncate">{l.user_name}</span>
                  </div>
                  <div className="px-4 py-3 text-sm">{l.action}</div>
                  <div className="px-4 py-3 text-xs font-mono text-[#888]">{l.target}</div>
                  <div className="px-4 py-3 text-xs text-[#AAA]">{l.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderPanel order={selectedOrder} user={user} refs={refs}
          onClose={() => setSelectedOrder(null)} onSaved={loadOrders} />
      )}
    </div>
  );
}