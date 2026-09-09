import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log('Testing Gmail SMTP connection...');

    await transporter.verify();

    console.log('✅ Gmail SMTP connection successful');

    const info = await transporter.sendMail({
      from: `"Bharat Civic Connect" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Bharat Civic Connect - SMTP Test',
      text: 'Gmail SMTP is working correctly.',
      html: `
        <h2>Bharat Civic Connect</h2>
        <p>Gmail SMTP is working correctly.</p>
        <p>This is a test email from the Government Grievance Portal.</p>
      `,
    });

    console.log('✅ Test email sent successfully');
    console.log(`Message ID: ${info.messageId}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Gmail SMTP test failed');
    console.error(error.message);
    process.exit(1);
  }
}

testEmail();
