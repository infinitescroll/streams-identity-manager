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

    fs.writeFile(
      `${__dirname}/../publishedSchemas.json`,
      JSON.stringify(schemas),
      reject
    );
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
      permissions: await idx.createDefinition({
        name: "permissions",
        schema: schemas.Permissions,
      }),
      permission: await idx.createDefinition({
        name: "permission",
        schema: schemas.Permission,
      }),
    };

    fs.writeFile(
      `${__dirname}/../definitions.json`,
      JSON.stringify(definitions),
      reject
    );
    await ceramic.close();
    return resolve();
  });

seedDefinitions();
