import { fetchTowerAllEventsS } from "../../services/sql/tower_data.service.js";

export const fetchTowerAllEventsC = async (req, res) => {
    try {
        const { tower_id, start_date, start_time, end_date, end_time } = req.body;

        console.log("DATA:", req.body)

        const data = await fetchTowerAllEventsS(tower_id, start_date, start_time, end_date, end_time);

        res.status(200).json({
            success: true,
            data
        })
    }catch(error){
        res.status(500).json({
      success: false,
      message: error.message
    });
    }
};