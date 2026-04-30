ALTER TABLE t_p68114469_cross_platform_logis.orders ADD COLUMN IF NOT EXISTS tc_master_name TEXT;

INSERT INTO t_p68114469_cross_platform_logis.column_config (key, label, visible, sort_order)
VALUES ('tc_master_name', 'Мастер ТЦ', false, 9)
ON CONFLICT (key) DO NOTHING;
