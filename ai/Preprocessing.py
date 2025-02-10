import pandas as pd
import numpy as np
from PIL import Image, ImageOps
import cv2
from Dataset import DatasetLoader
from sklearn.model_selection import train_test_split
from sklearn.utils import shuffle
from sklearn.model_selection import KFold

# dataset = {"label": list of RGB images}
# RGB is in the form of an np.array
# in the following code, an image is called data

class Preprocessing:
    def __init__(self, filename=None):
        # filename is the file name of the dataset from current directory
        dataset_loader = DatasetLoader()
        self.X, self.y = dataset_loader.load_saved_dataset(filename)

    # Noise removal/ Outlier removal
    
    
    # Image Filtering/ Cropping
    
    
    # Image Resizing (allow Multi-Resolution Training)
    def resize(self, width, height):
        # Specify the new size as (width, height)
        new_size = (width, height)
        for i in range(self.X.shape[0]):
            self.X[i] = cv2.resize(self.X[i], new_size)
    
        # from PIL import Image 
        # size = (28, 28) # for the trial workshop
        # r_data = data.resize(size)
        # r_data.show()
    
    # Grayscale Conversion
    def convert_to_grayscale(self):
        # Use the cvtColor() function to grayscale the image
        for i in range(self.X.shape[0]):
            self.X[i] = cv2.cvtColor(self.X[i], cv2.COLOR_BGR2GRAY)
    
        # from PIL import Image, ImageOps
        # gr_data = ImageOps.grayscale(r_data) 
        # gr_data.show()
    
    # Splitting the Dataset
    def split_data_train_test(self):
        # train/test split
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        return self.X_train, self.X_test, self.y_train, self.y_test
    
    def split_data_train_test_val(self):
        # train/val/test split
        self.X_train, X_temp, self.y_train, y_temp = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        self.X_val, self.X_test, self.y_val, self.y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
        return self.X_train, self.y_train, self.X_val, self.X_test, self.y_val, self.y_test
    
    # k-fold CV
    def split_data_kFold(self):
        # not yet finished
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        for train_index, val_index in kf.split(self.X):
            self.X_train, self.X_val = self.X[train_index], self.X[val_index]
            self.y_train, self.y_val = self.y[train_index], self.y[val_index]
        return kf
    
    # Label Encoding  # https://www.geeksforgeeks.org/ml-label-encoding-of-datasets-in-python/
    # Import label encoder 
    # from sklearn import preprocessing 
    # # label_encoder object knows  
    # # how to understand word labels. 
    # label_encoder = preprocessing.LabelEncoder() 
    # # Encode labels in column 'species'. 
    # df['species']= label_encoder.fit_transform(df['species']) 
    # df['species'].unique() 
    
    # Data Shuffling
    def shuffle_data(self, X, y):
        X_shuffled, y_shuffled = shuffle(X, y, random_state=42)
        return X_shuffled, y_shuffled
    
    # Normalization
    def _standardize(self, x):
        mean_px = self.X_train.mean().astype(np.float32)
        std_px = self.X_train.std().astype(np.float32)
        return (x-mean_px)/std_px
    
    # Batching

