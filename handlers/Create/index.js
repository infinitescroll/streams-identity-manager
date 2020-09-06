const CeramicClient = require("@ceramicnetwork/ceramic-http-client").default;
const IdentityWallet = require("identity-wallet").default;
const crypto = require("crypto");

const { createJWT } = require("../../utils/jwt-helpers");
const { InvalidParamsError, RPCResponse } = require("../../utils/jsonrpc");
const { getPermission } = require("./getPermission");
const { createUserEntryInDB, updateUserEntryInDBWithDID } = require("./db");

const { SUPER_SECRET_SECRET } = require("../../constants");

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const getSeed = (email) => {
  const valsToHash = [SUPER_SECRET_SECRET, email];
  const hash = crypto.createHash("sha256");
  valsToHash.forEach((val) => hash.update(val, "utf8"));

  return `0x${hash.digest("hex")}`;
};

const asyncronouslyCreateUser = async (email, db) => {
  // after sending back a JWT to the client, we go ahead and send a confirmation to the user to authenticate
  const ceramic = new CeramicClient();
  const seed = getSeed(email);
  const idWallet = await IdentityWallet.create({
    seed,
    getPermission: () => getPermission(email, db),
  });
  // this call triggers the `getPermission` function
  await ceramic.setDIDProvider(idWallet.getDidProvider());

  const did = ceramic.context.did.id;
  if (did) {
    await updateUserEntryInDBWithDID(ceramic.context.did.id, email, db);
  } else {
    console.log("No DID found on ceramic client, did user confirm email?");
  }
};

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
  // partial JWT doesnt include DID in its claims
  const partialJWT = await createJWT({ email });
  res.status(201).json(new RPCResponse({ id, result: { jwt: partialJWT } }));

  await asyncronouslyCreateUser(email, db);
};
