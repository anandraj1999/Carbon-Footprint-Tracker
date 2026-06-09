import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activitiesRouter from "./activities";
import dashboardRouter from "./dashboard";
import tipsRouter from "./tips";
import goalsRouter from "./goals";
import offsetsRouter from "./offsets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activitiesRouter);
router.use(dashboardRouter);
router.use(tipsRouter);
router.use(goalsRouter);
router.use(offsetsRouter);

export default router;
