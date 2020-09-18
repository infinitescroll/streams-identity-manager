const IdentityWallet = require("identity-wallet").default;
const { IDX } = require("@ceramicstudio/idx");
const nacl = require("tweetnacl");
const naclutil = require("tweetnacl-util");
const definitions = require("../../definitions.json");
const schemas = require("../../publishedSchemas.json");
const resolveDocTree = require("../ceramic/resolveDocTree");
const getAuthSecret = require("../getAuthSecret");
const cloneDeep = require("lodash.clonedeep");

class ManagedUser extends IDX {
  constructor({ email, ...props }) {
    super({ ...props, definitions, schemas });
    this.email = email;
  }

  _configure = async (appID) => {
    const doc = await this.ceramic.createDocument("tile", {
      content: {
        scopes: {},
      },
    });
    await this.set("databases", { databases: {} });
    await this.set("permissions", { permissions: { [appID]: doc.id } });
  };

  userConfigured = async () => {
    const dbs = await this.get("databases", this.id);
    const perms = await this.get("permissions", this.id);
    const hasDbs = !!dbs?.databases;
    const hasPerms = !!perms?.permissions;
    return hasDbs && hasPerms;
  };

  configure = async (appID) => {
    await this.getIDXContent();
    const needsConfig = !(await this.userConfigured());
    if (needsConfig) {
      await this._configure(appID);
    }
  };

  addPermission = async (permissions, threadID, dbDocID, appID) => {
    const permission = cloneDeep(permissions[appID]);
    permission.scopes[threadID] = dbDocID;

    const newPermDoc = await this.ceramic.createDocument("tile", {
      content: permission,
    });

    permissions[appID] = newPermDoc.id;
    await this.set("permissions", { permissions });
  };

  encrypt = async (string) => {
    if (typeof string !== "string") throw new Error("must encrypt string");
    const msg = naclutil.decodeUTF8(string);
    const nonce = nacl.randomBytes(24);
    const authSecret = getAuthSecret(this.email);
    const idWallet = await IdentityWallet.create({
      authId: this.email,
      authSecret,
      getPermission: () => Promise.resolve([]),
    });
    const key32Bytes = Uint8Array.from(idWallet._keyring._seed.slice(0, 32));
    const ciphertext = nacl.secretbox(msg, nonce, key32Bytes);

    const base64Cipher = Buffer.from(ciphertext).toString("base64");
    const base64Nonce = Buffer.from(nonce).toString("base64");

    // TODO: separate these out
    return { ciphertext: base64Cipher, nonce: base64Nonce };
  };

  decrypt = async ({ ciphertext, nonce }) => {
    const authSecret = getAuthSecret(this.email);
    const idWallet = await IdentityWallet.create({
      authId: this.email,
      authSecret,
      getPermission: () => Promise.resolve([]),
    });
    const key32Bytes = Uint8Array.from(idWallet._keyring._seed.slice(0, 32));

    try {
      const cleartext = nacl.secretbox.open(
        naclutil.decodeBase64(ciphertext),
        naclutil.decodeBase64(nonce),
        key32Bytes
      );
      if (cleartext == null) {
        return null;
      }
      return naclutil.encodeUTF8(cleartext);
    } catch (err) {
      return null;
    }
  };

  createDB = async (name, threadID, readKey, serviceKey, appID) => {
    const { permissions } = await resolveDocTree(
      await this.get("permissions", this.id),
      this.ceramic,
      false
    );
    // here we just make sure the app exists on any of the users perms, later we could check for scope
    // but for now every app with consent can at least create a database (if you're here, the app has consent)
    const appHasPermission = !!permissions[appID];
    if (appHasPermission) {
      const idxRoot = await this.get("databases", this.id);
      const { databases } = await resolveDocTree(idxRoot, this.ceramic, false);
      const dbExists = !!databases[threadID];
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
      idxRoot.databases[threadID] = database.id;

      await this.set("databases", { databases: idxRoot.databases });
      await this.addPermission(permissions, threadID, database.id, appID);
    } else {
      // TODO: send back proper RPC error
      throw new Error("Unauthorized");
    }
  };

  appHasPermission = async (permissions, threadID, appID) => {
    const appPermissionExist = !!permissions[appID];
    if (appPermissionExist) {
      return !!permissions[appID].scopes[threadID];
    } else {
      return false;
    }
  };

  retrieveSecrets = async (permissions, threadID, appID) => {
    const secrets = permissions[appID].scopes[threadID].access;
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
