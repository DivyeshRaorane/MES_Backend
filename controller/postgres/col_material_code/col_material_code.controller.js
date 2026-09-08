import {
  createColMaterialCodeS,
  getColMaterialCodeS,
  getColMaterialCodeByIdS,
  updateColMaterialCodeS,
} from "../../../services/col_material_code/col_material_code.service.js";

// CREATE
export const createColMaterialCodeC = async (req, res) => {
  try {
    const colMaterialCode = await createColMaterialCodeS(req.body);

    res.status(201).json({
      success: true,
      message: "Col Material Code Successfully Created",
      data: colMaterialCode,
    });
  } catch (error) {
    console.error("Create Col Material Code Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LIST
export const getColMaterialCodeC = async (req, res) => {
  try {
    const { is_active } = req.query;

    const colMaterialCodes = await getColMaterialCodeS(
      is_active !== undefined ? is_active === "true" : null
    );

    res.status(200).json({
      success: true,
      data: colMaterialCodes,
    });
  } catch (error) {
    console.error("Get Col Material Code Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// VIEW (single)
export const getColMaterialCodeByIdC = async (req, res) => {
  try {
    const { col_material_code_id } = req.params;

    const colMaterialCode = await getColMaterialCodeByIdS(col_material_code_id);

    if (!colMaterialCode) {
      return res.status(404).json({
        success: false,
        message: "Col Material Code not found",
      });
    }

    res.status(200).json({
      success: true,
      data: colMaterialCode,
    });
  } catch (error) {
    console.error("Get Col Material Code By Id Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE / EDIT
export const updateColMaterialCodeC = async (req, res) => {
  try {
    const { col_material_code_id } = req.params;
    const { product, color, material_code, is_active } = req.body;

    const updated = await updateColMaterialCodeS(col_material_code_id, {
      product,
      color,
      material_code,
      is_active,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Col Material Code not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Col Material Code Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
