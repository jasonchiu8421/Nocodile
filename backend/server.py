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
import hashlib
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

@app.post("/login")
async def login(request: ProjectRequest):
    try:
        success = ???

        return {
            "success": True
        }

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
