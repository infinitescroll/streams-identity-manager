const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const { ensureValidJsonrpcRequest, bindHandler } = require("./utils/jsonrpc");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/rpc/v0", ensureValidJsonrpcRequest, async (req, res, next) => {
  const handler = bindHandler(req, res, next);
  await handler();
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
