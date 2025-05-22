const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the TagGenerator class
const TagGenerator = require('./tag-generator.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Create a singleton instance of TagGenerator
const tagGenerator = new TagGenerator();

// Tag generator API endpoint
app.post('/api/tag-generator', (req, res) => {
  try {
    // Parse the request body
    const { field_label, form_id, field_id } = req.body;
    
    // Validate required parameters
    if (!field_label || !form_id) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['field_label', 'form_id']
      });
    }
    
    // Generate a tag for the field
    const tag = tagGenerator.generateTag(field_label, form_id);
    
    // Save the tag if field_id is provided
    let tag_info = null;
    if (field_id) {
      tag_info = tagGenerator.saveTag(field_id, form_id, field_label, tag);
    }
    
    // Evaluate the quality of the tag
    const [quality, message] = tagGenerator.evaluateTagQuality(tag, form_id);
    
    // Return the generated tag and its quality assessment
    return res.status(200).json({
      success: true,
      tag,
      quality,
      message,
      tag_info
    });
  } catch (error) {
    console.error('Error generating tag:', error);
    return res.status(500).json({ 
      error: 'Failed to generate tag',
      message: error.message
    });
  }
});

// Get all forms endpoint
app.get('/api/forms', (req, res) => {
  try {
    const forms = tagGenerator.getAllForms();
    return res.status(200).json({
      success: true,
      forms
    });
  } catch (error) {
    console.error('Error getting forms:', error);
    return res.status(500).json({
      error: 'Failed to get forms',
      message: error.message
    });
  }
});

// Get form fields endpoint
app.get('/api/forms/:formId/fields', (req, res) => {
  try {
    const { formId } = req.params;
    const fields = tagGenerator.getFormFields(formId);
    const stats = tagGenerator.getFormStats(formId);
    
    return res.status(200).json({
      success: true,
      form_id: formId,
      fields,
      stats
    });
  } catch (error) {
    console.error('Error getting form fields:', error);
    return res.status(500).json({
      error: 'Failed to get form fields',
      message: error.message
    });
  }
});

// Update tag endpoint
app.put('/api/forms/:formId/fields/:fieldId/tag', (req, res) => {
  try {
    const { formId, fieldId } = req.params;
    const { new_tag } = req.body;
    
    if (!new_tag) {
      return res.status(400).json({
        error: 'Missing required parameter: new_tag'
      });
    }
    
    const result = tagGenerator.updateTag(fieldId, formId, new_tag);
    
    if (!result) {
      return res.status(404).json({
        error: 'Tag not found'
      });
    }
    
    // Evaluate the quality of the new tag
    const [quality, message] = tagGenerator.evaluateTagQuality(new_tag, formId);
    
    return res.status(200).json({
      success: true,
      updated_tag: result,
      quality,
      message
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return res.status(500).json({
      error: 'Failed to update tag',
      message: error.message
    });
  }
});

// Learn from feedback endpoint
app.post('/api/learn', (req, res) => {
  try {
    const { field_label, generated_tag, correct_tag } = req.body;
    
    if (!field_label || !generated_tag || !correct_tag) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['field_label', 'generated_tag', 'correct_tag']
      });
    }
    
    const result = tagGenerator.learnFromFeedback(field_label, generated_tag, correct_tag);
    
    return res.status(200).json({
      success: true,
      learned: result
    });
  } catch (error) {
    console.error('Error learning from feedback:', error);
    return res.status(500).json({
      error: 'Failed to learn from feedback',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tag Generator API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the frontend if you have a built React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Tag Generator API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Tag generator: http://localhost:${PORT}/api/tag-generator`);
});

module.exports = app;