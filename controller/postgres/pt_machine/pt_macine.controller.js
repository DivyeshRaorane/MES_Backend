import { createPTMachineS, getPTMachinesS } from "../../../services/pt_machine/pt_machine.service.js";

export const createPTMachineC = async (req, res) => {
    try {
        const ptMachine = await createPTMachineS(req.body);

        return res.status(200).json({
            success: true,
            message: "PT Machine Create Successfully",
            data: ptMachine
        })
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "PT Machine Creation Failed With:", error,
        })
    }
}

export const getPTMachinesC = async (req, res) => {
    try {
        const { active } = req.query;
        const ptMachine = await getPTMachinesS(
            active !== undefined ? active === "true" : null
        )
        res.status(200).json({
            success: true,
            message: "PT Machines Get Successfully",
            data: ptMachine,
        });
    } catch (error) {
        console.error("Get PT MAchine Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};