from flask import Blueprint, jsonify, request, current_app
from app import db
from app.models import ScanJob
from app.ml.detector import analyze_shelf_image
import os
import uuid

api_bp = Blueprint("api", __name__)


# ─────────────────────────────────────────
# HELPER FUNCTION
# ─────────────────────────────────────────

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    allowed = current_app.config["ALLOWED_EXTENSIONS"]
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


# ─────────────────────────────────────────
# ROUTE 1 — Health Check
# ─────────────────────────────────────────

@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "ShelfScan Pro API is running"
    }), 200


# ─────────────────────────────────────────
# ROUTE 2 — Upload & Analyze
# ─────────────────────────────────────────

@api_bp.route("/upload", methods=["POST"])
def upload_and_analyze():
    """
    Receives an image, runs YOLOv8 on it,
    saves results to DB, returns JSON.
    """

    # Step 1 — Check if image was actually sent
    if "image" not in request.files:
        return jsonify({
            "error": "No image found in request. Send image with key 'image'."
        }), 400

    file = request.files["image"]

    # Step 2 — Check if filename is empty
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    # Step 3 — Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({
            "error": "File type not allowed. Use JPG or PNG."
        }), 400

    # Step 4 — Generate unique filename and save to uploads/
    job_id = str(uuid.uuid4())
    extension = file.filename.rsplit(".", 1)[1].lower()
    safe_filename = f"{job_id}.{extension}"
    upload_path = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        safe_filename
    )
    file.save(upload_path)

    # Step 5 — Create job record in database
    job = ScanJob(
        id=job_id,
        original_filename=file.filename,
        upload_path=upload_path,
        status="processing"
    )
    db.session.add(job)
    db.session.commit()

    # Step 6 — Run YOLOv8 detection
    try:
        results = analyze_shelf_image(upload_path)

        # Step 7 — Save results to database
        job.set_results(results)
        db.session.commit()

        return jsonify({
            "success": True,
            "job_id": job_id,
            "data": job.to_dict()
        }), 200

    except Exception as e:
        # If anything goes wrong, mark job as failed
        job.status = "failed"
        job.error_message = str(e)
        db.session.commit()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ─────────────────────────────────────────
# ROUTE 3 — Get Single Job Results
# ─────────────────────────────────────────

@api_bp.route("/job/<job_id>", methods=["GET"])
def get_job(job_id):
    """
    Returns the status and results of a specific scan job.
    Frontend polls this to check if processing is done.
    """
    job = ScanJob.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found."}), 404

    return jsonify(job.to_dict()), 200


# ─────────────────────────────────────────
# ROUTE 4 — Get All Past Scans
# ─────────────────────────────────────────

@api_bp.route("/scans", methods=["GET"])
def get_all_scans():
    """
    Returns all past scan jobs for the dashboard.
    Most recent first.
    """
    jobs = ScanJob.query.order_by(ScanJob.created_at.desc()).all()

    return jsonify({
        "total": len(jobs),
        "scans": [job.to_dict() for job in jobs]
    }), 200


# ─────────────────────────────────────────
# ROUTE 5 — Serve Result Image
# ─────────────────────────────────────────

@api_bp.route("/results/image/<filename>", methods=["GET"])
def get_result_image(filename):
    """
    Serves the annotated result image back to the frontend.
    """
    from flask import send_from_directory
    results_folder = current_app.config["RESULTS_FOLDER"]
    return send_from_directory(results_folder, filename)

# ─────────────────────────────────────────
# ROUTE 6 — Generate and Download PDF Report
# ─────────────────────────────────────────

@api_bp.route("/report/<job_id>", methods=["GET"])
def generate_report(job_id):
    """
    Generates a PDF compliance report for a scan job
    and returns it as a downloadable file.
    """
    from flask import send_file
    from app.utils.pdf_report import generate_scan_report

    job = ScanJob.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found."}), 404

    if job.status != "completed":
        return jsonify({"error": "Job is not completed yet."}), 400

    try:
        results_folder = current_app.config["RESULTS_FOLDER"]
        pdf_filename = generate_scan_report(job, results_folder)
        pdf_path = os.path.join(results_folder, pdf_filename)

        return send_file(
            pdf_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"ShelfScan_Report_{job.id[:8]}.pdf"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ─────────────────────────────────────────
# ROUTE 7 — Drift Monitoring
# ─────────────────────────────────────────

@api_bp.route("/drift", methods=["GET"])
def get_drift_status():
    """
    Analyzes confidence score drift across all scan jobs.
    Alerts if model performance is degrading.
    """
    from app.utils.drift_monitor import get_drift_report

    jobs = ScanJob.query.order_by(ScanJob.created_at.asc()).all()
    drift_report = get_drift_report(jobs)

    return jsonify(drift_report), 200