/**
 * AI Image Classification Service using Groq Vision API
 * Groq provides FREE vision AI with Llama 4 Scout model
 */

const Groq = require('groq-sdk');

// Category definitions
const CIVIC_CATEGORIES = [
  'pothole', 'garbage', 'streetlight', 'graffiti', 'road_damage',
  'water_leak', 'sewage', 'illegal_parking', 'noise', 'air_pollution',
  'encroachment', 'traffic_signal', 'sidewalk', 'tree_hazard', 'others'
];

const CATEGORY_DESCRIPTIONS = {
  'pothole': 'Holes or damage in road surface',
  'garbage': 'Trash, litter, or waste accumulation',
  'streetlight': 'Broken or non-functional street lights',
  'graffiti': 'Vandalism or unauthorized wall paintings',
  'road_damage': 'Cracks, erosion, or road surface damage',
  'water_leak': 'Water pipe leaks or flooding',
  'sewage': 'Drainage or sewage issues',
  'illegal_parking': 'Vehicles parked illegally',
  'noise': 'Noise pollution complaints',
  'air_pollution': 'Smoke, emissions, or air quality issues',
  'encroachment': 'Illegal constructions or encroachments',
  'traffic_signal': 'Broken or malfunctioning traffic signals',
  'sidewalk': 'Damaged or obstructed sidewalks',
  'tree_hazard': 'Fallen or dangerous trees',
  'others': 'Other civic issues'
};

const CATEGORY_DISPLAY_NAMES = {
  'pothole': 'Pothole',
  'garbage': 'Garbage/Waste',
  'streetlight': 'Street Light Issue',
  'graffiti': 'Graffiti/Vandalism',
  'road_damage': 'Road Damage',
  'water_leak': 'Water Leak',
  'sewage': 'Sewage/Drainage',
  'illegal_parking': 'Illegal Parking',
  'noise': 'Noise Complaint',
  'air_pollution': 'Air Pollution',
  'encroachment': 'Encroachment',
  'traffic_signal': 'Traffic Signal',
  'sidewalk': 'Sidewalk Issue',
  'tree_hazard': 'Tree Hazard',
  'others': 'Others'
};

function getCategoryDisplayName(category) {
  return CATEGORY_DISPLAY_NAMES[category] || category;
}

async function classifyImage(input) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Starting AI image classification...');
    
    // Get image input
    let imageInput = typeof input === 'string' ? input : (input.imageBase64 || input.imageUrl);
    if (!imageInput) throw new Error('No image provided');
    
    // Ensure proper data URI format
    let imageDataUri = imageInput;
    if (!imageInput.startsWith('data:') && !imageInput.startsWith('http')) {
      imageDataUri = `data:image/jpeg;base64,${imageInput}`;
    }
    
    // Log image size
    if (imageInput.startsWith('data:')) {
      const base64Data = imageInput.split(',')[1];
      const sizeKB = Math.round(base64Data.length * 0.75 / 1024);
      console.log(`   Image size: ~${sizeKB}KB`);
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.log('   ⚠️ GROQ_API_KEY not set');
      return getSmartFallback(startTime);
    }

    console.log('🤖 Calling Groq Vision AI (Llama 4 Scout)...');
    
    // Initialize Groq client
    const groq = new Groq({ apiKey: groqApiKey });
    
    // Classification prompt
    const prompt = `Analyze this image and classify it as a civic/municipal issue. 

Categories:
- pothole: Road holes/damage
- garbage: Trash, litter, waste
- streetlight: Broken street lights
- graffiti: Vandalism, wall paintings
- road_damage: Road cracks, erosion
- water_leak: Water leaks, flooding
- sewage: Drainage/sewage issues
- illegal_parking: Illegally parked vehicles
- air_pollution: Smoke, emissions, factory pollution
- encroachment: Illegal constructions
- traffic_signal: Broken traffic signals
- sidewalk: Damaged sidewalks
- tree_hazard: Fallen/dangerous trees
- others: Other issues

Respond ONLY with valid JSON:
{"category":"category_name","confidence":85,"description":"Brief description of issue","severity":"medium"}

severity must be: low, medium, high, or critical`;

    // Call Groq Vision API
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUri } }
          ]
        }
      ],
      temperature: 0.2,
      max_completion_tokens: 200,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('   AI Response:', responseText);
    
    // Parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid AI response format');
      }
    }
    
    // Validate and normalize
    const category = CIVIC_CATEGORIES.includes(result.category) ? result.category : 'others';
    const confidence = Math.min(95, Math.max(50, parseInt(result.confidence) || 75));
    const severity = ['low', 'medium', 'high', 'critical'].includes(result.severity) ? result.severity : 'medium';
    const description = result.description || 'Civic issue detected';
    
    const analysisTime = Date.now() - startTime;
    
    console.log(`✅ AI Classification complete in ${analysisTime}ms`);
    console.log(`   Category: ${category} (${confidence}%)`);
    console.log(`   Description: ${description}`);
    console.log(`   Severity: ${severity}`);

    return {
      success: true,
      type: category,
      confidence: confidence,
      displayName: getCategoryDisplayName(category),
      severity: severity,
      aiDescription: description,
      alternatives: getRelatedCategories(category),
      analysisTime,
      modelVersion: 'groq-llama4-scout',
      analysis: {
        primaryCategory: category,
        description: description,
        severityLevel: severity,
        confidenceLevel: confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'
      }
    };

  } catch (error) {
    console.error('❌ AI Error:', error.message);
    return getSmartFallback(Date.now() - startTime, error.message);
  }
}

function getSmartFallback(analysisTime, errorMsg = '') {
  return {
    success: true,
    type: 'others',
    confidence: 50,
    displayName: 'Select Category',
    severity: 'medium',
    aiDescription: errorMsg 
      ? 'AI temporarily unavailable. Please select category manually.'
      : 'Please select the appropriate category.',
    alternatives: ['garbage', 'pothole', 'road_damage', 'streetlight', 'water_leak', 'air_pollution'],
    analysisTime: typeof analysisTime === 'number' ? analysisTime : 0,
    modelVersion: 'fallback',
    analysis: {
      primaryCategory: 'others',
      description: 'Manual selection',
      severityLevel: 'medium',
      confidenceLevel: 'low'
    }
  };
}

function getRelatedCategories(primary) {
  const related = {
    'pothole': ['road_damage', 'sidewalk'],
    'garbage': ['sewage', 'air_pollution'],
    'streetlight': ['traffic_signal'],
    'road_damage': ['pothole', 'sidewalk'],
    'water_leak': ['sewage'],
    'sewage': ['water_leak', 'garbage'],
    'air_pollution': ['garbage', 'encroachment'],
    'traffic_signal': ['streetlight'],
    'sidewalk': ['road_damage', 'pothole'],
    'tree_hazard': ['sidewalk', 'road_damage'],
    'graffiti': ['encroachment'],
    'illegal_parking': ['encroachment'],
    'encroachment': ['illegal_parking'],
    'others': ['garbage', 'road_damage', 'streetlight']
  };
  return related[primary] || ['others'];
}

function getCategories() {
  return CIVIC_CATEGORIES.map(cat => ({
    id: cat,
    name: getCategoryDisplayName(cat),
    description: CATEGORY_DESCRIPTIONS[cat] || ''
  }));
}

module.exports = {
  classifyImage,
  getCategories,
  CIVIC_CATEGORIES,
  CATEGORY_DESCRIPTIONS
};
