import { getDrawTowersDashboardS } from "../../../services/dashboard/dashboard_draw.service.js";

export const getDrawTowersDashboardC = async (req, res) => {
  try {
    const data = await getDrawTowersDashboardS();
    res.status(200).json(data);
  } catch (error) {
    console.error("Dashboard Draw Towers Error:", error);
    res.status(500).json({ message: "Failed to load draw tower dashboard" });
  }
};
