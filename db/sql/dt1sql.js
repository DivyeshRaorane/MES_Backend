
import sql from "mssql";

const dt_1_config = {
    user: process.env.DT_ONE_DB_USER,
    password: process.env.DT_ONE_DB_PASSWORD,
    server: process.env.DT_ONE_DB_SERVER,
    database: process.env.DT_ONE_DB_NAME,
     options: {
    trustServerCertificate: true, // important for local dev
    encrypt: false
  }
}

/*const dt_1_config = {
    user: "draw1",
    password: "wco12345",
    server: "192.168.50.72",
    database: process.env.DT_ONE_DB_NAME,
     options: {
    trustServerCertificate: true, // important for local dev
    encrypt: false
  }
}*/

const dt_1_poolPromise = new sql.ConnectionPool(dt_1_config)
.connect()
.then(pool=>{
console.log("DT 1 Sql server connected");
return pool
})
.catch(err => {
    console.error("SQL connection failed:", err);
  });


  export default {
    sql,
    dt_1_poolPromise
  }