import { Router } from "express";
import { registerController, loginController, refreshController, logoutController } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post('/refresh', refreshController)
authRouter.post('/logout', logoutController)

export default authRouter;
