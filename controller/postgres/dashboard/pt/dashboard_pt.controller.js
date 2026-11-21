import { getPtMachinesDashboardS } from "../../../../services/dashboard/pt/dashboard_pt.service.js";

export const getPtMachinesDashboardC = async (req, res) => {
  try {
    const data = await getPtMachinesDashboardS();
    res.status(200).json(data);
  } catch (error) {
    console.error("Dashboard PT Machines Error:", error);
    res.status(500).json({ message: "Failed to load PT machine dashboard" });
  }
};
