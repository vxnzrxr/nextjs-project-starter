const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// In-memory feedback store (replace with database in production)
const feedbacks = [];

// POST /api/feedback - Submit feedback for a session
router.post('/', authMiddleware, (req, res, next) => {
  try {
    const { sessionId, rating, comments } = req.body;

    // Validate input
    if (!sessionId || !rating) {
      return res.status(400).json({
        message: 'Session ID and rating are required.'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5.'
      });
    }

    // Create new feedback
    const newFeedback = {
      id: Date.now().toString(),
      sessionId,
      userId: req.user.id,
      userRole: req.user.role,
      rating,
      comments: comments || '',
      createdAt: new Date()
    };

    feedbacks.push(newFeedback);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback/session/:sessionId - Get feedback for a specific session
router.get('/session/:sessionId', authMiddleware, (req, res, next) => {
  try {
    const sessionFeedbacks = feedbacks.filter(f => f.sessionId === req.params.sessionId);

    res.json({
      feedbacks: sessionFeedbacks
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback/user - Get all feedback for the authenticated user
router.get('/user', authMiddleware, (req, res, next) => {
  try {
    const userFeedbacks = feedbacks.filter(f => f.userId === req.user.id);

    res.json({
      feedbacks: userFeedbacks
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/feedback/:id - Update feedback
router.put('/:id', authMiddleware, (req, res, next) => {
  try {
    const feedbackIndex = feedbacks.findIndex(f => f.id === req.params.id);
    
    if (feedbackIndex === -1) {
      return res.status(404).json({
        message: 'Feedback not found.'
      });
    }

    const feedback = feedbacks[feedbackIndex];

    // Check if user owns the feedback
    if (feedback.userId !== req.user.id) {
      return res.status(403).json({
        message: 'You can only update your own feedback.'
      });
    }

    const { rating, comments } = req.body;

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5.'
      });
    }

    // Update feedback
    feedbacks[feedbackIndex] = {
      ...feedback,
      rating: rating || feedback.rating,
      comments: comments !== undefined ? comments : feedback.comments,
      updatedAt: new Date()
    };

    res.json({
      message: 'Feedback updated successfully',
      feedback: feedbacks[feedbackIndex]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/feedback/:id - Delete feedback
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const feedbackIndex = feedbacks.findIndex(f => f.id === req.params.id);
    
    if (feedbackIndex === -1) {
      return res.status(404).json({
        message: 'Feedback not found.'
      });
    }

    // Check if user owns the feedback
    if (feedbacks[feedbackIndex].userId !== req.user.id) {
      return res.status(403).json({
        message: 'You can only delete your own feedback.'
      });
    }

    // Remove feedback
    feedbacks.splice(feedbackIndex, 1);

    res.json({
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
