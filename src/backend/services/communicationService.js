const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');
const cron = require('node-cron');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Must be Twilio SMS number
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || twilioPhoneNumber; // e.g. "whatsapp:+14155238886"

const twilioClient = twilioAccountSid && twilioAuthToken 
  ? twilio(twilioAccountSid, twilioAuthToken)
  : null;

const fetchRecipients = async (audience, groupId) => {
  let members = [];
  if (audience === 'ALL_MEMBERS') {
    members = await prisma.member.findMany({
      where: { isActive: true, cellPhone: { not: null } },
      select: { id: true, cellPhone: true, firstName: true, lastName: true }
    });
  } else if (audience === 'SPECIFIC_GROUPS' && groupId) {
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        member: {
          select: { id: true, cellPhone: true, firstName: true, lastName: true }
        }
      }
    });
    members = groupMembers.map(gm => gm.member).filter(m => m && m.cellPhone);
  }
  return members;
};

const sendTwilioMessage = async (to, body, type) => {
  if (!twilioClient) {
    console.log(`[Twilio Mock] Type: ${type} | To: ${to} | Body: ${body}`);
    return { sid: `mock_sid_${Date.now()}` };
  }

  const from = type === 'WHATSAPP' 
    ? (twilioWhatsAppNumber.startsWith('whatsapp:') ? twilioWhatsAppNumber : `whatsapp:${twilioWhatsAppNumber}`)
    : twilioPhoneNumber;

  const toFormatted = type === 'WHATSAPP'
    ? (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`)
    : to;

  return await twilioClient.messages.create({
    body,
    from,
    to: toFormatted
  });
};

const processCommunication = async (logId) => {
  try {
    const log = await prisma.communicationLog.findUnique({
      where: { id: logId },
      include: { recipients: true }
    });

    if (!log || log.status !== 'PENDING') return;

    await prisma.communicationLog.update({
      where: { id: logId },
      data: { status: 'PROCESSING' }
    });

    let successCount = 0;
    for (const recipient of log.recipients) {
      if (!recipient.phoneNumber) {
        await prisma.communicationRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', errorMessage: 'No phone number' }
        });
        continue;
      }

      try {
        const twilioRes = await sendTwilioMessage(recipient.phoneNumber, log.content, log.type);
        await prisma.communicationRecipient.update({
          where: { id: recipient.id },
          data: { 
            status: 'SENT', 
            externalId: twilioRes.sid 
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Error sending to ${recipient.phoneNumber}:`, err.message);
        await prisma.communicationRecipient.update({
          where: { id: recipient.id },
          data: { 
            status: 'FAILED', 
            errorMessage: err.message 
          }
        });
      }
    }

    await prisma.communicationLog.update({
      where: { id: logId },
      data: { status: 'COMPLETED' }
    });
    
  } catch (error) {
    console.error(`Failed to process communication ${logId}:`, error);
    await prisma.communicationLog.update({
      where: { id: logId },
      data: { status: 'FAILED' }
    });
  }
};

const initCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const pendingLogs = await prisma.communicationLog.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() }
        }
      });
      for (const log of pendingLogs) {
        await processCommunication(log.id);
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};

module.exports = {
  fetchRecipients,
  processCommunication,
  initCronJobs,
  sendTwilioMessage
};
