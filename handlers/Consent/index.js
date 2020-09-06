const { validateOTP } = require("../../utils/otp");
const {
  InternalError,
  InvalidOneTimePassError,
  RPCResponse,
} = require("../../utils/jsonrpc");

module.exports = async (_, res, __, db, id, [email, otp]) => {
  const partialJWTClaimsThisEmail = req.user.email === email;
  let validOTP = false;
  try {
    validOTP = await validateOTP(email, otp);
  } catch (err) {
    res
      .status(400)
      .json(new RPCResponse({ id, error: new InvalidOneTimePassError() }));
    return;
  }

  if (validOTP && partialJWTClaimsThisEmail) {
    try {
      const user = JSON.parse(await db.get(`email:${email}`));
      await db.put(`email:${email}`, JSON.stringify({ ...user, auth: true }));
      res.status(201).json(new RPCResponse({ id, result: "" }));
    } catch (err) {
      res.status(500).json(new RPCResponse({ id, error: new InternalError() }));
    }
  } else {
    res
      .status(403)
      .json(new RPCResponse({ id, error: new InvalidOneTimePassError() }));
  }
};
