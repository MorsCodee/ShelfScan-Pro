# 📦 ShelfScan Pro — AI Retail Intelligence Platform

> An end-to-end AI-powered retail shelf monitoring system that detects products, identifies empty gaps, calculates compliance scores, and generates PDF reports — all from a single shelf image.
---

## What It Does

ShelfScan Pro allows retail store managers to upload a shelf image and instantly receive:

- **Product Detection** — AI identifies all products on the shelf using YOLOv8 + Roboflow
- **Empty Gap Analysis** — Automatically detects which shelf zones are understocked
- **Compliance Scoring** — Generates a 0–100% compliance score based on shelf fullness
- **PDF Reports** — One-click downloadable compliance report with all findings
- **Drift Monitoring** — Tracks model confidence over time and alerts when performance degrades
- **Scan History Dashboard** — View all past scans with trends and analytics

---

## System Architecture
React Frontend (Vite)
↓
axios HTTP
↓
Flask REST API (7 endpoints)
↓
YOLOv8 + Roboflow Detection Pipeline
↓
SQLite Database (SQLAlchemy)
↓
Results → PDF Reports + Annotated Images

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Axios, React Dropzone |
| Backend | Python, Flask, Flask-CORS, SQLAlchemy |
| ML / CV | YOLOv8, Roboflow Inference SDK, OpenCV |
| Database | SQLite |
| Reports | ReportLab (PDF generation) |
| Monitoring | Custom drift detection (Evidently-inspired) |

---

## Key Features

### AI Detection Pipeline
- YOLOv8 instance segmentation for product detection
- Roboflow retail-specific model for improved accuracy
- Automatic fallback to general YOLOv8 if Roboflow fails
- Annotated result images with bounding boxes and confidence scores

### Analytics Dashboard
- Real-time compliance score with color coding (green/yellow/red)
- Historical scan table with status tracking
- Model drift monitoring banner — alerts when confidence drops >15%
- Average compliance trends across all scans

### PDF Compliance Reports
- Auto-generated branded PDF reports
- Includes scan metadata, detection table, gap analysis
- Downloadable with one click from the results page

### Gap Detection
- Divides shelf into 5 equal zones
- Identifies which zones have no detected products
- Reports exact pixel coordinates of empty zones

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## Environment Variables

Create a `.env` file in `backend/`:

> Upload a shelf image → Get instant AI analysis

- **Drag & Drop Upload** with live preview
- **Side-by-side comparison** — original vs annotated result
- **Detection list** with confidence bars per product
- **Empty zone report** with pixel coordinates
- **Compliance dashboard** with scan history

---

## About

Built by **Mehak Faheem** — BS Artificial Intelligence student at Dawood University of Engineering and Technology, Karachi.

This project demonstrates production-level ML engineering including:
- End-to-end full stack development
- Computer vision pipeline with real API integrations
- Database persistence and job tracking
- Automated report generation
- ML model performance monitoring

---

## Contact
- Email: mehakfaheem1234@gmail.com