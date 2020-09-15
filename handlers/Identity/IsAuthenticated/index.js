const { RPCResponse } = require("../../../utils/jsonrpc");

module.exports = async (req, res, __, db, id, [did]) => {
  const jwtClaimsThisDID = req?.user?.did === did;
  // we need to check if our identity manager's key is on the auth keychain
  if (jwtClaimsThisDID)
    res.status(201).json(new RPCResponse({ id, result: true }));
  else res.status(201).json(new RPCResponse({ id, result: false }));
};
