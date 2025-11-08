import logging
import traceback
from fastapi import FastAPI, Request, status, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from passlib.context import CryptContext
import shutil
import uuid
import cv2
import pandas as pd
import os
from cv_models import KCF, SAM
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
# from config import config

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
        # 檢查資料庫連接
        if connection and connection.open:
            return {"status": "healthy", "database": "connected", "config": config}
        else:
            return {"status": "unhealthy", "database": "disconnected", "config": config}
    except Exception as e:
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

config = {
    'host': 'database',
    'user': 'root',
    'password': 'rootpassword',
    'database': 'Nocodile',
    'charset': 'utf8mb4'
}

try:
    connection = pymysql.connect(**config)
    print("数据库连接成功！")
except pymysql.Error as e:
    print(f"数据库连接失败: {e}")

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
                return "Login attempts exceeded. Account locked."
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
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query= "SELECT username FROM user WHERE user_id =%s"
        cursor.execute(query,(self.userID,))
        username = cursor.fetchone()['username']
        cursor.close()
        return username

    # Fetch all project IDs of projects the user own
    # Output: [projectID, projectID, ...]
    def get_owned_projects(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT DISTINCT project_id FROM project WHERE project_owner_id =%s"
        cursor.execute(query,(self.userID))
        result = cursor.fetchall()
        cursor.close()
        owned_projects = [d['project_id'] for d in result if 'project_id' in d]
        self.owned_projects = owned_projects
        return owned_projects
    
    # Fetch all the project IDs of projects the user has been shared with
    # Output: [projectID, projectID, ...]
    def get_shared_projects(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT DISTINCT project_id FROM project_shared_users WHERE user_id =%s"
        cursor.execute(query,(self.userID))
        result = cursor.fetchall()
        cursor.close()
        shared_projects = [d['project_id'] for d in result if 'project_id' in d]
        self.shared_projects = shared_projects
        return shared_projects

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
            if not connection or not connection.open:
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
            if not connection or not connection.open:
                logger.error("Database connection not available in get_videos")
                return []
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT DISTINCT video_id FROM video WHERE project_id = %s ORDER BY video_id ASC"
            cursor.execute(query,(self.project_id,))
            data = cursor.fetchall()
            video_ids = [d['video_id'] for d in data if 'video_id' in d]
            cursor.close()
            return video_ids
        except Exception as e:
            logger.error(f"Error in get_videos: {str(e)}")
            return []
    
    # Count number of videos of a project
    # Output: int
    def get_video_count(self):
        try:
            # 檢查資料庫連接
            if not connection or not connection.open:
                logger.error("Database connection not available in get_videos")
                return []
                
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT COUNT(video_id) as total FROM video WHERE project_id = %s"
            cursor.execute(query,(self.project_id,))
            result = cursor.fetchone()
            video_count = result['total']
            cursor.close()
            return video_count
        except Exception as e:
            logger.error(f"Error in get_videos: {str(e)}")
            return []
    
    # Fetch the ID of the owner of a project
    # Output: Owner's ID (int)
    def get_owner(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT project_owner_id FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id,))
        result = cursor.fetchone()
        cursor.close()
        if result:
            return result['project_owner_id']
        else:
            return None
    
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
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT class_name, color FROM class WHERE project_id = %s"
        cursor.execute(query,(self.project_id,))
        rows = cursor.fetchall()
        classes = {item["class_name"]: item["color"] for item in rows}
        return classes
    
    # Fetch the status of a project
    # Output: Project status(str)
    def get_project_status(self):
        try:
            # 檢查資料庫連接
            if not connection or not connection.open:
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
            if not connection or not connection.open:
                logger.error("Database connection not available in get_project_status")
                return "Unknown"
                
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
            return project_path + os.sep  # 返回帶分隔符的路徑
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
        self.classes = self.get_classes()
        self.classes[class_name] = colour
        
        # Add new row in class table
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="INSERT INTO class (project_id, class_name, color) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE `color` = VALUES(`color`);"
        cursor.execute(query,(self.project_id, class_name, colour))
        connection.commit()
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
        print("classes sorted in alphabetical order")
        class_id_dict = {}
        id = 0
        for _class in class_list:
            class_id_dict[_class] = id
            id += 1
        print("Class id defined as: "+str(class_id_dict))
        self.save_class_ids(class_id_dict)

        self.videos = self.get_videos()
        for video_id in self.videos:
            video = Video(self.project_id, video_id)

            # Write labels in txt files
            bbox_data = video.get_bbox_data()
            for result in bbox_data:
                # bbox_data = [{"frame_num": 0, "class_name": "车", "coordinates": "100 100 50 50"}, ...]
                frame_num = result['frame_num']
                class_name = result['class_name']
                coordinates = result['coordinates']

                if not isinstance(coordinates, str):
                    raise ValueError(f"Video {video.video_id} has unannotated frames. Please complete annotation before creating dataset.")
                
                filename = f"{label_dir}/{video.video_id}_frame_{frame_num}.txt"

                with open(filename, 'a') as file:
                    file.write(f"{class_id_dict[class_name]} {coordinates}\n")

            # Decompose videos into jpg images
            cap = cv2.VideoCapture(video.get_video_path())
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                image_path = f"{image_dir}/{video.video_id}_frame_"+str(frame_idx)+".jpg"
                cv2.imwrite(image_path, frame)
                frame_idx += 1

        self.project_status = "Data is ready"
        self.save_project_status()
        
        # 保存数据集路径到数据库
        dataset_path = f"{self.get_project_path()}/dataset"
        self.save_dataset_path(dataset_path)

        return True
    
    # Get auto annotation progress (int) from database
    def get_auto_annotation_progress(self):
        finished_frames = 0
        total_frames = 0
        for video_id in self.videos:
            video = Video(project_id=self.project_id, video_id=video_id)
            annotation_status, last_annotated_frame = video.get_annotation_status()
            frame_count = video.get_frame_count()
            if annotation_status == "auto annotation in progress":
                total_frames = last_annotated_frame + 1
            elif annotation_status == "completed":
                finished_frames += frame_count
            total_frames += frame_count
        overall_progress = finished_frames / total_frames if total_frames > 0 else 0

        return overall_progress
    
    # Get basic information of all videos from database
    # Output: [{"name": video_name, "file: video, "path": video_path}, ...]
    def get_uploaded_videos(self):
        videos_info = []
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
    def get_model_path(self):
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
        success = True
        for class_name in class_list:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "UPDATE class SET class_num = %s WHERE project_id = %s AND class_name = %s"
            cursor.execute(query, (class_list[class_name], self.project_id, class_name))
            connection.commit()
            success = bool(cursor.rowcount) and success
            cursor.close()  
    
    # Used during training
    @staticmethod
    def copy_files(image_list, img_dest, lbl_dest, labels_dir):
        for img_path in image_list:
            try:
                base_name = img_path.stem
                label_path = labels_dir / (base_name + ".txt")
                copy2(img_path, img_dest)
                if label_path.exists():
                    copy2(label_path, lbl_dest)
            except Exception as e:
                print(f"Warning: Failed to copy {img_path}: {e}")
                continue
    
    def train(self):
        self.project_status = "Training in progress"
        self.save_project_status()

        # Get dataset path from database, fallback to default if not found
        dataset_path = self.get_dataset_path()
        if dataset_path and Path(dataset_path).exists():
            dataset_dir = Path(dataset_path)
        else:
            # Fallback to default path
            dataset_dir = Path(self.get_project_path()) / "dataset"
        
        # Check if dataset exists and has images, if not create it automatically
        images_dir = dataset_dir / "images"
        if not images_dir.exists() or not (any(images_dir.glob("*.jpg")) or any(images_dir.glob("*.png"))):
            print("Dataset not found or empty, creating dataset automatically...")
            try:
                self.create_dataset()
                print("Dataset created successfully!")
            except Exception as e:
                print(f"Failed to create dataset: {e}")
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
        random.shuffle(all_images)
        split_idx = int(0.8 * len(all_images))

        train_images = all_images[:split_idx]
        val_images = all_images[split_idx:]

        self.copy_files(train_images, train_img_dir, train_lbl_dir, labels_dir)
        self.copy_files(val_images, val_img_dir, val_lbl_dir, labels_dir)

        # Define class list
        classes = [key for key in self.get_classes()]
        classes.sort()

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
            for epoch in range(total_epochs):
                model.train(
                    data=str(yaml_path),
                    epochs=1,
                    imgsz=640,
                    batch=4,
                    #device="cpu",
                    save=True,
                    exist_ok=True
                )
                progress = round((epoch + 1) / total_epochs * 100) # YOUR TRAINING VARIABLE
                print(f"Training progress: {progress}%")
                self.save_training_progress(progress)
            print("Model training completed successfully!")

        except Exception as e:
            print(f"Training completed with warnings: {e}")
            # Continue with post-processing even if there are warnings
        
        # Update progress to 100% after training
        print("Training progress: 100.00%")
        self.save_training_progress(100)

        # Copy best.pt to output folder
        best_weights_src = Path("runs/detect/train/weights/best.pt")
        best_weights_dst = output_dir / "best.pt"

        if best_weights_src.exists():
            copy2(best_weights_src, best_weights_dst)
            print(f"Best model weights saved to: {best_weights_dst}")
        else:
            print("Warning: best.pt not found")

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
        return model_path.resolve()

    # Get model performance
    def get_model_performance(self):
        model_path = self.get_model_path()
        if not model_path.exists():
            raise FileNotFoundError("Model file 'best.pt' not found. Please train the model first.")

        dataset_dir = Path(self.get_project_path()) / "dataset"
        yaml_path = dataset_dir / "data.yaml"
        if not yaml_path.exists():
            raise FileNotFoundError("Dataset configuration file 'data.yaml' not found.")

        # Load the trained model
        model = YOLO(model_path)

        # Run validation on the validation set
        metrics = model.val(result=str(yaml_path.resolve()))

        # Extract the key performance metrics from the results object.
        # For object detection, we use mAP as the primary "accuracy" metric.
        # The other metrics are averaged over all classes.
        # Handle NaN values for JSON serialization
        import math
        
        def safe_float(value):
            if math.isnan(value) or math.isinf(value):
                return 0.0
            return float(value)
        
        performance = {
            "accuracy": safe_float(metrics.box.map50),  # Using mAP50 as the main accuracy indicator
            "precision": safe_float(metrics.box.p.mean()), # Mean Precision over all classes
            "recall": safe_float(metrics.box.r.mean()),    # Mean Recall over all classes
            "f1-score": safe_float(metrics.box.f1.mean())  # Mean F1-score over all classes
        }
        return performance
    
class Video(Project):
    def __init__(self, project_id: int, video_id=None, initialize=False):
        super().__init__(project_id)
        self.video_id = video_id
        if not initialize:
            self.video_path = self.get_video_path()
            self.cap = cv2.VideoCapture(self.video_path)
            # 从数据库获取标注状态
            self.annotation_status, self.last_annotated_frame = self.get_annotation_status()
            # 获取视频信息
            self.frame_count = self.get_frame_count()
            self.fps = self.get_fps()

    # Initialize when a video is uploaded, includes inserting data to the database
    # Output: video_id, video_path
    def initialize(self, name, ext):
        self.annotation_status, self.last_annotated_frame = "yet to start", -1

        # 清理文件名，確保安全
        safe_name = sanitize_filename(name)
        self.video_path = Path(self.get_project_path()) / "videos" / f"{safe_name}.{ext}"
        self.video_name = safe_name
        
        # 确保视频目录存在
        video_dir = Path(self.get_project_path()) / "videos"
        video_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            self.video_count = self.get_video_count()
        except:
            self.video_count = 0
        self.video_count += 1

        # Add row to video
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "INSERT INTO video (project_id, video_path, video_name, annotation_status) VALUES (%s, %s, %s, %s);"
        cursor.execute(query,(self.project_id, self.video_path, self.video_name, self.annotation_status))
        self.video_id = cursor.lastrowid
        connection.commit()  # 提交事务
        cursor.close()

        return self.video_id, self.video_path
    
    # Return some video info (used in project.get_videos_info)
    def get_video_info(self):
        video_path = self.get_video_path()
        # 將絕對路徑轉換為相對URL路徑
        # 例如: /app/projects/17/videos/IMG_0499..mp4 -> /videos/17/videos/IMG_0499..mp4
        if video_path.startswith('/app/projects/'):
            relative_path = video_path.replace('/app/projects/', '/videos/')
        else:
            relative_path = video_path

        info = {
            "name": self.get_video_name(),
            "file": self.video_id,
            "path": video_path,
            "url": relative_path  # 添加URL字段供前端使用
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
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            video_id_int = int(self.video_id)
            query = "SELECT video_path FROM video WHERE video_id = %s"
            cursor.execute(query, (video_id_int,))
            result = cursor.fetchone()
            if result:
                return result['video_path']
        except (ValueError, TypeError):
            pass
    
    # Fetch video name (str) from database
    def get_frame_count(self):
        if not self.video_path:
            self.video_path = self.get_video_path()
        cap = cv2.VideoCapture(self.video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        return frame_count
    
    def get_fps(self):
        if not self.video_path:
            self.video_path = self.get_video_path()
        cap = cv2.VideoCapture(self.video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
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
        if frame_num:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT frame_num, class_name, coordinates FROM bbox WHERE video_id = %s AND frame_num = %s"
            cursor.execute(query,(self.video_id, frame_num))
            bbox_data = cursor.fetchall()
        else:
            # fetch all if frame_num is not specified
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT frame_num, class_name, coordinates FROM bbox WHERE video_id = %s"
            cursor.execute(query,(self.video_id))
            bbox_data = cursor.fetchall()
        return bbox_data
    
    def get_annotation_status(self):
        annotation_status='yet to start'
        last_annotated_frame=None

        # 首先嘗試將 video_id 轉換為整數（向後兼容）
        try:
            video_id_int = int(self.video_id)
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT annotation_status,last_annotated_frame FROM video WHERE video_id = %s"
            cursor.execute(query,(self.video_id,))
            result = cursor.fetchone()
            if result:
                annotation_status = result['annotation_status']
                last_annotated_frame = result['last_annotated_frame']
                return annotation_status, last_annotated_frame
            else:
                raise ValueError(f"Video with ID {self.video_id} not found")
        except (ValueError, TypeError):
            pass

    ###### Selecting Frame for Manual Annotation ######
    # For testing purpose, annotate every second
    def get_next_frame_to_annotate(self):
        self.frame_count = self.get_frame_count()
        self.fps = self.get_fps()
        if self.annotation_status == "yet to start":
            frame_num = 0
            return self.get_frame(frame_num), frame_num
        elif self.annotation_status == "completed":
            return None, None
        elif isinstance(self.last_annotated_frame, int):
            next_frame = self.last_annotated_frame + self.fps
            if next_frame < self.frame_count:
                return self.get_frame(next_frame), next_frame
            else:
                # no more frames to annotate
                self.annotation_status = "manual annotation completed"
                self.save_annotation_status()
                
                # 检查是否所有视频都已完成标注
                project = Project(project_id=self.project_id)
                all_videos_completed = True
                for video_id in project.videos:
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
            return None, None
    
    def get_frame(self, frame_num: int):
        if self.frame_count <= 0:
            raise ValueError("Video file is invalid or has no frames")
        if frame_num < 0 or frame_num >= self.frame_count:
            raise ValueError("Frame number out of range")
        if not self.video_path:
            self.video_path = self.get_video_path()
        cap = cv2.VideoCapture(self.video_path)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = self.cap.read()
        if ret:
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            frame_encoded = base64.b64encode(frame_bytes).decode('utf-8')
        else:
            raise ValueError("Could not read frame")
        return frame_encoded
    
    def annotate(self, frame_num: int, bbox: list):
        try:
            self.annotation_status = "manual annotation in progress"
            if frame_num < 0 or frame_num >= self.frame_count:
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

    @staticmethod
    def _calculate_iou(bbox1, bbox2):
        # Unpack the boxes
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2

        # Calculate the coordinates of the corners of the boxes
        bbox1_x2 = x1 + w1
        bbox1_y2 = y1 + h1
        bbox2_x2 = x2 + w2
        bbox2_y2 = y2 + h2

        # Calculate the coordinates of the intersection rectangle
        inter_x1 = max(x1, x2)
        inter_y1 = max(y1, y2)
        inter_x2 = min(bbox1_x2, bbox2_x2)
        inter_y2 = min(bbox1_y2, bbox2_y2)

        # Calculate the area of the intersection rectangle
        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)

        # Calculate the area of both bounding boxes
        box1_area = w1 * h1
        box2_area = w2 * h2

        # Calculate the IoU
        iou = inter_area / float(box1_area + box2_area - inter_area) if (box1_area + box2_area - inter_area) > 0 else 0
        return iou

    def auto_annotate(self):
        self.annotation_status = "auto annotation in progress"
        
        bbox_data = self.get_bbox_data()

        # Find all annotated frames
        annotated_frames = list({d["frame_num"] for d in bbox_data if "frame_num" in d})

        # Loop through each segment between annotated frames
        for i in range(len(annotated_frames) - 1):
            starting_frame_num = annotated_frames[i]
            ending_frame_num = annotated_frames[i + 1]
            print(f"Auto-annotating frames from {starting_frame_num} to {ending_frame_num}...")

            # Convert the bbox string to a tuple of integers
            frame_bbox = self.get_bbox_data(starting_frame_num)
            for bbox in frame_bbox:
                starting_frame_bbox = tuple(bbox['coordinates'].split())

            # Perform KCF tracking to locate the estimated location of the object
            if not self.video_path:
                self.video_path = self.get_video_path()
            kcf_tracker = KCF(video_path=self.video_path)
            tracking_results = kcf_tracker.predict_frames(starting_frame_bbox=starting_frame_bbox, starting_frame_num=starting_frame_num, ending_frame_num=ending_frame_num)

            # Find the correct segment for each unbounded frame
            cap = cv2.VideoCapture(self.video_path)
            cap.set(cv2.CAP_PROP_POS_FRAMES, starting_frame_num+1)
            for index in range(starting_frame_num+1, ending_frame_num):
                print(f"Processing frame {index+1}...")
                ret, frame = cap.read()
                if not ret:
                    print(f"无法读取第 {index+1} 帧，视频可能结束")
                    break
                sam_segmenter = SAM(image=frame)
                bboxes = sam_segmenter.segment()
                    
                # Find the best matching SAM box by comparing IoU of the kcf-predicted box
                max_iou = -1
                best_bbox = None
                target_bbox = tracking_results[index - starting_frame_num]

                for bbox in bboxes:
                    iou = self._calculate_iou(target_bbox, bbox)
                    if iou > max_iou:
                        max_iou = iou
                        best_bbox = bbox

                x, y, w, h = best_bbox
                best_bbox = f"{x} {y} {w} {h}"
                self.bbox_data.append({"frame_num": index, "class_name": starting_frame_bbox['class_name'],"coordinates": best_bbox})
                print(f"Best matching bbox for frame {index+1}: {best_bbox}")

                # Save bbox result in database
                self.save_bbox_data(index, starting_frame_bbox['class_name'], best_bbox)

                # Save the number of frame in progress
                self.last_annotated_frame = index
                self.save_last_annotated_frame()

        cap.release()

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
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET annotation_status = %s WHERE video_id = %s"
        cursor.execute(query,(self.annotation_status, self.video_id))
        connection.commit()  # 提交事务
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save last annotated frame to database
    def save_last_annotated_frame(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET last_annotated_frame = %s WHERE video_id = %s"
        cursor.execute(query,(self.last_annotated_frame, self.video_id))
        connection.commit()  # 提交事务
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    def save_bbox_data(self, frame_num, class_name, coordinates):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "INSERT INTO bbox (frame_num, class_name, coordinates, video_id) VALUES (%s, %s, %s, %s)"
        cursor.execute(query,(frame_num, class_name, coordinates, self.video_id))
        connection.commit()  # 提交事务
        success = bool(cursor.rowcount)
        cursor.close()
        return success

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
async def login(request: LoginRequest):
    try:
        username = request.username
        password = request.password

        # Check if password is correct
        userlogin = UserLogin(username, password)
        success, message = userlogin.login()

        if success:
            # if status is True, get userID from database, else None
            userID = userlogin.get_userID()

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
        if not connection or not connection.open:
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
            name = project.get_name()
            videoCount = project.get_video_count()
            status = project.get_project_status()
            isOwned = (user == project.get_owner())
            owned_projects.append({"id": project_id, "name": name, "videoCount": videoCount, "status": status, "isOwned": isOwned})
        
        # Get detailed project information for shared projects
        shared_projects = []
        for project_id in shared_project_ids:
            project = Project(project_id)
            name = project.get_name()
            videoCount = project.get_video_count()
            status = project.get_project_status()
            isOwned = (user == project.get_owner())
            shared_projects.append({"id": project_id, "name": name, "videoCount": videoCount, "status": status, "isOwned": isOwned})
        
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
        if not connection or not connection.open:
            logger.error("Database connection not available")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Database connection not available"}
            )

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
@app.post("/change_project_name")
async def change_project_name(request: ProjectRequest, new_name: str):
    try:
        project = Project(project_id = request.project_id)

        success = project.change_project_name(new_name)
        
        if success:
            return {
                "success": True,
                "message": f"Project name changed to {new_name}"
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
        share_query = "SELECT id FROM project_shares WHERE project_id = %s AND shared_with_user_id = %s"
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
            INSERT INTO project_shares (project_id, shared_with_user_id, permissions, shared_at) 
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
        delete_query = "DELETE FROM project_shares WHERE project_id = %s AND shared_with_user_id = %s"
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

        cursor = connection.cursor(pymysql.cursors.DictCursor)
        # Ask Jimmy (database has a table for project_shares?)
        query = """
            SELECT ps.id, ps.permissions, ps.shared_at, u.username, u.user_id
            FROM project_shares ps
            JOIN user u ON ps.shared_with_user_id = u.user_id
            WHERE ps.project_id = %s
            ORDER BY ps.shared_at DESC
        """
        cursor.execute(query, (project_id,))
        shares = cursor.fetchall()
        cursor.close()

        return {
            "success": True,
            "shares": shares
        }

    except Exception as e:
        logger.error(f"Error in get_project_shares: {str(e)}")
        import traceback
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
        project = Project(project_id=project_id)
        project_dir = Path(project.get_project_path())

        # Allowed video MIME types
        ALLOWED_MIME_TYPES = {
            "video/mp4",
            "video/avi",
            "video/mkv",
            "video/webm",
            "video/quicktime",  # .mov
            "video/x-msvideo",  # .avi
        }

        # 1. Validate filename
        filename = file.filename
        if not filename:
            raise HTTPException(status_code=400, detail="No file name")

        # Prevent path traversal
        safe_filename = Path(filename).name
        if safe_filename != filename:
            raise HTTPException(status_code=400, detail="Invalid filename")

        # 2. Validate content type
        content_type = file.content_type
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
            )

        # 3. Define destination
        file_path = project_dir / safe_filename

        # Optional: Prevent overwrite (or allow with unique names)
        if file_path.exists():
            raise HTTPException(status_code=409, detail="File already exists")

        # 4. Stream to disk
        try:
            size = await save_upload_file(file, file_path)
            logger.info(f"Successfully uploaded: {file_path} ({size / (1024**3):.2f} GB)")
        except Exception as e:
            if file_path.exists():
                file_path.unlink()  # cleanup partial
            raise HTTPException(status_code=500, detail="Upload failed")
        
        return JSONResponse({
            "message": "Upload successful",
            "filename": safe_filename,
            "size_bytes": size,
            "size_gb": round(size / (1024**3), 2),
            "path": str(file_path)
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
@app.post("/add_class")
async def add_class(request: ProjectRequest, class_name: str, colour: str):
    try:
        project = Project(project_id = request.project_id)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "Class name already exists.",
                "classes": project.classes
            }
        
        project.add_class(class_name, colour)
        
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
@app.post("/modify_class")
async def modify_class(request: ProjectRequest, original_class_name: str, new_class_name: str):
    try:
        project = Project(project_id = request.project_id)

        # check if original_class_name exists for this project
        class_name_exists = project.check_class_exists(original_class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Original class does not exist.",
                "classes": project.classes
            }
        
        # check if new_class_name already exists for this project
        class_name_exists = project.check_class_exists(new_class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "New class name already exists.",
                "classes": project.classes
            }
        
        project.modify_class(original_class_name, new_class_name)
        
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
@app.post("/delete_class")
async def add_class(request: ProjectRequest, class_name: str):
    try:
        project = Project(project_id = request.project_id)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Class does not exists.",
                "classes": project.classes
            }
        
        project.delete_class(class_name)
        
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
    video_id: int

# Get next frame to annotate
@app.post("/get_next_frame_to_annotate")
async def get_next_frame_to_annotate(request: VideoRequest):
    try:
        video = Video(project_id = request.project_id, video_id = request.video_id)
        next_frame, frame_num = video.get_next_frame_to_annotate()
        
        if next_frame is None:
            return {
                "success": False,
                "message": "All frames have been annotated.",
                "image": None,
                "frame_num": None
            }
        
        return {
                "success": True,
                "message": "Next frame fetched successfully.",
                "image": next_frame,
                "frame_num": frame_num
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
        return {
            "annotation status": video.annotation_status,
            "last annotated frame": video.last_annotated_frame
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
# Save annotation for a frame
@app.post("/annotate")
async def annotate(request: AnnotationRequest):
    try:
        video = Video(project_id = request.project_id, video_id = request.video_id)
        for bbox in request.bboxes:
            success = video.annotate(request.frame_num, bbox)
        
        if success:
            return {
                "success": True,
                "message": "Annotation saved."
            }
        else:
            return {
                    "success": False,
                    "message": success
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# ? No need now?
# Get next video to annotate
@app.post("/next_video")
async def next_video(request: ProjectRequest, current_video_id: str):
    try:
        project = Project(project_id = request.project_id)
        if current_video_id not in project.videos:
            return {
                "success": False,
                "message": "Current video not found in project.",
                "next_video_id": None
            }
        
        current_index = project.videos.index(current_video_id)
        if current_index + 1 < len(project.videos):
            next_video_id = project.videos[current_index + 1]
            return {
                "success": True,
                "message": "Next video fetched successfully.",
                "next_video_id": next_video_id
            }
        else:
            next_video_id = project.videos[0]
            return {
                "success": True,
                "message": "Reached end of video list. Looping back to first video.",
                "next_video_id": next_video_id
            }

    except Exception as e:
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
        project = Project(project_id = project_id)

        # 检查所有视频是否都已完成标注
        for video_id in project.videos:
            video = Video(project_id = project_id, video_id = video_id)
            if video.annotation_status not in ["completed", "manual annotation completed"]:
                return {
                    "success": False,
                    "message": f"Video {video_id} is not completed. Current status: {video.annotation_status}. Please complete annotation first.",
                }

        # 所有视频都已完成标注，创建数据集
        success = project.create_dataset()
        
        if success:
            return {
                "success": True,
                "message": "Dataset created successfully."
            }
        else:
            return {
                "success": False,
                "message": "Failed to create dataset."
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

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
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
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

        # Get model performance
        performance = project.get_model_performance()

        return {
            "success": True,
            "model performance": performance
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/get_model")
async def get_model(request: ProjectRequest):
    try:
        project_id = request.project_id
        project = Project(project_id)
        
        # Define model path based on project ID
        model_path = Path(project.get_model_path())

        if not model_path.is_file():
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
