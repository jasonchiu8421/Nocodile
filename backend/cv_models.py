
import cv2
from segment_anything import SamAutomaticMaskGenerator, sam_model_registry
import os
from PIL import Image
from skimage import io, filters
import torch
import torch.nn.functional as F
from transformers import Aut    oModelForImageSegmentation
from torchvision.transforms.functional import normalize
import numpy as np

# Users shall create an instance of KCF class for each video, multiple predictions can be made on the same video instance
# starting_frame_bbox is in (x, y, width, height) format

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
        tracking_results = []

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
                tracking_results.append(bbox)
                print(f"第 {frame_num + 1} 帧跟踪成功: {bbox}")
            else:
                print(f"第 {frame_num + 1} 帧跟踪失败")
                tracking_results.append(None)

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
