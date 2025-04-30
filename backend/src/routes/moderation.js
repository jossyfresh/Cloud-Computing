import express from 'express';
import { ModerationService } from '../services/moderationService.js';

const router = express.Router();

/**
 * POST /api/moderate
 * Moderates the provided text content
 */
router.post('/moderate', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text field is required and must be a string'
      });
    }

    const result = await ModerationService.moderateContent(text);
    res.json(result);

  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({
      error: 'Moderation failed',
      message: 'Unable to process content moderation request'
    });
  }
});

export { router as moderationRouter };
