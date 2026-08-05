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
            preform_type,
            product_type,
            material_description,
            remarks,
            draw_instruction,
            acceptance_status,
            rejection_note,
            preform_vendor_id,
        }= req.body;

        const emp_id = req.user.emp_id;

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
    preform_type,
    product_type,
    material_description,
    remarks,
    draw_instruction,
    acceptance_status,
    rejection_note,
    logged_in_user:emp_id,
    preform_vendor_id,});

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