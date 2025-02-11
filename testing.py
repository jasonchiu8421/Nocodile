from ai/ModelTraining import pretraining, FlexibleCNN
from ai/Dataset import DatasetCreator, DatasetLoader

# Load image data from directory (suppose we have a folder called digits in current directory)
base_folder = 'digits'
dataset_creator = DatasetCreator(base_folder)
dataset_creator.load_data()
filename = "digits_dataset"
dataset_creator.save_dataset(filename)

# Load saved dataset, print shapes and first image per label
dataset_loader = DatasetLoader()
dataset = dataset_loader.load_saved_dataset('digits_dataset')
dataset_loader.print_shapes()
dataset_loader.print_first_image_per_label()

# Save dataset after some image processing
dataset_loader = DatasetLoader(images, labels)
dataset_loader.save_dataset('digits_dataset')

# Train model1 from kaggle (assuming train.csv is in 'ai' directory)
x = pretraining()
x.load_csv("train.csv")
X_train, y_train = x.preprocessing()
model1 = FlexibleCNN(X_train, y_train)
model1.pretraining()
model1.model1()
model1.check_performance()

# use the model
x = pretraining()
X_test = x.load_csv("test.csv")
model1.run_model(X_test)
