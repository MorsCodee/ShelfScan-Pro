import cv2
import numpy as np
from ultralytics import YOLO
from flask import current_app
import os
import uuid

def analyze_with_roboflow(image_path, api_key):
    """
    Uses Roboflow retail shelf model for better product detection.
    """
    from inference_sdk import InferenceHTTPClient

    client = InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key=api_key
    )

    result = client.infer(
        image_path,
        model_id="retail-shelf-detection-svdeo/1"
    )

    detections = []
    for i, pred in enumerate(result.get("predictions", [])):
        detections.append({
            "id": i,
            "class_name": pred["class"],
            "confidence": round(pred["confidence"], 3),
            "bbox": {
                "x1": int(pred["x"] - pred["width"] / 2),
                "y1": int(pred["y"] - pred["height"] / 2),
                "x2": int(pred["x"] + pred["width"] / 2),
                "y2": int(pred["y"] + pred["height"] / 2),
                "width": int(pred["width"]),
                "height": int(pred["height"])
            }
        })

    return detections

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
    Main function — takes an image path, runs Roboflow retail model,
    returns a dictionary of everything found.
    """

    # --- Step 1: Load the image ---
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Could not read image at path: {image_path}")

    original_height, original_width = image.shape[:2]
    annotated_image = image.copy()

    # --- Step 2: Run Roboflow retail model ---
    try:
        from inference_sdk import InferenceHTTPClient

        api_key = current_app.config.get("ROBOFLOW_API_KEY", "")

        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key
        )

        result = client.infer(
            image_path,
            model_id="retail-shelf-detection-svdeo/4"
        )

        detections = []
        for i, pred in enumerate(result.get("predictions", [])):
            x1 = int(pred["x"] - pred["width"] / 2)
            y1 = int(pred["y"] - pred["height"] / 2)
            x2 = int(pred["x"] + pred["width"] / 2)
            y2 = int(pred["y"] + pred["height"] / 2)

            class_name = pred.get("class", "product")
            if class_name == "0" or class_name.isdigit():
                class_name = "product"
            confidence_score = round(pred["confidence"], 3)

            detection = {
                "id": i,
                "class_name": class_name,
                "confidence": confidence_score,
                "bbox": {
                    "x1": x1, "y1": y1,
                    "x2": x2, "y2": y2,
                    "width": x2 - x1,
                    "height": y2 - y1
                }
            }
            detections.append(detection)

            # Draw on image
            color = _get_color_for_class(i % 8)
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)

            label = f"{class_name} {confidence_score:.0%}"
            (label_w, label_h), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                annotated_image,
                (x1, y1 - label_h - 8),
                (x1 + label_w + 4, y1),
                color, -1
            )
            cv2.putText(
                annotated_image, label,
                (x1 + 2, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                (255, 255, 255), 1
            )

        print(f"[ShelfScan] Roboflow detected {len(detections)} products")

    except Exception as e:
        print(f"[ShelfScan] Roboflow failed, falling back to YOLOv8: {e}")

        # Fallback to original YOLOv8
        model = get_model()
        confidence = current_app.config["CONFIDENCE_THRESHOLD"]
        results = model(image, conf=confidence, verbose=False)
        result = results[0]
        detections = []

        if result.boxes is not None:
            for i, box in enumerate(result.boxes):
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                confidence_score = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model.names[class_id]

                detections.append({
                    "id": i,
                    "class_name": class_name,
                    "confidence": round(confidence_score, 3),
                    "bbox": {
                        "x1": x1, "y1": y1,
                        "x2": x2, "y2": y2,
                        "width": x2 - x1,
                        "height": y2 - y1
                    }
                })

                color = _get_color_for_class(class_id)
                cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)
                label = f"{class_name} {confidence_score:.0%}"
                cv2.putText(
                    annotated_image, label,
                    (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (255, 255, 255), 1
                )

    # --- Detect empty gaps ---
    empty_gaps = _detect_empty_gaps(
        original_width, original_height, detections
    )

    # --- Save annotated image ---
    results_folder = current_app.config["RESULTS_FOLDER"]
    result_filename = f"result_{uuid.uuid4().hex[:8]}.jpg"
    result_path = os.path.join(results_folder, result_filename)
    cv2.imwrite(result_path, annotated_image)

    # --- Return results ---
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