import logging
from fastapi import FastAPI, Request, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import base64
import os
import uuid
import numpy as np
import cv2
from PIL import Image
import io
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms
from torch.utils.data import Dataset, DataLoader, TensorDataset
import torch.nn.functional as F

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用实例
app = FastAPI()

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrainRequest(BaseModel):
    dataset: Dict[str, str]

class ImagePreprocessRequest(BaseModel):
    image_path: str
    options: Dict[str, any]

class TrainingRequest(BaseModel):
    preprocessed_images: List[str]
    labels: List[int]
    training_options: Dict[str, any] = {
        "learning_rate": 0.001,
        "epochs": 10,
        "optimizer": "adam",  # 可选: "sgd", "adam", "adagrad"
        "batch_size": 32
    }

class PredictionRequest(BaseModel):
    image: str
    model_path: str

class DigitCNN(nn.Module):
    def __init__(self):
        super(DigitCNN, self).__init__()
        # 第一个卷积层: 1通道输入（灰度图）, 32个卷积核, 3x3卷积核
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        # 第二个卷积层: 32通道输入, 64个卷积核
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        # 全连接层
        self.fc1 = nn.Linear(64 * 7 * 7, 128)  # 7x7是经过两次池化后的大小
        self.fc2 = nn.Linear(128, 10)  # 10个类别（0-9）
        
        self.pool = nn.MaxPool2d(2, 2)  # 2x2池化层
        self.dropout = nn.Dropout(0.25)
        
    def forward(self, x):
        # 第一个卷积块
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        # 第二个卷积块
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        # 展平
        x = x.view(-1, 64 * 7 * 7)
        # 全连接层
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

class CustomDataset(Dataset):
    def __init__(self, images, labels, transform=None):
        self.images = images
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        image = self.images[idx]
        label = self.labels[idx]
        if self.transform:
            image = self.transform(image)
        return image, label

def save_images_to_folder(image_dict: Dict[str, str]) -> List[str]:
    """
    Save base64 encoded images to the datasets folder
    Takes a dictionary of image names to base64 data
    Returns list of saved file paths
    """
    os.makedirs("datasets", exist_ok=True)
    
    saved_paths = []
    for img_name, img_data in image_dict.items():
        if "," in img_data:
            img_data = img_data.split(",")[1]
        
        try:
            img_bytes = base64.b64decode(img_data)
            
            # Use the provided image name but ensure it has a valid extension
            if not any(img_name.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
                filename = f"{img_name}.png"
            else:
                filename = img_name
                
            # Ensure the filename is unique by adding a UUID if needed
            if os.path.exists(os.path.join("datasets", filename)):
                name, ext = os.path.splitext(filename)
                filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
                
            file_path = os.path.join("datasets", filename)
            
            with open(file_path, "wb") as f:
                f.write(img_bytes)
                
            saved_paths.append(file_path)
        except Exception as e:
            print(f"Error saving image '{img_name}': {str(e)}")
    
    return saved_paths

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    body = request._body.decode() if hasattr(request, "_body") else ""
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(f"Request body: {body[:100]}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

@app.post("/train")
async def train(request: TrainRequest):
    """
    Train endpoint that accepts:
    - dataset: Dictionary of image name to URL encoded images
    """
    # Save images to datasets folder
    saved_paths = save_images_to_folder(request.dataset)
    
    logger.info(f"Saved images to: {saved_paths}")
    
    return {
        "status": "success",
        "message": f"Training initiated with {len(request.dataset)} images",
    }

def preprocess_image(image_path: str, options: Dict[str, any]) -> str:
    """
    预处理图像
    """
    img = cv2.imread(image_path)
    
    # 根据选项进行预处理
    if options.get("resize"):
        size = options["resize"]
        img = cv2.resize(img, (size, size))
    
    if options.get("grayscale"):
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    if options.get("normalize"):
        img = img / 255.0
    
    # 保存预处理后的图像
    output_path = f"preprocessed_{os.path.basename(image_path)}"
    cv2.imwrite(os.path.join("preprocessed", output_path), img)
    
    return output_path

def train_model(images: List[str], labels: List[int], training_options: Dict[str, any]) -> Dict:
    """
    训练手写数字识别CNN模型
    
    参数:
    - images: 预处理后的图像路径列表
    - labels: 对应的标签列表 (0-9)
    - training_options: 训练参数
        - learning_rate: 学习率
        - epochs: 训练轮数
        - optimizer: 优化器类型 ("sgd", "adam", "adagrad")
        - batch_size: 批次大小
    """
    # 数据预处理转换
    transform = transforms.Compose([
        transforms.Grayscale(),  # 转换为灰度图
        transforms.Resize((28, 28)),  # MNIST标准大小
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))  # 标准化
    ])
    
    # 加载数据
    images_data = []
    for img_path in images:
        img = Image.open(img_path)
        img_tensor = transform(img)
        images_data.append(img_tensor)
    
    # 转换为张量
    images_tensor = torch.stack(images_data)
    labels_tensor = torch.tensor(labels, dtype=torch.long)
    
    # 创建数据集和数据加载器
    dataset = TensorDataset(images_tensor, labels_tensor)
    dataloader = DataLoader(
        dataset, 
        batch_size=training_options.get("batch_size", 32),
        shuffle=True
    )
    
    # 创建模型
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DigitCNN().to(device)
    
    # 损失函数
    criterion = nn.CrossEntropyLoss()
    
    # 选择优化器
    lr = training_options.get("learning_rate", 0.001)
    optimizer_name = training_options.get("optimizer", "adam").lower()
    
    if optimizer_name == "sgd":
        optimizer = optim.SGD(model.parameters(), lr=lr, momentum=0.9)
    elif optimizer_name == "adam":
        optimizer = optim.Adam(model.parameters(), lr=lr)
    elif optimizer_name == "adagrad":
        optimizer = optim.Adagrad(model.parameters(), lr=lr)
    else:
        raise ValueError(f"不支持的优化器类型: {optimizer_name}")
    
    # 训练过程
    epochs = training_options.get("epochs", 10)
    accuracies = []
    losses = []
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, targets in dataloader:
            inputs, targets = inputs.to(device), targets.to(device)
            
            # 梯度清零
            optimizer.zero_grad()
            
            # 前向传播
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            
            # 反向传播和优化
            loss.backward()
            optimizer.step()
            
            # 统计
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += targets.size(0)
            correct += (predicted == targets).sum().item()
        
        # 计算epoch的准确率和损失
        epoch_accuracy = 100 * correct / total
        epoch_loss = running_loss / len(dataloader)
        
        accuracies.append(epoch_accuracy)
        losses.append(epoch_loss)
        
        logger.info(f'Epoch {epoch+1}/{epochs}: '
                   f'Loss = {epoch_loss:.4f}, '
                   f'Accuracy = {epoch_accuracy:.2f}%')
    
    # 保存模型
    model_path = f"model_digits_{uuid.uuid4().hex[:8]}.pth"
    torch.save({
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'epochs': epochs,
        'final_accuracy': accuracies[-1]
    }, model_path)
    
    return {
        "status": "success",
        "model_path": model_path,
        "accuracies": accuracies,
        "losses": losses,
        "final_accuracy": accuracies[-1],
        "training_options": {
            "learning_rate": lr,
            "optimizer": optimizer_name,
            "epochs": epochs,
            "batch_size": training_options.get("batch_size", 32)
        }
    }

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    处理图片上传
    """
    file_location = f"datasets/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(await file.read())
    
    return {
        "status": "success",
        "file_path": file_location,
        "message": f"Successfully uploaded {file.filename}"
    }

@app.post("/preprocess")
async def preprocess(request: ImagePreprocessRequest):
    """
    处理图像预处理请求
    """
    try:
        preprocessed_path = preprocess_image(request.image_path, request.options)
        
        # 读取预处理后的图像并转换为base64
        with open(preprocessed_path, "rb") as img_file:
            img_data = base64.b64encode(img_file.read()).decode()
        
        return {
            "status": "success",
            "preprocessed_image": img_data,
            "preprocessed_path": preprocessed_path
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/train")
async def train(request: TrainingRequest):
    """
    处理模型训练请求
    """
    try:
        result = train_model(
            request.preprocessed_images,
            request.labels,
            request.training_options
        )
        
        return {
            "status": "success",
            "model_path": result["model_path"],
            "accuracies": result["accuracies"],
            "losses": result["losses"],
            "final_accuracy": result["final_accuracy"],
            "training_options": result["training_options"]
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

@app.post("/predict")
async def predict(request: PredictionRequest):
    """
    处理预测请求，返回预测的数字和每个数字的概率分布
    """
    try:
        # 加载模型
        model = DigitCNN()
        model.load_state_dict(torch.load(request.model_path)['model_state_dict'])
        model.eval()
        
        # 处理输入图像
        image_data = base64.b64decode(request.image.split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        
        # 预处理图像
        transform = transforms.Compose([
            transforms.Grayscale(),
            transforms.Resize((28, 28)),
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])
        image_tensor = transform(image).unsqueeze(0)
        
     
        with torch.no_grad():
            outputs = model(image_tensor)
            # 使用softmax获取概率分布
            probabilities = F.softmax(outputs, dim=1)
            # 获取最可能的类别
            _, predicted = torch.max(outputs.data, 1)
            
           
            prob_list = [round(prob.item() * 100, 4) for prob in probabilities[0]]
        
        return {
            "status": "success",
            "predicted_class": predicted.item(),
            "probabilities": {
                str(i): prob_list[i] for i in range(10)
            },
            "message": f"The prediction is: {predicted.item()}，confidence: {prob_list[predicted.item()]:.2f}%"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
