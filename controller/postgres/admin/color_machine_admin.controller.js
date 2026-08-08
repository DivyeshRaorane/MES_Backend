import {
  getAllColorMachinesS,
  createColorMachineS,
  updateColorMachineS,
  deleteColorMachineS,
} from "../../../services/admin/color_machine_admin.service.js";

export const getAllColorMachinesC = async (req, res) => {
  try {
    const data = await getAllColorMachinesS();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get All Color Machines Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createColorMachineC = async (req, res) => {
  try {
    const data = await createColorMachineS(req.body);
    res.status(201).json({ success: true, message: "Color Machine created", data });
  } catch (error) {
    console.error("Create Color Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updateColorMachineC = async (req, res) => {
  try {
    const { id } = req.params;
    await updateColorMachineS(id, req.body);
    res.status(200).json({ success: true, message: "Color Machine updated" });
  } catch (error) {
    console.error("Update Color Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteColorMachineC = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteColorMachineS(id);
    res.status(200).json({ success: true, message: "Color Machine deleted" });
  } catch (error) {
    console.error("Delete Color Machine Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
