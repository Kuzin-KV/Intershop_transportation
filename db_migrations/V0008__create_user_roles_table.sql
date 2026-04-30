CREATE TABLE t_p68114469_cross_platform_logis.user_roles (
    user_id INTEGER NOT NULL REFERENCES t_p68114469_cross_platform_logis.users(id),
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, role)
);

INSERT INTO t_p68114469_cross_platform_logis.user_roles (user_id, role)
SELECT id, role FROM t_p68114469_cross_platform_logis.users
WHERE role IS NOT NULL AND role != '';
