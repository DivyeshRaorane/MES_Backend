import sql from "mssql";

const dt4_config = {
    user:process.env.DT_FOUR_DB_USER,
    password:process.env.DT_FOUR_DB_PASSWORD,
    server:process.env.DT_FOUR_DB_SERVER,
    database:process.env.DT_FOUR_DB_NAME,
     options: {
    trustServerCertificate: true, // important for local dev
    encrypt: false
     }
}

const dt_4_poolPromise = new sql.ConnectionPool(dt4_config)
.connect()
.then(pool=>{
    console.log("DT 4 sql server connected")
    return pool
}).catch(err =>{
    console.log("SQL connection failed:", err)
})

export default{
    sql,
    dt_4_poolPromise
}