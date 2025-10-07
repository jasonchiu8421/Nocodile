-- MySQL 數據庫初始化腳本
-- 創建數據庫和表結構，數據存儲在項目文件夾中

-- 創建數據庫
CREATE DATABASE IF NOT EXISTS object_detection;
USE object_detection;

-- 創建用戶表
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建項目表
CREATE TABLE IF NOT EXISTS project (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    project_type VARCHAR(50) DEFAULT 'object_detection',
    project_owner_id INT NOT NULL,
    project_status VARCHAR(50) DEFAULT 'Not started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_owner_id) REFERENCES users (user_id)
);

-- 創建視頻表
CREATE TABLE IF NOT EXISTS videos (
    video_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    video_name VARCHAR(255) NOT NULL,
    video_path VARCHAR(500) NOT NULL,
    annotation_status VARCHAR(50) DEFAULT 'yet to start',
    last_annotated_frame INT DEFAULT -1,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project (project_id)
);

-- 創建圖片表
CREATE TABLE IF NOT EXISTS images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project (project_id)
);

-- 創建共享項目表
CREATE TABLE IF NOT EXISTS project_shared_users (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project (project_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    UNIQUE(project_id, user_id)
);

-- 創建類別表
CREATE TABLE IF NOT EXISTS class (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project (project_id),
    UNIQUE(project_id, class_name)
);

-- 插入示例用戶
INSERT INTO users (user_id, username, password_hash, email) 
VALUES (1, 'testuser', 'hashed_password_123', 'test@example.com')
ON DUPLICATE KEY UPDATE username = username;

-- 插入示例項目
INSERT INTO project (project_id, project_name, project_type, project_owner_id, project_status) 
VALUES 
(1, 'Object Detection Project', 'object_detection', 1, 'In Progress'),
(2, 'Image Classification', 'classification', 1, 'Not started'),
(3, 'Video Analysis', 'object_detection', 1, 'Completed')
ON DUPLICATE KEY UPDATE project_name = project_name;

-- 插入示例視頻
INSERT INTO videos (project_id, video_name, video_path) 
VALUES 
(1, 'sample_video1.mp4', '/videos/project1/sample_video1.mp4'),
(1, 'sample_video2.mp4', '/videos/project1/sample_video2.mp4'),
(3, 'analysis_video.mp4', '/videos/project3/analysis_video.mp4')
ON DUPLICATE KEY UPDATE video_name = video_name;

-- 插入示例圖片
INSERT INTO images (project_id, image_name, image_path) 
VALUES 
(1, 'sample_image1.jpg', '/images/project1/sample_image1.jpg'),
(1, 'sample_image2.jpg', '/images/project1/sample_image2.jpg'),
(2, 'class_image1.jpg', '/images/project2/class_image1.jpg')
ON DUPLICATE KEY UPDATE image_name = image_name;

-- 顯示創建的表
SHOW TABLES;

-- 顯示示例數據
SELECT 'Users:' as Table_Name;
SELECT * FROM users;

SELECT 'Projects:' as Table_Name;
SELECT * FROM project;

SELECT 'Videos:' as Table_Name;
SELECT * FROM videos;

SELECT 'Images:' as Table_Name;
SELECT * FROM images;
