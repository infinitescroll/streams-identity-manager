const level = require("level");

const { verifyJWT } = require("../utils/jwt-helpers");

const fetchUserFromJWT = async (req, res, next) => {
  req.user = null;
  if (req.headers.authorization) {
    const db = level("streams-did-mappings");
    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const { email, id } = await verifyJWT(jwt);
      const v = JSON.parse(await db.get(`email:${email}`));
      console.log(v);
      if (v.id === id) {
        req.user = { email, id };
        next();
      } else {
        next(new Error("Invalid JWT"));
      }
    } catch (error) {
      next(error);
    }
    await db.close();
  } else {
    next();
  }
};

module.exports = fetchUserFromJWT;
