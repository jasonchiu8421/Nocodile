from PIL import Image
import h5py
import numpy as np
import os
from collections import defaultdict
    
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

        # Avoid subscript
        base_name = file_path.split('.')[0]
        if not file_path.endswith('.h5'):
            file_path = f"{base_name}.h5"

        # Save the dataset to an HDF5 file
        if self.images is None:  # Load images if not already loaded
            self.load_data()

        with h5py.File(file_path, 'w') as h5f:
            # Save images and labels directly
            h5f.create_dataset('images', data=self.images, dtype='float32')
            h5f.create_dataset('labels', data=self.labels.astype('S'))

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
        # Avoid subscript
        base_name = filename.split('.')[0]
        if not filename.endswith('.h5'):
            filename = f"{base_name}.h5"
        
        # Open the HDF5 file
        with h5py.File(filename, 'r') as h5f:
            # Load images and labels
            self.images = h5f['images'][:]
            self.labels = h5f['labels'][:]

        # Create a dictionary to hold the images by label
        label_dict = defaultdict(list)

        # Convert images to PIL format and categorize by label
        for idx, img_array in enumerate(self.images):
            # Convert the image array to a PIL image
            pil_image = Image.fromarray(img_array.astype('uint8'))
            # Get the label for the current image
            label = self.labels[idx].decode('utf-8')
            # Append the PIL image to the list for the corresponding label
            label_dict[label].append(pil_image)
        
        return dict(label_dict)

    # Example usage
    # dataset_loader = DatasetLoader()
    # dataset = dataset_loader.load_saved_dataset_h5('digits_dataset.h5')

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
