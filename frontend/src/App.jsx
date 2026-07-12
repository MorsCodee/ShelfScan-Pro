import { useState } from "react"
import UploadSection from "./components/UploadSection"
import ResultsSection from "./components/ResultsSection"
import Dashboard from "./components/Dashboard"
import "./App.css"
// This is the core pattern of React —
//  data flows DOWN through props, events flow UP through callback functions.
export default function App() {
  // these are called state variables, so the activetab is scan right now, so we will se scan page first. 
  // Which tab is active
  const [activeTab, setActiveTab] = useState("scan")

  // Results from the latest scan
  const [scanResults, setScanResults] = useState(null)

  // Loading state while YOLOv8 is running
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div style={styles.container}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}></span>
            <span style={styles.logoText}>ShelfScan Pro</span>
            <span style={styles.logoBadge}>AI</span>
          </div>

          <nav style={styles.nav}>
            <button
              style={{
                ...styles.navBtn,
                ...(activeTab === "scan" ? styles.navBtnActive : {})
              }}
              onClick={() => setActiveTab("scan")}
            >
              Scan
            </button>
            <button
              style={{
                ...styles.navBtn,
                ...(activeTab === "dashboard" ? styles.navBtnActive : {})
              }}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
          </nav>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={styles.main}>
        {activeTab === "scan" && (
          <>
            <UploadSection
              setScanResults={setScanResults}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
            />
            {(isLoading || scanResults) && (
              <ResultsSection
                results={scanResults}
                isLoading={isLoading}
              />
            )}
          </>
        )}

        {activeTab === "dashboard" && (
          <Dashboard />
        )}
      </main>

    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f1117",
  },
  header: {
    backgroundColor: "#1a1d27",
    borderBottom: "1px solid #2d3748",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "24px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#ffffff",
  },
  logoBadge: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "20px",
  },
  nav: {
    display: "flex",
    gap: "8px",
  },
  navBtn: {
    backgroundColor: "transparent",
    color: "#9ca3af",
    border: "1px solid transparent",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  navBtnActive: {
    backgroundColor: "#1e3a5f",
    color: "#3b82f6",
    border: "1px solid #3b82f6",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px",
  },
}