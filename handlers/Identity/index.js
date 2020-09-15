const RequestPermission = require("./RequestPermission");
const Consent = require("./Consent");
const IsAuthenticated = require("./IsAuthenticated");

// define namespaces
const Identity = {
  Consent,
  IsAuthenticated,
  RequestPermission,
};

module.exports = Identity;
