import { useState, useEffect } from 'react';

const TagGeneratorUI = () => {
  const [fieldLabel, setFieldLabel] = useState('');
  const [formId, setFormId] = useState('form-1');
  const [fieldId, setFieldId] = useState('');
  const [generatedTag, setGeneratedTag] = useState('');
  const [tagQuality, setTagQuality] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedTags, setSavedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [forms, setForms] = useState(['form-1', 'form-2', 'form-3']);

  // Generate a unique field ID when needed
  const generateFieldId = () => {
    return `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Handle tag generation
  const handleGenerateTag = async () => {
    if (!fieldLabel.trim()) {
      setError('Please enter a field label');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate a field ID if not present
      const currentFieldId = fieldId || generateFieldId();
      setFieldId(currentFieldId);

      // Try different API endpoints
      const possibleEndpoints = [
        '/api/tag-generator',
        '/api/tag-generator-api',
        'http://localhost:3000/api/tag-generator',
        'http://localhost:8000/api/tag-generator'
      ];

      let response = null;
      let lastError = null;

      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              field_label: fieldLabel,
              form_id: formId,
              field_id: currentFieldId
            }),
          });

          if (response.ok) {
            break; // Success, exit the loop
          }
        } catch (err) {
          lastError = err;
          continue; // Try the next endpoint
        }
      }

      // If no endpoint worked, fall back to client-side generation
      if (!response || !response.ok) {
        console.warn('API endpoints not available, using client-side generation');
        const result = await generateTagClientSide(fieldLabel, formId);
        
        setGeneratedTag(result.tag);
        setTagQuality(result.quality);
        setMessage(result.message);
        setCustomTag(result.tag);
        
        // Add to saved tags if not already present
        if (!savedTags.some(tag => tag.field_id === currentFieldId)) {
          setSavedTags([...savedTags, {
            field_id: currentFieldId,
            field_label: fieldLabel,
            tag: result.tag,
            quality: result.quality
          }]);
        }
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setGeneratedTag(data.tag);
        setTagQuality(data.quality);
        setMessage(data.message);
        setCustomTag(data.tag); // Initialize custom tag with generated tag
        
        // Add to saved tags if not already present
        if (!savedTags.some(tag => tag.field_id === currentFieldId)) {
          setSavedTags([...savedTags, {
            field_id: currentFieldId,
            field_label: fieldLabel,
            tag: data.tag,
            quality: data.quality
          }]);
        }
      } else {
        setError(data.error || 'An error occurred while generating the tag');
      }
    } catch (err) {
      console.error('Tag generation error:', err);
      setError('API not available. Please check your backend configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side tag generation fallback
  const generateTagClientSide = async (fieldLabel, formId) => {
    // Simple client-side tag generation as fallback
    const normalizeText = (text) => {
      return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',  // Articles
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
            "approximate", "estimated", "average"]);

    const domainWords = {
      'soil': 10, 'crop': 10, 'yield': 10, 'moisture': 9, 'temperature': 9,
      'ph': 9, 'nitrogen': 8, 'phosphorus': 8, 'potassium': 8, 'water': 8,
      'pen': 8, 'field': 8, 'harvest': 8, 'plant': 8, 'seed': 8, 'growth': 8,
      'chicken': 9, 'chick': 9, 'cow': 9, 'cattle': 9, 'pig': 9, 'sheep': 9,
      'vaccination': 9, 'vaccine': 9, 'health': 8, 'disease': 8, 'treatment': 8
    };

    // Normalize and tokenize
    const normalized = normalizeText(fieldLabel);
    const tokens = normalized.split(' ').filter(token => 
      !stopWords.has(token) && token.trim() && token.length > 1
    );

    // Handle vaccination special case
    if (fieldLabel.toLowerCase().includes('vaccination') || fieldLabel.toLowerCase().includes('vaccine')) {
      const animals = ['chick', 'chicken', 'cow', 'cattle', 'pig', 'sheep', 'goat'];
      for (const animal of animals) {
        if (tokens.includes(animal)) {
          return {
            tag: `${animal}_vaccination`,
            quality: 'green',
            message: 'Strong tag'
          };
        }
      }
      return {
        tag: 'animal_vaccination',
        quality: 'yellow',
        message: 'Acceptable tag but could be improved'
      };
    }

    // Score tokens
    const scoredTokens = tokens.map(token => [token, domainWords[token] || 5])
      .sort((a, b) => b[1] - a[1]);

    // Select top tokens
    const selectedTokens = scoredTokens.slice(0, 3).map(([token, _]) => token);
    
    const tag = selectedTokens.join('_') || 'generic_field';
    
    // Evaluate quality
    const domainSpecific = selectedTokens.some(token => token in domainWords);
    let quality, message;
    
    if (domainSpecific && selectedTokens.length >= 2) {
      quality = 'green';
      message = 'Strong tag';
    } else if (domainSpecific || selectedTokens.length >= 2) {
      quality = 'yellow';
      message = 'Acceptable tag but could be improved';
    } else {
      quality = 'red';
      message = 'Tag is too generic';
    }

    return { tag, quality, message };
  };

  // Handle saving a custom tag
  const handleSaveCustomTag = async () => {
    if (!customTag.trim()) {
      setError('Please enter a custom tag');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real app, you would call an API to update the tag
      // For now, we'll just update the local state
      const updatedTags = savedTags.map(tag => {
        if (tag.field_id === fieldId) {
          return {
            ...tag,
            tag: customTag
          };
        }
        return tag;
      });

      setSavedTags(updatedTags);
      setGeneratedTag(customTag);
      
      // Evaluate tag quality (this would ideally be done by the API)
      const tokens = customTag.split('_');
      if (tokens.length >= 2 && customTag.length > 5) {
        setTagQuality('green');
        setMessage('Strong tag');
      } else if (tokens.length >= 1 && customTag.length > 3) {
        setTagQuality('yellow');
        setMessage('Acceptable tag but could be improved');
      } else {
        setTagQuality('red');
        setMessage('Tag is too generic');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving the custom tag');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a saved tag
  const handleSelectTag = (selectedTag) => {
    setFieldLabel(selectedTag.field_label);
    setFieldId(selectedTag.field_id);
    setGeneratedTag(selectedTag.tag);
    setCustomTag(selectedTag.tag);
    setTagQuality(selectedTag.quality);
  };

  // Reset the form
  const handleReset = () => {
    setFieldLabel('');
    setFieldId('');
    setGeneratedTag('');
    setCustomTag('');
    setTagQuality('');
    setMessage('');
    setError('');
  };

  // Get quality color class
  const getQualityColorClass = (quality) => {
    switch (quality) {
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Agricultural Tag Generator</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Tag generation form */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Generate New Tag</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Form ID</label>
            <select 
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {forms.map(form => (
                <option key={form} value={form}>{form}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Field Label</label>
            <input 
              type="text" 
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="e.g., Soil pH Level, Chick Vaccination Date"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <button 
            onClick={handleGenerateTag}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Generating...' : 'Generate Tag'}
          </button>
          
          <button 
            onClick={handleReset}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Reset
          </button>
          
          {generatedTag && (
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Generated Tag:</h3>
              <div className="flex items-center mb-4">
                <code className="bg-gray-100 px-3 py-1 rounded mr-2">{generatedTag}</code>
                <span className={`text-sm px-2 py-1 rounded border ${getQualityColorClass(tagQuality)}`}>
                  {message}
                </span>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Custom Tag (Optional)</label>
                <div className="flex">
                  <input 
                    type="text" 
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Enter a custom tag"
                    className="flex-1 px-3 py-2 border rounded-l-md"
                  />
                  <button 
                    onClick={handleSaveCustomTag}
                    className="bg-green-600 text-white px-3 py-2 rounded-r-md hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">Use snake_case format (e.g., soil_ph_level)</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Saved tags */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Saved Tags ({savedTags.length})</h2>
          
          {savedTags.length === 0 ? (
            <p className="text-gray-500">No tags saved yet. Generate your first tag!</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              {savedTags.map((tag) => (
                <div 
                  key={tag.field_id}
                  onClick={() => handleSelectTag(tag)}
                  className="border rounded-md p-3 mb-2 cursor-pointer hover:bg-gray-50"
                >
                  <p className="font-medium truncate">{tag.field_label}</p>
                  <div className="flex items-center mt-1">
                    <code className="bg-gray-100 text-sm px-2 py-1 rounded mr-2">{tag.tag}</code>
                    <span className={`text-xs px-2 py-1 rounded border ${getQualityColorClass(tag.quality)}`}>
                      {tag.quality}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">About Tag Generator</h2>
        <p className="mb-2">This tool helps you generate consistent, meaningful tags for agricultural form fields.</p>
        <p className="mb-2">The generated tags follow a standardized format and take into account agricultural domain knowledge.</p>
        <p>Common tag patterns include:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>soil_ph - for soil pH fields</li>
          <li>crop_harvested - for harvested crop fields</li>
          <li>chicken_vaccination - for chicken vaccination fields</li>
          <li>yield_acre - for yield per acre fields</li>
        </ul>
      </div>
    </div>
  );
};

export default TagGeneratorUI;