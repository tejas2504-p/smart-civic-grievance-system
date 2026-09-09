import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = process.env.TEST_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER; 

async function testSMS() {
  console.log('--- Twilio SMS Test ---');
  if (!accountSid || !authToken || !fromNumber) {
    console.error('❌ Twilio credentials are missing in .env');
    console.error('Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set.');
    process.exit(1);
  }

  if (!toNumber) {
    console.error('❌ No destination phone number provided.');
    console.error('Please set TEST_PHONE_NUMBER in your .env file to a verified Twilio number.');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);

  try {
    console.log(`Connecting to Twilio to send test SMS to ${toNumber}...`);
    const message = await client.messages.create({
      body: 'Bharat Civic Connect test message: Your Twilio SMS integration is working securely!',
      from: fromNumber,
      to: toNumber
    });
    
    console.log('✅ Twilio SMS connection successful');
    console.log('✅ Test SMS dispatched successfully');
    console.log(`Message SID: ${message.sid}`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Twilio SMS test failed');
    console.error(error.message);
    
    // Check for common trial errors
    if (error.code === 21608) {
      console.error('\n⚠️ Note: You are using a Twilio Trial account. You can only send SMS to VERIFIED numbers.');
      console.error('Verify the destination number in your Twilio console, or upgrade your account.');
    }
    
    process.exit(1);
  }
}

testSMS();
