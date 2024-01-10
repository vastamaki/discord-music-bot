const { Knex } = require("knex");

const { DB_HOST, DB_USER, DB_PASS, DB_PORT, DB_DB } = process.env;

module.exports = {
  client: "mysql",
  jsonbSupport: true,
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
    database: DB_DB,
  },
  migrations: {
    directory: "./migrations",
  },
};
