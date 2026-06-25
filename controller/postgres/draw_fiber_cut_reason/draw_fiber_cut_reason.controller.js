import { createDrawFiberCutReasonS, getAllDrawFiberCutReasonsS } from "../../../services/draw_fiber_cut_Reason/draw_fiber_cut_reason.service.js";

export const createDrawFiberCutReasonC = async (req, res) => {
    try {
        const createFiberCutReason = await createDrawFiberCutReasonS(req.body);

        return res.status(200).json({
            success: true,
            message: "Draw Fiber Cut Reasons Entry Success",
            data: createFiberCutReason
        });
    } catch (erorr) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Something went wrong:", error,
        })
    }
}

export const getAllDrawFiberCutReasonsC = async (req, res) => {
    try {
        const getFiberCutReasons = await getAllDrawFiberCutReasonsS();

        return res.status(200).json({
            success: true,
            message: "Successfully Get Draw Fiber Cut Reasons Entry",
            data: getFiberCutReasons
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Something went wrong:", error,
        })
    }
}