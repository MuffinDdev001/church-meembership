require('dotenv').config({ path: '../.env' });
const { sendEmail, sendSMS } = require('../services/notificationService');

async function runTests() {
  console.log("=== Testing Notification Service ===\n");

  const testEmail = "akinluaolorunfunminiyi@gmail.com";
  const testPhone = "+12316704794";
  const message = "This is a test notification from the Church Membership app.";

  console.log("1. Testing Email...");
  await sendEmail(testEmail, "Test Email", message);
  console.log("Email test function executed.\n");

  console.log("2. Testing SMS...");
  await sendSMS(testPhone, message);
  console.log("SMS test function executed.\n");

  console.log("=== Tests Complete ===");
  console.log("Note: If SMTP or Twilio credentials are not set in your .env file, these will just output as Mock logs in the console.");
}

runTests();
