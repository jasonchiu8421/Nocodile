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
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.model_selection import KFold
from tensorflow.keras.layers import Lambda, Dense, Flatten, Dropout, Activation, BatchNormalization, Conv2D, MaxPooling2D, GlobalMaxPooling2D, AveragePooling2D, GlobalAveragePooling2D
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.optimizers import Adam, SGD, RMSprop, Adagrad, Adadelta, Nadam, Ftrl
from tensorflow.keras import backend as K
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.utils import to_categorical
from io import BytesIO
from PIL import Image
from sklearn.metrics import accuracy_score

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

class ImagePreprocessRequest(BaseModel):
    dataset_path: str
    options: Dict[str, any] = {
        "resize": (28,28),
        "rgb2gray": 0,
        "shuffle": 0,
        "normalize": 0,
        "save_option": "one image per class"
    }

class TrainRequest(BaseModel):
    dataset: Dict[str, str]

class TrainingRequest(BaseModel):
    preprocessed_images: List[str]
    labels: List[int]
    training_options: Dict[str, any] = {
        "method": "train_test_val",
        "layers": [{"type": "Flatten"},  {"type": "Dense", "units": 512, "activation": "relu"}, {"type": "Dense", "units": 10, "activation": "sofftmax"}],
        "optimizer": "Adam",
        "loss": "categorical_crossentropy",
        "metrics": ["accuracy"],
        "lr": 0.01,
        "epochs": 10,
        "batch_size": 64,
        "kFold_k": 5
    }

class PredictionRequest(BaseModel):
    model_path: str
    data_path: str

class DatasetCreator:
    def __init__(self, base_folder):
        self.base_folder = base_folder
        self.image_paths = []
        self.labels = []
        self.images = []

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
    
    def load_images(self):
        # List all files in the folder
        image_files = [f for f in os.listdir(self.base_folder) if f.endswith(('png', 'jpg', 'jpeg'))]
        images_array = []
        for image_file in image_files:
            # Open an image file
            img_path = os.path.join(self.base_folder, image_file)
            with Image.open(img_path) as img:
                images_array.append(np.array(img))
        self.images = np.array(images_array)
        return self.images
        
    def load_images(self, file_path):
        # Create an HDF5 file
        with h5py.File(file_path, 'w') as h5_file:                    
            # Create a dataset in the HDF5 file
            h5_file.create_dataset(file_path, data=self.images)

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

class Dataset:
    def __init__(self, images=None, labels=None):
        self.images = images
        self.labels = labels
        self.filename = None
    
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

    def _load_csv(self, filename):
        self.dataset = pd.read_csv(filename)
        self.images = (self.dataset.iloc[:,1:].values).astype('float32') # all pixel values
        self.labels = self.dataset.iloc[:,0].values.astype('int32') # only labels i.e targets digits
        return self.images, self.labels
    
    def load_images(self, filename):
        if filename.endswith('.csv'):
            images = pd.read_csv(images)
            self.images = np.array(images)
        elif filename.endswith(".h5"):
            with h5py.File(filename, 'r') as h5f:
                self.images = h5f['images'][:]
        return self.images

    def get_filename(self):
        return self.filename

    def load_saved_dataset(self, filename):
        if filename.endswith('.csv'):
            return self._load_csv(filename)

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

    def print_shapes(self):
        if (self.images.any() == None) or (self.labels.any() == None):
            raise ValueError("Images or Labels not loaded successfully.")
        else:
            # Print the shapes of images and labels
            print("Images Shape:", self.images.shape)
            print("Labels Shape:", self.labels.shape)
            return self.images.shape, self.labels.shape

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
    def noise_removal(self, alpha):
        raise NotImplementedError
    
    # Image Filtering/ Cropping
    def crop(self, size):
        raise NotImplementedError
    
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

class CNN:
    def __init__(self, X=None, y=None, model = None, method="train_test_val", layers=[{"type": "Flatten"},  {"type": "Dense", "units": 512, "activation": "relu"}, {"type": "Dense", "units": 10, "activation": "sofftmax"}], optimizer="Adam", loss="categorical_crossentropy", metrics=["accuracy"], lr=0.01, epochs=10, batch_size=64, kFold_k=5):
        self.X = X
        self.y = y
        self.model = model
        self.hist = None
        self.batches = None
        self.val_batches = None
        self.layers = layers
        self.optimizer = optimizer
        self.loss = loss
        self.metrics = metrics
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size
        self.method = method
        self.kFold_k = kFold_k
        self.loss_graph = []
        self.accuracy_graph = []
        self.loss_data = []
        self.accuracy_data = []

    def train_model(self):
        self.y = to_categorical(self.y)
        if self.method=="train_test":
            self._train_test_approach()
        elif self.method=="train_test_val":
            self._train_test_val_approach()
        elif self.method=="kFold_val":
            self._kFold_validation_approach()
        else:
            raise ValueError(f"Invalid method '{self.method}'. Expected one of: 'train_test', 'train_test_val', 'kFold_val'.")

        return self.model

    def _standardize(self, x):
        mean_px = self.X.mean().astype(np.float32)
        std_px = self.X.std().astype(np.float32)
        return (x-mean_px)/std_px
    
    # train/test approach
    def _train_test_approach(self):
        # train/test split
        seed = 43
        np.random.seed(seed)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        
        # Create Data Generator
        gen = ImageDataGenerator()
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=self.batch_size)
        self.val_batches = gen.flow(self.X_test, self.y_test, batch_size=self.batch_size)

        # Define and train model
        self._custom_model()
        
        # Plot performance of the model
        self._check_performance()

    # train/test/val
    def _train_test_val_approach(self):
        # train/val/test split
        seed = 43
        np.random.seed(seed)
        self.X_train, X_temp, self.y_train, y_temp = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        self.X_val, self.X_test, self.y_val, self.y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
        
        # Create Data Generator
        gen = ImageDataGenerator()
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=self.batch_size)
        self.val_batches=gen.flow(self.X_val, self.y_val, batch_size=self.batch_size)

        # Define and train model
        self._custom_model()
        
        # Plot performance of the model
        self._check_performance()
        test_generator = gen.flow(self.X_test, self.y_test, batch_size=self.batch_size)
        test_loss, test_accuracy = self.model.evaluate(test_generator)
        print(f'Test Loss: {test_loss:.4f}, Test Accuracy: {test_accuracy:.4f}')
    
    # k-fold CV
    def _kFold_validation_approach(self):
        # not yet finished
        kf = KFold(n_splits=self.kFOld_k, shuffle=True, random_state=42)
        
        # Create Data Generator
        gen = ImageDataGenerator()
        model_histories = []
        
        for train_index, val_index in kf.split(self.X):
            self.X_train, self.X_val = self.X[train_index], self.X[val_index]
            self.y_train, self.y_val = self.y[train_index], self.y[val_index]
            
            self.batches = gen.flow(self.X_train, self.y_train, batch_size=self.batch_size)
            self.val_batches=gen.flow(self.X_val, self.y_val, batch_size=self.batch_size)

            # Define and train model
            self._custom_model()
            
            # Plot performance of the model
            avg_loss = np.mean([history.history['loss'] for history in model_histories], axis=0)
            avg_val_loss = np.mean([history.history['val_loss'] for history in model_histories], axis=0)
            avg_accuracy = np.mean([history.history['accuracy'] for history in model_histories], axis=0)
            avg_val_accuracy = np.mean([history.history['val_accuracy'] for history in model_histories], axis=0)
            self._plot_kfold_performance(avg_loss, avg_val_loss, avg_accuracy, avg_val_accuracy)

    def _custom_model(self):
        self.model = Sequential([Lambda(self._standardize, input_shape=self.X[0].shape)])
        for layer in self.layers:
            self._add_layer(layer)

        self.model.compile(optimizer=self.optimizer, loss=self.loss, metrics=self.metrics)

        self.model.optimizer.lr=self.lr
        
        self.hist = self.model.fit(
            x=self.batches,
            steps_per_epoch=self.batches.n,
            epochs=self.epochs,
            validation_data=self.val_batches,
            validation_steps=self.val_batches.n,
            verbose=1
        )

        return self.model

    def _add_layer(self, layer):
        if layer["type"] == "Flatten":
            self.model.add(Flatten())
        elif layer["type"] == "Dense":
            if "activation" in layer and layer["activation"] is not None:
                self.model.add(Dense(layer["units"], activation=layer["activation"]))
            else:
                self.model.add(Dense(layer["units"]))
        elif layer["type"] == "Activation":
            self.model.add(Activation(layer["activation"]))
        elif layer["type"] == "Dropout":
            self.model.add(Dropout(layer["rate"]))
        elif layer["type"] == "BatchNormalization":
            self.model.add(BatchNormalization())
        elif layer["type"] == "Conv2D":
            self.model.add(Conv2D(layer["number of filters"], layer["kernel_size"], activation=layer.get("activation"), padding=layer.get("padding", "valid")))
        elif layer["type"] == "MaxPooling2D":
            self.model.add(MaxPooling2D(pool_size=layer["pool_size"]))
        elif layer["type"] == "GlobalMaxPooling2D":
            self.model.add(GlobalMaxPooling2D())
        elif layer["type"] == "AveragePooling2D":
            self.model.add(AveragePooling2D(pool_size=layer["pool_size"]))
        elif layer["type"] == "GlobalAveragePooling2D":
            self.model.add(GlobalAveragePooling2D())

    def _check_performance(self):
        history_dict = self.hist.history
        loss_values = history_dict['loss']
        val_loss_values = history_dict['val_loss']
        acc_values = history_dict['accuracy']
        val_acc_values = history_dict['val_accuracy']
        epochs = range(1, len(loss_values) + 1)

        # Save the loss and validation loss
        self.loss_data = pd.DataFrame({
            'Epoch': epochs,
            'Loss': loss_values,
            'Val_Loss': val_loss_values
        })

        # Save the accuracy and validation accuracy
        self.accuracy_data = pd.DataFrame({
            'Epoch': epochs,
            'Accuracy': acc_values,
            'Val_Accuracy': val_acc_values
        })

        # Create a figure for loss
        plt.figure(figsize=(6, 5))
        plt.plot(epochs, loss_values, 'bo', label='Training Loss')
        plt.plot(epochs, val_loss_values, 'b+', label='Validation Loss')
        plt.xlabel('Epochs')
        plt.ylabel('Loss')
        plt.title('Loss Over Epochs')
        plt.legend()
        plt.ylim(0, 1)

        # Save the loss figure
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()

        # Convert the BytesIO object to a NumPy array
        buf.seek(0)  # Move to the beginning of the BytesIO object
        image = Image.open(buf)
        self.loss_graph.append(image)

        # Create a figure for accuracy
        plt.figure(figsize=(6, 5))
        plt.plot(epochs, acc_values, 'bo', label='Training Accuracy')
        plt.plot(epochs, val_acc_values, 'b+', label='Validation Accuracy')
        plt.xlabel('Epochs')
        plt.ylabel('Accuracy')
        plt.title('Accuracy Over Epochs')
        plt.legend()
        plt.ylim(0, 1)

        # Save the accuracy figure
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()

        # Convert the BytesIO object to a NumPy array
        buf.seek(0)  # Move to the beginning of the BytesIO object
        image = Image.open(buf)
        self.accuracy_graph.append(image)
    
    def _plot_kfold_performance(self, avg_loss, avg_val_loss, avg_acc, avg_val_acc):
        epochs = range(1, len(avg_loss) + 1)

        # Save the loss and validation loss
        self.loss_data = pd.DataFrame({
            'Epoch': epochs,
            'Loss': avg_loss,
            'Val_Loss': avg_val_loss
        })

        # Save the accuracy and validation accuracy
        self.accuracy_data = pd.DataFrame({
            'Epoch': epochs,
            'Accuracy': avg_acc,
            'Val_Accuracy': avg_val_acc
        })

        # Create a figure for loss
        plt.figure(figsize=(6, 5))
        plt.plot(epochs, avg_loss, 'bo', label='Training Loss')
        plt.plot(epochs, avg_val_loss, 'b+', label='Validation Loss')
        plt.xlabel('Epochs')
        plt.ylabel('Loss')
        plt.title('Loss Over Epochs')
        plt.legend()
        plt.ylim(0, 1)

        # Save the loss figure
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()

        # Convert the BytesIO object to a NumPy array
        buf.seek(0)  # Move to the beginning of the BytesIO object
        image = Image.open(buf)
        self.loss_graph.append(image)

        # Create a figure for accuracy
        plt.figure(figsize=(6, 5))
        plt.plot(epochs, avg_acc, 'bo', label='Training Accuracy')
        plt.plot(epochs, avg_val_acc, 'b+', label='Validation Accuracy')
        plt.xlabel('Epochs')
        plt.ylabel('Accuracy')
        plt.title('Accuracy Over Epochs')
        plt.legend()
        plt.ylim(0, 1)

        # Save the accuracy figure
        buf = BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()

        # Convert the BytesIO object to a NumPy array
        buf.seek(0)  # Move to the beginning of the BytesIO object
        image = Image.open(buf)
        self.accuracy_graph.append(image)

    def load_model(self, filename):
        self.model = load_model(filename)
      
    def run_model(self, X_test):
        X_test = X_test.reshape(len(X_test), 28, 28, 1).astype('float32')
        predictions = self.model.predict(X_test, verbose=1)
        predicted_class = np.argmax(predictions, axis=1)
        return predicted_class
    
    def test_model(self, X_test, y_test):
        y_predict = self.run_model(X_test)
        accuracy = accuracy_score(y_test, y_predict)
        return accuracy

    def get_performance_graphs(self):
        return self.loss_graph, self.accuracy_graph

    def get_performance_data(self):
        return self.loss_data, self.accuracy_data

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

def create_dataset(directory_path: str):
    datasetcreator = DatasetCreator(directory_path)
    datasetcreator.load_data()
    dataset_path = datasetcreator.save_dataset()

    return dataset_path

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

def train_model(filename: str, training_options: Dict[str, any]) -> Dict:
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
    
    # load data
    dataset = Dataset()
    X, y = dataset.load_saved_dataset(filename)

    # train model
    cnn = CNN(X, y, training_options)
    model = cnn.train_model()
    
    # 保存模型
    model_path = f"model_{uuid.uuid4().hex[:8]}.h5"
    model.save(model_path)

    loss_graph, accuracy_graph = cnn.get_performance_graphs()
    loss_data, accuracy_data = cnn.get_performance_data()
    
    return {"model path": model_path, "accuracy graph": accuracy_graph, "loss graph": loss_graph,
            "accuracy data": accuracy_data, "loss data": loss_data}

def predict(model_path: str, data_path: str):
    cnn = CNN()
    cnn.load_model(model_path)
    dataset = Dataset()
    X_test = dataset.load_images(data_path)
    predictions = cnn.run_model(X_test)
    return predictions

def test_model(model_path: str, data_path: str):
    cnn = CNN()
    cnn.load_model(model_path)
    dataset = Dataset()
    X_test, y_test = dataset.load_saved_dataset(data_path)
    accuracy = cnn.test_model(X_test, y_test)
    return accuracy

@app.post("/upload")
async def upload(filename: str):
    """
    处理图片上传
    """
    dataset_path = create_dataset(filename)
    
    return {
        "status": "success",
        "dataset_path": dataset_path,
        "message": f"Successfully saved to {dataset_path}"
    }

@app.post("/preprocess")
async def preprocess(request: ImagePreprocessRequest):
    """
    处理图像预处理请求
    """
    try:
        preprocessed_path = preprocess_image(request.dataset_path, request.options)
        
        # 读取预处理后的图像并转换为base64
        # with open(preprocessed_path, "rb") as img_file:
        #    img_data = base64.b64encode(img_file.read()).decode()
        
        return {
            "status": "success",
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
        accuracy = test_model(request.model_path, request.data_path)
        
        return {
            "status": "success",
            "model accuracy": accuracy
            }
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
@app.post("/test")
async def test(request: PredictionRequest):
    """
    处理预测请求，返回预测的数字和每个数字的概率分布
    """
    try:
        predicted_class = predict(request.model_path, request.data_path)
        
        return {
            "status": "success",
            "predicted_class": predicted_class
            }
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
