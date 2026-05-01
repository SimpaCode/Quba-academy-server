import { Router } from "express";
import levelsRouter from "./levels/index";
import userRouter from "./user/index";
// import adminRouter from "./admin/index";
import aiRouter from "./ai/index";

const router = Router();

router.use("/levels", levelsRouter);
router.use("/user", userRouter);
// router.use("/admin", adminRouter);
router.use("/ai", aiRouter);

export default router;
