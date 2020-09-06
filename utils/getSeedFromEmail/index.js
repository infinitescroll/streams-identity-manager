const crypto = require("crypto");

const { SUPER_SECRET_SECRET } = require("../../constants");

const getSeed = (email) => {
  const valsToHash = [SUPER_SECRET_SECRET, email];
  const hash = crypto.createHash("sha256");
  valsToHash.forEach((val) => hash.update(val, "utf8"));

  return `0x${hash.digest("hex")}`;
};

module.exports = getSeed;
