const RPCErrorMessages = require("../RPCErrorCodes.json");

const reservedJsonrpcCodes = new Set([-32700, -32600, -32601, -32602, -32603]);

const isValidCode = (code) => {
  if (reservedJsonrpcCodes.has(code) || (code >= -32000 && code <= -32099))
    return true;
  return false;
};

const getMessageFromCode = (code) => {
  if (!isValidCode(code)) return "Invalid code passed";
  const codeString = code.toString();

  if (RPCErrorMessages[codeString]) return RPCErrorMessages[codeString];
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

class InvalidOneTimePassError extends RPCError {
  constructor() {
    super({ code: -32002 });
  }
}

class InternalError extends RPCError {
  constructor() {
    super({ code: -32603 });
  }
}

class InvalidParamsError extends RPCError {
  constructor() {
    super({ code: -32602 });
  }
}

class RPCResponse {
  constructor({ id, result, error }) {
    this.id = id;
    this.result = result !== undefined ? result : "";
    this.error = error;
  }

  toJSON = () => {
    const resp = { jsonrpc: "2.0", result: this.result };
    if (!!this.id) resp.id = this.id;
    if (!!this.error) resp.error = this.error;
    return resp;
  };
}

const parseJsonrpcReq = (req) => {
  const { jsonrpc, method, params, id } = req.body;
  const [Namespace, Handler] = method.split(".");
  return { jsonrpc, method, Namespace, Handler, params, id };
};

module.exports = {
  isValidCode,
  getMessageFromCode,
  RPCError,
  RPCResponse,
  parseJsonrpcReq,
  InvalidParamsError,
  InvalidOneTimePassError,
  InternalError,
};
