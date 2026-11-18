import {
  getConfigS, saveConfigS, getSpoolsByPreformS, getBobbinsBySpoolsS, getBobbinByNoS, updateQcValuesS,
} from "../../../services/qc_data_update/qc_data_update.service.js";

// Every service returns { status, message, data }; the status is reused as the HTTP code.
const run = (label, fn) => async (req, res) => {
  try {
    const result = await fn(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(`QC Data Update ${label} Error:`, error.message);
    return res.status(500).json({ status: 500, message: "Something went wrong", data: null });
  }
};

// GET /api/qc-data-update/config
export const getConfigC = run("Get Config", () => getConfigS());

// PUT /api/admin/qc-data-update/config   body: { params: { <name>: boolean } }
export const saveConfigC = run("Save Config", (req) =>
  saveConfigS({ params: req.body?.params })
);

// GET /api/qc-data-update/spools?preform_id=
export const getSpoolsC = run("Get Spools", (req) => getSpoolsByPreformS(req.query.preform_id));

// POST /api/qc-data-update/bobbins   body: { spool_ids: [..] }
export const getBobbinsC = run("Get Bobbins", (req) => getBobbinsBySpoolsS(req.body?.spool_ids));

// GET /api/qc-data-update/bobbin?bobbin_no=
export const getBobbinC = run("Get Bobbin", (req) => getBobbinByNoS(req.query.bobbin_no));

// POST /api/qc-data-update/update   body: { bobbin_nos: [..], values: { <param>: "1.23" } }
export const updateC = run("Update", (req) => updateQcValuesS(req.body || {}));
