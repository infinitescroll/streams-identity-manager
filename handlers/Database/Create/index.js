const { RPCResponse } = require("../../../utils/jsonrpc");

module.exports = async (req, res, __, db, id, []) => {
  res.status(201).json(new RPCResponse({ id, result: true }));
};
