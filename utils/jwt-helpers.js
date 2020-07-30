const jwt = require("jsonwebtoken");

const loginSecretKey = "SECRET_WAAAA";

const jwtOptions = {
  issuer: "streams.re",
  audience: "streams.re",
  algorithm: "HS256",
};

const createJWT = (claims) =>
  new Promise((resolve, reject) => {
    return jwt.sign(claims, loginSecretKey, jwtOptions, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });

const verifyJWT = (token) =>
  new Promise((resolve, reject) => {
    return jwt.verify(token, loginSecretKey, {}, (err, decodedToken) => {
      if (err) reject(err);
      else resolve(decodedToken);
    });
  });

module.exports = { createJWT, verifyJWT };
