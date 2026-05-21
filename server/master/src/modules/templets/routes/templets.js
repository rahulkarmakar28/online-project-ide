import { Router } from "express";
import { TEMPLATE_NAMES } from "../templateRegistry.js";

const templateRouter = Router();

templateRouter.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        data: TEMPLATE_NAMES,
    });
});

export default templateRouter;
