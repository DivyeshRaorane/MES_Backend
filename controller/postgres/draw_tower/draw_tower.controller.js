import { createTowerS,getTowerS } from "../../../services/draw_tower/draw_tower.service.js";

export const createTowerC = async(req,res)=>{
    try{
     const tower = await createTowerS(req.body);

     res.status(201).json({
        success:true,
        message:"Tower Successfully Created",
        data:tower
     });
    }catch(error){
        console.error("Create Tower Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
}

export const getTowerC = async(req,res)=>{
    try{
         const { active } = req.query;

        const towers = await getTowerS(
            active !== undefined ? active === "true" : null
        );

        res.status(200).json({
      success: true,
      data: towers,
    });
    }catch(error){
        console.error("Get Tower Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
}