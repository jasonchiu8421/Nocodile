import pandas as pd
from PIL import Image
import h5py
import numpy as np
import os
    
class DatasetCreator:
    def __init__(self, base_folder=None):
        self.base_folder = base_folder
        self.image_paths = []
        self.labels = []
    
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
        if self.images is None:  # Load images only once
            self._load_image_paths_and_labels()  # Load image paths and labels
            self.images = []
            for img_path in self.image_paths:
                image = Image.open(img_path)  # Load the image
                self.images.append(image)
            self.images = np.array(self.images)

        return self.images, self.labels

    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)
    # images, labels = dataset_creator.load_data()

    def save_dataset_h5(self, file_path=None):
        # Create dataset filename if not specified
        if file_path is None or file_path.strip() == "":
            directory = os.path.dirname(self.base_folder)
            file_name = os.path.splitext(os.path.basename(self.base_folder))[0] + '_dataset.h5'
            file_path = os.path.join(directory, file_name)

        # Avoid subscript incompatibility
        base_name = file_path.split('.')[0].split('_')[0]
        if not file_path.endswith('.h5'):
            file_path = f"{base_name}.h5"

        # Save the dataset to an HDF5 file
        if self.images is None:  # Load images if not already loaded
            self.load_data()

        with h5py.File(file_path, 'w') as h5f:
            for img_path, image in zip(self.image_paths, self.images):
                h5f.create_dataset(os.path.basename(img_path), data=image, dtype='float32')

            h5f.create_dataset('labels', data=self.labels, dtype='S')

    # Example usage
    # base_folder = 'digits'
    # dataset_creator = DatasetCreator(base_folder)
    # filename = "digits_dataset"/ filename = "digits_dataset.h5"
    # dataset_creator.save_dataset_h5(filename)

class DatasetLoader:
    def __init__(self):
        self.images = None
        self.labels = None

    def load_saved_dataset_h5(self, filename):
        # Load images and labels from a saved HDF5 file
        with h5py.File(filename, 'r') as h5f:
            # Load images and labels
            self.images = np.array([np.array(h5f[img_key]) for img_key in h5f.keys() if img_key != 'labels'])
            self.labels = np.array(h5f['labels'])

        # Create a dictionary with labels as keys and images as values
        dataset = {label: [] for label in self.labels}
        for image, label in zip(self.images, self.labels):
            dataset[label].append(image)

        return dataset

    # Example usage
    # dataset_loader = DatasetLoader()
    # images, labels = dataset_loader.load_saved_dataset_h5('digits_dataset.h5')

    def print_shapes(self):
        # Print the shapes of images and labels
        print("Images Shape:", self.images.shape)
        print("Labels Shape:", self.labels.shape)
    
    # Example usage
    # dataset_loader = DatasetLoader()
    # dataset_loader.load_saved_dataset_h5('digits_dataset.h5')
    # dataset_loader.print_shapes()

    def print_first_image_per_label(self):
        # Print the first image for each unique label
        unique_labels = np.unique(self.labels)
        for label in unique_labels:
            index = np.where(self.labels == label)[0][0]  # Get the index of the first occurrence
            print(f"First image of label '{label}':")
            img = Image.fromarray(self.images[index])  # Convert the array to an image
            img.show()  # Show the image

    # Example usage
    # dataset_loader = DatasetLoader()
    # dataset_loader.load_saved_dataset_h5('digits_dataset.h5')
    # dataset_loader.print_first_image_per_label()
