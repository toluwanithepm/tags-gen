"use client"

import { useState, useCallback, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TagGenerator, type TagResult } from "@/lib/tag-generator"
import { Loader2, CheckCircle, AlertCircle, XCircle, Database, AlertTriangle } from "lucide-react"

interface GeneratedTag {
  fieldId: string
  fieldLabel: string
  tag: string
  quality: "green" | "yellow" | "red"
  message: string
  steps: string[]
}

export default function TagGeneratorUI() {
  const [fieldLabel, setFieldLabel] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTags, setGeneratedTags] = useState<GeneratedTag[]>([])
  const [currentResult, setCurrentResult] = useState<TagResult | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [tagGenerator] = useState(() => new TagGenerator())
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "connected" | "fallback">("checking")

  // Check database status on mount
  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        // Try to initialize the tag generator
        await tagGenerator.initialize()

        // Check if we have environment variables
        const hasSupabaseUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
        const hasSupabaseKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

        if (hasSupabaseUrl && hasSupabaseKey) {
          setDatabaseStatus("connected")
        } else {
          setDatabaseStatus("fallback")
        }
      } catch (error) {
        console.warn("Database check failed:", error)
        setDatabaseStatus("fallback")
      }
    }

    checkDatabaseStatus()
  }, [tagGenerator])

  // Generate field ID
  const generateFieldId = () => `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  // Auto-generate tag when user leaves the text field
  const handleFieldBlur = useCallback(async () => {
    if (!fieldLabel.trim() || isGenerating) return

    setIsGenerating(true)
    setCurrentResult(null)

    try {
      const result = await tagGenerator.generateTag(fieldLabel)
      setCurrentResult(result)

      // Save to database (will be skipped if database not available)
      const fieldId = generateFieldId()
      await tagGenerator.saveTag(fieldId, fieldLabel, result.tag)

      // Add to local state
      const newTag: GeneratedTag = {
        fieldId,
        fieldLabel,
        tag: result.tag,
        quality: result.quality,
        message: result.message,
        steps: result.steps,
      }

      setGeneratedTags((prev) => [newTag, ...prev.slice(0, 9)]) // Keep last 10 tags
    } catch (error) {
      console.error("Error generating tag:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [fieldLabel, isGenerating, tagGenerator])

  // Clear current result when field changes
  useEffect(() => {
    if (fieldLabel.trim() === "") {
      setCurrentResult(null)
    }
  }, [fieldLabel])

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case "green":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "yellow":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "red":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "green":
        return "bg-green-100 text-green-800 border-green-300"
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "red":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem" }}>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontSize: "1.875rem", fontWeight: "bold" }}>
          Tag Generator
        </h1>
        <p className="text-muted-foreground mt-2" style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          Auto-generates meaningful tags for agricultural form fields using advanced NLP techniques
        </p>
      </div>

      {/* Database Status Alert */}
      {databaseStatus === "fallback" && (
        <div className="fallback-alert">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle className="h-4 w-4" />
            <div>
              Database not configured. Using fallback mode with built-in stop words and domain knowledge.
              {/* <button
                onClick={() => setShowSetup(!showSetup)}
                className="text-blue-600 hover:text-blue-800 underline"
                style={{ color: "#2563eb", textDecoration: "underline" }}
              >
                {showSetup ? "Hide" : "Show"} setup guide
              </button> */}
            </div>
          </div>
        </div>
      )}

      {databaseStatus === "connected" && (
        <Alert
          className="border-green-200 bg-green-50 fallback-alert"
          style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}
        >
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800" style={{ color: "#166534" }}>
            Database connected. Using comprehensive stop words and domain knowledge from your Supabase DB.
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Guide
      {showSetup && databaseStatus === "fallback" && <SetupGuide />} */}

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}
      >
        {/* Input Section */}
        <div className="fallback-card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Field Label Input</h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              Enter your field label and the tag will be automatically generated when you leave the field
            </p>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="fieldLabel"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}
            >
              Field Label
            </label>
            <input
              id="fieldLabel"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              onBlur={handleFieldBlur}
              placeholder="e.g., What is the breadth of your pen?"
              className="fallback-input"
            />
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
              Tags are generated automatically when you click outside the field
            </p>
          </div>

          {isGenerating && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating tag...
            </div>
          )}

          {currentResult && (
            <div
              style={{
                padding: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                backgroundColor: "#f9fafb",
                marginTop: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}
              >
                <h3 style={{ fontWeight: "600" }}>Generated Tag</h3>
                <button onClick={() => setShowSteps(!showSteps)} style={{ fontSize: "0.875rem", color: "#2563eb" }}>
                  {showSteps ? "Hide" : "Show"} Steps
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <code
                  style={{
                    backgroundColor: "white",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "0.25rem",
                    border: "1px solid #d1d5db",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                  }}
                >
                  {currentResult.tag}
                </code>
                {getQualityIcon(currentResult.quality)}
                <span className={`fallback-badge ${getQualityColor(currentResult.quality)}`}>
                  {currentResult.message}
                </span>
              </div>

              {showSteps && (
                <div style={{ marginTop: "1rem" }}>
                  <hr style={{ margin: "1rem 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
                  <h4 style={{ fontWeight: "500", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Generation Steps:</h4>
                  <ol style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {currentResult.steps.map((step, index) => (
                      <li key={index} style={{ fontFamily: "monospace", marginBottom: "0.25rem" }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generated Tags History */}
        <div className="fallback-card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Recent Tags ({generatedTags.length})
            </h3>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Recently generated tags with quality indicators</p>
          </div>
          {generatedTags.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem 0" }}>
              No tags generated yet. Enter a field label to get started!
            </p>
          ) : (
            <div style={{ maxHeight: "24rem", overflowY: "auto" }}>
              {generatedTags.map((tag) => (
                <div
                  key={tag.fieldId}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <p style={{ fontWeight: "500", fontSize: "0.875rem", marginBottom: "0.5rem" }} title={tag.fieldLabel}>
                    {tag.fieldLabel}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <code
                      style={{
                        backgroundColor: "white",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {tag.tag}
                    </code>
                    {getQualityIcon(tag.quality)}
                    <span className={`fallback-badge ${getQualityColor(tag.quality)}`} style={{ fontSize: "0.75rem" }}>
                      {tag.quality}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Algorithm Information */}
      <div className="fallback-card">
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Tag Generation Algorithm</h3>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            How the agricultural tag generator processes your field labels
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          <div>
            <h3 style={{ fontWeight: "600", marginBottom: "1rem" }}>Processing Steps</h3>
            <ol style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>1. Text Normalization:</strong> Convert to lowercase, remove punctuation
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>2. Tokenization:</strong> Split into individual words
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>3. Stop Word Removal:</strong> Filter out common words{" "}
                {databaseStatus === "connected" ? "from database" : "(built-in list)"}
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>4. Lemmatization:</strong> Convert to standardized word forms
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>5. Word Significance Ranking:</strong> Prioritize agricultural terms
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>6. Word Selection:</strong> Choose top 2-3 meaningful words
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>7. Formatting:</strong> Apply snake_case formatting
              </li>
              <li>
                <strong>8. Uniqueness Check:</strong> Ensure tag uniqueness{" "}
                {databaseStatus === "connected" ? "in database" : "(timestamp-based)"}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
