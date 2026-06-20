import sql from "mssql";

const dt3_config = {
    user:process.env.DT_THREE_DB_USER,
    password:process.env.DT_THREE_DB_PASSWORD,
    server:process.env.DT_THREE_DB_SERVER,
    database:process.env.DT_THREE_DB_NAME,
     options: {
    trustServerCertificate: true, // important for local dev
    encrypt: false
     }
}

const dt_3_poolPromise = new sql.ConnectionPool(dt3_config)
.connect()
.then(pool =>{
    console.log("DT 3 sql Server connected")
    return pool
}).catch(err=>{
    console.log("SQL connection failed", err)
})

export default{
    sql,
    dt_3_poolPromise
}