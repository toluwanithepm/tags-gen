import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface TagResult {
  tag: string
  quality: "green" | "yellow" | "red"
  message: string
  steps: string[]
}

export class TagGenerator {
  private stopWords: Set<string> = new Set()
  private domainWords: Map<string, number> = new Map()
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Load stop words from database
      const { data: stopWordsData } = await supabase.from("stop_words").select("word")

      if (stopWordsData) {
        stopWordsData.forEach(({ word }) => this.stopWords.add(word))
      }

      // Load domain words from database
      const { data: domainWordsData } = await supabase.from("domain_words").select("word, weight")

      if (domainWordsData) {
        domainWordsData.forEach(({ word, weight }) => {
          this.domainWords.set(word, weight)
        })
      }

      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize TagGenerator:", error)
      // Fallback to basic stop words if database fails
      this.initializeFallback()
    }
  }

  private initializeFallback() {
    // Basic fallback stop words
    const basicStopWords = [
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "why",
      "how",
      "where",
      "when",
      "is",
      "are",
      "was",
      "were",
    ]
    basicStopWords.forEach((word) => this.stopWords.add(word))

    // Basic domain words
    const basicDomainWords = {
      soil: 10,
      crop: 10,
      yield: 10,
      chicken: 9,
      vaccination: 9,
      pen: 8,
      field: 8,
    }
    Object.entries(basicDomainWords).forEach(([word, weight]) => {
      this.domainWords.set(word, weight)
    })

    this.initialized = true
  }

  // Step 1: Text Normalization
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Step 2: Tokenization
  private tokenize(text: string): string[] {
    return text.split(" ").filter((token) => token.length > 0)
  }

  // Step 3: Stop Word Removal
  private removeStopWords(tokens: string[]): string[] {
    return tokens.filter((token) => !this.stopWords.has(token) && token.trim())
  }

  // Step 4: Lemmatization (simplified)
  private lemmatize(tokens: string[]): string[] {
    const lemmaMap: Record<string, string> = {
      // Plurals
      readings: "reading",
      varieties: "variety",
      dates: "date",
      crops: "crop",
      fields: "field",
      seeds: "seed",
      yields: "yield",
      chicks: "chick",
      chickens: "chicken",
      eggs: "egg",
      cows: "cow",
      cattle: "cattle",
      calves: "calf",
      pigs: "pig",
      sheep: "sheep",
      goats: "goat",
      lambs: "lamb",
      horses: "horse",
      ducks: "duck",
      vaccines: "vaccine",
      vaccinations: "vaccination",
      antibiotics: "antibiotic",
      vitamins: "vitamin",
      supplements: "supplement",
      diseases: "disease",

      // Verb forms
      applies: "apply",
      planting: "plant",
      harvesting: "harvest",
      irrigating: "irrigate",
      fertilizing: "fertilize",
      breeding: "breed",
      feeding: "feed",
      milking: "milk",
      shearing: "shear",
      vaccinating: "vaccinate",
      treating: "treat",
      spraying: "spray",
      watering: "water",
      given: "give",
    }

    return tokens.map((token) => lemmaMap[token] || token)
  }

  // Step 5: Word Significance Ranking
  private rankWords(tokens: string[]): Array<[string, number]> {
    const scoredTokens = tokens.map((token) => [token, this.domainWords.get(token) || 5] as [string, number])

    return scoredTokens.sort((a, b) => b[1] - a[1])
  }

  // Step 6: Word Selection and Ordering
  private selectAndOrderWords(scoredTokens: Array<[string, number]>, originalTokens: string[], maxWords = 3): string[] {
    // Special case handling for vaccination
    if (originalTokens.includes("vaccination") || originalTokens.includes("vaccine")) {
      const animals = ["chick", "chicken", "cow", "cattle", "pig", "sheep", "goat", "lamb", "horse", "duck"]
      for (const animal of animals) {
        if (originalTokens.includes(animal)) {
          return [animal, "vaccination"]
        }
      }
      return ["animal", "vaccination"]
    }

    // Special patterns
    if (originalTokens.includes("breadth") && originalTokens.includes("pen")) {
      return ["pen", "breadth"]
    }
    if (originalTokens.includes("ph") && originalTokens.includes("soil")) {
      return ["soil", "ph"]
    }
    if (originalTokens.includes("yield") && originalTokens.includes("acre")) {
      return ["yield", "acre"]
    }

    // Default selection - top scored words
    return scoredTokens.slice(0, maxWords).map(([token, _]) => token)
  }

  // Step 7: Formatting (snake_case)
  private formatTag(tokens: string[]): string {
    if (!tokens || tokens.length === 0) {
      return "generic_field"
    }

    let tag = tokens.join("_")

    // Ensure tag is not too long (max 25 characters)
    if (tag.length > 25) {
      tag = tag.substring(0, 25)
      if (tag.includes("_")) {
        tag = tag.substring(0, tag.lastIndexOf("_"))
      }
    }

    return tag
  }

  // Step 8: Uniqueness Check
  private async ensureUniqueness(tag: string): Promise<string> {
    try {
      const { data: existingTags } = await supabase.from("generated_tags").select("final_tag").eq("final_tag", tag)

      if (existingTags && existingTags.length > 0) {
        let counter = 2
        let uniqueTag = `${tag}_${counter}`

        while (true) {
          const { data: checkTag } = await supabase
            .from("generated_tags")
            .select("final_tag")
            .eq("final_tag", uniqueTag)

          if (!checkTag || checkTag.length === 0) {
            return uniqueTag
          }

          counter++
          uniqueTag = `${tag}_${counter}`
        }
      }

      return tag
    } catch (error) {
      console.error("Error checking uniqueness:", error)
      return tag
    }
  }

  // Main tag generation method
  async generateTag(fieldLabel: string): Promise<TagResult> {
    await this.initialize()

    const steps: string[] = []

    // Step 1: Text Normalization
    const normalized = this.normalizeText(fieldLabel)
    steps.push(`1. Normalized: "${fieldLabel}" → "${normalized}"`)

    // Step 2: Tokenization
    const tokens = this.tokenize(normalized)
    steps.push(`2. Tokenized: [${tokens.map((t) => `"${t}"`).join(", ")}]`)

    // Step 3: Stop Word Removal
    const filtered = this.removeStopWords(tokens)
    steps.push(`3. Stop words removed: [${filtered.map((t) => `"${t}"`).join(", ")}]`)

    // Step 4: Lemmatization
    const lemmatized = this.lemmatize(filtered)
    steps.push(`4. Lemmatized: [${lemmatized.map((t) => `"${t}"`).join(", ")}]`)

    // Step 5: Word Significance Ranking
    const ranked = this.rankWords(lemmatized)
    steps.push(`5. Ranked by significance: [${ranked.map(([word, score]) => `"${word}"(${score})`).join(", ")}]`)

    // Step 6: Word Selection and Ordering
    const selected = this.selectAndOrderWords(ranked, lemmatized)
    steps.push(`6. Selected and ordered: [${selected.map((t) => `"${t}"`).join(", ")}]`)

    // Step 7: Formatting
    const formatted = this.formatTag(selected)
    steps.push(`7. Formatted: "${formatted}"`)

    // Step 8: Uniqueness Check
    const uniqueTag = await this.ensureUniqueness(formatted)
    if (uniqueTag !== formatted) {
      steps.push(`8. Made unique: "${formatted}" → "${uniqueTag}"`)
    } else {
      steps.push(`8. Already unique: "${uniqueTag}"`)
    }

    // Evaluate quality
    const { quality, message } = this.evaluateTagQuality(uniqueTag, selected)

    return {
      tag: uniqueTag,
      quality,
      message,
      steps,
    }
  }

  private evaluateTagQuality(tag: string, tokens: string[]): { quality: "green" | "yellow" | "red"; message: string } {
    // Length check
    if (tag.length < 5) {
      return { quality: "red", message: "Tag is too short" }
    }

    // Domain specificity check
    const domainSpecific = tokens.some((token) => this.domainWords.has(token))

    if (domainSpecific && tokens.length >= 2) {
      return { quality: "green", message: "Strong tag with domain-specific terms" }
    } else if (domainSpecific || tokens.length >= 2) {
      return { quality: "yellow", message: "Acceptable tag but could be improved" }
    } else {
      return { quality: "red", message: "Tag is too generic" }
    }
  }

  async saveTag(fieldId: string, fieldLabel: string, generatedTag: string, finalTag?: string): Promise<void> {
    try {
      const { quality, message } = this.evaluateTagQuality(finalTag || generatedTag, generatedTag.split("_"))

      await supabase.from("generated_tags").upsert({
        field_id: fieldId,
        field_label: fieldLabel,
        generated_tag: generatedTag,
        final_tag: finalTag || generatedTag,
        quality,
        message,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error saving tag:", error)
    }
  }
}
