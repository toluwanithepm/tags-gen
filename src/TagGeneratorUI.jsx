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

  const generateFieldId = () => {
    return `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
  
  const handleGenerateTag = async () => {
    if (!fieldLabel.trim()) {
      setError('Please enter a field label');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const currentFieldId = fieldId || generateFieldId();
      setFieldId(currentFieldId);

      const result = await generateTag(fieldLabel, formId);

      setGeneratedTag(result.tag);
      setTagQuality(result.quality);
      setMessage(result.message);
      setCustomTag(result.tag);

      if (!savedTags.some(tag => tag.field_id === currentFieldId)) {
        setSavedTags([...savedTags, {
          field_id: currentFieldId,
          field_label: fieldLabel,
          tag: result.tag,
          quality: result.quality
        }]);
      }
    } catch (err) {
      console.error('Tag generation error:', err);
      setError('An error occurred while generating the tag.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTag = async (fieldLabel, formId) => {
    const normalizeText = (text) => {
      return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const stopWords = new Set(["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about", "into", "over", "after", "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto", "out", "over", "to", "under", "up", "with", "about", "above", "across", "after", "against", "along", "amid", "among", "around", "as", "before", "behind", "below", "beneath", "beside", "between", "beyond", "but", "despite", "down", "during", "except", "for", "from", "inside", "like", "near", "opposite", "outside", "past", "per", "plus", "regarding", "round", "since", "than", "through", "throughout", "till", "toward", "towards", "until", "unto", "upon", "versus", "via", "within", "without", "and", "or", "but", "if", "nor", "so", "yet", "although", "because", "since", "unless", "when", "where", "while", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "can", "could", "should", "would", "shall", "will", "may", "might", "must", "ought", "just", "very", "too", "also", "even", "quite", "simply", "else", "again", "further", "then", "once", "here", "there", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "what", "which", "who", "whom", "whose", "why", "how", "where", "when", "many", "much", "several", "few", "little", "various", "certain", "some", "any", "one", "two", "three", "four", "five", "ten", "hundred", "thousand", "million", "now", "later", "soon", "never", "always", "sometimes", "often", "rarely", "daily", "weekly", "monthly", "yearly", "today", "tomorrow", "yesterday", "etc", "eg", "ex", "ie", "vs", "hi", "hello", "please", "thanks", "thank", "following", "given", "taken", "made", "done", "used", "amount", "level", "total", "number", "quantity", "value", "rate", "many", "enter", "select", "choose", "provide", "specify", "indicate", "list", "approximate", "estimated", "average"]);

    const domainWords = {
      "soil": 10, "crop": 10, "yield": 10, "moisture": 9, "temperature": 9,
      "ph": 9, "nitrogen": 8, "phosphorus": 8, "potassium": 8, "water": 8,
      "pen": 8, "field": 8, "harvest": 8, "plant": 8, "seed": 8, "growth": 8,
      "irrigation": 7, "fertilizer": 7, "pesticide": 7, "rainfall": 7,
      "chicken": 9, "chick": 9, "hen": 9, "rooster": 9, "egg": 9,
      "cattle": 9, "cow": 9, "bull": 9, "calf": 9, "pig": 9, "sheep": 9,
      "goat": 9, "lamb": 9, "duck": 9, "horse": 9, "feed": 8, "weight": 8,
      "vaccination": 9, "vaccine": 9, "health": 8, "disease": 8, "treatment": 8,
      "medication": 8, "antibiotic": 8, "supplement": 7, "vitamin": 7,
      "planting": 8, "seeding": 8, "fertilizing": 8, "spraying": 8, "watering": 8,
      "harvesting": 8, "breeding": 8, "feeding": 8, "milking": 8, "shearing": 8
    };

    const normalized = normalizeText(fieldLabel);
    const tokens = normalized.split(' ').filter(token => 
      !stopWords.has(token) && token.trim() && token.length > 1
    );

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

    const scoredTokens = tokens.map(token => [token, domainWords[token] || 5])
      .sort((a, b) => b[1] - a[1]);

    const selectedTokens = scoredTokens.slice(0, 3).map(([token, _]) => token);

    const tag = selectedTokens.join('_') || 'generic_field';

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

  const handleSaveCustomTag = async () => {
    if (!customTag.trim()) {
      setError('Please enter a custom tag');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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

  const handleSelectTag = (selectedTag) => {
    setFieldLabel(selectedTag.field_label);
    setFieldId(selectedTag.field_id);
    setGeneratedTag(selectedTag.tag);
    setCustomTag(selectedTag.tag);
    setTagQuality(selectedTag.quality);
  };

  const handleReset = () => {
    setFieldLabel('');
    setFieldId('');
    setGeneratedTag('');
    setCustomTag('');
    setTagQuality('');
    setMessage('');
    setError('');
  };

  const getQualityColorClass = (quality) => {
    switch (quality) {
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
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
  );
};

export { generateTag };
export default TagGeneratorUI;
