import pymysql
from datetime import datetime
import json
import os
import sys
from pathlib import Path
import base64
import hashlib

# 添加後端路徑到 Python 路徑
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from config import config
    USE_CONFIG_MODULE = True
except ImportError:
    USE_CONFIG_MODULE = False

class ObjectDetectionDB:
    def __init__(self, host=None, user=None, password=None, database=None):
        """
        初始化数据库连接
        優先使用環境變數或配置模組
        """
        if USE_CONFIG_MODULE:
            # 使用配置模組
            self.config = {
                'host': host or config.database.host,
                'user': user or config.database.user,
                'password': password or config.database.password,
                'database': database or config.database.database,
                'charset': 'utf8mb4'
            }
        else:
            # 使用環境變數或預設值
            self.config = {
                'host': host or os.getenv('MYSQL_HOST', 'localhost'),
                'user': user or os.getenv('MYSQL_USER', 'root'),
                'password': password or os.getenv('MYSQL_PASSWORD', 'rootpassword'),
                'database': database or os.getenv('MYSQL_DATABASE', 'nocodile_db'),
                'charset': 'utf8mb4'
            }
        
        self.connection = None
        print(f"資料庫配置: {self.config['host']}:{self.config.get('port', 3306)}")
        print(f"目標資料庫: {self.config['database']}")
    
    def connect(self):
        """连接数据库"""
        # 嘗試多個連接配置
        configs_to_try = [
            self.config,
            # Docker 本地映射端口
            {**self.config, 'host': 'localhost', 'port': 3307},
            # 標準本地端口
            {**self.config, 'host': 'localhost', 'port': 3306}
        ]
        
        for i, config in enumerate(configs_to_try, 1):
            try:
                print(f"嘗試連接配置 {i}: {config['host']}:{config.get('port', 3306)}")
                self.connection = pymysql.connect(**config)
                print(f"資料庫連接成功！使用配置 {i}")
                return True
            except Exception as e:
                print(f"配置 {i} 連接失敗: {e}")
                continue
        
        print("所有資料庫連接配置都失敗")
        return False
    
    def create_database(self):
        """创建数据库"""
        try:
            # 先连接到MySQL服务器（不指定数据库）
            temp_config = self.config.copy()
            del temp_config['database']
            temp_connection = pymysql.connect(**temp_config)
            cursor = temp_connection.cursor()
            
            # 创建数据库
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.config['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"数据库 {self.config['database']} 创建成功")
            
            cursor.close()
            temp_connection.close()
            return True
        except Exception as e:
            print(f"创建数据库失败: {e}")
            return False
    
    def create_tables(self):
        """创建所有表"""
        if not self.connection:
            print("请先连接数据库")
            return False
        
        cursor = self.connection.cursor()
        
        try:
#====================================创建user表====================================
            create_user_table = """
            CREATE TABLE IF NOT EXISTS user (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            cursor.execute(create_user_table)
            print("user表创建成功")
            
#====================================创建class表====================================
            create_class_table = """
            CREATE TABLE IF NOT EXISTS class (
                project_id INT NOT NULL,
                class_id INT AUTO_INCREMENT PRIMARY KEY,
                class_name VARCHAR(100) NOT NULL,
                color VARCHAR(10) NOT NULL,
                FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE,
                CONSTRAINT unique_project_class UNIQUE (`project_id`, `class_name`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            cursor.execute(create_class_table)
            print("class表创建成功")
            
#====================================创建project表====================================
            create_project_table = """
            CREATE TABLE IF NOT EXISTS project (
                project_id INT AUTO_INCREMENT PRIMARY KEY,
                project_name VARCHAR(200) NOT NULL,
                project_type VARCHAR(200) NOT NULL,
                project_owner_id INT NOT NULL,
                project_status VARCHAR(200) NOT NULL,
                auto_annotation_progress DECIMAL DEFAULT 0.00,
                last_annotated_frame INT DEFAULT 0,
                training_progress DECIMAL DEFAULT 0.00,
                model_path VARCHAR(500) NOT NULL,
                dataset_path VARCHAR(500) NOT NULL,
                FOREIGN KEY (project_owner_id) REFERENCES user(user_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            cursor.execute(create_project_table)
            print("project表创建成功")
            
#====================================创建video表====================================
            create_video_table = """
            CREATE TABLE IF NOT EXISTS video (
                video_id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                video_path VARCHAR(500) NOT NULL,
                video_name VARCHAR(200) NOT NULL,
                annotation_status VARCHAR(200) NOT NULL,
                last_annotated_frame INT DEFAULT -1,
                total_frames INT DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            cursor.execute(create_video_table)
            print("video表创建成功")

#====================================创建bbox表====================================
            create_bbox_table = """
            CREATE TABLE IF NOT EXISTS bbox (
                video_id INT NOT NULL,
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_name VARCHAR(50) NOT NULL,
                coordinates VARCHAR(50) NOT NULL,
                frame_num INT NOT NULL,
                FOREIGN KEY (video_id) REFERENCES video(video_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            cursor.execute(create_bbox_table)
            print("bbox表创建成功")
            
#====================================创建project_shared_users表（多对多关系）====================================
            create_shared_users_table = """
            CREATE TABLE IF NOT EXISTS project_shared_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                user_id INT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
                UNIQUE KEY unique_project_user (project_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            cursor.execute(create_shared_users_table)
            print("project_shared_users表创建成功")

            # 重新启用外键检查
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            print("已重新启用外键检查")
        
            self.connection.commit()
            print("所有表创建成功")
            return True
            
        except Exception as e:
            print(f"创建表失败: {e}")
            self.connection.rollback()
            return False
        finally:
            cursor.close()

    # def _hash_password(password, salt=None):
    #     # Generate a random salt if not provided
    #     if salt is None:
    #         salt = os.urandom(16)
    #     # Use PBKDF2-HMAC-SHA256 as the hashing algorithm
    #     pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100_000)
    #     return salt, pwd_hash

    # def create_users(self):
    #     cursor = self.connection.cursor()

    #     # Create 30 users: usernames as 'user1' to 'user30', passwords as 'password123' (fixed for demo; hash each uniquely)
    #     for i in range(1, 31):
    #         username = f"user{i}"
    #         plaintext_password = "password123"  # Or generate dynamically, e.g., f"pass{i}"
            
    #         # Generate salt and hash
    #         salt, pwd_hash = self._hash_password(plaintext_password)
            
    #         # Combine and base64-encode for storage: salt:hash
    #         stored_password = base64.b64encode(salt + b':' + pwd_hash).decode('utf-8')
            
    #         # Insert the user
    #         insert_user = """
    #             INSERT INTO user (username, password) 
    #             VALUES (%s, %s)
    #         """
    #         cursor.execute(insert_user, (username, stored_password))

    #         cursor.close()
    
    def close(self):
        """关闭数据库连接"""
        if self.connection:
            self.connection.close()
            print("数据库连接已关闭")

def main():
    """主函数"""
    print("Nocodile 資料庫初始化工具")
    print("=" * 50)
    
    # 檢查是否在 Docker 環境中
    if os.getenv('MYSQL_HOST') == 'mysql':
        print("檢測到 Docker 環境")
    else:
        print("檢測到本地環境")
    
    db = ObjectDetectionDB()
    
    try:
        # 1. 創建資料庫
        print("\n步驟 1: 創建資料庫...")
        if not db.create_database():
            print("資料庫創建失敗")
            return False
        
        # 2. 連接資料庫
        print("\n步驟 2: 連接資料庫...")
        if not db.connect():
            print("資料庫連接失敗")
            return False
        
        # 3. 創建表格
        print("\n步驟 3: 創建表格...")
        if not db.create_tables():
            print("表格創建失敗")
            return False

        # # 4. 创建users
        # if not db.create_users():
        #     print("users創建失敗")
        #     return
        
        print("\n資料庫初始化完成！")
        print("現在可以啟動 Nocodile 應用程式")
        return True

    except Exception as e:
        print(f"創建資料庫時出錯: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
