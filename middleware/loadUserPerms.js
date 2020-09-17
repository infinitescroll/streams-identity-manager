const { verifyJWT } = require("../utils/jwt-helpers");
const { instantiateCeramic } = require("../utils/ceramic");
const ManagedUser = require("../utils/User");

const loadUserPerms = async (req, res, next) => {
  req.perms = null;
  if (req.headers.authorization) {
    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const { did, email, appID } = await verifyJWT(jwt);
      const { ceramic, idWallet } = await instantiateCeramic(email);
      if (!idWallet.id || idWallet.id !== did) {
        next(new Error("whaaaat"));
        return;
      }

      const user = new ManagedUser({ ceramic });
      const perms = await user.loadPermissions();
      req.perms = perms;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

module.exports = loadUserPerms;
