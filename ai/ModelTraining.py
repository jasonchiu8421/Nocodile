import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from sklearn.model_selection import KFold
from tensorflow.keras.layers import Convolution2D, Lambda, Dense, Flatten, Dropout, BatchNormalization, Conv2D, MaxPooling2D
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam, RMSprop
from tensorflow.keras import backend as K
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.utils import to_categorical

class LoadProcessedData:
    def __init__(self):
        self.dataset = None

    def load_csv(self, filename=None):
        self.dataset = pd.read_csv(filename)
        return self.dataset

    def preprocessing(self):
        self.X_train = (self.dataset.iloc[:,1:].values).astype('float32') # all pixel values
        self.y_train = self.dataset.iloc[:,0].values.astype('int32') # only labels i.e targets digits
        self.X_train = self.X_train.reshape(self.X_train.shape[0], 28, 28)
        self.X_train = self.X_train.reshape(self.X_train.shape[0], 28, 28,1)
        self.y_train = to_categorical(self.y_train)
        return self.X_train, self.y_train

class FlexibleCNN:
    def __init__(self, X=None, y=None):
        self.X = X
        self.y = y
        self.model = None
        self.hist = None
        self.batches = None
        self.val_batches = None

    def _standardize(self, x):
        mean_px = self.X.mean().astype(np.float32)
        std_px = self.X.std().astype(np.float32)
        return (x-mean_px)/std_px
    
    def train_test_approach(self, model_name):
        # train/test split
        seed = 43
        np.random.seed(seed)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        
        # Create Data Generator
        gen = ImageDataGenerator()
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
        self.val_batches=gen.flow(self.X_test, self.y_test, batch_size=64)

        # Define and train model
        model_method = getattr(self, model_name, None)
        if callable(model_method):
            model_method()
        else:
            return f"No model found with the name: {model_name}"
        
        # Plot performance of the model
        self._check_performance()

    
    def train_test_val_approach(self, model_name):
        # train/val/test split
        seed = 43
        np.random.seed(seed)
        self.X_train, X_temp, self.y_train, y_temp = train_test_split(self.X, self.y, test_size=0.2, random_state=42)
        self.X_val, self.X_test, self.y_val, self.y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
        
        # Create Data Generator
        gen = ImageDataGenerator()
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
        self.val_batches=gen.flow(self.X_val, self.y_val, batch_size=64)

        # Define and train model
        model_method = getattr(self, model_name, None)
        if callable(model_method):
            model_method()
        else:
            return f"No model found with the name: {model_name}"
        
        # Plot performance of the model
        self._check_performance()
        test_generator = gen.flow(self.X_test, self.y_test, batch_size=64)
        test_loss, test_accuracy = self.model.evaluate(test_generator)
        print(f'Test Loss: {test_loss:.4f}, Test Accuracy: {test_accuracy:.4f}')
    
    # k-fold CV
    def kFold_validation_approach(self, model_name, k=5):
        # not yet finished
        kf = KFold(n_splits=k, shuffle=True, random_state=42)
        
        # Create Data Generator
        gen = ImageDataGenerator()
        model_histories = []
            
        for train_index, val_index in kf.split(self.X):
            self.X_train, self.X_val = self.X[train_index], self.X[val_index]
            self.y_train, self.y_val = self.y[train_index], self.y[val_index]
            
            self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
            self.val_batches=gen.flow(self.X_val, self.y_val, batch_size=64)

            # Define and train model
            model_method = getattr(self, model_name, None)
            if callable(model_method):
                model_method()
                model_histories.append(self.hist)
            else:
                return f"No model found with the name: {model_name}"
            
            # Plot performance of the model
            avg_loss = np.mean([history.history['loss'] for history in model_histories], axis=0)
            avg_val_loss = np.mean([history.history['val_loss'] for history in model_histories], axis=0)
            avg_accuracy = np.mean([history.history['accuracy'] for history in model_histories], axis=0)
            avg_val_accuracy = np.mean([history.history['val_accuracy'] for history in model_histories], axis=0)
            self._plot_kfold_performance(avg_loss, avg_val_loss, avg_accuracy, avg_val_accuracy)

    def _check_performance(self):
        history_dict = self.hist.history
        loss_values = history_dict['loss']
        val_loss_values = history_dict['val_loss']
        acc_values = history_dict['accuracy']
        val_acc_values = history_dict['val_accuracy']
        epochs = range(1, len(loss_values) + 1)

        # Create subplots
        fig, axs = plt.subplots(1, 2, figsize=(12, 5))

        # Plot loss
        axs[0].plot(epochs, loss_values, 'bo', label='Training Loss')
        axs[0].plot(epochs, val_loss_values, 'b+', label='Validation Loss')
        axs[0].set_xlabel('Epochs')
        axs[0].set_ylabel('Loss')
        axs[0].set_title('Loss Over Epochs')
        axs[0].legend()

        # Plot accuracy
        axs[1].plot(epochs, acc_values, 'bo', label='Training Accuracy')
        axs[1].plot(epochs, val_acc_values, 'b+', label='Validation Accuracy')
        axs[1].set_xlabel('Epochs')
        axs[1].set_ylabel('Accuracy')
        axs[1].set_title('Accuracy Over Epochs')
        axs[1].legend()

        # Save the figure
        plt.tight_layout()
        plt.savefig('performance_plot.png')
        plt.close()
    
    def plot_kfold_performance(self, avg_loss, avg_val_loss, avg_acc, avg_val_acc):
        epochs = range(1, len(avg_loss) + 1)

        # Create subplots
        fig, axs = plt.subplots(1, 2, figsize=(12, 5))

        # Plot loss
        axs[0].plot(epochs, avg_loss, 'bo', label='Average Training Loss')
        axs[0].plot(epochs, avg_val_loss, 'b+', label='Average Validation Loss')
        axs[0].set_xlabel('Epochs')
        axs[0].set_ylabel('Average Loss')
        axs[0].set_title('Average Loss Over Epochs')
        axs[0].legend()

        # Plot accuracy
        axs[1].plot(epochs, avg_acc, 'bo', label='Average Training Accuracy')
        axs[1].plot(epochs, avg_val_acc, 'b+', label='Average Validation Accuracy')
        axs[1].set_xlabel('Epochs')
        axs[1].set_ylabel('Average Accuracy')
        axs[1].set_title('Average Accuracy Over Epochs')
        axs[1].legend()

        # Save the figure
        plt.tight_layout()
        plt.savefig('performance_plot.png')
        plt.close()

    def model1(self):
        self.model= Sequential()
        self.model.add(Lambda(self._standardize,input_shape=(28,28,1)))
        self.model.add(Flatten())
        self.model.add(Dense(10, activation='softmax'))
        print("input shape ",self.model.input_shape)
        print("output shape ",self.model.output_shape)
        
        self.model.compile(
            optimizer=RMSprop(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.hist = self.model.fit(
            x=self.batches,
            steps_per_epoch=self.batches.n,
            epochs=10,
            validation_data=self.val_batches,
            validation_steps=self.val_batches.n,
            verbose=1
        )
        
        return self.model

    def model2(self):
        
        self.model = Sequential([
            Lambda(self._standardize, input_shape=(28,28,1)),
            Flatten(),
            Dense(512, activation='relu'),
            Dense(10, activation='softmax')
            ])
            
        self.model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['accuracy'])
            
        self.model.optimizer.lr=0.01

        self.hist = self.model.fit(
            x=self.batches,
            steps_per_epoch=self.batches.n,
            epochs=10,
            validation_data=self.val_batches,
            validation_steps=self.val_batches.n,
            verbose=1
        )
        
        return self.model
    
    def model3(self):
        self.model = Sequential([
            Lambda(self._standardize, input_shape=(28,28,1)),
            Convolution2D(32,(3,3), activation='relu'),
            Convolution2D(32,(3,3), activation='relu'),
            MaxPooling2D(),
            Convolution2D(64,(3,3), activation='relu'),
            Convolution2D(64,(3,3), activation='relu'),
            MaxPooling2D(),
            Flatten(),
            Dense(512, activation='relu'),
            Dense(10, activation='softmax')
            ])
        
        self.model.compile(Adam(), loss='categorical_crossentropy', metrics=['accuracy'])

        self.model.optimizer.lr=0.01

        self.hist = self.model.fit(
            x=self.batches,
            steps_per_epoch=self.batches.n,
            epochs=10,
            validation_data=self.val_batches,
            validation_steps=self.val_batches.n,
            verbose=1
        )
        
        return self.model

    # With data augmentation
    def model4(self):
        gen =ImageDataGenerator(rotation_range=8, width_shift_range=0.08, shear_range=0.3,
                               height_shift_range=0.08, zoom_range=0.08)
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
        self.val_batches = gen.flow(self.X_test, self.y_test, batch_size=64)

        self.model = Sequential([
            Lambda(self._standardize, input_shape=(28,28,1)),
            Convolution2D(32,(3,3), activation='relu'),
            Convolution2D(32,(3,3), activation='relu'),
            MaxPooling2D(),
            Convolution2D(64,(3,3), activation='relu'),
            Convolution2D(64,(3,3), activation='relu'),
            MaxPooling2D(),
            Flatten(),
            Dense(512, activation='relu'),
            Dense(10, activation='softmax')
            ])
        
        self.model.compile(Adam(), loss='categorical_crossentropy',
                    metrics=['accuracy'])
        
        self.model.optimizer.learning_rate = 0.001

        self.hist = self.model.fit(
            x=self.batches,
            steps_per_epoch=self.batches.n,
            epochs=10,
            validation_data=self.val_batches,
            validation_steps=self.val_batches.n,
            verbose=1
        )
        
        return self.model

    def model5(self):
        self.model = Sequential([
            Lambda(self._standardize, input_shape=(28, 28, 1)),
            Convolution2D(32, (3, 3), activation='relu'),
            BatchNormalization(axis=-1),
            Convolution2D(32, (3, 3), activation='relu'),
            MaxPooling2D(),
            BatchNormalization(axis=-1),
            Convolution2D(64, (3, 3), activation='relu'),
            BatchNormalization(axis=-1),
            Convolution2D(64, (3, 3), activation='relu'),
            MaxPooling2D(),
            Flatten(),
            BatchNormalization(),
            Dense(512, activation='relu'),
            BatchNormalization(),
            Dense(10, activation='softmax')
        ])
        
        self.model.compile(Adam(), loss='categorical_crossentropy', metrics=['accuracy'])

        self.model.optimizer.lr = 0.01

        self.hist = self.model.fit(
            x=self.batches,
            steps_per_epoch=self.batches.n,
            epochs=10,
            validation_data=self.val_batches,
            validation_steps=self.val_batches.n,
            verbose=1
        )
        
        return self.model

    def run_model(self, X_test, model=None):
        if model == None:
            model = self.model
        X_test = X_test.reshape(28, 28, 1).astype('float32')
        predictions = model.predict(X_test, verbose=1)
        predicted_class = np.argmax(predictions, axis=1)
        return predicted_class
