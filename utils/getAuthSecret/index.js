const crypto = require("crypto");

const { SUPER_SECRET_SECRET } = require("../../constants");

const getAuthSecret = (email) => {
  const valsToHash = [SUPER_SECRET_SECRET, email];
  const hash = crypto.createHash("sha256");
  valsToHash.forEach((val) => hash.update(val, "utf8"));

  const uint8Array = Uint8Array.from(hash.digest("hex"));
  return uint8Array;
};

module.exports = getAuthSecret;
