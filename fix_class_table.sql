-- 修复 class 表，添加 class_num 字段
-- 如果字段已存在，这个语句会报错，可以忽略

ALTER TABLE class ADD COLUMN class_num INT DEFAULT NULL;

