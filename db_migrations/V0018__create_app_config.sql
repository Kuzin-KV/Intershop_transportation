CREATE TABLE IF NOT EXISTS t_p68114469_cross_platform_logis.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO t_p68114469_cross_platform_logis.app_config (key, value) VALUES
    ('header_title', 'ТрансДеталь'),
    ('header_icon', 'Truck')
ON CONFLICT (key) DO NOTHING;
