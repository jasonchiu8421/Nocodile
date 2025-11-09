import cv2
import numpy as np
from PIL import Image

# Import your NanoSAM class (assuming it's in the same directory)
from cv_models import NanoSAM  # Replace with your actual module name

def main():
    # 1. Load an image
    image_path = "example.jpg"  # Replace with your image path
    image = cv2.imread(image_path)
    
    if image is None:
        print(f"Failed to load image: {image_path}")
        return
    
    print(f"Loaded image: {image.shape}")
    
    # 2. Initialize NanoSAM with engine paths
    nano = NanoSAM(
        image=image,
        image_encoder_path="data/resnet18_image_encoder.engine",
        mask_decoder_path="data/mobile_sam_mask_decoder.engine"
    )
    print("NanoSAM initialized successfully")
    
    # 3. Method 1: Segment with a single bounding box
    print("\n--- Method 1: Single Bounding Box ---")
    bbox = (100, 100, 200, 150)  # x, y, width, height
    mask = nano.segment_with_bbox(bbox)
    print(f"Generated mask shape: {mask.shape}")
    
    # Save the mask
    cv2.imwrite("mask_output.png", mask * 255)
    print("Saved mask to mask_output.png")
    
    # 4. Method 2: Segment with foreground point
    print("\n--- Method 2: Point Prompt ---")
    points = np.array([[150, 175]])  # Single foreground point
    labels = np.array([1])  # 1 = foreground
    mask = nano.segment_with_points(points, labels)
    print(f"Generated mask shape: {mask.shape}")
    
    # 5. Method 3: Segment multiple objects
    print("\n--- Method 3: Multiple Bounding Boxes ---")
    bboxes = [
        (50, 50, 100, 100),
        (200, 200, 150, 120),
        (400, 100, 80, 80)
    ]
    masks = nano.segment_multiple_bboxes(bboxes)
    print(f"Generated {len(masks)} masks")
    
    # 6. Visualize results with bounding boxes
    output_path = nano.visualize_segmentation_result("nanosam_result.jpg")
    print(f"\nVisualization saved to: {output_path}")

if __name__ == "__main__":
    main()
