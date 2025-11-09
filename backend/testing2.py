from ultralytics import YOLO
from pathlib import Path
model = YOLO("backend/projects/2/output/best.pt")

dataset_path = "backend/projects/2/dataset_split"
if dataset_path and Path(dataset_path).exists():
            dataset_dir = Path(dataset_path)
train_img_dir = dataset_dir / "train" / "images"
val_img_dir = dataset_dir / "val" / "images"
classes = ['zebra lines', "nocodile"]

data_yaml = {
            "train": str(train_img_dir.resolve()),
            "val": str(val_img_dir.resolve()),
            "nc": len(classes),
            "names": classes
        }
metrics = model.val(data=data_yaml)