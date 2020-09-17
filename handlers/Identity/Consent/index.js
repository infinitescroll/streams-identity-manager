const CeramicClient = require("@ceramicnetwork/ceramic-http-client").default;
const IdentityWallet = require("identity-wallet").default;
const { validateOTP } = require("../../../utils/otp");
const getAuthSecret = require("../../../utils/getAuthSecret");
const {
  InternalError,
  InvalidOneTimePassError,
  RPCResponse,
} = require("../../../utils/jsonrpc");
const { updateUserEntryInDBWithDID } = require("../../../db");
const { createJWT } = require("../../../utils/jwt-helpers");
const configureUserDIDWPermissions = require("./configureUserDIDWPermissions");
const { instantiateCeramic } = require("../../../utils/ceramic");

module.exports = async (req, res, next, db, id, [email, otp]) => {
  // this is hardcoded for now, with 1 app
  const appID = "did:3:12345";
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
      const { ceramic, idWallet } = await instantiateCeramic(email);
      const did = idWallet.id;
      await updateUserEntryInDBWithDID(did, email, db);
      const jwt = await createJWT({
        email,
        did,
        appID,
      });
      res.status(201).json(new RPCResponse({ id, result: { jwt, did } }));
      configureUserDIDWPermissions(ceramic, appID);
    } catch (err) {
      next(err);
    }
  } else {
    res
      .status(403)
      .json(new RPCResponse({ id, error: new InvalidOneTimePassError() }));
  }
};
