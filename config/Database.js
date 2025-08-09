// import {Sequelize} from "sequelize";

// const db = new Sequelize('bali_pure_tour', 'root', '',{
//   host:"localhost",
//   dialect: "mysql",
// });

// export default db;

// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";
// dotenv.config();

// const db = new Sequelize(process.env.DATABASE_URL, {
//   dialect: "mysql",
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     }
//   }
// });

// export default db;

import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

import { Sequelize } from "sequelize";

logger.info("📦 DB CONFIG:", {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT
});

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false
  }
);

export default db;
