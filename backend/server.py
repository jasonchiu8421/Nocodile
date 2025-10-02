import logging
from fastapi import FastAPI, Request, status, Depends, HTTPException, Cookie, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response
from pydantic import BaseModel
from typing import Dict, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from flask import Flask, jsonify, request
from mysql.connector import Error
import shutil
import uiud
import cv2
import pandas as pd
import os
from cv_models import KCF, SAM
import numpy as np
import base64
import aiofiles
import mysql.connector

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
    coordinates: list

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    def get_username(self):
        ### db ###
        DB_CONFIG ={
            'host': 'localhost',
            'database': 'your_database',
            'user': 'your_username',
            'password': 'your_password'
        }
        connection= None
        username=None
        try:
            connection = mysql.connector.connect(**DB_CONFIG)
            if connection.is_connected():
                cursor = connection.cursor()
                query= "SELECT username FROM user WHERE user_id =%s"
                cursor.execute(query, (user_id,))
                result = cursor.fetchone()
                if result:
                    username=result[0]
        except Error as e:
            print(f"Database Error: {e}")
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()               
        return username

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
            self.status = "Not started" # can be "Awaiting Labeling", "Labeling in progress", "Data is ready", "Training in progress", "Trained"
        else:
            self.status = self.get_status()
    
    def project_name_exists(self):
        ### db ###
        return False
    
    def get_project_name(self):
        ### db ###
        query = "SELECT project_name FROM project WHERE project_id = %s"
        project_name = self._fetch_scalar(query, (self.project_id,))
        return project_name
    
    def get_project_type(self):
        ### db ###
        project_type = "YOLO object detection"
        query = "SELECT project_type FROM project WHERE project_id = %s"
        project_type = self._fetch_scalar(query, (self.project_id,))
        project_type = "YOLO object detection"
        return project_type
    
    def get_videos(self):
        ### db ###
        video1 = "### db video1ID ###"
        video2 = "### db video2ID ###"
        conn = None
        cursor= None
        conn=mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database
        )
        cursor=conn.cursor()
        if self.project_id is not None:
            query = "SELECT video_id FROM video WHERE project_id = %s ORDER BY video_id ASC"
            cursor.execute(query, (self.project_id,))
        else:
            query = "SELECT video_id FROM video ORDER BY video_id ASC"
            cursor.execute(query)
        rows = cursor.fetchall()
        return [video1, video2, ...]
    
    def get_video_count(self):
        video_count = len(self.videos)
        return video_count
    
    def get_owner(self):
        # return owner userID
        ### db ###
        ownerID = "### owner ID ###"
        ownerID = "### owner ID ###"
        query = "SELECT project_owner_id FROM project WHERE project_id = %s"
        ownerID = self._fetch_scalar(query, (self.project_id,)）
        return ownerID
    
    def get_shared_users(self):
        # return shared users' userID (excluding owner)
        ### db ###
        shared_users = ["### user1 ID ###", "### user2 ID ###", ...]
        conn= None
        cursor= None
        shared_users = ["### user1 ID ###", "### user2 ID ###", ...]
        conn = mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database
        )
        cursor = conn.cursor()
        query = """
                SELECT DISTINCT user_id
                FROM project_shared_users
                WHERE project_id = %s AND user_id <> %s
            """
        cursor.execute(query, (self.project_id, self.owner_user_id))
        rows = cursor.fetchall()
        return shared_users
    
    def get_classes(self):
        ### db ###
        classes = {0: "class1", ...}
        return classes
    
    def get_status(self):
        ### db ###
        ### Project_status can be "Not started", "Awaiting Labeling", "Labeling in progress", "Data is ready", "Training in progress", "Trained" ###
        query = "SELECT project_status FROM project WHERE project_id = %s"
        project_status = self._fetch_scalar(query, (self.project_id,))   
        return project_status
    
    def get_project_details(self):
        details = {
            "project name": self.project_name,
            "project type": self.project_type,
            "video count": self.video_count,
            "videos": self.videos,
            "owner": self.owner,
            "shared users": self.shared_users,
            "status": self.status
        }
        return details
        
    def get_project_path(self):
        ### db change the path if needed ###
        project_path = f"./{self.projectID}/"
        query = "SELECT dataset_path FROM project WHERE project_id = %s"
        project_path = self._fetch_scalar(query, (self.project_id,))
        if not os.path.exists(project_path):
            os.makedirs(project_path)
        return project_path
        
    def get_class_ids(self):
        ### db ###
        return class_ids
    
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

        for videoID in self.videos:
            video = Video(self.projectID, videoID)

            # Write labels
            bbox_data = video.get_bbox_data()
            for data in bbox_data:
                # bbox_data = [[frame_num, class_name, coordinates]]
                frame_num = data[0]
                class_name = data[1]
                coordinates = data[2]

                if not isinstance(coordinates, str):
                    raise ValueError(f"Video {video.videoID} has unannotated frames. Please complete annotation before creating dataset.")
                
                ### db change path if necessary ###
                filename = f"{label_dir}{video.videoID}_frame_{frame_num}.txt"

                with open(filename, 'a') as file:
                    file.write(f"{class_id_dict[class_name]} {coordinates}\n")

            # Write images
            cap = cv2.VideoCapture(video.get_video_path())
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                image_path = f"{image_dir}{video.videoID}_frame_"+str(frame_idx)+".png"
                cv2.imwrite(image_path, frame)
                frame_idx += 1

        return True
    
    def get_auto_annotation_progress(self):
        finished_frames = 0
        total_frames = 0
        for videoID in self.videos:
            video = Video(projectID=self.projectID, videoID=videoID)
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
        for videoID in self.videos:
            video = Video(projectID=self.projectID, videoID=videoID)
            video_info = video.get_video_info()
            videos_info.append(video_info)
        return videos_info
    
    def save_classes(self):
        ### db ###
        insert_sql= "INSERT INTO 'class'(class_name,color) VALUES(%s,%s)"
        for c in self.classes_to_save:
            cur = self.conn.cursor()
            cur.execute(insert_sql,c.get('class_name'),c.get('color'))
            self.conn.commit()
        success = True if data saved successfully else False
        return success
    
    def save_status(self):
        ### db ###
        with self.conn.cursor() as cur:
            insert_sql="INSERT INTO 'annotation_status'(annotation_status) VALUES(%s)"
            status_value=getattr(self,'status_value','default_status')
            cur.execute(insert_sql,(status_value))
        self.conn.commit()    
        success = True if data saved successfully else False
        return success
    
    def save_videos(self):
        ### db ###
        insert_sql = """
                    INSERT INTO `video` (project_id, video_path, video_name, annotation_status, last_annotated_frame, total_frames)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
        for v in getattr(self, 'videos_to_save', []):
            cur=self.conn.cursor()
            cur.execute(insert_sql, (
                v.get('project_id')
                v.get('video_path'),
                v.get('video_name'),
                v.get('annotation_status'),
                v.get('last_annotated_frame', 0),
            ))
        self.conn.commit()
        success = True if data saved successfully else False
        return success
    
    def save_video_count(self):
        ### db ###
        success = True if data saved successfully else False
        return success
    
    def save_project_name(self):
        ### db ###
        connection=None
        success=False
        with connection.cursor() as cursor:
            sql="INSERT INTO my_project_name('project_name')VALUES(%s)"
            cursor.execute(sql,('project_name,'))
        connection.commit()
        success = True if data saved successfully else False
        return success
        success = True if data saved successfully else False
        return success
    
    def save_project_type(self):
        ### db ###
        connection=None
        success=False
        with connection.cursor() as cursor:
            sql="INSERT INTO {self.project_type} (project_type) VALUES(%s)"
            cursor.execute(sql,('project_type,'))
        connection.commit()
        success = True if data saved successfully else False
        return success

    def save_class_ids(self, class_id_dict):
        # class_id_dict = {name1: 0, name2: 1, ...}
        # save to the classes table
        success = True if data saved successfully else False
        return success
    
class Video(Project):
    def __init__(self, projectID: str, videoID, bbox_data_path=None, video_path=None, initialize=False):
        super().__init__(projectID)
        self.videoID = videoID
        if not video_path:
            self.video_path = self.get_video_path()
        else:
            self.video_path = video_path
            self.save_video_path()
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
            self.save_annotation_status()
            self.save_last_annotated_frame()
        else:
            self.annotation_status, self.last_annotated_frame = self.get_annotation_status()
        if initialize:
            self.initialize_bbox_data()
        self.cap = cv2.VideoCapture(self.video_path)
    
    def get_video_info(self):
        info = {
            "video name": self.get_video_name,
            "video": self.get_video,
            "video path": self.get_video_path
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
        ### db ###
        video_name = "Untitled"
        return video_name
    
    def update_video_name(self, new_name: str):
        ### db ###
        self.video_name = new_name
        
    def get_video_path(self):
        ### db ###
        video_path = "sample_video.mp4"
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
    
    def get_bbox_data_path(self):
        ### db ###
        name, ext = os.path.splitext(self.video_path)
        bbox_data_path = f"{name}_bbox.csv"

        # For testing purpose, use fixed path
        bbox_data_path = "user_bounded_data.csv"
        ##############################################

        return bbox_data_path
    
    def get_bbox_data(self):
        # Output format: {frame_num: (x, y, w, h), ...}
        if os.path.exists(self.bbox_data_path):
            df = pd.read_csv(self.bbox_data_path)
            bbox_data = df['bbox'].to_dict()
        else:
            bbox_data = [None in range(self.frame_count)]
        return bbox_data
    
    def get_annotation_status(self):
        ### db ###
        ### status can be "yet to start", "manual annotation in progress", "auto annotation in progress", "completed" ###
        ### default is "yet to start" ###
        ### last_annotated_frame is the last frame number that has been annotated (0-indexed) ###
        ### default is None, not 0 ###
        return annotation_status, last_annotated_frame
    
    ###### Selecting Frame for Manual Annotation ######
    # For testing purpose, annotate every second
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
                # no more frames to annotate
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
    
    def annotate(self, frame_num: int, coordinates: list):
        try:
            self.annotation_status = "manual annotation in progress"
            if frame_num < 0 or frame_num >= self.frame_count:
                raise ValueError("Frame number out of range")
            width, height = self.resolution
            x, y, w, h = coordinates[1:5]
            x_center, y_center = x + w/2, y + h/2
            x_normalized, y_normalized, w_normalized, h_normalized = x_center/width, y_center/height, w/width, h/height
            self.bbox_data[frame_num].append(f"{coordinates[0]} {x_normalized} {y_normalized} {w_normalized} {h_normalized}")
            self.last_annotated_frame = frame_num
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
        
        df = pd.read_csv(self.user_bounded_data_path)

        # Find all annotated frames
        annotated_frames = [index for index, row in df.iterrows() if isinstance(df.iloc[index]["bbox"], str)]

        # Loop through each segment between annotated frames
        for i in range(len(annotated_frames) - 1):
            starting_frame_num = annotated_frames[i]
            ending_frame_num = annotated_frames[i + 1]
            print(f"Auto-annotating frames from {starting_frame_num} to {ending_frame_num}...")

            # Convert the bbox string to a tuple of integers
            starting_frame_bbox = tuple(df.iloc[starting_frame_num]["bbox"])

            # Perform KCF tracking on the first 60 frames
            kcf_tracker = KCF(video_path=self.video_path)
            tracking_results = kcf_tracker.predict_frames(starting_frame_bbox=starting_frame_bbox, starting_frame_num=starting_frame_num, ending_frame_num=ending_frame_num)

            # Find the correct segment for each unbounded frame
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
                    
                    # Find the best matching box using IoU
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

                    # Save the number of frame in progress
                    self.last_annotated_frame = index
                    self.save_last_annotated_frame()

        cap.release()
        df.to_csv(self.user_bounded_data_path, index=False)

        self.annotation_status = "completed"

        return True

    # Save video path to database
    def save_video_path(self):
        ### db ###
        success = True if data saved successfully else False
        return success
    
    # Save video name to database
    def save_video_name(self):
        ### db ###
        success = True if data saved successfully else False
        return success
    
    # Save annotation status to database
    def save_annotation_status(self):
        ### db ### 
        success = True if data saved successfully else False
        return success
    
    # Save last annotated frame to database
    def save_last_annotated_frame(self):
        ### db ###
        success = True if data saved successfully else False
        return success
    
    # Initialize bbox data database
    def initialize_bbox_data(self):
        self.bbox_data = [[] for _ in range(self.frame_count)]
        ### db ###
        success = True if bbox data table created successfully else False
        return success
    
    def update_bbox_data(self, frame_num: int):
        ### db ###
        # Only update the bbox data for the specified frame_num
        success = True if data saved successfully else False
        return success

class ModelTraining(Project):
    def __init__(self, projectID: str):
        super().__init__(projectID)
    
    def train(self):
        ### YOLO ###
        
        return True, model_save_path

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
@app.post("/login")
async def login(request: LoginRequest):
    try:
        username = request.username
        password = request.password

        ### db ###
        # if username and password are correct, return True, else False
        status = True if "### username and passowrd are correct ###" else False
        # if status is True, get userID from database, else None
        userID = "### userID from database ###" if status else None

        return {
            "status": status,
            "userID": userID
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
################ Page 2 - Project Management #####################

# Get all projects IDs for a user
@app.post("/get_projects_info")
async def get_project_info(request: UserRequest):
    try: 
        userID = request.userID

        ### db ###
        owned_projects = ["project1 ID", ...]
        shared_projects = ["project2 ID", ...]
        
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

# Create new project
@app.post("/create_project")
async def create_project(request: CreateProjectRequest):
    try:
        userID = request.userID
        project_name = request.project_name
        project_type = request.project_type

        ### db ###
        # check if project_name already exists for this user
        project_name_exists = False if "### project name does not exist ###" else True
        if project_name_exists:
            return {
                "success": False,
                "message": "Project name already exists."
            }
        
        # create new project in database and get projectID
        projectID = "### new projectID ###"

        # initialize project
        project = Project(projectID=projectID, project_name=project_name, project_type=project_type, owner=userID, initialize=True)
        
        # create project directory
        project_path = project.get_project_path()

        # save project to database
        data_saved = False 
        while data_saved:
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

# Change project name
@app.post("/change_project_name")
async def change_project_name(request: ProjectRequest, new_name: str):
    try:
        project = Project(projectID = request.projectID)
        
        # check if new_name already exists for this user
        project_name_exists = False if "### project name does not exist ###" else True
        if project_name_exists:
            return {
                "success": False,
                "message": "Project name already exists."
            }
        
        success = project.change_project_name(new_name)
        
        data_saved = False
        while data_saved:
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
    
################ Page 3 - Video Upload & Management #####################

# Upload video
@app.post("/upload")
async def upload(projectID: str, file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file type.")
        
        videoID = "### db ### generate new videoID ###"
        
        ### db change path if necessary ###
        name, ext = os.path.splitext(file.filename)
        project_path = video.get_project_path()
        file_location = f"{project_path}/{videoID}.{ext}"
        
        video = Video(projectID=projectID, videoID=videoID, video_path=file_location, initialize=True)
        
        data_saved = False
        while data_saved:
            data_saved = video.save_video_path()
        
        video.super.video_count += 1
        video.super.videos.append(videoID)

        data_saved = False
        while data_saved:
            data_saved = video.super.save_video_count()
            data_saved = data_saved and video.super.save_videos()
        
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

# Get all uploaded videos for a project
@app.post("get_uploaded_videos")
def get_uploaded_videos(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)
        videos_info = project.get_uploaded_videos()
        return {
            "success": True,
            "videos": videos_info
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

##################### Page 4 - Annotation #####################

@app.post("/add_class")
async def add_class(request: ProjectRequest, class_name: str):
    try:
        project = Project(projectID = request.projectID)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(class_name)
        if class_name_exists:
            return {
                "success": False,
                "message": "Class name already exists.",
                "classes": project.classes
            }
        
        project.add_class(class_name)
        data_saved = False
        while data_saved:
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
        data_saved = False
        while data_saved:
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
async def add_class(request: ProjectRequest, class_name: str):
    try:
        project = Project(projectID = request.projectID)
        
        # check if class_name already exists for this project
        class_name_exists = project.check_class_exists(class_name)
        if not class_name_exists:
            return {
                "success": False,
                "message": "Class does not exists.",
                "classes": project.classes
            }
        
        project.delete_class(class_name)
        data_saved = False
        while data_saved:
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

@app.post("/get_next_frame_to_annotate")
async def get_next_frame_to_annotate(request: VideoRequest):
    try:
        video = Video(projectID = request.projectID, videoID = request.videoID)
        next_frame = video.get_next_frame_to_annotate()
        
        data_saved = False
        while data_saved:
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
            # check if video is ready for auto-annotation
            if video.annotation_status == "completed":
                continue
            elif video.annotation_status != "manual annotation completed":
                return {
                    "success": False,
                    "message": f"Video {videoID} is not ready for auto-annotation. Please complete manual annotation first.",
                    "dataset_path": None
                }
            
            # perform auto-annotation
            success = False
            while not success:
                video = Video(projectID = request.projectID, videoID = videoID)
                success = video.auto_annotate()

                data_saved = False
                while data_saved:
                    data_saved = video.save_data()

        # check if all videos are annotated
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
    
@app.post("/train")
async def train(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)

        ## YOLO ##
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
