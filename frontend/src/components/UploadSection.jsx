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

      {/* ── Title ── */}
      <div style={styles.titleBlock}>
        <h1 style={styles.title}>Shelf Intelligence Scanner</h1>
        <p style={styles.subtitle}>
          Upload a shelf image and get instant AI-powered product detection,
          gap analysis, and compliance scoring.
        </p>
      </div>

      {/* ── Drop Zone ── */}
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
          // Show preview if file selected
          <div style={styles.previewContainer}>
            <img src={preview} alt="Selected shelf" style={styles.previewImage} />
            <div style={styles.previewOverlay}>
              <p style={styles.previewText}> {selectedFile.name}</p>
              <p style={styles.previewHint}>Drop a new image to replace</p>
            </div>
          </div>
        ) : (
          // Show upload prompt if no file
          <div style={styles.uploadPrompt}>
            <div style={styles.uploadIcon}>📤</div>
            <p style={styles.uploadText}>
              {isDragActive
                ? "Drop it here!"
                : "Drag & drop a shelf image here"}
            </p>
            <p style={styles.uploadHint}>or click to browse</p>
            <p style={styles.uploadFormats}>JPG, JPEG, PNG supported</p>
          </div>
        )}
      </div>

      {/* ── Error Message ── */}
      {error && (
        <div style={styles.errorBox}>
           {error}
        </div>
      )}

      {/* ── Scan Button ── */}
      <button
        onClick={handleScan}
        disabled={!selectedFile || isLoading}
        style={{
          ...styles.scanBtn,
          ...(!selectedFile || isLoading ? styles.scanBtnDisabled : {})
        }}
      >
        {isLoading ? (
          <span> Analyzing shelf... this may take 15-20 seconds</span>
        ) : (
          <span> Run Shelf Scan</span>
        )}
      </button>

    </div>
  )
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  titleBlock: {
    textAlign: "center",
    paddingTop: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#9ca3af",
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: "1.6",
  },
  dropzone: {
    border: "2px dashed #2d3748",
    borderRadius: "16px",
    backgroundColor: "#1a1d27",
    cursor: "pointer",
    transition: "all 0.2s",
    minHeight: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dropzoneActive: {
    border: "2px dashed #3b82f6",
    backgroundColor: "#1e3a5f",
  },
  dropzoneDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  uploadPrompt: {
    textAlign: "center",
    padding: "48px",
  },
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  uploadText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: "8px",
  },
  uploadHint: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  uploadFormats: {
    fontSize: "12px",
    color: "#4b5563",
    backgroundColor: "#0f1117",
    padding: "4px 12px",
    borderRadius: "20px",
    display: "inline-block",
  },
  previewContainer: {
    width: "100%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "cover",
    display: "block",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "12px 16px",
  },
  previewText: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
  },
  previewHint: {
    color: "#9ca3af",
    fontSize: "12px",
  },
  errorBox: {
    backgroundColor: "#2d1b1b",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  scanBtn: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    padding: "16px 32px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.2s",
  },
  scanBtnDisabled: {
    backgroundColor: "#1e3a5f",
    color: "#4b5563",
    cursor: "not-allowed",
  },
}