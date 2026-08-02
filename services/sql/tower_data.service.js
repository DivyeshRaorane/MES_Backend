import { getTowerDB } from "../../db/indext.js";

export const fetchTowerAllEventsS = async(tower_id, start_date, start_time, end_date, end_time)=>{
    const pool = await getTowerDB(tower_id);

    const start = new Date(`${start_date} ${start_time}`);
    const end = new Date(`${end_date} ${end_time}`);

    
    const result = await pool.request()
        .input("start", start)
        .input("end", end)
        .query(`
            SELECT *
            FROM ALLEvent
            WHERE TRY_CONVERT(DATETIME, EventTimeStamp)
                  BETWEEN @start AND @end
            ORDER BY TRY_CONVERT(DATETIME, EventTimeStamp) ASC
        `);

        return result.recordset
};

