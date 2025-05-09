// import {Sequelize} from "sequelize";

// const db = new Sequelize('bali_pure_tour', 'root', '',{
//   host:"localhost",
//   dialect: "mysql",
// });

// export default db;

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    }
  }
});

export default db;
