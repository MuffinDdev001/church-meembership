const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchRecipients, processCommunication } = require('../services/communicationService');

const broadcastMessage = async (req, res) => {
  try {
    const { type, content, audience, groupId, scheduledAt } = req.body;
    const senderId = req.user.id; // Assumes requireAuth middleware is used

    // 1. Fetch Recipients
    const members = await fetchRecipients(audience, groupId);
    if (!members.length) {
      return res.status(400).json({ error: 'No recipients found for the selected audience.' });
    }

    // 2. Create Log
    const log = await prisma.communicationLog.create({
      data: {
        senderId,
        type,
        content,
        audience,
        groupId,
        status: 'PENDING',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        recipients: {
          create: members.map(member => ({
            memberId: member.id,
            phoneNumber: member.cellPhone,
            status: 'PENDING'
          }))
        }
      }
    });

    // 3. Process immediately if not scheduled for future
    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      // Async process
      processCommunication(log.id).catch(console.error);
    }

    res.status(201).json({ 
      message: 'Broadcast initiated successfully',
      logId: log.id,
      recipientCount: members.length 
    });
  } catch (error) {
    console.error('Error in broadcastMessage:', error);
    res.status(500).json({ error: 'Failed to initiate broadcast' });
  }
};

const getCommunicationHistory = async (req, res) => {
  try {
    const logs = await prisma.communicationLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { name: true, username: true } },
        group: { select: { name: true } },
        _count: { select: { recipients: true } }
      }
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

const getCommunicationRecipients = async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    const recipients = await prisma.communicationRecipient.findMany({
      where: { communicationLogId: logId },
      include: {
        member: { select: { firstName: true, lastName: true, cellPhone: true } }
      }
    });
    res.json(recipients);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
};

const twilioWebhook = async (req, res) => {
  try {
    // Twilio sends MessageStatus and MessageSid
    const { MessageSid, MessageStatus } = req.body;
    
    if (MessageSid && MessageStatus) {
      await prisma.communicationRecipient.updateMany({
        where: { externalId: MessageSid },
        data: { status: MessageStatus.toUpperCase() }
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in twilio webhook:', error);
    res.status(500).send('Error');
  }
};

module.exports = {
  broadcastMessage,
  getCommunicationHistory,
  getCommunicationRecipients,
  twilioWebhook
};
