// Standalone runner to test the SAP material-stock sync directly in the console.
// Usage:
//   node services/sap_integrate/preform_data/test_material_stock.js
//   node services/sap_integrate/preform_data/test_material_stock.js 000000001000000004,000000001000000005
import "dotenv/config";
import { syncMaterialStock } from "./material_stock.service.js";
import pool from "../../../db/postgres.js";

const run = async () => {
    // Optional: pass materials as a comma-separated CLI arg; otherwise .env list is used
    const arg = process.argv[2];
    const materials = arg ? arg.split(",").map((m) => m.trim()).filter(Boolean) : undefined;

    console.log("SAP_BASE_URL:", process.env.SAP_BASE_URL);
    console.log("Materials:", materials || process.env.SAP_MATERIAL_STOCK_MATERIALS);
    console.log("-----------------------------------------------------");

    try {
        const summary = await syncMaterialStock(materials);
        console.log("SYNC SUMMARY:");
        console.dir(summary, { depth: null });
    } catch (error) {
        console.error("SYNC FAILED:", error.message);
        if (error.response) {
            console.error("HTTP status:", error.response.status);
            console.error("Response body:", JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await pool.end();
    }
};

run();
