const IPFS_URL = process.env.IPFS_URL || "http://127.0.0.1:5001";
const DB_POLL_INTERVAL = process.env.DB_POLL_INTERVAL || 1000;
const EMAIL_CONFIRMATION_MAX_WAIT =
  process.env.EMAIL_CONFIRMATION_MAX_WAIT || 10000;
const SUPER_SECRET_SECRET = process.env.SUPER_SECRET_SECRET || "xxxyyyzzz";
const SHOULD_SEND_EMAIL = process.env.SHOULD_SEND_EMAIL || false;

module.exports = {
  IPFS_URL,
  DB_POLL_INTERVAL,
  EMAIL_CONFIRMATION_MAX_WAIT,
  SUPER_SECRET_SECRET,
  SHOULD_SEND_EMAIL,
};
