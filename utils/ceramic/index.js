const CeramicClient = require("@ceramicnetwork/ceramic-http-client").default;
const IdentityWallet = require("identity-wallet").default;
const getAuthSecret = require("../getAuthSecret");

const instantiateCeramic = async (email) => {
  const authSecret = getAuthSecret(email);
  const ceramic = new CeramicClient();
  const idWallet = await IdentityWallet.create({
    authId: email,
    authSecret,
    getPermission: () => Promise.resolve([]),
    ceramic,
  });
  await ceramic.setDIDProvider(idWallet.getDidProvider());
  return {
    ceramic,
    idWallet,
  };
};

module.exports = { instantiateCeramic };
