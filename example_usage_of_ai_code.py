from ai/ModelTraining import LoadProcessedData, FlexibleCNN
from ai/Preprocessing import Preprocessing
from ai/Dataset import DatasetCreator, DatasetLoader
from pandas import pd

# Load image data from directory (suppose we have a folder called digits in current directory)
base_folder = 'digits'
dataset_creator = DatasetCreator(base_folder)
dataset_creator.load_data()
filename = "digits_dataset"
dataset_creator.save_dataset(filename)

# Load saved dataset, print shapes and first image per class
dataset_loader = DatasetLoader()
dataset = dataset_loader.load_saved_dataset('digits_dataset.h5')
dataset_loader.print_shapes()
dataset_loader.print_first_image_per_label()

# Save dataset
dataset_loader = DatasetLoader(images, labels)
dataset_loader.save_dataset('digits_dataset.h5')

# Visualize the shapes of images and labels
dataset_loader = DatasetLoader(images, labels)
dataset_loader.print_shapes()

# Visualize the first image per class
dataset_loader = DatasetLoader(images, labels)
dataset_loader.print_first_image_per_label()

# Preprocessing using saved dataset
p = Preprocessing('digits_dataset.h5')
images = p.resize(28, 28)
images = p.convert_to_grayscale()
images = p.standardize()
images, labels = p.shuffle_data()
images, labels = p.normalize
images = p.get_X()
labels = p.get_y()

# Load MNIST data  (assuming train.csv is in 'ai' directory) 
x = LoadProcessedData()
x.load_csv("train.csv")
X, y = x.encode_label()

# Load dataset data
x = LoadProcessedData()
x.load_data("digits_dataset.h5")
X, y = x.encode_label()

# Load data assuming 'train.csv' is in current directory
x = LoadProcessedData()
x.load_csv("train.csv") # skip if X and y exists already
X, y = x.encode_label()

# Train model (assuming train.csv is in 'ai' directory)
cnn = CNN(X, y, method="train_test_val", layers=[{"type": "Flatten"},  {"type": "Dense", "number of neurons": 512, "activation": "relu"}, {"type": "Dense", "units": 10, "activation": "sofftmax"}], optimizer="Adam", loss="categorical_crossentropy", metrics=["accuracy"], lr=0.01, epochs=10, batch_size=64)
model1= cnn.train_model()  # This will use the specified method to split data, train model, and show performance of the model

# Find predictions using the model immediately after training assuming 'test.csv’ is in current directory
X_test = pd.read_csv('test.csv')
prediction = cnn.run_model(X_test)

# Load model and find predictions
X_test = pd.read_csv('test.csv')
cnn = CNN(model=model1)  # assuming model1 is a tensorflow model
prediction = cnn.run_model(X_test)
