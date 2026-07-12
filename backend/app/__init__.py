from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow React dev server to talk to Flask
    CORS(app, origins=["http://localhost:5173"])

    # Initialize database
    db.init_app(app)

    # Register API routes
    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    # Create DB tables and ensure folders exist
    with app.app_context():
        from app import models
        db.create_all()

        import os
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        os.makedirs(app.config["RESULTS_FOLDER"], exist_ok=True)

    return app