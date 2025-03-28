import cv2
from Dataset import DatasetLoader

# dataset = {"label": list of BGR images}
# RGB is in the form of an np.array
# in the following code, an image is called data

class Preprocessing:
    def __init__(self, filename=None, X=None, y=None):
        self.X = X
        self.y = y
        # filename = file name of the dataset from current directory
        if filename != None:
            dataset_loader = DatasetLoader()
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
    
        # from PIL import Image, ImageOps
        # gr_data = ImageOps.grayscale(r_data) 
        # gr_data.show()
    
    # Data Shuffling
    def shuffle_data(self):
        from sklearn.utils import shuffle
        self.X, self.y = shuffle(self.X, self.y, random_state=42)
        return self.X, self.y
    
    # Normalization
    def normalize(self):
        import numpy as np
        from sklearn.preprocessing import MinMaxScaler
        # Initialize the scaler
        scaler = MinMaxScaler()   
        # Fit and transform the data
        normalized_data = scaler.fit_transform(self.X)
        return self.X

    
    # Batching
