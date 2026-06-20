import { createDepartmentService } from "../../../services/department/department_service.js";

export const addDepartment = async(req,res, next)=>{
    try{
        const {d_name} = req.body;

        if(!d_name){
            return res.ststus(400).json({
                message:"Department name is required",

            });
        }

        const department = await createDepartmentService(d_name)
        res.status(201).json({
      message: 'Department created successfully',
      data: department,
    });
    }catch(err){
        next(err)
    }
};