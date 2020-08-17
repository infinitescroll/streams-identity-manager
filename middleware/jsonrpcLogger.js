const { parseJsonrpcReq } = require("../utils/jsonrpc");

module.exports = (req, res, next) => {
  try {
    const { Identity, Handler, params } = parseJsonrpcReq(req);
    console.log(`${Identity}.${Handler}: ${params}`);
  } catch (err) {
    console.log("Bad params coming in...");
  }
  next();
};
