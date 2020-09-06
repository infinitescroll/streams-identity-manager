const { DID } = require("dids");
const IdentityWallet = require("identity-wallet").default;
const { validateOTP } = require("../../utils/otp");
const getSeedFromEmail = require("../../utils/getSeedFromEmail");
const {
  InternalError,
  InvalidOneTimePassError,
  RPCResponse,
} = require("../../utils/jsonrpc");
const { updateUserEntryInDBWithDID } = require("../Create/db");
const { createJWT } = require("../../utils/jwt-helpers");

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
      const provider = idWallet.getDidProvider();

      const did = new DID({ provider });
      await did.authenticate();
      if (did.id) {
        await updateUserEntryInDBWithDID(did.id, email, db);
        const jwt = createJWT({ email, did: did.id });
        res
          .status(201)
          .json(new RPCResponse({ id, result: { jwt, did: did.id } }));
      } else {
        res
          .status(500)
          .json(new RPCResponse({ id, error: new InternalError() }));
      }
    } catch (err) {
      res.status(500).json(new RPCResponse({ id, error: new InternalError() }));
    }
  } else {
    res
      .status(403)
      .json(new RPCResponse({ id, error: new InvalidOneTimePassError() }));
  }
};
