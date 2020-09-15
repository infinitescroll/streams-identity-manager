const CeramicClient = require("@ceramicnetwork/ceramic-http-client").default;
const IdentityWallet = require("identity-wallet").default;
const { validateOTP } = require("../../utils/otp");
const getAuthSecret = require("../../utils/getAuthSecret");
const {
  InternalError,
  InvalidOneTimePassError,
  RPCResponse,
} = require("../../utils/jsonrpc");
const { updateUserEntryInDBWithDID } = require("../../db");
const { createJWT } = require("../../utils/jwt-helpers");
const configureUserDIDWPermissions = require("./configureUserDIDWPermissions");

module.exports = async (req, res, __, db, id, [email, otp]) => {
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
      const authSecret = getAuthSecret(email);
      const ceramic = new CeramicClient();
      const idWallet = await IdentityWallet.create({
        authId: email,
        authSecret,
        getPermission: () => Promise.resolve([]),
        ceramic,
      });
      ceramic.setDIDProvider(idWallet.getDidProvider());
      const did = idWallet.DID;
      await updateUserEntryInDBWithDID(did, email, db);
      const jwt = await createJWT({ email, did });
      res.status(201).json(new RPCResponse({ id, result: { jwt, did } }));
      configureUserDIDWPermissions(ceramic);
    } catch (err) {
      // TODO: pass error messages to client
      res.status(500).json(new RPCResponse({ id, error: new InternalError() }));
    }
  } else {
    res
      .status(403)
      .json(new RPCResponse({ id, error: new InvalidOneTimePassError() }));
  }
};
