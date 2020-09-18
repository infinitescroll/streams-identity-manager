const { IDX } = require("@ceramicstudio/idx");
const definitions = require("../../definitions.json");
const schemas = require("../../publishedSchemas.json");
const resolveDocTree = require("../ceramic/resolveDocTree");

class ManagedUser extends IDX {
  constructor(props) {
    super({ ...props, definitions, schemas });
  }

  addPermission = async (appID, threadDocId, permissions) => {
    const updatedPerms = await Promise.all(
      permissions.map(async (p) => {
        if (p.did === appID) {
          const newAppPerms = { ...p };
          newAppPerms.scopes.push(threadDocId);
          const doc = await this.ceramic.createDocument("tile", {
            content: newAppPerms,
          });
          return doc.id;
        }
        return p;
      })
    );
    await this.set("permissions", { permissions: updatedPerms });
  };

  encrypt = async (val) => {
    // TODO
    return val;
  };

  decrypt = async (val) => {
    // TODO
    return val;
  };

  createDB = async (name, threadID, readKey, serviceKey, appID) => {
    const { permissions } = await resolveDocTree(
      await this.get("permissions", this.id),
      this.ceramic,
      false
    );
    // here we just make sure the app exists on any of the users perms, later we could check for scope
    // but for now every app with consent can at least create a database (if you're here, the app has consent)
    const appHasPermission = permissions.some(({ did }) => did === appID);
    if (appHasPermission) {
      const idxRoot = await this.get("databases", this.id);
      const { databases } = await resolveDocTree(idxRoot, this.ceramic, false);

      const dbExists = databases.some((db) => db.threadID === threadID);

      // todo; send back more specific error
      if (dbExists) throw new Error("thread exists");
      const secrets = await this.ceramic.createDocument("tile", {
        content: {
          encryptedServiceKey: await this.encrypt(serviceKey),
          encryptedReadKey: await this.encrypt(readKey),
        },
      });
      const database = await this.ceramic.createDocument("tile", {
        content: {
          name,
          threadID,
          access: secrets.id,
        },
      });
      idxRoot.databases.push(database.id);

      await this.set("databases", { databases: idxRoot.databases });

      await this.addPermission(appID, database.id, permissions);
    }

    // TODO: send back 403
  };

  appHasPermission = async (permissions, threadID, appID) => {
    return permissions.some((p) => {
      if (p.did === appID) {
        return p.scopes.some((db) => db.threadID === threadID);
      }
      return false;
    });
  };

  retrieveSecrets = async (permissions, threadID, appID) => {
    const [[db]] = permissions
      .filter(({ did }) => did === appID)
      .map(({ scopes }) => scopes.filter((db) => db.threadID === threadID));
    const secrets = db.access;
    return {
      encryptedReadKey: await this.decrypt(secrets.encryptedReadKey),
      encryptedServiceKey: await this.decrypt(secrets.encryptedServiceKey),
    };
  };

  getKeys = async (threadID, appID) => {
    const { permissions } = await resolveDocTree(
      await this.get("permissions", this.id),
      this.ceramic,
      true
    );

    if (this.appHasPermission(permissions, threadID, appID)) {
      return this.retrieveSecrets(permissions, threadID, appID);
    }

    return null;
  };
}

module.exports = ManagedUser;
