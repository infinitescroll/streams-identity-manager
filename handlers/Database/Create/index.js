const { RPCResponse, RPCError } = require("../../../utils/jsonrpc");
const { instantiateCeramic } = require("../../../utils/ceramic");
const ManagedUser = require("../../../utils/User");

module.exports = async (
  req,
  res,
  _,
  __,
  id,
  [name, threadID, readKey, serviceKey]
) => {
  const { email } = req.user;
  const { ceramic } = await instantiateCeramic(email);
  const managedUser = new ManagedUser({ ceramic });
  try {
    await managedUser.createDB(name, threadID, readKey, serviceKey, req.appID);
    res.status(201).json(new RPCResponse({ id, result: "" }));
  } catch (err) {
    console.log(err);
    res.status(201).json(
      new RPCResponse({
        id,
        result: "",
        error: new RPCError({ code: -32003 }),
      })
    );
  }
};
