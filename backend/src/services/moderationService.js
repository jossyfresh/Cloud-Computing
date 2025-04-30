/**
 * Content moderation service using OpenAI's Moderation API
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class ModerationService {
  /**
   * Moderates content using OpenAI's Moderation API
   * @param {string} text - Content to moderate
   * @returns {Promise<Object>} Moderation result
   */
  static async moderateContent(text) {
    try {
      const response = await openai.moderations.create({ input: text });
      const result = response.results[0];

      if (result.flagged) {
        // Find the categories that were flagged
        const flaggedCategories = Object.entries(result.categories)
          .filter(([_, value]) => value)
          .map(([category]) => category);

        return {
          flagged: true,
          reason: `Content flagged for: ${flaggedCategories.join(', ')}`,
          severity: this.calculateSeverity(result.category_scores),
          confidence: Math.max(...Object.values(result.category_scores)),
          categories: result.categories,
          categoryScores: result.category_scores
        };
      }

      return {
        flagged: false,
        reason: null,
        severity: 'low',
        confidence: 1 - Math.max(...Object.values(result.category_scores)),
        categories: result.categories,
        categoryScores: result.category_scores
      };
    } catch (error) {
      console.error('OpenAI Moderation API Error:', error);
      // Fallback to basic word filtering if API fails
      return this.basicModeration(text);
    }
  }

  /**
   * Calculate severity based on category scores
   * @param {Object} scores - Category scores from OpenAI
   * @returns {string} Severity level
   */
  static calculateSeverity(scores) {
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0.8) return 'high';
    if (maxScore > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Basic fallback moderation using word filtering
   * @param {string} text - Content to moderate
   * @returns {Object} Moderation result
   */
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
        categories: { hate: foundWords.length > 0 },
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
