import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from tensorflow.keras.utils import to_categorical

class testing:
    def __init__(self):
        self.train = None
        self.test = None

    def load_csv(self):
        self.train = pd.read_csv("train.csv")

    def preprocessing(self):
        self.X_train = (self.train.iloc[:,1:].values).astype('float32') # all pixel values
        self.y_train = self.train.iloc[:,0].values.astype('int32') # only labels i.e targets digits
        self.X_train = self.X_train.reshape(self.X_train.shape[0], 28, 28)
        print(self.X_train)
        print(self.y_train)

        for i in range(6, 9):
            plt.subplot(330 + (i+1))
            plt.imshow(self.X_train[i], cmap=plt.get_cmap('gray'))
            plt.title(self.y_train[i])
        
        self.X_train = self.X_train.reshape(self.X_train.shape[0], 28, 28,1)
        print(self.X_train.shape)
        self.y_train = to_categorical(self.y_train)  # Converts the target to a one-hot encoded format
        num_classes = self.y_train.shape[1]    # The number of unique classes
        print(num_classes)

        return self.X_train, self.y_train

