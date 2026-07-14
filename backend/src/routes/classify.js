const express = require('express');
const router = express.Router();
const { classifyImage, getCategories, CIVIC_CATEGORIES } = require('../services/aiClassificationService');

router.post('/', async (req, res) => {
  try {
    const { imageUrl, imageBase64 } = req.body;
    
    if (!imageUrl && !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Either imageUrl or imageBase64 is required'
      });
    }
    
    const result = await classifyImage({ imageUrl, imageBase64 });
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.json({ success: false, data: result, message: result.error });
    }
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      success: false,
      message: 'Classification failed',
      error: error.message
    });
  }
});

router.get('/categories', (req, res) => {
  try {
    res.json({
      success: true,
      data: { categories: getCategories(), count: CIVIC_CATEGORIES.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

router.get('/health', (req, res) => {
  const tokenConfigured = !!process.env.GROQ_API_KEY;
  res.json({
    success: true,
    data: {
      service: 'Groq Vision AI Classification',
      model: 'llama-4-scout-17b-16e-instruct',
      status: tokenConfigured ? 'configured' : 'not_configured'
    }
  });
});

module.exports = router;