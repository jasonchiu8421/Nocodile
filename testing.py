from ai/ModelTraining import pretraining, FlexibleCNN
from ai/Dataset import DatasetCreator, DatasetLoader

# load image data (suppose we have a folder called digits in this directory) and create dataset
base_folder = 'digits'
dataset_creator = DatasetCreator(base_folder)
dataset_creator.load_data()
filename = "digits_dataset"
dataset_creator.save_dataset_h5(filename)

# load saved dataset and print first image per label
dataset_loader = DatasetLoader()
dataset = dataset_loader.load_saved_dataset_h5('digits_dataset')
dataset_loader.print_first_image_per_label()

# Train model1 from kaggle (assuming train.csv is in 'ai' directory)
x = pretraining()
x.load_csv()
X_train, y_train = x.preprocessing()
model1 = FlexibleCNN(X_train, y_train)
model1.pretraining()
model1.model1()
model1.check_performance()
