import express from "express";
import cors from "cors"
import testRoutes from "./routes/dt1/test_route.js";
import test2Routes from "./routes/dt2/test2_route.js";
import test3Routes from "./routes/dt3/test3_route.js";
import test4Routes from "./routes/dt4/test4_route.js";
import departmetRoutes from "./routes/postgress/department_routes.js"
import userRoutes from "./routes/postgress/user_routes.js"
import preformDataRoutes from "./routes/postgress/preform_data.routes.js"
import { startShedular } from "./schedulars/preform_data.shedular.js";
import preformAcceptRoutes from "./routes/postgress/preform_accept.routes.js"
import handleJoinRoutes from "./routes/postgress/handle_join.routes.js"
import drawTowerRoutes from "./routes/postgress/draw_tower.routes.js"
import preformAllocationRoutes from "./routes/postgress/preform_allocation.routes.js"
import drawEntryRoutes from "./routes/postgress/draw_entry.routes.js"
import towerDataRoutes from "./routes/sql/tower_data.routes.js"
import shiftRoutes from "./routes/postgress/shift.routes.js"
import drawUsersRoutes from "./routes/postgress/draw_user.routes.js"
import windingObservationRoutes from "./routes/postgress/winding_observation.routes.js"
import drawFiberCutReasonRoutes from "./routes/postgress/draw_fiber_cut_reason.route.js"
import ptMachineRoutes from "./routes/postgress/pt_machine.routes.js"
import ptUsersRoutes from "./routes/postgress/pt_user.routes.js"
import ptAllocationRoutes from "./routes/postgress/pt_allocation.routes.js"
import bobbinColorRoutes from "./routes/postgress/bobbin_color.routes.js"
import bobbinTypeRoutes from "./routes/postgress/bobbin_type.routes.js"
import ptEntryRoutes from "./routes/postgress/pt_entry.routes.js"
import materialMasterRoutes from "./routes/postgress/material_master.route.js"
import pvEntryRoutes from "./routes/postgress/pv_entry.routes.js"
import qcUserRoutes from "./routes/postgress/qc_user.routes.js"
import d2ChamberRoutes from "./routes/postgress/d2_chamber.routes.js"
import d2IssueRoutes from "./routes/postgress/d2_issue.routes.js"
import d2GasRoutes from "./routes/postgress/d2_gas.routes.js"
import d2ReceivingRoutes from "./routes/postgress/d2_receiving.routes.js"
import h2ChamberRoutes from "./routes/postgress/h2_chamber.routes.js"
import h2AgeingRoutes from "./routes/postgress/h2_ageing.routes.js"
import qcGradeRoutes from "./routes/postgress/qc_grade.routes.js"
import qcEntryRoutes from "./routes/postgress/qc_entry.routes.js"
import adminUserRoutes from "./routes/postgress/admin_user.routes.js"
import adminDrawMgmtRoutes from "./routes/postgress/admin_draw_management.routes.js"
import adminShiftRoutes from "./routes/postgress/admin_shift.routes.js"
import adminGradeRoutes from "./routes/postgress/admin_grade.routes.js"
import ptMachineLogRoutes from "./routes/postgress/pt_machine_log.routes.js"
import qcOutRoutes from "./routes/postgress/qc_out.routes.js"
import fgRoutes from "./routes/postgress/fg.routes.js"
import adminTrayRoutes from "./routes/postgress/admin_tray.routes.js"
import modulaRoutes from "./routes/postgress/modula.routes.js"
import complaintRoutes from "./routes/postgress/complaint.routes.js"
import adminCustomerRoutes from "./routes/postgress/admin_customer.routes.js"
import orderRoutes from "./routes/postgress/order.routes.js"
import packingRoutes from "./routes/postgress/packing.routes.js"
import drawShiftPlanRoutes from "./routes/postgress/draw_shift_plan.routes.js"
import colouringRoutes from "./routes/postgress/colouring.routes.js"
import rewindingRoutes from "./routes/postgress/rewinding.routes.js"
import breakAnalysisRoutes from "./routes/postgress/break_analysis.routes.js"
import drawReportsRoutes from "./routes/postgress/draw_reports.routes.js"
import tempEntryRoutes from "./routes/postgress/temp_entry.routes.js"
import tempCycleEntryRoutes from "./routes/postgress/temp_cycle_entry.routes.js"
import trhEntryRoutes from "./routes/postgress/trh_entry.routes.js"
import hthaEntryRoutes from "./routes/postgress/htha_entry.routes.js"
import waterImmersionRoutes from "./routes/postgress/water_immersion.routes.js"
import acceleratedAgeingRoutes from "./routes/postgress/accelerated_ageing.routes.js"
import specRoutes from "./routes/postgress/spec.routes.js"
import customerAllocationRoutes from "./routes/postgress/customer_allocation.routes.js"


const app = express();

app.use(cors())
app.use(express.json());

app.use("/api", departmetRoutes)
app.use("/api",userRoutes)
app.use("/api", preformDataRoutes)
app.use("/api", preformAcceptRoutes)
app.use("/api", handleJoinRoutes)
app.use("/api", drawTowerRoutes)
app.use("/api", preformAllocationRoutes)
app.use("/api", drawEntryRoutes)
app.use("/api", shiftRoutes)
app.use("/api", drawUsersRoutes)
app.use("/api", windingObservationRoutes)
app.use("/api", drawFiberCutReasonRoutes)
app.use("/api", ptMachineRoutes)
app.use("/api", ptUsersRoutes)
app.use("/api", ptAllocationRoutes)
app.use("/APi", bobbinColorRoutes)
app.use("/api", bobbinTypeRoutes)
app.use("/api", ptEntryRoutes)
app.use("/api", materialMasterRoutes)
app.use("/api", pvEntryRoutes)
app.use("/api", qcUserRoutes)
app.use("/api", d2ChamberRoutes)
app.use("/api", d2IssueRoutes)
app.use("/api", d2GasRoutes)
app.use("/api", d2ReceivingRoutes)
app.use("/api", h2ChamberRoutes)
app.use("/api", h2AgeingRoutes)
app.use("/api", qcGradeRoutes)
app.use("/api", qcEntryRoutes)
app.use("/api", adminUserRoutes)
app.use("/api", adminDrawMgmtRoutes)
app.use("/api", adminShiftRoutes)
app.use("/api", adminGradeRoutes)
app.use("/api", ptMachineLogRoutes)
app.use("/api", qcOutRoutes)
app.use("/api", fgRoutes)
app.use("/api", adminTrayRoutes)
app.use("/api", modulaRoutes)
app.use("/api", complaintRoutes)
app.use("/api", adminCustomerRoutes)
app.use("/api", orderRoutes)
app.use("/api", packingRoutes)
app.use("/api", drawShiftPlanRoutes)
app.use("/api", colouringRoutes)
app.use("/api", rewindingRoutes)
app.use("/api", breakAnalysisRoutes)
app.use("/api", drawReportsRoutes)
app.use("/api", tempEntryRoutes)
app.use("/api", tempCycleEntryRoutes)
app.use("/api", trhEntryRoutes)
app.use("/api", hthaEntryRoutes)
app.use("/api", waterImmersionRoutes)
app.use("/api", acceleratedAgeingRoutes)
app.use("/api", specRoutes)
app.use("/api", customerAllocationRoutes)

app.use("/api", towerDataRoutes)

app.use("/dt1", testRoutes)
app.use("/dt2", test2Routes)
app.use("/dt3", test3Routes)
app.use("/dt4", test4Routes)



export default app