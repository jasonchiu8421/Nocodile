import pandas as pd

# Noise removal/ Outlier removal


# Image Filtering/ Cropping

# Image Resizing (allow Multi-Resolution Training)
from PIL import Image 
size = (28, 28) # for the trial workshop
img = Image.open(r"test.png")
r_img = img.resize(size)
r_img.show()

# Grayscale Conversion
from PIL import Image, ImageOps
im2 = ImageOps.grayscale(im1) 
im2.show()
# OR: 
import cv2
# Use the cvtColor() function to grayscale the image
gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Splitting the Dataset
# train/test
from sklearn.model_selection import train_test_split
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.2, random_state=42)
# train/val/test
from sklearn.model_selection import train_test_split
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.2, random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
# k-fold CV
from sklearn.model_selection import KFold
kf = KFold(n_splits=5, shuffle=True, random_state=42)
for train_index, val_index in kf.split(X):
    X_train, X_val = X[train_index], X[val_index]
    y_train, y_val = y[train_index], y[val_index]

# Label Encoding  # https://www.geeksforgeeks.org/ml-label-encoding-of-datasets-in-python/
# Import label encoder 
from sklearn import preprocessing 
# label_encoder object knows  
# how to understand word labels. 
label_encoder = preprocessing.LabelEncoder() 
# Encode labels in column 'species'. 
df['species']= label_encoder.fit_transform(df['species']) 
df['species'].unique() 

# Data Shuffling
from sklearn.utils import shuffle
import numpy as np
X_shuffled, y_shuffled = shuffle(X, y, random_state=42) # where x and y are np.arrays

# Normalization
def _standardize(self, x):
    mean_px = self.X_train.mean().astype(np.float32)
    std_px = self.X_train.std().astype(np.float32)
    return (x-mean_px)/std_px

# Batching
