const { SendMailClient } = require('zeptomail');
const twilio = require('twilio');

// ZeptoMail Setup
const zeptoUrl = process.env.ZEPTOMAIL_URL || "api.zeptomail.com/";
const zeptoToken = process.env.ZEPTOMAIL_TOKEN;
let zeptoClient = null;

if (zeptoToken) {
  zeptoClient = new SendMailClient({ url: zeptoUrl, token: zeptoToken });
}

// Twilio Setup
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilioAccountSid && twilioAuthToken 
  ? twilio(twilioAccountSid, twilioAuthToken)
  : null;

const sendEmail = async (to, subject, text) => {
  if (!zeptoClient) {
    console.log(`[ZeptoMail Mock] To: ${to} | Subject: ${subject}`);
    console.log(`[ZeptoMail Mock] Body:\n${text}`);
    return;
  }
  
  try {
    await zeptoClient.sendMail({
      from: {
        address: process.env.ZEPTOMAIL_FROM_ADDRESS || 'noreply@yourdomain.com',
        name: process.env.ZEPTOMAIL_FROM_NAME || 'Notification'
      },
      to: [
        {
          email_address: {
            address: to,
            name: to
          }
        }
      ],
      subject: subject,
      textbody: text,
      htmlbody: `<div>${text}</div>`
    });
    console.log(`Email successfully sent to ${to} via ZeptoMail.`);
  } catch (error) {
    console.error('Error sending email via ZeptoMail:', error);
  }
};

const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.log(`[Twilio SMS Mock] To: ${to} | Message: ${message}`);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });
    console.log(`SMS successfully sent to ${to} via Twilio.`);
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
  }
};

module.exports = {
  sendEmail,
  sendSMS,
};
