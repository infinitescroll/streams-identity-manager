const createUserEntryInDB = async (email, db) => {
  // before we have a DID to PUT to the DB, we need to auth first, so id is left empty in the meantime
  const objToStore = { did: "", auth: false };
  return db.put(`email:${email}`, JSON.stringify(objToStore));
};

const updateUserEntryInDBWithDID = async (did, email, db) => {
  const v = JSON.parse(await db.get(`email:${email}`));
  return db.put(`email:${email}`, JSON.stringify({ ...v, did }));
};

module.exports = {
  createUserEntryInDB,
  updateUserEntryInDBWithDID,
};
