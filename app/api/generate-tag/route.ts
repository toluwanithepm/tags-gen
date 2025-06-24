import { type NextRequest, NextResponse } from "next/server"
import { TagGenerator } from "@/lib/tag-generator"

export async function POST(request: NextRequest) {
  try {
    const { fieldLabel } = await request.json()

    if (!fieldLabel || typeof fieldLabel !== "string") {
      return NextResponse.json({ error: "Field label is required" }, { status: 400 })
    }

    // Initialize tag generator (it will handle missing env vars gracefully)
    const tagGenerator = new TagGenerator()
    await tagGenerator.initialize()

    const result = await tagGenerator.generateTag(fieldLabel.trim())

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error generating tag:", error)
    return NextResponse.json(
      {
        error: "Failed to generate tag",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
