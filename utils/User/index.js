const IdentityWallet = require("identity-wallet").default;
const fromString = require("uint8arrays/from-string");
const { IDX } = require("@ceramicstudio/idx");
const nacl = require("tweetnacl");
const naclutil = require("tweetnacl-util");
const definitions = require("../../definitions.json");
const schemas = require("../../publishedSchemas.json");
const resolveDocTree = require("../ceramic/resolveDocTree");
const getAuthSecret = require("../getAuthSecret");

class ManagedUser extends IDX {
  constructor({ email, ...props }) {
    super({ ...props, definitions, schemas });
    this.email = email;
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
    return JSON.stringify({ ciphertext: base64Cipher, nonce: base64Nonce });
  };

  decrypt = async (encryptedVal) => {
    if (typeof encryptedVal !== "string")
      throw new Error("must encrypt string");
    const { ciphertext, nonce } = JSON.parse(encryptedVal);
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
    const appHasPermission = permissions.some(({ did }) => did === appID);
    if (appHasPermission) {
      const idxRoot = await this.get("databases", this.id);
      const { databases } = await resolveDocTree(idxRoot, this.ceramic, false);

      const dbExists = databases.some((db) => db.threadID === threadID);
      // todo; send back more specific error
      if (dbExists) throw new Error("thread exists");
      const secrets = await this.ceramic.createDocument("tile", {
        content: {
          encryptedServiceKey: await this.decrypt(
            await this.encrypt(serviceKey)
          ),
          encryptedReadKey: await this.decrypt(await this.encrypt(readKey)),
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
    } else {
      // TODO: send back proper RPC error
      throw new Error("Unauthorized");
    }
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
