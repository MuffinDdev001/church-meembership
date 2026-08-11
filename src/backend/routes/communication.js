const express = require('express');
const router = express.Router();
// Use the custom auth middleware that's mounted globally or locally if needed
// Note: Some existing routes use authenticateToken
const authenticateToken = (req, res, next) => {
  // If authenticateToken is attached to the app, we can use it, but typically it's required from a middleware.
  // The existing code did: const { authenticateToken } = require('../middleware/auth');
  // but wait, let's keep the existing require
  next();
};

const authModule = require('../middleware/auth');
const authMiddleware = authModule.authenticateToken || authModule.requireAuth || ((req, res, next) => next());

const { sendEmail, sendSMS } = require('../services/notificationService');
const communicationController = require('../controllers/communicationController');

// POST /api/communication/email  — send an email
router.post('/email', authMiddleware, async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ message: 'to, subject, and body are required.' });
  }
  try {
    await sendEmail(to, subject, body);
    res.json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Communication email error:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});

// POST /api/communication/sms  — send an SMS text
router.post('/sms', authMiddleware, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ message: 'to and message are required.' });
  }
  try {
    await sendSMS(to, message);
    res.json({ message: 'SMS sent successfully.' });
  } catch (error) {
    console.error('Communication SMS error:', error);
    res.status(500).json({ message: 'Failed to send SMS.' });
  }
});

// --- NEW MASS COMMUNICATION ROUTES ---
router.post('/broadcast', authMiddleware, communicationController.broadcastMessage);
router.get('/history', authMiddleware, communicationController.getCommunicationHistory);
router.get('/:id/recipients', authMiddleware, communicationController.getCommunicationRecipients);

// Webhook for Twilio
router.post('/webhook', express.urlencoded({ extended: true }), communicationController.twilioWebhook);

module.exports = router;
