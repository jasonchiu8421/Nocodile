from cv_models import MobileSAM

# Now it works correctly
mobile_sam = MobileSAM("input.jpg", checkpoint="mobile_sam.pt")
mobile_sam.segment()
output_file = mobile_sam.visualize_segmentation_result()
print(f"Saved to: {output_file}")
