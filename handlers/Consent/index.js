const CeramicClient = require("@ceramicnetwork/ceramic-http-client").default;
const IdentityWallet = require("identity-wallet").default;
const { validateOTP } = require("../../utils/otp");
const getSeedFromEmail = require("../../utils/getSeedFromEmail");
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
      const seed = getSeedFromEmail(email);
      const idWallet = await IdentityWallet.create({
        seed,
        getPermission: async () => true,
      });
      const ceramic = new CeramicClient();
      await ceramic.setDIDProvider(idWallet.getDidProvider());
      const did = ceramic.context.did.id;
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
