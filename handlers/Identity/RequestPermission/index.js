const { createJWT } = require("../../../utils/jwt-helpers");
const { createOTP } = require("../../../utils/otp");
const validateEmail = require("../../../utils/validateEmail");
const sendEmail = require("./sendEmail");
const { InvalidParamsError, RPCResponse } = require("../../../utils/jsonrpc");
const { createUserEntryInDB } = require("../../../db");

module.exports = async (_, res, __, db, id, [email]) => {
  if (!validateEmail(email)) {
    const error = new InvalidParamsError();
    const response = new RPCResponse({
      id,
      error,
    });

    return res.status(400).json(response);
  }
  await createUserEntryInDB(email, db);
  const { otp } = await createOTP(email);
  sendEmail(email, otp);
  // partial JWT doesnt include DID in its claims
  const partialJWT = await createJWT({ email });
  res.status(201).json(new RPCResponse({ id, result: { jwt: partialJWT } }));
};
