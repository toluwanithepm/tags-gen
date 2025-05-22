// Import the TagGenerator class
const TagGenerator = require('../lib/tag-generator');

// Create a global instance to maintain state between serverless function invocations
let tagGenerator;

// Initialize the tagGenerator if it doesn't exist
function getTagGenerator() {
    if (!tagGenerator) {
        tagGenerator = new TagGenerator();
    }
    return tagGenerator;
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Handle POST request
    if (req.method === 'POST') {
        try {
            const generator = getTagGenerator();
            const body = req.body;
            
            // Route to the correct function based on the action
            switch (body.action) {
                case 'generateTag':
                    const { fieldLabel, formId, fieldId } = body;
                    const generatedTag = generator.generateTag(fieldLabel, formId);
                    
                    if (fieldId) {
                        generator.saveTag(fieldId, formId, fieldLabel, generatedTag);
                    }
                    
                    const [quality, message] = generator.evaluateTagQuality(generatedTag, formId);
                    
                    res.status(200).json({
                        tag: generatedTag,
                        quality,
                        message
                    });
                    break;
                    
                case 'bulkGenerateTags':
                    const { formId: bulkFormId, fieldLabels } = body;
                    const results = [];
                    
                    for (let i = 0; i < fieldLabels.length; i++) {
                        const label = fieldLabels[i];
                        const autoFieldId = `field_${i}_${Date.now()}`;
                        const tag = generator.generateTag(label, bulkFormId);
                        generator.saveTag(autoFieldId, bulkFormId, label, tag);
                        const [quality, message] = generator.evaluateTagQuality(tag, bulkFormId);
                        
                        results.push({
                            field_id: autoFieldId,
                            field_label: label,
                            generated_tag: tag,
                            quality,
                            message
                        });
                    }
                    
                    res.status(200).json({ results });
                    break;
                    
                case 'updateTag':
                    const { fieldId: updateFieldId, formId: updateFormId, newTag } = body;
                    const updated = generator.updateTag(updateFieldId, updateFormId, newTag);
                    
                    if (updated) {
                        const [updatedQuality, updatedMessage] = generator.evaluateTagQuality(newTag, updateFormId);
                        res.status(200).json({
                            success: true,
                            tag: updated.final_tag,
                            quality: updatedQuality,
                            message: updatedMessage
                        });
                    } else {
                        res.status(404).json({
                            success: false,
                            message: "Field or form not found"
                        });
                    }
                    break;
                    
                case 'getForms':
                    const forms = generator.getAllForms();
                    res.status(200).json({ forms });
                    break;
                    
                case 'getFormFields':
                    const { formId: fieldsFormId } = body;
                    const fields = generator.getFormFields(fieldsFormId);
                    const stats = generator.getFormStats(fieldsFormId);
                    
                    res.status(200).json({
                        fields,
                        stats
                    });
                    break;
                    
                case 'learnFromFeedback':
                    const { fieldLabel: feedbackLabel, generatedTag, correctTag } = body;
                    const learned = generator.learnFromFeedback(feedbackLabel, generatedTag, correctTag);
                    
                    res.status(200).json({
                        success: learned,
                        message: "Feedback processed successfully"
                    });
                    break;
                    
                default:
                    res.status(400).json({
                        error: "Invalid action specified"
                    });
            }
        } catch (error) {
            console.error('Error processing request:', error);
            res.status(500).json({
                error: "Internal server error",
                message: error.message
            });
        }
    } else {
        // Handle GET request - provide simple info page
        res.status(200).json({
            info: "Agricultural Field Tag Generator API",
            endpoints: {
                "POST /api/generate-tag": "Main API endpoint for tag generation and management"
            },
            actions: [
                "generateTag", 
                "bulkGenerateTags", 
                "updateTag", 
                "getForms", 
                "getFormFields", 
                "learnFromFeedback"
            ]
        });
    }
};
