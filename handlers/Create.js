/**
 *
 * @param {Array} params
 *
 */

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

module.exports = (req, res, next, [email]) => {
  if (!validateEmail(email)) {
  }
  const response = new RPCResponse({
    id,
    response: email,
  });

  res.json({ yo: "hi" });
};
