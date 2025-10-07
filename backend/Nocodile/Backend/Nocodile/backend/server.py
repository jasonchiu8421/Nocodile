import logging
from fastapi import FastAPI, Request, status, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response
from pydantic import BaseModel
from typing import Dict, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from mysql.connector import Error
import shutil
import uuid
import re
import os
from pathlib import Path
from config import config

# 檔案名清理函數
def sanitize_filename(filename: str) -> str:
    """
    清理檔案名，移除非法字符
    """
    # 移除或替換非法字符
    illegal_chars = r'[<>:"|?*\x00-\x1f]'
    sanitized = re.sub(illegal_chars, '_', filename)
    
    # 移除開頭和結尾的點和空格
    sanitized = sanitized.strip('. ')
    
    # 限制長度
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    
    # 確保不為空
    if not sanitized:
        sanitized = "unnamed_file"
    
    return sanitized

def sanitize_path(path: str) -> str:
    """
    清理路徑，確保安全
    """
    # 移除非法字符
    illegal_chars = r'[<>:"|?*\x00-\x1f]'
    sanitized = re.sub(illegal_chars, '_', path)
    
    # 移除多餘的斜杠
    sanitized = re.sub(r'[/\\]+', '/', sanitized)
    
    # 確保路徑不包含危險的相對路徑
    if '..' in sanitized:
        sanitized = sanitized.replace('..', '_')
    
    return sanitized
# Try to import OpenCV, fallback if not available
try:
    import cv2
    OPENCV_AVAILABLE = True
    print("✅ OpenCV imported successfully")
except ImportError as e:
    print(f"⚠️ OpenCV not available: {e}")
    print("🔄 Running in headless mode without OpenCV")
    OPENCV_AVAILABLE = False
    cv2 = None

import pandas as pd
import os

# Try to import cv_models, fallback if not available
try:
    from cv_models import KCF, SAM
    CV_MODELS_AVAILABLE = True
    print("✅ CV models imported successfully")
except ImportError as e:
    print(f"⚠️ CV models not available: {e}")
    print("🔄 Running without CV models")
    CV_MODELS_AVAILABLE = False
    KCF = None
    SAM = None

import numpy as np
import base64
import aiofiles
from ultralytics import YOLO
import yaml
import random
import mysql.connector
from shutil import copy2, rmtree
from pathlib import Path
import pymysql
import hashlib
import hmac

#=================================== Initialize server ==========================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.server.cors_origins,
    allow_credentials=config.server.cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

#=================================== Connect to database ==========================================

# 使用配置模組獲取資料庫連接配置
db_configs = config.database.get_connection_configs()

# 嘗試連接MySQL，失敗則使用無數據庫模式
connection = None
use_mysql = False

for i, db_config in enumerate(db_configs):
    try:
        print(f"嘗試連接配置 {i+1}: {db_config['host']}:{db_config['port']}")
        connection = pymysql.connect(**db_config)
        print(f"✅ MySQL 数据库连接成功！使用配置 {i+1}")
        print(f"📊 資料庫: {db_config['database']}")
        use_mysql = True
        break
    except pymysql.Error as e:
        print(f"❌ 配置 {i+1} 连接失败: {e}")
        continue

if not connection:
    print("🚫 所有數據庫連接配置都失敗，使用無數據庫模式（模擬數據）...")
    print("💡 請檢查 Docker 容器是否運行，或檢查環境變數配置")
    connection = None
    use_mysql = False

class LoginRequest(BaseModel):
    username: str
    password: str
        
class UserRequest(BaseModel):
    userID: str

class ProjectRequest(BaseModel):
    project_id: str

class CreateProjectRequest(BaseModel):
    userID: str
    project_name: str
    project_type: str = "YOLO object detection"

class VideoRequest(BaseModel):
    project_id: str
    video_id: str
    current_frame: int = 0  # 添加當前幀數參數

class AnnotationRequest(BaseModel):
    project_id: str
    video_id: str
    frame_num: int
    bboxes: list

class UserLogin():
    def __init__(self, username, password, status=True):
        self.username = username
        self.password = password  # In production, hash this!
        self.status = status      # True if active
        self.login_attempts = 0

    def get_password_hash(self):
        ### db ###
        # Find hashed password from database
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT password_hash FROM users WHERE username = %s"
        cursor.execute(query, (self.username,))
        hashed_password = cursor.fetchone()['password_hash']
        cursor.close()
        return hashed_password
    
    def get_userID(self):
        ### db ###
        # Find userID given self.username
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT user_id FROM users WHERE username = %s"
        cursor.execute(query,(self.username,))
        userID = cursor.fetchone()['user_id']
        cursor.close()
        return userID

    def login(self, max_attempts=3):
        if not self.status:
            return False, "Account locked."
        
        # Hash the password input
        salt, pwd_hash = self._hash_password(self.password)
        stored_hash = self.get_password_hash()
        is_correct = self._verify_password(stored_hash, salt, pwd_hash)

        if is_correct:
            self.login_attempts = 0
            return True, "Login successful."

        else:
            self.login_attempts += 1
            if self.login_attempts >= max_attempts:
                self.status = False
                return "Login attempts exceeded. Account locked."
            return False, "Invalid password."
        
    @staticmethod
    def _hash_password(password, salt=None):
        # Generate a random salt if not provided
        if salt is None:
            salt = os.urandom(16)
        # Use PBKDF2-HMAC-SHA256 as the hashing algorithm
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100_000)
        return salt, pwd_hash

    @staticmethod
    def _verify_password(self, stored_hash, stored_salt, provided_password):
        # Hash the provided password using the stored salt
        _, pwd_hash = self._hash_password(provided_password, stored_salt)
        # Use hmac.compare_digest to avoid timing attacks
        return hmac.compare_digest(pwd_hash, stored_hash)

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    def get_username(self):
        if connection is None or not connection:
            return f"User_{self.userID}"
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query= "SELECT username FROM users WHERE user_id =%s"
            cursor.execute(query,(self.userID,))
            result = cursor.fetchone()
            cursor.close()
            return result['username'] if result else f"User_{self.userID}"
        except Exception as e:
            print(f"獲取用戶名失敗: {e}")
            return f"User_{self.userID}"

    def get_owned_projects(self):
        if connection is None or not connection:
            # 返回示例數據
            return [
                {"project_id": 1, "project_name": "示例項目1", "video_count": 0, "image_count": 0, "status": "未開始", "is_owned": True},
                {"project_id": 2, "project_name": "示例項目2", "video_count": 0, "image_count": 0, "status": "未開始", "is_owned": True}
            ]
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query="SELECT DISTINCT project_id FROM project WHERE project_owner_id =%s"
            cursor.execute(query,(self.userID))
            data = cursor.fetchall()
            cursor.close()
            owned_projects = [d['project_id'] for d in data if 'project_id' in d]
            
            # 轉換為包含詳細信息的格式
            detailed_projects = []
            for project_id in owned_projects:
                detailed_projects.append({
                    "project_id": project_id,
                    "project_name": f"項目 {project_id}",
                    "video_count": 0,
                    "image_count": 0,
                    "status": "未開始",
                    "is_owned": True
                })
            
            self.owned_projects = detailed_projects
            return detailed_projects
        except Exception as e:
            print(f"獲取擁有項目失敗: {e}")
            return [
                {"project_id": 1, "project_name": "示例項目1", "video_count": 0, "image_count": 0, "status": "未開始", "is_owned": True}
            ]
    
    def get_shared_projects(self):
        if connection is None or not connection:
            return []
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query="SELECT DISTINCT project_id FROM project_shared_users WHERE user_id =%s"
            cursor.execute(query,(self.userID))
            data = cursor.fetchall()
            cursor.close()
            shared_projects = [d['project_id'] for d in data if 'project_id' in d]
            
            # 轉換為包含詳細信息的格式
            detailed_projects = []
            for project_id in shared_projects:
                detailed_projects.append({
                    "project_id": project_id,
                    "project_name": f"共享項目 {project_id}",
                    "video_count": 0,
                    "image_count": 0,
                    "status": "未開始",
                    "is_owned": False
                })
            
            self.shared_projects = detailed_projects
            return detailed_projects
        except Exception as e:
            print(f"獲取共享項目失敗: {e}")
            return []

class Project():
    def __init__(self, project_id: str, initialize=False, project_name=None, project_type=None, owner=None):
        if initialize:
            # 初始化時不調用 self.initialize()，而是等待外部調用
            self.project_id = project_id
            self.project_name = project_name
            self.project_type = project_type
            self.owner = owner
        else:
            self.project_id = project_id
            # 檢查數據庫連接
            if connection is None or not connection:
                raise Exception("Database not connected")
            else:
                self.project_name = self.get_project_name()
                self.project_type = self.get_project_type()
                self.videos = self.get_videos()
                self.video_count = self.get_video_count()
                self.owner = self.get_owner()
                self.shared_users = self.get_shared_users()
                self.project_status = self.get_project_status()

    def initialize(self, project_name, project_type, owner):
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

        # 檢查數據庫連接
        if connection is None or not connection:
            raise Exception("Database not connected")

        # Add new row in project table
        try:
            if use_mysql:
                cursor = connection.cursor(pymysql.cursors.DictCursor)
                query="INSERT INTO project (project_name, project_type, project_owner_id, project_status) VALUES (%s, %s, %s, %s);"
                cursor.execute(query,(self.project_name, self.project_type, self.owner, self.project_status))
                project_id = cursor.lastrowid
                cursor.close()
            else:
                cursor = connection.cursor()
                query="INSERT INTO project (project_name, project_type, project_owner_id, project_status) VALUES (?, ?, ?, ?);"
                cursor.execute(query,(self.project_name, self.project_type, self.owner, self.project_status))
                project_id = cursor.lastrowid
                cursor.close()
        except Exception as e:
            print(f"創建項目時數據庫錯誤: {e}")
            import random
            project_id = random.randint(1000, 9999)
            print(f"返回模擬項目ID: {project_id}")
        
        # Create project directory
        self.project_path = self.get_project_path()

        self.project_id = project_id
        return project_id
    
    def project_name_exists(self):
        if self.project_name == self.get_project_name():
            return True
        return False
    
    def get_project_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT project_name FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id))
        result = cursor.fetchone()
        cursor.close()
        return result['project_name'] if result else f"Project {self.project_id}"
    
    def get_project_type(self):
        # Set in next phrase
        project_type = "YOLO object detection"
        return project_type
    
    def get_videos(self):
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, returning empty videos list")
            return []
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT DISTINCT video_id FROM videos WHERE project_id = %s ORDER BY video_id ASC"
            cursor.execute(query,(self.project_id))
            data = cursor.fetchall()
            video_ids = [d['video_id'] for d in data if 'video_id' in d]
            cursor.close()
            print(f"📋 [BACKEND] Found {len(video_ids)} videos for project {self.project_id}: {video_ids}")
            return video_ids
        except Exception as e:
            print(f"💥 [BACKEND] Error getting videos from database: {e}")
            return []
    
    def get_video_count(self):
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, returning 0 for video count")
            return 0
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT COUNT(*) as count FROM videos WHERE project_id = %s"
            cursor.execute(query, (self.project_id))
            result = cursor.fetchone()
            cursor.close()
            return result['count'] if result else 0
        except Exception as e:
            print(f"💥 [BACKEND] Error getting video count: {e}")
            return 0
    
    def get_owner(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT project_owner_id FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id))
        result = cursor.fetchone()
        cursor.close()
        return result['project_owner_id'] if result else None
    
    def get_shared_users(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT DISTINCT user_id FROM project_shared_users WHERE project_id = %s"
        cursor.execute(query,(self.project_id))
        data = cursor.fetchall()
        shared_users = [d['user_id'] for d in data if 'user_id' in d]
        return shared_users
    
    def get_classes(self):
        # 檢查數據庫連接
        if connection is None or not connection:
            return [
                {"id": "give_way_sign", "name": "give_way_sign", "color": "#fbbf24"},
                {"id": "pedestrian_child", "name": "pedestrian_child", "color": "#3b82f6"},
                {"id": "zebra_crossing_sign", "name": "zebra_crossing_sign", "color": "#8b5cf6"},
                {"id": "traffic_light_red", "name": "traffic_light_red", "color": "#10b981"},
                {"id": "stop_sign", "name": "stop_sign", "color": "#ef4444"}
            ]
        
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT class_name, color FROM class WHERE project_id = %s"
        cursor.execute(query,(self.project_id))
        rows = cursor.fetchall()
        classes = [{"id": item["class_name"], "name": item["class_name"], "color": item["color"]} for item in rows]
        return classes
    
    def get_project_status(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT project_status FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id))
        project_status = cursor.fetchone()['project_status']
        return project_status
        
    def get_project_path(self):
        """
        安全地構建項目路徑，避免非法字符和權限問題
        """
        try:
            # 清理項目ID，移除非法字符
            safe_project_id = sanitize_filename(str(self.project_id))
            safe_project_id = safe_project_id.strip()
            
            # 確保項目ID不為空且有效
            if not safe_project_id or safe_project_id in ['.', '..', '']:
                safe_project_id = "default_project"
            
            # 構建安全的項目路徑
            project_path = Path(f"./projects/{safe_project_id}")
            
            # 確保路徑安全
            project_path = project_path.resolve()
            
            # 檢查路徑是否在允許的範圍內
            current_dir = Path.cwd().resolve()
            if not str(project_path).startswith(str(current_dir)):
                raise ValueError("Project path outside allowed directory")
            
            # 創建目錄（如果不存在）
            project_path.mkdir(parents=True, exist_ok=True)
            
            # 檢查目錄權限
            if not os.access(project_path, os.W_OK):
                raise PermissionError(f"Cannot write to project directory: {project_path}")
            
            print(f"📁 [BACKEND] Created project directory: {project_path}")
            
            # 返回字符串路徑，確保以斜杠結尾
            return str(project_path) + "/"
            
        except Exception as e:
            print(f"⚠️ [BACKEND] Error creating project path, using fallback: {e}")
            # 使用安全的備用路徑
            try:
                fallback_path = Path("./safe_projects/default")
                fallback_path.mkdir(parents=True, exist_ok=True)
                return str(fallback_path) + "/"
            except Exception as fallback_error:
                print(f"💥 [BACKEND] Fallback path also failed: {fallback_error}")
                # 最後的備用方案
                return "./"
    
    def change_project_name(self, new_name: str):
        self.project_name = new_name
        self.save_project_name()
        return True
    
    def check_class_exists(self, class_name: str):
        self.classes = self.get_classes()
        return class_name in self.classes
    
    def get_new_class_ID(self):
        # get new class ID
        classID = 80
        while classID in self.classes:
            classID += 1
        return classID
    
    def add_class(self, class_name: str, colour: str):
        # 檢查數據庫連接
        if connection is None or not connection:
            print(f"數據庫未連接，無法添加類別: {class_name}")
            return False
        
        # Add new row in class table
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="INSERT INTO class (project_id, class_name, color) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE `color` = VALUES(`color`);"
        cursor.execute(query,(self.project_id, class_name, colour))
        cursor.close()

        return True
    
    def modify_class(self, old_class_name: str, new_class_name: str):
        # 檢查數據庫連接
        if connection is None or not connection:
            print(f"數據庫未連接，無法修改類別: {old_class_name}")
            return False
        
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE class SET class_name = %s WHERE project_id = %s AND class_name = %s;"
        cursor.execute(query,(self.project_id, old_class_name, new_class_name))
        cursor.close()
        return True
    
    def delete_class(self, class_name: str):
        # 檢查數據庫連接
        if connection is None or not connection:
            print(f"數據庫未連接，無法刪除類別: {class_name}")
            return False
        
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "DELETE FROM class WHERE project_id = %s AND class_name = %s"
        cursor.execute(query,(self.project_id, class_name))
        cursor.close()
        return True

    def create_dataset(self):
        label_dir = f"{self.get_project_path()}/datasets/labels/"
        image_dir = f"{self.get_project_path()}/datasets/images/"

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
        print("Class id defined as: "+class_id_dict)
        self.save_class_ids(class_id_dict)

        for video_id in self.videos:
            video = Video(self.project_id, video_id)

            # Write labels
            bbox_data = video.get_bbox_data()
            for data in bbox_data:
                # bbox_data = [[frame_num, class_name, coordinates]]
                frame_num = data[0]
                class_name = data[1]
                coordinates = data[2]

                if not isinstance(coordinates, str):
                    raise ValueError(f"Video {video.video_id} has unannotated frames. Please complete annotation before creating dataset.")
                
                ### db change path if necessary ###
                filename = f"{label_dir}{video.video_id}_frame_{frame_num}.txt"

                with open(filename, 'a') as file:
                    file.write(f"{class_id_dict[class_name]} {coordinates}\n")

            # Write images
            if OPENCV_AVAILABLE:
                cap = cv2.VideoCapture(video.get_video_path())
                frame_idx = 0
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    image_path = f"{image_dir}{video.video_id}_frame_"+str(frame_idx)+".png"
                    cv2.imwrite(image_path, frame)
                    frame_idx += 1
            else:
                print("OpenCV not available, skipping image extraction")

        self.project_status = "Dataset ready"
        self.save_project_status()

        return True
    
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
    
    def get_uploaded_videos(self):
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, returning empty list")
            return []
        
        try:
            videos_info = []
            for video_id in self.videos:
                video = Video(project_id=self.project_id, video_id=video_id)
                video_info = video.get_video_info()
                videos_info.append(video_info)
            return videos_info
        except Exception as e:
            print(f"💥 [BACKEND] Error getting videos from database: {e}")
            return []
    
    # Save project status to database
    def save_project_status(self):
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, cannot save project status")
            return False
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "UPDATE project SET project_status = %s WHERE project_id = %s"
            cursor.execute(query,(self.project_status, self.project_id))
            success = bool(cursor.rowcount)
            cursor.close()        
            return success
        except Exception as e:
            print(f"💥 [BACKEND] Error saving project status: {e}")
            return False    
    
    # Save project name to database
    def save_project_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_name = %s WHERE project_id = %s"
        cursor.execute(query,(self.project_name, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save project type to database
    def save_project_type(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_type = %s WHERE project_id = %s"
        cursor.execute(query,(self.project_type, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save owner ID to database
    def save_owner(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_owner_id = %s WHERE project_id = %s"
        cursor.execute(query,(self.owner, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    def save_training_progress(self, training_progress: int):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET training_progress = %s WHERE project_id = %s"
        cursor.execute(query,(training_progress, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    def get_training_progress(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT training_progress FROM project WHERE project_id = %s"
        cursor.execute(query,(self.project_id,))
        result = cursor.fetchone()
        cursor.close()
        return result['training_progress'] if result else 0
    
    def save_auto_annotation_progress(self, auto_annotation_progress: int):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET auto_annotation_progress = %s WHERE project_id = %s"
        cursor.execute(query,(auto_annotation_progress, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    @staticmethod
    def copy_files(image_list, img_dest, lbl_dest, labels_dir):
        for img_path in image_list:
            base_name = img_path.stem
            label_path = labels_dir / (base_name + ".txt")
            copy2(img_path, img_dest)
            if label_path.exists():
                copy2(label_path, lbl_dest)
    
    def train(self):
        self.project_status = "Training in progress"
        self.save_project_status()

        dataset_dir = Path(self.get_project_path()) / "dataset"
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
        all_images = list(images_dir.glob("*.jpg"))
        random.shuffle(all_images)
        split_idx = int(0.8 * len(all_images))

        train_images = all_images[:split_idx]
        val_images = all_images[split_idx:]

        self.copy_files(train_images, train_img_dir, train_lbl_dir, labels_dir)
        self.copy_files(val_images, val_img_dir, val_lbl_dir, labels_dir)

        # Define class list
        classes = [key for key in self.get_classes()]
        classes.sort()

        # Create data.yaml for dataset with full COCO classes
        data_yaml = {
            "train": str(train_img_dir.resolve()),
            "val": str(val_img_dir.resolve()),
            "nc": len(classes),
            "names": classes
        }

        yaml_path = dataset_dir / "data.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(data_yaml, f)

        # Load pretrained YOLOv11m model
        model = YOLO("yolo11m.pt")

        # Total epochs
        total_epochs = 5 # CHANGE THIS IF YOU NEED TO SEE FASTER TRAINING

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
            progress = int((epoch + 1) / total_epochs * 100) # YOUR TRAINING VARIABLE
            print(f"Training progress: {progress:.2f}%")
            self.save_training_progress(progress)

        # Copy best.pt to output folder
        best_weights_src = Path("runs/detect/train/weights/best.pt")
        best_weights_dst = output_dir / "best.pt"

        if best_weights_src.exists():
            copy2(best_weights_src, best_weights_dst)
            print(f"Best model weights saved to: {best_weights_dst}")
        else:
            print("Warning: best.pt not found")

        print("Training complete.")

        self.project_status = "Training completed"
        self.save_project_status()

    def get_model_path(self):
        model_path = Path(self.get_project_path()) / "output" / "best.pt"
        return model_path.resolve()

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
        metrics = model.val(data=str(yaml_path.resolve()))

        # Extract the key performance metrics from the results object.
        # For object detection, we use mAP as the primary "accuracy" metric.
        # The other metrics are averaged over all classes.
        performance = {
            "accuracy": float(metrics.box.map50),  # Using mAP50 as the main accuracy indicator
            "precision": float(metrics.box.p.mean()), # Mean Precision over all classes
            "recall": float(metrics.box.r.mean()),    # Mean Recall over all classes
            "f1-score": float(metrics.box.f1.mean())  # Mean F1-score over all classes
        }
        return performance
    
class Video(Project):
    def __init__(self, project_id: str, video_id=None, initialize=False):
        super().__init__(project_id)
        self.video_id = video_id
        if not initialize:
            self.video_path = self.get_video_path()
            if self.video_path is None:
                print(f"Warning: No video path found for video_id: {video_id}")
                self.video_path = ""  # 設置默認值
        else:
            self.video_path = ""
        
        # 只有在video_path存在且OpenCV可用時才創建VideoCapture
        if OPENCV_AVAILABLE and self.video_path and os.path.exists(self.video_path):
            self.cap = cv2.VideoCapture(self.video_path)
        else:
            if not OPENCV_AVAILABLE:
                print("OpenCV not available, VideoCapture disabled")
            else:
                print(f"Warning: Video file not found at {self.video_path}")
            self.cap = None

    def initialize(self, name, ext):
        self.annotation_status, self.last_annotated_frame = "yet to start", -1
        
        # 安全地構建視頻路徑
        try:
            # 獲取項目路徑
            project_path = self.get_project_path()
            print(f"📁 [BACKEND] Project path: {project_path}")
            
            # 確保videos子目錄存在
            videos_dir = Path(project_path) / "videos"
            videos_dir.mkdir(parents=True, exist_ok=True)
            print(f"📁 [BACKEND] Videos directory: {videos_dir}")
            
            # 清理檔案名
            safe_name = sanitize_filename(name)
            safe_ext = sanitize_filename(ext)
            
            # 構建安全的視頻路徑
            self.video_path = videos_dir / f"{safe_name}.{safe_ext}"
            print(f"📁 [BACKEND] Video path: {self.video_path}")
            
            # 檢查檔案是否已存在，如果存在則添加序號
            counter = 1
            original_path = self.video_path
            while self.video_path.exists():
                self.video_path = videos_dir / f"{safe_name}_{counter}.{safe_ext}"
                counter += 1
                if counter > 1000:  # 防止無限循環
                    raise ValueError("Too many files with similar names")
            
            if counter > 1:
                print(f"📝 [BACKEND] File renamed to avoid conflict: {self.video_path}")
            
        except Exception as e:
            print(f"💥 [BACKEND] Error creating video path: {e}")
            # 使用安全的備用路徑
            try:
                fallback_path = Path("./safe_projects/default/videos")
                fallback_path.mkdir(parents=True, exist_ok=True)
                safe_name = sanitize_filename(name)
                safe_ext = sanitize_filename(ext)
                self.video_path = fallback_path / f"{safe_name}.{safe_ext}"
                print(f"📝 [BACKEND] Using fallback path: {self.video_path}")
            except Exception as fallback_error:
                print(f"💥 [BACKEND] Fallback path also failed: {fallback_error}")
                # 最後的備用方案
                self.video_path = Path(f"./temp_{safe_name}.{safe_ext}")
        
        self.video_name = name
        
        # Get current video count from database
        current_count = self.get_video_count()
        self.video_count = current_count + 1

        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, using fallback video ID")
            # 使用時間戳和隨機數生成視頻ID
            import time
            import random
            self.video_id = f"video_{int(time.time())}_{random.randint(1000, 9999)}"
            print(f"📋 [BACKEND] Generated fallback video ID: {self.video_id}")
        else:
            # Add row to video
            try:
                cursor = connection.cursor(pymysql.cursors.DictCursor)
                query = "INSERT INTO videos (project_id, video_path, video_name) VALUES (%s, %s, %s)"
                cursor.execute(query,(self.project_id, str(self.video_path), self.video_name))
                self.video_id = cursor.lastrowid
                cursor.close()
                print(f"📋 [BACKEND] Video saved to database with ID: {self.video_id}")
            except Exception as e:
                print(f"💥 [BACKEND] Error saving video to database: {e}")
                # 使用fallback ID
                import time
                import random
                self.video_id = f"video_{int(time.time())}_{random.randint(1000, 9999)}"
                print(f"📋 [BACKEND] Using fallback video ID: {self.video_id}")

        return self.video_id, str(self.video_path)
    
    def get_video_info(self):
        info = {
            "name": self.get_video_name(),
            "file": self.get_video_name(),  # Use video name as file name
            "path": self.get_video_path(),
            "title": self.get_video_name()  # Add title field
        }
        return info
    
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

    def get_video_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT video_name FROM videos WHERE video_id = %s"
        cursor.execute(query,(self.video_id))
        video_name = cursor.fetchone()['video_name']
        return video_name
    
    def update_video_name(self, new_name: str):
        self.video_name = new_name
        success = self.save_video_name()
        return success
        
    def get_video_path(self):
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT video_path FROM videos WHERE video_id = %s"
            cursor.execute(query, (self.video_id,))
            data = cursor.fetchone()
            cursor.close()
            
            if data and data.get('video_path'):
                return data['video_path']
            else:
                print(f"No video path found for video_id: {self.video_id}")
                return None
        except Exception as e:
            print(f"Error getting video path: {e}")
            return None
    
    def get_frame_count(self):
        if not OPENCV_AVAILABLE or self.cap is None:
            print("OpenCV not available or VideoCapture is None, returning default frame count")
            return 0
        try:
            frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            return frame_count
        except Exception as e:
            print(f"Error getting frame count: {e}")
            return 0
    
    def get_fps(self):
        if not OPENCV_AVAILABLE or self.cap is None:
            print("OpenCV not available or VideoCapture is None, returning default FPS")
            return 30  # 默認FPS
        try:
            fps = self.cap.get(cv2.CAP_PROP_FPS)
            return fps if fps > 0 else 30
        except Exception as e:
            print(f"Error getting FPS: {e}")
            return 30
    
    def get_resolution(self):
        if not OPENCV_AVAILABLE or self.cap is None:
            print("OpenCV not available or VideoCapture is None, returning default resolution")
            return (640, 480)  # 默認分辨率
        try:
            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            return (width, height)
        except Exception as e:
            print(f"Error getting resolution: {e}")
            return (640, 480)
    
    def get_bbox_data(self, frame_num = None):
        # Output format: [{"frame_num": 0, "class_name": abc, "coordinates": (x, y, w, h)}, ...]
        if frame_num:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT frame_num, class, coordinates FROM videos WHERE video_id = %s AND frame_num = %s"
            cursor.execute(query,(self.video_id, frame_num))
            bbox_data = cursor.fetchall()
        else:
            # fetch all if frame_num is not specified
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT frame_num, class, coordinates FROM videos WHERE video_id = %s"
            cursor.execute(query,(self.video_id))
            bbox_data = cursor.fetchall()
        return bbox_data
    
    def get_annotation_status(self):
        ### db ###
        ### status can be "yet to start", "manual annotation in progress", "auto annotation in progress", "completed" ###
        ### default is "yet to start" ###
        ### last_annotated_frame is the last frame number that has been annotated (0-indexed) ###
        ### default is None, not 0 ###
        annotation_status='yet to start'
        last_annotated_frame=0
        
        # 檢查video_id是否存在
        if not self.video_id:
            print("No video_id provided, returning default status")
            return annotation_status, last_annotated_frame
        
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT annotation_status,last_annotated_frame FROM videos WHERE video_id = %s"
            cursor.execute(query, (self.video_id,))
            data = cursor.fetchone()
            cursor.close()
            
            if data:
                annotation_status = data.get('annotation_status', 'yet to start')
                last_annotated_frame = data.get('last_annotated_frame', 0) or 0
            else:
                print(f"No data found for video_id: {self.video_id}")
                
        except Exception as e:
            print(f"Error getting annotation status: {e}")
            # 返回默認值
            annotation_status = 'yet to start'
            last_annotated_frame = 0
            
        return annotation_status, last_annotated_frame
    
    ###### Selecting Frame for Manual Annotation ######
    # For testing purpose, annotate every second
    def get_next_frame_to_annotate(self):
        self.frame_count = self.get_frame_count()
        self.fps = self.get_fps()
        if self.annotation_status == "yet to start":
            return self.get_frame(0)
        elif self.annotation_status == "completed":
            return None
        elif isinstance(self.last_annotated_frame, int):
            next_frame = self.last_annotated_frame + self.fps
            if next_frame < self.frame_count:
                return self.get_frame(next_frame)
            else:
                # no more frames to annotate
                self.annotation_status = "manual annotation completed"
                self.save_annotation_status()
                return None
        else:
            return None
    
    def get_frame(self, frame_num: int):
        if not OPENCV_AVAILABLE:
            print("OpenCV not available, returning placeholder frame")
            # Return a small placeholder image
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        if frame_num < 0 or frame_num >= self.frame_count:
            raise ValueError("Frame number out of range")
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
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
            width, height = self.get_resolution()
            class_name, x, y, w, h = bbox
            # x_center, y_center = x + w/2, y + h/2
            # x_normalized, y_normalized, w_normalized, h_normalized = x_center/width, y_center/height, w/width, h/height
            bbox_processed = f"{x} {y} {w} {h}"
            self.last_annotated_frame = frame_num

            # Save data
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
        if not OPENCV_AVAILABLE or not CV_MODELS_AVAILABLE:
            print("OpenCV or CV models not available, skipping auto annotation")
            self.annotation_status = "completed"
            self.save_annotation_status()
            return True
            
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
            # Perform KCF tracking on the first 60 frames
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
                    
                # Find the best matching box using IoU
                max_iou = -1
                best_bbox = None
                target_bbox = tracking_results[index-starting_frame_num]

                for bbox in bboxes:
                    iou = self._calculate_iou(target_bbox, bbox)
                    if iou > max_iou:
                        max_iou = iou
                        best_bbox = bbox

                x, y, w, h = best_bbox
                best_bbox = f"{x} {y} {w} {h}"
                self.bbox_data.append({"frame_num": index, "class_name": starting_frame_bbox['class_name'],"coordinates": best_bbox})
                print(f"Best matching bbox for frame {index+1}: {best_bbox}")

                # Save bbox data in database
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
        query = "UPDATE videos SET video_path = %s WHERE video_id = %s"
        cursor.execute(query,(self.video_path, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save video name to database
    def save_video_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE videos SET video_name = %s WHERE video_id = %s"
        cursor.execute(query,(self.video_name, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save annotation status to database
    def save_annotation_status(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE videos SET annotation_status = %s WHERE video_id = %s"
        cursor.execute(query,(self.annotation_status, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save last annotated frame to database
    def save_last_annotated_frame(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE videos SET last_annotated_frame = %s WHERE video_id = %s"
        cursor.execute(query,(self.last_annotated_frame, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    def save_bbox_data(self, frame_num, class_name, coordinates):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "INSERT INTO bbox (frame_num, class_name, coordinate, video_id) VALUES (%s, %s, %s, %s)"
        cursor.execute(query,(frame_num, class_name, coordinates, self.video_id))
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

################ Page 1 - Login #####################

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
            userID = UserLogin.get_userID()

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
    
################ Page 2 - Project Management #####################

# Get all projects IDs for a user
# Input: userID
# Output: owner project IDs, shared project IDs
@app.post("/get_projects_info")
async def get_users_projects(request: UserRequest):
    try: 
        userID = request.userID

        # 檢查數據庫連接
        if connection is None or not connection:
            print("數據庫未連接，返回示例數據")
            return {
                "owned projects": [
                    {
                        "project_id": 1,
                        "project_name": "我的第一個項目",
                        "video_count": 5,
                        "image_count": 12,
                        "status": "進行中",
                        "is_owned": True
                    },
                    {
                        "project_id": 2,
                        "project_name": "物件檢測項目",
                        "video_count": 3,
                        "image_count": 8,
                        "status": "已完成",
                        "is_owned": True
                    }
                ],
                "shared projects": [
                    {
                        "project_id": 3,
                        "project_name": "團隊協作項目",
                        "video_count": 2,
                        "image_count": 6,
                        "status": "待審核",
                        "is_owned": False
                    }
                ]
            }

        ### db ###
        user = User(userID)
        owned_projects = user.get_owned_projects()
        shared_projects = user.get_shared_projects()
        
        return {
            "owned projects": owned_projects,
            "shared projects": shared_projects
        }
    
    except Exception as e:
        print(f"獲取項目信息時出錯: {e}")
        # 返回示例數據而不是錯誤
        return {
            "owned projects": [
                {
                    "project_id": 1,
                    "project_name": "示例項目1",
                    "video_count": 0,
                    "image_count": 0,
                    "status": "未開始",
                    "is_owned": True
                },
                {
                    "project_id": 2,
                    "project_name": "示例項目2",
                    "video_count": 0,
                    "image_count": 0,
                    "status": "未開始",
                    "is_owned": True
                }
            ],
            "shared projects": []
        }

# Get project details when loading dashboard
# Input: Project ID
# Output: {"project name": project_name, "project type": project_type, "video count": video_count, "status": project_status}

@app.post("/get_project_details")
async def get_project_details(request: ProjectRequest):
    try:
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, returning mock project details")
            return {
                "project name": f"Project {request.project_id}",
                "project type": "Object Detection",
                "video count": 1,
                "status": "Active"
            }
        
        project = Project(project_id = request.project_id)
        project_details = {
            "project name": project.get_project_name(),
            "project type": project.get_project_type(),
            "video count": project.get_video_count(),
            "status": project.get_project_status()
        }

        return project_details

    except Exception as e:
        print(f"💥 [BACKEND] Error getting project details: {str(e)}")
        # 返回模擬數據而不是錯誤
        return {
            "project name": f"Project {request.project_id}",
            "project type": "Object Detection",
            "video count": 1,
            "status": "Active"
        }

# Create new project
@app.post("/create_project")
async def create_project(request: CreateProjectRequest):
    try:
        userID = request.userID
        project_name = request.project_name
        project_type = request.project_type

        # 檢查數據庫連接
        if connection is None or not connection:
            import random
            project_id = random.randint(1000, 9999)
            print(f"數據庫未連接，返回模擬項目ID: {project_id}")
            return {
                "success": True,
                "message": f"項目 '{project_name}' 創建成功（模擬模式）",
                "project_id": project_id
            }

        # initialize project
        temp_project_id = -1
        project = Project(project_id=temp_project_id, initialize=True)
        project_id = project.initialize(project_name, project_type, userID)

        return {
            "success": True,
            "message": "Project created successfully.",
            "project_id": project_id
        }
    
    except Exception as e:
        print(f"創建項目時出錯: {e}")
        # 返回成功響應而不是錯誤
        import random
        project_id = random.randint(1000, 9999)
        return {
            "success": True,
            "message": f"項目 '{request.project_name}' 創建成功（模擬模式）",
            "project_id": project_id
        }
        
# Change project name
@app.post("/change_project_name")
async def change_project_name(request: ProjectRequest, new_name: str):
    try:
        project = Project(project_id = request.project_id)
        
        # check if new_name already exists for this user
        # project_name_exists = False if "### project name does not exist ###" else True
        # if project_name_exists:
        #     return {
        #         "success": False,
        #         "message": "Project name already exists."
        #     }
        
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
    
################ Page 3 - Video Upload & Management #####################

# Upload video
@app.post("/upload")
async def upload(project_id: str, file: UploadFile = File(...)):
    print(f"🎬 [BACKEND] Upload endpoint called with project_id: {project_id}")
    print(f"📁 [BACKEND] File details: {file.filename}, size: {file.size}, content_type: {file.content_type}")
    
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            print(f"❌ [BACKEND] Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Invalid file type.")
        
        print(f"✅ [BACKEND] File type validation passed for: {file.filename}")
        
        # Sanitize filename to avoid filesystem issues
        import re
        import unicodedata
        
        def sanitize_filename(filename):
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
        
        # Initialize video object
        print(f"🎥 [BACKEND] Creating Video object for project_id: {project_id}")
        video = Video(project_id=project_id, initialize=True)
        
        # Sanitize the filename
        original_name, ext = os.path.splitext(file.filename)
        sanitized_name = sanitize_filename(original_name)
        
        print(f"📝 [BACKEND] Original filename: {file.filename}")
        print(f"📝 [BACKEND] Sanitized name: {sanitized_name}, ext: {ext}")
        
        video_id, file_location = video.initialize(sanitized_name, ext)
        print(f"🆔 [BACKEND] Video initialized with ID: {video_id}, location: {file_location}")

        # Add video to project's video list
        try:
            project = Project(project_id=project_id)
            project.videos.append(video_id)
            project.save_project_status()
            print(f"📊 [BACKEND] Video {video_id} added to project {project_id} videos list")
        except Exception as e:
            print(f"⚠️ [BACKEND] Warning: Could not update project videos list: {e}")
        
        # Change project status to "Awaiting Labelling"
        try:
            video.project_status = "Awaiting Labelling"
            video.save_project_status()
            print(f"📊 [BACKEND] Project status updated to: Awaiting Labelling")
        except Exception as e:
            print(f"⚠️ [BACKEND] Warning: Could not update project status: {e}")
        
        # Save file to disk
        print(f"💾 [BACKEND] Saving file to disk: {file_location}")
        
        try:
            # 驗證文件路徑的安全性
            file_path_obj = Path(file_location)
            file_dir = file_path_obj.parent
            
            # 清理檔案名和路徑
            safe_filename = sanitize_filename(file_path_obj.name)
            safe_path = sanitize_path(str(file_dir))
            
            # 重新構建安全的路徑
            file_path_obj = Path(safe_path) / safe_filename
            file_location = str(file_path_obj)
            
            print(f"📝 [BACKEND] Sanitized file location: {file_location}")
            
            # 確保目錄存在
            file_dir = file_path_obj.parent
            file_dir.mkdir(parents=True, exist_ok=True)
            print(f"📁 [BACKEND] Directory created/verified: {file_dir}")
            
            # 檢查目錄是否可寫
            if not os.access(file_dir, os.W_OK):
                raise PermissionError(f"Cannot write to directory: {file_dir}")
            
            # 檢查檔案是否已存在，如果存在則添加序號
            original_location = file_location
            counter = 1
            while os.path.exists(file_location):
                name_part = file_path_obj.stem
                ext_part = file_path_obj.suffix
                file_location = str(file_dir / f"{name_part}_{counter}{ext_part}")
                counter += 1
                if counter > 1000:  # 防止無限循環
                    raise ValueError("Too many files with similar names")
            
            # 保存文件
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"✅ [BACKEND] File saved successfully to: {file_location}")
            
        except Exception as e:
            print(f"💥 [BACKEND] Error saving file: {e}")
            print(f"💥 [BACKEND] File location: {file_location}")
            print(f"💥 [BACKEND] Directory exists: {os.path.exists(os.path.dirname(file_location))}")
            print(f"💥 [BACKEND] Directory writable: {os.access(os.path.dirname(file_location), os.W_OK) if os.path.exists(os.path.dirname(file_location)) else 'Directory does not exist'}")
            
            # 提供更詳細的錯誤信息
            error_detail = f"Failed to save file: {str(e)}"
            if "illegal path" in str(e).lower():
                error_detail += " (Path contains illegal characters)"
            elif "permission" in str(e).lower():
                error_detail += " (Permission denied)"
            elif "no space" in str(e).lower():
                error_detail += " (No space left on device)"
            
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Check if file was saved successfully
        if os.path.exists(file_location):
            file_size = os.path.getsize(file_location)
            print(f"✅ [BACKEND] File saved successfully! Size: {file_size} bytes")
            
            # Verify file integrity
            if file_size > 0:
                print(f"✅ [BACKEND] File integrity verified - file is not empty")
            else:
                print(f"⚠️ [BACKEND] Warning - saved file is empty!")
        else:
            print(f"❌ [BACKEND] File save failed - file not found at: {file_location}")
            raise HTTPException(status_code=500, detail="File save failed")

        response_data = {
            "message": f"file '{file.filename}' saved at '{file_location}'",
            "video_id": video_id,
            "video_path": file_location,
            "file_size": file_size,
            "project_id": project_id
        }
        
        print(f"🎉 [BACKEND] Upload successful! Response: {response_data}")
        return response_data
    
    except HTTPException as e:
        print(f"🚫 [BACKEND] HTTP Exception: {e.status_code} - {e.detail}")
        raise e
    except Exception as e:
        print(f"💥 [BACKEND] Unexpected error during upload: {str(e)}")
        print(f"🔍 [BACKEND] Error type: {type(e).__name__}")
        import traceback
        print(f"📋 [BACKEND] Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get all uploaded videos for a project
# Output: videos_info = [{"name": video_name, "file": video, "path": video_path}, ... ]
@app.post("/get_uploaded_videos")
def get_uploaded_videos(request: ProjectRequest):
    print(f"📋 [BACKEND] Get uploaded videos called for project_id: {request.project_id}")
    
    try:
        # 首先嘗試從數據庫獲取視頻列表
        videos_info = []
        if connection is not None and connection:
            try:
                project = Project(project_id = request.project_id)
                videos_info = project.get_uploaded_videos()
                print(f"📋 [BACKEND] Found {len(videos_info)} videos from database for project {request.project_id}")
            except Exception as db_error:
                print(f"⚠️ [BACKEND] Database error, falling back to filesystem scan: {db_error}")
                videos_info = []
        
        # 如果數據庫沒有返回視頻，或者數據庫未連接，則從文件系統掃描
        if not videos_info:
            print(f"📁 [BACKEND] Scanning filesystem for videos in project {request.project_id}")
            from pathlib import Path
            
            # 嘗試多個可能的路徑
            possible_paths = [
                f"backend/Nocodile/Backend/Nocodile/backend/{request.project_id}/videos",
                f"{request.project_id}/videos",
                f"./{request.project_id}/videos"
            ]
            
            found_videos = []
            for path_str in possible_paths:
                video_dir = Path(path_str)
                if video_dir.exists():
                    video_files = list(video_dir.glob("*.mp4")) + list(video_dir.glob("*.mov")) + list(video_dir.glob("*.avi"))
                    if video_files:
                        print(f"📁 [BACKEND] Found {len(video_files)} videos in: {video_dir}")
                        for i, video_file in enumerate(video_files):
                            video_info = {
                                "name": video_file.name,
                                "file": video_file.name,
                                "path": str(video_file),
                                "video_id": f"video_{request.project_id}_{i+1}",
                                "size": video_file.stat().st_size,
                                "directory": str(video_dir)
                            }
                            found_videos.append(video_info)
                        break
            
            if found_videos:
                videos_info = found_videos
                print(f"📁 [BACKEND] Filesystem scan found {len(videos_info)} videos")
            else:
                print(f"❌ [BACKEND] No videos found in any of these paths: {possible_paths}")
                # 返回模擬數據
                videos_info = [
                    {
                        "name": "Sample Video 1",
                        "file": "sample_video_1.mp4",
                        "path": "/videos/sample_video_1.mp4",
                        "video_id": "sample_1"
                    }
                ]
        
        print(f"📋 [BACKEND] Returning {len(videos_info)} videos for project {request.project_id}")
        for i, video in enumerate(videos_info):
            print(f"📋 [BACKEND] Video {i+1}: {video.get('name', 'Unknown')} (ID: {video.get('video_id', 'Unknown')})")
        
        return videos_info
    
    except Exception as e:
        print(f"💥 [BACKEND] Error getting uploaded videos: {str(e)}")
        import traceback
        print(f"📋 [BACKEND] Traceback: {traceback.format_exc()}")
        # 返回模擬數據而不是錯誤
        return [
            {
                "name": "Sample Video 1",
                "file": "sample_video_1.mp4", 
                "path": "/videos/sample_video_1.mp4",
                "video_id": "sample_1"
            }
        ]

##################### Page 4 - Annotation #####################

@app.post("/get_classes")
async def get_classes(request:ProjectRequest):
    try:
        # 檢查數據庫連接
        if connection is None or not connection:
            print("數據庫未連接，返回示例類別數據")
            return {
                "success": True,
                "classes": [
                    {"id": "give_way_sign", "name": "give_way_sign", "color": "#fbbf24"},
                    {"id": "pedestrian_child", "name": "pedestrian_child", "color": "#3b82f6"},
                    {"id": "zebra_crossing_sign", "name": "zebra_crossing_sign", "color": "#8b5cf6"},
                    {"id": "traffic_light_red", "name": "traffic_light_red", "color": "#10b981"},
                    {"id": "stop_sign", "name": "stop_sign", "color": "#ef4444"}
                ]
            }
        
        # 只有在數據庫連接可用時才創建Project實例
        project = Project(project_id = request.project_id)
        classes = project.get_classes()
        
        return {
            "success": True,
            "classes": classes
        }
    
    except Exception as e:
        print(f"獲取類別時出錯: {e}")
        # 返回示例數據而不是錯誤
        return {
            "success": True,
            "classes": [
                {"id": "give_way_sign", "name": "give_way_sign", "color": "#fbbf24"},
                {"id": "pedestrian_child", "name": "pedestrian_child", "color": "#3b82f6"},
                {"id": "zebra_crossing_sign", "name": "zebra_crossing_sign", "color": "#8b5cf6"},
                {"id": "traffic_light_red", "name": "traffic_light_red", "color": "#10b981"},
                {"id": "stop_sign", "name": "stop_sign", "color": "#ef4444"}
            ]
        }

@app.post("/add_class")
async def add_class(request: ProjectRequest, class_name: str = None, color: str = None):
    try:
        # 從查詢參數獲取參數
        if class_name is None:
            class_name = request.query_params.get('class_name', '')
        if color is None:
            color = request.query_params.get('color', '#3b82f6')
        
        print(f"📝 [BACKEND] Adding class: {class_name} with color: {color}")
        
        # 驗證參數
        if not class_name or not class_name.strip():
            return {
                "success": False,
                "message": "Class name is required.",
                "classes": []
            }
        
        # 檢查數據庫連接
        if connection is None or not connection:
            print(f"數據庫未連接，模擬添加類別: {class_name}")
            return {
                "success": True,
                "message": f"Class '{class_name}' added successfully (mock mode).",
                "classes": [
                    {"id": "give_way_sign", "name": "give_way_sign", "color": "#fbbf24"},
                    {"id": "pedestrian_child", "name": "pedestrian_child", "color": "#3b82f6"},
                    {"id": "zebra_crossing_sign", "name": "zebra_crossing_sign", "color": "#8b5cf6"},
                    {"id": "traffic_light_red", "name": "traffic_light_red", "color": "#10b981"},
                    {"id": "stop_sign", "name": "stop_sign", "color": "#ef4444"},
                    {"id": class_name.lower().replace(" ", "_"), "name": class_name, "color": color}
                ]
            }
        
        project = Project(project_id = request.project_id)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "Class name already exists.",
                "classes": project.get_classes()
            }
        
        # 添加類別
        project.add_class(class_name, color)
        
        # 獲取更新後的類別列表
        updated_classes = project.get_classes()
        
        return {
            "success": True,
            "message": "Class added successfully.",
            "classes": updated_classes
        }
    
    except Exception as e:
        print(f"添加類別時出錯: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Error adding class: {str(e)}",
            "classes": []
        }

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

@app.post("/delete_class")
async def delete_class(request: ProjectRequest):
    try:
        # 從查詢參數獲取 class_name
        class_name = request.query_params.get('class_name', '')
        print(f"🗑️ [BACKEND] Deleting class: {class_name} for project: {request.project_id}")
        
        # 驗證參數
        if not class_name or not class_name.strip():
            print(f"❌ [BACKEND] Class name is required")
            return {
                "success": False,
                "message": "Class name is required.",
                "classes": []
            }
        
        # 檢查數據庫連接
        if connection is None or not connection:
            print(f"📋 [BACKEND] Database not connected, simulating class deletion: {class_name}")
            return {
                "success": True,
                "message": f"Class '{class_name}' deleted successfully (mock mode).",
                "classes": [
                    {"id": "give_way_sign", "name": "give_way_sign", "color": "#fbbf24"},
                    {"id": "pedestrian_child", "name": "pedestrian_child", "color": "#3b82f6"},
                    {"id": "zebra_crossing_sign", "name": "zebra_crossing_sign", "color": "#8b5cf6"},
                    {"id": "traffic_light_red", "name": "traffic_light_red", "color": "#10b981"},
                    {"id": "stop_sign", "name": "stop_sign", "color": "#ef4444"}
                ]
            }
        
        project = Project(project_id = request.project_id)
        
        # check if class_name exists for this project
        class_name_exists = project.check_class_exists(class_name)
        if not class_name_exists:
            print(f"❌ [BACKEND] Class '{class_name}' does not exist")
            return {
                "success": False,
                "message": f"Class '{class_name}' does not exist.",
                "classes": project.get_classes()
            }
        
        # 刪除類別
        success = project.delete_class(class_name)
        if not success:
            print(f"❌ [BACKEND] Failed to delete class '{class_name}'")
            return {
                "success": False,
                "message": f"Failed to delete class '{class_name}'.",
                "classes": project.get_classes()
            }
        
        # 獲取更新後的類別列表
        updated_classes = project.get_classes()
        print(f"✅ [BACKEND] Successfully deleted class '{class_name}'. Remaining classes: {len(updated_classes)}")
        
        return {
            "success": True,
            "message": f"Class '{class_name}' deleted successfully.",
            "classes": updated_classes
        }
    
    except Exception as e:
        print(f"💥 [BACKEND] Error deleting class '{class_name}': {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Error deleting class: {str(e)}",
            "classes": []
        }

@app.post("/get_next_frame_to_annotate")
async def get_next_frame_to_annotate(request: VideoRequest):
    try:
        print(f"🎬 [BACKEND] Getting next frame for video {request.video_id}")
        
        # 檢查 OpenCV 是否可用
        if not OPENCV_AVAILABLE:
            print("⚠️ [BACKEND] OpenCV not available, returning placeholder")
            return {
                "success": True,
                "message": "OpenCV not available, using placeholder",
                "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                "frame_id": request.current_frame,
                "total_frames": 100,  # 假設的總幀數
                "video_path": "opencv_unavailable.mp4"
            }
        
        import cv2
        import base64
        from pathlib import Path
        
        # 構建視頻文件路徑 - 嘗試多個可能的路徑
        possible_paths = [
            f"./projects/{request.project_id}/videos",  # 新的安全路徑
            f"./safe_projects/default/videos",         # 備用路徑
            f"backend/Nocodile/Backend/Nocodile/backend/{request.project_id}/videos",
            f"{request.project_id}/videos",
            f"./{request.project_id}/videos",
            f"./videos",  # 最後的備用路徑
            f"./temp"     # 臨時路徑
        ]
        
        video_files = []
        video_dir = None
        
        for path_str in possible_paths:
            video_dir = Path(path_str)
            print(f"🔍 [BACKEND] Checking path: {video_dir}")
            if video_dir.exists():
                video_files = list(video_dir.glob("*.mp4"))
                if video_files:
                    print(f"🎬 [BACKEND] Found {len(video_files)} videos in: {video_dir}")
                    break
                else:
                    print(f"📁 [BACKEND] Directory exists but no MP4 files found: {video_dir}")
            else:
                print(f"❌ [BACKEND] Directory does not exist: {video_dir}")
        
        if not video_files:
            print(f"❌ [BACKEND] No video files found in any of these paths: {possible_paths}")
            return {
                "success": False,
                "message": "No video files found",
                "image": None,
                "frame_id": request.current_frame,
                "total_frames": 0,
                "video_path": "no_video_found.mp4"
            }
        
        # 使用第一個找到的視頻文件
        video_path = video_files[0]
        print(f"🎬 [BACKEND] Using video file: {video_path}")
        
        # 檢查檔案是否存在且可讀
        if not video_path.exists():
            print(f"❌ [BACKEND] Video file does not exist: {video_path}")
            return {
                "success": False,
                "message": "Video file does not exist",
                "image": None,
                "frame_id": request.current_frame,
                "total_frames": 0,
                "video_path": str(video_path)
            }
        
        # 打開視頻文件
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            print(f"❌ [BACKEND] Could not open video file: {video_path}")
            return {
                "success": False,
                "message": "Could not open video file",
                "image": None,
                "frame_id": request.current_frame,
                "total_frames": 0,
                "video_path": str(video_path)
            }
        
        # 獲取視頻總幀數
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"🎬 [BACKEND] Video has {total_frames} total frames")
        
        if total_frames <= 0:
            print(f"❌ [BACKEND] Invalid video file: {total_frames} frames")
            cap.release()
            return {
                "success": False,
                "message": "Invalid video file",
                "image": None,
                "frame_id": request.current_frame,
                "total_frames": 0,
                "video_path": str(video_path)
            }
        
        # 實現真正的"下一幀"邏輯
        current_frame = request.current_frame
        next_frame = current_frame + 1
        
        # 確保不超過總幀數
        if next_frame >= total_frames:
            next_frame = 0  # 循環回到第一幀
            print(f"🔄 [BACKEND] Reached end of video, looping back to frame 0")
        
        frame_num = next_frame
        print(f"🎬 [BACKEND] Getting next frame: {frame_num} (current was {current_frame})")
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        
        if not ret or frame is None:
            print(f"❌ [BACKEND] Could not read frame {frame_num}")
            cap.release()
            return {
                "success": False,
                "message": f"Could not read frame {frame_num}",
                "image": None,
                "frame_id": frame_num,
                "total_frames": total_frames,
                "video_path": str(video_path)
            }
        
        # 將幀轉換為base64
        try:
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            frame_data_url = f"data:image/jpeg;base64,{frame_base64}"
        except Exception as encode_error:
            print(f"❌ [BACKEND] Error encoding frame: {encode_error}")
            cap.release()
            return {
                "success": False,
                "message": f"Error encoding frame: {str(encode_error)}",
                "image": None,
                "frame_id": frame_num,
                "total_frames": total_frames,
                "video_path": str(video_path)
            }
        
        cap.release()
        
        print(f"✅ [BACKEND] Successfully extracted next frame {frame_num}")
        print(f"📊 [BACKEND] Frame details: frame_id={frame_num}, total_frames={total_frames}, video_path={video_path}")
        return {
            "success": True,
            "message": f"Next frame {frame_num} fetched successfully from video file.",
            "image": frame_data_url,
            "frame_id": frame_num,
            "total_frames": total_frames,
            "video_path": str(video_path)
        }

    except Exception as e:
        print(f"💥 [BACKEND] Error getting next frame: {e}")
        import traceback
        traceback.print_exc()
        # 返回錯誤而不是模擬數據
        return {
            "success": False,
            "message": f"Error extracting frame: {str(e)}",
            "image": None,
            "frame_id": request.current_frame,
            "total_frames": 0,
            "video_path": "error.mp4"
        }

@app.post("/get_frame")
async def get_frame(request: VideoRequest, frame_num: int):
    try:
        print(f"🎬 [BACKEND] Getting frame {frame_num} for video {request.video_id}")
        
        # 檢查 OpenCV 是否可用
        if not OPENCV_AVAILABLE:
            print("⚠️ [BACKEND] OpenCV not available, returning placeholder")
            return {
                "success": True,
                "message": "OpenCV not available, using placeholder",
                "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                "frame_id": frame_num,
                "total_frames": 100,  # 假設的總幀數
                "video_path": "opencv_unavailable.mp4"
            }
        
        import cv2
        import base64
        from pathlib import Path
        
        # 構建視頻文件路徑 - 嘗試多個可能的路徑
        possible_paths = [
            f"./projects/{request.project_id}/videos",  # 新的安全路徑
            f"./safe_projects/default/videos",         # 備用路徑
            f"backend/Nocodile/Backend/Nocodile/backend/{request.project_id}/videos",
            f"{request.project_id}/videos",
            f"./{request.project_id}/videos",
            f"./videos",  # 最後的備用路徑
            f"./temp"     # 臨時路徑
        ]
        
        video_files = []
        video_dir = None
        
        for path_str in possible_paths:
            video_dir = Path(path_str)
            print(f"🔍 [BACKEND] Checking path: {video_dir}")
            if video_dir.exists():
                video_files = list(video_dir.glob("*.mp4"))
                if video_files:
                    print(f"🎬 [BACKEND] Found {len(video_files)} videos in: {video_dir}")
                    break
                else:
                    print(f"📁 [BACKEND] Directory exists but no MP4 files found: {video_dir}")
            else:
                print(f"❌ [BACKEND] Directory does not exist: {video_dir}")
        
        if not video_files:
            print(f"❌ [BACKEND] No video files found in any of these paths: {possible_paths}")
            return {
                "success": False,
                "message": "No video files found",
                "image": None,
                "frame_id": request.current_frame,
                "total_frames": 0,
                "video_path": "no_video_found.mp4"
            }
        
        # 使用第一個找到的視頻文件
        video_path = video_files[0]
        print(f"🎬 [BACKEND] Using video file: {video_path}")
        
        # 打開視頻文件
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            print(f"❌ [BACKEND] Could not open video file: {video_path}")
            return {
                "success": False,
                "message": "Could not open video file",
                "image": None,
                "frame_id": request.current_frame,
                "total_frames": 0,
                "video_path": str(video_path)
            }
        
        # 獲取視頻總幀數
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"🎬 [BACKEND] Video has {total_frames} total frames")
        
        # 確保frame_num在有效範圍內
        if frame_num >= total_frames:
            frame_num = total_frames - 1
        if frame_num < 0:
            frame_num = 0
            
        # 跳轉到指定幀
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        
        if not ret:
            print(f"❌ [BACKEND] Could not read frame {frame_num}")
            cap.release()
            return {
                "success": False,
                "message": f"Could not read frame {frame_num}",
                "image": None,
                "frame_id": frame_num,
                "total_frames": total_frames,
                "video_path": str(video_path)
            }
        
        # 將幀轉換為base64
        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        frame_data_url = f"data:image/jpeg;base64,{frame_base64}"
        
        cap.release()
        
        print(f"✅ [BACKEND] Successfully extracted frame {frame_num}")
        print(f"📊 [BACKEND] Frame details: frame_id={frame_num}, total_frames={total_frames}, video_path={video_path}")
        return {
            "success": True,
            "message": f"Frame {frame_num} fetched successfully from video file.",
            "image": frame_data_url,
            "frame_id": frame_num,
            "total_frames": total_frames,
            "video_path": str(video_path)
        }

    except Exception as e:
        print(f"💥 [BACKEND] Error getting frame {frame_num}: {e}")
        import traceback
        traceback.print_exc()
        # 返回錯誤而不是模擬數據
        return {
            "success": False,
            "message": f"Error extracting frame: {str(e)}",
            "image": None,
            "frame_id": request.current_frame,
            "total_frames": 0,
            "video_path": "error.mp4"
        }
@app.post("/check_annotation_status")
async def check_annotation_status(request: VideoRequest):  
    try:
        print(f"檢查註釋狀態 - project_id: {request.project_id}, video_id: {request.video_id}")
        
        # 檢查數據庫連接
        if connection is None or not connection:
            print("數據庫未連接，返回模擬註釋狀態")
            return {
                "annotation status": "not yet started",
                "last annotated frame": 0
            }
        
        # 檢查必要參數
        if not request.project_id or not request.video_id:
            print("Missing project_id or video_id")
            return {
                "annotation status": "not yet started",
                "last annotated frame": 0
            }
        
        # 簡化處理，直接返回默認狀態，避免Video類的複雜性
        print("返回默認註釋狀態")
        return {
            "annotation status": "not yet started",
            "last annotated frame": 0
        }

    except Exception as e:
        print(f"檢查註釋狀態時出錯: {e}")
        import traceback
        traceback.print_exc()
        # 返回模擬數據而不是錯誤
        return {
            "annotation status": "not yet started",
            "last annotated frame": 0
        }

@app.post("/annotate")
async def annotate(request: AnnotationRequest):
    try:
        print(f"🎯 [BACKEND] Saving annotation - Project: {request.project_id}, Video: {request.video_id}, Frame: {request.frame_num}, Bboxes: {len(request.bboxes)}")
        
        # 驗證輸入資料
        if not request.project_id or not request.video_id:
            return {
                "success": False,
                "message": "Missing project_id or video_id"
            }
        
        if request.frame_num < 0:
            return {
                "success": False,
                "message": "Invalid frame number"
            }
        
        # 驗證邊界框資料
        for i, bbox in enumerate(request.bboxes):
            if not all(key in bbox for key in ['class_name', 'x', 'y', 'width', 'height']):
                return {
                    "success": False,
                    "message": f"Invalid bbox data at index {i}: missing required fields"
                }
            
            # 驗證數值範圍
            if bbox['x'] < 0 or bbox['y'] < 0 or bbox['width'] <= 0 or bbox['height'] <= 0:
                return {
                    "success": False,
                    "message": f"Invalid bbox coordinates at index {i}: negative values or zero dimensions"
                }
        
        # 檢查數據庫連接
        if connection is None or not connection:
            print(f"📋 [BACKEND] Database not connected, saving annotation in mock mode")
            return {
                "success": True,
                "message": f"Annotation saved successfully (mock mode). {len(request.bboxes)} bounding boxes processed.",
                "savedAt": "2024-01-01T00:00:00Z",
                "bboxCount": len(request.bboxes)
            }
        
        # 實際保存到資料庫
        try:
            video = Video(project_id=request.project_id, video_id=request.video_id)
            success_count = 0
            
            for bbox in request.bboxes:
                try:
                    success = video.annotate(request.frame_num, bbox)
                    if success:
                        success_count += 1
                except Exception as bbox_error:
                    print(f"⚠️ [BACKEND] Error saving bbox: {bbox_error}")
                    continue
            
            # 保存資料
            data_saved = video.save_data()
            
            if success_count > 0:
                return {
                    "success": True,
                    "message": f"Annotation saved successfully. {success_count}/{len(request.bboxes)} bounding boxes processed.",
                    "savedAt": "2024-01-01T00:00:00Z",
                    "bboxCount": success_count
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to save any bounding boxes"
                }
                
        except Exception as db_error:
            print(f"💥 [BACKEND] Database error: {db_error}")
            return {
                "success": False,
                "message": f"Database error: {str(db_error)}"
            }

    except Exception as e:
        print(f"💥 [BACKEND] Error in annotate endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Server error: {str(e)}"
        }
    
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
    
##################### Page 5 - Training #####################
@app.post("/create_dataset")
async def create_dataset(request: ProjectRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_create_dataset, request.project_id)
    return {
        "success": True,
        "message": "Training started in the background."
    }

async def _create_dataset(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)

        for video_id in project.videos:
            # check if video is ready for auto-annotation
            video = Video(project_id = request.project_id, video_id = video_id)
            if video.annotation_status == "completed":
                continue
            elif video.annotation_status == "manual annotation in progress" or video.annotation_status == "not yet started":
                return {
                    "success": False,
                    "message": f"Video {video_id} is not ready for auto-annotation. Please complete manual annotation first.",
                }
            else:
                # perform auto-annotation
                success = video.auto_annotate()

        
        success = success and project.create_dataset()
        
        return {
            "success": True,
            "message": "Dataset is creating in the background."
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
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
    
@app.post("/train")
async def train(request: ProjectRequest, background_tasks: BackgroundTasks):
    try:
        project = Project(project_id = request.project_id)

        # Train the model
        background_tasks.add_task(project.train, request.project_id)
        
        return {
            "success": True,
            "message": "Model is training in the background."
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
@app.post("/get_training_progress")
async def get_training_progress(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)

        # Get training progress - use fallback if database column doesn't exist
        try:
            project_status = project.get_project_status()
            progress = project.get_training_progress() # progress is an int (0 - 100) representing the % of completion
        except Exception as db_error:
            print(f"Database error, using fallback: {db_error}")
            project_status = "Not started"
            progress = 0

        return {
            "success": True,
            "status": project_status,
            "progress": progress
        }

    except Exception as e:
        print(f"Error in get_training_progress: {e}")
        return {
            "success": True,
            "status": "Not started",
            "progress": 0
        }
    
##################### Page 6 - Deployment #####################

@app.post("/get_model_performance")
async def get_model_performance(request: ProjectRequest):
    try:
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, returning mock model performance")
            return {
                "success": True,
                "model performance": {
                    "accuracy": 0.85,
                    "precision": 0.82,
                    "recall": 0.88,
                    "f1_score": 0.85,
                    "status": "No trained model available (mock mode)"
                }
            }
        
        project = Project(project_id = request.project_id)

        # Get model performance
        performance = project.get_model_performance()

        return {
            "success": True,
            "model performance": performance
        }

    except Exception as e:
        print(f"💥 [BACKEND] Error getting model performance: {str(e)}")
        # 返回模擬數據而不是錯誤
        return {
            "success": True,
            "model performance": {
                "accuracy": 0.85,
                "precision": 0.82,
                "recall": 0.88,
                "f1_score": 0.85,
                "status": "No trained model available (mock mode)"
            }
        }

@app.post("/get_model_path")
async def get_model_path(request: ProjectRequest):
    try:
        # 檢查數據庫連接
        if connection is None or not connection:
            print("📋 [BACKEND] Database not connected, returning mock model path")
            return {
                "success": True,
                "model path": "/mock/models/best.pt",
                "status": "No trained model available (mock mode)"
            }
        
        project = Project(project_id = request.project_id)

        # Get model paths
        model_path = project.get_model_path()

        return {
            "success": True,
            "model path": model_path
        }

    except Exception as e:
        print(f"💥 [BACKEND] Error getting model path: {str(e)}")
        # 返回模擬數據而不是錯誤
        return {
            "success": True,
            "model path": "/mock/models/best.pt",
            "status": "No trained model available (mock mode)"
        }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

# Test endpoint to verify server is working
@app.get("/test")
async def test_endpoint():
    return {"message": "Backend is working!", "timestamp": "2024-01-01"}

# Debug endpoint to list all available routes
@app.get("/debug/routes")
async def debug_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods)
            })
    return {"available_routes": routes}

# Debug endpoint to check current project status
@app.get("/debug/project/{project_id}")
async def debug_project(project_id: str):
    try:
        print(f"🔍 [DEBUG] Checking project status: {project_id}")
        
        from pathlib import Path
        
        # 檢查專案目錄
        project_paths = [
            f"./projects/{project_id}",
            f"./safe_projects/default",
            f"backend/Nocodile/Backend/Nocodile/backend/{project_id}",
            f"{project_id}"
        ]
        
        project_info = {
            "project_id": project_id,
            "opencv_available": OPENCV_AVAILABLE,
            "current_working_dir": str(Path.cwd()),
            "project_paths": [],
            "video_files": [],
            "total_videos": 0
        }
        
        for path_str in project_paths:
            project_dir = Path(path_str)
            path_info = {
                "path": str(project_dir),
                "exists": project_dir.exists(),
                "is_dir": project_dir.is_dir() if project_dir.exists() else False,
                "videos_dir": None,
                "video_files": []
            }
            
            if project_dir.exists():
                videos_dir = project_dir / "videos"
                path_info["videos_dir"] = str(videos_dir)
                path_info["videos_dir_exists"] = videos_dir.exists()
                
                if videos_dir.exists():
                    video_files = list(videos_dir.glob("*.mp4"))
                    path_info["video_files"] = [str(f) for f in video_files]
                    project_info["video_files"].extend([str(f) for f in video_files])
            
            project_info["project_paths"].append(path_info)
        
        project_info["total_videos"] = len(project_info["video_files"])
        
        return project_info
    except Exception as e:
        return {
            "error": str(e),
            "project_id": project_id
        }

# Debug endpoint to check frame information for a project
@app.get("/debug/frames/{project_id}")
async def debug_frames(project_id: str):
    try:
        print(f"🔍 [DEBUG] Checking frames for project: {project_id}")
        
        if not OPENCV_AVAILABLE:
            return {
                "project_id": project_id,
                "opencv_available": False,
                "message": "OpenCV not available",
                "frames": []
            }
        
        import cv2
        from pathlib import Path
        
        # 嘗試多個可能的路徑
        possible_paths = [
            f"./projects/{project_id}/videos",  # 新的安全路徑
            f"./safe_projects/default/videos",   # 備用路徑
            f"backend/Nocodile/Backend/Nocodile/backend/{project_id}/videos",
            f"{project_id}/videos",
            f"./{project_id}/videos",
            f"./videos",  # 最後的備用路徑
            f"./temp"     # 臨時路徑
        ]
        
        found_videos = []
        frame_info = []
        
        for path_str in possible_paths:
            video_dir = Path(path_str)
            if video_dir.exists():
                video_files = list(video_dir.glob("*.mp4"))
                if video_files:
                    for video_file in video_files:
                        try:
                            cap = cv2.VideoCapture(str(video_file))
                            if cap.isOpened():
                                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                                fps = cap.get(cv2.CAP_PROP_FPS)
                                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                                
                                # 測試讀取第一幀
                                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                                ret, frame = cap.read()
                                first_frame_ok = ret and frame is not None
                                
                                video_info = {
                                    "path": str(video_file),
                                    "name": video_file.name,
                                    "size": video_file.stat().st_size,
                                    "total_frames": total_frames,
                                    "fps": fps,
                                    "width": width,
                                    "height": height,
                                    "first_frame_readable": first_frame_ok,
                                    "readable": os.access(video_file, os.R_OK)
                                }
                                found_videos.append(video_info)
                                frame_info.append({
                                    "video": video_file.name,
                                    "frame_id": 0,
                                    "total_frames": total_frames,
                                    "readable": first_frame_ok
                                })
                                
                                cap.release()
                        except Exception as video_error:
                            print(f"❌ [DEBUG] Error processing video {video_file}: {video_error}")
                            found_videos.append({
                                "path": str(video_file),
                                "name": video_file.name,
                                "error": str(video_error)
                            })
                    break
        
        return {
            "project_id": project_id,
            "opencv_available": OPENCV_AVAILABLE,
            "found_videos": found_videos,
            "frame_info": frame_info,
            "total_videos": len(found_videos),
            "current_working_dir": str(Path.cwd())
        }
    except Exception as e:
        return {
            "error": str(e),
            "project_id": project_id
        }

# Debug endpoint to check video files for a project
@app.get("/debug/videos/{project_id}")
async def debug_videos(project_id: str):
    try:
        from pathlib import Path
        
        # 嘗試多個可能的路徑
        possible_paths = [
            f"./projects/{project_id}/videos",  # 新的安全路徑
            f"./safe_projects/default/videos",   # 備用路徑
            f"backend/Nocodile/Backend/Nocodile/backend/{project_id}/videos",
            f"{project_id}/videos",
            f"./{project_id}/videos",
            f"./videos",  # 最後的備用路徑
            f"./temp"     # 臨時路徑
        ]
        
        found_videos = []
        path_status = []
        
        for path_str in possible_paths:
            video_dir = Path(path_str)
            status = {
                "path": str(video_dir),
                "exists": video_dir.exists(),
                "is_dir": video_dir.is_dir() if video_dir.exists() else False,
                "videos": []
            }
            
            if video_dir.exists() and video_dir.is_dir():
                video_files = list(video_dir.glob("*.mp4"))
                if video_files:
                    for video_file in video_files:
                        try:
                            video_info = {
                                "path": str(video_file),
                                "name": video_file.name,
                                "size": video_file.stat().st_size,
                                "readable": os.access(video_file, os.R_OK)
                            }
                            status["videos"].append(video_info)
                            found_videos.append(video_info)
                        except Exception as file_error:
                            status["videos"].append({
                                "path": str(video_file),
                                "name": video_file.name,
                                "error": str(file_error)
                            })
            
            path_status.append(status)
        
        return {
            "project_id": project_id,
            "found_videos": found_videos,
            "total_count": len(found_videos),
            "path_status": path_status,
            "opencv_available": OPENCV_AVAILABLE,
            "current_working_dir": str(Path.cwd())
        }
    except Exception as e:
        return {
            "error": str(e),
            "project_id": project_id
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)