const { authenticator } = require("otplib");
const level = require("level");
const { OTP_DB } = require("../constants");

const createOTP = async (email) => {
  const secret = authenticator.generateSecret();
  const otp = authenticator.generate(secret);

  const objToStore = { secret, time: Date.now() };
  const db = level(OTP_DB);
  await db.put(`OTP:email:${email}`, JSON.stringify(objToStore));
  db.close();
  return otp;
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
      return authenticator.check(otp, secret);
    }
    await db.close();
    return false;
  } finally {
    db.close();
  }
};

module.exports = {
  createOTP,
  validateOTP,
};
