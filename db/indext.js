import sql from "mssql";
import dt1 from "./sql/dt1sql.js"
import dt2 from "./sql/dt2sql.js"
import dt3 from "./sql/dt3sql.js"
import dt4 from "./sql/dt4sql.js"

const pools = {
    1: dt1.dt_1_poolPromise,
    2: dt2.dt_2_poolPromise,
    3: dt3.dt_3_poolPromise,
    4: dt4.dt_4_poolPromise
};

export const getTowerDB = async (towerId) => {
  const poolPromise = pools[towerId];

  if (!poolPromise) {
    throw new Error(`Invalid tower id: ${towerId}`);
  }

  return await poolPromise;
};

export default sql;