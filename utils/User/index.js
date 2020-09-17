const { IDX } = require("@ceramicstudio/idx");
const definitions = require("../../definitions.json");
const schemas = require("../../publishedSchemas.json");

class ManagedUser extends IDX {
  constructor(props) {
    super({ ...props, definitions, schemas });
  }

  _loadRawPermissions = () => this.get("permissions", this.id);

  loadPermissions = async () => {
    const { permissions } = await this._loadRawPermissions();
    return Promise.all(
      permissions.map(async (p) => {
        const doc = await this.ceramic.loadDocument(p);
        return doc?.content;
      })
    );
  };

  // if threadID is empty here, we assume this is a request to create a DB
  // which means as long as the appID exists in the user's perms, the app has perm
  appHasPerm = async (appID, threadID = "") => {
    const permissions = await this.loadPermissions();
    return permissions.some(({ did, scopes }) => {
      // app has _some_ perms...
      if (appID === did) {
        // if the threadID is empty, its a call to create, app has perm to do that
        if (!threadID) return true;
        // TO DO - get the actual scope doc and figure out if we have perms here
        return true;
      }
    });
  };

  _loadRawDatabases = () => this.get("databases", this.id);

  loadDatabases = async () => {
    const dbs = await this._loadRawDatabases();
    // TODO - unfurl...
  };

  encryptVal = async (val) => {
    // TODO
    return val;
  };

  createDB = async (name, threadID, readKey, serviceKey, appID) => {
    // here we do not pass the threadID to the hasPerm call, since we're creating this DB on this call
    const appHasPermission = await this.appHasPerm(appID, "");
    if (appHasPermission) {
      const secrets = await this.ceramic.createDocument("tile", {
        content: {
          encryptedServiceKey: await this.encryptVal(serviceKey),
          encryptedReadKey: await this.encryptVal(readKey),
        },
      });
      const database = await this.ceramic.createDocument("tile", {
        content: {
          name,
          threadID,
          access: secrets.id,
        },
      });

      const { databases } = await this._loadRawDatabases();
      databases.push(database.id);

      await this.set("databases", { databases });
    }

    // TODO: send back 403
  };
}

module.exports = ManagedUser;
