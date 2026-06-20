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



app.use("/dt1", testRoutes)
//app.use("/dt2", test2Routes)
//app.use("/dt3", test3Routes)
//app.use("/dt4", test4Routes)



export default app