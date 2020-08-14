const { InvalidParamsError, RPCResponse } = require("../utils/jsonrpc");

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

module.exports = (req, res, next, id, [email]) => {
  if (!validateEmail(email)) {
    const error = new InvalidParamsError();
    const response = new RPCResponse({
      id,
      error,
    });

    return res.json(response).status(400);
  }
};
