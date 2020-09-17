const { RPCResponse } = require("../../../utils/jsonrpc");
const { instantiateCeramic } = require("../../../utils/ceramic");
const ManagedUser = require("../../../utils/User");

module.exports = async (
  req,
  res,
  __,
  db,
  id,
  [name, threadID, readKey, serviceKey]
) => {
  const { email } = req.user;
  const { ceramic } = await instantiateCeramic(email);
  const managedUser = new ManagedUser({ ceramic });
  await managedUser.createDB(name, threadID, readKey, serviceKey, req.appID);
  res.status(201).json(new RPCResponse({ id, result: true }));
};
