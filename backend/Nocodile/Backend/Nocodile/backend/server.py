import logging
from fastapi import FastAPI, Request, status, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response
from pydantic import BaseModel
from typing import Dict, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from mysql.connector import Error
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
import mysql.connector
from shutil import copy2, rmtree
from pathlib import Path
import pymysql
import hmac

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

#=================================== Connect to database ==========================================

config = {
    'host': 'localhost',
    'user': 'root',
    'password': '12345678',
    'database': 'Nocodile',
    'charset': 'utf8mb4'
}

try:
    connection = pymysql.connect(**config)
    print("数据库连接成功！")
except pymysql.Error as e:
    print(f"数据库连接失败: {e}")

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

    def get_password(self):
        ### db ###
        # Find hashed password from database
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT password FROM user WHERE username = %s"
        cursor.execute(query, (self.username,))
        password = cursor.fetchone()['password']
        cursor.close()

        decoded_bytes = base64.b64decode(password)
        decoded_str = decoded_bytes.decode('utf-8')
        salt, pwd_hash = decoded_str.split(':', 1)
        
        return pwd_hash, salt
    
    def get_userID(self):
        ### db ###
        # Find userID given self.username
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT user_id FROM user WHERE username = %s"
        cursor.execute(query,(self.username,))
        userID = cursor.fetchone()['user_id']
        cursor.close()
        return userID

    def login(self, max_attempts=3):
        if not self.status:
            return False, "Account locked."
        
        # Hash the password input
        stored_hash, salt = self.get_password()
        salt, pwd_hash = self._hash_password(self.password, salt)
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
    def _verify_password(self, stored_hash, pwd_hash):
        return hmac.compare_digest(pwd_hash, stored_hash)

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    def get_username(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query= "SELECT username FROM user WHERE user_id =%s"
        cursor.execute(query,(self.userID,))
        username = cursor.fetchone()['username']
        cursor.close()
        return username

    def get_owned_projects(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT DISTINCT project_id FROM project WHERE project_owner_id =%s"
        cursor.execute(query,(self.userID))
        data = cursor.fetchall()
        cursor.close()
        owned_projects = [d[0] for d in data if 'project_id' in d]
        self.owned_projects = owned_projects
        return owned_projects
    
    def get_shared_projects(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="SELECT DISTINCT project_id FROM project_shared_users WHERE user_id =%s"
        cursor.execute(query,(self.userID))
        data = cursor.fetchall()
        cursor.close()
        shared_projects = [d[0] for d in data if 'project_id' in d]
        self.shared_projects = shared_projects
        return shared_projects

class Project():
    def __init__(self, project_id: str, initialize=False):
        if initialize:
            self.initialize()
        else:
            self.project_id = project_id
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

        # Add new row in project table
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="INSERT INTO project (project_name, project_type, project_owner_id, project_status) VALUES (%s, %s, %d, %s);"
        cursor.execute(query,(self.project_type, self.project_type, self.owner, self.project_status))
        project_id = cursor.lastrowid
        cursor.close()
        
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
        query = "SELECT project_name FROM project WHERE project_id = %d"
        cursor.execute(query,(self.project_id))
        project_name = cursor.fetchone()['project_name']
        cursor.close()
        return project_name
    
    def get_project_type(self):
        # Set in next phrase
        project_type = "YOLO object detection"
        return project_type
    
    def get_videos(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT DISTINCT video_id FROM video WHERE project_id = %d ORDER BY video_id ASC"
        cursor.execute(query,(self.project_id))
        data = cursor.fetchall()
        video_ids = [d[0] for d in data if 'video_id' in d]
        cursor.close()
        return video_ids
    
    def get_video_count(self):
        video_count = len(self.videos)
        return video_count
    
    def get_owner(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT project_owner_id FROM project WHERE project_id = %d"
        cursor.execute(query,(self.project_id))
        ownerID = cursor.fetchall()['project_owner_id']
        cursor.close()
        return ownerID
    
    def get_shared_users(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT DISTINCT user_id FROM project_shared_users WHERE project_id = %d"
        cursor.execute(query,(self.project_id))
        data = cursor.fetchall()
        shared_users = [d[0] for d in data if 'user_id' in d]
        return shared_users
    
    def get_classes(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT class_name, color FROM class WHERE project_id = %d"
        cursor.execute(query,(self.project_id))
        rows = cursor.fetchall()
        classes = {item["class_name"]: item["colour"] for item in rows}
        return classes
    
    def get_project_status(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT project_status FROM project WHERE project_id = %d"
        cursor.execute(query,(self.project_id))
        project_status = cursor.fetchone()['project_status']
        return project_status
        
    def get_project_path(self):
        project_path = f"./{self.project_id}/"

        if not os.path.exists(project_path):
            os.makedirs(project_path)
        return project_path
    
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
        self.classes = self.get_classes()
        self.classes[class_name] = colour
        
        # Add new row in class table
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query="INSERT INTO class (project_id, class_name, color) VALUES (%d, %s, %s) ON DUPLICATE KEY UPDATE `colour` = VALUES(`colour`);"
        cursor.execute(query,(self.project_id, class_name, colour))
        cursor.close()

        return True
    
    def modify_class(self, old_class_name: str, new_class_name: str):
        self.classes = self.get_classes()
        self.classes[new_class_name] = self.classes.pop(old_class_name)
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE class SET class_name = 'new_class_name' WHERE project_id = %d AND class_name = %s AND project_id = %s;"
        cursor.execute(query,(self.project_id, old_class_name, new_class_name))
        cursor.close()
        return True
    
    def delete_class(self, class_name: str):
        self.classes.pop(class_name)
        self.classes = self.get_classes()
        self.classes.pop(class_name, None)
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "DELETE FROM class WHERE project_id = %d AND class_name = %s"
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
            cap = cv2.VideoCapture(video.get_video_path())
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                image_path = f"{image_dir}{video.video_id}_frame_"+str(frame_idx)+".png"
                cv2.imwrite(image_path, frame)
                frame_idx += 1

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
        videos_info = []
        for video_id in self.videos:
            video = Video(project_id=self.project_id, video_id=video_id)
            video_info = video.get_video_info()
            videos_info.append(video_info)
        return videos_info
    
    # Save project status to database
    def save_project_status(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_status = %s WHERE project_id = %d"
        cursor.execute(query,(self.project_status, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()        
        return success    
    
    # Save project name to database
    def save_project_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_name = %s WHERE project_id = %d"
        cursor.execute(query,(self.project_name, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save project type to database
    def save_project_type(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_type = %s WHERE project_id = %d"
        cursor.execute(query,(self.project_type, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    # Save owner ID to database
    def save_owner(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET project_owner_id = %d WHERE project_id = %d"
        cursor.execute(query,(self.owner, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()  
        return success
    
    def save_training_progress(self, training_progress: int):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET training_progress = %d WHERE project_id = %d"
        cursor.execute(query,(training_progress, self.project_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    def save_auto_annotation_progress(self, auto_annotation_progress: int):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE project SET auto_annotation_progress = %s WHERE project_id = %d"
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
        self.cap = cv2.VideoCapture(self.video_path)

    def initialize(self, name, ext):
        self.annotation_status, self.last_annotated_frame = "yet to start", -1
        self.video_path = Path(self.get_project_path) / "videos" / f"{name}.{ext}"
        self.video_name = name
        
        self.get_video_count()
        self.video_count += 1

        # Add row to video
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "INSERT INTO video (project_id, video_path, video_name, annotation_status) VALUES (%s, %s, %d, %s);"
        cursor.execute(query,(self.project_id, self.video_path, self.video_name, self.annotation_status))
        self.video_id = cursor.lastrowid
        cursor.close()

        return self.video_id, self.video_path
    
    def get_video_info(self):
        info = {
            "name": self.get_video_name,
            "file": self.get_video,
            "path": self.get_video_path
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
        query = "SELECT video_name FROM video WHERE video_id = %d"
        cursor.execute(query,(self.video_id))
        video_name = cursor.fetchone()['video_name']
        return video_name
    
    def update_video_name(self, new_name: str):
        self.video_name = new_name
        success = self.save_video_name()
        return success
        
    def get_video_path(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT video_path FROM video WHERE video_id = %d"
        cursor.execute(query,(self.video_id))
        video_path = cursor.fetchone()['video_path']
        return video_path
    
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
    
    def get_bbox_data(self, frame_num = None):
        # Output format: [{"frame_num": 0, "class_name": abc, "coordinates": (x, y, w, h)}, ...]
        if frame_num:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT frame_num, class, coordinates FROM video WHERE video_id = %d AND frame_num = %d"
            cursor.execute(query,(self.video_id, frame_num))
            bbox_data = cursor.fetchall()
        else:
            # fetch all if frame_num is not specified
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            query = "SELECT frame_num, class, coordinates FROM video WHERE video_id = %d"
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
        last_annotated_frame=None
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "SELECT annotation_status,last_annotated_frame FROM video WHERE video_id = %d"
        cursor.execute(query,(self.video_id))
        data = cursor.fetchone()
        annotation_status = data['annotation_status']
        last_annotated_frame = data['last_annotated_frame']
        return annotation_status, last_annotated_frame
    
    ###### Selecting Frame for Manual Annotation ######
    # For testing purpose, annotate every second
    def get_next_frame_to_annotate(self):
        self.frame_count = self.get_frame_count()
        self.fps = self.get_fps()
        if self.annotation_status == "yet to start":
            self.last_annotated_frame = 0
            self.save_last_annotated_frame()
            print(f"Fetching frame {self.last_annotated_frame}")
            return self.get_frame(0)
        elif self.annotation_status == "completed":
            print("No frame fetched. Annotation completed.")
            return None
        elif isinstance(self.last_annotated_frame, int):
            next_frame = self.last_annotated_frame + self.fps
            print(f"Fetching frame {next_frame}")
            
            # Save the frame_num pointer
            self.last_annotated_frame = next_frame
            self.save_last_annotated_frame()
            
            if next_frame < self.frame_count:
                return self.get_frame(next_frame)
            else:
                # no more frames to annotate
                self.annotation_status = "manual annotation completed"
                self.save_annotation_status()
                print("No frame fetched. AManual anotation completed.")
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

            # Save data
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
        query = "UPDATE video SET video_path = %s WHERE video_id = %d"
        cursor.execute(query,(self.video_path, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save video name to database
    def save_video_name(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET video_name = %s WHERE video_id = %d"
        cursor.execute(query,(self.video_name, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save annotation status to database
    def save_annotation_status(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET annotation_status = %s WHERE video_id = %d"
        cursor.execute(query,(self.annotation_status, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    # Save last annotated frame to database
    def save_last_annotated_frame(self):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "UPDATE video SET last_annotated_frame = %d WHERE video_id = %d"
        cursor.execute(query,(self.last_annotated_frame, self.video_id))
        success = bool(cursor.rowcount)
        cursor.close()
        return success
    
    def save_bbox_data(self, frame_num, class_name, coordinates):
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        query = "INSERT INTO bbox (frame_num, class_name, coordinate, video_id) VALUES (%d, %s, %s, %d)"
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

        ### db ###
        user = User(userID)
        owned_projects = user.get_owned_projects()
        shared_projects = user.get_shared_projects()
        
        return {
            "owned projects": owned_projects,
            "shared projects": shared_projects
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get project details when loading dashboard
# Input: Project ID
# Output: {"project name": project_name, "project type": project_type, "video count": video_count, "status": project_status}

@app.post("/get_project_details")
async def get_project_details(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)
        project_details = {
            "project name": project.get_project_name(),
            "project type": project.get_project_type(),
            "video count": project.get_video_count(),
            "status": project.get_project_status()
        }

        return project_details

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Create new project
@app.post("/create_project")
async def create_project(request: CreateProjectRequest):
    try:
        userID = request.userID
        project_name = request.project_name
        project_type = request.project_type

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
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
        
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
    try:
        if not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file type.")
        
        video = Video(project_id=project_id, initialize=True)
        name, ext = os.path.splitext(file.filename)
        video_id, file_location = video.initialize(name, ext)

        # Change project status to "Awaiting Labelling"
        video.project_status = "Awaiting Labelling"
        video.save_project_status()
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "message": f"file '{file.filename}' saved at '{file_location}'",
            "video_id": video_id,
            "video_path": file_location
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get all uploaded videos for a project
# Output: videos_info = [{"name": video_name, "file": video, "path": video_path}, ... ]
@app.post("get_uploaded_videos")
def get_uploaded_videos(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)
        videos_info = project.get_uploaded_videos()
        return videos_info
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

##################### Page 4 - Annotation #####################

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

@app.post("/get_next_frame_to_annotate")
async def get_next_frame_to_annotate(request: VideoRequest):
    try:
        video = Video(project_id = request.project_id, video_id = request.video_id)
        next_frame = video.get_next_frame_to_annotate()
        
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

@app.post("/annotate")
async def annotate(request: AnnotationRequest):
    try:
        video = Video(project_id = request.project_id, video_id = request.video_id)
        for bbox in request.bboxes:
            success = video.annotate(request.frame_num, bbox)
        
        data_saved = False
        while data_saved:
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

        # Get training profress
        status = project.get_project_status
        progress = project.get_training_progress() # progress is an int (0 - 100) representing the % of completion

        return {
            "success": True,
            "status": status,
            "progress": progress
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
##################### Page 6 - Deployment #####################

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

@app.post("/get_model_path")
async def get_model_path(request: ProjectRequest):
    try:
        project = Project(project_id = request.project_id)

        # Get model paths
        model_path = project.get_model_path()

        return {
            "success": True,
            "model path": model_path
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
