import db from "../../db/sql/dt1sql.js";
import ExcelJS from "exceljs"

export const testDB = async (req, res) => {
  try {
    const pool = await db.dt_1_poolPromise;

    const result = await pool.request().query("SELECT 1 AS test");

    res.json({
      success: true,
      message: "Database connected successfully",
      data: result.recordset
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: err.message
    });
  }
};


//  export const testTagTable = async (req,res)=>{
//      try{
//          const pool = await db.dt_1_poolPromise
//          const result = await pool.request().query(`
//              Select Top 2000 * from AllEvent ORDER by EventTimeStamp DESC`
//          )
//          res.json({
//              success:true,
//              data:result.recordset
//          });
//      }catch(err){
//          res.status(500).json({
//              success:false,
//              message:err.message
//          })
//      }
//  }

export const testTagTable = async (req, res) => {
  try {
    const pool = await db.dt_1_poolPromise;

   const result = await pool.request().query(`
    SELECT *
    FROM AllEvent
    WHERE EventTimeStamp >= '2026-06-20 17:25:00'
      AND EventTimeStamp <  '2026-06-20 23:07:00';
`);

    const data = result.recordset;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("AllEvent");

    // Add columns dynamically
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: 20
      }));
    }

    // Add rows
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=AllEvent.xlsx"
    );

    // Write file to response
    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};