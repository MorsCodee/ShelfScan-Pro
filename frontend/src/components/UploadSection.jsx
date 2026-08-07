import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import axios from "axios"
import { API_BASE_URL } from "../config"

export default function UploadSection({ setScanResults, setIsLoading, isLoading }) {

  // the actual File object user picked starts as null (nothing selected)
  const [selectedFile, setSelectedFile] = useState(null)

  // a temporary URL to display the image in the browser before uploading starts as null
  const [preview, setPreview] = useState(null)

  // any error message to show the user starts as null (no error)
  const [error, setError] = useState(null)

  // Runs when user drops or selects a file
  // every time a React component re-renders, any function declared inside it is recreated from scratch with a brand-new memory address. Wrapping a function in useCallback tells React to save that function instance and reuse it across renders
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    // If somehow no file came through, stop here. Safety check.
    if (!file) return 

    setSelectedFile(file)
    setError(null)
    setScanResults(null)

    // URL.createObjectURL(file) is a browser built-in that creates a temporary URL pointing to the file in memory
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }, [])

  // when the dropzone is active, accept the image file, only accept 1 file etc
  // getRootProps() returns an object full of event handlers   
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    maxFiles: 1,
    disabled: isLoading
  })

  // Sends the image to Flask
  const handleScan = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setScanResults(null)
    setError(null)

    try {
      // FormData is the browser's way of packaging files for sending over HTTP. We create one and add our file with the key "image"
      const formData = new FormData()
      formData.append("image", selectedFile) 

      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      setScanResults({
        ...response.data.data,
        originalPreview: preview
      })

    } catch (err) {
      setError("Something went wrong. Make sure the Flask server is running.")
    } finally {
      setIsLoading(false)
    }
}
  return (
    <div style={styles.wrapper}>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroBadge}>
          <span>✨</span>
          <span>AI-Powered Shelf Analysis</span>
        </div>
        <h1 style={styles.heroTitle}>
          Scan. Detect.{" "}
          <span style={styles.heroGradient}>Optimize.</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Upload any shelf image and get instant product detection,
          gap analysis, and compliance scoring powered by YOLOv8.
        </p>
      </div>

      {/* Upload area */}
      <div style={styles.uploadCard}>
        <div
          {...getRootProps()}
          style={{
            ...styles.dropzone,
            ...(isDragActive ? styles.dropzoneActive : {}),
            ...(isLoading ? styles.dropzoneDisabled : {}),
          }}
        >
          <input {...getInputProps()} />

          {preview ? (
            <div style={styles.previewContainer}>
              <img src={preview} alt="shelf" style={styles.previewImage} />
              <div style={styles.previewOverlay}>
                <div style={styles.previewBadge}>
                  <span>📁</span>
                  <span>{selectedFile.name}</span>
                </div>
                <span style={styles.previewHint}>Drop a new image to replace</span>
              </div>
            </div>
          ) : (
            <div style={styles.uploadPrompt}>
              <div style={styles.uploadIconWrapper}>
                <div style={styles.uploadIconRing} />
                <span style={styles.uploadIcon}>
                  {isDragActive ? "🎯" : "📤"}
                </span>
              </div>
              <p style={styles.uploadText}>
                {isDragActive ? "Drop it right here!" : "Drag & drop your shelf image"}
              </p>
              <p style={styles.uploadHint}>or click to browse files</p>
              <div style={styles.uploadFormats}>
                <span style={styles.formatTag}>JPG</span>
                <span style={styles.formatTag}>JPEG</span>
                <span style={styles.formatTag}>PNG</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!selectedFile || isLoading}
          style={{
            ...styles.scanBtn,
            ...(!selectedFile || isLoading ? styles.scanBtnDisabled : {})
          }}
        >
          {isLoading ? (
            <div style={styles.scanBtnInner}>
              <div style={styles.spinner} />
              <span>Analyzing shelf with AI...</span>
            </div>
          ) : (
            <div style={styles.scanBtnInner}>
              <span>🔍</span>
              <span>Run AI Shelf Scan</span>
            </div>
          )}
        </button>

        {!selectedFile && (
          <p style={styles.scanHint}>
            Upload a shelf image above to get started
          </p>
        )}
      </div>

      {/* Feature pills */}
      <div style={styles.features}>
        {[
          { icon: "🎯", label: "Product Detection" },
          { icon: "📊", label: "Gap Analysis" },
          { icon: "✅", label: "Compliance Score" },
          { icon: "📄", label: "PDF Reports" },
          { icon: "📈", label: "Drift Monitoring" },
        ].map((f) => (
          <div key={f.label} style={styles.featurePill}>
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  hero: {
    textAlign: "center",
    paddingTop: "20px",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.2)",
    color: "#60a5fa",
    fontSize: "13px",
    fontWeight: "500",
    padding: "6px 16px",
    borderRadius: "20px",
    marginBottom: "20px",
  },
  heroTitle: {
    fontSize: "48px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-1px",
    lineHeight: "1.1",
    marginBottom: "16px",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSubtitle: {
    fontSize: "17px",
    color: "#6b7280",
    maxWidth: "520px",
    margin: "0 auto",
    lineHeight: "1.7",
  },
  uploadCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "24px",
    padding: "24px",
    backdropFilter: "blur(20px)",
  },
  dropzone: {
    border: "2px dashed rgba(255,255,255,0.1)",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "all 0.3s",
    minHeight: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: "16px",
    background: "rgba(255,255,255,0.01)",
  },
  dropzoneActive: {
    border: "2px dashed #3b82f6",
    background: "rgba(59,130,246,0.05)",
    boxShadow: "inset 0 0 40px rgba(59,130,246,0.05)",
  },
  dropzoneDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  uploadPrompt: {
    textAlign: "center",
    padding: "40px",
  },
  uploadIconWrapper: {
    position: "relative",
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "2px solid rgba(59,130,246,0.3)",
    animation: "pulse-ring 2s ease-out infinite",
  },
  uploadIcon: {
    fontSize: "40px",
    position: "relative",
    zIndex: 1,
  },
  uploadText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: "8px",
  },
  uploadHint: {
    fontSize: "14px",
    color: "#4b5563",
    marginBottom: "16px",
  },
  uploadFormats: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  formatTag: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#6b7280",
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 10px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  previewContainer: {
    width: "100%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    maxHeight: "380px",
    objectFit: "cover",
    display: "block",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
    padding: "24px 16px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#ffffff",
    fontWeight: "500",
  },
  previewHint: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  scanBtn: {
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "#ffffff",
    border: "none",
    padding: "16px 32px",
    borderRadius: "14px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.3s",
    boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
    letterSpacing: "-0.2px",
  },
  scanBtnDisabled: {
    background: "rgba(255,255,255,0.05)",
    color: "#374151",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  scanBtnInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  scanHint: {
    textAlign: "center",
    fontSize: "13px",
    color: "#374151",
    marginTop: "12px",
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
  },
  featurePill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
    padding: "8px 16px",
    borderRadius: "20px",
  },
}