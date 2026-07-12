import { useState, useEffect } from "react"
import axios from "axios"
import { API_BASE_URL } from "../config"

export default function Dashboard() {

  const [scans, setScans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drift, setDrift] = useState(null)

  // Fetch all past scans when component loads
  useEffect(() => {
    fetchScans()
    fetchDrift()
  }, [])
  // [] = run only once when component first appears

  const fetchScans = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${API_BASE_URL}/scans`)
      setScans(response.data.scans)
    } catch (err) {
      setError("Could not load scan history. Is the Flask server running?")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrift = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drift`)
      setDrift(response.data)
    } catch (err) {
      console.log("Drift fetch failed:", err)
    }
  }

  // Calculate summary stats from all scans
  const totalScans = scans.length
  const avgCompliance = totalScans > 0
    ? (scans.reduce((sum, s) => sum + s.compliance_score, 0) / totalScans).toFixed(1)
    : 0
  const totalDetections = scans.reduce((sum, s) => sum + s.total_detections, 0)
  const completedScans = scans.filter(s => s.status === "completed").length

  const getComplianceColor = (score) => {
    if (score >= 80) return "#22c55e"
    if (score >= 50) return "#f59e0b"
    return "#ef4444"
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "completed":
        return { backgroundColor: "#14532d", color: "#22c55e" }
      case "processing":
        return { backgroundColor: "#1e3a5f", color: "#3b82f6" }
      case "failed":
        return { backgroundColor: "#2d1b1b", color: "#ef4444" }
      default:
        return { backgroundColor: "#1a1d27", color: "#9ca3af" }
    }
  }

  // Converts "2026-06-28T11:31:03.881990" into something human readable like "Jun 28, 11:31 AM".
  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <div style={styles.centered}>
        {/* <div style={styles.loadingIcon}>⏳</div> */}
        <p style={styles.loadingText}>Loading scan history...</p>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={styles.errorBox}>
        Error!!!  {error}
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>

      {/* ── Title ── */}
      <div style={styles.titleBlock}>
        <h1 style={styles.title}> Scan Dashboard</h1>
        <p style={styles.subtitle}>
          Historical overview of all shelf scans and compliance trends.
        </p>
        <button onClick={() => { fetchScans(); fetchDrift() }} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div style={styles.statsRow}>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}>🗂️</div> */}
          <div style={styles.statValue}>{totalScans}</div>
          <div style={styles.statLabel}>Total Scans</div>
        </div>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}>✅</div> */}
          <div style={styles.statValue}>{completedScans}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}>🎯</div> */}
          <div style={{ ...styles.statValue, color: getComplianceColor(avgCompliance) }}>
            {avgCompliance}%
          </div>
          <div style={styles.statLabel}>Avg Compliance</div>
        </div>

        <div style={styles.statCard}>
          {/* <div style={styles.statIcon}>📦</div> */}
          <div style={styles.statValue}>{totalDetections}</div>
          <div style={styles.statLabel}>Total Detections</div>
        </div>

      </div>

      {/* ── Scans Table ── */}
      {totalScans === 0 ? (
        <div style={styles.emptyState}>
          {/* <div style={styles.emptyIcon}>📭</div> */}
          <h3 style={styles.emptyTitle}>No scans yet</h3>
          <p style={styles.emptySubtitle}>
            Go to the Scan tab and upload a shelf image to get started.
          </p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Scan History</h3>
            <span style={styles.tableCount}>{totalScans} scans</span>
          </div>

          <div style={styles.table}>

            {/* Table Head */}
            <div style={styles.tableHeadRow}>
              <div style={styles.thFile}>File</div>
              <div style={styles.thStatus}>Status</div>
              <div style={styles.thDetections}>Detections</div>
              <div style={styles.thGaps}>Gaps</div>
              <div style={styles.thScore}>Compliance</div>
              <div style={styles.thDate}>Date</div>
            </div>

            {/* ── Drift Monitor Banner ── */}
            {drift && (
              <div style={{
                ...styles.driftBanner,
                borderColor: drift.status === "drift_detected"
                  ? "#ef4444"
                  : drift.status === "healthy"
                    ? "#22c55e"
                    : "#f59e0b",
                backgroundColor: drift.status === "drift_detected"
                  ? "#2d1b1b"
                  : drift.status === "healthy"
                    ? "#14532d22"
                    : "#1a1d27"
              }}>
                <div style={styles.driftLeft}>
                  <span style={styles.driftIcon}>
                    {drift.status === "drift_detected" ? "🚨"
                      : drift.status === "healthy" ? "✅"
                        : "⏳"}
                  </span>
                  <div>
                    <div style={styles.driftTitle}>
                      Model Drift Monitor
                    </div>
                    <div style={styles.driftMessage}>
                      {drift.message}
                    </div>
                  </div>
                </div>

                {drift.status !== "insufficient_data" && (
                  <div style={styles.driftStats}>
                    <div style={styles.driftStat}>
                      <span style={styles.driftStatLabel}>Baseline</span>
                      <span style={styles.driftStatValue}>{drift.baseline_mean}%</span>
                    </div>
                    <div style={styles.driftStat}>
                      <span style={styles.driftStatLabel}>Current</span>
                      <span style={styles.driftStatValue}>{drift.current_mean}%</span>
                    </div>
                    <div style={styles.driftStat}>
                      <span style={styles.driftStatLabel}>Drift</span>
                      <span style={{
                        ...styles.driftStatValue,
                        color: drift.drift_detected ? "#ef4444" : "#22c55e"
                      }}>
                        {drift.drift_percentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Table Rows */}
            {scans.map((scan) => (
              <div key={scan.id} style={styles.tableRow}>

                {/* Filename */}
                <div style={styles.tdFile}>
                  <span style={styles.fileName}>
                    {scan.original_filename}
                  </span>
                  <span style={styles.fileId}>
                    {scan.id.slice(0, 8)}...
                    {/* UUIDs are 36 characters long — too long for a table cell. .slice(0, 8) takes just the first 8 characters. "da8a1796-adff-..." becomes "da8a1796..." */}
                  </span>
                </div>

                {/* Status */}
                <div style={styles.tdStatus}>
                  <span style={{
                    ...styles.statusBadge,
                    ...getStatusBadgeStyle(scan.status)
                  }}>
                    {scan.status}
                  </span>
                </div>

                {/* Detections */}
                <div style={styles.tdCenter}>
                  <span style={styles.tdValue}>
                    {scan.total_detections}
                  </span>
                </div>

                {/* Gaps */}
                <div style={styles.tdCenter}>
                  <span style={{
                    ...styles.tdValue,
                    color: scan.total_gaps > 0 ? "#ef4444" : "#22c55e"
                  }}>
                    {scan.total_gaps}
                  </span>
                </div>

                {/* Compliance Score */}
                <div style={styles.tdScore}>
                  <span style={{
                    ...styles.scoreValue,
                    color: getComplianceColor(scan.compliance_score)
                  }}>
                    {scan.compliance_score}%
                  </span>
                  <div style={styles.scoreBarBg}>
                    <div style={{
                      ...styles.scoreBarFill,
                      width: `${scan.compliance_score}%`,
                      backgroundColor: getComplianceColor(scan.compliance_score)
                    }} />
                  </div>
                </div>

                {/* Date */}
                <div style={styles.tdDate}>
                  {formatDate(scan.created_at)}
                </div>

              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  )
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  centered: {
    textAlign: "center",
    padding: "80px 0",
  },
  loadingIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: "16px",
  },
  errorBox: {
    backgroundColor: "#2d1b1b",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "16px",
    borderRadius: "8px",
  },
  titleBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: "14px",
    color: "#9ca3af",
    flex: 1,
    marginLeft: "12px",
  },
  refreshBtn: {
    backgroundColor: "#1a1d27",
    color: "#9ca3af",
    border: "1px solid #2d3748",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
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
  emptyState: {
    textAlign: "center",
    padding: "80px 0",
    backgroundColor: "#1a1d27",
    borderRadius: "16px",
    border: "1px solid #2d3748",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "8px",
  },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: "14px",
  },
  tableCard: {
    backgroundColor: "#1a1d27",
    border: "1px solid #2d3748",
    borderRadius: "16px",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #2d3748",
  },
  tableTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
  },
  tableCount: {
    fontSize: "13px",
    color: "#6b7280",
  },
  table: {
    display: "flex",
    flexDirection: "column",
  },
  tableHeadRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr",
    padding: "10px 20px",
    backgroundColor: "#0f1117",
    borderBottom: "1px solid #2d3748",
  },
  thFile: { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  thStatus: { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  thDetections: { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" },
  thGaps: { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" },
  thScore: { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  thDate: { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr",
    padding: "14px 20px",
    borderBottom: "1px solid #2d374833",
    alignItems: "center",
    transition: "background 0.15s",
  },
  tdFile: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  fileName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff",
  },
  fileId: {
    fontSize: "11px",
    color: "#4b5563",
    fontFamily: "monospace",
  },
  tdStatus: {
    display: "flex",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tdCenter: {
    textAlign: "center",
  },
  tdValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
  },
  tdScore: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  scoreValue: {
    fontSize: "13px",
    fontWeight: "700",
  },
  scoreBarBg: {
    backgroundColor: "#2d3748",
    borderRadius: "2px",
    height: "4px",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.3s",
  },
  tdDate: {
    fontSize: "12px",
    color: "#6b7280",
  },
  driftBanner: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  driftLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  driftIcon: {
    fontSize: "28px",
  },
  driftTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "4px",
  },
  driftMessage: {
    fontSize: "13px",
    color: "#9ca3af",
    maxWidth: "500px",
    lineHeight: "1.5",
  },
  driftStats: {
    display: "flex",
    gap: "24px",
  },
  driftStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  driftStatLabel: {
    fontSize: "11px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  driftStatValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
  },
}
