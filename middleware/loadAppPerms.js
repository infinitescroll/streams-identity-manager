const { verifyJWT } = require("../utils/jwt-helpers");

const fetchUserFromJWT = async (req, res, next, db) => {
  req.user = null;
  if (req.headers.authorization) {
    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const { appID } = await verifyJWT(jwt);
      console.log(appID);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

module.exports = fetchUserFromJWT;
