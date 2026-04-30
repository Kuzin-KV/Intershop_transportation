INSERT INTO t_p68114469_cross_platform_logis.role_labels (role, label)
VALUES ('analyst', 'Аналитики')
ON CONFLICT (role) DO NOTHING;
