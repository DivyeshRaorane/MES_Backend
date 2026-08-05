import { createPreformVendorS, getPreformVendorS, updatePreformVendorS } from "../../../services/preform_vendor/preform_vendor.service.js";

export const getPreformVendorC = async (req, res) => {
  try {
    const vendors = await getPreformVendorS();

    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Get Preform Vendor Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPreformVendorC = async (req, res) => {
  try {
    const { vendor_name, vendor_initial } = req.body;

    if (!vendor_name || !vendor_initial) {
      return res.status(400).json({
        success: false,
        message: "vendor_name and vendor_initial are required",
      });
    }

    if (vendor_initial.length > 10) {
      return res.status(400).json({
        success: false,
        message: "vendor_initial must be max 10 characters",
      });
    }

    const vendor = await createPreformVendorS(req.body);

    res.status(201).json({
      success: true,
      message: "Preform vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("Create Preform Vendor Error:", error);

    if (error.message === "Vendor name or initial already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePreformVendorC = async (req, res) => {
  try {
    const { preform_vendor_id } = req.params;
    const { vendor_code, vendor_name, vendor_initial, is_disable } = req.body;

    if (!vendor_name || !vendor_initial) {
      return res.status(400).json({
        success: false,
        message: "vendor_name and vendor_initial are required",
      });
    }

    if (vendor_initial.length > 10) {
      return res.status(400).json({
        success: false,
        message: "vendor_initial must be max 10 characters",
      });
    }

    const updatedVendor = await updatePreformVendorS(preform_vendor_id, {
      vendor_code,
      vendor_name,
      vendor_initial,
      is_disable,
    });

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Preform vendor updated successfully",
      data: updatedVendor,
    });
  } catch (error) {
    console.error("Update Preform Vendor Error:", error);

    if (error.message === "Vendor name or initial already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
