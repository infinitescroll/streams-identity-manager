const fs = require("fs");
const path = require("path");
const Ceramic = require("@ceramicnetwork/ceramic-http-client").default;
const Wallet = require("identity-wallet").default;
const { IDX } = require("@ceramicstudio/idx");
const { schemasList, publishSchemas } = require("@ceramicstudio/idx-schemas");

const seed =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const seedDefinitions = () =>
  new Promise(async (resolve, reject) => {
    const idWallet = await Wallet.create({
      seed,
      getPermission: () => Promise.resolve([]),
      useThreeIdProv: false,
    });
    const ceramic = new Ceramic();
    await ceramic.setDIDProvider(idWallet.getDidProvider());
    const schemas = await publishSchemas({ ceramic, schemas: schemasList });
    const idx = new IDX({ ceramic, schemas });
    const definitions = {
      "test:profile": await idx.createDefinition({
        name: "test profile",
        schema: schemas.BasicProfile,
      }),
    };
    fs.writeFile(
      `${__dirname}/../definitions/index.json`,
      JSON.stringify(definitions),
      reject
    );
    return resolve();
  });

seedDefinitions();
