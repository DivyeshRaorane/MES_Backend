import { createUser,loginService } from "../../../services/user/user_service.js";


export const register_user = async (req,res) =>{
    try{
        const{
            emp_id,
            emp_name,
            emp_mail_id,
            password,
            mobile_no,
            role,
            departments,
        }= req.body;

         if (!emp_id || !emp_name || !password) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

     const user = await createUser({
      emp_id,
      emp_name,
      emp_mail_id,
      password,
      mobile_no,
      role,
      departments,
    });

     return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });


    }catch (error) {
    console.error("Register Error:", error.message);

    // 4. Handle known error
    if (error.message === "User already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    // 5. Server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export const login = async(req,res,next)=>{
    try{
        const {emp_id,password}= req.body;
        

        if (!emp_id || !password){
            return res.status(400).json({
                message:"Email and Password are required"
            });
        }

        const result= await loginService({
            emp_id,password
    });

        return res.status(200).json({
            message:"Login Successful",
            ...result,
        })
    }catch(error){
        return res.status(401).json({
            message:error.message
        })
    }
}

