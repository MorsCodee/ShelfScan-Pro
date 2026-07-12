import json
import os
import numpy as np
from datetime import datetime


def calculate_drift(baseline_scores, current_scores, threshold=0.15):
    """
    Compares current confidence scores against baseline.
    Returns drift analysis results.
    
    baseline_scores → list of confidence scores from early scans
    current_scores  → list of confidence scores from recent scans
    threshold       → how much drift is allowed (15% default)
    """

    # Need at least some data to compare
    if not baseline_scores or not current_scores:
        return {
            "drift_detected": False,
            "message": "Not enough data for drift analysis.",
            "baseline_mean": 0,
            "current_mean": 0,
            "drift_percentage": 0,
            "status": "insufficient_data"
        }

    # Calculate mean confidence for both periods
    baseline_mean = float(np.mean(baseline_scores))
    current_mean = float(np.mean(current_scores))

    # Calculate how much it drifted as a percentage
    if baseline_mean == 0:
        drift_percentage = 0
    else:
        drift_percentage = abs(baseline_mean - current_mean) / baseline_mean

    drift_detected = drift_percentage > threshold

    # Build status message
    if drift_detected:
        direction = "decreased" if current_mean < baseline_mean else "increased"
        message = (
            f"Model drift detected! Average confidence {direction} by "
            f"{drift_percentage * 100:.1f}% from baseline. "
            f"Consider retraining the model."
        )
        status = "drift_detected"
    else:
        message = (
            f"Model performing normally. "
            f"Confidence drift is {drift_percentage * 100:.1f}% "
            f"(threshold: {threshold * 100:.0f}%)."
        )
        status = "healthy"

    return {
        "drift_detected": drift_detected,
        "message": message,
        "baseline_mean": round(baseline_mean * 100, 1),
        "current_mean": round(current_mean * 100, 1),
        "drift_percentage": round(drift_percentage * 100, 1),
        "threshold_percentage": threshold * 100,
        "baseline_sample_size": len(baseline_scores),
        "current_sample_size": len(current_scores),
        "status": status,
        "checked_at": datetime.utcnow().isoformat()
    }


import json
import os
import numpy as np
from datetime import datetime


def calculate_drift(baseline_scores, current_scores, threshold=0.15):
    """
    Compares current confidence scores against baseline.
    Returns drift analysis results.
    
    baseline_scores → list of confidence scores from early scans
    current_scores  → list of confidence scores from recent scans
    threshold       → how much drift is allowed (15% default)
    """

    # Need at least some data to compare
    if not baseline_scores or not current_scores:
        return {
            "drift_detected": False,
            "message": "Not enough data for drift analysis.",
            "baseline_mean": 0,
            "current_mean": 0,
            "drift_percentage": 0,
            "status": "insufficient_data"
        }

    # Calculate mean confidence for both periods
    baseline_mean = float(np.mean(baseline_scores))
    current_mean = float(np.mean(current_scores))

    # Calculate how much it drifted as a percentage
    if baseline_mean == 0:
        drift_percentage = 0
    else:
        drift_percentage = abs(baseline_mean - current_mean) / baseline_mean

    drift_detected = drift_percentage > threshold

    # Build status message
    if drift_detected:
        direction = "decreased" if current_mean < baseline_mean else "increased"
        message = (
            f"Model drift detected! Average confidence {direction} by "
            f"{drift_percentage * 100:.1f}% from baseline. "
            f"Consider retraining the model."
        )
        status = "drift_detected"
    else:
        message = (
            f"Model performing normally. "
            f"Confidence drift is {drift_percentage * 100:.1f}% "
            f"(threshold: {threshold * 100:.0f}%)."
        )
        status = "healthy"

    return {
        "drift_detected": drift_detected,
        "message": message,
        "baseline_mean": round(baseline_mean * 100, 1),
        "current_mean": round(current_mean * 100, 1),
        "drift_percentage": round(drift_percentage * 100, 1),
        "threshold_percentage": threshold * 100,
        "baseline_sample_size": len(baseline_scores),
        "current_sample_size": len(current_scores),
        "status": status,
        "checked_at": datetime.utcnow().isoformat()
    }


def get_drift_report(jobs):
    """
    Takes all scan jobs, splits into baseline vs recent,
    extracts confidence scores, runs drift analysis.
    """

    # Need at least 4 scans to do meaningful comparison
    completed_jobs = [j for j in jobs if j.status == "completed"]

    if len(completed_jobs) < 4:
        return {
            "drift_detected": False,
            "status": "insufficient_data",
            "message": f"Need at least 4 completed scans for drift analysis. "
                      f"Currently have {len(completed_jobs)}.",
            "completed_scans": len(completed_jobs),
            "scans_needed": 4
        }

    # Sort by date — oldest first
    sorted_jobs = sorted(completed_jobs, key=lambda j: j.created_at)

    # Split into baseline (first half) and current (second half)
    midpoint = len(sorted_jobs) // 2
    baseline_jobs = sorted_jobs[:midpoint]
    current_jobs = sorted_jobs[midpoint:]

    # Extract confidence scores from each group
    baseline_scores = _extract_confidence_scores(baseline_jobs)
    current_scores = _extract_confidence_scores(current_jobs)

    # Run drift analysis
    drift_result = calculate_drift(baseline_scores, current_scores)

    # Add extra context
    drift_result["total_scans_analyzed"] = len(completed_jobs)
    drift_result["baseline_period"] = {
        "from": baseline_jobs[0].created_at.isoformat(),
        "to": baseline_jobs[-1].created_at.isoformat(),
        "scans": len(baseline_jobs)
    }
    drift_result["current_period"] = {
        "from": current_jobs[0].created_at.isoformat(),
        "to": current_jobs[-1].created_at.isoformat(),
        "scans": len(current_jobs)
    }

    return drift_result


def _extract_confidence_scores(jobs):
    """
    Pulls all individual detection confidence scores
    from a list of scan jobs.
    """
    scores = []

    for job in jobs:
        results = job.get_results()
        if not results:
            continue

        detections = results.get("detections", [])
        for det in detections:
            confidence = det.get("confidence", 0)
            if confidence > 0:
                scores.append(confidence)

    return scores