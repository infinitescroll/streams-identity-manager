const crypto = require("crypto");
const level = require("level");
const { OTP_DB, OTP_SECRET } = require("../constants");

// none of this is compat with google authenticator...
const generateSecret = () => crypto.randomBytes(32).toString("hex");
const generateCode = (secret) => {
  const valsToHash = [OTP_SECRET, secret];
  const hash = crypto.createHash("sha256");
  valsToHash.forEach((val) => hash.update(val, "utf8"));

  const digest = hash.digest("hex");
  return digest.slice(0, 6);
};

const validateCode = (code, secret) => code === generateCode(secret);

const createOTP = async (email) => {
  const secret = generateSecret();
  const otp = generateCode(secret);

  const objToStore = { secret, time: Date.now() };
  const db = level(OTP_DB);
  await db.put(`OTP:email:${email}`, JSON.stringify(objToStore));
  await db.close();
  return { otp, secret };
};

const validateOTP = async (email, otp) => {
  const db = level(OTP_DB);
  try {
    const v = await db.get(`OTP:email:${email}`);
    if (v) {
      await db.del(`OTP:email:${email}`);
      await db.close();
      const { secret, time } = JSON.parse(v);
      // TODO: validate time...
      return validateCode(otp, secret);
    }
    return false;
  } catch (err) {
    return false;
  } finally {
    await db.close();
  }
};

module.exports = {
  createOTP,
  validateOTP,
};
