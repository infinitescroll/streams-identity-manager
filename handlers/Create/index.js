const Ceramic = require("@ceramicnetwork/ceramic-core").default;
const IdentityWallet = require("identity-wallet");
const IpfsHttpClient = require("ipfs-http-client");
const crypto = require("crypto");
const level = require("level");

const { createJWT } = require("../../utils/jwt-helpers");
const { InvalidParamsError, RPCResponse } = require("../../utils/jsonrpc");
const { getConsent } = require("./getConsent");
const { createUserEntryInDB, updateUserEntryInDBWithDID } = require("./db");
const sendEmail = require("./sendEmail");

const { IPFS_URL, SUPER_SECRET_SECRET } = require("../../constants");

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

const createDID = async (ceramicInstance) => {
  return ceramicInstance.context.user._did;
};

module.exports = async (req, res, _, id, [email]) => {
  if (!validateEmail(email)) {
    const error = new InvalidParamsError();
    const response = new RPCResponse({
      id,
      error,
    });

    return res.json(response).status(400);
  }

  const db = level("streams-did-mappings");
  const ipfs = IpfsHttpClient({ url: IPFS_URL });
  const ceramic = await Ceramic.create(ipfs, {
    // this might cause issues
    // we may need to create a separate stateStorePath for each user
    stateStorePath: "./ceramic.lvl",
  });

  const seed = getSeed(email);
  const idWallet = new IdentityWallet(
    (ceramicReq) => getConsent(ceramicReq, req, email, db),
    {
      seed,
    }
  );

  try {
    await createUserEntryInDB(email, db);
    sendEmail(email);
    // this call triggers the `getConsent` function
    await ceramic.setDIDProvider(idWallet.get3idProvider());
    // this `createDID` func will done automatically by Identity Wallet in the background
    // so we should be able to delete this function call in future identity wallet versions
    const did = await createDID(ceramic);
    await updateUserEntryInDBWithDID(did, email, db);

    const jwt = await createJWT({ email, id: did });
    res.send(jwt).status(201);
    db.close();
  } catch (err) {
    res.send(err.message).status(500);
    db.close();
  }
};
