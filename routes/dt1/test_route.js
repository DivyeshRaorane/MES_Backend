import express from "express";
import { testTagTable, testDB } from "../../controller/dt1/test_controller.js";

const router = express.Router();

router.get("/db_test", testDB);
router.get("/gettagtable", testTagTable)

export default router;