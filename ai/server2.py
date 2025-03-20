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
import pandas as pd
import io
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms
from torch.utils.data import Dataset, DataLoader, TensorDataset
import torch.nn.functional as F
import h5py

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

# no use?
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
    
class DatasetCreator:
    def __init__(self, base_folder):
        self.base_folder = base_folder
        self.image_paths = []
        self.labels = []
        self.images = []
    
    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)

    def _load_image_paths_and_labels(self):
        # Load image paths and labels from the specified folder structure
        for label in os.listdir(self.base_folder):
            label_folder = os.path.join(self.base_folder, label)
            if os.path.isdir(label_folder):
                for img_file in os.listdir(label_folder):
                    img_path = os.path.join(label_folder, img_file)
                    self.image_paths.append(img_path)
                    self.labels.append(label)

        self.labels = np.array(self.labels)

    def load_data(self):
        # Load all images into a dataset
        if self.images == []:  # Load images only once
            self._load_image_paths_and_labels()  # Load image paths and labels
            for img_path in self.image_paths:
                image = cv2.imread(img_path)  # Load the image using cv2
                if image is not None:  # Check if the image was loaded successfully
                    self.images.append(image)
            self.images = np.array(self.images)

        return self.images, self.labels

    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)
    # images, labels = dataset_creator.load_data()

    def save_dataset(self, file_path=None):
        # Create dataset filename if not specified
        if file_path is None or file_path.strip() == "":
            directory = os.path.dirname(self.base_folder)
            file_name = os.path.splitext(os.path.basename(self.base_folder))[0] + '_dataset.h5'
            file_path = os.path.join(directory, file_name)
        
        # Save dataset
        if (self.images == None) or (self.labels == None):
            raise ValueError("Images or Labels not loaded successfully.")
        else:
            datasetloader = Dataset(self.images, self.labels)
            datasetloader.save_dataset(file_path)
            return file_path
    
    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)
    # dataset_creator.load_data()
    # name_of_saved_file = dataset_creator.save_dataset()

class Dataset:
    def __init__(self, images=None, labels=None):
        self.images = images
        self.labels = labels
        self.filename = None
    
    # Example usage
    # dataset_loader = DatasetLoader(images, labels)
    
    def save_dataset(self, file_path, images=None, labels=None):
        if images==None:
            images = self.images
        if labels==None:
            labels = self.labels
        # Avoid subscript
        base_name = file_path.split('.')[0]
        if not file_path.endswith('.h5'):
            self.filename = f"{base_name}.h5"

        if (images == None) or (labels == None):
            raise ValueError("Images or Labels not loaded successfully.")
        else:
            with h5py.File(self.filename, 'w') as h5f:
                # Save images and labels directly
                h5f.create_dataset('images', data=images, dtype='float32')
                h5f.create_dataset('labels', data=labels.astype('S'))
                print(f"Dataset saved at {file_path}.")

    # Example usage
    # dataset_loader = DatasetLoader(images, labels)
    # filename = "digits_dataset"/ filename = "digits_dataset.h5"
    # dataset_creator.save_dataset(filename)

    def get_filename(self):
        return self.filename

    def load_saved_dataset(self, filename):
        # Avoid subscript
        base_name = filename.split('.')[0]
        if not filename.endswith('.h5'):
            filename = f"{base_name}.h5"
        
        # Open the HDF5 file
        with h5py.File(filename, 'r') as h5f:
            # Load images and labels
            self.images = h5f['images'][:]
            self.labels = h5f['labels'][:]
        
        for i in range(len(self.labels)):
            self.labels[i] = self.labels[i].decode('utf-8')
        
        return self.images, self.labels

    # Example usage
    # dataset_loader = DatasetLoader()
    # images, labels = dataset_loader.load_saved_dataset('digits_dataset.h5')

    def print_shapes(self):
        if (self.images.any() == None) or (self.labels.any() == None):
            raise ValueError("Images or Labels not loaded successfully.")
        else:
            # Print the shapes of images and labels
            print("Images Shape:", self.images.shape)
            print("Labels Shape:", self.labels.shape)
            return self.images.shape, self.labels.shape
    
    # Example usage
    # dataset_loader = DatasetLoader()
    # dataset_loader.load_saved_dataset('digits_dataset.h5')
    # dataset_loader.print_shapes()

    def find_random_image_per_class(self):
        if (self.images.any() == None) or (self.labels.any() == None):
            raise ValueError("Images or Labels not loaded successfully.")
        else:
            # Print the first image for each unique label
            label_list = []
            image_list = []
            
            df = pd.DataFrame({'image': list(self.images), 'label': self.labels})

        # Get unique labels
        unique_labels = df['label'].unique()

        # Initialize lists to hold the new images and labels
        image_list = []
        label_list = []

        # For each unique label, take a random image
        for label in unique_labels:
            # Filter the DataFrame for the current label
            label_images = df[df['label'] == label]
            # Randomly select one image from the filtered DataFrame
            random_image = label_images.sample(n=1)
            image_list.append(random_image['image'])
            label_list.append(random_image['label'])

        return label_list, image_list

    # Example usage
    # dataset = Dataset()
    # dataset.load_saved_dataset('digits_dataset.h5')
    # dataset.find_random_image_per_class()

class Preprocessing:
    def __init__(self, filename=None, X=None, y=None):
        self.X = X
        self.y = y
        # filename = file name of the dataset from current directory
        if filename != None:
            dataset_loader = Dataset()
            self.X, self.y = dataset_loader.load_saved_dataset(filename)
        elif X == None:
            raise ValueError("No filename input or image input found.")
        
    def get_X(self):
        if self.X != None:
            return self.X
        else:
            raise ValueError("No images found.")

    def get_y(self):
        if self.y != None:
            return self.y
        else:
            raise ValueError("No labels found.")

    # Noise removal/ Outlier removal
    
    # Image Filtering/ Cropping
    
    # Image Resizing (allow Multi-Resolution Training)
    def resize(self, width, height):
        # Specify the new size as (width, height)
        new_size = (width, height)
        for i in range(self.X.shape[0]):
            self.X[i] = cv2.resize(self.X[i], new_size)
        return self.X

    # Grayscale Conversion
    def convert_to_grayscale(self):
        # Use the cvtColor() function to grayscale the image
        for i in range(self.X.shape[0]):
            self.X[i] = cv2.cvtColor(self.X[i], cv2.COLOR_BGR2GRAY)
        return self.X
    
    # Data Shuffling
    def shuffle_data(self):
        from sklearn.utils import shuffle
        self.X, self.y = shuffle(self.X, self.y, random_state=42)
        return self.X, self.y
    
    # Normalization
    def normalize(self):
        from sklearn.preprocessing import MinMaxScaler
        # Initialize the scaler
        scaler = MinMaxScaler()   
        # Fit and transform the data
        self.X = scaler.fit_transform(self.X)
        return self.X
    
    def save_dataset(self, filename):
        dataset = Dataset(self.X, self.y)
        dataset.save_dataset(filename)

    def save_class_example(self, filename):
        dataset = Dataset(self.X, self.y)
        images, labels = dataset.find_random_image_per_class()
        dataset.save_dataset(filename, images, labels)

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

def preprocess_image(dataset_path: str, options: Dict[str, any]) -> List:
    """
    预处理图像
    """
    preprocessing = Preprocessing(dataset_path)
    output_paths = {key: None for key in options.keys()}

    # set save option
    intermediate_save_option = "one image per class" # by default
    if options.get("save_option"):
        intermediate_save_option = options["save_option"]
    
    # 根据选项进行预处理
    for option in options:
        if option=="resize":
            size = options["resize"]
            preprocessing.resize((size, size))
        
        if option=="grayscale":
            preprocessing.convert_to_grayscale()
        
        if option=="normalize":
            preprocessing.normalize()

        if option=="shuffle":
            preprocessing.shuffle_data()
    
        # 保存预处理后的图像
        if intermediate_save_option == "whole dataset":
            output_path = option + os.path.basename(dataset_path)
            preprocessing.save_dataset(output_path)
            output_paths[option] = output_path
        elif intermediate_save_option == "one image per class":
            output_path = option + os.path.basename(dataset_path)
            preprocessing.save_class_example(output_path)
            output_paths[option] = output_path
    
    output_path = f"preprocessed_{os.path.basename(dataset_path)}"
    preprocessing.save_dataset(output_path)
    output_path["output"] = output_path

    return output_paths

def train_model(images: List[str], labels: List[int], training_options: Dict[str, any]) -> Dict:
    """
    训练CNN模型
    
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
