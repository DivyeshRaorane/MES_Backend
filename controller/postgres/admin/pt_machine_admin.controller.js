import {
  getAllPTMachinesS,
  createPTMachineAdminS,
  updatePTMachineS,
  deletePTMachineS,
} from "../../../services/admin/pt_machine_admin.service.js";

export const getAllPTMachinesC = async (req, res) => {
  try {
    const data = await getAllPTMachinesS();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get All PT Machines Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPTMachineAdminC = async (req, res) => {
  try {
    const data = await createPTMachineAdminS(req.body);
    res.status(201).json({ success: true, message: "PT Machine created", data });
  } catch (error) {
    console.error("Create PT Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updatePTMachineC = async (req, res) => {
  try {
    const { id } = req.params;
    await updatePTMachineS(id, req.body);
    res.status(200).json({ success: true, message: "PT Machine updated" });
  } catch (error) {
    console.error("Update PT Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deletePTMachineC = async (req, res) => {
  try {
    const { id } = req.params;
    await deletePTMachineS(id);
    res.status(200).json({ success: true, message: "PT Machine deleted" });
  } catch (error) {
    console.error("Delete PT Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
