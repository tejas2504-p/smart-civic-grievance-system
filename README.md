# 🏛️ Smart Government Grievance Redressal Portal
### Government of Maharashtra · Production-Ready Real-Time Architecture with OTP & CAPTCHA Security

A state-of-the-art digital grievance redressal portal built for Indian citizens and government officers with real-time tracking, MongoDB Atlas cloud storage, WebSockets (Socket.IO), cryptographic dual OTP verification (SMS & Email), and Cloudflare Turnstile human CAPTCHA protection.

---

## 🛡️ Real-Time OTP & CAPTCHA Security System

### 1. Cryptographic OTP Generation & Zero-Plaintext Storage
- **Cryptographically Secure**: OTPs are 6-digit random integers generated using Node.js `crypto.randomInt(100000, 1000000)`.
- **HMAC-SHA256 Hashing**: OTPs are hashed using a secret server salt before being saved to MongoDB. Plaintext OTPs are **never** stored in the database, logged in console outputs, or returned in API / Socket.IO payloads.
- **Timing-Safe Verification**: Submitted OTPs are verified using `crypto.timingSafeEqual` to prevent timing side-channel attacks.
- **5-Minute Expiration**: MongoDB TTL index (`expireAfterSeconds: 0`) automatically deletes expired verification records.
- **Attempt Limit Protection**: Maximum 5 attempts allowed per OTP session. Exceeding 5 attempts immediately destroys the session.

### 2. Dual Channel Verification (SMS & Email)
- **Indian Phone (+91) Support**: Validates 10-digit Indian numbers (`^[6-9]\d{9}$`) and formats to international standard (`+91XXXXXXXXXX`).
- **Modular SMS Service** (`server/services/sms/smsService.js`): Ready for Twilio, Fast2SMS, MSG91, and Indian transactional SMS gateways.
- **Transactional Email Service** (`server/services/email/emailService.js`): Branded government email templates delivered via Nodemailer SMTP.

### 3. Server-Side Cloudflare Turnstile CAPTCHA
- Frontend renders the official Cloudflare Turnstile challenge widget.
- Backend verifies the challenge token directly with Cloudflare API (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) using the server-only `TURNSTILE_SECRET_KEY`.

### 4. Multi-Layer Rate Limiting
- **Send OTP Limiter**: Max 5 requests per 15 minutes per IP.
- **Verify OTP Limiter**: Max 15 attempts per 15 minutes per IP.
- **Resend OTP Limiter**: Max 3 resends per session with enforced 30-45s cooldown.

### 5. Real-Time Socket.IO Synchronization
- Real-time events broadcast session status (`OTP_SENT`, `PHONE_VERIFIED`, `EMAIL_VERIFIED`, `VERIFICATION_COMPLETED`, `OTP_RESENT`) without ever transmitting OTP digits.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Security |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Generate & dispatch SMS + Email OTPs | Rate-limited (5/15m) + CAPTCHA |
| `POST` | `/api/auth/verify-phone-otp` | Verify 6-digit Phone SMS OTP | Rate-limited (15/15m) + Hash check |
| `POST` | `/api/auth/verify-email-otp` | Verify 6-digit Email OTP | Rate-limited (15/15m) + Hash check |
| `POST` | `/api/auth/resend-otp` | Request fresh OTPs with cooldown | Rate-limited (3 resends) |
| `POST` | `/api/auth/register` | Register new citizen account | Requires verified `verificationId` |
| `POST` | `/api/auth/login` | Citizen / Officer / Admin login | Password / Verified OTP + CAPTCHA |
| `POST` | `/api/auth/reset-password` | Update account password | Requires verified `verificationId` |
| `GET`  | `/api/auth/me` | Fetch authenticated user profile | JWT Protected |
| `GET`  | `/api/complaints` | Fetch citizen / department grievances | JWT Protected |
| `POST` | `/api/complaints` | File new grievance with attachments | JWT Protected + Real-time Socket |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_grievance_portal?retryWrites=true&w=majority

# Server & JWT
PORT=5000
JWT_SECRET=your_jwt_secret_key_2026
OTP_HASH_SECRET=your_otp_hmac_secret_salt_2026
VITE_API_URL=http://localhost:5000

# Cloudflare Turnstile CAPTCHA
CAPTCHA_PROVIDER=cloudflare
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# SMS Provider (twilio / fast2sms / msg91)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Transactional Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM="Government Grievance Portal" <noreply@grievance.mh.gov.in>
```

---

## 🚀 Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Frontend Dev Server
```bash
npm run dev
# Running on http://localhost:5173
```

### 3. Start Backend & Real-Time Socket Server
```bash
node server/server.js
# Running on http://localhost:5000 (Connected to MongoDB Atlas)
```

---

## 🧪 Testing Checklist

- [x] **Send OTP**: Enters Phone + Email + solves Turnstile CAPTCHA -> Dispatches real SMS + Email.
- [x] **Invalid CAPTCHA**: Blocks request before generating OTPs.
- [x] **Separate Verification**: Phone and Email OTP inputs verify independently.
- [x] **Expiry & Countdown**: Live MM:SS timer counts down from 5 minutes; rejects expired codes.
- [x] **Attempt Protection**: Locks session after 5 consecutive incorrect attempts.
- [x] **Rate Limiting**: Cooldown timer enforces delay before allowing resend.
- [x] **Registration Completion**: Unlocks only when `CAPTCHA Verified + Phone Verified + Email Verified`.
- [x] **Data Privacy**: No plaintext OTP exposed in frontend console, API payload, or database.
