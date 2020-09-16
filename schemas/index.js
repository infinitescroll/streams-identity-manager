const { schemasList } = require("@ceramicstudio/idx-schemas");
const Database = require("./Database.json");
const ThreadSecrets = require("./ThreadSecrets.json");
const Databases = require("./Databases.json");
const Permissions = require("./Permissions.json");
const Permission = require("./Permission.json");

const fullSchemaList = [
  ...schemasList,
  { name: "Databases", schema: Databases },
  { name: "Database", schema: Database },
  { name: "ThreadSecrets", schema: ThreadSecrets },
  { name: "Permissions", schema: Permissions },
  { name: "Permission", schema: Permission },
];

module.exports = {
  fullSchemaList,
  Databases,
  Database,
  ThreadSecrets,
  Permissions,
  Permission,
};
