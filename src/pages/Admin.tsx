import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import * as XLSX from "xlsx";
import { apiAdminList, apiAdminAdd, apiAdminEdit, apiAdminDelete, apiAdminSaveColumns, apiAdminImportRefs } from "@/api";

interface RefItem { id: number; name: string; }
interface UserItem {
  id: number; name: string; login: string;
  role: string; roles: string[]; department_id: number | null; dept_name: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  shop_chief: "Начальник цеха", ppb: "ППБ", tc: "Транспортный цех",
  tc_master: "Мастер ТЦ", driver: "Водитель",
  sender: "Отв. за сдачу", receiver: "Отв. за приём", analyst: "Аналитики", admin: "Администратор",
};
const ROLES = Object.keys(ROLE_LABELS);

type Section = "cargo_types" | "locations" | "vehicles" | "departments" | "users" | "role_labels" | "stage_labels" | "column_config" | "app_config";
const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "departments",  label: "Подразделения",   icon: "Building2" },
  { key: "cargo_types",  label: "Грузы",            icon: "Package" },
  { key: "locations",    label: "Места погр./выгр.", icon: "MapPin" },
  { key: "vehicles",     label: "Техника",           icon: "Truck" },
  { key: "users",        label: "Пользователи",      icon: "Users" },
  { key: "role_labels",  label: "Группы",            icon: "ShieldCheck" },
  { key: "stage_labels", label: "Статусы",           icon: "Tag" },
  { key: "column_config", label: "Столбцы таблицы",  icon: "Columns" },
  { key: "app_config",   label: "Заголовок окна",    icon: "Palette" },
];

// ── Редактируемая строка справочника ───────────────────────────────────────
function RefRow({ item, onSave, onDelete, selected, onToggle }: {
  item: RefItem;
  onSave: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  selected: boolean;
  onToggle: (id: number, checked: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.name);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!val.trim() || val === item.name) { setEditing(false); return; }
    setLoading(true);
    await onSave(item.id, val.trim());
    setLoading(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-[#F0F0EE] last:border-b-0 group">
      <input
        type="checkbox"
        className="w-4 h-4 accent-black"
        checked={selected}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      />
      {editing ? (
        <>
          <input autoFocus
            className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1 text-sm outline-none focus:border-[#111]"
            value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setVal(item.name); } }}
          />
          <button onClick={save} disabled={loading}
            className="bg-[#111] text-white px-3 py-1 text-xs hover:bg-[#333] disabled:opacity-50">
            {loading ? "..." : "OK"}
          </button>
          <button onClick={() => { setEditing(false); setVal(item.name); }}
            className="border border-[#E0E0E0] px-3 py-1 text-xs hover:bg-[#F0F0EE]">Отмена</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{item.name}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#F0F0EE] transition-colors">
              <Icon name="Pencil" size={12} className="text-[#888]" />
            </button>
            <button onClick={() => onDelete(item.id)}
              className="w-7 h-7 flex items-center justify-center hover:bg-red-50 transition-colors">
              <Icon name="Trash2" size={12} className="text-[#CCC] hover:text-red-500" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Панель справочника (грузы / места / техника / подразделения) ───────────
function RefPanel({ resource, label }: { resource: Section; label: string }) {
  const [items, setItems] = useState<RefItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState<(string | number | null)[][]>([]);
  const [importColumns, setImportColumns] = useState<{ index: number; label: string }[]>([]);
  const [selectedImportColumn, setSelectedImportColumn] = useState<number>(0);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [csvEncoding, setCsvEncoding] = useState("auto");
  const [importBuffer, setImportBuffer] = useState<ArrayBuffer | null>(null);
  const [importIsCsv, setImportIsCsv] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await apiAdminList(resource);
    if (Array.isArray(data)) setItems(data);
    setSelectedIds([]);
    setLoading(false);
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true); setError("");
    try {
      const res = await apiAdminAdd(resource, { name: newName.trim() });
      if (res.id) { setNewName(""); load(); }
      else setError((res.error as string) || "Ошибка добавления");
    } finally {
      setAdding(false);
    }
  };

  const save = async (id: number, name: string) => {
    await apiAdminEdit(resource, { id, name });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить запись?")) return;
    const res = await apiAdminDelete(resource, id);
    if (res.ok) load();
    else alert(res.error || "Нельзя удалить — запись используется");
  };

  const delSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить выбранные записи (${selectedIds.length})?`)) return;
    const results = await Promise.all(selectedIds.map(id => apiAdminDelete(resource, id)));
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) load();
    else alert((failed[0].error as string) || "Не удалось удалить часть выбранных записей");
  };

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter(x => x !== id);
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map(i => i.id) : []);
  };

  const resetImportState = () => {
    setImportRows([]);
    setImportColumns([]);
    setSelectedImportColumn(0);
    setHasHeaderRow(true);
    setCsvEncoding("auto");
    setImportBuffer(null);
    setImportIsCsv(false);
  };

  const buildImportTable = (data: ArrayBuffer, isCsv: boolean, forcedEncoding = "auto") => {
    const selectedEncoding = forcedEncoding;

    const repairMojibake = (input: string): string => {
      // Чиним только явную моджибейку вида "РўРµС..." (не трогаем нормальный русский текст)
      const pairs = (input.match(/(?:Р[А-Яа-яЁё]|С[А-Яа-яЁё]|Ð.|Ñ.)/g) || []).length;
      if (pairs < 2) return input;
      try {
        const bytes = new Uint8Array(Array.from(input).map((ch) => ch.charCodeAt(0) & 0xff));
        const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        const cyr = (s: string) => (s.match(/[А-Яа-яЁё]/g) || []).length;
        const bad = (s: string) => (s.match(/�/g) || []).length;
        return cyr(repaired) > cyr(input) || bad(repaired) < bad(input) ? repaired : input;
      } catch {
        return input;
      }
    };

    const decodeCsv = (buf: ArrayBuffer): string => {
      const bomUtf16Le = new Uint8Array(buf.slice(0, 2));
      const hasUtf16LeBom = bomUtf16Le.length === 2 && bomUtf16Le[0] === 0xff && bomUtf16Le[1] === 0xfe;
      const encodings = selectedEncoding === "auto"
        ? ["utf-8", "windows-1251", "ibm866", "koi8-r", ...(hasUtf16LeBom ? ["utf-16le"] : [])]
        : [selectedEncoding];
      const variants = encodings.map((enc) => new TextDecoder(enc, { fatal: false }).decode(buf));
      const score = (s: string) => {
        const bad = (s.match(/�/g) || []).length;
        const mojibake = (s.match(/[ÐÑ]/g) || []).length + (s.match(/Р[А-Яа-яЁё]/g) || []).length + (s.match(/С[А-Яа-яЁё]/g) || []).length;
        const cyr = (s.match(/[А-Яа-яЁё]/g) || []).length;
        return cyr - bad * 10 - mojibake * 4;
      };
      const best = variants.sort((a, b) => score(b) - score(a))[0] || "";
      return repairMojibake(best);
    };

    const workbook = isCsv
      ? XLSX.read(decodeCsv(data), { type: "string" })
      : XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, { header: 1, raw: false });
    const normalizedRows = rows.map((r) =>
      (Array.isArray(r) ? r : []).map((v) => (typeof v === "string" ? repairMojibake(v).trim() : v))
    );
    return normalizedRows;
  };

  const parseImportFile = async (file: File) => {
    setError("");
    try {
      const data = await file.arrayBuffer();
      const isCsv = /\.csv$/i.test(file.name) || file.type.includes("csv");
      setImportBuffer(data);
      setImportIsCsv(isCsv);
      const normalizedRows = buildImportTable(data, isCsv, "auto");
      if (!normalizedRows.length) {
        setError("Файл пуст");
        return;
      }
      const maxCols = normalizedRows.reduce((acc, row) => Math.max(acc, Array.isArray(row) ? row.length : 0), 0);
      if (maxCols === 0) {
        setError("В файле нет колонок");
        return;
      }
      const headerRow = normalizedRows[0] || [];
      const cols = Array.from({ length: maxCols }, (_, i) => {
        const raw = String((headerRow as (string | number | null)[])[i] ?? "").trim();
        return {
          index: i,
          label: raw ? `${raw} (колонка ${i + 1})` : `Колонка ${i + 1}`,
        };
      });
      setImportRows(normalizedRows);
      setImportColumns(cols);
      setSelectedImportColumn(0);
      setHasHeaderRow(true);
    } catch {
      setError("Не удалось прочитать файл (поддерживаются .xlsx, .xls, .csv)");
    }
  };

  const reparseWithEncoding = (encoding: string) => {
    setCsvEncoding(encoding);
    if (!importBuffer || !importIsCsv) return;
    try {
      const normalizedRows = buildImportTable(importBuffer, true, encoding);
      if (!normalizedRows.length) return;
      const maxCols = normalizedRows.reduce((acc, row) => Math.max(acc, Array.isArray(row) ? row.length : 0), 0);
      if (maxCols === 0) return;
      const headerRow = normalizedRows[0] || [];
      const cols = Array.from({ length: maxCols }, (_, i) => {
        const raw = String((headerRow as (string | number | null)[])[i] ?? "").trim();
        return {
          index: i,
          label: raw ? `${raw} (колонка ${i + 1})` : `Колонка ${i + 1}`,
        };
      });
      setImportRows(normalizedRows);
      setImportColumns(cols);
      if (selectedImportColumn >= maxCols) setSelectedImportColumn(0);
    } catch {
      setError("Не удалось перекодировать CSV");
    }
  };

  const importSelectedColumn = async () => {
    if (!importRows.length || !importColumns.length) return;
    setImporting(true);
    setError("");
    try {
      const sourceRows = hasHeaderRow ? importRows.slice(1) : importRows;
      const names = sourceRows
        .map((r) => (Array.isArray(r) ? String(r[selectedImportColumn] ?? "").trim() : ""))
        .filter(Boolean);
      if (names.length === 0) { setError("В выбранной колонке нет данных для импорта"); return; }
      const res = await apiAdminImportRefs(resource, names);
      if (res.ok) {
        alert(`Импорт завершен: добавлено ${res.added}, пропущено ${res.skipped}`);
        resetImportState();
        load();
      } else {
        setError((res.error as string) || "Ошибка импорта");
      }
    } finally {
      setImporting(false);
    }
  };

  const exportRefData = (format: "csv" | "xls" | "xlsx") => {
    const rows = items.map((x) => ({ id: x.id, name: x.name }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "data");
    XLSX.writeFile(wb, `${resource}_export.${format}`, { bookType: format });
  };

  return (
    <div>
      {/* Форма добавления */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
          placeholder={`Новая запись в «${label}»`}
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
        />
        <button onClick={add} disabled={adding || !newName.trim()}
          className="bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-40 flex items-center gap-1.5">
          <Icon name="Plus" size={12} />
          Добавить
        </button>
        <label className="border border-[#E0E0E0] px-4 py-2 text-xs font-medium hover:bg-[#F0F0EE] cursor-pointer flex items-center gap-1.5">
          <Icon name="FileSpreadsheet" size={12} />
          {importing ? "Импорт..." : "Импорт Excel/CSV"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void parseImportFile(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <select
          className="border border-[#E0E0E0] bg-white px-3 py-2 text-xs font-medium text-[#666] outline-none focus:border-[#111]"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value as "" | "csv" | "xls" | "xlsx";
            if (!v) return;
            exportRefData(v);
            e.currentTarget.value = "";
          }}
        >
          <option value="">Экспорт справочника...</option>
          <option value="csv">CSV</option>
          <option value="xls">XLS</option>
          <option value="xlsx">XLSX</option>
        </select>
      </div>
      {importColumns.length > 0 && (
        <div className="mb-4 border border-[#E0E0E0] bg-white p-3">
          <p className="text-xs font-medium mb-2">Импорт: выберите колонку</p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111] min-w-[260px]"
              value={selectedImportColumn}
              onChange={(e) => setSelectedImportColumn(Number(e.target.value))}
            >
              {importColumns.map((c) => <option key={c.index} value={c.index}>{c.label}</option>)}
            </select>
            {importIsCsv && (
              <select
                className="border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
                value={csvEncoding}
                onChange={(e) => reparseWithEncoding(e.target.value)}
              >
                <option value="auto">Кодировка: авто</option>
                <option value="utf-8">UTF-8</option>
                <option value="windows-1251">Windows-1251</option>
                <option value="ibm866">CP866</option>
                <option value="koi8-r">KOI8-R</option>
                <option value="utf-16le">UTF-16 LE</option>
              </select>
            )}
            <label className="flex items-center gap-2 text-xs text-[#666]">
              <input
                type="checkbox"
                className="w-4 h-4 accent-black"
                checked={hasHeaderRow}
                onChange={(e) => setHasHeaderRow(e.target.checked)}
              />
              Первая строка — заголовок
            </label>
            <button
              onClick={importSelectedColumn}
              disabled={importing}
              className="bg-[#111] text-white px-3 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-50"
            >
              {importing ? "Импорт..." : "Загрузить выбранную колонку"}
            </button>
            <button
              onClick={resetImportState}
              disabled={importing}
              className="border border-[#E0E0E0] px-3 py-2 text-xs hover:bg-[#F0F0EE] disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {/* Список */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-xs text-[#666]">
          <input
            type="checkbox"
            className="w-4 h-4 accent-black"
            checked={items.length > 0 && selectedIds.length === items.length}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          Выбрать все
        </label>
        <button
          onClick={delSelected}
          disabled={selectedIds.length === 0}
          className="border border-red-200 text-red-600 px-3 py-1 text-xs hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Удалить выбранные ({selectedIds.length})
        </button>
      </div>
      <div className="bg-white border border-[#E0E0E0] px-4">
        {loading && <p className="text-sm text-[#AAA] py-6 text-center">Загрузка...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-[#CCC] py-6 text-center">Список пуст</p>
        )}
        {items.map(item => (
          <RefRow
            key={item.id}
            item={item}
            onSave={save}
            onDelete={del}
            selected={selectedIds.includes(item.id)}
            onToggle={toggleSelection}
          />
        ))}
      </div>
      <p className="text-[10px] text-[#AAA] mt-2">{items.length} записей · наведите на строку для редактирования</p>
    </div>
  );
}

// ── Панель пользователей ───────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [departments, setDepartments] = useState<RefItem[]>([]);
  const [roleLabels, setRoleLabels] = useState<Record<string, string>>(ROLE_LABELS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", login: "", password: "", roles: [] as string[], department_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [u, d, rl] = await Promise.all([apiAdminList("users"), apiAdminList("departments"), apiAdminList("role_labels")]);
    if (Array.isArray(u)) setUsers(u as UserItem[]);
    if (Array.isArray(d)) setDepartments(d);
    if (Array.isArray(rl)) {
      const map: Record<string, string> = { ...ROLE_LABELS };
      (rl as { role: string; label: string }[]).forEach(r => { map[r.role] = r.label; });
      setRoleLabels(map);
    }
    setSelectedIds([]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: "", login: "", password: "", roles: [], department_id: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setForm({ name: u.name, login: u.login, password: "", roles: u.roles || [u.role], department_id: u.department_id ? String(u.department_id) : "" });
    setError("");
    setShowForm(true);
  };

  const toggleRole = (r: string) => {
    setForm(p => ({
      ...p,
      roles: p.roles.includes(r) ? p.roles.filter(x => x !== r) : [...p.roles, r],
    }));
  };

  const save = async () => {
    setError("");
    if (!form.name.trim() || !form.login.trim()) { setError("Имя и логин обязательны"); return; }
    if (!editUser && !form.password.trim()) { setError("Пароль обязателен для нового пользователя"); return; }
    if (form.roles.length === 0) { setError("Выберите хотя бы одну группу"); return; }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name.trim(), login: form.login.trim(), roles: form.roles,
        department_id: form.department_id ? Number(form.department_id) : null,
      };
      if (form.password.trim()) data.password = form.password.trim();
      let res;
      if (editUser) {
        res = await apiAdminEdit("users", { id: editUser.id, ...data });
      } else {
        res = await apiAdminAdd("users", data);
      }
      if (res.ok || res.id) { setShowForm(false); load(); }
      else setError((res.error as string) || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Удалить пользователя? Это действие необратимо.")) return;
    const res = await apiAdminDelete("users", id);
    if (res.ok) load();
    else alert(res.error || "Не удалось удалить");
  };

  const delSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить выбранных пользователей (${selectedIds.length})? Это действие необратимо.`)) return;
    const results = await Promise.all(selectedIds.map(id => apiAdminDelete("users", id)));
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) load();
    else alert((failed[0].error as string) || "Не удалось удалить часть выбранных пользователей");
  };

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter(x => x !== id);
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? users.map(u => u.id) : []);
  };

  const setField = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={delSelected}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 text-xs font-medium hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="Trash2" size={13} />
            Удалить выбранных ({selectedIds.length})
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-[#111] text-white px-4 py-2 text-xs font-medium hover:bg-[#333]">
            <Icon name="UserPlus" size={13} />
            Добавить пользователя
          </button>
        </div>
      </div>

      {/* Форма добавления/редактирования */}
      {showForm && (
        <div className="bg-white border border-[#E0E0E0] mb-5 animate-fade-in">
          <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-[#FAFAFA]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#333]">
              {editUser ? `Редактировать: ${editUser.name}` : "Новый пользователь"}
            </p>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 flex items-center justify-center hover:bg-[#F0F0EE]">
              <Icon name="X" size={14} className="text-[#888]" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {[
              { label: "Ф.И.О.", k: "name" as const, placeholder: "Иванов К.П." },
              { label: "Логин", k: "login" as const, placeholder: "ivanov" },
              { label: editUser ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль", k: "password" as const, placeholder: "••••" },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">{f.label}</label>
                <input type={f.k === "password" ? "password" : "text"}
                  className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
                  value={form[f.k]} onChange={e => setField(f.k, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Подразделение</label>
              <select className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
                value={form.department_id} onChange={e => setField("department_id", e.target.value)}>
                <option value="">— не указано —</option>
                {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-2">Группы</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)}
                      className="w-4 h-4 accent-black" />
                    <span className="text-sm">{roleLabels[r] ?? r}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 px-5 pb-2">{error}</p>}
          <div className="px-5 pb-4 flex gap-2">
            <button onClick={save} disabled={saving}
              className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-50">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-[#E0E0E0] px-5 py-2 text-xs font-medium text-[#555] hover:bg-[#F0F0EE]">
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-[#AAA] py-8 text-center">Загрузка...</p>}

      {/* Список пользователей */}
      {!loading && (
        <div className="bg-white border border-[#E0E0E0]">
          {users.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#F0F0EE] bg-[#FAFAFA]">
              <input
                type="checkbox"
                className="w-4 h-4 accent-black"
                checked={selectedIds.length === users.length}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              <span className="text-xs text-[#666]">Выбрать всех</span>
            </div>
          )}
          {users.length === 0 && <p className="text-sm text-[#BBB] py-8 text-center">Нет пользователей</p>}
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 group border-b border-[#F0F0EE] last:border-b-0">
              <input
                type="checkbox"
                className="w-4 h-4 accent-black shrink-0"
                checked={selectedIds.includes(u.id)}
                onChange={(e) => toggleSelection(u.id, e.target.checked)}
              />
              <div className="w-7 h-7 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                <Icon name="User" size={13} className="text-[#666]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-[10px] text-[#AAA]">
                  @{u.login} · {u.dept_name || "—"} ·{" "}
                  {(u.roles || [u.role]).map(r => roleLabels[r] ?? r).join(", ")}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(u)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-[#E0E0E0] hover:bg-[#F0F0EE] transition-colors">
                  <Icon name="Pencil" size={10} />
                  Изменить
                </button>
                <button onClick={() => del(u.id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                  <Icon name="Trash2" size={10} />
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Редактирование названий статусов ──────────────────────────────────────
interface StageLabelItem { stage: number; label: string; color: string; }

const PRESET_COLORS = [
  "#6B7280", "#3B82F6", "#10B981", "#F59E0B",
  "#F97316", "#EF4444", "#8B5CF6", "#06B6D4",
  "#EC4899", "#84CC16", "#14B8A6", "#F43F5E",
];

function StageLabelsPanel() {
  const [items, setItems] = useState<StageLabelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [val, setVal] = useState("");
  const [colorVal, setColorVal] = useState("#6B7280");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiAdminList("stage_labels");
    setItems(Array.isArray(res) ? res as StageLabelItem[] : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item: StageLabelItem) => { setEditing(item.stage); setVal(item.label); setColorVal(item.color || "#6B7280"); };
  const cancel = () => { setEditing(null); setVal(""); setColorVal("#6B7280"); };

  const save = async (stage: number) => {
    if (!val.trim()) return;
    setSaving(true);
    await apiAdminEdit("stage_labels", { stage, label: val.trim(), color: colorVal });
    setSaving(false);
    setEditing(null);
    load();
  };

  if (loading) return <p className="text-sm text-[#AAA]">Загрузка...</p>;

  return (
    <div className="bg-white border border-[#E0E0E0]">
      {items.map((item) => (
        <div key={item.stage} className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0EE] last:border-b-0 group">
          <span className="text-[10px] font-mono text-[#AAA] w-8 shrink-0">#{item.stage}</span>
          {editing === item.stage ? (
            <div className="flex-1 flex flex-col gap-2">
              <input autoFocus
                className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1 text-sm outline-none focus:border-[#111]"
                value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(item.stage); if (e.key === "Escape") cancel(); }}
              />
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setColorVal(c)}
                      className="w-5 h-5 rounded-sm border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: colorVal === c ? "#111" : "transparent" }}
                    />
                  ))}
                </div>
                <input type="color" value={colorVal} onChange={e => setColorVal(e.target.value)}
                  className="w-7 h-7 cursor-pointer border border-[#E0E0E0] p-0.5 bg-white" title="Свой цвет"
                />
                <span className="text-[10px] text-[#AAA] font-mono">{colorVal}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#777]">Предпросмотр:</span>
                <span className="text-[10px] font-medium px-2 py-0.5 inline-block"
                  style={{ backgroundColor: colorVal + "22", color: colorVal, border: `1px solid ${colorVal}55` }}>
                  {val || item.label}
                </span>
                <button onClick={() => save(item.stage)} disabled={saving}
                  className="ml-auto bg-[#111] text-white px-3 py-1 text-xs hover:bg-[#333] disabled:opacity-50">
                  {saving ? "..." : "Сохранить"}
                </button>
                <button onClick={cancel} className="border border-[#E0E0E0] px-3 py-1 text-xs hover:bg-[#F0F0EE]">Отмена</button>
              </div>
            </div>
          ) : (
            <>
              <span className="text-[10px] font-medium px-2 py-0.5 inline-block"
                style={{ backgroundColor: (item.color || "#6B7280") + "22", color: item.color || "#6B7280", border: `1px solid ${item.color || "#6B7280"}55` }}>
                {item.label}
              </span>
              <button onClick={() => startEdit(item)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 text-[10px] border border-[#E0E0E0] hover:bg-[#F0F0EE] opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="Pencil" size={10} />
                Изменить
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Конфигурация столбцов таблицы ─────────────────────────────────────────
interface ColumnItem { key: string; label: string; visible: boolean; sort_order: number; }

function ColumnConfigPanel() {
  const [items, setItems] = useState<ColumnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiAdminList("column_config");
    setItems(Array.isArray(res) ? (res as ColumnItem[]).sort((a, b) => a.sort_order - b.sort_order) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => {
    setItems(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    setSaved(false);
  };

  const setLabel = (key: string, label: string) => {
    setItems(prev => prev.map(c => c.key === key ? { ...c, label } : c));
    setSaved(false);
  };

  const move = (key: string, dir: -1 | 1) => {
    setItems(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(c => c.key === key);
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((c, i) => ({ ...c, sort_order: i + 1 }));
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await apiAdminSaveColumns(items.map(c => ({
      key: c.key,
      label: c.label.trim() || c.key,
      visible: c.visible,
      sort_order: c.sort_order
    })));
    setSaving(false);
    setSaved(true);
  };

  if (loading) return <p className="text-sm text-[#AAA]">Загрузка...</p>;

  const colItems = items.filter(c => c.key !== "row_highlight");
  const rowHighlightItem = items.find(c => c.key === "row_highlight");

  return (
    <div>
      {rowHighlightItem && (
        <div className="bg-white border border-[#E0E0E0] mb-4 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Подсветка строк по цвету статуса</p>
            <p className="text-[11px] text-[#999] mt-0.5">Каждая строка таблицы окрашивается в цвет её текущего статуса</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={rowHighlightItem.visible} onChange={() => toggle("row_highlight")} className="sr-only peer" />
            <div className="w-10 h-5 bg-[#E0E0E0] peer-checked:bg-[#111] rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
      )}
      <div className="bg-white border border-[#E0E0E0] mb-4">
        {colItems.map((col, idx) => (
          <div key={col.key} className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0EE] last:border-b-0">
            <div className="flex items-center gap-2 flex-1">
              <input type="checkbox" checked={col.visible} onChange={() => toggle(col.key)}
                className="w-4 h-4 accent-black" />
              <input
                className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1 text-sm outline-none focus:border-[#111]"
                value={col.label}
                onChange={e => setLabel(col.key, e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              <button onClick={() => move(col.key, -1)} disabled={idx === 0}
                className="w-7 h-7 flex items-center justify-center border border-[#E0E0E0] hover:bg-[#F0F0EE] disabled:opacity-30">
                <Icon name="ChevronUp" size={12} />
              </button>
              <button onClick={() => move(col.key, 1)} disabled={idx === colItems.length - 1}
                className="w-7 h-7 flex items-center justify-center border border-[#E0E0E0] hover:bg-[#F0F0EE] disabled:opacity-30">
                <Icon name="ChevronDown" size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving}
        className="bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-50">
        {saving ? "Сохраняю..." : saved ? "Сохранено" : "Сохранить"}
      </button>
    </div>
  );
}

// ── Редактирование названий групп ─────────────────────────────────────────
interface RoleLabelItem { role: string; label: string; }

function RoleLabelsPanel() {
  const [items, setItems] = useState<RoleLabelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiAdminList("role_labels");
    setItems(Array.isArray(res) ? res as RoleLabelItem[] : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item: RoleLabelItem) => { setEditing(item.role); setVal(item.label); };
  const cancel = () => { setEditing(null); setVal(""); };

  const save = async (role: string) => {
    if (!val.trim()) return;
    setSaving(true);
    await apiAdminEdit("role_labels", { role, label: val.trim() });
    setSaving(false);
    setEditing(null);
    load();
  };

  if (loading) return <p className="text-sm text-[#AAA]">Загрузка...</p>;

  return (
    <div className="bg-white border border-[#E0E0E0]">
      {items.map((item) => (
        <div key={item.role} className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0EE] last:border-b-0 group">
          <span className="text-[10px] font-mono text-[#AAA] w-24 shrink-0">{item.role}</span>
          {editing === item.role ? (
            <>
              <input autoFocus
                className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-2.5 py-1 text-sm outline-none focus:border-[#111]"
                value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(item.role); if (e.key === "Escape") cancel(); }}
              />
              <button onClick={() => save(item.role)} disabled={saving}
                className="bg-[#111] text-white px-3 py-1 text-xs hover:bg-[#333] disabled:opacity-50">
                {saving ? "..." : "OK"}
              </button>
              <button onClick={cancel}
                className="border border-[#E0E0E0] px-3 py-1 text-xs hover:bg-[#F0F0EE]">Отмена</button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm">{item.label}</span>
              <button onClick={() => startEdit(item)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-[#E0E0E0] hover:bg-[#F0F0EE] opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="Pencil" size={10} />
                Изменить
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

interface AppConfigItem { key: string; value: string; }

const HEADER_ICON_OPTIONS = [
  "Truck", "Package", "Briefcase", "Factory", "Building2", "ShipWheel", "ShieldCheck", "Settings"
];

function AppConfigPanel() {
  const [title, setTitle] = useState("ТрансДеталь");
  const [icon, setIcon] = useState("Truck");
  const [iconData, setIconData] = useState("");
  const [titleColor, setTitleColor] = useState("#111111");
  const [processName, setProcessName] = useState("");
  const [processNameColor, setProcessNameColor] = useState("#666666");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiAdminList("app_config");
    if (Array.isArray(res)) {
      const list = res as AppConfigItem[];
      const map = Object.fromEntries(list.map(i => [i.key, i.value])) as Record<string, string>;
      setTitle(map.header_title || "ТрансДеталь");
      setIcon(map.header_icon || "Truck");
      setIconData(map.header_icon_data || "");
      setTitleColor(map.header_title_color || "#111111");
      setProcessName(map.process_name || "");
      setProcessNameColor(map.process_name_color || "#666666");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!title.trim()) { setError("Название не может быть пустым"); return; }
    setSaving(true);
    setSaved(false);
    setError("");
    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      apiAdminEdit("app_config", { key: "header_title", value: title.trim() }),
      apiAdminEdit("app_config", { key: "header_icon", value: icon }),
      apiAdminEdit("app_config", { key: "header_icon_data", value: iconData || "-" }),
      apiAdminEdit("app_config", { key: "header_title_color", value: titleColor }),
      apiAdminEdit("app_config", { key: "process_name", value: processName.trim() }),
      apiAdminEdit("app_config", { key: "process_name_color", value: processNameColor }),
    ]);
    setSaving(false);
    if (r1.ok && r2.ok && r3.ok && r4.ok && r5.ok && r6.ok) setSaved(true);
    else setError((r1.error as string) || (r2.error as string) || (r3.error as string) || (r4.error as string) || (r5.error as string) || (r6.error as string) || "Ошибка сохранения");
  };

  const onUploadIcon = (e: { target: { files: FileList | null } }) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Нужен файл изображения"); return; }
    if (f.size > 1024 * 1024) { setError("Максимальный размер файла: 1 МБ"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : "";
      setIconData(data);
      setError("");
      setSaved(false);
    };
    reader.readAsDataURL(f);
  };

  if (loading) return <p className="text-sm text-[#AAA]">Загрузка...</p>;

  return (
    <div className="bg-white border border-[#E0E0E0] p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Надпись в заголовке</label>
          <input
            className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
            value={title}
            onChange={e => { setTitle(e.target.value); setSaved(false); }}
            placeholder="ТрансДеталь"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Иконка заголовка</label>
          <select
            className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
            value={icon}
            onChange={e => { setIcon(e.target.value); setSaved(false); }}
          >
            {HEADER_ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Своя пиктограмма (PNG/JPG до 1 МБ)</label>
          <input
            type="file"
            accept="image/*"
            onChange={onUploadIcon}
            className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => { setIconData(""); setSaved(false); }}
            className="mt-2 border border-[#E0E0E0] px-3 py-1 text-xs hover:bg-[#F0F0EE]"
          >
            Убрать свою картинку
          </button>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Цвет надписи</label>
          <div className="flex items-center gap-2">
            <input type="color" value={titleColor} onChange={e => { setTitleColor(e.target.value); setSaved(false); }} className="w-10 h-10 border border-[#E0E0E0] p-0.5 bg-white" />
            <input
              className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
              value={titleColor}
              onChange={e => { setTitleColor(e.target.value); setSaved(false); }}
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Название бизнес-процесса</label>
          <input
            className="w-full border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
            value={processName}
            onChange={e => { setProcessName(e.target.value); setSaved(false); }}
            placeholder="Например: Логистика перевозок"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Цвет названия бизнес-процесса</label>
          <div className="flex items-center gap-2">
            <input type="color" value={processNameColor} onChange={e => { setProcessNameColor(e.target.value); setSaved(false); }} className="w-10 h-10 border border-[#E0E0E0] p-0.5 bg-white" />
            <input
              className="flex-1 border border-[#E0E0E0] bg-[#F7F7F5] px-3 py-2 text-sm outline-none focus:border-[#111]"
              value={processNameColor}
              onChange={e => { setProcessNameColor(e.target.value); setSaved(false); }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 border border-[#E0E0E0] bg-[#FAFAFA] flex items-center gap-2">
        <div className="w-7 h-7 bg-[#111] flex items-center justify-center">
          {iconData && iconData !== "-" ? (
            <img src={iconData} alt="Иконка" className="w-6 h-6 object-cover" />
          ) : (
            <Icon name={icon} size={14} className="text-white" />
          )}
        </div>
        <div>
          <span className="font-semibold text-sm tracking-wide uppercase" style={{ color: titleColor || "#111111" }}>{title || "—"}</span>
          {processName.trim() && (
            <p className="text-[11px] mt-0.5" style={{ color: processNameColor || "#666666" }}>{processName}</p>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      <button onClick={save} disabled={saving}
        className="mt-4 bg-[#111] text-white px-5 py-2 text-xs font-medium hover:bg-[#333] disabled:opacity-50">
        {saving ? "Сохраняю..." : saved ? "Сохранено" : "Сохранить"}
      </button>
    </div>
  );
}

// ── Главный компонент Admin ────────────────────────────────────────────────
export default function Admin({ onBack }: { onBack: () => void }) {
  const [section, setSection] = useState<Section>("departments");

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-ibm text-[#111]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-[#888] hover:text-[#111] transition-colors text-xs">
            <Icon name="ArrowLeft" size={14} />
            Назад
          </button>
          <div className="w-px h-5 bg-[#E0E0E0]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#111] flex items-center justify-center">
              <Icon name="Settings" size={12} className="text-white" />
            </div>
            <span className="font-semibold text-sm uppercase tracking-wide">Администрирование</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 shrink-0">
          <div className="bg-white border border-[#E0E0E0]">
            {SECTIONS.map((s, i) => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-[#F0F0EE] last:border-b-0 ${section === s.key ? "bg-[#111] text-white" : "text-[#555] hover:bg-[#F0F0EE]"} ${i === 0 ? "" : ""}`}>
                <Icon name={s.icon} size={14} />
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 animate-fade-in">
          <div className="mb-4">
            <h2 className="text-base font-semibold">
              {SECTIONS.find(s => s.key === section)?.label}
            </h2>
            <p className="text-[11px] text-[#AAA] mt-0.5">
              {section === "users"
                ? "Управление учётными записями пользователей"
                : section === "role_labels"
                ? "Отображаемые названия групп пользователей в интерфейсе"
                : section === "stage_labels"
                ? "Отображаемые названия статусов заявок в интерфейсе"
                : section === "column_config"
                ? "Выберите столбцы и настройте их порядок в таблице заявок"
                : section === "app_config"
                ? "Настройка текста и иконки заголовка после входа в систему"
                : "Значения появятся в выпадающих списках при создании заявки"}
            </p>
          </div>

          {section === "users" ? (
            <UsersPanel />
          ) : section === "role_labels" ? (
            <RoleLabelsPanel />
          ) : section === "stage_labels" ? (
            <StageLabelsPanel />
          ) : section === "column_config" ? (
            <ColumnConfigPanel />
          ) : section === "app_config" ? (
            <AppConfigPanel />
          ) : (
            <RefPanel
              resource={section}
              label={SECTIONS.find(s => s.key === section)?.label || ""}
            />
          )}
        </main>
      </div>
    </div>
  );
}