const express = require("express");
const router = express.Router();
const Ceramic = require("@ceramicnetwork/ceramic-core").default;
const IdentityWallet = require("identity-wallet");
const IpfsHttpClient = require("ipfs-http-client");
const crypto = require("crypto");
const level = require("level");

const IPFS_URL = process.env.IPFS_URL || "http://127.0.0.1:5001";

router.get("/", (_, res) => {
  res.send("OWL");
});

const getNewSeed = () => `0x${crypto.randomBytes(32).toString("hex")}`;

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const getConsent = (ceramicReq, expressReq) =>
  new Promise((resolve, reject) => {
    console.log("GETTING CONSENT", ceramicReq);
    // im not sure why this would ever happen on the create-user request
    if (expressReq.headers["Authorization"]) {
      // jwt validation goes here
      resolve(true);
    } else {
      // email validation goes here
      resolve(true);
    }
  });

// this is pretty tightly coupled with email auth for now...
router.post("/create-user", async (expressReq, res) => {
  const db = level("streams-did-mappings");
  const { email } = expressReq.body;
  if (!validateEmail(email)) res.send("Error").status(404);
  db.get(`email:${email}`, async (err, did) => {
    if (!err instanceof level.errors.NotFoundError) {
      // send and validate a consent email
      // upon consent, issue JWT
      res.send("User already exists").status(201);
    }
    const ipfs = IpfsHttpClient({ url: IPFS_URL });

    const ceramicConfig = {
      stateStorePath: "./ceramic.lvl",
    };
    const ceramic = await Ceramic.create(ipfs, { ...ceramicConfig });

    const seed = getNewSeed();
    // some funny req scoping concepts at play here...
    const idWallet = new IdentityWallet(
      (ceramicReq) => getConsent(ceramicReq, expressReq),
      {
        seed,
      }
    );
    // this doc needs to be filled in properly
    // waiting on OED's IDX package spec
    const did = await ceramic.createDocument("3id", {
      // ?
      content: {},
      // should be the management key of the seed generated for the ID wallet
      owners: [],
    });

    // create a mapping to this DID from the email address
    await db.put(`email:${email}`, did.id);

    // this call triggers the `getConsent` function
    await ceramic.setDIDProvider(idWallet.get3idProvider());

    res.send("OWL").status(201);
  });
});

module.exports = router;
