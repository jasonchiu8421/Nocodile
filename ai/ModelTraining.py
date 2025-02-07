import numpy as np
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from tensorflow.keras.layers import Convolution2D, Lambda, Dense, Flatten, Dropout, BatchNormalization, Conv2D, MaxPooling2D
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam, RMSprop
from tensorflow.keras import backend as K
from tensorflow.keras.preprocessing.image import ImageDataGenerator

class pretraining:
    def __init__(self):
        self.dataset = None

    def load_csv(self, filename=None):
        self.dataset = pd.read_csv(filename)
        return self.dataset

    def preprocessing(self):
        self.X_train = (self.dataset.iloc[:,1:].values).astype('float32') # all pixel values
        self.y_train = self.dataset.iloc[:,0].values.astype('int32') # only labels i.e targets digits
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

class FlexibleCNN:
    def __init__(self, X_train, y_train):
        self.X_train = X_train
        self.y_train = y_train
        self.model = None
        self.hist = None
        self.batches = None
        self.val_batches = None

    def _standardize(self, x):
        mean_px = self.X_train.mean().astype(np.float32)
        std_px = self.X_train.std().astype(np.float32)
        return (x-mean_px)/std_px
        
    def pretraining(self):
        seed = 43
        np.random.seed(seed)
        self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(self.X_train, self.y_train, test_size=0.10, random_state=42)
        
        # Create an instance of ImageDataGenerator
        gen = ImageDataGenerator()
        
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
        self.val_batches=gen.flow(self.X_val, self.y_val, batch_size=64)

    def check_performance(self):
        history_dict = self.hist.history
        history_dict.keys()

        loss_values = history_dict['loss']
        val_loss_values = history_dict['val_loss']
        epochs = range(1, len(loss_values) + 1)

        # "bo" is for "blue dot"
        plt.plot(epochs, loss_values, 'bo')
        # "b+" is for "blue crosses"
        plt.plot(epochs, val_loss_values, 'b+')
        plt.xlabel('Epochs')
        plt.ylabel('Loss')
        plt.savefig('loss_plot.png')
        
        plt.clf()   # clear figure

        acc_values = history_dict['accuracy']
        val_acc_values = history_dict['val_accuracy']

        plt.plot(epochs, acc_values, 'bo')
        plt.plot(epochs, val_acc_values, 'b+')
        plt.xlabel('Epochs')
        plt.ylabel('Accuracy')
        plt.savefig('accuracy_plot.png')
        plt.close()

    def model1(self):
        self.model= Sequential()
        self.model.add(Lambda(self._standardize,input_shape=(28,28,1)))
        self.model.add(Flatten())
        self.model.add(Dense(10, activation='softmax'))
        print("input shape ",self.model.input_shape)
        print("output shape ",self.model.output_shape)
        self.model.compile(
            optimizer=RMSprop(learning_rate=0.001),  # Use `learning_rate` instead of `lr`
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

    def model4(self):
        gen =ImageDataGenerator(rotation_range=8, width_shift_range=0.08, shear_range=0.3,
                               height_shift_range=0.08, zoom_range=0.08)
        self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
        self.val_batches = gen.flow(self.X_val, self.y_val, batch_size=64)

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
    
    def model6(self):
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

        gen = ImageDataGenerator()

        self.batches = gen.flow(self.X_train, self.y_train, batch_size=64)
        self.val_batches = gen.flow(self.X_val, self.y_val, batch_size=64)
        
        self.hist = self.model.fit(
            x=self.batches, 
            steps_per_epoch=self.batches.n, 
            epochs=10,
            verbose=1
        )

        return self.model

    def run_model(self, X_test):
        X_test = X_test.reshape(28, 28, 1).astype('float32')
        predictions = self.model.predict(X_test, verbose=1)
        predicted_class = np.argmax(predictions, axis=1)
        return predicted_class
