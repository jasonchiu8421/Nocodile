import cv2
import h5py
import numpy as np
import os
    
class DatasetCreator:
    def __init__(self, base_folder=None):
        self.base_folder = base_folder
        self.image_paths = []
        self.labels = []
        self.images = []
    
    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)

    def _load_image_paths_and_labels(self):
        # Load image paths and labels from the specified folder structure
        for label in os.listdir(self.base_folder):
            label_folder = os.path.join(self.base_folder, label)
            if os.path.isdir(label_folder):
                for img_file in os.listdir(label_folder):
                    img_path = os.path.join(label_folder, img_file)
                    self.image_paths.append(img_path)
                    self.labels.append(label)

        self.labels = np.array(self.labels)

    def load_data(self):
        # Load all images into a dataset
        if self.images == []:  # Load images only once
            self._load_image_paths_and_labels()  # Load image paths and labels
            for img_path in self.image_paths:
                image = cv2.imread(img_path)  # Load the image using cv2
                if image is not None:  # Check if the image was loaded successfully
                    self.images.append(image)
            self.images = np.array(self.images)

        return self.images, self.labels

    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)
    # images, labels = dataset_creator.load_data()

    def save_dataset(self, file_path=None):
        # Create dataset filename if not specified
        if file_path is None or file_path.strip() == "":
            directory = os.path.dirname(self.base_folder)
            file_name = os.path.splitext(os.path.basename(self.base_folder))[0] + '_dataset.h5'
            file_path = os.path.join(directory, file_name)
        
        # Save dataset
        datasetloader = DatasetLoader(self.images, self.labels)
        datasetloader.save_dataset(file_path)
        return file_path
    
    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)
    # dataset_creator.load_data()
    # name_of_saved_file = dataset_creator.save_dataset()

class DatasetLoader:
    def __init__(self, images=None, labels=None):
        self.images = images
        self.labels = labels
        self.filename = None
    
    # Example usage
    # dataset_loader = DatasetLoader(images, labels)
    
    def save_dataset(self, file_path):
        # Avoid subscript
        base_name = file_path.split('.')[0]
        if not file_path.endswith('.h5'):
            self.filename = f"{base_name}.h5"

        with h5py.File(self.filename, 'w') as h5f:
            # Save images and labels directly
            h5f.create_dataset('images', data=self.images, dtype='float32')
            h5f.create_dataset('labels', data=self.labels.astype('S'))

    # Example usage
    # dataset_loader = DatasetLoader(images, labels)
    # filename = "digits_dataset"/ filename = "digits_dataset.h5"
    # dataset_creator.save_dataset(filename)

    def get_filename(self):
        return self.filename

    def load_saved_dataset(self, filename):
        # Avoid subscript
        base_name = filename.split('.')[0]
        if not filename.endswith('.h5'):
            filename = f"{base_name}.h5"
        
        # Open the HDF5 file
        with h5py.File(filename, 'r') as h5f:
            # Load images and labels
            self.images = h5f['images'][:]
            self.labels = h5f['labels'][:]
        
        return self.images, self.labels

    # Example usage
    # dataset_loader = DatasetLoader()
    # images, labels = dataset_loader.load_saved_dataset('digits_dataset.h5')

    def print_shapes(self):
        # Print the shapes of images and labels
        print("Images Shape:", self.images.shape)
        print("Labels Shape:", self.labels.shape)
    
    # Example usage
    # dataset_loader = DatasetLoader()
    # dataset_loader.load_saved_dataset('digits_dataset.h5')
    # dataset_loader.print_shapes()

    def print_first_image_per_label(self):
        # Print the first image for each unique label
        for index, label in enumerate(self.labels):
            if label not in self.labels:
                label = label.decode('utf-8')
                img = self.images[index]
                print(f"First image of label '{label}':")
                cv2.imwrite('digits.jpg', img)

    # Example usage
    # dataset_loader = DatasetLoader()
    # dataset_loader.load_saved_dataset('digits_dataset.h5')
    # dataset_loader.print_first_image_per_label()
