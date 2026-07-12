import cv2
import numpy as np
from ultralytics import YOLO
from flask import current_app
import os
import uuid

# This variable holds the model in memory
# We load it once and reuse it for every scan
_model = None

def get_model():
    """
    Load the YOLOv8 model once and cache it.
    If already loaded, just return it directly.
    """
    global _model

    if _model is None:
        model_path = current_app.config["YOLO_MODEL"]
        print(f"[ShelfScan] Loading YOLOv8 model: {model_path}")
        _model = YOLO(model_path)
        print("[ShelfScan] Model loaded successfully!")

    return _model


def analyze_shelf_image(image_path):
    """
    Main function — takes an image path, runs YOLOv8,
    returns a dictionary of everything found.
    """

    # --- Step 1: Load the image ---
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Could not read image at path: {image_path}")

    original_height, original_width = image.shape[:2]

    # --- Step 2: Run YOLOv8 inference ---
    model = get_model()
    confidence = current_app.config["CONFIDENCE_THRESHOLD"]

    results = model(image, conf=confidence, verbose=False)

    # --- Step 3: Parse the results ---
    detections = []
    annotated_image = image.copy()

    result = results[0]  # We only process one image at a time

    # Check if we got any detections at all
    if result.boxes is not None:
        boxes = result.boxes
        masks = result.masks  # Segmentation masks (can be None for non-seg models)

        for i, box in enumerate(boxes):

            # Bounding box coordinates
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

            # Confidence score and class
            confidence_score = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = model.names[class_id]

            # Build detection dictionary
            detection = {
                "id": i,
                "class_name": class_name,
                "confidence": round(confidence_score, 3),
                "bbox": {
                    "x1": x1, "y1": y1,
                    "x2": x2, "y2": y2,
                    "width": x2 - x1,
                    "height": y2 - y1
                }
            }
            detections.append(detection)

            # --- Step 4: Draw on the image ---
            color = _get_color_for_class(class_id)

            # Draw bounding box
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)

            # Draw label background
            label = f"{class_name} {confidence_score:.0%}"
            (label_w, label_h), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                annotated_image,
                (x1, y1 - label_h - 8),
                (x1 + label_w + 4, y1),
                color, -1  # -1 means filled rectangle
            )

            # Draw label text
            cv2.putText(
                annotated_image, label,
                (x1 + 2, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                (255, 255, 255), 1  # White text
            )

            # Draw segmentation mask if available
            if masks is not None and i < len(masks):
                mask = masks[i].data[0].numpy()
                mask = cv2.resize(
                    mask, (original_width, original_height)
                )
                mask = (mask > 0.5).astype(np.uint8)

                colored_mask = np.zeros_like(annotated_image)
                colored_mask[mask == 1] = color

                annotated_image = cv2.addWeighted(
                    annotated_image, 1.0,
                    colored_mask, 0.4,
                    0
                )

    # --- Step 5: Detect empty shelf gaps ---
    empty_gaps = _detect_empty_gaps(
        original_width, original_height, detections
    )

    # --- Step 6: Save the annotated image ---
    results_folder = current_app.config["RESULTS_FOLDER"]
    result_filename = f"result_{uuid.uuid4().hex[:8]}.jpg"
    result_path = os.path.join(results_folder, result_filename)
    cv2.imwrite(result_path, annotated_image)

    # --- Step 7: Build and return final summary ---
    return {
        "total_detections": len(detections),
        "detections": detections,
        "empty_gaps": empty_gaps,
        "compliance_score": _calculate_compliance_score(
            len(detections), empty_gaps
        ),
        "image_size": {
            "width": original_width,
            "height": original_height
        },
        "result_image": result_filename
    }


def _detect_empty_gaps(width, height, detections):
    """
    Simple gap detection — divides shelf into zones
    and checks which zones have no products detected.
    """
    gaps = []

    # Divide the shelf image into 5 horizontal zones
    zone_width = width // 5

    for zone_index in range(5):
        zone_x1 = zone_index * zone_width
        zone_x2 = zone_x1 + zone_width

        # Check if any detection overlaps this zone
        zone_has_product = False

        for det in detections:
            det_center_x = (det["bbox"]["x1"] + det["bbox"]["x2"]) // 2
            if zone_x1 <= det_center_x <= zone_x2:
                zone_has_product = True
                break

        if not zone_has_product:
            gaps.append({
                "zone": zone_index + 1,
                "x1": zone_x1,
                "x2": zone_x2,
                "y1": 0,
                "y2": height
            })

    return gaps


def _calculate_compliance_score(total_products, total_gaps):
    """
    Simple compliance score:
    More products + fewer gaps = higher score
    """
    total_zones = 5

    if total_zones == 0:
        return 0.0

    filled_zones = total_zones - len(total_gaps)
    score = (filled_zones / total_zones) * 100

    return round(score, 1)


def _get_color_for_class(class_id):
    """
    Returns a unique BGR color for each class ID.
    This makes different products visually distinct.
    """
    colors = [
        (255, 100, 100),   # Blue
        (100, 255, 100),   # Green
        (100, 100, 255),   # Red
        (255, 255, 100),   # Cyan
        (255, 100, 255),   # Magenta
        (100, 255, 255),   # Yellow
        (255, 165, 0),     # Orange
        (147, 20, 255),    # Purple
    ]
    return colors[class_id % len(colors)]