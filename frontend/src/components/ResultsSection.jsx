import { API_BASE_URL } from "../config"

export default function ResultsSection({ results, isLoading }) {

  // Show loading state while YOLOv8 is running
  if (isLoading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingBox}>
          {/* <div style={styles.loadingIcon}> </div> */}
          <h2 style={styles.loadingTitle}>Analyzing your shelf...</h2>
          <p style={styles.loadingSubtitle}>
            YOLOv8 is detecting products, measuring gaps,
            and calculating compliance score.
          </p>
          <div style={styles.loadingBar}>
            <div style={styles.loadingBarFill} />
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if no results yet
  if (!results) return null

  const complianceColor = results.compliance_score >= 80
    ? "#22c55e"   // green
    : results.compliance_score >= 50
      ? "#f59e0b"   // yellow
      : "#ef4444"   // red

  return (
    <div style={styles.wrapper}>

      {/* ── Section Title ── */}
      <div style={styles.resultsHeader}>
        <h2 style={styles.sectionTitle}>📊 Scan Results</h2>
        <a
          href={`${API_BASE_URL}/report/${results.id}`}
          target="_blank"
          rel="noreferrer"
          style={styles.downloadBtn}
        >
          📄 Download PDF Report
        </a>
      </div>

      {/* ── Stats Row ── */}
      <div style={styles.statsRow}>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}> </div> */}
          <div style={styles.statValue}>{results.total_detections}</div>
          <div style={styles.statLabel}>Products Detected</div>
        </div>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}></div> */}
          <div style={styles.statValue}>{results.total_gaps}</div>
          <div style={styles.statLabel}>Empty Gaps</div>
        </div>

        <div style={{ ...styles.statCard, border: `1px solid ${complianceColor}33` }}>
          {/* <div style={styles.statIcon}>🎯</div> */}
          <div style={{ ...styles.statValue, color: complianceColor }}>
            {results.compliance_score}%
          </div>
          <div style={styles.statLabel}>Compliance Score</div>
        </div>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}>⏱️</div> */}
          <div style={styles.statValue}>
            {results.completed_at
              ? `${((new Date(results.completed_at) - new Date(results.created_at)) / 1000).toFixed(1)}s`
              : "—"}
            {/* If completed_at doesn't exist yet → show "—" instead of crashing. */}
          </div>
          <div style={styles.statLabel}>Processing Time</div>
        </div>

      </div>

      {/* ── Image Comparison ── */}
      <div style={styles.imageRow}>

        <div style={styles.imageCard}>
          <div style={styles.imageLabel}> Original Upload </div>
          {results.originalPreview ? (
            <img
              src={results.originalPreview}
              alt="Original shelf"
              style={styles.resultImage}
            />
          ) : (
            <div style={styles.imagePlaceholder}>
              <p style={styles.imagePlaceholderText}> Original image </p>
            </div>
          )}
        </div>

        <div style={styles.imageCard}>
          <div style={styles.imageLabel}> AI Annotated Result </div>
          {results.result_image ? (
            <img
              src={`${API_BASE_URL}/results/image/${results.result_image}`}
              alt="Annotated shelf"
              style={styles.resultImage}
            />
          ) : (
            <div style={styles.imagePlaceholder}>
              <p style={styles.imagePlaceholderText}> No result image </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Detections List ── */}
      {/* The ?. is called optional chaining. It means:
      results.results?.detections → "if results.results exists, get detections
      if it doesn't exist, return undefined instead of crashing" */}

      {
        results.results?.detections?.length > 0 && (
          <div style={styles.detectionsCard}>
            <h3 style={styles.detectionsTitle}>Detected Objects</h3>
            <div style={styles.detectionsList}>
              {results.results.detections.map((det) => (
                <div key={det.id} style={styles.detectionItem}>
                  <div style={styles.detectionLeft}>
                    <span style={styles.detectionName}>{det.class_name}</span>
                    <span style={styles.detectionCoords}>
                      x:{det.bbox.x1} y:{det.bbox.y1}
                      {" → "}
                      x:{det.bbox.x2} y:{det.bbox.y2}
                    </span>
                  </div>
                  <div style={styles.confidenceBar}>
                    <div
                      style={{
                        ...styles.confidenceFill,
                        width: `${(det.confidence * 100).toFixed(0)}%`,
                        backgroundColor: det.confidence > 0.5
                          ? "#22c55e"
                          : det.confidence > 0.3
                            ? "#f59e0b"
                            : "#ef4444"
                      }}
                    />
                    <span style={styles.confidenceText}>
                      {(det.confidence * 100).toFixed(0)}%
                      {/* converts conf score to % (0.76 -> 76%) */}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* ── Empty Gaps List ── */}
      {
        results.results?.empty_gaps?.length > 0 && (
          <div style={styles.gapsCard}>
            <h3 style={styles.gapsTitle}> Empty Shelf Zones </h3>
            <div style={styles.gapsList}>
              {results.results.empty_gaps.map((gap) => (
                <div key={gap.zone} style={styles.gapItem}>
                  <span style={styles.gapZone}>Zone {gap.zone}</span>
                  <span style={styles.gapCoords}>
                    {gap.x1}px → {gap.x2}px (width: {gap.x2 - gap.x1}px)
                  </span>
                  <span style={styles.gapBadge}>EMPTY</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

    </div >
  )
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginTop: "32px",
  },
  resultsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  downloadBtn: {
    backgroundColor: "#1a1d27",
    color: "#3b82f6",
    border: "1px solid #3b82f6",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    cursor: "pointer",
  },
  // Loading
  loadingBox: {
    backgroundColor: "#1a1d27",
    border: "1px solid #2d3748",
    borderRadius: "16px",
    padding: "48px",
    textAlign: "center",
  },
  loadingIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  loadingTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "8px",
  },
  loadingSubtitle: {
    color: "#9ca3af",
    fontSize: "14px",
    marginBottom: "24px",
    lineHeight: "1.6",
  },
  loadingBar: {
    backgroundColor: "#2d3748",
    borderRadius: "4px",
    height: "4px",
    overflow: "hidden",
    maxWidth: "300px",
    margin: "0 auto",
  },
  loadingBarFill: {
    height: "100%",
    width: "60%",
    backgroundColor: "#3b82f6",
    borderRadius: "4px",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  // Section title
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
  },
  // Stats
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "#1a1d27",
    border: "1px solid #2d3748",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  statIcon: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  // Images
  imageRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  imageCard: {
    backgroundColor: "#1a1d27",
    border: "1px solid #2d3748",
    borderRadius: "12px",
    overflow: "hidden",
  },
  imageLabel: {
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#9ca3af",
    borderBottom: "1px solid #2d3748",
  },
  imagePlaceholder: {
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#4b5563",
    fontSize: "14px",
  },
  resultImage: {
    width: "100%",
    display: "block",
    maxHeight: "400px",
    objectFit: "contain",
  },
  // Detections
  detectionsCard: {
    backgroundColor: "#1a1d27",
    border: "1px solid #2d3748",
    borderRadius: "12px",
    padding: "20px",
  },
  detectionsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "16px",
  },
  detectionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  detectionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f1117",
    borderRadius: "8px",
    padding: "10px 14px",
  },
  detectionLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  detectionName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "capitalize",
  },
  detectionCoords: {
    fontSize: "11px",
    color: "#4b5563",
    fontFamily: "monospace",
  },
  confidenceBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "160px",
  },
  confidenceFill: {
    height: "6px",
    borderRadius: "3px",
    flex: 1,
    minWidth: "4px",
  },
  confidenceText: {
    fontSize: "12px",
    color: "#9ca3af",
    minWidth: "32px",
    textAlign: "right",
  },
  // Gaps
  gapsCard: {
    backgroundColor: "#1a1d27",
    border: "1px solid #ef444433",
    borderRadius: "12px",
    padding: "20px",
  },
  gapsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: "16px",
  },
  gapsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  gapItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f1117",
    borderRadius: "8px",
    padding: "10px 14px",
  },
  gapZone: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
  },
  gapCoords: {
    fontSize: "12px",
    color: "#6b7280",
    fontFamily: "monospace",
  },
  gapBadge: {
    backgroundColor: "#2d1b1b",
    color: "#ef4444",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "4px",
    letterSpacing: "0.05em",
  },
}