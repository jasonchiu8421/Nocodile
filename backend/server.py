import logging
import traceback
import threading
from datetime import datetime
from fastapi import FastAPI, Request, status, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, validator
from typing import Dict, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from passlib.context import CryptContext
import shutil
import uuid
import cv2
import pandas as pd
import os
from cv_models import InterpolatedObjectTracker # , MobileSAM
import numpy as np
import base64
import aiofiles
from ultralytics import YOLO
import yaml
import random
from shutil import copy2, rmtree
from pathlib import Path
import pymysql
import hashlib
import hmac
from starlette.middleware.base import BaseHTTPMiddleware
from config import config

# # 導入配置模組
# try:
#     USE_CONFIG_MODULE = True
# except ImportError:
#     USE_CONFIG_MODULE = False
#     # 如果無法導入配置模組，使用環境變數
#     import os
#     config = {
#         'host': os.getenv('MYSQL_HOST', 'localhost'),
#         'user': os.getenv('MYSQL_USER', 'root'),
#         'password': os.getenv('MYSQL_PASSWORD', 'rootpassword'),
#         'database': os.getenv('MYSQL_DATABASE', 'object_detection'),
#         'charset': 'utf8mb4'
#     }

#=================================== Initialize server ==========================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def getClientTimestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加請求大小限制中間件
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_header_size: int = 8192):
        super().__init__(app)
        self.max_header_size = max_header_size
    
    async def dispatch(self, request: Request, call_next):
        # 檢查請求標頭大小
        header_size = sum(len(k) + len(v) for k, v in request.headers.items())
        if header_size > self.max_header_size:
            return JSONResponse(
                status_code=431,
                content={"error": "Request header fields too large", "max_size": self.max_header_size}
            )
        return await call_next(request)

app.add_middleware(RequestSizeLimitMiddleware, max_header_size=8192)

# # 添加靜態文件服務 - 提供視頻文件
# app.mount("/videos", StaticFiles(directory="/app/projects"), name="videos")

#=================================== Health Check and Root Endpoints ==========================================

@app.get("/health")
async def health_check():
    """健康檢查端點"""
    try:
        # 檢查資料庫連接（使用线程安全的方法）
        logger.debug("[HEALTH] Starting health check")
        if is_db_connection_valid():
            try:
                # 使用安全的 get_db_cursor() 方法獲取游標
                logger.debug("[HEALTH] Connection valid, creating cursor via get_db_cursor()")
                cursor = get_db_cursor()
                try:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    logger.debug(f"[HEALTH] Query successful, result: {result}")
                    return {"status": "healthy", "database": "connected", "config": config}
                finally:
                    cursor.close()
                    logger.debug("[HEALTH] Cursor closed successfully")
            except Exception as e:
                logger.error(f"[HEALTH] Query failed: {e}")
                return {"status": "unhealthy", "database": "disconnected", "error": str(e), "config": config}
        else:
            logger.warning("[HEALTH] Connection validation failed")
            return {"status": "unhealthy", "database": "disconnected", "config": config}
    except Exception as e:
        logger.error(f"[HEALTH] Unexpected error: {e}")
        return {"status": "unhealthy", "error": str(e), "config": config}

@app.get("/test")
async def test_endpoint():
    """測試端點 - 用於 API 連接驗證"""
    try:
        return {
            "status": "success",
            "message": "API test endpoint is working",
            "timestamp": "2024-01-01T00:00:00Z",
            "version": "1.0.0"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    """根路徑端點"""
    return {"message": "Nocodile Backend API", "status": "running", "database_config": config}

#=================================== Connect to database ==========================================
import os
#added by Jimmy , ensure the filename is safe to use it.
# 文件名清理函數
def sanitize_filename(filename):
    """清理文件名，移除非法字符"""
    import re
    import unicodedata
    
    # 移除或替換有問題的字符
    # 只保留字母數字、點、連字符、下劃線和空格
    filename = re.sub(r'[^\w\s\-\.]', '_', filename)
    # 將多個空格/下劃線替換為單個下劃線
    filename = re.sub(r'[\s_]+', '_', filename)
    # 移除前導/尾隨的點和下劃線
    filename = filename.strip('._')
    # 確保不為空
    if not filename:
        filename = "video"
    
    # 額外的安全檢查：移除任何可能導致路徑問題的字符
    filename = re.sub(r'[<>:"|?*]', '_', filename)
    filename = filename.strip()
    
    # 限制文件名長度
    if len(filename) > 100:
        filename = filename[:100]
    
    return filename

# #changed by Jimmy ,to ensure it is work in docker container.
# # 檢測是否在 Docker 環境中運行
# def get_database_config():
#     # 檢查是否在 Docker 容器中運行
#     if os.path.exists('/.dockerenv'):
#         # Docker 環境配置
#         return {
#             'host': os.getenv('MYSQL_HOST', 'mysql'),
#             'user': os.getenv('MYSQL_USER', 'root'),
#             'password': os.getenv('MYSQL_PASSWORD', 'rootpassword'),
#             'database': os.getenv('MYSQL_DATABASE', 'object_detection'),
#             'charset': 'utf8mb4'
#         }
#     else:
#         # 本地開發環境配置
#         return {
#             'host': 'localhost',
#             'user': 'root',
#             'password': '12345678',
#             'database': 'Nocodile',
#             'charset': 'utf8mb4'
#         }

# # 資料庫連接重試機制
# def connect_to_database(max_retries=5, delay=2):
#     """連接數據庫，支持多種配置嘗試"""
#     if USE_CONFIG_MODULE:
#         # 使用配置模組的多個連接配置
#         configs_to_try = config.database.get_connection_configs()
#     else:
#         # 使用 get_database_config 函數
#         base_config = get_database_config()
#         configs_to_try = [
#             base_config,
#             # Docker 本地映射端口
#             {**base_config, 'host': 'localhost', 'port': 3307},
#             # 標準本地端口
#             {**base_config, 'host': 'localhost', 'port': 3306}
#         ]
    
#     for attempt in range(max_retries):
#         for i, conn_config in enumerate(configs_to_try):
#             try:
#                 print(f"嘗試連接配置 {i+1}: {conn_config['host']}:{conn_config.get('port', 3306)}")
#                 conn = pymysql.connect(**conn_config)
#                 print(f"数据库连接成功！(尝试 {attempt + 1}/{max_retries}, 配置 {i+1})")
#                 return conn
#             except pymysql.Error as e:
#                 print(f"配置 {i+1} 連接失敗: {e}")
#                 continue
        
#         if attempt < max_retries - 1:
#             print(f"所有配置都失敗，等待 {delay} 秒後重試...")
#             import time
#             time.sleep(delay)
#         else:
#             print("所有連接嘗試都失敗了")
#             return None

# Use the config from the config module
db_config = config.database.get_connection_config()

try:
    connection = pymysql.connect(**db_config)
    print("数据库连接成功！")
except pymysql.Error as e:
    print(f"数据库连接失败: {e}")
    connection = None

# 数据库连接锁，用于线程安全
_db_lock = threading.Lock()

# 辅助函数：重新连接数据库
def reconnect_database():
    """重新连接数据库（线程安全）"""
    global connection
    with _db_lock:
        try:
            if connection:
                try:
                    connection.close()
                except:
                    pass
            connection = pymysql.connect(**db_config)
            logger.info("数据库重新连接成功！")
            return True
        except pymysql.Error as e:
            logger.error(f"数据库重新连接失败: {e}")
            connection = None
            return False

# 辅助函数：检查数据库连接是否有效，如果无效则尝试重连
def is_db_connection_valid():
    """检查数据库连接是否有效，如果无效则尝试重连（线程安全）"""
    global connection
    with _db_lock:
        if not connection:
            logger.warning("[DB-CHECK] 数据库连接不存在，尝试重新连接...")
            return reconnect_database()
        
        try:
            # 记录连接状态
            logger.debug(f"[DB-CHECK] Checking connection, open={getattr(connection, 'open', None)}")
            # 使用 ping() 方法检查连接，这比执行查询更轻量
            connection.ping(reconnect=False)
            logger.debug("[DB-CHECK] Ping successful, connection is valid")
            return True
        except (pymysql.err.InterfaceError, pymysql.err.OperationalError, AttributeError) as e:
            logger.warning(f"[DB-CHECK] 数据库连接已断开 ({type(e).__name__}): {e}")
            return reconnect_database()
        except Exception as e:
            logger.error(f"[DB-CHECK] 数据库连接检查失败 ({type(e).__name__}): {e}")
            import traceback
            logger.error(f"[DB-CHECK] Traceback: {traceback.format_exc()}")
            # 如果 ping 失败，尝试重连
            try:
                return reconnect_database()
            except:
                return False

# 辅助函数：安全地获取数据库游标
def get_db_cursor(cursor_type=pymysql.cursors.DictCursor):
    """安全地获取数据库游标，确保连接有效（线程安全）"""
    global connection
    with _db_lock:
        # 在锁内检查连接（避免死锁，因为 is_db_connection_valid 也使用锁）
        if not connection:
            logger.warning("[CURSOR] 数据库连接不存在，尝试重新连接...")
            if not reconnect_database():
                raise Exception("无法建立数据库连接")
        
        # 检查连接是否有效（使用 ping，不获取锁）
        try:
            logger.debug(f"[CURSOR] Checking connection before creating cursor, open={getattr(connection, 'open', None)}")
            connection.ping(reconnect=False)
            logger.debug("[CURSOR] Connection ping successful")
        except (pymysql.err.InterfaceError, pymysql.err.OperationalError, AttributeError, OSError) as e:
            logger.warning(f"[CURSOR] 连接检查失败 ({type(e).__name__}): {e}")
            if not reconnect_database():
                raise Exception("无法重新连接数据库")
        
        try:
            cursor = connection.cursor(cursor_type)
            logger.debug(f"[CURSOR] Created cursor successfully: {type(cursor).__name__}")
            return cursor
        except (pymysql.err.InterfaceError, pymysql.err.OperationalError, OSError) as e:
            logger.warning(f"[CURSOR] 获取游标时连接错误 ({type(e).__name__}): {e}")
            if reconnect_database():
                try:
                    cursor = connection.cursor(cursor_type)
                    logger.debug(f"[CURSOR] Created cursor after reconnect: {type(cursor).__name__}")
                    return cursor
                except Exception as e2:
                    logger.error(f"[CURSOR] 重连后仍无法获取游标: {e2}")
                    raise Exception(f"无法获取数据库游标: {e2}")
            else:
                raise Exception("无法重新连接数据库")

# # 資料庫連接重連機制 by (ensure the db will not crash when the db is lost)
# def ensure_database_connection():
#     global connection
#     if not connection or not connection.open:
#         logger.warning("Database connection lost, attempting to reconnect...")
#         connection = connect_to_database()
#     return connection

#=================================== Define Request Types ==========================================

class AnnotationRequest(BaseModel):
    project_id: int
    video_id: int
    frame_num: int
    bboxes: list  # List of bounding boxes, each box is [class_name, x, y, w, h]

#=================================== Class to deal with user logins ==========================================

class UserLogin():
    def __init__(self, username, password, status=True):
        self.username = username
        self.password = password
        self.status = status      # True if account is active, Flase if account is freezed
        self.login_attempts = 0

    # Fetch hashed password and salt from database
    def get_password_hash(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT password FROM user WHERE username = %s"
        cursor.execute(query, (self.username,))
        password = cursor.fetchone()['password']
        cursor.close()
        decoded_bytes = base64.b64decode(password)
        salt, pwd_hash = decoded_bytes.split(b':')
        return pwd_hash, salt
    
    # Fecth userID given self.username
    def get_userID(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT user_id FROM user WHERE username = %s"
        cursor.execute(query,(self.username,))
        result = cursor.fetchone()
        cursor.close()
        if result:
            return result['user_id']
        else:
            return None

    # Main function that deals with the login
    # Output: True/False, str
    def login(self, max_attempts=3):
        if not self.status:
            return False, "Account locked."
        
        # Get stored hashed password from database
        stored_hash, salt = self.get_password_hash()
        if stored_hash is None:
            return False, "User not found."
        
        # Verify if the password is correct
        is_correct = self._verify_password(stored_hash, salt, self.password)

        if is_correct:
            self.login_attempts = 0
            return True, "Login successful."

        else:
            self.login_attempts += 1
            if self.login_attempts >= max_attempts:
                self.status = False
                return False, "Login attempts exceeded. Account locked."
            return False, "Invalid password."
        
    # Hash a plain-text password with a given salt
    @staticmethod
    def _hash_password(password, salt=None):
        # Generate a random salt if not provided
        if salt is None:
            salt = os.urandom(16)
        # Use PBKDF2-HMAC-SHA256 as the hashing algorithm
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100_000)
        return salt, pwd_hash

    # Check whether the hashed passwords matches
    @staticmethod
    def _verify_password(stored_hash, stored_salt, provided_password):
        # Hash the provided password using the stored salt
        _, pwd_hash = UserLogin._hash_password(provided_password, salt=stored_salt)
        # Use hmac.compare_digest to avoid timing attacks
        return hmac.compare_digest(pwd_hash, stored_hash)

#=================================== Class to deal with user info ==========================================

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    # Fetch username from database given the userID
    def get_username(self):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            query= "SELECT username FROM user WHERE user_id =%s"
            cursor.execute(query,(self.userID,))
            result = cursor.fetchone()
            return result['username'] if result else None
        finally:
            cursor.close()

    # Fetch all project IDs of projects the user own
    # Output: [projectID, projectID, ...]
    def get_owned_projects(self):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            query="SELECT DISTINCT project_id FROM project WHERE project_owner_id =%s"
            cursor.execute(query,(self.userID,))
            result = cursor.fetchall()
            owned_projects = [d['project_id'] for d in result if 'project_id' in d]
            self.owned_projects = owned_projects
            return owned_projects
        finally:
            cursor.close()
    
    # Fetch all the project IDs of projects the user has been shared with
    # Output: [projectID, projectID, ...]
    def get_shared_projects(self):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            query="SELECT DISTINCT project_id FROM project_shared_users WHERE user_id =%s"
            cursor.execute(query,(self.userID,))
            result = cursor.fetchall()
            shared_projects = [d['project_id'] for d in result if 'project_id' in d]
            self.shared_projects = shared_projects
            return shared_projects
        finally:
            cursor.close()

#=================================== Class to deal with projects ==========================================

class Project():
    def __init__(self, project_id=None, initialize=False):
        if initialize:
            # 初始化新项目时不执行任何操作
            pass
        else:
            self.project_id = project_id
            self.project_name = self.get_project_name()
            self.owner = self.get_owner()
            self.project_status = self.get_project_status()

    # Initialize the attributes and database when the project is first created
    # Input: project name, project type, ID of owner
    # Output: project ID (int)
    def initialize(self, project_name: str, project_type: str, owner: int):
        self.project_name = project_name
        if self.project_name.strip() == '':
            self.project_name = "Untitled"
            i = 1
            while self.project_name_exists():
                self.project_name = f"{self.project_name} {i}"
                i += 1
        self.project_type = project_type
        self.owner = owner
        self.project_status = "Not started" # can be "Awaiting Labeling", "Labeling in progress", "Data is ready", "Training in progress", "Trained"

        # Add new row in project table
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="INSERT INTO project (project_name, project_type, project_owner_id, project_status, model_path, dataset_path) VALUES (%s, %s, %s, %s, %s, %s);"
        cursor.execute(query,(self.project_name, self.project_type, self.owner, self.project_status, "", ""))
        project_id = cursor.lastrowid
        connection.commit()  # 提交事务
        cursor.close()
        
        # Save project_id to the attribute
        self.project_id = project_id
        
        # Create project directory
        self.project_path = self.get_project_path()

        return project_id
    
    # Check if project name exists for this owner
    # Output: True/False
    def project_name_exists(self):
        self.project_name = self.get_project_name()
        self.owner = self.get_owner()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT COUNT(*) as count FROM project WHERE project_name = %s AND project_owner_id = %s"
        cursor.execute(query, (self.project_name, self.owner))
        result = cursor.fetchone()
        cursor.close()
        return result['count'] > 0
    
    # Fetch project name given project ID
    # Output: str
    def get_project_name(self):
        try:
            # 檢查資料庫連接
            if not is_db_connection_valid():
                logger.error("Database connection not available in get_project_name")
                return None
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT project_name FROM project WHERE project_id = %s"
            cursor.execute(query,(self.project_id,))
            result = cursor.fetchone()
            cursor.close()
            if result:
                return result['project_name']
            else:
                logger.warning(f"Project with ID {self.project_id} not found")
                return None
        except Exception as e:
            logger.error(f"Error in get_project_name: {str(e)}")
            return None
    
    # Fetch project type given project ID]
    # Output: str
    def get_project_type(self):
        # Set in next phrase
        project_type = "YOLO object detection"
        return project_type
    
    # Fetch list of videos given project ID
    # Output: [video ID (int), ...]
    def get_videos(self):
        try:
            # 檢查資料庫連接
            if not is_db_connection_valid():
                logger.error("Database connection not available in get_videos")
                return []
                
            cursor = get_db_cursor()
            try:
                query = "SELECT DISTINCT video_id FROM video WHERE project_id = %s ORDER BY video_id ASC"
                cursor.execute(query,(self.project_id,))
                data = cursor.fetchall()
                video_ids = [d['video_id'] for d in data if 'video_id' in d]
                return video_ids
            finally:
                cursor.close()
        except Exception as e:
            logger.error(f"Error in get_videos: {str(e)}")
            return []
    
    # Count number of videos of a project
    # Output: int
    def get_video_count(self):
        try:
            # 檢查資料庫連接
            if not is_db_connection_valid():
                logger.error("Database connection not available in get_video_count")
                return 0
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT COUNT(video_id) as total FROM video WHERE project_id = %s"
            cursor.execute(query,(self.project_id,))
            result = cursor.fetchone()
            video_count = result['total'] if result else 0
            cursor.close()
            return int(video_count) if video_count is not None else 0
        except Exception as e:
            logger.error(f"Error in get_video_count: {str(e)}")
            return 0
    
    # Fetch the ID of the owner of a project
    # Output: Owner's ID (int)
    def get_owner(self):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            query = "SELECT project_owner_id FROM project WHERE project_id = %s"
            cursor.execute(query,(self.project_id,))
            result = cursor.fetchone()
            if result:
                return result['project_owner_id']
            else:
                return None
        finally:
            cursor.close()
    
    # Fetch all shared users of a project
    # Output: [shared user ID (int), ...]
    def get_shared_users(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT DISTINCT user_id FROM project_shared_users WHERE project_id = %s"
        cursor.execute(query,(self.project_id,))
        result = cursor.fetchall()
        shared_users = [d['user_id'] for d in result if 'user_id' in d]
        return shared_users
    
    # Fetch all the classes that the model would contain in a project
    # Output: {class_name (str): color (str), ...}
    def get_classes(self):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            query = "SELECT class_name, color FROM class WHERE project_id = %s"
            cursor.execute(query, (self.project_id,))
            rows = cursor.fetchall()
            classes = {item["class_name"]: item["color"] for item in rows}
            return classes
        finally:
            cursor.close()
    
    # Fetch the status of a project
    # Output: Project status(str)
    def get_project_status(self):
        try:
            # 檢查資料庫連接
            if not is_db_connection_valid():
                logger.error("Database connection not available in get_project_status")
                return "Unknown"
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT project_status FROM project WHERE project_id = %s"
            cursor.execute(query,(self.project_id,))
            result = cursor.fetchone()
            cursor.close()
            if result:
                return result['project_status']
            else:
                logger.warning(f"Project status not found for project ID {self.project_id}")
                return "Unknown"
        except Exception as e:
            logger.error(f"Error in get_project_status: {str(e)}")
            return "Error"

    def get_project_progress(self):
        try:
            # 檢查資料庫連接
            if not is_db_connection_valid():
                logger.error("Database connection not available in get_project_progress")
                return 0
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT training_progress FROM project WHERE project_id = %s"
            cursor.execute(query,(self.project_id,))
            result = cursor.fetchone()
            if result:
                return result['training_progress']
            else:
                logger.warning(f"Project progress not found for project ID {self.project_id}")
                return 0
        except Exception as e:
            logger.error(f"Error in get_project_status: {str(e)}")
            return "Error"
    
    # Get the working directory of the project (create if not exists)
    # Output: Project path (str)
    def get_project_path(self):
        base_dir = os.path.abspath(os.path.dirname(__file__))
        project_path = os.path.join(base_dir, "projects", str(self.project_id))
        
        # 確保路徑使用正確的分隔符
        project_path = os.path.normpath(project_path)
        
        try:
            if not os.path.exists(project_path):
                os.makedirs(project_path, exist_ok=True)
                logger.info(f"Created project directory: {project_path}")
            
            return project_path  # 返回帶分隔符的路徑
        except Exception as e:
            logger.error(f"Error creating project directory {project_path}: {str(e)}")
            # 如果創建失敗，返回一個安全的默認路徑
            fallback_path = os.path.join(base_dir, "projects", "temp")
            os.makedirs(fallback_path, exist_ok=True)
            return fallback_path + os.sep
    
    # Change project name
    def change_project_name(self, new_name: str):
        self.project_name = new_name
        self.save_project_name()
        return True
    
    # Check if a class alredy exists (by checking class name)
    # Output: True/False
    def check_class_exists(self, class_name: str):
        self.classes = self.get_classes()
        return class_name in self.classes
    
    # Add class and save to database
    # Output: True
    def add_class(self, class_name: str, colour: str):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        self.classes = self.get_classes()
        self.classes[class_name] = colour
        
        # Add new row in class table
        cursor = get_db_cursor()
        try:
            query="INSERT INTO class (project_id, class_name, color) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE `color` = VALUES(`color`);"
            cursor.execute(query,(self.project_id, class_name, colour))
            connection.commit()
        finally:
            cursor.close()

        return True
    
    # Modify class name and save to database
    # Output: True
    def modify_class(self, old_class_name: str, new_class_name: str):
        self.classes = self.get_classes()
        self.classes[new_class_name] = self.classes.pop(old_class_name)

        # Save change to database
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE class SET class_name = %s WHERE project_id = %s AND class_name = %s;"
        cursor.execute(query,(new_class_name, self.project_id, old_class_name))
        connection.commit()
        cursor.close()

        return True
    
    # Delete class from both the class and database
    # Output: True
    def delete_class(self, class_name: str):
        self.classes = self.get_classes()
        self.classes.pop(class_name)

        # Save changes to database
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "DELETE FROM class WHERE project_id = %s AND class_name = %s"
        cursor.execute(query,(self.project_id, class_name))
        connection.commit()
        cursor.close()

        return True

    # Create dataset in standard YOLO format after auto-annotation completed
    # Standard YOLO format: working directory -> dataset -> (labels -> (image1.txt, ...), images -> (image1.jpg, ...))
    # Output: True
    def create_dataset(self):
        label_dir = f"{self.get_project_path()}/dataset/labels/"
        image_dir = f"{self.get_project_path()}/dataset/images/"
        
        # Create directories if they don't exist
        try:
            os.makedirs(label_dir, exist_ok=True)
            os.makedirs(image_dir, exist_ok=True)
            logger.info(f"Created dataset directories: {label_dir}, {image_dir}")
        except Exception as e:
            logger.error(f"Error creating dataset directories: {str(e)}")
            raise
        # Create the class_ID, class_name dictionary
        self.classes = self.get_classes()
        class_list = [key for key in self.classes]
        class_list.sort()
        class_id_dict = {}
        id = 0
        for _class in class_list:
            class_id_dict[_class] = id
            id += 1
        self.save_class_ids(class_id_dict)
        self.videos = self.get_videos()
        total_videos = len(self.videos)
        logger.info(f"📦 [DATASET] Starting dataset creation for {total_videos} video(s)")
        if not self.videos:
            logger.warning("⚠️ [DATASET] No videos found in project")
            raise ValueError("No videos found in project. Please upload videos first.")
        
        # 初始化进度为0
        self.save_auto_annotation_progress(0)
        
        for video_idx, video_id in enumerate(self.videos):
            try:
                video = Video(self.project_id, video_id)
                logger.info(f"📹 [DATASET] Processing video {video_id}")
                # 获取视频路径
                video_path = video.get_video_path()
                if not video_path:
                    logger.error(f"❌ [DATASET] Video path not found for video_id {video_id}")
                    raise ValueError(f"Video path not found for video_id {video_id}")
                
                if not os.path.exists(video_path):
                    logger.error(f"❌ [DATASET] Video file does not exist: {video_path}")
                    raise ValueError(f"Video file does not exist: {video_path}")
                # Write labels in txt files
                bbox_data = video.get_bbox_data()
                logger.info(f"📝 [DATASET] Found {len(bbox_data)} bbox annotations for video {video_id}")
                
                if not bbox_data:
                    logger.warning(f"⚠️ [DATASET] No bbox data found for video {video_id}, skipping label creation")
                else:
                    # Get video resolution for coordinate normalization
                    try:
                        img_width, img_height = video.get_resolution()
                        logger.info(f"📐 [DATASET] Video {video_id} resolution: {img_width}x{img_height}")
                    except Exception as e:
                        logger.error(f"❌ [DATASET] Failed to get video resolution: {e}")
                        # Try to get from first frame image
                        first_frame_path = f"{image_dir}/{video.video_id}_frame_0.jpg"
                        if os.path.exists(first_frame_path):
                            img = cv2.imread(first_frame_path)
                            if img is not None:
                                img_height, img_width = img.shape[:2]
                                logger.info(f"📐 [DATASET] Got resolution from first frame: {img_width}x{img_height}")
                            else:
                                raise ValueError(f"Cannot determine image resolution for video {video_id}")
                        else:
                            raise ValueError(f"Cannot determine image resolution for video {video_id}")
                    
                    for result in bbox_data:
                        # bbox_data = [{"frame_num": 0, "class_name": "车", "coordinates": "100 100 50 50"}, ...]
                        # coordinates format: "x y width height" (absolute pixels)
                        frame_num = result['frame_num']
                        class_name = result['class_name']
                        coordinates = result['coordinates']

                        if not isinstance(coordinates, str):
                            logger.error(f"❌ [DATASET] Invalid coordinates for video {video_id}, frame {frame_num}")
                            raise ValueError(f"Video {video.video_id} has unannotated frames. Please complete annotation before creating dataset.")
                        
                        if class_name not in class_id_dict:
                            logger.warning(f"⚠️ [DATASET] Class '{class_name}' not found in class list, skipping")
                            continue
                        
                        # Parse coordinates: "x y width height" (absolute pixels)
                        try:
                            coords = list(map(float, coordinates.split()))
                            if len(coords) != 4:
                                logger.error(f"❌ [DATASET] Invalid coordinate format for video {video_id}, frame {frame_num}: {coordinates}")
                                continue
                            
                            x, y, w, h = coords
                            
                            # Convert to YOLO format: normalized (center_x, center_y, width, height)
                            # YOLO format: center_x = (x + w/2) / img_width, center_y = (y + h/2) / img_height
                            #             width = w / img_width, height = h / img_height
                            center_x = (x + w / 2.0) / img_width
                            center_y = (y + h / 2.0) / img_height
                            norm_width = w / img_width
                            norm_height = h / img_height
                            
                            # Validate normalized coordinates (should be between 0 and 1)
                            if not (0 <= center_x <= 1 and 0 <= center_y <= 1 and 0 <= norm_width <= 1 and 0 <= norm_height <= 1):
                                logger.warning(f"⚠️ [DATASET] Coordinates out of bounds for video {video_id}, frame {frame_num}: center_x={center_x:.3f}, center_y={center_y:.3f}, w={norm_width:.3f}, h={norm_height:.3f}")
                                # Clamp to valid range
                                center_x = max(0, min(1, center_x))
                                center_y = max(0, min(1, center_y))
                                norm_width = max(0, min(1, norm_width))
                                norm_height = max(0, min(1, norm_height))
                            
                            # Format YOLO label: class_id center_x center_y width height
                            yolo_coords = f"{center_x:.6f} {center_y:.6f} {norm_width:.6f} {norm_height:.6f}"
                            
                        except Exception as e:
                            logger.error(f"❌ [DATASET] Error parsing coordinates for video {video_id}, frame {frame_num}: {coordinates}, error: {e}")
                            continue
                        
                        filename = f"{label_dir}/{video.video_id}_frame_{frame_num}.txt"

                        with open(filename, 'a') as file:
                            file.write(f"{class_id_dict[class_name]} {yolo_coords}\n")
                    
                    logger.info(f"✅ [DATASET] Created {len(bbox_data)} label files for video {video_id}")
                # Decompose videos into jpg images
                logger.info(f"🎬 [DATASET] Extracting frames from video {video_id}: {video_path}")
                cap = cv2.VideoCapture(str(video_path))
                
                if not cap.isOpened():
                    logger.error(f"❌ [DATASET] Could not open video file: {video_path}")
                    cap.release()
                    raise ValueError(f"Could not open video file: {video_path}")
                frame_idx = 0
                extracted_count = 0
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    image_path = f"{image_dir}/{video.video_id}_frame_{frame_idx}.jpg"
                    success = cv2.imwrite(image_path, frame)
                    if success:
                        extracted_count += 1
                    else:
                        logger.warning(f"⚠️ [DATASET] Failed to save frame {frame_idx} for video {video_id}")
                    frame_idx += 1
                cap.release()
                logger.info(f"✅ [DATASET] Extracted {extracted_count} frames from video {video_id}")
                
                # 更新进度：每个视频完成后更新进度
                # 进度 = (已处理的视频数 / 总视频数) * 100
                progress = int((video_idx + 1) / total_videos * 100)
                self.save_auto_annotation_progress(progress)
                logger.info(f"📊 [DATASET] Progress updated: {progress}% ({video_idx + 1}/{total_videos} videos processed)")
                
            except Exception as e:
                logger.error(f"❌ [DATASET] Error processing video {video_id}: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise

        self.project_status = "Data is ready"
        self.save_project_status()
        
        # 保存数据集路径到数据库
        # Save the dataset path (should be project_path/dataset, not just project_path)
        dataset_path = os.path.join(self.get_project_path(), "dataset")
        self.save_dataset_path(dataset_path)

        return True
    
    # Get auto annotation progress (int) from database
    def get_auto_annotation_progress(self):
        try:
            # 首先检查项目状态，如果数据集已创建完成，直接返回 100%
            project_status = self.get_project_status()
            if project_status == "Data is ready":
                logger.info(f"✅ [PROGRESS] Project {self.project_id} dataset is ready, returning 100%")
                return 100.0
            
            finished_frames = 0
            total_frames = 0
            # 确保 videos 列表已初始化
            if not hasattr(self, 'videos') or self.videos is None:
                self.videos = self.get_videos()
            
            if not self.videos:
                # 如果没有视频，返回 0 进度
                return 0.0
            
            for video_id in self.videos:
                try:
                    video = Video(project_id=self.project_id, video_id=video_id)
                    annotation_status, last_annotated_frame = video.get_annotation_status()
                    
                    # 尝试获取帧数，如果失败则跳过该视频
                    try:
                        frame_count = video.get_frame_count()
                    except Exception as e:
                        logger.warning(f"Could not get frame count for video {video_id}: {e}")
                        continue
                    
                    if annotation_status == "auto annotation in progress":
                        total_frames = last_annotated_frame + 1
                    elif annotation_status == "completed" or annotation_status == "manual annotation completed":
                        finished_frames += frame_count
                    total_frames += frame_count
                except Exception as e:
                    logger.error(f"Error processing video {video_id} in get_auto_annotation_progress: {e}")
                    continue
            
            overall_progress = finished_frames / total_frames if total_frames > 0 else 0.0
            return overall_progress
        except Exception as e:
            logger.error(f"Error in get_auto_annotation_progress: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return 0.0
    
    # Get basic information of all videos from database
    # Output: [{"name": video_name, "file: video, "path": video_path}, ...]
    def get_uploaded_videos(self):
        videos_info = []
        self.videos = self.get_videos()
        for video_id in self.videos:
            video = Video(project_id=self.project_id, video_id=video_id)
            video_info = video.get_video_info()
            videos_info.append(video_info)
        return videos_info
    
    # Save project status to database
    def save_project_status(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_status = %s WHERE project_id = %s"
        cursor.execute(query,(self.project_status, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()        
        return success
    
    # Save dataset path to database
    def save_dataset_path(self, dataset_path):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET dataset_path = %s WHERE project_id = %s"
        cursor.execute(query,(dataset_path, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()        
        return success
    
    # Get dataset path from database
    def get_dataset_path(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT dataset_path FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id,))
        result = cursor.fetchone()
        cursor.close()
        return result['dataset_path'] if result else None
    
    # Get model path from database
    def get_model_path_from_db(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT model_path FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id,))
        result = cursor.fetchone()
        cursor.close()
        return result['model_path'] if result else None
    
    # Save model path to database
    def save_model_path(self, model_path):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET model_path = %s WHERE project_id = %s"
        cursor.execute(query,(model_path, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()        
        return success    
    
    # Save project name to database
    def save_project_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_name = %s WHERE project_id = %s"
        cursor.execute(query,(self.project_name, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save project type to database
    def save_project_type(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_type = %s WHERE project_id = %s"
        cursor.execute(query,(self.project_type, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save owner ID to database
    def save_owner(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_owner_id = %s WHERE project_id = %s"
        cursor.execute(query,(self.owner, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save training progress (int) to database
    def save_training_progress(self, training_progress: int):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET training_progress = %s WHERE project_id = %s"
        cursor.execute(query,(training_progress, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close() 
        return success 
    
    # Save auto annotation progress (int) to database
    def save_auto_annotation_progress(self, auto_annotation_progress: int):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET auto_annotation_progress = %s WHERE project_id = %s"
        cursor.execute(query,(auto_annotation_progress, self.project_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save class ids as used in the model
    ### Not yet validated
    def save_class_ids(self, class_list):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        success = True
        for class_name in class_list:
            cursor = get_db_cursor()
            try:
                query = "UPDATE class SET class_num = %s WHERE project_id = %s AND class_name = %s"
                cursor.execute(query, (class_list[class_name], self.project_id, class_name))
                connection.commit()
                success = bool(cursor.rowcount) and success
            finally:
                cursor.close()
        return success  
    
    # get class ids as used in the model
    def get_class_ids(self):
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            query = "SELECT class_name, class_num FROM class WHERE project_id = %s"
            cursor.execute(query, (self.project_id,))
            rows = cursor.fetchall()
            class_id_list = {item["class_name"]: item["class_num"] for item in rows}
            return class_id_list
        finally:
            cursor.close()
    
    # Used during training
    @staticmethod
    def copy_files(image_list, img_dest, lbl_dest, labels_dir):
        """Copy image files and their corresponding label files to train/val directories"""
        copied_count = 0
        for img_path in image_list:
            try:
                base_name = img_path.stem
                label_path = labels_dir / (base_name + ".txt")
                
                # Copy image file
                copy2(img_path, img_dest)
                
                # Copy label file if it exists
                if label_path.exists():
                    copy2(label_path, lbl_dest)
                else:
                    # Create empty label file if it doesn't exist (for images without annotations)
                    empty_label = lbl_dest / (base_name + ".txt")
                    empty_label.touch()
                
                copied_count += 1
            except Exception as e:
                logger.warning(f"Failed to copy {img_path}: {e}")
                continue
        
        logger.info(f"Copied {copied_count}/{len(image_list)} files to {img_dest}")
        return copied_count
    
    def train(self):
        self.project_status = "Training in progress"
        self.save_project_status()

        # Get dataset path from database, fallback to default if not found
        dataset_path = self.get_dataset_path()
        default_dataset_dir = Path(self.get_project_path()) / "dataset"
        
        if dataset_path:
            dataset_dir = Path(dataset_path)
            # Verify the path is correct - it should point to the dataset directory, not project root
            # If it points to project root (no "dataset" in path), use default
            if "dataset" not in str(dataset_dir) or not dataset_dir.exists():
                logger.warning(f"Database dataset_path '{dataset_path}' is invalid, using default: {default_dataset_dir}")
                dataset_dir = default_dataset_dir
        else:
            # Fallback to default path
            dataset_dir = default_dataset_dir
        
        # Check if dataset exists and has images, if not create it automatically
        images_dir = dataset_dir / "images"
        if not images_dir.exists() or not (any(images_dir.glob("*.jpg")) or any(images_dir.glob("*.png"))):
            logger.info("Dataset not found or empty, creating dataset automatically...")
            try:
                self.create_dataset()
                # After creating dataset, update dataset_dir to the correct path
                dataset_dir = Path(self.get_project_path()) / "dataset"
                images_dir = dataset_dir / "images"
                logger.info("Dataset created successfully!")
            except Exception as e:
                logger.error(f"Failed to create dataset: {e}")
                self.project_status = "Dataset creation failed"
                self.save_project_status()
                return False
        
        images_dir = dataset_dir / "images"
        labels_dir = dataset_dir / "labels"
        train_img_dir = dataset_dir / "train" / "images"
        train_lbl_dir = dataset_dir / "train" / "labels"
        val_img_dir = dataset_dir / "val" / "images"
        val_lbl_dir = dataset_dir / "val" / "labels"
        output_dir = Path(self.get_project_path()) / "output"
        output_dir.mkdir(exist_ok=True)

        # Clean and create split folders
        for d in [train_img_dir, train_lbl_dir, val_img_dir, val_lbl_dir]:
            if d.exists():
                rmtree(d)
            d.mkdir(parents=True, exist_ok=True)

        # Gather all images and shuffle
        all_images = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png"))
        if not all_images:
            raise ValueError(f"No images found in dataset/images directory: {images_dir}. Please create dataset first.")
        
        logger.info(f"Found {len(all_images)} images in dataset, splitting into train/val...")
        random.shuffle(all_images)
        split_idx = int(0.8 * len(all_images))

        train_images = all_images[:split_idx]
        val_images = all_images[split_idx:]
        
        logger.info(f"Splitting dataset: {len(train_images)} train, {len(val_images)} val images")

        # Copy files and get counts
        train_copied = self.copy_files(train_images, train_img_dir, train_lbl_dir, labels_dir)
        val_copied = self.copy_files(val_images, val_img_dir, val_lbl_dir, labels_dir)
        
        # Verify files were copied
        train_count = len(list(train_img_dir.glob("*.jpg"))) + len(list(train_img_dir.glob("*.png")))
        val_count = len(list(val_img_dir.glob("*.jpg"))) + len(list(val_img_dir.glob("*.png")))
        logger.info(f"Dataset split completed: {train_count} train images ({train_copied} copied), {val_count} val images ({val_copied} copied)")
        
        if train_count == 0:
            logger.error(f"Failed to copy training images. Source: {images_dir}, Destination: {train_img_dir}")
            # Debug: check if source files exist
            source_files = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png"))
            logger.error(f"Source directory has {len(source_files)} files")
            raise ValueError(f"Failed to copy training images. Copied {train_copied} but found {train_count} in destination.")

        # Define class list
        classes = sorted(self.get_classes().keys())

        # Create result.yaml for dataset with full COCO classes
        data_yaml = {
            "train": str(train_img_dir.resolve()),
            "val": str(val_img_dir.resolve()),
            "nc": len(classes),
            "names": classes
        }

        yaml_path = dataset_dir / "data.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(data_yaml, f)

        # Load pretrained YOLOv11n model
        model = YOLO("yolo11n.pt")

        # Total epochs
        total_epochs = 5

        # Train the model
        print("Starting model training...")
        try:
            # Train epoch-by-epoch to track progress
            # Set project directory to save training outputs in the project folder
            train_project_dir = output_dir / "runs"
            # Use absolute path to ensure YOLO saves to the correct location
            train_project_dir_abs = train_project_dir.resolve()
            train_project_dir_abs.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Training model with project directory: {train_project_dir_abs}")
            
            # Auto-detect device: use CUDA if available, otherwise CPU
            import torch
            if torch.cuda.is_available():
                device = 0
                logger.info("Using CUDA device for training")
            else:
                device = 'cpu'
                logger.info("CUDA not available, using CPU for training")
            
            # Verify train/val directories exist (they should have been created above)
            train_img_dir = dataset_dir / "train" / "images"
            val_img_dir = dataset_dir / "val" / "images"
            
            if not train_img_dir.exists() or not val_img_dir.exists():
                logger.error(f"Train/val directories not found. Train: {train_img_dir}, Val: {val_img_dir}")
                raise FileNotFoundError(f"Training/validation directories not found. Train: {train_img_dir}, Val: {val_img_dir}")
            
            train_images = list(train_img_dir.glob("*.jpg")) + list(train_img_dir.glob("*.png"))
            val_images = list(val_img_dir.glob("*.jpg")) + list(val_img_dir.glob("*.png"))
            logger.info(f"Training dataset: {len(train_images)} images, Validation: {len(val_images)} images")
            
            if len(train_images) == 0:
                logger.error(f"No training images found in {train_img_dir}")
                # List what files are actually there
                all_files = list(train_img_dir.glob("*"))
                logger.error(f"Files in train directory: {[str(f) for f in all_files[:10]]}")
                raise ValueError(f"No training images found in {train_img_dir}. Please check dataset split.")
            
            for epoch in range(total_epochs):
                logger.info(f"Starting epoch {epoch + 1}/{total_epochs}")
                try:
                    # If not the first epoch, load model from checkpoint
                    if epoch > 0:
                        last_checkpoint = train_project_dir_abs / "train" / "weights" / "last.pt"
                        if last_checkpoint.exists():
                            logger.info(f"Resuming training from checkpoint: {last_checkpoint}")
                            # Load model from checkpoint - this automatically resumes training
                            model = YOLO(str(last_checkpoint))
                    
                    # Training parameters
                    train_kwargs = {
                        "data": str(yaml_path),
                        "epochs": 1,
                        "imgsz": 640,
                        "batch": 4,
                        "device": device,
                        "save": True,
                        "exist_ok": True,
                        "project": str(train_project_dir_abs),
                        "name": "train",
                        "verbose": True
                    }
                    
                    # When loading from checkpoint, YOLO automatically resumes, no need for resume parameter
                    results = model.train(**train_kwargs)
                    logger.info(f"Epoch {epoch + 1} completed successfully")
                    # Check if model was saved
                    expected_model = train_project_dir_abs / "train" / "weights" / "best.pt"
                    if expected_model.exists():
                        logger.info(f"Model saved to: {expected_model}")
                    else:
                        logger.warning(f"Model file not found at expected location: {expected_model}")
                except Exception as epoch_error:
                    logger.error(f"Error in epoch {epoch + 1}: {epoch_error}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    # Don't raise immediately, check if partial training created any files
                    check_dir = train_project_dir_abs / "train" / "weights"
                    if check_dir.exists():
                        files = list(check_dir.glob("*.pt"))
                        if files:
                            logger.info(f"Found partial model files: {files}")
                    raise
                progress = round((epoch + 1) / total_epochs * 100) # YOUR TRAINING VARIABLE
                print(f"Training progress: {progress}%")
                self.save_training_progress(progress)
            
            # Final check: verify model file exists
            final_model = train_project_dir_abs / "train" / "weights" / "best.pt"
            if final_model.exists():
                logger.info(f"✓ Training completed successfully! Model saved to: {final_model}")
                print("Model training completed successfully!")
            else:
                logger.error(f"✗ Training completed but model file not found at: {final_model}")
                # List all files in the runs directory for debugging
                if train_project_dir_abs.exists():
                    all_files = list(train_project_dir_abs.rglob("*"))
                    logger.error(f"Files in runs directory: {[str(f) for f in all_files]}")
                raise FileNotFoundError(f"Training completed but model file not found: {final_model}")

        except Exception as e:
            logger.error(f"Training error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            print(f"Training completed with warnings: {e}")
            # Check if any model files were created despite the error
            train_weights_dir = train_project_dir_abs / "train" / "weights"
            if train_weights_dir.exists():
                model_files = list(train_weights_dir.glob("*.pt"))
                if model_files:
                    logger.info(f"Found {len(model_files)} model files despite error: {model_files}")
            # Continue with post-processing even if there are warnings
        
        # Update progress to 100% after training
        print("Training progress: 100.00%")
        self.save_training_progress(100)

        # Copy best.pt to output folder
        # YOLO saves to project/runs/train/weights/best.pt when project is specified
        train_project_dir = output_dir / "runs"
        train_project_dir_abs = train_project_dir.resolve()
        best_weights_src = train_project_dir_abs / "train" / "weights" / "best.pt"
        
        # Get absolute paths for all possible locations
        # YOLO may save to different locations depending on working directory
        backend_dir = Path(__file__).parent
        project_path = Path(self.get_project_path())
        current_dir = Path.cwd()
        
        # Also check other possible locations (use absolute paths)
        possible_paths = [
            best_weights_src.resolve(),  # Expected location with project specified (absolute)
            (train_project_dir / "train" / "weights" / "best.pt").resolve(),  # Absolute path
            (backend_dir / "runs" / "detect" / "train" / "weights" / "best.pt").resolve(),  # Backend directory
            (backend_dir / "runs" / "train" / "weights" / "best.pt").resolve(),  # Alternative backend location
            (current_dir / "runs" / "detect" / "train" / "weights" / "best.pt").resolve(),  # Current working directory
            (current_dir / "runs" / "train" / "weights" / "best.pt").resolve(),  # Alternative current dir
            (project_path / "runs" / "train" / "weights" / "best.pt").resolve(),  # Project directory
            (backend_dir / "best.pt").resolve(),  # Backend root (last resort, may be corrupted)
        ]
        
        # IMPORTANT: Each project should have its own model file
        # Model files are stored in: projects/{project_id}/output/best.pt
        # This ensures:
        # 1. No conflicts between different projects
        # 2. Easy to manage and backup per-project models
        # 3. Clear separation of concerns
        
        # Note: backend/best.pt is a legacy fallback and should be avoided
        # It's only checked if no project-specific model is found
        
        best_weights_found = None
        logger.info(f"Searching for model file in {len(possible_paths)} possible locations...")
        for i, path in enumerate(possible_paths, 1):
            logger.info(f"Checking location {i}/{len(possible_paths)}: {path}")
            if path.exists():
                logger.info(f"Found model file at: {path}")
                # Verify source file is valid before using it
                try:
                    import torch
                    # Quick check: try to load the file to verify it's not corrupted
                    # Use weights_only=False for YOLO models (PyTorch 2.6+ default changed)
                    torch.load(str(path), map_location='cpu', weights_only=False)
                    best_weights_found = path
                    logger.info(f"✓ Valid model found at: {best_weights_found}")
                    break
                except Exception as verify_error:
                    logger.warning(f"✗ Model file at {path} is corrupted, skipping: {verify_error}")
                    continue
            else:
                logger.debug(f"  Path does not exist: {path}")
        
        best_weights_dst = output_dir / "best.pt"

        if best_weights_found and best_weights_found.exists():
            try:
                # Verify source file is complete before copying
                src_size = best_weights_found.stat().st_size
                if src_size < 1024 * 1024:  # Less than 1MB is suspicious
                    logger.warning(f"Source model file is suspiciously small: {src_size} bytes")
                    raise ValueError(f"Source model file too small: {src_size} bytes")
                
                # Use shutil.copyfile for atomic copy, then verify
                import shutil
                shutil.copyfile(best_weights_found, best_weights_dst)
                
                # Verify copied file integrity
                dst_size = best_weights_dst.stat().st_size
                if dst_size != src_size:
                    logger.error(f"File copy incomplete! Source: {src_size} bytes, Destination: {dst_size} bytes")
                    best_weights_dst.unlink()  # Delete incomplete file
                    raise IOError(f"File copy failed: size mismatch ({src_size} vs {dst_size} bytes)")
                
                # Try to verify file is a valid PyTorch file
                try:
                    import torch
                    # Use weights_only=False for YOLO models (PyTorch 2.6+ default changed)
                    torch.load(str(best_weights_dst), map_location='cpu', weights_only=False)
                    logger.info(f"Verified model file integrity: {best_weights_dst}")
                except Exception as verify_error:
                    logger.error(f"Copied model file is corrupted: {verify_error}")
                    best_weights_dst.unlink()  # Delete corrupted file
                    raise IOError(f"Copied model file is corrupted: {verify_error}")
                
                print(f"Best model weights saved and verified: {best_weights_dst}")
            except Exception as e:
                logger.error(f"Error copying model file: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                print(f"Warning: Failed to copy model file: {e}")
        else:
            print("Warning: best.pt not found in any expected location")

        print("Training complete.")

        # Always update status to completed, regardless of any errors
        try:
            self.project_status = "Training completed"
            self.save_project_status()
            print("Project status updated to 'Training completed'")
            
            # Save model path to database
            if best_weights_dst.exists():
                model_path = str(best_weights_dst.resolve())
                self.save_model_path(model_path)
                print(f"Model path saved to database: {model_path}")
            else:
                print("Warning: Model file not found, cannot save path to database")
                
        except Exception as e:
            print(f"Error updating project status: {e}")
            # Force update status even if there's an error
            try:
                cursor = connection.cursor(pymysql.cursors.DictCursor)
                cursor.execute("UPDATE project SET project_status = %s, training_progress = %s WHERE project_id = %s", 
                             ("Training completed", 100, self.project_id))
                connection.commit()
                cursor.close()
                print("Project status force-updated to 'Training completed'")
            except Exception as e2:
                print(f"Failed to force-update status: {e2}")

    # Get model path
    def get_model_path(self):
        model_path = Path(self.get_project_path()) / "output" / "best.pt"
        return model_path

    # Get model performance
    def get_model_performance(self):
        model_path = self.get_model_path()
        if not model_path.exists():
            raise FileNotFoundError("Model file 'best.pt' not found. Please train the model first.")
        
        # Check if model file is valid and has reasonable size (at least 1MB)
        file_size = model_path.stat().st_size
        if file_size < 1024 * 1024:  # Less than 1MB is suspicious
            logger.warning(f"Model file is suspiciously small: {file_size} bytes")
        
        # Try to find model from database path if current path fails
        db_model_path = self.get_model_path_from_db()
        if db_model_path and Path(db_model_path).exists() and db_model_path != str(model_path):
            logger.info(f"Found alternative model path in database: {db_model_path}")
            # Use database path if it's different and exists
            alt_path = Path(db_model_path)
            if alt_path.stat().st_size > file_size:  # Prefer larger file
                model_path = alt_path
                logger.info(f"Using model from database path: {model_path}")
        
        # Load the trained model
        try:
            model = YOLO(str(model_path))
        except RuntimeError as e:
            if "failed reading zip archive" in str(e) or "corrupted" in str(e).lower():
                logger.error(f"Model file is corrupted: {model_path}")
                # Try to use backup from backend directory
                backend_model = Path(__file__).parent / "best.pt"
                if backend_model.exists() and backend_model != model_path:
                    logger.info(f"Trying backup model from backend directory: {backend_model}")
                    try:
                        model = YOLO(str(backend_model))
                        logger.info("Successfully loaded backup model")
                    except Exception as e2:
                        logger.error(f"Backup model also failed: {e2}")
                        raise RuntimeError(f"Model file is corrupted and backup also failed. Please retrain the model. Original error: {str(e)}")
                else:
                    raise RuntimeError(f"Model file is corrupted: {model_path}. Error: {str(e)}. Please retrain the model.")
            else:
                raise RuntimeError(f"Failed to load model: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error loading model: {e}")
            raise RuntimeError(f"Failed to load model: {str(e)}")
        
        # Get dataset path
        dataset_path = self.get_dataset_path()
        if not dataset_path or not Path(dataset_path).exists():
            # Fallback to default dataset path
            dataset_dir = Path(self.get_project_path()) / "dataset"
        else:
            dataset_dir = Path(dataset_path)
        
        # Check if train/val directories exist (created during training)
        train_img_dir = dataset_dir / "train" / "images"
        val_img_dir = dataset_dir / "val" / "images"
        
        # If train/val directories don't exist, create them from the dataset
        if not train_img_dir.exists() or not val_img_dir.exists():
            logger.warning(f"Train/val directories not found, creating them from dataset...")
            images_dir = dataset_dir / "images"
            labels_dir = dataset_dir / "labels"
            
            if not images_dir.exists():
                raise FileNotFoundError(f"Dataset images directory not found: {images_dir}. Please create dataset first.")
            
            # Create train/val directories
            train_lbl_dir = dataset_dir / "train" / "labels"
            val_lbl_dir = dataset_dir / "val" / "labels"
            
            for d in [train_img_dir, train_lbl_dir, val_img_dir, val_lbl_dir]:
                d.mkdir(parents=True, exist_ok=True)
            
            # Split dataset into train/val (80/20)
            import random
            all_images = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png"))
            if not all_images:
                raise FileNotFoundError(f"No images found in dataset: {images_dir}")
            
            random.shuffle(all_images)
            split_idx = int(0.8 * len(all_images))
            
            train_images = all_images[:split_idx]
            val_images = all_images[split_idx:]
            
            # Copy files to train/val directories
            self.copy_files(train_images, train_img_dir, train_lbl_dir, labels_dir)
            self.copy_files(val_images, val_img_dir, val_lbl_dir, labels_dir)
            
            logger.info(f"Created train/val split: {len(train_images)} train, {len(val_images)} val images")
        
        # Get classes from database
        classes_dict = self.get_class_ids()
        classes = sorted(classes_dict.keys())
        
        if not classes:
            raise ValueError("No classes found for this project. Please add classes first.")
        
        # Create data.yaml configuration file
        data_yaml = {
            "train": str(train_img_dir.resolve()),
            "val": str(val_img_dir.resolve()),
            "nc": len(classes),
            "names": classes
        }
        
        # Save data.yaml to dataset directory
        yaml_path = dataset_dir / "data.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(data_yaml, f)
        logger.info(f"Created data.yaml at: {yaml_path}")
        
        # Run validation - YOLO expects a YAML file path, not a dict
        try:
            metrics = model.val(data=str(yaml_path), verbose=False)

        except Exception as e:
            logger.error(f"Error running validation: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise RuntimeError(f"Failed to validate model: {str(e)}")
        
        # Extract the key performance metrics from the results object.
        # For object detection, we use mAP as the primary "accuracy" metric.
        # The other metrics are averaged over all classes.
        # Handle NaN values for JSON serialization
        import math
        
        def safe_float(value):
            """Safely convert value to float, handling NaN and Inf"""
            try:
                if value is None:
                    return 0.0
                if math.isnan(value) or math.isinf(value):
                    return 0.0
                return float(value)
            except (TypeError, ValueError):
                return 0.0
        
        try:
            # Try to extract metrics from the results object
            # YOLO validation returns different structures depending on version
            if hasattr(metrics, 'box'):
                # YOLOv8/v11 format
                map50 = safe_float(metrics.box.map50) if hasattr(metrics.box, 'map50') else 0.0
                precision = safe_float(metrics.box.p.mean()) if hasattr(metrics.box, 'p') else 0.0
                recall = safe_float(metrics.box.r.mean()) if hasattr(metrics.box, 'r') else 0.0
                f1 = safe_float(metrics.box.f1.mean()) if hasattr(metrics.box, 'f1') else 0.0
            elif hasattr(metrics, 'results_dict'):
                # Alternative format
                results = metrics.results_dict
                map50 = safe_float(results.get('metrics/mAP50(B)', 0.0))
                precision = safe_float(results.get('metrics/precision(B)', 0.0))
                recall = safe_float(results.get('metrics/recall(B)', 0.0))
                f1 = safe_float(results.get('metrics/f1(B)', 0.0))
            else:
                # Fallback: try to get metrics from attributes
                map50 = safe_float(getattr(metrics, 'map50', getattr(metrics, 'map', 0.0)))
                precision = safe_float(getattr(metrics, 'precision', 0.0))
                recall = safe_float(getattr(metrics, 'recall', 0.0))
                f1 = safe_float(getattr(metrics, 'f1', 0.0))
            
            performance = {
                "accuracy": map50,
                "precision": precision,
                "recall": recall,
                "f1-score": f1
            }
            
            logger.info(f"Model performance metrics: {performance}")
            return performance
            
        except Exception as e:
            logger.error(f"Error extracting metrics: {e}")
            logger.error(f"Metrics object type: {type(metrics)}")
            logger.error(f"Metrics object attributes: {dir(metrics)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return default values if extraction fails
            return {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1-score": 0.0,
                "error": f"Failed to extract metrics: {str(e)}"
            }
    
class Video(Project):
    def __init__(self, project_id: int, video_id=-1, initialize=False):
        super().__init__(project_id)
        self.video_id = video_id
        if not initialize:
            # 只有在 video_id 有效时才尝试获取视频路径和标注状态
            if video_id >= 0:
                self.video_path = self.get_video_path()
                # self.cap = cv2.VideoCapture(self.video_path)
                # 从数据库获取标注状态
                self.annotation_status, self.last_annotated_frame = self.get_annotation_status()
            else:
                # 对于新视频（video_id=-1），设置默认值
                self.video_path = None
                self.annotation_status = "yet to start"
                self.last_annotated_frame = -1
            # 获取视频信息
            # self.frame_count = self.get_frame_count()
            # self.fps = self.get_fps()

    # Initialize when a video is uploaded, includes inserting data to the database
    # Output: video_id, video_path
    def initialize(self, name, ext):
        self.annotation_status, self.last_annotated_frame = "yet to start", -1

        # 清理文件名，確保安全
        safe_name = sanitize_filename(name)
        # 移除扩展名中的点（如果存在）
        if ext and ext.startswith('.'):
            ext = ext[1:]
        
        # 构建初始路径
        self.video_path = Path(self.get_project_path()) / "videos" / f"{safe_name}.{ext}"

        count = 2
        # 如果文件已存在，生成新文件名
        while self.video_path.exists():
            safe_name_new = f"{safe_name}({count})"
            self.video_path = Path(self.get_project_path()) / "videos" / f"{safe_name_new}.{ext}"
            count += 1

        # 最终的文件名（包含扩展名）
        self.video_name = f"{safe_name}.{ext}" if count == 2 else f"{safe_name}({count-1}).{ext}"
        
        # 确保视频目录存在
        video_dir = Path(self.get_project_path()) / "videos"
        video_dir.mkdir(parents=True, exist_ok=True)
        
        # 获取视频数量
        try:
            video_count = self.get_video_count()
            # 确保 video_count 是数字
            if isinstance(video_count, list):
                self.video_count = 0
            else:
                self.video_count = int(video_count) if video_count is not None else 0
        except Exception as e:
            logger.error(f"Error getting video count: {e}")
            self.video_count = 0
        self.video_count += 1

        # 检查数据库连接
        if not is_db_connection_valid():
            logger.error("Database connection not available in Video.initialize")
            raise Exception("Database connection not available")

        # Add row to video
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "INSERT INTO video (project_id, video_path, video_name, annotation_status) VALUES (%s, %s, %s, %s);"
            cursor.execute(query,(self.project_id, str(self.video_path), self.video_name, self.annotation_status))
            print("Video ID: "+str(self.video_id))
            self.video_id = cursor.lastrowid
            connection.commit()  # 提交事务
            cursor.close()
        except Exception as e:
            logger.error(f"Error inserting video into database: {e}")
            raise Exception(f"Failed to insert video into database: {e}")

        return self.video_id, self.video_path
    
    # Return some video info (used in project.get_videos_info)
    def get_video_info(self):
        video_path = self.get_video_path()
        # 使用后端端点来提供视频文件，而不是直接使用文件路径
        # 这样前端可以通过 /serve_video/{video_id} 访问视频
        video_url = f"/serve_video/{self.video_id}"

        info = {
            "name": self.get_video_name(),
            "file": self.video_id,
            "path": video_path,  # 保留原始路径用于后端内部使用
            "url": video_url  # 前端使用的URL，指向后端端点
        }
        return info
    
    # Fetch the video from server given the file_path
    # Output: video file (.mp4, ...)
    async def get_video(self, file_path: str):
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")
        ext = os.path.splitext(file_path)[-1].lower()
        media_types = {
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm',
            '.mkv': 'video/x-matroska'
        }
        # Read the file contents for response
        async with aiofiles.open(file_path, "rb") as f:
            contents = await f.read()
        return Response(contents, media_type=media_types.get(ext, "application/octet-stream"),
                        headers={"Content-Disposition": f"attachment; filename={os.path.basename(file_path)}"})

    # Fetch video name (str) from database
    def get_video_name(self):
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            video_id_int = int(self.video_id)
            query = "SELECT video_name FROM video WHERE video_id = %s"
            cursor.execute(query, (video_id_int,))
            result = cursor.fetchone()
            if result:
                return result['video_name']
        except (ValueError, TypeError):
            pass
    
    # Update video name and save to database
    def update_video_name(self, new_name: str):
        self.video_name = new_name
        success = self.save_video_name()
        return success
    
    # Fetch video path (str) from database
    def get_video_path(self):
        # 首先嘗試將 video_id 轉換為整數（向後兼容）
        try:
            if not is_db_connection_valid():
                logger.error("Database connection not available in get_video_path")
                return None
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            video_id_int = int(self.video_id)
            query = "SELECT video_path FROM video WHERE video_id = %s"
            cursor.execute(query, (video_id_int,))
            result = cursor.fetchone()
            cursor.close()
            if result and result.get('video_path'):
                video_path = result['video_path']
                # 检查文件是否存在
                if os.path.exists(video_path):
                    return video_path
                else:
                    logger.warning(f"Video file not found at path: {video_path}")
                    return None
            return None
        except (ValueError, TypeError) as e:
            logger.error(f"Error in get_video_path: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in get_video_path: {e}")
            return None
    
    # Fetch video name (str) from database
    def get_frame_count(self):
        if not self.video_path:
            self.video_path = self.get_video_path()
        if not self.video_path:
            raise ValueError(f"Video path not found for video_id {self.video_id}")
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {self.video_path}")
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()
        return frame_count
    
    def get_fps(self):
        if not self.video_path:
            self.video_path = self.get_video_path()
        if not self.video_path:
            raise ValueError(f"Video path not found for video_id {self.video_id}")
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {self.video_path}")
        fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        return fps
    
    def get_resolution(self):
        if not self.video_path:
            self.video_path = self.get_video_path()
        cap = cv2.VideoCapture(self.video_path)
        
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return (width, height)
    
    def get_bbox_data(self, frame_num = None):
        # Output format: [{"frame_num": 0, "class_name": abc, "coordinates": (x, y, w, h)}, ...]
        if not is_db_connection_valid():
            raise Exception("数据库连接不可用")
        cursor = get_db_cursor()
        try:
            if frame_num:
                query = "SELECT frame_num, class_name, coordinates FROM bbox WHERE video_id = %s AND frame_num = %s"
                cursor.execute(query,(self.video_id, frame_num))
                bbox_data = cursor.fetchall()
            else:
                # fetch all if frame_num is not specified
                query = "SELECT frame_num, class_name, coordinates FROM bbox WHERE video_id = %s"
                cursor.execute(query,(self.video_id,))
                bbox_data = cursor.fetchall()
            return bbox_data
        finally:
            cursor.close()
    
    def get_annotation_status(self):
        annotation_status='yet to start'
        last_annotated_frame=-1

        # 首先嘗試將 video_id 轉換為整數（向後兼容）
        try:
            video_id_int = int(self.video_id)
            # 如果 video_id 是 -1 或无效，返回默认值
            if video_id_int < 0:
                return annotation_status, last_annotated_frame
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT annotation_status,last_annotated_frame FROM video WHERE video_id = %s"
            cursor.execute(query,(video_id_int,))
            result = cursor.fetchone()
            if result:
                annotation_status = result['annotation_status'] or 'yet to start'
                last_annotated_frame = result['last_annotated_frame']
                # 确保 last_annotated_frame 是整数或 None
                if last_annotated_frame is not None:
                    try:
                        last_annotated_frame = int(last_annotated_frame)
                    except (ValueError, TypeError):
                        last_annotated_frame = -1
                return annotation_status, last_annotated_frame
        except (ValueError, TypeError) as e:
            logger.warning(f"Error getting annotation status for video_id {self.video_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in get_annotation_status: {e}")
        
        # 返回默认值
        return annotation_status, last_annotated_frame

    ###### Selecting Frame for Manual Annotation ######
    # For testing purpose, annotate every second
    def get_next_frame_to_annotate(self):
        self.frame_count = self.get_frame_count()
        self.fps = self.get_fps()
        
        # 如果状态是 "yet to start" 或者 last_annotated_frame 是 -1 或 None，从第0帧开始
        if self.annotation_status == "yet to start" or self.last_annotated_frame is None or self.last_annotated_frame == -1:
            frame_num = 0
            logger.info(f"🎬 [FRAME] Starting annotation from frame 0 (status: {self.annotation_status}, last_frame: {self.last_annotated_frame})")
            return self.get_frame(frame_num), frame_num
        elif self.annotation_status == "completed" or self.annotation_status == "manual annotation completed":
            logger.info(f"✅ [FRAME] Annotation already completed (status: {self.annotation_status})")
            return None, None
        elif isinstance(self.last_annotated_frame, int) and self.last_annotated_frame >= 0:
            # 计算下一帧：每秒钟取一帧（即 last_annotated_frame + fps）
            next_frame = self.last_annotated_frame + self.fps
            if next_frame < self.frame_count:
                logger.info(f"📹 [FRAME] Next frame: {next_frame} (last: {self.last_annotated_frame}, fps: {self.fps})")
                return self.get_frame(next_frame), next_frame
            else:
                # no more frames to annotate
                logger.info(f"🏁 [FRAME] All frames annotated (last: {self.last_annotated_frame}, total: {self.frame_count})")
                self.annotation_status = "manual annotation completed"
                self.save_annotation_status()
                
                # 检查是否所有视频都已完成标注
                project = Project(project_id=self.project_id)
                all_videos_completed = True
                for video_id in project.get_videos():
                    video = Video(project_id=self.project_id, video_id=video_id)
                    if video.annotation_status not in ["completed", "manual annotation completed"]:
                        all_videos_completed = False
                        break
                
                # 如果所有视频都已完成，自动创建数据集
                if all_videos_completed:
                    project.project_status = "Data is ready"
                    project.save_project_status()
                
                return None, None
        else:
            # 如果 last_annotated_frame 无效，重置并从第0帧开始
            logger.warning(f"⚠️ [FRAME] Invalid last_annotated_frame: {self.last_annotated_frame}, resetting to frame 0")
            self.last_annotated_frame = -1
            self.annotation_status = "yet to start"
            self.save_annotation_status()
            frame_num = 0
            return self.get_frame(frame_num), frame_num
    
    def get_frame(self, frame_num: int):
        if not self.video_path:
            self.video_path = self.get_video_path()
        if not self.video_path:
            raise ValueError(f"Video path not found for video_id {self.video_id}")
        self.frame_count = self.get_frame_count()
        if self.frame_count <= 0:
            raise ValueError("Video file is invalid or has no frames")
        if frame_num < 0 or frame_num >= self.frame_count:
            raise ValueError(f"Frame number {frame_num} out of range (0-{self.frame_count-1})")
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {self.video_path}")
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if ret:
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            frame_encoded = base64.b64encode(frame_bytes).decode('utf-8')
            cap.release()
            return frame_encoded
        else:
            cap.release()
            raise ValueError(f"Could not read frame {frame_num} from video")
    
    def annotate(self, frame_num: int, bbox: list):
        try:
            self.annotation_status = "manual annotation in progress"
            if frame_num < 0 or frame_num >= self.get_frame_count():
                raise ValueError("Frame number out of range")
            class_name, x, y, w, h = bbox
            # width, height = self.get_resolution()
            # x_center, y_center = x + w/2, y + h/2
            # x_normalized, y_normalized, w_normalized, h_normalized = x_center/width, y_center/height, w/width, h/height
            bbox_processed = f"{x} {y} {w} {h}"
            self.last_annotated_frame = frame_num

            # Save result
            self.save_annotation_status()
            self.save_last_annotated_frame()
            self.save_bbox_data(frame_num, class_name, bbox_processed)
            return True
        
        except Exception as e:
            logger.error(f"Error in annotate: {str(e)}")
            return f"Error in annotate: {str(e)}"

    def auto_annotate(self):
        # Set status to in progress
        self.annotation_status = "auto annotation in progress"
        self.save_annotation_status()
        
        # Get all manually annotated bbox data
        bbox_data = self.get_bbox_data()
        bbox_data = sorted(bbox_data, key=lambda x: x['frame_num'])

        # Perform auto-annotation
        auto_annotator = AutoAnnotator(self.video_path, bbox_data)
        annotations = auto_annotator.annotate(self.video_id)

        # Save all auto-annotations to database
        for ann in annotations:
            if ann not in bbox_data:
                self.save_bbox_data(ann["frame_num"], ann["class_name"], ann["coordinates"])

        self.annotation_status = "completed"
        self.save_annotation_status()

        return True

    # Save video path to database
    def save_video_path(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET video_path = %s WHERE video_id = %s"
        cursor.execute(query,(self.video_path, self.video_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save video name to database
    def save_video_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET video_name = %s WHERE video_id = %s"
        cursor.execute(query,(self.video_name, self.video_id))
        connection.commit()
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save annotation status to database
    def save_annotation_status(self):
        """保存标注状态到数据库"""
        cursor = get_db_cursor()
        try:
            query = "UPDATE video SET annotation_status = %s WHERE video_id = %s"
            cursor.execute(query,(self.annotation_status, self.video_id))
            connection.commit()  # 提交事务
            success = bool(cursor.rowcount)
            logger.debug(f"💾 [SAVE] Saved annotation_status='{self.annotation_status}' for video_id={self.video_id}, success={success}")
            return success
        finally:
            cursor.close()
    
    # Save last annotated frame to database
    def save_last_annotated_frame(self):
        """保存最后标注的帧号到数据库"""
        cursor = get_db_cursor()
        try:
            query = "UPDATE video SET last_annotated_frame = %s WHERE video_id = %s"
            cursor.execute(query,(self.last_annotated_frame, self.video_id))
            connection.commit()  # 提交事务
            success = bool(cursor.rowcount)
            logger.debug(f"💾 [SAVE] Saved last_annotated_frame={self.last_annotated_frame} for video_id={self.video_id}, success={success}")
            return success
        finally:
            cursor.close()
    
    def save_bbox_data(self, frame_num, class_name, coordinates):
        """保存边界框数据到数据库"""
        cursor = get_db_cursor()
        try:
            query = "INSERT INTO bbox (frame_num, class_name, coordinates, video_id) VALUES (%s, %s, %s, %s)"
            cursor.execute(query,(frame_num, class_name, coordinates, self.video_id))
            connection.commit()  # 提交事务
            success = bool(cursor.rowcount)
            logger.debug(f"💾 [SAVE] Saved bbox: video_id={self.video_id}, frame={frame_num}, class={class_name}, coords={coordinates}, success={success}")
            return success
        finally:
            cursor.close()

# @staticmethod
# def calculate_iou(bbox1, bbox2):
#         # Unpack the boxes
#         x1, y1, w1, h1 = bbox1
#         x2, y2, w2, h2 = bbox2

#         # Calculate the coordinates of the corners of the boxes
#         bbox1_x2 = x1 + w1
#         bbox1_y2 = y1 + h1
#         bbox2_x2 = x2 + w2
#         bbox2_y2 = y2 + h2

#         # Calculate the coordinates of the intersection rectangle
#         inter_x1 = max(x1, x2)
#         inter_y1 = max(y1, y2)
#         inter_x2 = min(bbox1_x2, bbox2_x2)
#         inter_y2 = min(bbox1_y2, bbox2_y2)

#         # Calculate the area of the intersection rectangle
#         inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)

#         # Calculate the area of both bounding boxes
#         box1_area = w1 * h1
#         box2_area = w2 * h2

#         # Calculate the IoU
#         iou = inter_area / float(box1_area + box2_area - inter_area) if (box1_area + box2_area - inter_area) > 0 else 0
#         return iou

#list: [{"frame_num": 0, "class_name": abc, "coordinates": (x, y, w, h)}, ...]
class AutoAnnotator:
    def __init__(self, video_path: str, manual_annotations: list):
        self.video_path = video_path
        self.manual_annotations = manual_annotations
        self.translate_annotations()
        self.classes = self.manual_annotations[0]['class_name'] if self.manual_annotations else 'unnamed_object' # Assume one class only

    def translate_annotations(self):
        self.translated_annotations = {}
        # Translate annotations to (center_x, center_y, width, height) format
        for annotation in self.manual_annotations:
            bbox = annotation['coordinates']
            frame_num = annotation['frame_num']
            x, y, w, h = tuple(map(float, bbox.split()))
            center_x = x + w / 2
            center_y = y + h / 2
            self.translated_annotations[frame_num] = (center_x, center_y, w, h)

    def annotate(self, video_id):
        # Perform object tracking to locate the object in the video
        tracker = ObjectTracker(video_path=self.video_path)
        tracked_annotations = tracker.tracking(manual_annotations=self.translated_annotations)

        # # Identify objects in each frame using distilled SAM
        # identifier = ObjectIdentifier(image=None)
        # identified_objects = identifier.segment(tracked_annotations=tracked_annotations, video_id=video_id)

        # # Combine tracking and identification results
        # combined_annotations = []
        # for frame_num, tracked_bbox in tracked_annotations.items():
        #     best_iou = -1
        #     best_bbox = None
        #     identified_bboxes = identified_objects[frame_num]
        #     for identified_bbox in identified_bboxes:
        #         iou = calculate_iou(tracked_bbox, identified_bbox)
        #         if iou > best_iou:
        #             best_iou = iou
        #             best_bbox = identified_bbox
        #     if best_bbox:
        #         x, y, w, h = best_bbox
        #         best_bbox_str = f"{x} {y} {w} {h}"
        #         combined_annotations.append({"frame_num": frame_num, "class_name": self.classes,"coordinates": best_bbox_str})

        combined_annotations = []
        for frame_num, bbox in tracked_annotations.items():
            # bbox格式: (center_x, center_y, width, height)
            center_x, center_y, w, h = bbox
            # 转换回 (x, y, width, height) 格式
            x = center_x - w / 2
            y = center_y - h / 2
            coordinates = f"{int(x)} {int(y)} {int(w)} {int(h)}"
            combined_annotations.append({"frame_num": frame_num, "class_name": self.classes, "coordinates": coordinates})

        return combined_annotations


# Track object in a video given manual annotations
class ObjectTracker:
    def __init__(self, video_path):
        self.video_path = video_path

    def tracking(self, manual_annotations):
        # Use PCHIP interpolation and linear interpolation for object tracking
        tracker = InterpolatedObjectTracker(self.video_path)
        predicted_annotations = tracker.predict_frame(manual_annotations)

        return predicted_annotations

# class ObjectIdentifier():
#     def __init__(self, image, video_path=None):
#         self.image = image
#         self.video_path = video_path

#     # Use Distilled SAM for object identification
#     def segment(self, tracked_annotations, video_id):
#         if not self.video_path:
#             raise ValueError("video_path must be provided to ObjectIdentifier")
#         cap = cv2.VideoCapture(self.video_path)
#         identified_objects = {}
        
#         for frame_num, bbox in tracked_annotations.items():
#             print(f"Processing frame {frame_num+1}...")
#             ret, frame = cap.read()
#             if not ret:
#                 print(f"无法读取第 {frame_num} 帧，视频可能结束")
#                 break

#             # Use Distilled SAM for object identification
#             segmenter = MobileSAM(image=frame)
#             bboxes = segmenter.segment()
#             identified_objects[frame_num] = bboxes

#             # Update last annotated frame in database
#             video = Video(video_id)
#             video.last_annotated_frame = frame_num
#             video.save_last_annotated_frame()

#         cap.release()
#         return identified_objects
    
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    body = request._body.decode() if hasattr(request, "_body") else ""
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(f"Request body: {body[:100]}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

#=================================== Page 1 - Login ==========================================
class LoginRequest(BaseModel):
    username: str
    password: str

# User login
# Input: username, password
# Output: success, userID
@app.post("/login")
async def login(request: LoginRequest, response: Response):
    try:
        username = request.username
        password = request.password

        # Check if password is correct
        userlogin = UserLogin(username, password)
        success, message = userlogin.login()

        if success:
            # if status is True, get userID from database, else None
            userID = userlogin.get_userID()
            
            # Set HTTP cookies
            response.set_cookie(
                key="userId",
                value=str(userID),
                httponly=True,
                secure=False,  # Set to False for HTTP
                samesite="lax",
                max_age=86400  # 24 hours
            )
            response.set_cookie(
                key="username",
                value=username,
                httponly=False,
                secure=False,  # Set to False for HTTP
                samesite="lax",
                max_age=86400
            )

            return {
                "success": success,
                "userID": userID,
                "message": "Login successful"
            }
        
        else:
            return{
                "success": success,
                "userID": None,
                "message": message
            }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/logout")
async def logout():
    """用戶登出端點"""
    try:
        # 在實際應用中，這裡可以進行服務器端的登出處理
        # 比如清除服務器端的會話、記錄登出日誌等
        return {
            "success": True,
            "message": "Logout successful"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": str(e)}
        )

class RegisterRequest(BaseModel):
    username: str
    password: str
    confirm_password: str

#register function by Jimmy for frontend login page to use
@app.post("/register")
async def register(request: RegisterRequest):
    """用戶註冊端點"""
    try:
        username = request.username.strip()
        password = request.password
        confirm_password = request.confirm_password
        
        # 基本驗證
        if not username:
            return {
                "success": False,
                "message": "用戶名不能為空"
            }
        
        if len(username) < 3:
            return {
                "success": False,
                "message": "用戶名至少需要3個字符"
            }
        
        if not password:
            return {
                "success": False,
                "message": "密碼不能為空"
            }
        
        if len(password) < 6:
            return {
                "success": False,
                "message": "密碼至少需要6個字符"
            }
        
        if password != confirm_password:
            return {
                "success": False,
                "message": "密碼確認不匹配"
            }
        
        # 檢查用戶名是否已存在
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        check_query = "SELECT user_id FROM user WHERE username = %s"
        cursor.execute(check_query, (username,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            return {
                "success": False,
                "message": "用戶名已存在"
            }
        
        # 生成密碼哈希
        salt, pwd_hash = UserLogin._hash_password(password)
        stored_password = base64.b64encode(salt + b':' + pwd_hash).decode('utf-8')
        
        # 插入新用戶
        insert_query = "INSERT INTO user (username, password) VALUES (%s, %s)"
        cursor.execute(insert_query, (username, stored_password))
        user_id = cursor.lastrowid
        
        connection.commit()
        cursor.close()
        
        return {
            "success": True,
            "message": "註冊成功",
            "userID": user_id,
            "projects": []  # 新用戶沒有項目
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": str(e)}
        )
    
#=================================== Page 2 - Project Management ==========================================

class UserRequest(BaseModel):
    userID: int

# Get all projects IDs for a user
# Input: userID
# Output: owner project IDs, shared project IDs #change
@app.post("/get_projects_info")
async def get_users_projects(request: UserRequest):
    try: 
        userID = request.userID

        # Check database connection
        if not is_db_connection_valid():
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Database connection not available"}
            )

        user = User(userID)
        owned_project_ids = user.get_owned_projects()
        shared_project_ids = user.get_shared_projects()

        # Get detailed project information for owned projects
        owned_projects = []
        for project_id in owned_project_ids:
            project = Project(project_id)
            name = project.get_project_name()
            videoCount = project.get_video_count()
            project_status = project.get_project_status()
            isOwned = (user.userID == project.get_owner())
            owned_projects.append({"id": project_id, "name": name, "videoCount": videoCount, "status": project_status, "isOwned": isOwned, "project name": name, "project id": project_id, "video count": videoCount})
        
        # Get detailed project information for shared projects
        shared_projects = []
        for project_id in shared_project_ids:
            project = Project(project_id)
            name = project.get_project_name()
            videoCount = project.get_video_count()
            project_status = project.get_project_status()
            isOwned = (user.userID == project.get_owner())
            shared_projects.append({"id": project_id, "name": name, "videoCount": videoCount, "status": project_status, "isOwned": isOwned, "project name": name, "project id": project_id, "video count": videoCount})
        print(owned_projects)
        print(shared_projects)
        logger.info(f"Retrieved projects for user {userID}: {len(owned_projects)} owned, {len(shared_projects)} shared")
        
        return {
            "owned projects": owned_projects,
            "shared projects": shared_projects
        }
    
    except Exception as e:
        logger.error(f"Error in get_users_projects: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )

class ProjectRequest(BaseModel):
    project_id: int

# Get project details when loading dashboard
# Input: Project ID
# Output: {"project name": project_name, "project type": project_type, "video count": video_count, "status": project_status}
@app.post("/get_project_details")
async def get_project_details(request: ProjectRequest):
    try:
        # 檢查資料庫連接
        if not connection or not connection.open:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Database connection not available"}
            )
        
        project = Project(project_id = request.project_id)
        project_details = {
            "project name": project.get_project_name(),
            "project type": project.get_project_type(),
            "video count": project.get_video_count(),
            "status": project.get_project_status()
        }

        return project_details

    except Exception as e:
        logger.error(f"Error in get_project_details: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )
    
class CreateProjectRequest(BaseModel):
    userID: int
    project_name: str
    project_type: str = "YOLO object detection"

# Create new project
@app.post("/create_project")
async def create_project(request: CreateProjectRequest):
    try:
        userID = request.userID
        project_name = request.project_name
        project_type = request.project_type

        logger.info(f"Creating project: name='{project_name}', type='{project_type}', userID={userID}")

        # Validate input
        if not project_name:
            logger.warning("Project name is empty")
            return {
                "success": False,
                "message": "Project name cannot be empty"
            }

        # Check database connection
        if not is_db_connection_valid():
            logger.error("Database connection not available")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Database connection not available"}
            )
        
        # Verify user exists before creating project
        cursor = get_db_cursor()
        try:
            user_check_query = "SELECT user_id FROM user WHERE user_id = %s"
            cursor.execute(user_check_query, (userID,))
            user_exists = cursor.fetchone()
            if not user_exists:
                logger.error(f"User with ID {userID} does not exist")
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "success": False,
                        "error": f"User with ID {userID} does not exist. Please register or login first."
                    }
                )
        finally:
            cursor.close()

        # Create project instance and initialize
        logger.info("Initializing project...")
        # Initialize project
        project = Project(initialize=True)
        project_id = project.initialize(project_name, project_type, userID)

        logger.info(f"Project created successfully with ID: {project_id}")

        return {
            "success": True,
            "message": "Project created successfully.",
            "project_id": project_id
        }
    
    except Exception as e:
        logger.error(f"Error in create_project: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )
        
# Change project name
class ChangeProjectNameRequest(BaseModel):
    project_id: int
    new_name: str

@app.post("/change_project_name")
async def change_project_name(request: ChangeProjectNameRequest):
    try:
        project = Project(project_id = request.project_id)

        success = project.change_project_name(request.new_name)
        
        if success:
            return {
                "success": True,
                "message": f"Project name changed to {request.new_name}"
            }
        else:
            return {
                    "success": False,
                    "message": "Failed to change project name."
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
class ShareProjectRequest(BaseModel):
    project_id: int
    shared_with_username: str
    permissions: str = "read"  # "read" or "write"

# Share project with another user
@app.post("/share_project")
async def share_project(request: ShareProjectRequest):
    try:
        project_id = request.project_id
        shared_with_username = request.shared_with_username.strip()
        permissions = request.permissions.strip().lower()

        # Validate permissions
        if permissions not in ["read", "write"]:
            return {
                "success": False,
                "message": "Invalid permissions. Must be 'read' or 'write'"
            }

        # Check if project exists
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        project_query = "SELECT project_id, project_name, project_owner_id FROM project WHERE project_id = %s"
        cursor.execute(project_query, (project_id,))
        project = cursor.fetchone()
        
        if not project:
            cursor.close()
            return {
                "success": False,
                "message": "Project not found"
            }

        # Check if target user exists
        user_query = "SELECT user_id FROM user WHERE username = %s"
        cursor.execute(user_query, (shared_with_username,))
        target_user = cursor.fetchone()
        
        if not target_user:
            cursor.close()
            return {
                "success": False,
                "message": f"User '{shared_with_username}' not found"
            }

        # Check if already shared
        share_query = "SELECT id FROM project_shared_users WHERE project_id = %s AND user_id = %s"
        cursor.execute(share_query, (project_id, target_user['user_id']))
        existing_share = cursor.fetchone()
        
        if existing_share:
            cursor.close()
            return {
                "success": False,
                "message": f"Project is already shared with '{shared_with_username}'"
            }

        # Create share record
        insert_query = """
            INSERT INTO project_shared_users (project_id, user_id, permissions, shared_at) 
            VALUES (%s, %s, %s, NOW())
        """
        cursor.execute(insert_query, (project_id, target_user['user_id'], permissions))
        connection.commit()
        cursor.close()

        return {
            "success": True,
            "message": f"Project '{project['project_name']}' shared with '{shared_with_username}' successfully"
        }

    except Exception as e:
        logger.error(f"Error in share_project: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )
    
class UnshareProjectRequest(BaseModel):
    project_id: int
    shared_with_username: str

# Unshare project with a user
@app.post("/unshare_project")
async def unshare_project(request: UnshareProjectRequest):
    try:
        project_id = request.project_id
        shared_with_username = request.shared_with_username.strip()

        # Get target user ID
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        user_query = "SELECT user_id FROM user WHERE username = %s"
        cursor.execute(user_query, (shared_with_username,))
        target_user = cursor.fetchone()
        
        if not target_user:
            cursor.close()
            return {
                "success": False,
                "message": f"User '{shared_with_username}' not found"
            }

        # Remove share record
        delete_query = "DELETE FROM project_shared_users WHERE project_id = %s AND user_id = %s"
        result = cursor.execute(delete_query, (project_id, target_user['user_id']))
        connection.commit()
        cursor.close()

        if result > 0:
            return {
                "success": True,
                "message": f"Project unshared with '{shared_with_username}' successfully"
            }
        else:
            return {
                "success": False,
                "message": f"Project was not shared with '{shared_with_username}'"
            }

    except Exception as e:
        logger.error(f"Error in unshare_project: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )

# Get project shares
@app.post("/get_project_shares")
async def get_project_shares(request: ProjectRequest):
    try:
        project_id = request.project_id

        if not is_db_connection_valid():
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        cursor = get_db_cursor()
        try:
            # Query project_shared_users table to get all users the project is shared with
            query = """
                SELECT psu.id, psu.permissions, psu.shared_at, u.username, u.user_id
                FROM project_shared_users psu
                JOIN user u ON psu.user_id = u.user_id
                WHERE psu.project_id = %s
                ORDER BY psu.shared_at DESC
            """
            cursor.execute(query, (project_id,))
            shares = cursor.fetchall()
            
            # Convert to list of dicts if needed
            if shares:
                shares_list = []
                for share in shares:
                    shares_list.append({
                        "id": share.get('id'),
                        "username": share.get('username'),
                        "user_id": share.get('user_id'),
                        "permissions": share.get('permissions'),
                        "shared_at": share.get('shared_at').isoformat() if share.get('shared_at') else None
                    })
                shares = shares_list
            
            return {
                "success": True,
                "shares": shares or []
            }
        finally:
            cursor.close()

    except Exception as e:
        logger.error(f"Error in get_project_shares: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )


#=================================== Page 3 - Video Upload & Management ==========================================

async def save_upload_file(upload_file: UploadFile, destination: Path):
    """
    Stream upload to disk in chunks.
    """
    total_written = 0
    chunk_size = 10 * 1024 * 1024  # 10 MB chunks

    # Max file size: 5 GB (adjust as needed)
    MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5 GB in bytes

    with destination.open("wb") as buffer:
        while True:
            chunk = await upload_file.read(chunk_size)
            if not chunk:
                break
            buffer.write(chunk)
            total_written += len(chunk)

            # Optional: Log progress
            if total_written % (100 * 1024 * 1024) == 0:  # every 100 MB
                logger.info(f"Uploaded {total_written / (1024**2):.1f} MB of {upload_file.filename}")

            # Enforce size limit
            if total_written > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Max allowed: {MAX_FILE_SIZE / (1024**3):.1f} GB"
                )

    return total_written

@app.post("/upload")
async def upload(project_id: int, file: UploadFile = File(...)):
    try:
        # Allowed video MIME types
        ALLOWED_MIME_TYPES = {
            "video/mp4",
            "video/avi",
            "video/mkv",
            "video/webm",
            "video/quicktime",  # .mov
            "video/x-msvideo",  # .avi
        }
        print(0)
        # Validate filename
        filename = file.filename
        if not filename:
            raise HTTPException(status_code=400, detail="No file name")

        # Prevent path traversal
        safe_filename = Path(filename).name
        if safe_filename != filename:
            raise HTTPException(status_code=400, detail="Invalid filename")

        # Validate content type
        content_type = file.content_type
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
            )
        print(1)
        # Define destination
        video = Video(project_id=project_id, initialize=False)
        print(2)
        name, ext = os.path.splitext(filename)
        video_id, video_path = video.initialize(name, ext)
        
        # Stream to disk
        try:
            size = await save_upload_file(file, video_path)
            logger.info(f"Successfully uploaded: {video_path} ({size / (1024**3):.2f} GB)")
        except Exception as e:
            if video_path.exists():
                video_path.unlink()  # cleanup partial
            raise HTTPException(status_code=500, detail="Upload failed")

        return JSONResponse({
            "message": "Upload successful",
            "filename": safe_filename,
            "size_bytes": size,
            "size_gb": round(size / (1024**3), 2),
            "path": str(video_path),
            "video_id": video_id
        })

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get all uploaded videos for a project
# Output: videos_info = [{"name": video_name, "file": video, "path": video_path}, ... ]
@app.post("/get_uploaded_videos")
def get_uploaded_videos(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)
        videos_info = project.get_uploaded_videos()
        return videos_info

    except Exception as e:
        logger.error(f"Get uploaded videos error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# ??? (Why need this?)
# Get project videos by project ID (RESTful endpoint)
# Output: ?
@app.get("/get_project_videos/{project_id}")
def get_project_videos(project_id: int):
    try:
        project = Project(project_id=project_id)
        videos_info = project.get_uploaded_videos()
        
        return {
            "success": True,
            "videos": videos_info
        }
    
    except Exception as e:
        logger.error(f"Get project videos error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Serve video file by video_id
@app.get("/serve_video/{video_id}")
async def serve_video(video_id: int, project_id: int = None):
    """通过 video_id 提供视频文件"""
    try:
        # 如果提供了 project_id，使用它；否则需要从数据库查询
        if project_id is None:
            # 从数据库查询 project_id
            if not is_db_connection_valid():
                raise HTTPException(status_code=503, detail="Database connection not available")
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT project_id FROM video WHERE video_id = %s"
            cursor.execute(query, (video_id,))
            result = cursor.fetchone()
            cursor.close()
            if not result:
                raise HTTPException(status_code=404, detail=f"Video {video_id} not found")
            project_id = result['project_id']
        
        # 创建 Video 对象并获取视频路径
        video = Video(project_id=project_id, video_id=video_id)
        video_path = video.get_video_path()
        
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail=f"Video file not found for video_id {video_id}")
        
        # 确定媒体类型
        ext = os.path.splitext(video_path)[-1].lower()
        media_types = {
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm',
            '.mkv': 'video/x-matroska'
        }
        media_type = media_types.get(ext, "application/octet-stream")
        
        # 使用 StreamingResponse 来流式传输大文件
        def iterfile():
            with open(video_path, "rb") as f:
                while True:
                    chunk = f.read(8192)  # 8KB chunks
                    if not chunk:
                        break
                    yield chunk
        
        return StreamingResponse(
            iterfile(),
            media_type=media_type,
            headers={
                "Content-Disposition": f"inline; filename={os.path.basename(video_path)}",
                "Accept-Ranges": "bytes"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Serve video error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error serving video: {str(e)}")
    
#=================================== Page 4 - Annotation ==========================================

# Get all classes of a project
# Output: {"class_name": colour, ...}
@app.post("/get_classes")
async def get_classes(request:ProjectRequest):
    try:
        project = Project(project_id = request.project_id)
        
        classes = project.get_classes()
        
        return {
            "success": True,
            "classes": classes
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Add new class to a project and return new classes list
# Output: {"class_name": colour, ...}
class AddClassRequest(BaseModel):
    project_id: int
    class_name: str
    colour: str

@app.post("/add_class")
async def add_class(request: AddClassRequest):
    try:
        project = Project(project_id = request.project_id)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(request.class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "Class name already exists.",
                "classes": project.classes
            }
        
        project.add_class(request.class_name, request.colour)
        
        return {
            "success": True,
            "message": "Class added successfully.",
            "classes": project.classes
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Modify class name of a project and return new classes list
# Output: {"class_name": colour, ...}
class ModifyClassRequest(BaseModel):
    project_id: int
    original_class_name: str
    new_class_name: str

@app.post("/modify_class")
async def modify_class(request: ModifyClassRequest):
    try:
        project = Project(project_id = request.project_id)

        # check if original_class_name exists for this project
        class_name_exists = project.check_class_exists(request.original_class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Original class does not exist.",
                "classes": project.classes
            }
        
        # check if new_class_name already exists for this project
        class_name_exists = project.check_class_exists(request.new_class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "New class name already exists.",
                "classes": project.classes
            }
        
        project.modify_class(request.original_class_name, request.new_class_name)
        
        return {
            "success": True,
            "message": "Class modified successfully.",
            "classes": project.classes
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
# Delete class of a project and return new classes list
# Output: {"class_name": colour, ...}
class DeleteClassRequest(BaseModel):
    project_id: int
    class_name: str

@app.post("/delete_class")
async def delete_class(request: DeleteClassRequest):
    try:
        project = Project(project_id = request.project_id)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(request.class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Class does not exists.",
                "classes": project.classes
            }
        
        project.delete_class(request.class_name)
        
        return {
            "success": True,
            "message": "Class added successfully.",
            "classes": project.classes
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
class VideoRequest(BaseModel):
    project_id: int
    video_id: int  # Can be int or string, will be converted
    
    @validator('video_id', pre=True)
    def convert_video_id(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                raise ValueError(f"video_id must be a valid integer, got: {v}")
        return int(v)

# Get next frame to annotate
@app.post("/get_next_frame_to_annotate")
async def get_next_frame_to_annotate(request: VideoRequest):
    try:
        video = Video(project_id = request.project_id, video_id = request.video_id)
        next_frame, frame_num = video.get_next_frame_to_annotate()
        
        # 获取视频总帧数（用于前端显示进度）
        frame_count = video.get_frame_count()
        fps = video.get_fps()
        
        # 计算需要标注的关键帧总数（每秒钟一帧）
        # 例如：如果视频有900帧，FPS=30，则总共有 900/30 = 30 个关键帧需要标注
        total_key_frames = int(frame_count / fps) if fps > 0 else 0
        
        if next_frame is None:
            return {
                "success": False,
                "message": "All frames have been annotated.",
                "image": None,
                "frame_num": None,
                "total_frames": total_key_frames,
                "frame_count": frame_count,
                "fps": fps
            }
        
        return {
                "success": True,
                "message": "Next frame fetched successfully.",
                "image": next_frame,
                "frame_num": frame_num,
                "total_frames": total_key_frames,  # 关键帧总数（每秒钟一帧）
                "frame_count": frame_count,  # 视频总帧数
                "fps": fps  # 视频帧率
        }

    except Exception as e:
        logger.error(f"Get next frame error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Check annotation status of a video
@app.post("/check_annotation_status")
async def check_annotation_status(request: VideoRequest):  
    try:
        video = Video(project_id = request.project_id, video_id = request.video_id)
        # 重新从数据库获取最新状态，确保数据是最新的
        annotation_status, last_annotated_frame = video.get_annotation_status()
        logger.info(f"📊 [STATUS] Video {request.video_id} status: {annotation_status}, last_frame: {last_annotated_frame}")
        return {
            "annotation status": annotation_status,
            "last annotated frame": last_annotated_frame if last_annotated_frame is not None else 0
        }

    except Exception as e:
        logger.error(f"Check annotation status error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
# Save annotation for a frame
@app.post("/annotate")
async def annotate(request: AnnotationRequest):
    try:
        logger.info(f"📝 [ANNOTATE] Saving annotation: project_id={request.project_id}, video_id={request.video_id}, frame_num={request.frame_num}, bbox_count={len(request.bboxes)}")
        video = Video(project_id = request.project_id, video_id = request.video_id)
        
        # 获取视频信息，用于判断是否完成
        frame_count = video.get_frame_count()
        fps = video.get_fps()
        total_key_frames = int(frame_count / fps) if fps > 0 else 0
        
        all_success = True
        for bbox in request.bboxes:
            # bbox should be a dict with class_name, x, y, width, height
            if isinstance(bbox, dict):
                bbox_list = [bbox.get('class_name', ''), bbox.get('x', 0), bbox.get('y', 0), bbox.get('width', 0), bbox.get('height', 0)]
            else:
                # If it's already a list, use it directly
                bbox_list = bbox
            
            success = video.annotate(request.frame_num, bbox_list)
            if not success:
                all_success = False
                logger.warning(f"⚠️ [ANNOTATE] Failed to save bbox: {bbox}")
        
        if all_success:
            # 检查是否已完成所有关键帧的标注
            # 计算当前帧对应的关键帧索引
            current_key_frame = int(request.frame_num / fps) + 1 if fps > 0 else 0
            
            # 重新获取最新的状态（因为 annotate 方法已经更新了 last_annotated_frame）
            video.annotation_status, video.last_annotated_frame = video.get_annotation_status()
            
            # 如果当前关键帧是最后一个，或者下一帧会超出范围，标记为完成
            next_frame = video.last_annotated_frame + fps
            if next_frame >= frame_count or current_key_frame >= total_key_frames:
                video.annotation_status = "manual annotation completed"
                video.save_annotation_status()
                logger.info(f"🎉 [ANNOTATE] Video annotation completed! (frame {request.frame_num}, key frame {current_key_frame}/{total_key_frames})")
            
            logger.info(f"✅ [ANNOTATE] All annotations saved successfully for frame {request.frame_num} (last_annotated_frame: {video.last_annotated_frame}, status: {video.annotation_status})")
            return {
                "success": True,
                "message": "Annotation saved.",
                "savedAt": getClientTimestamp(),
                "annotation_status": video.annotation_status,
                "last_annotated_frame": video.last_annotated_frame,
                "is_completed": video.annotation_status == "manual annotation completed"
            }
        else:
            logger.warning(f"⚠️ [ANNOTATE] Some annotations failed to save for frame {request.frame_num}")
            return {
                "success": False,
                "message": "Some annotations failed to save."
            }

    except Exception as e:
        logger.error(f"❌ [ANNOTATE] Error saving annotation: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get next video to annotate
class NextVideoRequest(BaseModel):
    project_id: int
    current_video_id: str  # Can be int or string, will be converted
    
    @validator('current_video_id', pre=True)
    def convert_current_video_id(cls, v):
        if isinstance(v, (int, float)):
            return str(int(v))
        return str(v)

@app.post("/next_video")
async def next_video(request: NextVideoRequest):
    try:
        project = Project(project_id=request.project_id)
        video_ids = project.get_videos()  # Returns list of int video_ids
        
        if not video_ids:
            return {
                "success": False,
                "message": "No videos found in project.",
                "next_video_id": None
            }
        
        # Convert current_video_id to int for comparison
        try:
            current_video_id_int = int(request.current_video_id)
        except (ValueError, TypeError):
            # If current_video_id is invalid, return first video
            return {
                "success": True,
                "message": "Invalid current video ID. Returning first video.",
                "next_video_id": str(video_ids[0])
            }
        
        # Find current video index
        if current_video_id_int not in video_ids:
            # Current video not found, return first video
            return {
                "success": True,
                "message": "Current video not found in project. Returning first video.",
                "next_video_id": str(video_ids[0])
            }
        
        current_index = video_ids.index(current_video_id_int)
        
        # Get next video
        if current_index + 1 < len(video_ids):
            next_video_id = video_ids[current_index + 1]
            return {
                "success": True,
                "message": "Next video fetched successfully.",
                "next_video_id": str(next_video_id)
            }
        else:
            # Reached end, no more videos
            return {
                "success": False,
                "message": "No more videos available. This is the last video.",
                "next_video_id": None
            }

    except Exception as e:
        logger.error(f"Next video error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

#=================================== Page 5 - Model Training ==========================================

# Create dataset for training
@app.post("/create_dataset")
async def create_dataset(request: ProjectRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_create_dataset, request.project_id)
    return {
        "success": True,
        "message": "Training started in the background."
    }

async def _create_dataset(project_id: int):
    try:
        logger.info(f"🚀 [DATASET] Starting dataset creation for project {project_id}")
        project = Project(project_id = project_id)
        # 检查所有视频是否都已完成标注
        videos = project.get_videos()
        logger.info(f"📹 [DATASET] Found {len(videos)} video(s) in project {project_id}")
        
        if not videos:
            error_msg = "No videos found in project. Please upload videos first."
            logger.error(f"❌ [DATASET] {error_msg}")
            return {
                "success": False,
                "message": error_msg
            }
        for video_id in videos:
            video = Video(project_id = project_id, video_id = video_id)
            # 重新从数据库获取最新状态
            annotation_status, last_annotated_frame = video.get_annotation_status()
            video.annotation_status = annotation_status
            video.last_annotated_frame = last_annotated_frame
            
            logger.info(f"🔍 [DATASET] Checking video {video_id}, status: {annotation_status}, last_frame: {last_annotated_frame}")
            # 如果状态是 "manual annotation in progress"，检查是否真的完成了
            if annotation_status == "manual annotation in progress":
                # 检查是否所有关键帧都已标注
                try:
                    frame_count = video.get_frame_count()
                    fps = video.get_fps()
                    total_key_frames = int(frame_count / fps) if fps > 0 else 0
                    
                    # 计算最后一帧对应的关键帧索引（从1开始）
                    if last_annotated_frame is not None and last_annotated_frame >= 0:
                        # 关键帧索引 = floor(帧号 / fps) + 1
                        # 例如：帧0对应关键帧1，帧30对应关键帧2，帧420对应关键帧15（420/30+1=15）
                        last_key_frame = int(last_annotated_frame / fps) + 1 if fps > 0 else 0
                        next_frame = last_annotated_frame + fps
                        
                        logger.info(f"🔍 [DATASET] Video {video_id} completion check: last_frame={last_annotated_frame}, frame_count={frame_count}, fps={fps}, last_key_frame={last_key_frame}, total_key_frames={total_key_frames}, next_frame={next_frame}")
                        
                        # 判断是否完成：
                        # 1. 下一帧超出总帧数，或者
                        # 2. 最后一个关键帧已经达到或超过总关键帧数（允许1帧的误差，因为可能最后一个关键帧在最后一秒）
                        if next_frame >= frame_count or last_key_frame >= total_key_frames:
                            logger.info(f"✅ [DATASET] Video {video_id} appears to be completed (last_frame: {last_annotated_frame}, last_key_frame: {last_key_frame}/{total_key_frames}), updating status...")
                            video.annotation_status = "manual annotation completed"
                            video.save_annotation_status()
                            annotation_status = "manual annotation completed"
                        else:
                            # 如果还有关键帧未标注，但差距很小（只差1个关键帧），也认为已完成
                            remaining_key_frames = total_key_frames - last_key_frame
                            if remaining_key_frames <= 1:
                                logger.info(f"✅ [DATASET] Video {video_id} is almost completed (last_key_frame: {last_key_frame}/{total_key_frames}, remaining: {remaining_key_frames}), updating status...")
                                video.annotation_status = "manual annotation completed"
                                video.save_annotation_status()
                                annotation_status = "manual annotation completed"
                            else:
                                error_msg = f"Video {video_id} is not completed. Last annotated frame: {last_annotated_frame} (key frame {last_key_frame}/{total_key_frames}), total frames: {frame_count}, fps: {fps}. Please complete annotation first."
                                logger.error(f"❌ [DATASET] {error_msg}")
                                
                                return {
                                    "success": False,
                                    "message": error_msg
                                }
                    else:
                        error_msg = f"Video {video_id} has invalid last_annotated_frame: {last_annotated_frame}. Please complete annotation first."
                        logger.error(f"❌ [DATASET] {error_msg}")
                        
                        return {
                            "success": False,
                            "message": error_msg
                        }
                    
                except Exception as e:
                    logger.error(f"❌ [DATASET] Error checking video {video_id} completion: {e}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    error_msg = f"Error checking video {video_id} completion: {str(e)}"
                    return {
                        "success": False,
                        "message": error_msg
                    }
            
            if annotation_status not in ["completed", "manual annotation completed"]:
                error_msg = f"Video {video_id} is not completed. Current status: {annotation_status}. Please complete annotation first."
                logger.error(f"❌ [DATASET] {error_msg}")
                return {
                    "success": False,
                    "message": error_msg
                }
            
            # 如果视频已完成手动标注，但还没有执行自动标注，先执行 smart annotation
            # 如果状态是 "completed"，说明已经执行过 smart annotation，跳过
            if annotation_status == "manual annotation completed":
                # 检查是否有手动标注的数据
                bbox_data = video.get_bbox_data()
                if bbox_data and len(bbox_data) > 0:
                    logger.info(f"🤖 [DATASET] Video {video_id} has {len(bbox_data)} manual annotations, starting smart annotation to auto-annotate other frames...")
                    try:
                        # 执行智能标注：基于手动标注的帧，自动标注其他帧
                        video.auto_annotate()
                        logger.info(f"✅ [DATASET] Smart annotation completed for video {video_id}. All frames have been annotated.")
                    except Exception as e:
                        logger.error(f"❌ [DATASET] Error during smart annotation for video {video_id}: {e}")
                        logger.error(f"Traceback: {traceback.format_exc()}")
                        # 即使自动标注失败，也继续创建数据集（使用已有的手动标注）
                        logger.warning(f"⚠️ [DATASET] Continuing dataset creation with manual annotations only for video {video_id}")
                else:
                    logger.warning(f"⚠️ [DATASET] Video {video_id} has no manual annotations, skipping smart annotation")
            elif annotation_status == "completed":
                logger.info(f"✅ [DATASET] Video {video_id} already has smart annotation completed, skipping auto-annotation step")

        # 所有视频都已完成标注，创建数据集
        logger.info(f"✅ [DATASET] All videos completed, starting dataset creation...")
        success = project.create_dataset()
        
        if success:
            logger.info(f"🎉 [DATASET] Dataset created successfully for project {project_id}")
            return {
                "success": True,
                "message": "Dataset created successfully."
            }
        else:
            error_msg = "Failed to create dataset."
            logger.error(f"❌ [DATASET] {error_msg}")
            return {
                "success": False,
                "message": error_msg
            }

    except Exception as e:
        error_msg = f"Error creating dataset: {str(e)}"
        logger.error(f"❌ [DATASET] {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "message": error_msg
        }

# Get auto annotation progress of a project
@app.post("/get_auto_annotation_progress")
async def get_auto_annotation_progress(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)

        # Get auto annotation progress
        progress = project.get_auto_annotation_progress()

        return {
            "success": True,
            "progress": progress
        }

    except Exception as e:
        logger.error(f"Get auto annotation progress error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "progress": 0.0}
        )

# Trigger smart annotation for a video
@app.post("/auto_annotate")
async def auto_annotate(request: VideoRequest, background_tasks: BackgroundTasks):
    """
    触发智能标注：基于用户手动标注的帧，自动标注视频中的其他帧
    这个功能会在后台运行，因为可能需要一些时间
    """
    try:
        logger.info(f"🚀 [SMART-ANNOTATE] Starting smart annotation for video {request.video_id} in project {request.project_id}")
        video = Video(project_id=request.project_id, video_id=request.video_id)
        
        # 检查是否有手动标注的数据
        bbox_data = video.get_bbox_data()
        if not bbox_data or len(bbox_data) == 0:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": "No manual annotations found. Please annotate at least one frame before using smart annotation."
                }
            )
        
        logger.info(f"📝 [SMART-ANNOTATE] Found {len(bbox_data)} manual annotations, starting auto-annotation...")
        
        # 在后台任务中执行自动标注
        background_tasks.add_task(video.auto_annotate)
        
        return {
            "success": True,
            "message": "Smart annotation started in the background. Please check the annotation status to see progress.",
            "manual_annotations_count": len(bbox_data)
        }
        
    except Exception as e:
        logger.error(f"❌ [SMART-ANNOTATE] Error starting smart annotation: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": str(e)}
        )

# Train model for a project
@app.post("/train")
async def train(request: ProjectRequest, background_tasks: BackgroundTasks):
    try:
        project = Project(project_id = request.project_id)

        # Train the model
        background_tasks.add_task(project.train)
        
        return {
            "success": True,
            "message": "Model is training in the background."
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get training progress of a project  
@app.post("/get_training_progress")
async def get_training_progress(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)

        # Get training progress
        project_status = project.get_project_status()
        
        # Return progress based on status
        if project_status == "Training in progress":
            progress = project.get_project_progress()
        elif project_status in ["Data is ready", "Training completed"]:
            progress = 100  # Training completed
        else:
            progress = 0  # Not started

        return {
            "success": True,
            "status": project_status,
            "progress": progress,
            "is_completed": project_status == "Training completed"
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
#=================================== Page 6 - Model Management ==========================================

# Get model performance
@app.post("/get_model_performance")
async def get_model_performance(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)
        logger.info(f"Getting model performance for project {request.project_id}")
        
        # Get model performance
        performance = project.get_model_performance()

        return {
            "success": True,
            "model performance": performance
        }

    except Exception as e:
        logger.error(f"Error getting model performance: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e), "traceback": traceback.format_exc()}
        )

@app.post("/get_model")
async def get_model(request: ProjectRequest):
    try:
        project_id = request.project_id
        project = Project(project_id)

        # Define model path based on project ID
        model_path = project.get_model_path()

        if not model_path.exists():
            raise RuntimeError(f"Model file not found: {model_path}")

        # stream the file in chunks
        def file_iterator(file_path: Path, chunk_size: int = 8192):
            """Yield file chunks – perfect for large models."""
            with open(file_path, "rb") as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
        print(1)
        # Build safe headers
        file_name = model_path.name  # "best.pt"
        file_size = model_path.stat().st_size
        headers = {
            "Content-Disposition": f'attachment; filename="{file_name}"',
            "Content-Type": "application/octet-stream",
            "Content-Length": str(file_size),
            # Optional: allow resumable downloads
            "Accept-Ranges": "bytes",
        }
        print(2)
        return StreamingResponse(
            file_iterator(model_path),
            media_type="application/octet-stream",
            headers=headers,
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)