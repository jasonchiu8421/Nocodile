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

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    def get_username(self):
        ### db ###
        return username

class Project():
    def __init__(self, projectID: str):
        self.projectID = projectID
        self.project_name = "Untitled"
        if self.project_name_exists():
            self.project_name = f"{self.project_name}_{uuid.uuid4().hex[:8]}"
        self.videos = self.get_videos()
        self.video_count = self.get_video_count()
        self.owner = self.get_owner()
        self.shared_users = self.get_shared_users()
    
    def project_name_exists(self):
        ### db ###
        return False
    
    def get_videos(self):
        ### db ###
        video1 = Video(self.projectID, "### video1ID ###")
        video2 = Video(self.projectID, "### video2ID ###")
        return [video1, video2, ...]
    
    def get_video_count(self):
        video_count = len(self.videos)
        return video_count
    
    def get_owner(self):
        # return owner userID
        ### db ###
        ownerID = "### owner ID ###"
        return ownerID
    
    def get_shared_users(self):
        # return shared users' userID (excluding owner)
        ### db ###
        shared_users = ["### user1 ID ###", "### user2 ID ###", ...]
        return shared_users
    
    def get_project_details(self):
        details = {
            "project name": self.project_name,
            "video count": self.video_count,
            "videos": [video.videoID for video in self.videos],
            "owner": self.owner,
            "shared users": self.shared_users
        }
        return details
    
class Video(Project):
    def __init__(self, projectID: str, videoID=None, bbox_data_path=None):
        super().__init__(projectID)
        self.videoID = videoID
        self.video_path = self.get_video_path()
        self.video_name = self.get_video_name()
        self.frame_count = self.get_frame_count()
        self.fps = self.get_fps()
        self.resolution = self.get_resolution()
        if not bbox_data_path:
            self.bbox_data_path = self.get_bbox_data_path()
        else:
            self.bbox_data_path = bbox_data_path
        self.bbox_data = self.get_bbox_data()
        self.annotation_status, self.last_annotated_frame = self.get_annotation_status()
        self.cap = cv2.VideoCapture(self.video_path)
    
    def generate_video_id(self):
        videoID = uuid.uuid4().hex
        return videoID

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
    
    def save_bbox_data(self):
        df = pd.DataFrame(self.bbox_data, columns=['bbox'])
        df.to_csv(self.bbox_data_path, index=False)
    
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
        if not ret:
            raise ValueError("Could not read frame")
        return frame
    
    def annotate(self, frame_num: int, coordinates: str):
        self.annotation_status = "manual annotation in progress"
        if frame_num < 0 or frame_num >= self.frame_count:
            raise ValueError("Frame number out of range")
        self.bbox_data[frame_num] = coordinates
        self.last_annotated_frame = frame_num
    
    def auto_annotate(self):
        self.save_bbox_data()  # Save current user-bounded data before auto-annotation
        self.annotation_status = "auto annotation in progress"
        annotator = AutoAnnotator(self.video_path, self.bbox_data_path)
        annotator.auto_annotate()
        self.annotation_status = "completed"
        return 

class AutoAnnotator():
    def __init__(self, video_path: str, user_bounded_data_path: str):
        self.video_path = video_path
        self.user_bounded_data_path = user_bounded_data_path

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

        cap.release()
        df.to_csv(self.user_bounded_data_path, index=False)

        return True

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    body = request._body.decode() if hasattr(request, "_body") else ""
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(f"Request body: {body[:100]}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

@app.post("/login")
async def login(request: LoginRequest):

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

@app.post("/get_projects_info")
async def get_project_info(request: UserRequest):

    userID = request.userID

    ### db ###
    owned_projects = ["project1 ID", ...]
    shared_projects = ["project2 ID", ...]
    
    return {
        "owned projects": owned_projects,
        "shared projects": shared_projects
    }

@app.post("/get_project_details")
async def get_project_details(request: ProjectRequest):
    project = Project(projectID = request.projectID)
    project_details = project.get_project_details()
    return project_details

@app.post("/upload")
async def upload(projectID: str, file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    
    video = Video(projectID=projectID)
    videoID = video.generate_video_id()
    name, ext = os.path.splitext(file.filename)
    file_location = f"{projectID}/{videoID}.{ext}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_location

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
