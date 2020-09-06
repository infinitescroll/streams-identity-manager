const DB_POLL_INTERVAL = process.env.DB_POLL_INTERVAL || 1000;
const EMAIL_CONFIRMATION_MAX_WAIT =
  process.env.EMAIL_CONFIRMATION_MAX_WAIT || 100000;
const SUPER_SECRET_SECRET = process.env.SUPER_SECRET_SECRET || "xxxyyyzzz";
const SHOULD_SEND_EMAIL = process.env.SHOULD_SEND_EMAIL || false;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASS = process.env.EMAIL_PASS;

const STREAMS_DID_EMAIL_DB =
  process.env.STREAMS_DID_EMAIL_DB || "streams-did-mappings";
const OTP_DB = process.env.OTP_DB || "otp-db";

module.exports = {
  DB_POLL_INTERVAL,
  EMAIL_ADDRESS,
  EMAIL_CONFIRMATION_MAX_WAIT,
  EMAIL_PASS,
  OTP_DB,
  SUPER_SECRET_SECRET,
  SHOULD_SEND_EMAIL,
  STREAMS_DID_EMAIL_DB,
};
