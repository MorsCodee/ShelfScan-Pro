import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("DEBUG", "True") == "True"

    # File uploads
    BASE_DIR = os.path.dirname(__file__)
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    RESULTS_FOLDER = os.path.join(BASE_DIR, "results")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max

    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

    # Database (SQLite for now, easy to swap to PostgreSQL later)
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///shelfscam.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Celery + Redis
    CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ML Model settings
    YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n-seg.pt")
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.10"))

    # Drift monitoring baseline
    DRIFT_THRESHOLD = float(os.getenv("DRIFT_THRESHOLD", "0.15"))  # 15% drift = alert
    ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "pZ3VLTh7lahwzQY3bHzz")