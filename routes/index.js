const express = require("express");
const router = express.Router();
const Ceramic = require("@ceramicnetwork/ceramic-core").default;
const IdentityWallet = require("identity-wallet");
const IpfsHttpClient = require("ipfs-http-client");
const crypto = require("crypto");

const IPFS_URL = process.env.IPFS_URL || "http://127.0.0.1:5001";

router.get("/", (_, res) => {
  res.send("OWL");
});

const getNewSeed = () => `0x${crypto.randomBytes(32).toString("hex")}`;

const getConsent = () =>
  new Promise((resolve, reject) => {
    console.log("GETTING CONSENT");
    resolve(true);
  });

router.post("/create-user", async (req, res) => {
  const ipfs = IpfsHttpClient({ url: IPFS_URL });
  const ceramicConfig = {
    stateStorePath: "./ceramic.lvl",
  };
  const ceramic = await Ceramic.create(ipfs, { ...ceramicConfig });

  const seed = getNewSeed();
  const idWallet = new IdentityWallet(getConsent, {
    seed,
  });
  await ceramic.setDIDProvider(idWallet.get3idProvider());
  res.send("OWL");
});

module.exports = router;
