const { RPCResponse } = require("../../../utils/jsonrpc");

module.exports = async (
  req,
  res,
  __,
  db,
  id,
  [dbName, dbId, adminKey, followKey]
) => {
  res.status(201).json(new RPCResponse({ id, result: true }));
};
