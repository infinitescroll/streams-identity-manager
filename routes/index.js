const express = require("express");
const router = express.Router();
const Ceramic = require("@ceramicnetwork/ceramic-core").default;
const IdentityWallet = require("identity-wallet");
const Keyring = require("identity-wallet/lib/keyring");
const IpfsHttpClient = require("ipfs-http-client");
const crypto = require("crypto");
const level = require("level");

const { createJWT } = require("../utils/jwt-helpers");

const IPFS_URL = process.env.IPFS_URL || "http://127.0.0.1:5001";
const DB_POLL_INTERVAL = process.env.DB_POLL_INTERVAL || 1000;
const EMAIL_CONFIRMATION_MAX_WAIT =
  process.env.EMAIL_CONFIRMATION_MAX_WAIT || 10000;

router.get("/", (_, res) => {
  res.send("OWL");
});

const getNewSeed = () => `0x${crypto.randomBytes(32).toString("hex")}`;

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const sendEmail = () => new Promise((resolve) => setTimeout(resolve, 1000));

// this is pretty tightly coupled with email auth for now...
router.post("/create-user", async (expressReq, res) => {
  const { email } = expressReq.body;
  if (!validateEmail(email)) res.send("Error").status(404);
  const db = level("streams-did-mappings");
  db.get(`email:${email}`, async (err, value) => {
    // some issue with level-db
    if (err && !(err instanceof level.errors.NotFoundError)) {
      await db.close();
      return res.send(err.message).status(err.status);
    }

    // user DNE
    if (err && err instanceof level.errors.NotFoundError) {
      const ipfs = IpfsHttpClient({ url: IPFS_URL });
      const ceramic = await Ceramic.create(ipfs, {
        stateStorePath: "./ceramic.lvl",
      });

      // this is the seed we will use to generate identity wallet
      const seed = getNewSeed();
      const keyring = new Keyring(seed);
      const { address } = keyring.managementWallet();
      // this doc needs to be filled in properly
      // waiting on OED's IDX package spec
      const did = await ceramic.createDocument("3id", {
        content: {
          // pointer to the root index dociD
          idx: "ceramic://rootindex",
          // anything else?
        },
        owners: [address],
      });

      try {
        // create a mapping to this DID from the email address
        await db.put(
          `email:${email}`,
          JSON.stringify({ id: did.id, seed, auth: false })
        );
      } catch (err) {
        await db.close();
        return res.send(err.message).status(err.status);
      }

      await db.close();
      return res.send(did.id).status(201);
    } else {
      await db.close();
      return res.send(JSON.parse(value).id).status(201);
    }
  });
});

const userConfirmation = async (email, db) => {
  let totalTime = 0;
  const pollForAuth = () =>
    new Promise((resolve, reject) => {
      setTimeout(async () => {
        totalTime += DB_POLL_INTERVAL;
        const { auth } = JSON.parse(await db.get(`email:${email}`));
        if (auth) return resolve(true);
        if (totalTime < EMAIL_CONFIRMATION_MAX_WAIT) {
          return resolve(pollForAuth());
        } else {
          return reject("User did not confirm email in time");
        }
      }, DB_POLL_INTERVAL);
    });
  return pollForAuth();
};

const getConsent = async (ceramicReq, expressReq, email, db) => {
  // im not sure why this would ever happen on the create-user request
  if (req.headers.authorization) {
    // validate vals against db vals
    const vals = verifyJWT(req.headers.authorization.split(" ")[1]);
    // validate vals against email and db vals here
    return true;
  } else {
    try {
      const userConfirmed = await userConfirmation(email, db);
      return userConfirmed;
    } catch (err) {
      // no consent if error happened?
      return false;
    }
  }
};

// The AUTH handlers here should **ALWAYS** return a JWT,
// regardless of the underlying strategy
router.post("/get-permission-via-email", async (expressReq, res) => {
  const { email } = expressReq.body;
  if (!validateEmail(email)) res.send("Error: invalid email").status(404);
  sendEmail(email);
  const db = level("streams-did-mappings");
  db.get(`email:${email}`, async (err, v) => {
    const { id, seed } = JSON.parse(v);
    // some issue with level-db
    if (err) {
      db.close();
      return res.send(err.message).status(err.status);
    }

    // user already exists, just send back their DID
    if (!id) {
      db.close();
      return res.send(`User with email ${email} not found`).status(404);
    }

    const ipfs = IpfsHttpClient({ url: IPFS_URL });
    const ceramic = await Ceramic.create(ipfs, {
      stateStorePath: "./ceramic.lvl",
    });

    const idWallet = new IdentityWallet(
      (ceramicReq) => getConsent(ceramicReq, expressReq, email, db),
      {
        seed,
      }
    );

    try {
      // this call triggers the `getConsent` function,
      // but it is acting syncronously?
      // https://github.com/ceramicnetwork/js-ceramic/issues/191
      await ceramic.setDIDProvider(idWallet.get3idProvider());
      const jwt = await createJWT({ email, id });
      res.send(jwt).status(201);
      // db.close(); <-- comment in when the above issue is fixed
    } catch (err) {
      res.send(err.message).status(err.code);
      db.close();
    }
  });
});

/**
 * This is insecure and needs to be fleshed out,
 * but the idea is that the user would have received an email link
 * clicking that link would take the user to a webpage with a
 * one time use code in the URL bar (oauth)
 *
 * We go ahead and take the code, and flip the `auth` to true in the user
 * which the getConsent function hears, and then confirms as consent
 */
router.post("/consent", async (req, res) => {
  // code isnt used yet
  const { email, code } = req.body;
  const db = level("streams-did-mappings");
  try {
    const user = JSON.parse(await db.get(`email:${email}`));
    await db.put(`email:${email}`, JSON.stringify({ ...user, auth: true }));
    res.send().status(201);
  } catch (err) {
    res.send(err.message).status(err.code);
  }

  db.close();
});

// helper method for dev
router.delete("/user", async (req, res) => {});

module.exports = router;
