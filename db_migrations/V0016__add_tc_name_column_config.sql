INSERT INTO t_p68114469_cross_platform_logis.column_config (key, label, visible, sort_order)
VALUES ('tc_name', 'Транспорт выбрал', true, 9)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    visible = EXCLUDED.visible,
    sort_order = EXCLUDED.sort_order;
