import logging
from fastapi import FastAPI, Request, status, Depends, HTTPException, Cookie, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import Dict, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
import shutil
import uuid
import cv2
import pandas as pd
import os
from cv_models import KCF, SAM
import numpy as np
import base64
import pymysql

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseOperations:
    def __init__(self, host='localhost', user='root', password='12345678', database='object_detection'):
        """
        初始化数据库连接配置
        参数:
            host: 数据库主机地址
            user: 数据库用户名
            password: 数据库密码
            database: 数据库名称
        """
        self.config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
            'charset': 'utf8mb4'
        }
        self.connection = None
    
    def connect(self):
        """
        建立与MySQL数据库的连接
        返回:
            bool: 连接成功返回True，失败返回False
        """
        try:
            self.connection = pymysql.connect(**self.config)
            return True
        except Exception as e:
            print(f"数据库连接失败: {e}")
            return False
    
    def close(self):
        """
        关闭数据库连接
        释放数据库资源
        """
        if self.connection:
            self.connection.close()
    
    def execute_query(self, query, params=None, fetch_one=False, fetch_all=False):
        """
        执行数据库查询的通用方法
        参数:
            query: SQL查询语句
            params: 查询参数（防止SQL注入）
            fetch_one: 是否只获取一条记录
            fetch_all: 是否获取所有记录
        返回:
            查询结果或受影响的行数
        """
        if not self.connection:
            if not self.connect():
                return None
        
        cursor = self.connection.cursor(pymysql.cursors.DictCursor)
        try:
            cursor.execute(query, params)
            if fetch_one:
                return cursor.fetchone()
            elif fetch_all:
                return cursor.fetchall()
            else:
                self.connection.commit()
                return cursor.rowcount
        except Exception as e:
            print(f"❌ 查询执行失败: {e}")
            self.connection.rollback()
            return None
        finally:
            cursor.close()
    
#================================= 用户相关操作 ========================================
    
    def authenticate_user(self, username, password):
        """
        验证用户登录凭据
        参数:
            username: 用户名
            password: 密码
        返回:
            tuple: (验证结果, 用户ID) - 验证成功返回(True, user_id)，失败返回(False, None)
        """
        query = "SELECT user_id, username FROM user WHERE username = %s AND password = %s"
        result = self.execute_query(query, (username, password), fetch_one=True)
        if result:
            return True, result['user_id']
        return False, None
    
    def get_username_by_id(self, user_id):
        """
        根据用户ID获取用户名
        参数:
            user_id: 用户ID
        返回:
            str: 用户名，如果用户不存在返回None
        """
        query = "SELECT username FROM user WHERE user_id = %s"
        result = self.execute_query(query, (user_id,), fetch_one=True)
        return result['username'] if result else None
    
#================================= 项目相关操作 ========================================
    
    def get_user_projects(self, user_id):
        """
        获取用户的所有项目（包括拥有的和共享的）
        参数:
            user_id: 用户ID
        返回:
            tuple: (拥有的项目ID列表, 共享的项目ID列表)
        """
        owned_query = "SELECT project_id FROM project WHERE project_owner_id = %s"
        owned_projects = self.execute_query(owned_query, (user_id,), fetch_all=True)
        owned_ids = [p['project_id'] for p in owned_projects] if owned_projects else []
        
        shared_query = "SELECT project_id FROM project_shared_users WHERE user_id = %s"
        shared_projects = self.execute_query(shared_query, (user_id,), fetch_all=True)
        shared_ids = [p['project_id'] for p in shared_projects] if shared_projects else []
        
        return owned_ids, shared_ids
    
    def get_project_name(self, project_id):
        """
        获取项目名称
        参数:
            project_id: 项目ID
        返回:
            str: 项目名称，如果项目不存在返回None
        """
        query = "SELECT project_name FROM project WHERE project_id = %s"
        result = self.execute_query(query, (project_id,), fetch_one=True)
        return result['project_name'] if result else None
    
    def get_project_type(self, project_id):
        """
        获取项目类型
        参数:
            project_id: 项目ID
        返回:
            str: 项目类型，如果项目不存在返回默认值"YOLO object detection"
        """
        query = "SELECT project_type FROM project WHERE project_id = %s"
        result = self.execute_query(query, (project_id,), fetch_one=True)
        return result['project_type'] if result else "YOLO object detection"
    
    def get_project_owner(self, project_id):
        """
        获取项目所有者ID
        参数:
            project_id: 项目ID
        返回:
            int: 项目所有者ID，如果项目不存在返回None
        """
        query = "SELECT project_owner_id FROM project WHERE project_id = %s"
        result = self.execute_query(query, (project_id,), fetch_one=True)
        return result['project_owner_id'] if result else None
    
    def get_project_shared_users(self, project_id):
        """
        获取项目的共享用户列表
        参数:
            project_id: 项目ID
        返回:
            list: 共享用户ID列表
        """
        query = "SELECT user_id FROM project_shared_users WHERE project_id = %s"
        result = self.execute_query(query, (project_id,), fetch_all=True)
        return [u['user_id'] for u in result] if result else []
    
    def get_project_status(self, project_id):
        """
        获取项目状态
        参数:
            project_id: 项目ID
        返回:
            str: 项目状态，如果项目不存在返回默认值"Not started"
        """
        query = "SELECT project_status FROM project WHERE project_id = %s"
        result = self.execute_query(query, (project_id,), fetch_one=True)
        return result['project_status'] if result else "Not started"
    
    def get_project_classes(self, project_id):
        """
        获取项目的类别列表
        参数:
            project_id: 项目ID
        返回:
            dict: 类别字典，格式为{索引: 类别名称}
        """
        query = """
        SELECT c.class_id, c.class_name, c.color
        FROM class c
        JOIN project_classes pc ON c.class_id = pc.class_id
        WHERE pc.project_id = %s
        ORDER BY c.class_id
        """
        result = self.execute_query(query, (project_id,), fetch_all=True)
        classes = {}
        if result:
            for i, class_item in enumerate(result):
                classes[i] = class_item['class_name']
        return classes
    
    def check_project_name_exists(self, user_id, project_name):
        """
        检查用户是否已有同名项目
        参数:
            user_id: 用户ID
            project_name: 项目名称
        返回:
            bool: 如果项目名称已存在返回True，否则返回False
        """
        query = "SELECT COUNT(*) as count FROM project WHERE project_owner_id = %s AND project_name = %s"
        result = self.execute_query(query, (user_id, project_name), fetch_one=True)
        return result['count'] > 0 if result else False
    
    def create_project(self, user_id, project_name, project_type):
        """
        创建新项目
        参数:
            user_id: 项目所有者ID
            project_name: 项目名称
            project_type: 项目类型
        返回:
            int: 新创建的项目ID，创建失败返回None
        """
        query = """
        INSERT INTO project (project_name, project_type, project_owner_id, project_status, 
                           auto_annotation_progress, training_progress, model_path, dataset_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        model_path = f"./{uuid.uuid4().hex[:8]}/models/"
        dataset_path = f"./{uuid.uuid4().hex[:8]}/datasets/"
        
        params = (project_name, project_type, user_id, "Not started", 0.00, 0.00, model_path, dataset_path)
        result = self.execute_query(query, params)
        
        if result:
            get_id_query = "SELECT project_id FROM project WHERE project_name = %s AND project_owner_id = %s ORDER BY project_id DESC LIMIT 1"
            project_result = self.execute_query(get_id_query, (project_name, user_id), fetch_one=True)
            return project_result['project_id'] if project_result else None
        return None
    
    def update_project_name(self, project_id, new_name):
        """
        更新项目名称
        参数:
            project_id: 项目ID
            new_name: 新项目名称
        返回:
            int: 受影响的行数
        """
        query = "UPDATE project SET project_name = %s WHERE project_id = %s"
        return self.execute_query(query, (new_name, project_id))
    
    def save_project_data(self, project_id, project_name=None, project_type=None, status=None, 
                         auto_progress=None, training_progress=None):
        """
        保存项目数据（支持部分字段更新）
        参数:
            project_id: 项目ID
            project_name: 项目名称（可选）
            project_type: 项目类型（可选）
            status: 项目状态（可选）
            auto_progress: 自动标注进度（可选）
            training_progress: 训练进度（可选）
        返回:
            int: 受影响的行数，如果没有更新字段返回True
        """
        updates = []
        params = []
        
        if project_name is not None:
            updates.append("project_name = %s")
            params.append(project_name)
        if project_type is not None:
            updates.append("project_type = %s")
            params.append(project_type)
        if status is not None:
            updates.append("project_status = %s")
            params.append(status)
        if auto_progress is not None:
            updates.append("auto_annotation_progress = %s")
            params.append(auto_progress)
        if training_progress is not None:
            updates.append("training_progress = %s")
            params.append(training_progress)
        
        if updates:
            params.append(project_id)
            query = f"UPDATE project SET {', '.join(updates)} WHERE project_id = %s"
            return self.execute_query(query, params)
        return True
#================================= 视频相关操作 ========================================
    
    def get_project_videos(self, project_id):
        """
        获取项目的所有视频ID列表
        参数:
            project_id: 项目ID
        返回:
            list: 视频ID列表
        """
        query = "SELECT video_id FROM video WHERE project_id = %s ORDER BY video_id"
        result = self.execute_query(query, (project_id,), fetch_all=True)
        return [v['video_id'] for v in result] if result else []
    
    def get_video_name(self, video_id):
        """
        获取视频名称
        参数:
            video_id: 视频ID
        返回:
            str: 视频名称，如果视频不存在返回"Untitled"
        """
        query = "SELECT video_name FROM video WHERE video_id = %s"
        result = self.execute_query(query, (video_id,), fetch_one=True)
        return result['video_name'] if result else "Untitled"
    
    def get_video_path(self, video_id):
        """
        获取视频文件路径
        参数:
            video_id: 视频ID
        返回:
            str: 视频文件路径，如果视频不存在返回None
        """
        query = "SELECT video_path FROM video WHERE video_id = %s"
        result = self.execute_query(query, (video_id,), fetch_one=True)
        return result['video_path'] if result else None
    
    def get_video_annotation_status(self, video_id):
        """
        获取视频标注状态和最后标注帧
        参数:
            video_id: 视频ID
        返回:
            tuple: (标注状态, 最后标注帧号)
        """
        query = "SELECT annotation_status, last_annotated_frame FROM video WHERE video_id = %s"
        result = self.execute_query(query, (video_id,), fetch_one=True)
        if result:
            return result['annotation_status'], result['last_annotated_frame']
        return "yet to start", None
    
    def create_video(self, project_id, video_id, video_path, video_name, total_frames):
        """
        创建新视频记录
        参数:
            project_id: 项目ID
            video_id: 视频ID
            video_path: 视频文件路径
            video_name: 视频名称
            total_frames: 视频总帧数
        返回:
            int: 受影响的行数
        """
        query = """
        INSERT INTO video (video_id, project_id, video_path, video_name, annotation_status, 
                          last_annotated_frame, total_frames)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (video_id, project_id, video_path, video_name, "yet to start", 0, total_frames)
        return self.execute_query(query, params)
    
    def update_video_name(self, video_id, new_name):
        """
        更新视频名称
        参数:
            video_id: 视频ID
            new_name: 新视频名称
        返回:
            int: 受影响的行数
        """
        query = "UPDATE video SET video_name = %s WHERE video_id = %s"
        return self.execute_query(query, (new_name, video_id))
    
    def update_video_annotation_status(self, video_id, status, last_frame=None):
        """
        更新视频标注状态和最后标注帧
        参数:
            video_id: 视频ID
            status: 标注状态
            last_frame: 最后标注帧号（可选）
        返回:
            int: 受影响的行数
        """
        query = "UPDATE video SET annotation_status = %s, last_annotated_frame = %s WHERE video_id = %s"
        return self.execute_query(query, (status, last_frame, video_id))
    
    def save_video_data(self, video_id, video_name=None, annotation_status=None, last_annotated_frame=None):
        """
        保存视频数据（支持部分字段更新）
        参数:
            video_id: 视频ID
            video_name: 视频名称（可选）
            annotation_status: 标注状态（可选）
            last_annotated_frame: 最后标注帧号（可选）
        返回:
            int: 受影响的行数，如果没有更新字段返回True
        """
        updates = []
        params = []
        
        if video_name is not None:
            updates.append("video_name = %s")
            params.append(video_name)
        if annotation_status is not None:
            updates.append("annotation_status = %s")
            params.append(annotation_status)
        if last_annotated_frame is not None:
            updates.append("last_annotated_frame = %s")
            params.append(last_annotated_frame)
        
        if updates:
            params.append(video_id)
            query = f"UPDATE video SET {', '.join(updates)} WHERE video_id = %s"
            return self.execute_query(query, params)
        return True
    
#================================= 类别相关操作 ========================================
    
    def add_class_to_project(self, project_id, class_name, color="#FF0000"):
        """
        为项目添加类别
        参数:
            project_id: 项目ID
            class_name: 类别名称
            color: 类别颜色（默认红色）
        返回:
            int: 受影响的行数
        """
        check_query = "SELECT class_id FROM class WHERE class_name = %s"
        existing_class = self.execute_query(check_query, (class_name,), fetch_one=True)
        
        if existing_class:
            class_id = existing_class['class_id']
        else:
            create_query = "INSERT INTO class (class_name, color) VALUES (%s, %s)"
            self.execute_query(create_query, (class_name, color))
            class_id = self.connection.insert_id()
        
        add_query = "INSERT IGNORE INTO project_classes (project_id, class_id) VALUES (%s, %s)"
        return self.execute_query(add_query, (project_id, class_id))
    
    def remove_class_from_project(self, project_id, class_name):
        """
        从项目中移除类别
        参数:
            project_id: 项目ID
            class_name: 类别名称
        返回:
            int: 受影响的行数，如果类别不存在返回False
        """
        class_query = "SELECT class_id FROM class WHERE class_name = %s"
        class_result = self.execute_query(class_query, (class_name,), fetch_one=True)
        
        if class_result:
            class_id = class_result['class_id']
            remove_query = "DELETE FROM project_classes WHERE project_id = %s AND class_id = %s"
            return self.execute_query(remove_query, (project_id, class_id))
        return False
    
    def update_class_name(self, project_id, old_name, new_name):
        """
        更新类别名称
        参数:
            project_id: 项目ID（未使用，保留接口一致性）
            old_name: 原类别名称
            new_name: 新类别名称
        返回:
            int: 受影响的行数，如果类别不存在返回False
        """
        class_query = "SELECT class_id FROM class WHERE class_name = %s"
        class_result = self.execute_query(class_query, (old_name,), fetch_one=True)
        
        if class_result:
            class_id = class_result['class_id']
            update_query = "UPDATE class SET class_name = %s WHERE class_id = %s"
            return self.execute_query(update_query, (new_name, class_id))
        return False
    
    def check_class_exists_in_project(self, project_id, class_name):
        """
        检查类别是否存在于项目中
        参数:
            project_id: 项目ID
            class_name: 类别名称
        返回:
            bool: 如果类别存在于项目中返回True，否则返回False
        """
        query = """
        SELECT COUNT(*) as count FROM project_classes pc
        JOIN class c ON pc.class_id = c.class_id
        WHERE pc.project_id = %s AND c.class_name = %s
        """
        result = self.execute_query(query, (project_id, class_name), fetch_one=True)
        return result['count'] > 0 if result else False


db_ops = DatabaseOperations()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str
        
class UserRequest(BaseModel):
    userID: str

class ProjectRequest(BaseModel):
    projectID: str

class CreateProjectRequest(BaseModel):
    userID: str
    project_name: str
    project_type: str = "YOLO object detection"

class VideoRequest(BaseModel):
    projectID: str
    videoID: str

class AnnotationRequest(BaseModel):
    projectID: str
    videoID: str
    frame_num: int
    coordinates: str

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    def get_username(self):
        return db_ops.get_username_by_id(self.userID)

class Project():
    def __init__(self, projectID: str, project_name=None, project_type=None, owner=None, initialize=False):
        self.projectID = projectID
        if not project_name:
            self.project_name = self.get_project_name()
        else:
            self.project_name = project_name
        if self.project_name.strip() == '':
            self.project_name = "Untitled"
            if self.project_name_exists():
                self.project_name = f"{self.project_name}_{uuid.uuid4().hex[:8]}"
        if not project_type:
            self.project_type = self.get_project_type()
        else:
            self.project_type = project_type
        self.videos = self.get_videos()
        self.video_count = self.get_video_count()
        if not owner:
            self.owner = self.get_owner()
        else:
            self.owner = owner
        self.shared_users = self.get_shared_users()
        if initialize:
            self.classes = {}
        else:
            self.classes = self.get_classes()
        if initialize:
            self.status = "Not started"
        else:
            self.status = self.get_status()
    
    def project_name_exists(self):
        return db_ops.check_project_name_exists(self.owner, self.project_name)
    
    def get_project_name(self):
        return db_ops.get_project_name(self.projectID)
    
    def get_project_type(self):
        return db_ops.get_project_type(self.projectID)
    
    def get_videos(self):
        return db_ops.get_project_videos(self.projectID)
    
    def get_video_count(self):
        video_count = len(self.videos)
        return video_count
    
    def get_owner(self):
        return db_ops.get_project_owner(self.projectID)
    
    def get_shared_users(self):
        return db_ops.get_project_shared_users(self.projectID)
    
    def get_classes(self):
        return db_ops.get_project_classes(self.projectID)
    
    def get_status(self):
        return db_ops.get_project_status(self.projectID)
    
    def get_project_details(self):
        details = {
            "project name": self.project_name,
            "project type": self.project_type,
            "video count": self.video_count,
            "videos": self.videos,
            "owner": self.owner,
            "shared users": self.shared_users,
            "status": self.status,
            "classes": self.classes
        }
        return details
        
    def get_project_path(self):
        project_path = f"./{self.projectID}/"
        if not os.path.exists(project_path):
            os.makedirs(project_path)
        return project_path
    
    def change_project_name(self, new_name: str):
        self.project_name = new_name
        return True
    
    def check_class_exists(self, class_name: str):
        return class_name in self.classes.values()
    
    def add_class(self, class_name: str):
        new_index = max(self.classes.keys(), default=-1) + 1
        self.classes[new_index] = class_name
        return True
    
    def modify_class(self, original_class_name: str, new_class_name: str):
        for index, name in self.classes.items():
            if name == original_class_name:
                self.classes[index] = new_class_name
                return True
        return False
    
    def delete_class(self, class_name: str):
        for index, name in list(self.classes.items()):
            if name == class_name:
                del self.classes[index]
                return True
        return False
    
    def create_dataset(self):
        folder_path = f"{self.get_project_path()}datasets/label/_"
        for video in self.videos:
            bbox_data = video.get_bbox_data()
            for frame_num, frame_bbox in enumerate(bbox_data):
                if not isinstance(frame_bbox, str):
                    raise ValueError(f"Video {video.videoID} has unannotated frames. Please complete annotation before creating dataset.")
                
                filename = f"{folder_path}{video.videoID}_frame{frame_num+1}.txt"
                with open(filename, 'w') as file:
                    for bbox in frame_bbox:
                        file.write(f"{bbox}\n")
        return folder_path
    
    def save_data(self):
        return db_ops.save_project_data(self.projectID, self.project_name, self.project_type, self.status)

class Video(Project):
    def __init__(self, projectID: str, videoID, bbox_data_path=None, video_path=None, initialize=False):
        super().__init__(projectID)
        self.videoID = videoID
        if not video_path:
            self.video_path = self.get_video_path()
        else:
            self.video_path = video_path
        self.video_name = self.get_video_name()
        self.frame_count = self.get_frame_count()
        self.fps = self.get_fps()
        self.resolution = self.get_resolution()
        if not bbox_data_path:
            self.bbox_data_path = self.get_bbox_data_path()
        else:
            self.bbox_data_path = bbox_data_path
        self.bbox_data = self.get_bbox_data()
        if initialize:
            self.annotation_status, self.last_annotated_frame = "yet to start", None
        else:
            self.annotation_status, self.last_annotated_frame = self.get_annotation_status()
        if initialize:
            self.bbox_data = [None for _ in range(self.frame_count)]
            self.save_bbox_data()
        self.cap = cv2.VideoCapture(self.video_path)

    def get_video_name(self):
        return db_ops.get_video_name(self.videoID)
    
    def update_video_name(self, new_name: str):
        self.video_name = new_name
        
    def get_video_path(self):
        return db_ops.get_video_path(self.videoID)
    
    def get_frame_count(self):
        frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        return frame_count
    
    def get_fps(self):
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        return fps
    
    def get_resolution(self):
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return (width, height)
    
    def get_bbox_data_path(self):
        name, ext = os.path.splitext(self.video_path)
        bbox_data_path = f"{name}_bbox.csv"
        bbox_data_path = "user_bounded_data.csv"
        return bbox_data_path
    
    def get_bbox_data(self):
        if os.path.exists(self.bbox_data_path):
            df = pd.read_csv(self.bbox_data_path)
            bbox_data = df['bbox'].to_dict()
        else:
            bbox_data = [None in range(self.frame_count)]
        return bbox_data
    
    def save_bbox_data(self):
        df = pd.DataFrame(self.bbox_data, columns=['bbox'])
        df.to_csv(self.bbox_data_path, index=False)
    
    def get_annotation_status(self):
        return db_ops.get_video_annotation_status(self.videoID)
    
    def get_next_frame_to_annotate(self):
        if self.annotation_status == "yet to start":
            return self.get_frame(0)
        elif self.annotation_status == "completed":
            return None
        elif isinstance(self.last_annotated_frame, int):
            next_frame = self.last_annotated_frame + self.fps
            if next_frame < self.frame_count:
                return self.get_frame(next_frame)
            else:
                self.annotation_status = "manual annotation completed"
                return None
        else:
            return None
    
    def get_frame(self, frame_num: int):
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
    
    def annotate(self, frame_num: int, coordinates: str):
        try:
            self.annotation_status = "manual annotation in progress"
            if frame_num < 0 or frame_num >= self.frame_count:
                raise ValueError("Frame number out of range")
            width, height = self.resolution
            x, y, w, h = coordinates[1:5]
            x_center, y_center = x + w/2, y + h/2
            x_normalized, y_normalized, w_normalized, h_normalized = x_center/width, y_center/height, w/width, h/height
            self.bbox_data[frame_num] = f"{coordinates[0]} {x_normalized} {y_normalized} {w_normalized} {h_normalized}"
            self.last_annotated_frame = frame_num
            return True
        except Exception as e:
            logger.error(f"Error in annotate: {str(e)}")
            return f"Error in annotate: {str(e)}"
    
    def auto_annotate(self):
        try:
            self.save_bbox_data()
            self.annotation_status = "auto annotation in progress"
            annotator = AutoAnnotator(self.video_path, self.bbox_data_path)
            annotator.auto_annotate()
            self.annotation_status = "completed"
            return True
        except Exception as e:
            logger.error(f"Error in auto_annotate: {str(e)}")
            return f"Error in auto_annotate: {str(e)}"
    
    def save_data(self):
        return db_ops.save_video_data(self.videoID, self.video_name, self.annotation_status, self.last_annotated_frame)

class AutoAnnotator():
    def __init__(self, video_path: str, user_bounded_data_path: str):
        self.video_path = video_path
        self.user_bounded_data_path = user_bounded_data_path

    @staticmethod
    def _calculate_iou(bbox1, bbox2):
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2

        bbox1_x2 = x1 + w1
        bbox1_y2 = y1 + h1
        bbox2_x2 = x2 + w2
        bbox2_y2 = y2 + h2

        inter_x1 = max(x1, x2)
        inter_y1 = max(y1, y2)
        inter_x2 = min(bbox1_x2, bbox2_x2)
        inter_y2 = min(bbox1_y2, bbox2_y2)

        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)

        box1_area = w1 * h1
        box2_area = w2 * h2

        iou = inter_area / float(box1_area + box2_area - inter_area) if (box1_area + box2_area - inter_area) > 0 else 0
        return iou

    def auto_annotate(self):
        df = pd.read_csv(self.user_bounded_data_path)

        annotated_frames = [index for index, row in df.iterrows() if isinstance(df.iloc[index]["bbox"], str)]

        for i in range(len(annotated_frames) - 1):
            starting_frame_num = annotated_frames[i]
            ending_frame_num = annotated_frames[i + 1]
            print(f"Auto-annotating frames from {starting_frame_num} to {ending_frame_num}...")

            starting_frame_bbox = tuple(df.iloc[starting_frame_num]["bbox"])

            kcf_tracker = KCF(video_path=self.video_path)
            tracking_results = kcf_tracker.predict_frames(starting_frame_bbox=starting_frame_bbox, starting_frame_num=starting_frame_num, ending_frame_num=ending_frame_num)

            cap = cv2.VideoCapture(self.video_path)
            cap.set(cv2.CAP_PROP_POS_FRAMES, starting_frame_num+1)
            for index in range(starting_frame_num+1, ending_frame_num):
                if isinstance(df.iloc[index]["bbox"], float):
                    print(f"Processing frame {index+1}...")
                    ret, frame = cap.read()
                    if not ret:
                        print(f"无法读取第 {index+1} 帧，视频可能结束")
                        break
                    sam_segmenter = SAM(image=frame)
                    bboxes = sam_segmenter.segment()
                    
                    max_iou = -1
                    best_bbox = None
                    target_bbox = tracking_results[index-starting_frame_num]

                    for bbox in bboxes:
                        iou = self._calculate_iou(target_bbox, bbox)
                        if iou > max_iou:
                            max_iou = iou
                            best_bbox = bbox

                    df.iloc[index]['bbox'] = best_bbox
                    print(f"Best matching bbox for frame {index+1}: {best_bbox}")

        cap.release()
        df.to_csv(self.user_bounded_data_path, index=False)
        return True

class ModelTraining(Project):
    def __init__(self, projectID: str):
        super().__init__(projectID)
    
    def train(self):
        return True, "model_save_path"

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    body = request._body.decode() if hasattr(request, "_body") else ""
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(f"Request body: {body[:100]}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

################ Page 1 - Login ################

@app.post("/login")
async def login(request: LoginRequest):
    try:
        username = request.username
        password = request.password

        status, userID = db_ops.authenticate_user(username, password)

        return {
            "status": status,
            "userID": userID
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
################ Page 2 - Project Management ################

@app.post("/get_projects_info")
async def get_project_info(request: UserRequest):
    try: 
        userID = request.userID

        owned_projects, shared_projects = db_ops.get_user_projects(userID)
        
        return {
            "owned projects": owned_projects,
            "shared projects": shared_projects
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/get_project_details")
async def get_project_details(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)
        project_details = project.get_project_details()
        return project_details

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/create_project")
async def create_project(request: CreateProjectRequest):
    try:
        userID = request.userID
        project_name = request.project_name
        project_type = request.project_type

        project_name_exists = db_ops.check_project_name_exists(userID, project_name)
        if project_name_exists:
            return {
                "success": False,
                "message": "Project name already exists."
            }
        
        projectID = db_ops.create_project(userID, project_name, project_type)
        if not projectID:
            return {
                "success": False,
                "message": "Failed to create project."
            }

        project = Project(projectID=projectID, project_name=project_name, project_type=project_type, owner=userID, initialize=True)
        project_path = project.get_project_path()

        data_saved = False 
        while not data_saved:
            data_saved = project.save_data()

        return {
            "success": True,
            "message": "Project created successfully.",
            "projectID": projectID
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
@app.post("/change_project_name")
async def change_project_name(request: ProjectRequest, new_name: str):
    try:
        project = Project(projectID = request.projectID)
        
        project_name_exists = db_ops.check_project_name_exists(project.owner, new_name)
        if project_name_exists:
            return {
                "success": False,
                "message": "Project name already exists."
            }
        
        success = project.change_project_name(new_name)
        
        data_saved = False
        while not data_saved:
            data_saved = project.save_data()
        
        if success:
            return {
                "success": True,
                "message": "Project name changed successfully."
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
    
################ Page 3 - Video Upload & Management ################
@app.post("/upload")
async def upload(projectID: str, file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file type.")
        
        videoID = str(uuid.uuid4())
        
        name, ext = os.path.splitext(file.filename)
        project_path = f"./{projectID}/"
        if not os.path.exists(project_path):
            os.makedirs(project_path)
        file_location = f"{project_path}/{videoID}.{ext}"
        
        video = Video(projectID=projectID, videoID=videoID, video_path=file_location, initialize=True)
        
        # 保存视频信息到数据库
        total_frames = video.get_frame_count()
        db_ops.create_video(projectID, videoID, file_location, file.filename, total_frames)
        
        data_saved = False
        while not data_saved:
            data_saved = video.save_data()
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "message": f"file '{file.filename}' saved at '{file_location}'",
            "videoID": videoID,
            "video_path": file_location
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/add_class")
async def add_class(request: ProjectRequest, class_name: str):
    try:
        project = Project(projectID = request.projectID)
        
        class_name_exists = project.check_class_exists(class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "Class name already exists.",
                "classes": project.classes
            }
        
        project.add_class(class_name)
        db_ops.add_class_to_project(request.projectID, class_name)
        
        data_saved = False
        while not data_saved:
            data_saved = project.save_data()
        
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

@app.post("/modify_class")
async def modify_class(request: ProjectRequest, original_class_name: str, new_class_name: str):
    try:
        project = Project(projectID = request.projectID)

        class_name_exists = project.check_class_exists(original_class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Original class does not exist.",
                "classes": project.classes
            }
        
        class_name_exists = project.check_class_exists(new_class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "New class name already exists.",
                "classes": project.classes
            }
        
        project.modify_class(original_class_name, new_class_name)
        db_ops.update_class_name(request.projectID, original_class_name, new_class_name)
        
        data_saved = False
        while not data_saved:
            data_saved = project.save_data()
        
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
async def delete_class(request: ProjectRequest, class_name: str):
    try:
        project = Project(projectID = request.projectID)
        
        class_name_exists = project.check_class_exists(class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Class does not exists.",
                "classes": project.classes
            }
        
        project.delete_class(class_name)
        db_ops.remove_class_from_project(request.projectID, class_name)
        
        data_saved = False
        while not data_saved:
            data_saved = project.save_data()
        
        return {
            "success": True,
            "message": "Class deleted successfully.",
            "classes": project.classes
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
################ Page 4 - Annotation ################

@app.post("/get_next_frame_to_annotate")
async def get_next_frame_to_annotate(request: VideoRequest):
    try:
        video = Video(projectID = request.projectID, videoID = request.videoID)
        next_frame = video.get_next_frame_to_annotate()
        
        data_saved = False
        while not data_saved:
            data_saved = video.save_data()
        
        if next_frame is None:
            return {
                "success": False,
                "message": "All frames have been annotated.",
                "image": None
            }
        
        return {
                "success": True,
                "message": "Next frame fetched successfully.",
                "image": next_frame
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/check_annotation_status")
async def check_annotation_status(request: VideoRequest):  
    try:
        video = Video(projectID = request.projectID, videoID = request.videoID)
        return {
            "annotation status": video.annotation_status,
            "last annotated frame": video.last_annotated_frame
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/annotate")
async def annotate(request: AnnotationRequest):
    try:
        video = Video(projectID = request.projectID, videoID = request.videoID)
        success = video.annotate(request.frame_num, request.coordinates)
        
        data_saved = False
        while not data_saved:
            data_saved = video.save_data()
        
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
    
@app.post("/next_video")
async def next_video(request: ProjectRequest, current_videoID: str):
    try:
        project = Project(projectID = request.projectID)
        if current_videoID not in project.videos:
            return {
                "success": False,
                "message": "Current video not found in project.",
                "next_videoID": None
            }
        
        current_index = project.videos.index(current_videoID)
        if current_index + 1 < len(project.videos):
            next_videoID = project.videos[current_index + 1]
            return {
                "success": True,
                "message": "Next video fetched successfully.",
                "next_videoID": next_videoID
            }
        else:
            next_videoID = project.videos[0]
            return {
                "success": True,
                "message": "Reached end of video list. Looping back to first video.",
                "next_videoID": next_videoID
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
@app.post("/create_dataset")
async def create_dataset(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)

        for videoID in project.videos:
            video = Video(projectID = request.projectID, videoID = videoID)
            if video.annotation_status == "completed":
                continue
            elif video.annotation_status != "manual annotation completed":
                return {
                    "success": False,
                    "message": f"Video {videoID} is not ready for auto-annotation. Please complete manual annotation first.",
                    "dataset_path": None
                }
            
            success = False
            while not success:
                video = Video(projectID = request.projectID, videoID = videoID)
                success = video.auto_annotate()

                data_saved = False
                while not data_saved:
                    data_saved = video.save_data()

        for videoID in project.videos:
            video = Video(projectID = request.projectID, videoID = videoID)
            if video.annotation_status != "completed":
                return {
                    "success": False,
                    "message": f"Video {videoID} is not fully annotated. Please complete annotation before creating dataset.",
                    "dataset_path": None
                }
        
        dataset_path = project.create_dataset()
        
        return {
            "success": True,
            "message": "Dataset created successfully.",
            "dataset_path": dataset_path
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/check_auto_annotation_progress")
async def check_auto_annotation(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)
        return {
            "auto_annotation_progress": project.auto_annotation_progress
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/train")
async def train(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)

        success, model_paths = project.train()
        success = os.path.exists(model_paths)
        
        if success:
            return {
                "success": True,
                "message": "Model trained successfully."
            }
        else:
            return {
                    "success": False,
                    "message": "Failed to train model."
            }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
