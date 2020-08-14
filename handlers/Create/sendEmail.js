const { SHOULD_SEND_EMAIL } = require("../../constants");

module.exports = () => {
  if (!SHOULD_SEND_EMAIL) return false;
  // send the email
};
