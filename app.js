const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const level = require("level");
const { parseJsonrpcReq } = require("./utils/jsonrpc");
const handlers = require("./handlers");
const { ensureValidJsonrpcRequest, jsonrpcLogger } = require("./middleware");
const { STREAMS_DID_EMAIL_DB } = require("./constants");

const app = express();

// this was the best way i could see to avoid race conditions with db
// but i dont know how to "close" the db (or if i even need to?)
const db = level(STREAMS_DID_EMAIL_DB);
app.set(STREAMS_DID_EMAIL_DB, db);

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(jsonrpcLogger);

app.post("/rpc/v0", ensureValidJsonrpcRequest, async (req, res, next) => {
  const { id, Handler, params } = parseJsonrpcReq(req);
  const db = app.get(STREAMS_DID_EMAIL_DB);
  return handlers[Handler](req, res, next, db, id, params);
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
