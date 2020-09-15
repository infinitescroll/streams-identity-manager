const fs = require("fs");
const Ceramic = require("@ceramicnetwork/ceramic-http-client").default;
const Wallet = require("identity-wallet").default;
const { IDX } = require("@ceramicstudio/idx");
const { publishSchemas } = require("@ceramicstudio/idx-schemas");
const { fullSchemaList } = require("../schemas");
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
    const schemas = await publishSchemas({
      ceramic,
      schemas: fullSchemaList,
    });

    const idx = new IDX({ ceramic, schemas });

    const definitions = {
      profile: await idx.createDefinition({
        name: "profile",
        schema: schemas.BasicProfile,
      }),
      database: await idx.createDefinition({
        name: "database",
        schema: schemas.Database,
      }),
      databases: await idx.createDefinition({
        name: "databases",
        schema: schemas.Databases,
      }),
      services: await idx.createDefinition({
        name: "services",
        schema: schemas.Services,
      }),
    };

    fs.writeFile(
      `${__dirname}/../definitions/index.json`,
      JSON.stringify(definitions),
      reject
    );
    await ceramic.close();
    return resolve();
  });

seedDefinitions();
