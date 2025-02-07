import pandas as pd

# Noise removal/ Outlier removal

# Image Filtering/ Cropping

# Image Resizing (allow Multi-Resolution Training)
from PIL import Image 
size = (40, 40)
img = Image.open(r"test.png")
r_img = img.resize(size)
r_img.show()

# Grayscale Conversion
from PIL import Image, ImageOps
im2 = ImageOps.grayscale(im1) 
im2.show()

# Splitting the Dataset

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

# Normalization

# Batching
