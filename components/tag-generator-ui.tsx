"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TagGenerator, type TagResult } from "../lib/tag-generator"
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import React from "react"

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
  const [tagGenerator] = useState(() => new TagGenerator())

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

      // Save to database
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Agricultural Tag Generator</h1>
        <p className="text-muted-foreground mt-2">
          Auto-generates meaningful tags for agricultural form fields using advanced NLP techniques
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Field Label Input</CardTitle>
            <CardDescription>
              Enter your field label and the tag will be automatically generated when you leave the field
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label</Label>
              <Input
                id="fieldLabel"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                onBlur={handleFieldBlur}
                placeholder="e.g., What is the breadth of your pen?"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Tags are generated automatically when you click outside the field
              </p>
            </div>

            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating tag...
              </div>
            )}

            {currentResult && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Generated Tag</h3>
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showSteps ? "Hide" : "Show"} Steps
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <code className="bg-background px-3 py-1 rounded border font-mono text-sm">{currentResult.tag}</code>
                  {getQualityIcon(currentResult.quality)}
                  <Badge variant="outline" className={getQualityColor(currentResult.quality)}>
                    {currentResult.message}
                  </Badge>
                </div>

                {showSteps && (
                  <div className="space-y-2">
                    <Separator />
                    <h4 className="font-medium text-sm">Generation Steps:</h4>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      {currentResult.steps.map((step, index) => (
                        <li key={index} className="font-mono text-xs">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Tags History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tags ({generatedTags.length})</CardTitle>
            <CardDescription>Recently generated tags with quality indicators</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedTags.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tags generated yet. Enter a field label to get started!
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedTags.map((tag) => (
                  <div key={tag.fieldId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-2">
                      <p className="font-medium text-sm truncate" title={tag.fieldLabel}>
                        {tag.fieldLabel}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="bg-background px-2 py-1 rounded text-xs font-mono">{tag.tag}</code>
                        {getQualityIcon(tag.quality)}
                        <Badge variant="outline" className={`text-xs ${getQualityColor(tag.quality)}`}>
                          {tag.quality}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Generation Algorithm</CardTitle>
          <CardDescription>How the agricultural tag generator processes your field labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Processing Steps</h3>
              <ol className="space-y-2 text-sm">
                <li>
                  <strong>1. Text Normalization:</strong> Convert to lowercase, remove punctuation
                </li>
                <li>
                  <strong>2. Tokenization:</strong> Split into individual words
                </li>
                <li>
                  <strong>3. Stop Word Removal:</strong> Filter out common words from database
                </li>
                <li>
                  <strong>4. Lemmatization:</strong> Convert to standardized word forms
                </li>
                <li>
                  <strong>5. Word Significance Ranking:</strong> Prioritize agricultural terms
                </li>
                <li>
                  <strong>6. Word Selection:</strong> Choose top 2-3 meaningful words
                </li>
                <li>
                  <strong>7. Formatting:</strong> Apply snake_case formatting
                </li>
                <li>
                  <strong>8. Uniqueness Check:</strong> Ensure tag uniqueness in database
                </li>
              </ol>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Example Transformations</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <p>
                    <strong>Input:</strong> "What is the breadth of your pen?"
                  </p>
                  <p>
                    <strong>Output:</strong> <code>pen_breadth</code>
                  </p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p>
                    <strong>Input:</strong> "Chick vaccination date"
                  </p>
                  <p>
                    <strong>Output:</strong> <code>chick_vaccination</code>
                  </p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p>
                    <strong>Input:</strong> "Soil pH level measurement"
                  </p>
                  <p>
                    <strong>Output:</strong> <code>soil_ph</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
