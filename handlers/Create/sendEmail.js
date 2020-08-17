const nodemailer = require("nodemailer");
const { EMAIL_ADDRESS, EMAIL_PASS } = require("../../constants");

module.exports = async (to, code) => {
  // this is insecuure
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    to,
    subject: "Streams Identity Manager",
    text:
      "Give Streams Identity Manager consent to sign on behalf of your identity",
    html: `
      <div>
        Please use the following code to give the Streams Identity Manager consent to create and manage a decentralized identity on your behalf:
        <p>${code}</p>
      </div>`,
  });

  return info.messageId;
};
