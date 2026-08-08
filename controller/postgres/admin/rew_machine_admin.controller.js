import {
  getAllRewMachinesS,
  createRewMachineS,
  updateRewMachineS,
  deleteRewMachineS,
} from "../../../services/admin/rew_machine_admin.service.js";

export const getAllRewMachinesC = async (req, res) => {
  try {
    const data = await getAllRewMachinesS();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get All Rewinding Machines Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRewMachineC = async (req, res) => {
  try {
    const data = await createRewMachineS(req.body);
    res.status(201).json({ success: true, message: "Rewinding Machine created", data });
  } catch (error) {
    console.error("Create Rewinding Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updateRewMachineC = async (req, res) => {
  try {
    const { id } = req.params;
    await updateRewMachineS(id, req.body);
    res.status(200).json({ success: true, message: "Rewinding Machine updated" });
  } catch (error) {
    console.error("Update Rewinding Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteRewMachineC = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteRewMachineS(id);
    res.status(200).json({ success: true, message: "Rewinding Machine deleted" });
  } catch (error) {
    console.error("Delete Rewinding Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
