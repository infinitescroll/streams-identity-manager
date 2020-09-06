const {
  DB_POLL_INTERVAL,
  EMAIL_CONFIRMATION_MAX_WAIT,
  SHOULD_SEND_EMAIL,
} = require("../../constants");
const sendEmail = require("./sendEmail");
const { createOTP } = require("../../utils/otp");

const NO_CONSENT_MSG = "User did not confirm email in time";

// polls DB until the `auth` property returns true
// which means the user successfully gave permission via email
// and the /consent route was called
const userConfirmation = async (email, db) => {
  let totalTime = 0;
  const pollForAuth = () =>
    new Promise((resolve, reject) => {
      setTimeout(async () => {
        totalTime += DB_POLL_INTERVAL;
        const { auth } = JSON.parse(await db.get(`email:${email}`));
        if (auth) return resolve(true);
        if (totalTime < EMAIL_CONFIRMATION_MAX_WAIT) {
          return resolve(pollForAuth());
        } else {
          return reject(new Error("User did not confirm email in time"));
        }
      }, DB_POLL_INTERVAL);
    });
  return pollForAuth();
};

const getConsent = async (email, db) => {
  // if we're in dev mode, just give consent
  if (!SHOULD_SEND_EMAIL) {
    return true;
  } else {
    const oneTimePass = await createOTP(email);
    sendEmail(email, oneTimePass);
    try {
      const userConfirmed = await userConfirmation(email, db);
      return userConfirmed;
    } catch (err) {
      if (err.message === NO_CONSENT_MSG) {
        return false;
      }
      // no consent if error happened?
      return false;
    }
  }
};

module.exports = { getConsent };
