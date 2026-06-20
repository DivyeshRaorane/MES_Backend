import { preformAccept } from "../../../services/preform_accept/preform_accept.service.js";

export const preformAcceptanceController = async (req, res) => {
    try {
        const {
            preform_id,
            preform_weight,
            charge_weight,
            preform_length,
            charge_length,
            drawing_length,
            material_code,
            dia_variation,
            cut_off,
            mfd,
            accepted_by,
            preform_type_id,
            material_description,
            remarks,
            draw_instruction,
            acceptance_status,
            rejection_note,
            logged_in_user,
        }= req.body;

        const result = await preformAccept({preform_id,
    preform_weight,
    charge_weight,
    preform_length,
    charge_length,
    drawing_length,
    material_code,
    dia_variation,
    cut_off,
    mfd,
    accepted_by,
    preform_type_id,
    material_description,
    remarks,
    draw_instruction,
    acceptance_status,
    rejection_note,
    logged_in_user:1111,});

    return res.status(200).json({
        success:true,
        message:"Preform Accepted Successfully",
        data:result
    });

    }catch(error){
console.error("Acceptance Error:",error.message)

return res.status(500).json({
    success:false,
    message:"Failed to accept preform",
    error:error.message
});
    }
} ;