const handlers = require("../handlers");

const rpcErrorMessages = {
  "-32700": "Parse error",
  "-32600": "Invalid Request",
  "-32601": "Method not found",
  "-32602": "Invalid params",
  "-32603": "Internal error",
};

const reservedJsonrpcCodes = new Set([-32700, -32600, -32601, -32602, -32603]);

const isValidCode = (code) => {
  if (reservedJsonrpcCodes.has(code) || (code >= -32000 && code <= -32099))
    return true;
  return false;
};

const getMessageFromCode = (code) => {
  if (!isValidCode(code)) return "Invalid code passed";
  const codeString = code.toString();

  if (rpcErrorMessages[codeString]) return rpcErrorMessages[codeString];
};

// https://www.jsonrpc.org/specification#error_object
class RPCError {
  constructor({ code, data }) {
    this.code = code;
    this.message = getMessageFromCode(code);
    this.data = data;
  }

  toJSON = () => {
    const err = { code: this.code, message: this.message };
    if (this.data) err.data = this.data;
    return err;
  };
}

class RPCResponse {
  constructor({ id, result, error }) {
    this.id = id;
    this.result = result;
    this.error = error;
  }

  toJSON = () => {
    const resp = { jsonrpc: "2.0" };

    if (!!this.id) resp.id = this.id;
    if (!!this.result) resp.result = this.result;
    if (!!this.error) resp.error = this.error;
    return resp;
  };
}

const parseJsonrpcReq = (req) => {
  const { jsonrpc, method, params, id } = req.body;
  const [Identity, Handler] = method.split(".");
  return { jsonrpc, method, Identity, Handler, params, id };
};

const bindHandler = (req, res, next) => {
  const { Handler, params } = parseJsonrpcReq(req);
  return handlers[Handler].bind(this, req, res, next, params);
};

const ensureValidJsonrpcRequest = (req, res, next) => {
  const { id, Identity, Handler } = parseJsonrpcReq(req);
  if (Identity !== "Identity" || !handlers[Handler]) {
    const error = new RPCError({ code: -32601 });
    const response = new RPCResponse({
      id,
      error: error.toJSON(),
    });
    res.json(response).status(400);
    return;
  }
  next();
};

module.exports = {
  bindHandler,
  isValidCode,
  getMessageFromCode,
  RPCError,
  RPCResponse,
  parseJsonrpcReq,
  ensureValidJsonrpcRequest,
};
