import logging
from fastapi import FastAPI, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from PIL import Image
from io import BytesIO, StringIO
from typing import Tuple
import os
import uuid
from flask import request
import base64
import pandas as pd

import ai
import contract

DATASETS_DIR = "datasets"
CHECKPOINTS_DIR = "checkpoints"

logging.basicConfig(level=os.environ.get("LOGLEVEL", "INFO").upper())
enable_backtrace = os.environ.get("ENABLE_BACKTRACE", "0") == "1"

app = FastAPI()

@app.middleware("http")
async def handle_errors(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        if enable_backtrace:
            logging.error(f"Error processing request: {e}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    """
    Upload CSV file and convert it to HDF5 format.
    """
    # Verify file type
    if file.content_type != "text/csv":
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Only CSV files are accepted"}
        )
        
    # Get original filename and create .h5 filename
    original_filename = file.filename
    base_name = os.path.splitext(original_filename)[0]
    h5_filename = f"{base_name}.h5"
    
    # Check if filename already exists
    if os.path.exists(DATASETS_DIR + "/" + h5_filename):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": f"A file with name '{h5_filename}' already exists. Please use a different filename."}
        )
    
    # Read file content
    file_content = await file.read()
    file_content_str = file_content.decode('utf-8')

    def load_csv(file: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Process CSV file to extract images and labels
        """
        decode = lambda x: np.array(Image.open(BytesIO(base64.b64decode(x))))

        # read the uploaded file
        data = StringIO(file)
        df = pd.read_csv(data)
        images = df['image']
        images = np.array(list(map(decode, images)))
        labels = df['label']
        labels = np.array(labels)

        return images, labels
    
    # Process CSV data
    images, labels = load_csv(file_content_str)

    # Save as a dataset
    dataset = ai.Dataset(images=images, labels=labels)
    dataset.save_dataset(DATASETS_DIR + "/" + h5_filename)

    return h5_filename

@app.delete("/delete/{filename}")
async def delete_file(filename: str):
    """
    Delete a file from the server.
    """
    # Prevent directory traversal
    if "/" in filename or "\\" in filename or ".." in filename or ".." in filename or "~" in filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid filename"}
        )

    filename = DATASETS_DIR + "/" + filename

    # Check if file exists
    if not os.path.exists(filename) or not filename.endswith('.h5'):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": f"File '{filename}' not found or not a valid H5 file"}
        )
    
    # Delete the file
    os.remove(filename)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": f"File '{filename}' successfully deleted"}
    )

@app.post("/preprocess")
async def preprocess(request: contract.ImagePreprocessRequest):
    """
    Preprocess the dataset based on the options provided in the request.
    """
    options = request.options

    preprocessing = ai.Preprocessing(filename=DATASETS_DIR + "/" + request.dataset_path)
    output_paths = {}

    # Set save option
    intermediate_save_option = "one image per class" # by default
    if options.get("save_option"):
        intermediate_save_option = options["save_option"]

    # Preprocess the dataset based on the options provided
    for option in options:
        if option=="resize":
            width, height = options["resize"]
            preprocessing.resize(width, height)

        if option=="grayscale":
            preprocessing.convert_to_grayscale()

        if option=="normalize":
            preprocessing.normalize()

        if option=="shuffle":
            preprocessing.shuffle_data()

        if option=="resize" or option=="grayscale":
            if intermediate_save_option == "whole dataset":
                output_path = option + os.path.basename(request.dataset_path)
                preprocessing.save_dataset(DATASETS_DIR + "/" + output_path)
                output_paths[option] = output_path
            elif intermediate_save_option == "one image per class":
                output_paths[option] = preprocessing.return_class_example()
    
    output_path = f"preprocessed_{os.path.basename(request.dataset_path)}"
    preprocessing.save_dataset(DATASETS_DIR + "/" + output_path)
    output_paths["output"] = output_path

    return output_paths
        
@app.post("/train")
async def train(request: contract.TrainingRequest):
    """
    Process training request, return model path and performance graphs.
    """    
    # Load dataset
    dataset = ai.Dataset()
    X, y = dataset.load_saved_dataset(DATASETS_DIR + "/" + request.dataset_path)

    # Preprocess the dataset based on the options provided
    cnn = ai.CNN(X, y, request.training_options)
    model = cnn.train_model()
    
    # Save model
    model_path = f"model_{uuid.uuid4().hex[:8]}.h5"
    model.save(CHECKPOINTS_DIR + "/" + model_path)

    loss_graph, accuracy_graph = cnn.get_performance_graphs()
    loss_data, accuracy_data = cnn.get_performance_data()

    # Convert DataFrames to dict with lists format to match TypeScript interface
    accuracy_data_dict = accuracy_data.to_dict(orient='list')
    loss_data_dict = loss_data.to_dict(orient='list')
    
    return {"model path": model_path, "accuracy graph": accuracy_graph, "loss graph": loss_graph,
            "accuracy data": accuracy_data_dict, "loss data": loss_data_dict}


@app.get("/train/data")
async def get_dataset(dataset_path: str):
    """
    Find and return the corresponding h5 file based on the dataset_path.
    
    Args:
        dataset_path: Path to the dataset file relative to DATASETS_DIR
        
    Returns:
        The h5 file content if it exists, otherwise an error message
    """
    dataset_path = requests.args.get("dataset_path")
    try:
        file_path = os.path.join(DATASETS_DIR, dataset_path)
        
        if not os.path.exists(file_path):
            print("Can't find dataset file: " + dataset_path)
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": f"Dataset file not found: {dataset_path}"}
            )
            
        # Check if it's an h5 file
        if not file_path.endswith('.h5'):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": f"File is not an h5 file: {dataset_path}"}
            )
            
        # Read the h5 file
        with open(file_path, 'rb') as f:
            file_content = f.read()
            
        # Return the file content
        return JSONResponse(
            content={"filename": dataset_path, "file_content": base64.b64encode(file_content).decode('utf-8')}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Failed to get dataset: {str(e)}"}
        )

# after trainig the model, use it to predict a set of images
@app.post("/predict")
async def predict(request: contract.PredictionRequest):
    """
    Process prediction request, return predicted class and confidence level.
    """
    image_data = base64.b64decode(request.input_data)
    image = Image.open(BytesIO(image_data))
    image_array = np.array(image)

    preprocessing = ai.Preprocessing(image_array)
    options = request.preprocessing_options
    output_paths = {}
    for option in options:
        if option=="resize":
            size = options["resize"]
            preprocessing.resize((size, size))

        if option=="grayscale":
            preprocessing.convert_to_grayscale()

        if option=="resize" or option=="grayscale":
            if options["save_option"] == "whole dataset":
                output_path = option + os.path.basename(uuid.uuid4().hex[:8])
                preprocessing.save_dataset(output_path)
                output_paths[option] = output_path
            elif options["save_option"] == "one image per class":
                output_paths[option] = preprocessing.return_class_example()

    image = np.array(preprocessing.get_x())

    cnn = ai.CNN()
    cnn.load_model(CHECKPOINTS_DIR + "/" + request.model_path)
    prediction, confidence = cnn.run_model(image)
    
    return {"predicted class": prediction, "confidence level": confidence, "intermediates": output_paths}
    
@app.post("/test")
async def test(request: contract.TestingRequest):
    """
    Process testing request, return accuracy and performance graphs.
    """
    preprocessing = ai.Preprocessing(filename=DATASETS_DIR + "/" + request.dataset_path)
    options = request.preprocessing_options
    output_paths = {}
    for option in options:
        if option=="resize":
            size = options["resize"]
            preprocessing.resize((size, size))

        if option=="grayscale":
            preprocessing.convert_to_grayscale()

        if option=="resize" or option=="grayscale":
            if options["save_option"] == "whole dataset":
                output_path = option + os.path.basename(uuid.uuid4().hex[:8])
                preprocessing.save_dataset(output_path)
                output_paths[option] = output_path
            elif options["save_option"] == "one image per class":
                output_paths[option] = preprocessing.return_class_example()

    images = np.array(preprocessing.get_x())
    labels = np.array(preprocessing.get_y())

    cnn = ai.CNN()
    cnn.load_model(CHECKPOINTS_DIR + "/" + request.model_path)
    accuracy, accuracy_per_class, accuracy_per_class_image = cnn.test_model(images, labels)

    return {"accuracy": accuracy, "accuracy per class": accuracy_per_class, "accuracy per class graph": accuracy_per_class_image, "intermediates": output_paths}


if __name__ == "__main__":
    # Create datasets folder if it doesn't exist
    os.makedirs("datasets", exist_ok=True)

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
