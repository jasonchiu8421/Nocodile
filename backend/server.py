import logging
from fastapi import FastAPI, Request, status, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import shutil
import os
import pymysql
from pathlib import Path

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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
    
# Root endpoint for server health check
@app.get("/")
async def root():
    """根路徑端點 - 用於檢查伺服器狀態"""
    return {
        "message": "Nocodile Backend Server is running!",
        "status": "active",
        "version": "1.0.0",
        "endpoints": [
            "/login",
            "/logout",
            "/register",
            "/get_projects_info",
            "/get_project_details",
            "/create_project",
            "/change_project_name",
            "/share_project",
            "/unshare_project",
            "/get_project_shares",
            "/upload",
            "/get_uploaded_videos",
            "/get_project_videos/{project_id}",
            "/get_classes",
            "/add_class",
            "/modify_class",
            "/delete_class",
            "/get_next_frame_to_annotate",
            "/check_annotation_status",
            "/annotate",
            "/next_video",
            "/create_dataset",
            "/get_auto_annotation_progress",
            "/train",
            "/get_training_progress",
            "/get_model_performance",
            "/get_model_path"
        ]
    }

#=================================== Connect to database ==========================================

# config = {
#     'host': 'localhost',
#     'user': 'root',
#     'password': '12345678',
#     'database': 'Nocodile',
#     'charset': 'utf8mb4'
# }

# try:
#     connection = pymysql.connect(**config)
#     print("数据库连接成功！")
# except pymysql.Error as e:
#     print(f"数据库连接失败: {e}")

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
        print(f"Attempting login for user: {username}")
        print(f"Password provided: {password}")

        return {
                "success": True,
                "userID": 123,
                "message": "Login successful"
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
                "message": "用戶名至少需要3个字符"
            }

        if not password:
            return {
                "success": False,
                "message": "密碼不能為空"
            }

        if len(password) < 6:
            return {
                "success": False,
                "message": "密碼至少需要6个字符"
            }

        if password != confirm_password:
            return {
                "success": False,
                "message": "密碼確認不匹配"
            }

        # Mock implementation for testing (database not connected)
        # In production, this would check the database
        return {
            "success": True,
            "message": "註冊成功",
            "userID": 456,  # Mock user ID
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

        # Mock data for testing - replace with actual database logic when available
        mock_projects = [
            {
                "id": 1,
                "name": "Traffic Detection Project",
                "videoCount": 15,
                "status": "Training",
                "isOwned": True,
                "project_id": 1,
                "project name": "Traffic Detection Project",
                "video count": 15
            },
            {
                "id": 2,
                "name": "Security Camera Analysis",
                "videoCount": 8,
                "status": "Annotation Completed",
                "isOwned": True,
                "project_id": 2,
                "project name": "Security Camera Analysis",
                "video count": 8
            },
            {
                "id": 3,
                "name": "Wildlife Monitoring",
                "videoCount": 23,
                "status": "Annotating",
                "isOwned": False,
                "project_id": 3,
                "project name": "Wildlife Monitoring",
                "video count": 23
            }
        ]

        # Separate owned and shared projects
        owned_projects = [p for p in mock_projects if p["isOwned"]]
        shared_projects = [p for p in mock_projects if not p["isOwned"]]

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
        project_id = request.project_id

        # Mock data for testing - replace with actual database logic when available
        mock_project_details = {
            1: {
                "project name": "Traffic Detection Project",
                "project type": "YOLO object detection",
                "video count": 15,
                "status": "Training"
            },
            2: {
                "project name": "Security Camera Analysis",
                "project type": "YOLO object detection",
                "video count": 8,
                "status": "Annotation Completed"
            },
            3: {
                "project name": "Wildlife Monitoring",
                "project type": "YOLO object detection",
                "video count": 23,
                "status": "Annotating"
            },
            4: {
                "project name": "測試專案_1733228800",
                "project type": "YOLO object detection",
                "video count": 0,
                "status": "created"
            }
        }

        project_details = mock_project_details.get(project_id)
        if not project_details:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": f"Project {project_id} not found"}
            )

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

        # Mock implementation - return a mock project ID
        mock_project_id = max([1, 2, 3]) + 1

        logger.info(f"Project created successfully with ID: {mock_project_id}")

        return {
            "success": True,
            "message": "Project created successfully.",
            "project_id": mock_project_id
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
        project_id = request.project_id

        # Mock implementation - always succeed
        logger.info(f"Changing project {project_id} name to: {new_name}")

        return {
            "success": True,
            "message": f"Project name changed to {new_name}"
        }

    except Exception as e:
        logger.error(f"Error in change_project_name: {str(e)}")
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

        # Mock implementation
        logger.info(f"Sharing project {project_id} with {shared_with_username} ({permissions} permissions)")

        return {
            "success": True,
            "message": f"Project shared with '{shared_with_username}' successfully"
        }

    except Exception as e:
        logger.error(f"Error in share_project: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
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

        # Mock implementation
        logger.info(f"Unsharing project {project_id} with {shared_with_username}")

        return {
            "success": True,
            "message": f"Project unshared with '{shared_with_username}' successfully"
        }

    except Exception as e:
        logger.error(f"Error in unshare_project: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get project shares
@app.post("/get_project_shares")
async def get_project_shares(request: ProjectRequest):
    try:
        project_id = request.project_id

        # Mock implementation
        mock_shares = [
            {
                "id": 1,
                "permissions": "read",
                "shared_at": "2023-01-01 10:00:00",
                "username": "testuser2",
                "user_id": 456
            }
        ]

        return {
            "success": True,
            "shares": mock_shares
        }

    except Exception as e:
        logger.error(f"Error in get_project_shares: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

#=================================== Page 3 - Video Upload & Management ==========================================

class UploadRequest(BaseModel):
    project_id: int
    file: UploadFile = File(...)

# Upload video
@app.post("/upload")
async def upload(request: UploadRequest):
    try:
        project_id = request.project_id
        file = request.file

        if not file.filename.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file type.")

        # Mock implementation
        logger.info(f"Uploading file {file.filename} to project {project_id}")

        return {
            "success": True,
            "message": f"File {file.filename} uploaded successfully",
            "video_id": 1
        }

    except Exception as e:
        if len(e)>100:
            e = e[0:99] + "...(truncated)"
        logger.error(f"Upload error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get all uploaded videos for a project
@app.post("/get_uploaded_videos")
def get_uploaded_videos(request: ProjectRequest):
    try:
        project_id = request.project_id

        # Mock implementation
        mock_videos = [
            {
                "name": "sample_video.mp4",
                "video_id": 1,
                "path": f"/uploads/project_{project_id}/sample_video.mp4"
            }
        ]

        return mock_videos

    except Exception as e:
        logger.error(f"Get uploaded videos error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get project videos by project ID (RESTful endpoint)
@app.get("/get_project_videos/{project_id}")
def get_project_videos(project_id: int):
    try:
        # Mock implementation
        mock_videos = [
            {
                "name": "sample_video.mp4",
                "video_id": 1,
                "path": f"/uploads/project_{project_id}/sample_video.mp4"
            }
        ]

        return {
            "success": True,
            "videos": mock_videos
        }

    except Exception as e:
        logger.error(f"Get project videos error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

#=================================== Page 4 - Annotation ==========================================

# Get all classes of a project
@app.post("/get_classes")
async def get_classes(request:ProjectRequest):
    try:
        project_id = request.project_id

        # Mock implementation
        mock_classes = {
            "car": "#FF0000",
            "person": "#00FF00",
            "bicycle": "#DDDDDD",
            "3":"#AAAAAA"
        }

        return {
            "success": True,
            "classes": mock_classes
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Add new class to a project and return new classes list
###done jimmy
@app.post("/add_class")
async def add_class(request: ProjectRequest, class_name: str, colour: str):
    try:
        project_id = request.project_id

        # Mock implementation
        logger.info(f"Adding class '{class_name}' with color '{colour}' to project {project_id}")

        return {
            "success": True,
            "message": "Class added successfully.",
            "classes": {
                "car": "#FF0000",
                "person": "#00FF00",
                "bicycle": "#0000FF",
                ##class_name: colour
            }
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Modify class name of a project and return new classes list
@app.post("/modify_class")
async def modify_class(request: ProjectRequest, original_class_name: str, new_class_name: str):
    try:
        project_id = request.project_id

        # Mock implementation
        logger.info(f"Modifying class '{original_class_name}' to '{new_class_name}' in project {project_id}")

        return {
            "success": True,
            "message": "Class modified successfully.",
            "classes": {
                "car": "#FF0000",
                "person": "#00FF00",
                "bicycle": "#0000FF",
                new_class_name: "#FF0000"  # Assuming we change "car" to new name
            }
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Delete class of a project and return new classes list
@app.post("/delete_class")
async def delete_class(request: ProjectRequest, class_name: str):
    try:
        project_id = request.project_id

        # Mock implementation
        logger.info(f"Deleting class '{class_name}' from project {project_id}")

        return {
            "success": True,
            "message": "Class deleted successfully.",
            "classes": {
                "person": "#00FF00",
                "bicycle": "#0000FF"
                ##"car" is removed
            }
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
        project_id = request.project_id
        video_id = request.video_id

        # Mock implementation
        mock_frame_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yAAAAABJRU5ErkJggg=="

        return {
            "success": True,
            "message": "Next frame fetched successfully.",
            "image": mock_frame_data,
            "frame_num": 1
        }

    except Exception as e:
        logger.error(f"Get next frame error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Check annotation status of a video
@app.post("/check_annotation_status")
async def check_annotation_status(request: VideoRequest):
    try:
        project_id = request.project_id
        video_id = request.video_id

        # Mock implementation
        return {
            "annotation status": "in_progress",
            "last annotated frame": 15
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

class AnnotationRequest(BaseModel):
    project_id: int
    video_id: int
    frame_num: int
    bboxes: list  # List of bounding boxes, each box is [class_name, x, y, w, h]

# Save annotation for a frame
@app.post("/annotate")
async def annotate(request: AnnotationRequest):
    try:
        project_id = request.project_id
        video_id = request.video_id
        frame_num = request.frame_num
        bboxes = request.bboxes

        # Mock implementation
        logger.info(f"Saving annotations for frame {frame_num} in video {video_id}")

        return {
            "success": True,
            "message": "Annotation saved."
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get next video to annotate
@app.post("/next_video")
async def next_video(request: ProjectRequest, current_video_id: str):
    try:
        project_id = request.project_id

        # Mock implementation
        next_video_id = "2"  # Always return video 2 as next

        return {
            "success": True,
            "message": "Next video fetched successfully.",
            "next_video_id": next_video_id
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

#===================================     - Model Training ==========================================

# Create dataset for training
@app.post("/create_dataset")
async def create_dataset(request: ProjectRequest, background_tasks: BackgroundTasks):
    # Mock implementation - no background task needed for testing
    return {
        "success": True,
        "message": "Training started in the background."
    }

# Get auto annotation progress of a project
@app.post("/get_auto_annotation_progress")
async def get_auto_annotation_progress(request: ProjectRequest):
    try:
        project_id = request.project_id

        # Mock implementation
        progress = 75  # Mock progress percentage

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
        project_id = request.project_id

        # Mock implementation - no background task needed for testing
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
        project_id = request.project_id

        # Mock implementation
        project_status = "Training in progress"
        progress = 65  # Mock progress percentage

        return {
            "success": True,
            "status": project_status,
            "progress": progress,
            "is_completed": False
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
        project_id = request.project_id

        # Mock implementation
        performance = {
            "accuracy": 0.92,
            "precision": 0.89,
            "recall": 0.94,
            "f1_score": 1
        }

        return {
            "success": True,
            "model performance": performance
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

# Get model path
@app.post("/get_model")
async def get_model(request: ProjectRequest):
    try:
        project_id = request.project_id

        # Mock implementation
        # Define model path based on project ID
        model_dir = Path(__file__).parent.resolve()
        model_path = model_dir / f"best.pt"

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