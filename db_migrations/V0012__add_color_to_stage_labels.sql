ALTER TABLE t_p68114469_cross_platform_logis.stage_labels
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6B7280';

UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#6B7280' WHERE stage IN (1,2);
UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#3B82F6' WHERE stage IN (3,4);
UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#F59E0B' WHERE stage = 5;
UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#F97316' WHERE stage = 6;
UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#8B5CF6' WHERE stage = 7;
UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#06B6D4' WHERE stage = 8;
UPDATE t_p68114469_cross_platform_logis.stage_labels SET color = '#10B981' WHERE stage = 9;
