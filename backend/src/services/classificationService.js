// backend/src/services/classificationService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const DOCTOR_CATEGORIES = {
  'General Physician': ['fever', 'cold', 'cough', 'weakness', 'fatigue', 'general', 'basic', 'headache', 'body pain', 'flu'],
  'Cardiologist': ['ecg', 'chest pain', 'blood pressure', 'hypertension', 'heart', 'cardiac', 'cholesterol', 'palpitations'],
  'Dermatologist': ['skin', 'rash', 'allergy', 'hair', 'dermatitis', 'acne', 'eczema', 'psoriasis', 'infection'],
  'Orthopedic': ['bone', 'joint pain', 'fracture', 'x-ray', 'back pain', 'knee pain', 'arthritis', 'spine', 'muscle'],
  'Neurologist': ['brain', 'headache', 'migraine', 'seizure', 'neurology', 'nerve', 'dizziness', 'stroke', 'memory'],
  'Gynecologist': ['pregnancy', 'menstrual', 'gynecology', 'obstetrics', 'uterus', 'ovary', 'womens health'],
  'Pediatrician': ['child', 'baby', 'infant', 'pediatric', 'vaccination', 'growth', 'development'],
  'ENT Specialist': ['ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsils', 'voice'],
  'Diabetologist': ['diabetes', 'blood sugar', 'insulin', 'glucose', 'hyperglycemia']
};

export class ClassificationService {
  constructor() {
    this.useGemini = process.env.USE_GEMINI === 'true' && process.env.GEMINI_API_KEY;
    if (this.useGemini) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async classifyReport(transcript, symptoms = '') {
    const textToAnalyze = `${symptoms}\n${transcript}`.toLowerCase();
    
    if (this.useGemini) {
      try {
        return await this.classifyWithGemini(textToAnalyze);
      } catch (error) {
        console.error('Gemini failed, using fallback:', error);
        return this.classifyWithRules(textToAnalyze);
      }
    }
    
    return this.classifyWithRules(textToAnalyze);
  }

  async classifyWithGemini(text) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze this medical report text and return ONLY a JSON object with doctor category routing. Do NOT diagnose or recommend treatment.

Text: "${text.substring(0, 3000)}"

Return JSON:
{
  "suggestedCategory": "one of: General Physician, Cardiologist, Dermatologist, Orthopedic, Neurologist, Gynecologist, Pediatrician, ENT Specialist, Diabetologist",
  "confidence": 0.0-1.0,
  "urgency": "LOW/MEDIUM/HIGH/CRITICAL",
  "reason": "brief reason for assignment",
  "keywords": ["key", "medical", "terms"],
  "manualReviewRequired": false
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return this.classifyWithRules(text);
  }

  classifyWithRules(text) {
    let bestMatch = {
      category: 'General Physician',
      confidence: 0,
      keywords: [],
      reason: ''
    };

    for (const [category, keywords] of Object.entries(DOCTOR_CATEGORIES)) {
      const matchedKeywords = keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > bestMatch.keywords.length) {
        bestMatch = {
          category,
          confidence: Math.min(0.9, matchedKeywords.length / keywords.length),
          keywords: matchedKeywords,
          reason: `Matched keywords: ${matchedKeywords.join(', ')}`
        };
      }
    }

    // Determine urgency
    let urgency = 'MEDIUM';
    if (text.includes('emergency') || text.includes('critical') || text.includes('severe')) {
      urgency = 'CRITICAL';
    } else if (text.includes('urgent') || text.includes('immediate')) {
      urgency = 'HIGH';
    } else if (text.includes('routine') || text.includes('checkup')) {
      urgency = 'LOW';
    }

    return {
      suggestedCategory: bestMatch.category,
      confidence: bestMatch.confidence || 0.5,
      urgency,
      reason: bestMatch.reason || 'General symptoms detected',
      keywords: bestMatch.keywords,
      manualReviewRequired: bestMatch.confidence < 0.6
    };
  }
}

export default new ClassificationService();