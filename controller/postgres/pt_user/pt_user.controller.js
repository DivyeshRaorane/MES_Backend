import { createPTUsersS, getPTUsersS } from "../../../services/pt_user/pt_user.service.js";

export const createPTUsersC = async (req, res) => {
    try {
        const createPTUser = await createPTUsersS(req.body);

        return res.status(200).json({
            success: true,
            messgae: "PT User Successfully Create",
            data: createPTUser
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            messgae: "PT User Creation Failed:", error,

        })

    }
}

export const getPTUsersC = async(req,res)=>{
    try{

        const getPTUsers = await getPTUsersS();

        return res.status(200).json({
            success: true,
            messgae: "PT User Successfully Get",
            data: getPTUsers
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            messgae: "Get PT User Failed:", error,

        })
    }
}