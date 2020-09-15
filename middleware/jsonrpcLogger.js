const { parseJsonrpcReq } = require("../utils/jsonrpc");

module.exports = (req, res, next) => {
  try {
    const { Namespace, Handler, params } = parseJsonrpcReq(req);
    console.log(`${Namespace}.${Handler}: ${params}`);
  } catch (err) {
    console.log("Bad params coming in...");
  }
  next();
};
