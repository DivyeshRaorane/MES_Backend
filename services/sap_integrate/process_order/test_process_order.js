// Standalone runner to test the SAP process-order sync directly in the console.
// Usage:
//   node services/sap_integrate/process_order/test_process_order.js
//   node services/sap_integrate/process_order/test_process_order.js 2026-08-30
import "dotenv/config";
import { syncProcessOrders } from "./process_order.service.js";
import pool from "../../../db/postgres.js";

const run = async () => {
    // Optional: pass a date (YYYY-MM-DD) as a CLI arg; otherwise today is used.
    const dateStr = process.argv[2];

    console.log("SAP_BASE_URL:", process.env.SAP_BASE_URL);
    console.log("SAP_LOGIN_URL:", process.env.SAP_LOGIN_URL);
    console.log("Process Order endpoint:", process.env.SAP_PROCESS_ORDER_ENDPOINT || "getorder");
    console.log("Date:", dateStr || "(today)");
    console.log("-----------------------------------------------------");

    try {
        const summary = await syncProcessOrders(dateStr);
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
