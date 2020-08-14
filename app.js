const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const { parseJsonrpcReq } = require("./utils/jsonrpc");
const handlers = require("./handlers");
const { ensureValidJsonrpcRequest } = require("./middleware");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/rpc/v0", ensureValidJsonrpcRequest, async (req, res, next) => {
  const { id, Handler, params } = parseJsonrpcReq(req);
  return handlers[Handler](req, res, next, id, params);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.send(err.message || "error").status(err.status || 500);
});

module.exports = app;
