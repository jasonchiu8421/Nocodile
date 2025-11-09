import cv2
from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator
import os
from PIL import Image
from skimage import io, filters
import torch
import torch.nn.functional as F
from transformers import AutoModelForImageSegmentation
from torchvision.transforms.functional import normalize
import numpy as np
from scipy.interpolate import interp1d, PchipInterpolator

# @staticmethod
# def calculate_iou(bbox1, bbox2):
#         # Unpack the boxes
#         x1, y1, w1, h1 = bbox1
#         x2, y2, w2, h2 = bbox2

#         # Calculate the coordinates of the corners of the boxes
#         bbox1_x2 = x1 + w1
#         bbox1_y2 = y1 + h1
#         bbox2_x2 = x2 + w2
#         bbox2_y2 = y2 + h2

#         # Calculate the coordinates of the intersection rectangle
#         inter_x1 = max(x1, x2)
#         inter_y1 = max(y1, y2)
#         inter_x2 = min(bbox1_x2, bbox2_x2)
#         inter_y2 = min(bbox1_y2, bbox2_y2)

#         # Calculate the area of the intersection rectangle
#         inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)

#         # Calculate the area of both bounding boxes
#         box1_area = w1 * h1
#         box2_area = w2 * h2

#         # Calculate the IoU
#         iou = inter_area / float(box1_area + box2_area - inter_area) if (box1_area + box2_area - inter_area) > 0 else 0
#         return iou

# class AutoAnnotator:
#     def __init__(self, video_path: str, manual_annotations: dict):
#         self.video_path = video_path
#         self.manual_annotations = manual_annotations
#         self.translate_annotations()
#         self.classes = self.manual_annotations[0]['class_name'] if self.manual_annotations else 'unnamed_object' # Assume one class only

#     @staticmethod
#     def translate_annotations(self):
#         self.translated_annotations = {}
#         # Translate annotations to (center_x, center_y, width, height) format
#         for annotation in self.bbox_data:
#             bbox = annotation['coordinates']
#             frame_num = annotation['frame_num']
#             x, y, w, h = tuple(eval(var) for var in bbox.split())
#             center_x = x + w / 2
#             center_y = y + h / 2
#             self.translated_annotations[frame_num] = (center_x, center_y, w, h)

#     def annotate(self, video_id):
#         # Perform object tracking to locate the object in the video
#         tracker = ObjectTracker(video_path=self.video_path)
#         tracked_annotations = tracker.tracking(manual_annotations=self.translated_annotations)

#         # Identify objects in each frame using distilled SAM
#         identifier = ObjectIdentifier(image=None)
#         identified_objects = identifier.segment(tracked_annotations=tracked_annotations, video_id=video_id)

#         # Combine tracking and identification results
#         combined_annotations = []
#         for frame_num, tracked_bbox in tracked_annotations.items():
#             best_iou = -1
#             best_bbox = None
#             identified_bboxes = identified_objects[frame_num]
#             for identified_bbox in identified_bboxes:
#                 iou = calculate_iou(tracked_bbox, identified_bbox)
#                 if iou > best_iou:
#                     best_iou = iou
#                     best_bbox = identified_bbox
#             if best_bbox:
#                 x, y, w, h = best_bbox
#                 best_bbox_str = f"{x} {y} {w} {h}"
#                 combined_annotations.append({"frame_num": frame_num, "class_name": self.classes,"coordinates": best_bbox_str})

#         return combined_annotations
    
# ################################################################################################################################

# # Track object in a video given manual annotations
# class ObjectTracker:
#     def __init__(self, video_path):
#         self.video_path = video_path

#     def tracking(self, manual_annotations):
#         # Use PCHIP interpolation and linear interpolation for object tracking
#         tracker = InterpolatedObjectTracker(self.video_path)
#         predicted_annotations = tracker.predict_frame(manual_annotations)

#         # Use KCF for object tracking
#         # annotated_frames = list({d["frame_num"] for d in manual_annotations if "frame_num" in d})
#         # predicted_annotations = {}
#         # for i in range(len(annotated_frames) - 1):
#         #     starting_frame_num = annotated_frames[i]
#         #     ending_frame_num = annotated_frames[i + 1]
#         #     print(f"Performing KCF from frame {starting_frame_num} to frame {ending_frame_num}...")
            
#         #     # Perform KCF tracking to locate the estimated location of the object
#         #     starting_frame_bbox = self.translated_annotations[starting_frame_num]
#         #     kcf_tracker = KCF(video_path=self.video_path)
#         #     tracking_results = kcf_tracker.predict_frames(starting_frame_bbox=starting_frame_bbox, starting_frame_num=starting_frame_num, ending_frame_num=ending_frame_num)
#         #     predicted_annotations.update(tracking_results)

#         return predicted_annotations

# Identify all objects in an image
# class ObjectIdentifier:
#     def __init__(self, image):
#         self.image = image

#     # Use Distilled SAM for object identification
#     def segment(self, tracked_annotations, video_id):
        
#         cap = cv2.VideoCapture(self.video_path)
#         identified_objects = {}
        
#         for frame_num, bbox in tracked_annotations.items():
#             print(f"Processing frame {frame_num+1}...")
#             ret, frame = cap.read()
#             if not ret:
#                 print(f"无法读取第 {frame_num} 帧，视频可能结束")
#                 break

#             # Use Distilled SAM for object identification
#             segmenter = MobileSAM(image=frame)
#             bboxes = segmenter.segment()
#             identified_objects[frame_num] = bboxes

#             # Update last annotated frame in database
#             video = Video(video_id)
#             video.last_annotated_frame = frame_num
#             video.save_last_annotated_frame()

#         cap.release()
#         return identified_objects
    
###############################################################################################################################

# Users shall create an instance of KCF class for each video, multiple predictions can be made on the same video instance
# starting_frame_bbox is in (x, y, width, height) format
class InterpolatedObjectTracker:
    def __init__(self, video_path):
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            print(f"无法打开视频文件 {video_path}")
            return None

    def release(self):
        self.cap.release()

    def predict_frame(self, annotations):
        if len(annotations) < 4:
            raise ValueError("至少需要4个标注才能进行预测")
        
        total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.release()
        
        # Change annotation format to: {frame_idx: (center_x, center_y, width, height)}
        positions = []
        for frame_idx, bbox in annotations.items():
            if len(bbox) != 4:
                raise ValueError(f"标注格式错误，应为(center_x, center_y, width, height)，得到: {bbox}")
            center_x, center_y, bbox_width, bbox_height = bbox
            positions.append({
                'frame': int(frame_idx),
                'center_x': float(center_x),
                'center_y': float(center_y),
                'width': float(bbox_width),
                'height': float(bbox_height)
            })
        
        positions_sorted = sorted(positions, key=lambda p: p['frame'])
        frames = np.array([pos['frame'] for pos in positions_sorted])
        x_coords = np.array([pos['center_x'] for pos in positions_sorted])
        y_coords = np.array([pos['center_y'] for pos in positions_sorted])
        widths = np.array([pos['width'] for pos in positions_sorted])
        heights = np.array([pos['height'] for pos in positions_sorted])
        
        # 检查帧号范围
        if frames.min() < 0 or frames.max() >= total_frames:
            raise ValueError(f"标注帧号超出范围 [0, {total_frames-1}]")
        
        # 计算变化率（用于自适应混合插值）
        def compute_change_ratios():
            change_ratios = []
            for i in range(len(frames) - 1):
                frame_diff = frames[i+1] - frames[i]
                if frame_diff == 0:
                    change_ratios.append(0)
                    continue
                
                pos_diff = np.sqrt((x_coords[i+1] - x_coords[i])**2 + 
                                (y_coords[i+1] - y_coords[i])**2)
                size_diff = np.sqrt((widths[i+1] - widths[i])**2 + 
                                (heights[i+1] - heights[i])**2)
                
                pos_change_rate = pos_diff / frame_diff if frame_diff > 0 else 0
                size_change_rate = size_diff / frame_diff if frame_diff > 0 else 0
                total_change_rate = pos_change_rate + size_change_rate * 0.1
                change_ratios.append(total_change_rate)
            
            return np.array(change_ratios)
        
        change_ratios = compute_change_ratios()
        use_adaptive = False
        
        if len(change_ratios) > 0:
            avg_change = np.mean(change_ratios)
            max_change = np.max(change_ratios)
            use_adaptive = max_change > avg_change * 3.0
            
        # 创建插值函数（默认使用PCHIP，变化大时使用自适应混合）
        if use_adaptive:
            # 自适应混合插值：变化大的区间混合线性插值，变化小的区间使用PCHIP
            x_func_pchip = PchipInterpolator(frames, x_coords)
            y_func_pchip = PchipInterpolator(frames, y_coords)
            width_func_pchip = PchipInterpolator(frames, widths)
            height_func_pchip = PchipInterpolator(frames, heights)
            
            x_func_linear = interp1d(frames, x_coords, kind='linear', bounds_error=False, fill_value='extrapolate')
            y_func_linear = interp1d(frames, y_coords, kind='linear', bounds_error=False, fill_value='extrapolate')
            width_func_linear = interp1d(frames, widths, kind='linear', bounds_error=False, fill_value='extrapolate')
            height_func_linear = interp1d(frames, heights, kind='linear', bounds_error=False, fill_value='extrapolate')
            
            threshold = avg_change * 2.0
            
            def create_mixed_func(func_pchip, func_linear):
                def mixed_func(frame_idx):
                    if frame_idx <= frames[0]:
                        return float(func_pchip(frame_idx))
                    if frame_idx >= frames[-1]:
                        return float(func_pchip(frame_idx))
                    
                    interval_idx = np.searchsorted(frames, frame_idx) - 1
                    interval_idx = max(0, min(interval_idx, len(change_ratios) - 1))
                    
                    change_rate = change_ratios[interval_idx]
                    if change_rate > threshold:
                        linear_weight = min(1.0, (change_rate - threshold) / threshold)
                        pchip_weight = 1.0 - linear_weight
                    else:
                        pchip_weight = 1.0
                        linear_weight = 0.0
                    
                    pred_pchip = float(func_pchip(frame_idx))
                    pred_linear = float(func_linear(frame_idx))
                    return pchip_weight * pred_pchip + linear_weight * pred_linear
                
                return mixed_func
            
            x_func = create_mixed_func(x_func_pchip, x_func_linear)
            y_func = create_mixed_func(y_func_pchip, y_func_linear)
            width_func = create_mixed_func(width_func_pchip, width_func_linear)
            height_func = create_mixed_func(height_func_pchip, height_func_linear)
        else:
            # 标准PCHIP插值
            x_func = PchipInterpolator(frames, x_coords)
            y_func = PchipInterpolator(frames, y_coords)
            width_func = PchipInterpolator(frames, widths)
            height_func = PchipInterpolator(frames, heights)
        
        # 预测所有帧的位置
        result = {}
        for frame_idx in range(total_frames):
            # 如果该帧已有标注，使用标注值
            if frame_idx in annotations:
                result[frame_idx] = annotations[frame_idx]
            else:
                # 预测位置
                pred_x = max(0, min(width, float(x_func(frame_idx))))
                pred_y = max(0, min(height, float(y_func(frame_idx))))
                pred_w = max(10, min(width, float(width_func(frame_idx))))
                pred_h = max(10, min(height, float(height_func(frame_idx))))
                
                result[frame_idx] = (pred_x, pred_y, pred_w, pred_h)
        
        return result

class MobileSAM:
    def __init__(self, image, checkpoint="mobile_sam.pt"):
        """
        Initialize MobileSAM - lightweight SAM for CPU/mobile devices
        
        Args:
            image_path: Path to input image
            checkpoint: Path to mobile_sam.pt checkpoint
        """
        
        self.image = image
        
        self.image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        self.cv_image = image
        
        # Initialize MobileSAM model (uses vit_t - Tiny ViT)
        self.sam = sam_model_registry["vit_t"](checkpoint=checkpoint)
        
        # Move to CPU (MobileSAM is designed for CPU)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.sam.to(device=device)
        
        self.bboxes = []
        self.masks = []

    def segment(self):
        """
        Perform automatic mask generation on the entire image
        
        Returns:
            bboxes: List of bounding boxes [(x, y, w, h), ...]
        """
        mask_generator = SamAutomaticMaskGenerator(self.sam)
        masks = mask_generator.generate(self.image)
        self.bboxes = []
        self.masks = []
        
        for mask in masks:
            bbox = mask['bbox']
            self.bboxes.append(bbox)
            self.masks.append(mask['segmentation'])
        
        return self.bboxes
    
    def segment_with_points(self, points, labels):
        """
        Segment using point prompts
        
        Args:
            points: numpy array of shape (N, 2) with (x, y) coordinates
            labels: numpy array of shape (N,) with labels:
                    0=background, 1=foreground
        
        Returns:
            mask: Binary segmentation mask
        """
        from mobile_sam import SamPredictor
        
        predictor = SamPredictor(self.sam)
        predictor.set_image(self.image)
        
        masks, scores, logits = predictor.predict(
            point_coords=points,
            point_labels=labels,
            multimask_output=False,
        )
        
        mask = masks[0]
        self.masks.append(mask)
        
        return mask
    
    def segment_with_bbox(self, bbox):
        """
        Segment using bounding box prompt
        
        Args:
            bbox: tuple (x, y, width, height) or array [[x1, y1, x2, y2]]
        
        Returns:
            mask: Binary segmentation mask
        """
        from mobile_sam import SamPredictor
        
        # Convert (x, y, w, h) to [[x1, y1, x2, y2]]
        if len(bbox) == 4 and isinstance(bbox, (tuple, list)):
            x, y, w, h = bbox
            input_box = np.array([[x, y, x + w, y + h]])
        else:
            input_box = np.array([bbox])
        
        predictor = SamPredictor(self.sam)
        predictor.set_image(self.image)
        
        masks, scores, logits = predictor.predict(
            point_coords=None,
            point_labels=None,
            box=input_box,
            multimask_output=False,
        )
        
        mask = masks[0]
        self.bboxes.append(bbox)
        self.masks.append(mask)
        
        return mask
    
    def segment_multiple_bboxes(self, bboxes):
        """
        Segment multiple objects given their bounding boxes
        
        Args:
            bboxes: list of tuples [(x, y, width, height), ...]
        
        Returns:
            masks: list of binary segmentation masks
        """
        masks = []
        self.bboxes = []
        self.masks = []
        
        for bbox in bboxes:
            mask = self.segment_with_bbox(bbox)
            masks.append(mask)
        
        return masks
    
    def visualize_segmentation_result(self, output_path=None):
        """
        Visualize bounding boxes on image
        
        Args:
            output_path: Path to save output image (optional)
        
        Returns:
            output_path: Path where image was saved
        """
        # Create a copy
        img_copy = self.cv_image.copy()
        
        for bbox in self.bboxes:
            if len(bbox) == 4:
                x, y, w, h = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
                cv2.rectangle(img_copy, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Generate output path
        if output_path is None:
            base, ext = os.path.splitext(self.image_path)
            output_path = f"{base}_mobilesam_segmented{ext}"
        
        cv2.imwrite(output_path, img_copy)
        print(f"Saved segmentation to: {output_path}")
        
        return output_path
    
    def visualize_masks(self, output_path=None):
        """
        Visualize segmentation masks overlaid on image
        
        Args:
            output_path: Path to save output image
            
        Returns:
            output_path: Path where image was saved
        """
        img_copy = self.cv_image.copy()
        
        # Create colored overlay for each mask
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255)]
        
        for idx, mask in enumerate(self.masks):
            color = colors[idx % len(colors)]
            # Create colored mask
            colored_mask = np.zeros_like(img_copy)
            colored_mask[mask > 0] = color
            # Blend with original image
            img_copy = cv2.addWeighted(img_copy, 0.7, colored_mask, 0.3, 0)
        
        if output_path is None:
            base, ext = os.path.splitext(self.image_path)
            output_path = f"{base}_mobilesam_masks{ext}"
        
        cv2.imwrite(output_path, img_copy)
        print(f"Saved masks to: {output_path}")
        
        return output_path


class KCF:
    # Define video path when initializing
    def __init__(self, video_path):
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            print(f"无法打开视频文件 {video_path}")
            return None

    def release(self):
        self.cap.release()

    def predict_frames(self, starting_frame_bbox, starting_frame_num=0, ending_frame_num=60):
        """
        预测多帧中目标的位置
        """

        # reset cap before reading frames
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, starting_frame_num)

        ret, starting_frame = self.cap.read()
        if not ret:
            print(f"无法读取第 {starting_frame} 帧，视频可能结束")
            self.release()
            return None

        print("成功读取起始帧。")

        height, width = starting_frame.shape[:2]
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

        print(f"视频尺寸: {width}x{height}")
        print(f"视频帧率: {fps:.2f} FPS")
        print(f"总帧数: {total_frames-starting_frame_num}")
        print(f"原始边界框: {starting_frame_bbox}")
        print("准备创建跟踪器...")

        # 使用TrackerMIL跟踪器
        try:
            tracker = cv2.TrackerMIL_create()
            print("成功创建跟踪器")
        except Exception as e:
            print(f"创建跟踪器失败: {e}")
            self.release()
            return None

        # 将边界框转换为OpenCV格式 (x, y, width, height)
        adjusted_bbox = tuple(starting_frame_bbox)

        print(f"尝试初始化跟踪器，边界框: {adjusted_bbox}")
        try:
            success = tracker.init(starting_frame, adjusted_bbox)
            print(f"跟踪器初始化结果: {success}")

            # 处理返回None的情况
            if success is None:
                print("跟踪器初始化返回None，尝试继续执行")
                success = True  # 假设初始化成功
            elif not success:
                print("跟踪器初始化明确失败")
                self.release()
                return None
        except Exception as e:
            print(f"跟踪器初始化异常: {e}")
            self.release()
            return None

        # 跟踪多帧
        tracking_results = {}

        print(f"开始根据 {starting_frame_num} 帧跟踪 {ending_frame_num} 帧...")

        self.cap.set(cv2.CAP_PROP_POS_FRAMES, starting_frame_num)
        for frame_num in range(starting_frame_num, ending_frame_num + 1):
            ret, frame = self.cap.read()
            if not ret:
                print(f"无法读取第 {frame_num + 1} 帧，视频可能结束")
                break

            # 更新跟踪器
            success, bbox = tracker.update(frame)

            if success:
                # 将浮点数转换为整数
                bbox = tuple(map(int, bbox))
                tracking_results[frame_num] = bbox
                print(f"第 {frame_num + 1} 帧跟踪成功: {bbox}")
            else:
                print(f"第 {frame_num + 1} 帧跟踪失败")
                tracking_results[frame_num] = None

        return tracking_results

class SAM:
    def __init__(self, image):
        self.sam = sam_model_registry["vit_b"](checkpoint="sam_vit_b_01ec64.pth")
        self.image = image
        
    def segment(self):
        mask_generator = SamAutomaticMaskGenerator(self.sam)
        masks = mask_generator.generate(self.image)
        self.bboxes = []
        for mask in masks:
            bbox = mask['bbox']
            self.bboxes.append(bbox)
        return self.bboxes

    def visualize_segmentation_result(self):
        for bbox in self.bboxes:
            x, y, w, h = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])  # Convert to integers
            # Draw the rectangle on the image
            cv2.rectangle(self.image, (x, y), (x + w, y + h), (255, 0, 0), 2)  # Blue color with thickness 2

        # Save the image
        base, ext = os.path.splitext(self.image_path)
        output_path = f"{base}_segmented{ext}"

        cv2.imwrite(output_path, self.image)
        # # Display the image
        # cv2.imshow('Segmented Image', image)

        return output_path

###########################################################################################################################
class RMBG():
    def __init__(self, image_path):
        self.image_path = image_path
        base, ext = os.path.splitext(self.image_path)
        self.foreground_boundary_path = f"{base}_foreground_boundary{ext}"
        self.foreground_path = f"{base}_foreground{ext}"

        # Load model
        self.model = AutoModelForImageSegmentation.from_pretrained("RMBG-1.4", trust_remote_code=True)

    def preprocess_image(im: np.ndarray, model_input_size: list) -> torch.Tensor:
        if len(im.shape) < 3:
            im = im[:, :, np.newaxis]
        im_tensor = torch.tensor(im, dtype=torch.float32).permute(2, 0, 1)
        im_tensor = F.interpolate(torch.unsqueeze(im_tensor, 0), size=model_input_size, mode='bilinear')
        image = torch.divide(im_tensor, 255.0)
        image = normalize(image, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
        return image

    def postprocess_image(result: torch.Tensor, im_size: list) -> np.ndarray:
        result = torch.squeeze(F.interpolate(result, size=im_size, mode='bilinear'), 0)
        binary_mask = (result > 0.5).float()  # Create a binary mask
        im_array = (binary_mask * 255).permute(1, 2, 0).cpu().data.numpy().astype(np.uint8)
        im_array = np.squeeze(im_array)
        return im_array

    def remove_background(self):
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model.to(device)

        # Prepare input
        orig_im = io.imread(self.image_path)
        orig_im_size = orig_im.shape[0:2]
        model_input_size = [1024, 1024]
        image = self.preprocess_image(orig_im, model_input_size).to(device)

        # Inference
        result = self.model(image)

        # Post process
        self.result_image = self.postprocess_image(result[0][0], orig_im_size)

        # Find boundaries using Canny edge detection
        edges = filters.sobel(self.result_image)
        self.edges = (edges * 255 / edges.max()).astype(np.uint8)

    # Save boundary image
    def save_boundary_image(self):
        boundary_image = Image.fromarray(self.edges)
        boundary_image.save(self.foreground_boundary_path)

    # Save foreground image with alpha channel
    def save_foreground_image(self):
        pil_mask_im = Image.fromarray(self.result_image)
        orig_image = Image.open(self.image_path)
        no_bg_image = orig_image.copy()
        no_bg_image.putalpha(pil_mask_im)
        no_bg_image.save(self.foreground_path)
