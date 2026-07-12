from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import os


# ── Brand Colors ──
BLUE = colors.HexColor("#3b82f6")
DARK = colors.HexColor("#0f1117")
GRAY = colors.HexColor("#6b7280")
GREEN = colors.HexColor("#22c55e")
YELLOW = colors.HexColor("#f59e0b")
RED = colors.HexColor("#ef4444")
LIGHT_GRAY = colors.HexColor("#f3f4f6")
WHITE = colors.white


def get_compliance_color(score):
    if score >= 80:
        return GREEN
    elif score >= 50:
        return YELLOW
    return RED


def generate_scan_report(job, output_folder):
    """
    Generates a PDF compliance report for a scan job.
    Returns the filename of the generated PDF.
    """

    # Build output path
    pdf_filename = f"report_{job.id[:8]}.pdf"
    pdf_path = os.path.join(output_folder, pdf_filename)

    # Create document
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    # Get results data
    results = job.get_results() or {}
    detections = results.get("detections", [])
    empty_gaps = results.get("empty_gaps", [])
    compliance_score = job.compliance_score
    compliance_color = get_compliance_color(compliance_score)

    # Build styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        fontSize=24,
        textColor=WHITE,
        backColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=0,
        spaceBefore=0,
        leftIndent=-0.75 * inch,
        rightIndent=-0.75 * inch,
        borderPadding=(16, 0, 16, 0),
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=GRAY,
        alignment=TA_CENTER,
        spaceAfter=4,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontSize=13,
        textColor=DARK,
        fontName="Helvetica-Bold",
        spaceBefore=16,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        textColor=DARK,
        spaceAfter=4,
    )

    # ── Build content ──
    content = []

    # Header
    content.append(Paragraph("ShelfScan Pro", title_style))
    content.append(Spacer(1, 20))
    content.append(Paragraph("AI-Powered Shelf Compliance Report", subtitle_style))
    content.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
        subtitle_style
    ))
    content.append(Spacer(1, 16))
    content.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    content.append(Spacer(1, 16))

    # Scan info table
    content.append(Paragraph("Scan Information", section_style))
    info_data = [
        ["Scan ID", job.id[:8] + "..."],
        ["File Name", job.original_filename],
        ["Scan Date", job.created_at.strftime("%B %d, %Y")],
        ["Scan Time", job.created_at.strftime("%H:%M UTC")],
        ["Status", job.status.upper()],
    ]
    info_table = Table(info_data, colWidths=[2 * inch, 4.5 * inch])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    content.append(info_table)
    content.append(Spacer(1, 16))
    content.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY))

    # Compliance summary
    content.append(Paragraph("Compliance Summary", section_style))
    summary_data = [
        ["Metric", "Value", "Status"],
        [
            "Total Products Detected",
            str(job.total_detections),
            "Good" if job.total_detections > 0 else "None found"
        ],
        [
            "Empty Shelf Gaps",
            str(job.total_gaps),
            "None" if job.total_gaps == 0 else f" {job.total_gaps} gaps found"
        ],
        [
            "Compliance Score",
            f"{compliance_score}%",
            "Excellent" if compliance_score >= 80
            else "Needs attention" if compliance_score >= 50
            else "Critical"
        ],
    ]
    summary_table = Table(
        summary_data,
        colWidths=[2.5 * inch, 1.5 * inch, 2.5 * inch]
    )
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
    ]))
    content.append(summary_table)
    content.append(Spacer(1, 16))
    content.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY))

    # Detections table
    content.append(Paragraph(
        f"Detected Objects ({len(detections)} total)",
        section_style
    ))

    if detections:
        det_data = [["#", "Object Class", "Confidence", "Location (x1,y1 → x2,y2)"]]
        for i, det in enumerate(detections[:20]):  # max 20 rows
            bbox = det.get("bbox", {})
            det_data.append([
                str(i + 1),
                det.get("class_name", "unknown").capitalize(),
                f"{det.get('confidence', 0) * 100:.0f}%",
                f"({bbox.get('x1',0)}, {bbox.get('y1',0)}) → ({bbox.get('x2',0)}, {bbox.get('y2',0)})"
            ])

        det_table = Table(
            det_data,
            colWidths=[0.4 * inch, 1.6 * inch, 1.1 * inch, 3.4 * inch]
        )
        det_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ]))
        content.append(det_table)
    else:
        content.append(Paragraph(
            "No objects detected in this scan.",
            body_style
        ))

    content.append(Spacer(1, 16))
    content.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY))

    # Empty gaps section
    content.append(Paragraph(
        f"Empty Shelf Zones ({len(empty_gaps)} found)",
        section_style
    ))

    if empty_gaps:
        gap_data = [["Zone", "X Start", "X End", "Width (px)", "Assessment"]]
        for gap in empty_gaps:
            width_px = gap.get("x2", 0) - gap.get("x1", 0)
            gap_data.append([
                f"Zone {gap.get('zone', '?')}",
                f"{gap.get('x1', 0)}px",
                f"{gap.get('x2', 0)}px",
                f"{width_px}px",
                "Restock needed"
            ])

        gap_table = Table(
            gap_data,
            colWidths=[1 * inch, 1 * inch, 1 * inch, 1.2 * inch, 2.3 * inch]
        )
        gap_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), RED),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.HexColor("#fff5f5"), colors.HexColor("#ffe4e4")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        content.append(gap_table)
    else:
        content.append(Paragraph(
            "No empty zones detected. Shelf is fully stocked.",
            body_style
        ))

    content.append(Spacer(1, 24))
    content.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    content.append(Spacer(1, 8))
    content.append(Paragraph(
    "Generated by ShelfScan Pro - AI Retail Intelligence Platform",
    subtitle_style
    ))
    # Build the PDF
    doc.build(content)
    return pdf_filename