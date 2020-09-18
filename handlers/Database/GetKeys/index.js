const {
  RPCResponse,
  RPCError,
  InternalError,
} = require("../../../utils/jsonrpc");
const { instantiateCeramic } = require("../../../utils/ceramic");
const ManagedUser = require("../../../utils/User");

module.exports = async (req, res, _, __, id, [threadID]) => {
  const { email } = req.user;
  const { ceramic } = await instantiateCeramic(email);
  const managedUser = new ManagedUser({ ceramic, email });
  try {
    const keys = await managedUser.getKeys(threadID, req.appID);
    if (keys) res.status(201).json(new RPCResponse({ id, result: keys }));
    else
      res.status(201).json(
        new RPCResponse({
          id,
          result: "",
          error: new RPCError({ code: -32004 }),
        })
      );
  } catch (err) {
    res.status(201).json(
      new RPCResponse({
        id,
        result: "",
        error: new InternalError(),
      })
    );
  }
};
