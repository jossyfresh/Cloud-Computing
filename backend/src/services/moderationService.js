/**
 * Content moderation service using TensorFlow.js toxicity model
 */

import * as tf from '@tensorflow/tfjs-node';
import toxicity from '@tensorflow-models/toxicity';

let modelPromise = null;
const THRESHOLD = 0.9; // Confidence threshold for predictions

export class ModerationService {
  /**
   * Load the toxicity model if not already loaded
   */
  static async loadModel() {
    if (!modelPromise) {
      modelPromise = toxicity.load(THRESHOLD);
    }
    return modelPromise;
  }

  /**
   * Moderates content using the toxicity ML model
   * @param {string} text - Content to moderate
   * @returns {Promise<Object>} Moderation result
   */
  static async moderateContent(text) {
    try {
      const model = await this.loadModel();
      const predictions = await model.classify([text]);

      const flaggedCategories = predictions
        .filter(p => p.results[0].match)
        .map(p => p.label);

      const categoryScores = predictions.reduce((acc, curr) => {
        acc[curr.label] = curr.results[0].probabilities[1]; // Score for toxicity
        return acc;
      }, {});

      if (flaggedCategories.length > 0) {
        return {
          flagged: true,
          reason: `Content flagged for: ${flaggedCategories.join(', ')}`,
          severity: this.calculateSeverity(categoryScores),
          confidence: Math.max(...Object.values(categoryScores)),
          categories: Object.fromEntries(flaggedCategories.map(c => [c, true])),
          categoryScores
        };
      }

      return {
        flagged: false,
        reason: null,
        severity: 'low',
        confidence: 1 - Math.max(...Object.values(categoryScores)),
        categories: Object.fromEntries(predictions.map(p => [p.label, false])),
        categoryScores
      };
    } catch (error) {
      console.error('ML Moderation Error:', error);
      return this.basicModeration(text);
    }
  }

  static calculateSeverity(scores) {
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0.8) return 'high';
    if (maxScore > 0.5) return 'medium';
    return 'low';
  }

  static basicModeration(text) {
    const OFFENSIVE_WORDS = ['hate', 'stupid', 'kill', 'idiot'];
    const lowerText = text.toLowerCase();
    const foundWords = OFFENSIVE_WORDS.filter(word => lowerText.includes(word));

    if (foundWords.length > 0) {
      return {
        flagged: true,
        reason: `Contains offensive word(s): ${foundWords.join(', ')}`,
        severity: 'high',
        confidence: 0.95,
        categories: { hate: true },
        categoryScores: { hate: 0.95 }
      };
    }

    return {
      flagged: false,
      reason: null,
      severity: 'low',
      confidence: 0.8,
      categories: { hate: false },
      categoryScores: { hate: 0.1 }
    };
  }
}
