const express = require("express");
const router = express.Router();
const Ceramic = require("@ceramicnetwork/ceramic-core").default;
const IdentityWallet = require("identity-wallet");
const IpfsHttpClient = require("ipfs-http-client");
const crypto = require("crypto");
const level = require("level");

const { fetchUserFromJWT } = require("../middleware");

const { createJWT } = require("../utils/jwt-helpers");

const IPFS_URL = process.env.IPFS_URL || "http://127.0.0.1:5001";
const DB_POLL_INTERVAL = process.env.DB_POLL_INTERVAL || 1000;
const EMAIL_CONFIRMATION_MAX_WAIT =
  process.env.EMAIL_CONFIRMATION_MAX_WAIT || 10000;
const SUPER_SECRET_SECRET = process.env.SUPER_SECRET_SECRET || "xxxyyyzzz";

router.get("/", (_, res) => {
  res.send("OWL");
});

const getSeed = (email) => {
  const valsToHash = [SUPER_SECRET_SECRET, email];
  const hash = crypto.createHash("sha256");
  valsToHash.forEach((val) => hash.update(val, "utf8"));

  return `0x${hash.digest("hex")}`;
};

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const sendEmail = () => new Promise((resolve) => setTimeout(resolve, 1000));

const createDID = async (ceramicInstance) => {
  // UNSAFE?
  return ceramicInstance.context.user._did;
};

const createUserEntryInDB = async (email, db) => {
  // before we have a DID to PUT to the DB, we need to auth first, so id is left empty in the meantime
  const objToStore = { id: "", auth: false };
  return db.put(`email:${email}`, JSON.stringify(objToStore));
};

const updateUserEntryInDBWithDID = async (did, email, db) => {
  const v = JSON.parse(await db.get(`email:${email}`));
  return db.put(`email:${email}`, JSON.stringify({ ...v, id: did }));
};

// this is pretty tightly coupled with email auth for now...
// creates a new DID
// gets permission from the user via email to sign on behalf of this DID
router.post(
  "/create-did-with-consent",
  fetchUserFromJWT,
  async (expressReq, res) => {
    if (expressReq.user) {
      const jwt = await createJWT(expressReq.user);
      return res.send(jwt).status(201);
    }

    const { email } = expressReq.body;
    if (!validateEmail(email)) return res.send("Invalid email").status(404);

    const db = level("streams-did-mappings");
    const ipfs = IpfsHttpClient({ url: IPFS_URL });
    const ceramic = await Ceramic.create(ipfs, {
      // this might cause issues
      // we may need to create a separate stateStorePath for each user
      stateStorePath: "./ceramic.lvl",
    });

    const seed = getSeed(email);
    const idWallet = new IdentityWallet(
      (ceramicReq) => getConsent(ceramicReq, expressReq, email, db),
      {
        seed,
      }
    );

    try {
      await createUserEntryInDB(email, db);
      // this call triggers the `getConsent` function, but it's brokey
      // https://github.com/ceramicnetwork/js-ceramic/issues/191
      await ceramic.setDIDProvider(idWallet.get3idProvider());
      console.log("log B");
      // this `createDID` func will done automatically by Identity Wallet in the background
      // so we should be able to delete this function call in future identity wallet versions
      const did = await createDID(ceramic);
      await updateUserEntryInDBWithDID(did, email, db);

      const jwt = await createJWT({ email, id: did });
      res.send(jwt).status(201);
      db.close(); // this can cause some funny race conditions because of the linked ceramic issue above
    } catch (err) {
      res.send(err.message).status(500);
      db.close();
    }
  }
);

// polls DB until the `auth` property returns true
// which means the user successfully gave permission via email
// and the /consent route was called
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
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Log A");
      return resolve(true);
    }, 2000);
  });
  // if (expressReq.user) {
  //   console.log("made it here");
  //   return true;
  // } else {
  //   try {
  //     console.log("pre confirm");
  //     const userConfirmed = await userConfirmation(email, db);
  //     console.log("post confirm");
  //     return userConfirmed;
  //   } catch (err) {
  //     // no consent if error happened?
  //     return false;
  //   }
  // }
};

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
    res.send().status(203);
  } catch (err) {
    res.send(err.message).status(err.code);
  }

  db.close();
});

// helper method for dev
router.delete("/user", async (req, res) => {});

router.get("/user/me", fetchUserFromJWT, async (req, res) => {
  return res.json(req.user);
});

module.exports = router;
