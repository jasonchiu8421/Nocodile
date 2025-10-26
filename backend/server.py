import logging
from fastapi import FastAPI, Request, status, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import os
import pymysql

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
        userlogin = UserLogin(username, password)
        success, message = userlogin.login()

        if success:
            # if status is True, get userID from database, else None
            userID = userlogin.get_userID()

            # Ask Jimmy
            # # Get all project IDs for this user
            # project_ids = []
            # if userID:
            #     try:
            #         cursor = connection.cursor(pymysql.cursors.DictCursor)
                    
            #         # Get owned projects
            #         owned_query = """
            #             SELECT project_id, project_name, project_type, 
            #                    (SELECT COUNT(*) FROM video WHERE project_id = p.project_id) as video_count,
            #                    (SELECT COUNT(*) FROM image WHERE project_id = p.project_id) as image_count,
            #                    project_status as status, 'owned' as ownership
            #             FROM project p 
            #             WHERE project_owner_id = %s
            #         """
            #         cursor.execute(owned_query, (userID,))
            #         owned_projects = cursor.fetchall()
                    
            #         # Get shared projects
            #         shared_query = """
            #             SELECT p.project_id, p.project_name, p.project_type,
            #                    (SELECT COUNT(*) FROM video WHERE project_id = p.project_id) as video_count,
            #                    (SELECT COUNT(*) FROM image WHERE project_id = p.project_id) as image_count,
            #                    p.project_status as status, 'shared' as ownership,
            #                    ps.permissions, u.username as owner_username
            #             FROM project p
            #             JOIN project_shares ps ON p.project_id = ps.project_id
            #             JOIN user u ON p.project_owner_id = u.user_id
            #             WHERE ps.shared_with_user_id = %s
            #         """
            #         cursor.execute(shared_query, (userID,))
            #         shared_projects = cursor.fetchall()
                    
            #         # Combine all projects
            #         all_projects = owned_projects + shared_projects
                    
            #         # Format project data
            #         project_ids = []
            #         for project in all_projects:
            #             project_data = {
            #                 "project_id": project['project_id'],
            #                 "project_name": project['project_name'],
            #                 "project_type": project['project_type'],
            #                 "video_count": project['video_count'] or 0,
            #                 "image_count": project['image_count'] or 0,
            #                 "status": project['status'] or 'Active',
            #                 "ownership": project['ownership']
            #             }
            #             project_ids.append(project_data)
                    
            #         cursor.close()
                    
            #     except Exception as e:
            #         print(f"Error fetching user projects: {e}")
            #         # Continue with empty project list if there's an error
            #         project_ids = []

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
        insert_query = """
            INSERT INTO user (username, password) 
            VALUES (%s, %s)
        """
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
        for project_id in owner_project_ids:
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
        
        video = Video(project_id=project_id, initialize=True)
        name, ext = os.path.splitext(file.filename)
        video_id, file_location = video.initialize(name, ext)

        # Change project status to "Awaiting Labelling"
        video.project_status = "Awaiting Labelling"
        video.save_project_status()
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
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
    
# Ask Jimmy (Why need this?)
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
    
class AnnotationRequest(BaseModel):
    project_id: int
    video_id: int
    frame_num: int
    bboxes: list  # List of bounding boxes, each box is [class_name, x, y, w, h]

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

# Get model path
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