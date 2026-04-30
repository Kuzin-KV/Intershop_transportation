ALTER TABLE t_p68114469_cross_platform_logis.orders
  ALTER COLUMN execution_date TYPE TIMESTAMP USING execution_date::timestamp;
