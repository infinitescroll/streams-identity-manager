const level = require("level");

const { verifyJWT } = require("../utils/jwt-helpers");

const fetchUserFromJWT = async (req, res, next, db) => {
  req.user = null;
  if (req.headers.authorization) {
    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const { email, id } = await verifyJWT(jwt);
      const v = JSON.parse(await db.get(`email:${email}`));
      if (v.id === id) {
        // full jwt
        req.user = { email, id };
        next();
      } else if (!v.id) {
        // partial jwt
        req.user = { email, id: null };
        next();
      } else {
        next(new Error("Invalid JWT"));
      }
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

module.exports = fetchUserFromJWT;
