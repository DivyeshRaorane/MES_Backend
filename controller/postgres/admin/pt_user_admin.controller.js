import {
  getAllPTUsersS,
  createPTUserS,
  updatePTUserS,
  deletePTUserS,
} from "../../../services/admin/pt_user_admin.service.js";

export const getAllPTUsersC = async (req, res) => {
  try {
    const data = await getAllPTUsersS();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get All PT Users Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPTUserC = async (req, res) => {
  try {
    const data = await createPTUserS(req.body);
    res.status(201).json({ success: true, message: "PT User created", data });
  } catch (error) {
    console.error("Create PT User Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updatePTUserC = async (req, res) => {
  try {
    const { id } = req.params;
    await updatePTUserS(id, req.body);
    res.status(200).json({ success: true, message: "PT User updated" });
  } catch (error) {
    console.error("Update PT User Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deletePTUserC = async (req, res) => {
  try {
    const { id } = req.params;
    await deletePTUserS(id);
    res.status(200).json({ success: true, message: "PT User deleted" });
  } catch (error) {
    console.error("Delete PT User Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
