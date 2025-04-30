import express from 'express';
import { ModerationService } from '../services/moderationService.js';
import { DbService } from '../services/dbService.js';

const router = express.Router();

/**
 * POST /api/posts
 * Create a new post with automatic moderation
 */
router.post('/posts', async (req, res) => {
  try {
    const { text, author } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text field is required and must be a string'
      });
    }

    // Moderate the content before posting
    const moderationResult = await ModerationService.moderateContent(text);

    if (moderationResult.flagged) {
      return res.status(400).json({
        error: 'Content flagged',
        ...moderationResult
      });
    }

    // Store the post if it passes moderation
    const post = await DbService.createPost({
      text,
      author: author || 'Anonymous',
      moderationResult
    });

    res.status(201).json(post);

  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({
      error: 'Failed to create post',
      message: 'Unable to process post creation request'
    });
  }
});

/**
 * GET /api/posts
 * Retrieve all approved posts
 */
router.get('/posts', async (req, res) => {
  try {
    const posts = await DbService.getPosts({ 'moderationResult.flagged': false });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      error: 'Failed to fetch posts',
      message: 'Unable to retrieve posts'
    });
  }
});

/**
 * GET /api/moderation/stats
 * Get moderation statistics
 */
router.get('/moderation/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await DbService.getModerationStats(days);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({
      error: 'Failed to fetch moderation stats',
      message: 'Unable to retrieve moderation statistics'
    });
  }
});

export { router as postRouter };
