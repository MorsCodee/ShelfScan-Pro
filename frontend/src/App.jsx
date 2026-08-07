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

      {/* Background decoration */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <span style={{fontSize: "20px"}}>📦</span>
            </div>
            <div>
              <div style={styles.logoText}>ShelfScan Pro</div>
              <div style={styles.logoSub}>AI Retail Intelligence</div>
            </div>
            <span style={styles.logoBadge}>BETA</span>
          </div>

          <nav style={styles.nav}>
            <button
              style={{
                ...styles.navBtn,
                ...(activeTab === "scan" ? styles.navBtnActive : {})
              }}
              onClick={() => setActiveTab("scan")}
            >
              <span>🔍</span>
              <span>Scan</span>
            </button>
            <button
              style={{
                ...styles.navBtn,
                ...(activeTab === "dashboard" ? styles.navBtnActive : {})
              }}
              onClick={() => setActiveTab("dashboard")}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
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
        {activeTab === "dashboard" && <Dashboard />}
      </main>

    </div>
  )
}
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#080c14",
    position: "relative",
    overflow: "hidden",
  },
  bgOrb1: {
    position: "fixed",
    top: "-200px",
    right: "-200px",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgOrb2: {
    position: "fixed",
    bottom: "-200px",
    left: "-200px",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgOrb3: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "800px",
    height: "800px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(8, 12, 20, 0.8)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerInner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "68px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
  },
  logoText: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  logoSub: {
    fontSize: "11px",
    color: "#4b5563",
    fontWeight: "500",
  },
  logoBadge: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
  },
  nav: {
    display: "flex",
    gap: "4px",
    background: "rgba(255,255,255,0.04)",
    padding: "4px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "transparent",
    color: "#6b7280",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  navBtnActive: {
    backgroundColor: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    boxShadow: "0 0 20px rgba(59,130,246,0.1)",
  },
  main: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "40px 24px",
    position: "relative",
    zIndex: 1,
  },
}