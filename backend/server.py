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
    coordinates: str

class User():
    def __init__(self, userID: str):
        self.userID = userID
        self.username = self.get_username()
    
    def get_username(self):
        ### db ###
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
        if initilize:
            self.classes = {}
        else:
            self.classes = self.get_classes()
    
    def project_name_exists(self):
        ### db ###
        return False
    
    def get_project_name(self):
        ### db ###
        return project_name
    
    def get_project_type(self):
        ### db ###
        project_type = "YOLO object detection"
        return project_type
    
    def get_videos(self):
        ### db ###
        video1 = "### db video1ID ###"
        video2 = "### db video2ID ###"
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
    
    def get_classes(self):
        ### db ###
        classes = {0: "class1", ...}
        return classes
    
    def get_project_details(self):
        details = {
            "project name": self.project_name,
            "project type": self.project_type,
            "video count": self.video_count,
            "videos": self.videos,
            "owner": self.owner,
            "shared users": self.shared_users,
            "classes": self.classes
        }
        return details
    
    def get_project_path(self):
        ### db change the path if needed ###
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
        folder_path = f"{self.get_project_path}datasets/label/_"
        for video in self.videos:
            bbox_data = video.get_bbox_data()
            for frame_num, frame_bbox in enumerate(bbox_data):
                if not isinstance(frame_bbox, str):
                    raise ValueError(f"Video {video.videoID} has unannotated frames. Please complete annotation before creating dataset.")
                
                ### db change path if necessary ###
                filename = f"{folder_path}{video.videoID}_frame{frame_num+1}.txt"
                with open(filename, 'w') as file:
                    for bbox in frame_bbox:
                        class_label = bbox["class"]
                        coordinates = bbox["coordinates"]
                        # Format: class x_min y_min x_max y_max
                        file.write(f"{class_label} {' '.join(map(str, coordinates))}\n")

        return folder_path
    
    def save_data(self):
        ### db ###
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
            self.bbox_data[frame_num] = coordinates
            self.last_annotated_frame = frame_num
            return True
        except Exception as e:
            logger.error(f"Error in annotate: {str(e)}")
            return f"Error in annotate: {str(e)}"
    
    def auto_annotate(self):
        try:
            self.save_bbox_data()  # Save current user-bounded data before auto-annotation
            self.annotation_status = "auto annotation in progress"
            annotator = AutoAnnotator(self.video_path, self.bbox_data_path)
            annotator.auto_annotate()
            self.annotation_status = "completed"
            return True
        except Exception as e:
            logger.error(f"Error in auto_annotate: {str(e)}")
            return f"Error in auto_annotate: {str(e)}"
    
    def save_data(self):
        ### db ###
        success = True if data saved successfully else False
        return success

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
    
# need confirmation with frontend about the upload file object
@app.post("/upload")
async def upload(projectID: str, file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file type.")
        
        videoID = "### generate new videoID ###"
        
        ### db change path if necessary ###
        name, ext = os.path.splitext(file.filename)
        project_path = video.get_project_path()
        file_location = f"{project_path}/{videoID}.{ext}"
        
        video = Video(projectID=projectID, videoID=videoID, video_path=file_location, initialize=True)
        
        data_saved = False
        while data_saved:
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

@app.post("/auto_annotate")
async def auto_annotate(request: VideoRequest):
    try:
        video = Video(projectID = request.projectID, videoID = request.videoID)
        success = video.auto_annotate()
        
        data_saved = False
        while data_saved:
            data_saved = video.save_data()
        
        if success:
            return {
                "success": True,
                "message": "Auto-annotation saved."
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
    
@app.post("/create_dataset")
async def create_dataset(request: ProjectRequest):
    try:
        project = Project(projectID = request.projectID)

        # check if all videos are annotated
        for videoID in project.videos:
            video = Video(projectID = request.projectID, videoID = videoID)
            if video.annotation_status != "completed":
                return {
                    "success": False,
                    "message": f"Video {videoID} is not fully annotated. Please complete annotation before creating dataset."
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
