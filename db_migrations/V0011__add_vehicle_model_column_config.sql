INSERT INTO t_p68114469_cross_platform_logis.column_config (key, label, visible, sort_order)
VALUES ('vehicle_model', 'Транспорт', true, 14)
ON CONFLICT (key) DO UPDATE SET visible = EXCLUDED.visible, sort_order = EXCLUDED.sort_order;