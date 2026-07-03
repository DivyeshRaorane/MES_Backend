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

app.use("/api", towerDataRoutes)

app.use("/dt1", testRoutes)
app.use("/dt2", test2Routes)
app.use("/dt3", test3Routes)
app.use("/dt4", test4Routes)



export default app