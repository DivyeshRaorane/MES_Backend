import {
  createFiberColorS,
  getFiberColorS,
  getFiberColorByIdS,
  updateFiberColorS,
} from "../../../services/fiber_color/fiber_color.service.js";

export const createFiberColorC = async (req, res) => {
  try {
    const { color } = req.body;

    if (!color || color.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Color is required",
      });
    }

    const fiberColor = await createFiberColorS({ color });

    res.status(201).json({
      success: true,
      message: "Fiber Color Successfully Created",
      data: fiberColor,
    });
  } catch (error) {
    console.error("Create Fiber Color Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFiberColorC = async (req, res) => {
  try {
    const { is_active } = req.query;

    const fiberColors = await getFiberColorS(
      is_active !== undefined ? is_active === "true" : null
    );

    res.status(200).json({
      success: true,
      data: fiberColors,
    });
  } catch (error) {
    console.error("Get Fiber Color Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFiberColorByIdC = async (req, res) => {
  try {
    const { fiber_color_id } = req.params;

    const fiberColor = await getFiberColorByIdS(fiber_color_id);

    if (!fiberColor) {
      return res.status(404).json({
        success: false,
        message: "Fiber Color not found",
      });
    }

    res.status(200).json({
      success: true,
      data: fiberColor,
    });
  } catch (error) {
    console.error("Get Fiber Color By Id Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateFiberColorC = async (req, res) => {
  try {
    const { fiber_color_id } = req.params;
    const { color, is_active } = req.body;

    const updatedColor = await updateFiberColorS(fiber_color_id, {
      color,
      is_active,
    });

    if (!updatedColor) {
      return res.status(404).json({
        success: false,
        message: "Fiber Color not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updatedColor,
    });
  } catch (error) {
    console.error("Update Fiber Color Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
