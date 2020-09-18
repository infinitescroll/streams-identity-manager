const { verifyJWT } = require("../utils/jwt-helpers");

const fetchInfoFromJWT = async (req, res, next, db) => {
  req.user = null;
  if (req.headers.authorization) {
    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const { email, did, appID } = await verifyJWT(jwt);
      req.appID = appID;
      const v = JSON.parse(await db.get(`email:${email}`));

      // if the jwt contains an email and a DID, it's a full JWT
      if (email && did) {
        // make sure the DID and email in the token matches what we have
        if (v.did !== did) throw new Error("Invalid JWT");
        // full jwt
        req.user = { email, did };
        next();
        return;
      }

      // if the JWT contains just an email, it is a partial JWT used for getting consent
      if (email) {
        req.user = { email, did: null };
        next();
        return;
      }
      next(new Error("Invalid JWT"));
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

module.exports = fetchInfoFromJWT;
