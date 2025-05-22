const TagGenerator = require('./tag-generator-class');

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const generator = new TagGenerator();
    const { action, ...body } = req.body;

    try {
        switch (action) {
            case 'generateTag':
                const { fieldLabel, fieldId, formId } = body;
                const generatedTag = generator.generateTag(fieldLabel, formId);
                
                // Save the generated tag
                const savedTag = generator.saveTag(fieldId, formId, fieldLabel, generatedTag);
                
                // Evaluate tag quality
                const [quality, message] = generator.evaluateTagQuality(generatedTag, formId);
                
                return res.status(200).json({
                    success: true,
                    tag: generatedTag,
                    quality,
                    message,
                    savedTag
                });

            case 'updateTag':
                const { fieldId: updateFieldId, formId: updateFormId, newTag } = body;
                const updatedTag = generator.updateTag(updateFieldId, updateFormId, newTag);
                
                if (updatedTag) {
                    const [updateQuality, updateMessage] = generator.evaluateTagQuality(newTag, updateFormId);
                    return res.status(200).json({
                        success: true,
                        updatedTag,
                        quality: updateQuality,
                        message: updateMessage
                    });
                } else {
                    return res.status(404).json({
                        success: false,
                        error: 'Field not found'
                    });
                }

            case 'evaluateTag':
                const { tag, formId: evalFormId } = body;
                const [evalQuality, evalMessage] = generator.evaluateTagQuality(tag, evalFormId);
                
                return res.status(200).json({
                    success: true,
                    quality: evalQuality,
                    message: evalMessage
                });

            case 'getFormFields':
                const { formId: getFormId } = body;
                const fields = generator.getFormFields(getFormId);
                const stats = generator.getFormStats(getFormId);
                
                return res.status(200).json({
                    success: true,
                    fields,
                    stats
                });

            case 'getAllForms':
                const forms = generator.getAllForms();
                
                return res.status(200).json({
                    success: true,
                    forms
                });

            case 'getFormStats':
                const { formId: statsFormId } = body;
                const formStats = generator.getFormStats(statsFormId);
                
                return res.status(200).json({
                    success: true,
                    stats: formStats
                });

            case 'learnFromFeedback':
                const { fieldLabel: feedbackLabel, generatedTag: feedbackGeneratedTag, correctTag } = body;
                const learned = generator.learnFromFeedback(feedbackLabel, feedbackGeneratedTag, correctTag);
                
                return res.status(200).json({
                    success: true,
                    learned
                });

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
        }
    } catch (error) {
        console.error('Error in tag generator API:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}