from app import db
from datetime import datetime
import json

class ScanJob(db.Model):
    """
    Represents one shelf scan job.
    Created when user uploads an image.
    Updated when YOLOv8 finishes processing.
    """
    __tablename__ = "scan_jobs"

    # --- Identity ---
    id = db.Column(db.String(36), primary_key=True)  
    # UUID like "a3f9c821-..."

    # --- File info ---
    original_filename = db.Column(db.String(255), nullable=False)
    upload_path = db.Column(db.String(500), nullable=False)
    result_image = db.Column(db.String(255), nullable=True)

    # --- Job status ---
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )
    # pending → processing → completed → failed

    # --- ML Results (stored as JSON string) ---
    results_json = db.Column(db.Text, nullable=True)

    # --- Metrics ---
    total_detections = db.Column(db.Integer, default=0)
    compliance_score = db.Column(db.Float, default=0.0)
    total_gaps = db.Column(db.Integer, default=0)

    # --- Error tracking ---
    error_message = db.Column(db.Text, nullable=True)

    # --- Timestamps ---
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    def set_results(self, results_dict):
        """
        Converts Python dictionary to JSON string for storage.
        """
        self.results_json = json.dumps(results_dict)
        self.total_detections = results_dict.get("total_detections", 0)
        self.compliance_score = results_dict.get("compliance_score", 0.0)
        self.total_gaps = len(results_dict.get("empty_gaps", []))
        self.result_image = results_dict.get("result_image")
        self.status = "completed"
        self.completed_at = datetime.utcnow()

    def get_results(self):
        """
        Converts JSON string back to Python dictionary.
        """
        if self.results_json:
            return json.loads(self.results_json)
        return None

    def to_dict(self):
        """
        Converts entire job to dictionary.
        This is what gets sent to the frontend as JSON.
        """
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "status": self.status,
            "total_detections": self.total_detections,
            "compliance_score": self.compliance_score,
            "total_gaps": self.total_gaps,
            "result_image": self.result_image,
            "results": self.get_results(),
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
            "completed_at": (
                self.completed_at.isoformat()
                if self.completed_at else None
            )
        }