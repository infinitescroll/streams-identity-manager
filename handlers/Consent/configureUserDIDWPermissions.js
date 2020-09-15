const { IDX } = require("@ceramicstudio/idx");
const { fullSchemaList } = require("../../schemas");
const definitions = require("../../definitions");
const chalk = require("chalk");
const log = console.log;

/**
 * User looks like:
 *
 * {
 *  databases: [
 *       'ceramic://bagcqceraynhpmkz6vtermrsyvbqx2sow2sv3lfkj4smhg3e32iozak4nyeea',
 *        'ceramic://bagcqceraynhpmkz6vtermrsyvbqx2sow2sv3lfkj4smhg3e3dafdsaiozak',
 *        etc...
 *    ]
 *
 *  // services are things that can make root level changes to your DID
 * // usually this will just be the identity/consent manager...
 *  services: [
 *        'ceramic://bagcqceraynhpmkz6vtermrsyvbqx2sow2sv3fdsasmhg3e32fdsa4nfdas',
 *    ]
 * }
 *
 */

const configureUserDIDWPermissions = async (ceramic) => {
  const user = new IDX({ ceramic, definitions, schemas: fullSchemaList });

  try {
    // getIDXContent will create a root IDX doc if one isn't already created
    await user.getIDXContent();
    await listDatabases(user);
    if (await isEmptyUser(user)) {
      await createUser(user);
    }
  } catch (error) {
    // TODO: send email here notifying error maybe bc we're doing this in the background?
    log(chalk.red("ERROR: ", error));
  }
};

const isEmptyUser = async (user) => {
  const content = await user.get(definitions.databases, user.id);
  return !!content.databases;
};

const createUser = async (user) => {
  try {
    await user.set("databases", { databases: [] });
    await user.set("services", {
      services: [
        "ceramic://bagcqcera7ttwdxykuk2znrnv6yg44my6kdsz6hfpubicitcthi2kjbgyzh2q",
      ],
    });
  } catch (err) {
    // TODO: send email here notifying error maybe?
    log(chalk.red("ERROR: ", err));
  }
};

const listDatabases = async (user) => {
  const databases = await user.get(definitions.datatbases, user.id);
  return databases;
};

const addNewAuthMethodToKeychain = async () => {
  // 1. the DID root key is different from another key thats used to sign consent messages
  // 2. the key thats used to sign consent messages can encrypt and decrypt the DID docs
  // 3. the root key can also encrytp and decrypt the DID docs
  /**
   * DID:3:1234 -> root IDX --> auth Keychain[{ key: consentManager }]
   *
   * // authentication method is a signed message from the metamask
   * // with the keychain, you can add more authentication methods, but they authenticate the entire wallet
   * // if you add another key to the keychain, they get access to the entire wallet
   * // authentication method is allowed to change stuff
   *
   *
   * Add auth method!
   *
   * The idea for bring your own did here is that:
   *
   * 1. our frontend app will request message signing
   * 2. our frontend app can then send that seed to the server
   * 3. our backend app can create a new id wallet with the seed gotten by the client
   * 4. our backend app can then create a new auth secret and id based on user's email ,and the HSM
   * 5. our backend app can then commit this auth secret to the user's did (anchor it)
   * 6. our backend app can then cahnge the users did around
   */
};

const addEmailToAccountLinks = async () => {};

const createNewDocWithEncryptedKey = async () => {};

const createNewEncryptedDoc = async () => {};

module.exports = configureUserDIDWPermissions;
