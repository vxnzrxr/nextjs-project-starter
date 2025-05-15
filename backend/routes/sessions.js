const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// In-memory sessions store (replace with database in production)
const sessions = [];

// GET /api/sessions - Get all sessions
router.get('/', authMiddleware, (req, res, next) => {
  try {
    // Filter sessions based on user role
    let userSessions;
    if (req.user.role === 'mentor') {
      userSessions = sessions.filter(session => session.mentorId === req.user.id);
    } else {
      userSessions = sessions.filter(session => session.menteeId === req.user.id);
    }

    res.json({
      sessions: userSessions.map(session => ({
        ...session,
        password: undefined // Remove password from response
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id - Get specific session
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const session = sessions.find(s => s.id === req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if user has access to this session
    if (session.mentorId !== req.user.id && session.menteeId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({
      session: {
        ...session,
        password: undefined // Remove password from response
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions - Create new session
router.post('/', authMiddleware, (req, res, next) => {
  try {
    const { title, description, menteeId, scheduledDate } = req.body;

    // Validate input
    if (!title || !description || !menteeId || !scheduledDate) {
      return res.status(400).json({
        message: 'Title, description, mentee ID, and scheduled date are required.'
      });
    }

    // Ensure creator is a mentor
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        message: 'Only mentors can create sessions.'
      });
    }

    const newSession = {
      id: Date.now().toString(),
      title,
      description,
      mentorId: req.user.id,
      menteeId,
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    sessions.push(newSession);

    res.status(201).json({
      message: 'Session created successfully',
      session: newSession
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sessions/:id - Update session
router.put('/:id', authMiddleware, (req, res, next) => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === req.params.id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    const session = sessions[sessionIndex];

    // Check if user has permission to update
    if (session.mentorId !== req.user.id) {
      return res.status(403).json({ message: 'Only the mentor can update the session.' });
    }

    const { title, description, scheduledDate, status } = req.body;

    // Update session
    sessions[sessionIndex] = {
      ...session,
      title: title || session.title,
      description: description || session.description,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : session.scheduledDate,
      status: status || session.status,
      updatedAt: new Date()
    };

    res.json({
      message: 'Session updated successfully',
      session: sessions[sessionIndex]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === req.params.id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if user has permission to delete
    if (sessions[sessionIndex].mentorId !== req.user.id) {
      return res.status(403).json({ message: 'Only the mentor can delete the session.' });
    }

    // Remove session
    sessions.splice(sessionIndex, 1);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
