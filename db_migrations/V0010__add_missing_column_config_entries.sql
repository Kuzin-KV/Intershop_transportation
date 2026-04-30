INSERT INTO t_p68114469_cross_platform_logis.column_config (key, label, visible, sort_order)
VALUES
  ('applicant_name', 'Заявитель',       true, 10),
  ('ppb_name',       'ППБ',             true, 11),
  ('sender_sign',    'Отв. за сдачу',   true, 12),
  ('receiver_sign',  'Отв. за приём',   true, 13)
ON CONFLICT (key) DO UPDATE SET visible = EXCLUDED.visible, sort_order = EXCLUDED.sort_order;