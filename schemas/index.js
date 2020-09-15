const Database = require("./Database.json");
const DatabaseAccessController = require("./DatabaseAccessController.json");
const Databases = require("./Databases.json");
const Service = require("./Service.json");
const Services = require("./Services.json");
const { schemasList } = require("@ceramicstudio/idx-schemas");

const fullSchemaList = [
  ...schemasList,
  { name: "Databases", schema: Databases },
  { name: "Database", schema: Database },
  { name: "DatabaseAccessController", schema: DatabaseAccessController },
  { name: "Service", schema: Service },
  { name: "Services", schema: Services },
];

module.exports = {
  fullSchemaList,
  Databases,
  Database,
  DatabaseAccessController,
  Service,
  Services,
};
