/**
 * TagGenerator class - Converted from Python implementation
 * Handles the generation of consistent agricultural field tags
 */
class TagGenerator {
    constructor() {
        // Expanded comprehensive list of English stop words
        this.stopWords = new Set([
            // Articles
            "a", "an", "the",
            
            // Pronouns
            "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", 
            "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", 
            "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", 
            "theirs", "themselves", "what", "which", "who", "whom", "this", "that", 
            "these", "those",
            
            // Prepositions
            "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto", "out", 
            "over", "to", "under", "up", "with", "about", "above", "across", "after", 
            "against", "along", "amid", "among", "around", "as", "before", "behind", 
            "below", "beneath", "beside", "between", "beyond", "but", "despite", "down", 
            "during", "except", "for", "from", "inside", "like", "near", "opposite", 
            "outside", "past", "per", "plus", "regarding", "round", "since", "than", 
            "through", "throughout", "till", "toward", "towards", "until", "unto", "upon", 
            "versus", "via", "within", "without",
            
            // Conjunctions
            "and", "or", "but", "if", "nor", "so", "yet", "although", "because", "since", 
            "unless", "when", "where", "while",
            
            // Verbs
            "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", 
            "having", "do", "does", "did", "doing", "can", "could", "should", "would", 
            "shall", "will", "may", "might", "must", "ought",
            
            // Adverbs
            "just", "very", "too", "also", "even", "quite", "simply", "else", "again", 
            "further", "then", "once", "here", "there", "why", "how", "all", "any", 
            "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", 
            "not", "only", "own", "same", "so", "than",
            
            // Question words
            "what", "which", "who", "whom", "whose", "why", "how", "where", "when",
            
            // Common modifiers
            "many", "much", "several", "few", "little", "various", "certain", "some", "any",
            
            // Quantities/Numbers
            "one", "two", "three", "four", "five", "ten", "hundred", "thousand", "million",
            
            // Time-related
            "now", "later", "soon", "never", "always", "sometimes", "often", "rarely",
            "daily", "weekly", "monthly", "yearly", "today", "tomorrow", "yesterday",
            
            // Others
            "etc", "eg", "ex", "ie", "vs", "hi", "hello", "please", "thanks", "thank", 
            "following", "given", "taken", "made", "done", "used",
            
            // Domain-specific stop words
            "amount", "level", "total", "number", "quantity", "value", "rate", "many",
            "enter", "select", "choose", "provide", "specify", "indicate", "list",
            "approximate", "estimated", "average"
        ]);
        
        // Domain-specific words with importance weights (higher = more important)
        this.domainWords = {
            // Agricultural terms
            "soil": 10, "crop": 10, "yield": 10, "moisture": 9, "temperature": 9,
            "ph": 9, "nitrogen": 8, "phosphorus": 8, "potassium": 8, "water": 8,
            "pen": 8, "field": 8, "harvest": 8, "plant": 8, "seed": 8, "growth": 8,
            "irrigation": 7, "fertilizer": 7, "pesticide": 7, "rainfall": 7,
            
            // Livestock and poultry terms
            "chicken": 9, "chick": 9, "hen": 9, "rooster": 9, "egg": 9, 
            "cattle": 9, "cow": 9, "bull": 9, "calf": 9, "pig": 9, "sheep": 9,
            "goat": 9, "lamb": 9, "duck": 9, "horse": 9, "feed": 8, "weight": 8,
            "vaccination": 9, "vaccine": 9, "health": 8, "disease": 8, "treatment": 8,
            "medication": 8, "antibiotic": 8, "supplement": 7, "vitamin": 7,
            
            // Agricultural operations
            "planting": 8, "seeding": 8, "fertilizing": 8, "spraying": 8, "watering": 8,
            "harvesting": 8, "breeding": 8, "feeding": 8, "milking": 8, "shearing": 8
        };
        
        // Semantic relationships to prioritize certain combinations
        this.semanticPairs = {
            "vaccination": ["chick", "chicken", "animal", "livestock"],
            "moisture": ["soil", "crop", "field"],
            "temperature": ["soil", "storage", "incubation", "greenhouse"],
            "yield": ["crop", "field", "harvest"],
            "weight": ["animal", "feed", "gain", "loss"],
            "ph": ["soil", "water", "acid", "alkaline"],
            "fertilizer": ["nitrogen", "phosphorus", "potassium", "application"],
            "irrigation": ["water", "field", "drip", "sprinkler"],
            "disease": ["prevention", "treatment", "symptom", "control"]
        };
        
        // Database simulation (would be replaced with actual database in production)
        this.tagDatabase = {};
    }
    
    normalizeText(text) {
        // Step 1: Normalize the text by converting to lowercase and removing punctuation
        text = text.toLowerCase();
        text = text.replace(/[^\w\s]/g, ' ');  // Replace punctuation with spaces
        text = text.replace(/\s+/g, ' ').trim();  // Normalize whitespace
        return text;
    }
    
    tokenize(text) {
        // Step 2: Split text into words
        return text.split(' ');
    }
    
    removeStopWords(tokens) {
        // Step 3: Remove common stop words
        return tokens.filter(token => !this.stopWords.has(token) && token.trim());
    }
    
    lemmatize(tokens) {
        // Step 4: Basic lemmatization (simplified implementation)
        const lemmaMap = {
            // Plurals
            "readings": "reading", "varieties": "variety", "dates": "date",
            "crops": "crop", "fields": "field", "seeds": "seed", "yields": "yield",
            "chicks": "chick", "chickens": "chicken", "eggs": "egg", "cows": "cow",
            "cattle": "cattle", "calves": "calf", "pigs": "pig", "sheep": "sheep",
            "goats": "goat", "lambs": "lamb", "horses": "horse", "ducks": "duck",
            "vaccines": "vaccine", "vaccinations": "vaccination", "antibiotics": "antibiotic",
            "vitamins": "vitamin", "supplements": "supplement", "diseases": "disease",
            
            // Verb forms
            "applies": "apply", "planting": "plant", "harvesting": "harvest", 
            "irrigating": "irrigate", "fertilizing": "fertilize", "breeding": "breed",
            "feeding": "feed", "milking": "milk", "shearing": "shear", "vaccinating": "vaccinate",
            "treating": "treat", "spraying": "spray", "watering": "water", "given": "give"
        };
        
        return tokens.map(token => lemmaMap[token] || token);
    }
    
    identifyKeyConcepts(tokens) {
        // Identify key domain concepts and related terms
        const domainTerms = tokens.filter(token => token in this.domainWords);
        
        const relatedPairs = [];
        for (const token of tokens) {
            for (const [concept, relatedTerms] of Object.entries(this.semanticPairs)) {
                if (token === concept && relatedTerms.some(term => tokens.includes(term))) {
                    for (const related of relatedTerms) {
                        if (tokens.includes(related)) {
                            relatedPairs.push([concept, related]);
                        }
                    }
                }
            }
        }
        
        return [domainTerms, relatedPairs];
    }
    
    rankWords(tokens) {
        // Step 5: Rank words by significance using domain knowledge
        const scoredTokens = tokens.map(token => [token, this.domainWords[token] || 5]);
        // Sort by score in descending order
        return scoredTokens.sort((a, b) => b[1] - a[1]);
    }
    
    selectWords(scoredTokens, originalTokens = null, maxWords = 3) {
        // Step 6: Select the top N words by significance with contextual awareness
        const selectedTokens = scoredTokens.slice(0, maxWords).map(([token, _]) => token);
        
        // Special case handling for vaccination of animals
        const tokenNames = scoredTokens.map(([token, _]) => token);
        if (tokenNames.includes('vaccination') || tokenNames.includes('vaccine')) {
            for (const animal of ['chick', 'chicken', 'cow', 'cattle', 'pig', 'sheep', 'goat', 'lamb', 'horse', 'duck']) {
                if (tokenNames.includes(animal)) {
                    return [animal, 'vaccination'];
                }
            }
        }
        
        // Special case handling for other common relationships
        const [domainTerms, relatedPairs] = originalTokens ? this.identifyKeyConcepts(originalTokens) : [[], []];
        
        if (relatedPairs.length > 0) {
            // Return the most relevant pair
            return relatedPairs[0];
        }
        
        return selectedTokens;
    }
    
    formatTag(tokens) {
        // Step 7: Format the tag with snake_case
        if (!tokens || tokens.length === 0) {
            return "generic_field";  // Fallback for empty tokens
        }
        
        // Ensure tag is not too long (max 25 characters)
        let tag = tokens.join('_');
        
        if (tag.length > 25) {
            // Truncate if necessary
            tag = tag.substring(0, 25);
            // Ensure we don't cut in the middle of a word or leave trailing underscore
            if (tag.includes('_')) {
                tag = tag.substring(0, tag.lastIndexOf('_'));
            }
        }
        
        return tag;
    }
    
    ensureUniqueness(tag, formId) {
        // Step 8: Ensure the tag is unique within the form
        const existingTags = this.getFormTags(formId);
        
        // If tag exists, append a number to make it unique
        if (existingTags.has(tag)) {
            let counter = 2;
            while (existingTags.has(`${tag}_${counter}`)) {
                counter++;
            }
            return `${tag}_${counter}`;
        }
        
        return tag;
    }
    
    getFormTags(formId) {
        // Helper function to get all tags for a specific form
        if (!(formId in this.tagDatabase)) {
            return new Set();
        }
        return new Set(Object.values(this.tagDatabase[formId]).map(tagInfo => tagInfo.final_tag));
    }
    
    extractKeyTerms(fieldLabel) {
        // Process field label to extract key terms
        const normalized = this.normalizeText(fieldLabel);
        const tokens = this.tokenize(normalized);
        const filtered = this.removeStopWords(tokens);
        const lemmatized = this.lemmatize(filtered);
        
        return [lemmatized, tokens];  // Return both filtered and original tokens
    }
    
    generateTag(fieldLabel, formId) {
        // Generate a tag based on the field label
        const [terms, originalTokens] = this.extractKeyTerms(fieldLabel);
        
        // Special case for vaccination questions
        if (fieldLabel.toLowerCase().includes('vaccination') || 
            fieldLabel.toLowerCase().includes('vaccine') || 
            fieldLabel.toLowerCase().includes('vaccinated') || 
            fieldLabel.toLowerCase().includes('vaccinating')) {
            
            // Look for mentions of animals
            for (const animal of ['chick', 'chicken', 'cow', 'cattle', 'pig', 'sheep', 'goat', 'lamb', 'horse', 'duck']) {
                if (terms.includes(animal) || terms.includes(animal + 's')) {
                    return this.ensureUniqueness(`${animal}_vaccination`, formId);
                }
            }
            
            // If no specific animal, use generic "animal_vaccination"
            return this.ensureUniqueness("animal_vaccination", formId);
        }
        
        // Handle special cases based on patterns in the field label
        const originalLower = fieldLabel.toLowerCase();
        let tokens = [];
        
        // Pattern-based tag generation for common field types
        if (terms.includes('breadth') && terms.includes('pen')) {
            tokens = ['pen', 'breadth'];
        } 
        else if (terms.includes('ph') && terms.includes('soil')) {
            tokens = ['soil', 'ph'];
        } 
        else if (terms.includes('crop') && terms.includes('harvested')) {
            tokens = ['crop', 'harvested'];
        } 
        else if (terms.includes('yield') && terms.includes('acre')) {
            tokens = ['yield', 'acre'];
        } 
        else if (terms.includes('water') && terms.includes('consumption')) {
            tokens = ['water', 'consumption'];
        } 
        else if (terms.includes('moisture') && terms.includes('percentage')) {
            tokens = ['moisture', 'percentage'];
        } 
        else if (terms.includes('nitrogen') && terms.includes('soil')) {
            tokens = ['soil', 'nitrogen', 'content'];
        } 
        else if (terms.includes('irrigation') && terms.includes('date')) {
            tokens = ['irrigation', 'date'];
        } 
        else if (terms.includes('harvest') && terms.includes('date')) {
            tokens = ['harvest', 'date'];
        } 
        else if (terms.includes('seed') && (terms.includes('varieties') || terms.includes('variety'))) {
            tokens = ['seed', 'varieties'];
        } 
        else if (terms.includes('fertilizer') && terms.includes('applied')) {
            tokens = ['fertilizer', 'applied'];
        } 
        else if (terms.includes('rainfall') && terms.includes('season')) {
            tokens = ['rainfall', 'season'];
        } 
        else if (terms.includes('temperature') && terms.includes('planting')) {
            tokens = ['temperature', 'planting'];
        } 
        else if (terms.includes('pesticide') && terms.includes('frequency')) {
            tokens = ['pesticide', 'frequency'];
        } 
        else if (terms.includes('width') && terms.includes('growing') && terms.includes('area')) {
            tokens = ['width', 'growing', 'area'];
        } 
        else {
            // Default case - use general algorithm
            const scoredTerms = this.rankWords(terms);
            tokens = this.selectWords(scoredTerms, terms, 3);
            
            // If we couldn't extract meaningful tokens, use domain detection
            if (!tokens || !tokens.length || tokens.every(token => !(token in this.domainWords))) {
                const [domainTerms, relatedPairs] = this.identifyKeyConcepts(terms);
                if (relatedPairs.length > 0) {
                    tokens = relatedPairs[0];
                } else if (domainTerms.length > 0) {
                    tokens = domainTerms.slice(0, 2);
                }
            }
        }
        
        // Format the tag with snake_case
        const tag = this.formatTag(tokens);
        
        // Ensure uniqueness
        const uniqueTag = this.ensureUniqueness(tag, formId);
        
        return uniqueTag;
    }
    
    saveTag(fieldId, formId, fieldLabel, generatedTag, finalTag = null) {
        // Save tag information to the database
        if (!(formId in this.tagDatabase)) {
            this.tagDatabase[formId] = {};
        }
            
        this.tagDatabase[formId][fieldId] = {
            field_label: fieldLabel,
            generated_tag: generatedTag,
            final_tag: finalTag || generatedTag,
            history: []  // Could store modification history here
        };
        
        return this.tagDatabase[formId][fieldId];
    }
    
    updateTag(fieldId, formId, newTag) {
        // Update a tag after user modification
        if (formId in this.tagDatabase && fieldId in this.tagDatabase[formId]) {
            // Store the old tag in history
            const oldTag = this.tagDatabase[formId][fieldId].final_tag;
            this.tagDatabase[formId][fieldId].history.push(oldTag);
            
            // Update with the new tag
            this.tagDatabase[formId][fieldId].final_tag = newTag;
            
            return this.tagDatabase[formId][fieldId];
        }
        return null;
    }
    
    evaluateTagQuality(tag, formId) {
        // Evaluate the quality of a tag
        // Check if formId has been saved to the database
        const existingTags = new Set(this.getFormTags(formId));
        
        // Remove the current tag from the set of existing tags for uniqueness check
        if (existingTags.has(tag)) {
            existingTags.delete(tag);
        }
            
        // Length check (too short might be too generic)
        if (tag.length < 5) {
            return ["red", "Tag is too short"];
        }
            
        // Uniqueness check against other tags (not itself)
        if (existingTags.has(tag)) {
            return ["red", "Tag is not unique within this form"];
        }
            
        // Domain specificity check
        const tokens = tag.split("_");
        const domainSpecific = tokens.some(token => token in this.domainWords);
        
        if (domainSpecific && tokens.length >= 2) {
            return ["green", "Strong tag"];
        } else if (domainSpecific || tokens.length >= 2) {
            return ["yellow", "Acceptable tag but could be improved"];
        } else {
            return ["red", "Tag is too generic"];
        }
    }
    
    learnFromFeedback(fieldLabel, generatedTag, correctTag) {
        // Learn from user feedback to improve future tag generation
        // Extract tokens from both tags
        const generatedTokens = generatedTag.split('_');
        const correctTokens = correctTag.split('_');
        
        // Identify what was wrong with the generated tag
        const missingTokens = correctTokens.filter(token => !generatedTokens.includes(token));
        const extraTokens = generatedTokens.filter(token => !correctTokens.includes(token));
        
        // Update domain words weights for correct tokens
        for (const token of correctTokens) {
            if (token in this.domainWords) {
                // Increase weight for correct tokens
                this.domainWords[token] += 1;
            } else {
                // Add new domain words
                this.domainWords[token] = 7;
            }
        }
        
        // Add extra tokens to stop words if they were incorrectly included
        for (const token of extraTokens) {
            if (!(token in this.domainWords) && !missingTokens.includes(token)) {
                this.stopWords.add(token);
            }
        }
        
        console.log("Learning: Updated domain words and stop words based on feedback");
        console.log(`Missing tokens that should be included: ${missingTokens}`);
        console.log(`Extra tokens that should be excluded: ${extraTokens}`);
        
        return true;
    }
    
    // Method to get all forms in the database
    getAllForms() {
        return Object.keys(this.tagDatabase);
    }
    
    // Method to get all fields for a specific form
    getFormFields(formId) {
        if (!(formId in this.tagDatabase)) {
            return [];
        }
        
        const fields = [];
        for (const [fieldId, fieldInfo] of Object.entries(this.tagDatabase[formId])) {
            const [quality, message] = this.evaluateTagQuality(fieldInfo.final_tag, formId);
            fields.push({
                field_id: fieldId,
                field_label: fieldInfo.field_label,
                current_tag: fieldInfo.final_tag,
                quality,
                message
            });
        }
        
        return fields;
    }
    
    // Method to get form stats
    getFormStats(formId) {
        if (!(formId in this.tagDatabase)) {
            return { totalFields: 0, strongTags: 0, weakTags: 0 };
        }

        const fields = this.getFormFields(formId);
        const totalFields = fields.length;
        const strongTags = fields.filter(field => field.quality === "green").length;
        const weakTags = totalFields - strongTags;
        
        return { totalFields, strongTags, weakTags };
    }
}

// Export the TagGenerator class for use in serverless function
module.exports = TagGenerator;