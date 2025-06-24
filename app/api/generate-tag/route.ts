import { type NextRequest, NextResponse } from "next/server"
import { TagGenerator } from "../../../lib/tag-generator"

const tagGenerator = new TagGenerator()

export async function POST(request: NextRequest) {
  try {
    const { fieldLabel } = await request.json()

    if (!fieldLabel || typeof fieldLabel !== "string") {
      return NextResponse.json({ error: "Field label is required" }, { status: 400 })
    }

    const result = await tagGenerator.generateTag(fieldLabel.trim())

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error generating tag:", error)
    return NextResponse.json({ error: "Failed to generate tag" }, { status: 500 })
  }
}
