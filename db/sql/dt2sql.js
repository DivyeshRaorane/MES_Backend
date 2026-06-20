import sql from "mssql";

const dt2_config = {
    user:process.env.DT_TWO_DB_USER,
    password:process.env.DT_TWO_DB_PASSWORD,
    server:process.env.DT_TWO_DB_SERVER,
    database:process.env.DT_TWO_DB_NAME,
     options: {
    trustServerCertificate: true, // important for local dev
    encrypt: false
     }
}

const dt_2_poolPromise = new sql.ConnectionPool(dt2_config)
.connect()
.then(pool =>{
    console.log("DT 2 sql Server Connected")
    return pool
})
.catch(err=>{
    console.log("SQL Connection Failed:", err)
})

export default {
    sql,
    dt_2_poolPromise
}