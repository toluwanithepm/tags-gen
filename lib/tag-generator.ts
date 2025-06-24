interface TagResult {
    tag: string
    quality: "green" | "yellow" | "red"
    message: string
    steps: string[]
  }
  
  export class TagGenerator {
    private stopWords: Set<string> = new Set()
    private domainWords: Map<string, number> = new Map()
    private initialized = false
    private supabaseAvailable = false
  
    private getSupabaseClient() {
      try {
        // Only import and create client if environment variables are available
        if (typeof window !== "undefined") {
          // Client-side
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
          if (!supabaseUrl || !supabaseKey) {
            console.warn("Supabase environment variables not found on client")
            return null
          }
  
          const { createClient } = require("@supabase/supabase-js")
          return createClient(supabaseUrl, supabaseKey)
        } else {
          // Server-side
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
          if (!supabaseUrl || !supabaseKey) {
            console.warn("Supabase environment variables not found on server")
            return null
          }
  
          const { createClient } = require("@supabase/supabase-js")
          return createClient(supabaseUrl, supabaseKey)
        }
      } catch (error) {
        console.warn("Supabase client creation failed:", error)
        return null
      }
    }
  
    async initialize() {
      if (this.initialized) return
  
      const supabase = this.getSupabaseClient()
  
      if (supabase) {
        try {
          // Test connection with a timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Database connection timeout")), 5000),
          )
  
          const testPromise = supabase.from("stop_words").select("word").limit(1)
  
          const { data: testData, error: testError } = (await Promise.race([testPromise, timeoutPromise])) as any
  
          if (!testError && testData) {
            this.supabaseAvailable = true
  
            // Load stop words from database
            const { data: stopWordsData } = await supabase.from("stop_words").select("word")
            if (stopWordsData) {
              stopWordsData.forEach((item: { word: string }) => this.stopWords.add(item.word))
            }
  
            // Load domain words from database
            const { data: domainWordsData } = await supabase.from("domain_words").select("word, weight")
            if (domainWordsData) {
              domainWordsData.forEach((item: { word: string; weight: number }) => {
                const { word, weight } = item;
                this.domainWords.set(word, weight)
              })
            }
  
            console.log("TagGenerator initialized with database")
            this.initialized = true
            return
          }
        } catch (error) {
          console.warn("Database connection failed, using fallback:", error)
        }
      }
  
      // Fallback initialization
      this.initializeFallback()
    }
  
    private initializeFallback() {
      console.log("TagGenerator initialized with fallback data")
  
      // Comprehensive fallback stop words
      const fallbackStopWords = [
        // Articles
        "a",
        "an",
        "the",
        // Pronouns
        "i",
        "me",
        "my",
        "myself",
        "we",
        "our",
        "ours",
        "ourselves",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "he",
        "him",
        "his",
        "himself",
        "she",
        "her",
        "hers",
        "herself",
        "it",
        "its",
        "itself",
        "they",
        "them",
        "their",
        "theirs",
        "themselves",
        "what",
        "which",
        "who",
        "whom",
        "this",
        "that",
        "these",
        "those",
        // Prepositions
        "at",
        "by",
        "for",
        "from",
        "in",
        "into",
        "of",
        "off",
        "on",
        "onto",
        "out",
        "over",
        "to",
        "under",
        "up",
        "with",
        "about",
        "above",
        "across",
        "after",
        "against",
        "along",
        "amid",
        "among",
        "around",
        "as",
        "before",
        "behind",
        "below",
        "beneath",
        "beside",
        "between",
        "beyond",
        "but",
        "despite",
        "down",
        "during",
        "except",
        "inside",
        "like",
        "near",
        "opposite",
        "outside",
        "past",
        "per",
        "plus",
        "regarding",
        "round",
        "since",
        "than",
        "through",
        "throughout",
        "till",
        "toward",
        "towards",
        "until",
        "unto",
        "upon",
        "versus",
        "via",
        "within",
        "without",
        // Conjunctions
        "and",
        "or",
        "nor",
        "so",
        "yet",
        "although",
        "because",
        "unless",
        "when",
        "where",
        "while",
        // Verbs
        "am",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "having",
        "do",
        "does",
        "did",
        "doing",
        "can",
        "could",
        "should",
        "would",
        "shall",
        "will",
        "may",
        "might",
        "must",
        "ought",
        // Question words
        "why",
        "how",
        // Common modifiers
        "many",
        "much",
        "several",
        "few",
        "little",
        "various",
        "certain",
        "some",
        "any",
        "all",
        "both",
        "each",
        "more",
        "most",
        "other",
        "such",
        "no",
        "not",
        "only",
        "own",
        "same",
        // Domain-specific stop words
        "amount",
        "level",
        "total",
        "number",
        "quantity",
        "value",
        "rate",
        "enter",
        "select",
        "choose",
        "provide",
        "specify",
        "indicate",
        "list",
        "approximate",
        "estimated",
        "average",
      ]
  
      fallbackStopWords.forEach((word) => this.stopWords.add(word))
  
      // Comprehensive fallback domain words
      const fallbackDomainWords = {
        // High priority agricultural terms
        soil: 10,
        crop: 10,
        yield: 10,
        moisture: 9,
        temperature: 9,
        ph: 9,
        nitrogen: 8,
        phosphorus: 8,
        potassium: 8,
        water: 8,
        pen: 8,
        field: 8,
        harvest: 8,
        plant: 8,
        seed: 8,
        growth: 8,
        // Livestock and poultry terms
        chicken: 9,
        chick: 9,
        hen: 9,
        rooster: 9,
        egg: 9,
        cattle: 9,
        cow: 9,
        bull: 9,
        calf: 9,
        pig: 9,
        sheep: 9,
        goat: 9,
        lamb: 9,
        duck: 9,
        horse: 9,
        feed: 8,
        weight: 8,
        // Health and treatment terms
        vaccination: 9,
        vaccine: 9,
        health: 8,
        disease: 8,
        treatment: 8,
        medication: 8,
        antibiotic: 8,
        supplement: 7,
        vitamin: 7,
        // Agricultural operations
        planting: 8,
        seeding: 8,
        fertilizing: 8,
        spraying: 8,
        watering: 8,
        harvesting: 8,
        breeding: 8,
        feeding: 8,
        milking: 8,
        shearing: 8,
        // Measurements and properties
        breadth: 7,
        width: 7,
        length: 7,
        height: 7,
        depth: 7,
        area: 7,
        volume: 7,
        density: 7,
        concentration: 7,
        percentage: 6,
        content: 6,
      }
  
      Object.entries(fallbackDomainWords).forEach(([word, weight]) => {
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
      if (!this.supabaseAvailable) {
        // Simple fallback uniqueness check using timestamp
        return `${tag}_${Date.now().toString().slice(-4)}`
      }
  
      try {
        const supabase = this.getSupabaseClient()
        if (!supabase) return tag
  
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
      if (!this.supabaseAvailable) {
        console.log("Database not available, skipping save")
        return
      }
  
      try {
        const supabase = this.getSupabaseClient()
        if (!supabase) return
  
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
  
  export type { TagResult }
  