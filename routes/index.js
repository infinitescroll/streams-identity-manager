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
  const { email } = expressReq.body;
  if (!validateEmail(email)) res.send("Error").status(404);
  const db = level("streams-did-mappings");
  db.get(`email:${email}`, async (err, value) => {
    // some issue with level-db
    if (err && !(err instanceof level.errors.NotFoundError)) {
      return res.send(err.message).status(err.status);
    }

    // user not found
    if (err && err instanceof level.errors.NotFoundError) {
      const ipfs = IpfsHttpClient({ url: IPFS_URL });
      const ceramic = await Ceramic.create(ipfs, {
        stateStorePath: "./ceramic.lvl",
      });

      const seed = getNewSeed();

      // getConsent doesnt matter here, it never gets called
      const idWallet = new IdentityWallet(() => true, {
        seed,
      });

      // this doc needs to be filled in properly
      // waiting on OED's IDX package spec
      const did = await ceramic.createDocument("3id", {
        // ?
        content: {},
        // should be the management key of the seed generated for the ID wallet
        owners: [],
      });

      try {
        // create a mapping to this DID from the email address
        await db.put(`email:${email}`, JSON.stringify({ id: did.id, seed }));
      } catch (err) {
        return res.send(err.message).status(err.status);
      }

      return res.send(did.id).status(201);
    } else {
      return res.send(JSON.parse(value).id).status(201);
    }
  });

  await db.close();
});

// The AUTH handlers here should **ALWAYS** return a JWT,
// regardless of the underlying strategy

router.post("/get-permission-via-email", async (req, res) => {
  const { email } = expressReq.body;
  if (!validateEmail(email)) res.send("Error").status(404);
  const db = level("streams-did-mappings");

  db.get(`email:${email}`, async (err, { id, seed }) => {
    // some issue with level-db
    if (err) {
      return res.send(err.message).status(err.status);
    }

    // user already exists, just send back their DID
    if (!id) {
      return res.send(`User with email ${email} not found`).status(404);
    }

    const ipfs = IpfsHttpClient({ url: IPFS_URL });
    const ceramic = await Ceramic.create(ipfs);

    const idWallet = new IdentityWallet(
      (ceramicReq) => getConsent(ceramicReq, expressReq),
      {
        seed,
      }
    );

    try {
      // this call triggers the `getConsent` function
      await ceramic.setDIDProvider(idWallet.get3idProvider());
      res.send(did.id).status(201);
    } catch (err) {
      res.send(err.message).status(err.code);
    }
  });
});

// helper method for dev
router.delete("/user", async (req, res) => {});

module.exports = router;
