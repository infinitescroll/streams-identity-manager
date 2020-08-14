const handlers = require("../handlers");
const { RPCError, RPCResponse, parseJsonrpcReq } = require("../utils/jsonrpc");

module.exports = (req, res, next) => {
  const { id, Identity, Handler } = parseJsonrpcReq(req);
  if (Identity !== "Identity" || !handlers[Handler]) {
    const error = new RPCError({ code: -32601 });
    const response = new RPCResponse({
      id,
      error,
    });
    res.json(response).status(400);
    return;
  }
  next();
};
