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
images = p.get_X()
labels = p.get_y()

# Perform specific preprocessing operations
p = Preprocessing(X=images, y=labels)
images, labels = p.shuffle_data()

# Train model (assuming train.csv is in 'ai' directory) using train/test approach
x = LoadProcessedData()
x.load_csv("train.csv")
X, y = x.preprocessing()
cnn = FlexibleCNN(X, y)
model1 = cnn.train_test_approach('model1') # argument is the name of the model
  # This will split data, train model, and show performance of the model

# Train model (assuming train.csv is in 'ai' directory) using train/test/val approach
x = LoadProcessedData()
x.load_csv("train.csv")
X, y = x.preprocessing()
cnn = FlexibleCNN(X, y)
model1= cnn.train_test__val_approach('model1') # argument is the name of the model
  # This will split data, train model, and show performance of the model

# Train model (assuming train.csv is in 'ai' directory) using k fold validation method
x = LoadProcessedData()
x.load_csv("train.csv")
X, y = x.preprocessing()
cnn = FlexibleCNN(X, y)
model1 = cnn.kFold_validation_approach('model1') # argument is the name of the model
  # This will split data, train model, and show performance of the model

# Find prediction using the model (immediately after training) assuming 'test.csv’ is in current directory
X_test = pd.read_csv('test.csv')
prediction = cnn.run_model(X_test)

# Find prediction using the model (at any time)
X_test = pd.read_csv('test.csv')
cnn = FlexibleCNN()
prediction = cnn.run_model(X_test, model1) # model 1 is the model trained
