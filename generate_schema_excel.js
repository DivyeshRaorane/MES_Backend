import ExcelJS from "exceljs";

const workbook = new ExcelJS.Workbook();
workbook.creator = "MES Web API";
workbook.created = new Date();

// ============ SHEET 1: ALL TABLES & COLUMNS ============
const ws1 = workbook.addWorksheet("All Tables", {
  properties: { tabColor: { argb: "FF4472C4" } },
});

ws1.columns = [
  { header: "Table Name", key: "table", width: 30 },
  { header: "Column Name", key: "column", width: 30 },
  { header: "Data Type", key: "type", width: 20 },
  { header: "Constraints", key: "constraints", width: 30 },
  { header: "FK Reference", key: "fk", width: 40 },
  { header: "Description", key: "desc", width: 40 },
];

// Style header
ws1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws1.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

// Define all tables
const tables = [
  {
    name: "user_table",
    category: "Auth",
    columns: [
      { col: "user_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "Auto-increment ID" },
      { col: "employee_id", type: "VARCHAR(20)", constraints: "UNIQUE NOT NULL", fk: "", desc: "Employee code" },
      { col: "employee_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "employee_email", type: "VARCHAR(150)", constraints: "", fk: "", desc: "" },
      { col: "employee_password", type: "VARCHAR(255)", constraints: "NOT NULL", fk: "", desc: "Hashed password" },
      { col: "role", type: "VARCHAR(20)", constraints: "NOT NULL, CHECK", fk: "", desc: "user/supervisor/admin" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "department",
    category: "Master",
    columns: [
      { col: "department_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "department_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_tower",
    category: "Master",
    columns: [
      { col: "tower_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "tower_no", type: "INT", constraints: "NOT NULL UNIQUE", fk: "", desc: "DT1, DT2, etc." },
      { col: "furnace_no", type: "INT", constraints: "", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_shift",
    category: "Master",
    columns: [
      { col: "shift_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "shift_name", type: "VARCHAR(10)", constraints: "NOT NULL UNIQUE", fk: "", desc: "A, B, C" },
      { col: "start_time", type: "TIME", constraints: "", fk: "", desc: "" },
      { col: "end_time", type: "TIME", constraints: "", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_operator",
    category: "Master",
    columns: [
      { col: "operator_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "operator_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "operator_type", type: "VARCHAR(30)", constraints: "NOT NULL, CHECK", fk: "", desc: "loading/shift_incharge/die/ground/furnace" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_team",
    category: "Master",
    columns: [
      { col: "team_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "team_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "team_type", type: "VARCHAR(30)", constraints: "NOT NULL, CHECK", fk: "", desc: "die/ground/furnace" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_preform_type",
    category: "Master",
    columns: [
      { col: "preform_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "preform_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "G652D, G657A1" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_product_type",
    category: "Master",
    columns: [
      { col: "product_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "product_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_process_type",
    category: "Master",
    columns: [
      { col: "process_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "process_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_accept_user",
    category: "Master",
    columns: [
      { col: "accept_user_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "emp_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "emp_contract", type: "VARCHAR(20)", constraints: "NOT NULL, CHECK", fk: "", desc: "on_roll/off_roll" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_handle_join_user",
    category: "Master",
    columns: [
      { col: "join_user_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "emp_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "emp_contract", type: "VARCHAR(20)", constraints: "NOT NULL, CHECK", fk: "", desc: "on_roll/off_roll" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_observation",
    category: "Master",
    columns: [
      { col: "observation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "observation_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "observation_type", type: "VARCHAR(30)", constraints: "NOT NULL, CHECK", fk: "", desc: "winding/scr" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_spool_status",
    category: "Master",
    columns: [
      { col: "status_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "status_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_die_clean",
    category: "Master",
    columns: [
      { col: "die_clean_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "die_clean_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_coating",
    category: "Master",
    columns: [
      { col: "coating_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "coating_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "coating_category", type: "VARCHAR(30)", constraints: "NOT NULL, CHECK", fk: "", desc: "primary/secondary/type" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_batch",
    category: "Master",
    columns: [
      { col: "batch_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "batch_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "batch_category", type: "VARCHAR(20)", constraints: "NOT NULL, CHECK", fk: "", desc: "primary/secondary" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_indication_fiber_cut",
    category: "Master",
    columns: [
      { col: "indication_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "indication_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_undefined_reason",
    category: "Master",
    columns: [
      { col: "reason_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "reason_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "master_phase",
    category: "Master",
    columns: [
      { col: "phase_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "phase_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "preform_data",
    category: "Transaction",
    columns: [
      { col: "preform_id", type: "VARCHAR(20)", constraints: "PRIMARY KEY", fk: "", desc: "e.g. TEF524220" },
      { col: "preform_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
      { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "" },
      { col: "material_code", type: "VARCHAR(20)", constraints: "", fk: "", desc: "" },
      { col: "material_description", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "plant", type: "VARCHAR(10)", constraints: "", fk: "", desc: "" },
      { col: "storage_location", type: "VARCHAR(10)", constraints: "", fk: "", desc: "" },
      { col: "uom", type: "VARCHAR(10)", constraints: "DEFAULT 'KG'", fk: "", desc: "" },
      { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "preform_accept",
    category: "Transaction",
    columns: [
      { col: "accept_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
      { col: "preform_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
      { col: "charge_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
      { col: "preform_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "charge_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "drawing_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "material_code", type: "VARCHAR(20)", constraints: "", fk: "", desc: "" },
      { col: "dia_variation", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "cut_off", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "mfd", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "accepted_by", type: "INT", constraints: "NOT NULL, FK", fk: "master_accept_user(accept_user_id)", desc: "Dropdown" },
      { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "Dropdown" },
      { col: "material_description", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "remarks", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "draw_instruction", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "acceptance_status", type: "VARCHAR(10)", constraints: "NOT NULL, CHECK", fk: "", desc: "accepted/rejected" },
      { col: "rejection_note", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "handle_join",
    category: "Transaction",
    columns: [
      { col: "handle_join_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
      { col: "dia1", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia2", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia3", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia4", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia5", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "handle_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "handle_diameter", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "cone_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "handle_number", type: "INT", constraints: "", fk: "", desc: "" },
      { col: "joined_by", type: "INT", constraints: "NOT NULL, FK", fk: "master_handle_join_user(join_user_id)", desc: "Dropdown" },
      { col: "additional_notes", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "flame_entry",
    category: "Transaction",
    columns: [
      { col: "flame_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "handle_join_id", type: "INT", constraints: "NOT NULL, FK", fk: "handle_join(handle_join_id)", desc: "" },
      { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
      { col: "parameter_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "H2 Flow 1, O2 Line 1 Flow 1, etc." },
      { col: "flow_lpm", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "time_min", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "consumption_m3", type: "DECIMAL(10,3)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "preform_diameter",
    category: "Transaction",
    columns: [
      { col: "diameter_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
      { col: "dia1", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia2", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia3", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia4", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "dia5", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "preform_allocation",
    category: "Transaction",
    columns: [
      { col: "allocation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
      { col: "allocation_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "Dropdown" },
      { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
      { col: "sequence_no", type: "INT", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "operator_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
      { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "" },
      { col: "product_type_id", type: "INT", constraints: "FK", fk: "master_product_type(product_type_id)", desc: "Dropdown" },
      { col: "process_type_id", type: "INT", constraints: "FK", fk: "master_process_type(process_type_id)", desc: "Dropdown" },
      { col: "dia1-dia5", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "5 diameter columns" },
      { col: "cone_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "average_diameter", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "Calculated" },
      { col: "draw_instruction", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "process_remarks", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "spool_entry",
    category: "Transaction",
    columns: [
      { col: "spool_entry_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "Dropdown" },
      { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
      { col: "preform_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
      { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "" },
      { col: "spool_id", type: "VARCHAR(30)", constraints: "", fk: "", desc: "" },
      { col: "product_type_id", type: "INT", constraints: "FK", fk: "master_product_type(product_type_id)", desc: "" },
      { col: "drawn_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
      { col: "drawn_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "balance_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
      { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
      { col: "start_date/time, end_date/time", type: "DATE/TIME", constraints: "", fk: "", desc: "" },
      { col: "spool_number", type: "VARCHAR(30)", constraints: "", fk: "", desc: "" },
      { col: "shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
      { col: "furnace/die/ground_operator_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdowns" },
      { col: "draw_line_speed..uv_air", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "Draw parameters" },
      { col: "winding_observation_id", type: "INT", constraints: "FK", fk: "master_observation(observation_id)", desc: "Dropdown" },
      { col: "scr_observation_id", type: "INT", constraints: "FK", fk: "master_observation(observation_id)", desc: "Dropdown" },
      { col: "die_clean_id", type: "INT", constraints: "FK", fk: "master_die_clean(die_clean_id)", desc: "Dropdown" },
      { col: "spool_status_id", type: "INT", constraints: "FK", fk: "master_spool_status(status_id)", desc: "Dropdown" },
      { col: "indication_fiber_cut_id", type: "INT", constraints: "FK", fk: "master_indication_fiber_cut(indication_id)", desc: "Dropdown" },
      { col: "undefined_reason_id", type: "INT", constraints: "FK", fk: "master_undefined_reason(reason_id)", desc: "Dropdown" },
      { col: "primary/secondary_coating_id", type: "INT", constraints: "FK", fk: "master_coating(coating_id)", desc: "Dropdown" },
      { col: "primary/secondary_batch_id", type: "INT", constraints: "FK", fk: "master_batch(batch_id)", desc: "Dropdown" },
      { col: "process_type_id", type: "INT", constraints: "FK", fk: "master_process_type(process_type_id)", desc: "" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "spool_draw_flaws",
    category: "Transaction",
    columns: [
      { col: "flaw_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "spool_entry_id", type: "INT", constraints: "NOT NULL, FK", fk: "spool_entry(spool_entry_id)", desc: "ON DELETE CASCADE" },
      { col: "flaw_position", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "flaw_type", type: "VARCHAR(50)", constraints: "", fk: "", desc: "" },
      { col: "flaw_description", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_shift_plan",
    category: "Transaction",
    columns: [
      { col: "plan_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "entry_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
      { col: "die_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdown" },
      { col: "ground_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdown" },
      { col: "furnace_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdown" },
      { col: "shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date_ts", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_shift_plan_detail",
    category: "Transaction",
    columns: [
      { col: "plan_detail_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "plan_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_shift_plan(plan_id)", desc: "ON DELETE CASCADE" },
      { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "" },
      { col: "theo_speed", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "actual_speed", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "co_num", type: "INT", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "co_time", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "co_tl", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "fc_tl", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "pm_tl", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "downtime", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "draw_plan", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "shift_time", type: "DECIMAL(10,2)", constraints: "DEFAULT 480", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_shift_report",
    category: "Transaction",
    columns: [
      { col: "report_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "entry_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
      { col: "ground_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdown" },
      { col: "furnace_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdown" },
      { col: "die_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdown" },
      { col: "shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
      { col: "total_plan", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "gap", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "total_draw", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "total_breaks", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date_ts", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_shift_report_detail",
    category: "Transaction",
    columns: [
      { col: "report_detail_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "report_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_shift_report(report_id)", desc: "ON DELETE CASCADE" },
      { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "" },
      { col: "plan_fkm", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "achieved_fkm", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "gap_fkm", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "started_by", type: "VARCHAR(100)", constraints: "", fk: "", desc: "" },
      { col: "preform_seq", type: "INT", constraints: "", fk: "", desc: "" },
      { col: "spool_id", type: "VARCHAR(30)", constraints: "", fk: "", desc: "" },
      { col: "drawn_fkm", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "dc, fc, break_count", type: "INT", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "co/fc/start_up/ramp_up/cobs_timeloss", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "activities_issues", type: "TEXT", constraints: "", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_timeloss_entry",
    category: "Transaction",
    columns: [
      { col: "timeloss_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "floor_type", type: "VARCHAR(20)", constraints: "NOT NULL, CHECK", fk: "", desc: "furnace_floor/ground_floor" },
      { col: "entry_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
      { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
      { col: "phase_id", type: "INT", constraints: "FK", fk: "master_phase(phase_id)", desc: "Dropdown" },
      { col: "operator_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
      { col: "shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
      { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
      { col: "entry_date_ts", type: "DATE", constraints: "DEFAULT CURRENT_DATE", fk: "", desc: "" },
      { col: "entry_time", type: "TIME", constraints: "DEFAULT CURRENT_TIME", fk: "", desc: "" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
  {
    name: "draw_timeloss_detail",
    category: "Transaction",
    columns: [
      { col: "timeloss_detail_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
      { col: "timeloss_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_timeloss_entry(timeloss_id)", desc: "ON DELETE CASCADE" },
      { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "" },
      { col: "ls_th, line_speed, plan, total_drawn", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "Shift Entry" },
      { col: "time_loss", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "break_count", type: "INT", constraints: "DEFAULT 0", fk: "", desc: "" },
      { col: "no_of_co, no_of_join_ts, no_of_sc, fc, co", type: "INT", constraints: "DEFAULT 0", fk: "", desc: "Furnace Floor" },
      { col: "pna_pm..be_lf (11 cols)", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "Ground Floor" },
      { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
    ],
  },
];

// Populate Sheet 1 - All Tables
tables.forEach((table) => {
  table.columns.forEach((col, idx) => {
    ws1.addRow({
      table: idx === 0 ? table.name : "",
      column: col.col,
      type: col.type,
      constraints: col.constraints,
      fk: col.fk,
      desc: col.desc,
    });
  });
  // Add empty row between tables
  ws1.addRow({});
});

// Color code table names
let rowIdx = 2;
tables.forEach((table) => {
  const row = ws1.getRow(rowIdx);
  if (table.category === "Master") {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };
  } else if (table.category === "Transaction") {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE6F1" } };
  } else {
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
  }
  rowIdx += table.columns.length + 1;
});

// ============ SHEET 2: RELATIONSHIPS ============
const ws2 = workbook.addWorksheet("Relationships", {
  properties: { tabColor: { argb: "FF70AD47" } },
});

ws2.columns = [
  { header: "From Table", key: "from", width: 25 },
  { header: "From Column", key: "fromCol", width: 25 },
  { header: "→", key: "arrow", width: 5 },
  { header: "To Table", key: "to", width: 25 },
  { header: "To Column", key: "toCol", width: 25 },
  { header: "Relationship", key: "rel", width: 20 },
  { header: "Screen", key: "screen", width: 25 },
];

ws2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws2.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };

const relationships = [
  { from: "preform_data", fromCol: "preform_type_id", to: "master_preform_type", toCol: "preform_type_id", rel: "Many-to-One", screen: "Base Data" },
  { from: "preform_accept", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "Many-to-One", screen: "Preform Accept" },
  { from: "preform_accept", fromCol: "accepted_by", to: "master_accept_user", toCol: "accept_user_id", rel: "Many-to-One", screen: "Preform Accept" },
  { from: "preform_accept", fromCol: "preform_type_id", to: "master_preform_type", toCol: "preform_type_id", rel: "Many-to-One", screen: "Preform Accept" },
  { from: "preform_accept", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Preform Accept" },
  { from: "handle_join", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "Many-to-One", screen: "Handle Join" },
  { from: "handle_join", fromCol: "joined_by", to: "master_handle_join_user", toCol: "join_user_id", rel: "Many-to-One", screen: "Handle Join" },
  { from: "handle_join", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Handle Join" },
  { from: "flame_entry", fromCol: "handle_join_id", to: "handle_join", toCol: "handle_join_id", rel: "Many-to-One", screen: "Handle Join" },
  { from: "flame_entry", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "Many-to-One", screen: "Handle Join" },
  { from: "preform_diameter", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "Many-to-One", screen: "Handle Join" },
  { from: "preform_allocation", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "operator_id", to: "master_operator", toCol: "operator_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "product_type_id", to: "master_product_type", toCol: "product_type_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "process_type_id", to: "master_process_type", toCol: "process_type_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Allocation" },
  { from: "spool_entry", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "shift_incharge_id", to: "master_operator", toCol: "operator_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "winding_observation_id", to: "master_observation", toCol: "observation_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "scr_observation_id", to: "master_observation", toCol: "observation_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "die_clean_id", to: "master_die_clean", toCol: "die_clean_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "spool_status_id", to: "master_spool_status", toCol: "status_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "indication_fiber_cut_id", to: "master_indication_fiber_cut", toCol: "indication_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "undefined_reason_id", to: "master_undefined_reason", toCol: "reason_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "primary_coating_id", to: "master_coating", toCol: "coating_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "primary_batch_id", to: "master_batch", toCol: "batch_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "process_type_id", to: "master_process_type", toCol: "process_type_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "spool_draw_flaws", fromCol: "spool_entry_id", to: "spool_entry", toCol: "spool_entry_id", rel: "Many-to-One", screen: "Spool Entry" },
  { from: "draw_shift_plan", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "die_team_id", to: "master_team", toCol: "team_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "ground_team_id", to: "master_team", toCol: "team_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "furnace_team_id", to: "master_team", toCol: "team_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "shift_incharge_id", to: "master_operator", toCol: "operator_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan_detail", fromCol: "plan_id", to: "draw_shift_plan", toCol: "plan_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_plan_detail", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "Many-to-One", screen: "Shift Plan" },
  { from: "draw_shift_report", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report", fromCol: "ground_team_id", to: "master_team", toCol: "team_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report", fromCol: "furnace_team_id", to: "master_team", toCol: "team_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report", fromCol: "die_team_id", to: "master_team", toCol: "team_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report", fromCol: "shift_incharge_id", to: "master_operator", toCol: "operator_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report_detail", fromCol: "report_id", to: "draw_shift_report", toCol: "report_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_shift_report_detail", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "Many-to-One", screen: "Shift Report" },
  { from: "draw_timeloss_entry", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "Many-to-One", screen: "Timeloss" },
  { from: "draw_timeloss_entry", fromCol: "phase_id", to: "master_phase", toCol: "phase_id", rel: "Many-to-One", screen: "Timeloss" },
  { from: "draw_timeloss_entry", fromCol: "operator_id", to: "master_operator", toCol: "operator_id", rel: "Many-to-One", screen: "Timeloss" },
  { from: "draw_timeloss_entry", fromCol: "shift_incharge_id", to: "master_operator", toCol: "operator_id", rel: "Many-to-One", screen: "Timeloss" },
  { from: "draw_timeloss_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "Many-to-One", screen: "Timeloss" },
  { from: "draw_timeloss_detail", fromCol: "timeloss_id", to: "draw_timeloss_entry", toCol: "timeloss_id", rel: "Many-to-One", screen: "Timeloss" },
  { from: "draw_timeloss_detail", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "Many-to-One", screen: "Timeloss" },
];

relationships.forEach((r) => {
  ws2.addRow({ from: r.from, fromCol: r.fromCol, arrow: "→", to: r.to, toCol: r.toCol, rel: r.rel, screen: r.screen });
});

// ============ SHEET 3: ER DIAGRAM (Text-based) ============
const ws3 = workbook.addWorksheet("ER Diagram", {
  properties: { tabColor: { argb: "FFED7D31" } },
});

ws3.columns = [
  { header: "Entity Relationship Diagram", key: "line", width: 120 },
];
ws3.getRow(1).font = { bold: true, size: 14 };

const diagram = [
  "",
  "═══════════════════════════════════════════════════════════════════════════════════════",
  "                         MES FIBER OPTIC - DATABASE SCHEMA DIAGRAM",
  "═══════════════════════════════════════════════════════════════════════════════════════",
  "",
  "┌─────────────────────────────── MASTER TABLES ───────────────────────────────────┐",
  "│                                                                                  │",
  "│  [user_table]  [master_shift]  [master_operator]  [master_team]  [draw_tower]   │",
  "│  [master_preform_type]  [master_product_type]  [master_process_type]             │",
  "│  [master_accept_user]  [master_handle_join_user]  [master_phase]                 │",
  "│  [master_observation]  [master_spool_status]  [master_die_clean]                 │",
  "│  [master_coating]  [master_batch]  [master_indication_fiber_cut]                 │",
  "│  [master_undefined_reason]  [department]                                         │",
  "│                                                                                  │",
  "└──────────────────────────────────────────────────────────────────────────────────┘",
  "",
  "┌─────────────────────────── TRANSACTION FLOW ───────────────────────────────────┐",
  "│                                                                                 │",
  "│                          ┌──────────────┐                                       │",
  "│                          │ preform_data │  (Base preform from SAP)               │",
  "│                          └──────┬───────┘                                       │",
  "│                                 │                                                │",
  "│              ┌──────────────────┼──────────────────┐                            │",
  "│              │                  │                   │                            │",
  "│              ▼                  ▼                   ▼                            │",
  "│   ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐                │",
  "│   │ preform_accept  │  │ handle_join  │  │ preform_allocation │                │",
  "│   │ (Screen 1)      │  │ (Screen 2)   │  │ (Screen 3)         │                │",
  "│   └─────────────────┘  └──────┬───────┘  └────────────────────┘                │",
  "│                                │                                                 │",
  "│                    ┌───────────┼───────────┐                                    │",
  "│                    │           │           │                                     │",
  "│                    ▼           ▼           ▼                                     │",
  "│          ┌──────────────┐ ┌───────────┐ ┌──────────────────┐                   │",
  "│          │ flame_entry  │ │ preform_  │ │                  │                   │",
  "│          │ (child rows) │ │ diameter  │ │                  │                   │",
  "│          └──────────────┘ └───────────┘ │                  │                   │",
  "│                                          │                  │                   │",
  "│                          ┌───────────────┘                  │                   │",
  "│                          ▼                                   │                   │",
  "│               ┌─────────────────┐                           │                   │",
  "│               │  spool_entry    │ (Screen 4)                │                   │",
  "│               └────────┬────────┘                           │                   │",
  "│                        │                                     │                   │",
  "│                        ▼                                     │                   │",
  "│               ┌─────────────────┐                           │                   │",
  "│               │spool_draw_flaws │ (child rows)              │                   │",
  "│               └─────────────────┘                           │                   │",
  "│                                                              │                   │",
  "│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────────────────┐       │",
  "│  │ draw_shift_plan  │  │draw_shift_report  │  │ draw_timeloss_entry   │       │",
  "│  │ (Screen 5)       │  │(Screen 6)         │  │ (Screen 7)            │       │",
  "│  └────────┬─────────┘  └────────┬──────────┘  └───────────┬────────────┘       │",
  "│           │                      │                          │                    │",
  "│           ▼                      ▼                          ▼                    │",
  "│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────────────────┐       │",
  "│  │ _plan_detail     │  │ _report_detail    │  │ _timeloss_detail      │       │",
  "│  │ (per DT row)     │  │ (per DT row)      │  │ (per DT row)          │       │",
  "│  └──────────────────┘  └───────────────────┘  └────────────────────────┘       │",
  "│                                                                                 │",
  "└─────────────────────────────────────────────────────────────────────────────────┘",
  "",
  "═══════════════════════════════════════════════════════════════════════════════════════",
  "LEGEND:",
  "  • All transaction tables have: logged_in_user → user_table(user_id)",
  "  • All transaction tables have: entry_date + entry_time (auto-filled)",
  "  • All dropdown fields reference their respective master_* table",
  "  • Header-Detail pattern: plan/report/timeloss have _detail child tables (per DT)",
  "═══════════════════════════════════════════════════════════════════════════════════════",
];

diagram.forEach((line) => {
  ws3.addRow({ line });
});

// Set monospace font for diagram
ws3.eachRow((row, rowNumber) => {
  if (rowNumber > 1) {
    row.font = { name: "Consolas", size: 10 };
  }
});

// ============ SHEET 4: SCREEN MAPPING ============
const ws4 = workbook.addWorksheet("Screen Mapping", {
  properties: { tabColor: { argb: "FF5B9BD5" } },
});

ws4.columns = [
  { header: "Screen", key: "screen", width: 25 },
  { header: "URL", key: "url", width: 35 },
  { header: "Main Table", key: "mainTable", width: 25 },
  { header: "Child Tables", key: "childTables", width: 35 },
  { header: "Master Tables Used", key: "masters", width: 60 },
];

ws4.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws4.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B9BD5" } };

const screens = [
  { screen: "Preform Acceptance", url: "/drawmange/acceptance", mainTable: "preform_accept", childTables: "-", masters: "master_accept_user, master_preform_type, user_table" },
  { screen: "Handle Joining", url: "/drawmange/handlejoining", mainTable: "handle_join", childTables: "flame_entry, preform_diameter", masters: "master_handle_join_user, user_table" },
  { screen: "Preform Allocation", url: "/drawmange/allocation", mainTable: "preform_allocation", childTables: "-", masters: "draw_tower, master_shift, master_operator, master_preform_type, master_product_type, master_process_type, user_table" },
  { screen: "Draw Spool Entry", url: "/drawmange/drawspoolentry", mainTable: "spool_entry", childTables: "spool_draw_flaws", masters: "draw_tower, master_shift, master_operator, master_preform_type, master_product_type, master_observation, master_spool_status, master_die_clean, master_coating, master_batch, master_indication_fiber_cut, master_undefined_reason, master_process_type, user_table" },
  { screen: "Draw Shift Plan", url: "/drawmange/drawshiftplan", mainTable: "draw_shift_plan", childTables: "draw_shift_plan_detail", masters: "master_shift, master_team, master_operator, draw_tower, user_table" },
  { screen: "Draw Shift Report", url: "/drawmange/drawshiftreport", mainTable: "draw_shift_report", childTables: "draw_shift_report_detail", masters: "master_shift, master_team, master_operator, draw_tower, user_table" },
  { screen: "Draw Timeloss Entry", url: "/drawmange/drawtimeloss", mainTable: "draw_timeloss_entry", childTables: "draw_timeloss_detail", masters: "master_shift, master_phase, master_operator, draw_tower, user_table" },
];

screens.forEach((s) => ws4.addRow(s));

// ============ SAVE FILE ============
const filePath = "./Schemas/MES_Database_Schema.xlsx";
await workbook.xlsx.writeFile(filePath);
console.log(`Excel file generated: ${filePath}`);
