const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../constants");

const jwtOptions = {
  issuer: "streams.re",
  audience: "streams.re",
  algorithm: "HS256",
};

const createJWT = (claims) =>
  new Promise((resolve, reject) => {
    return jwt.sign(claims, JWT_SECRET, jwtOptions, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });

const verifyJWT = (token) =>
  new Promise((resolve, reject) => {
    return jwt.verify(token, JWT_SECRET, {}, (err, decodedToken) => {
      if (err) reject(err);
      else resolve(decodedToken);
    });
  });

module.exports = { createJWT, verifyJWT };
