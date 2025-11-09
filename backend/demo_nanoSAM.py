from cv_models import MobileSAM
import cv2

# Now it works correctly
image = cv2.imread("ui_example.jpg")
mobile_sam = MobileSAM(image, checkpoint="backend/mobile_sam.pt")
mobile_sam.segment()
output_file = mobile_sam.visualize_segmentation_result()
print(f"Saved to: {output_file}")