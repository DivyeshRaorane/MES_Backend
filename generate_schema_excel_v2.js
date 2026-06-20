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
  { header: "FK Reference", key: "fk", width: 45 },
  { header: "Description", key: "desc", width: 40 },
];

ws1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws1.getRow(1).fill = {
  type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" },
};

const tables = [
  // ===== AUTH =====
  { name: "user_table", category: "Auth", columns: [
    { col: "user_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "employee_id", type: "VARCHAR(20)", constraints: "UNIQUE NOT NULL", fk: "", desc: "" },
    { col: "employee_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "employee_email", type: "VARCHAR(150)", constraints: "", fk: "", desc: "" },
    { col: "employee_password", type: "VARCHAR(255)", constraints: "NOT NULL", fk: "", desc: "Hashed" },
    { col: "role", type: "VARCHAR(20)", constraints: "CHECK", fk: "", desc: "user/supervisor/admin" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
    { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  // ===== MASTER TABLES =====
  { name: "department", category: "Master", columns: [
    { col: "department_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "department_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "draw_tower", category: "Master", columns: [
    { col: "tower_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "tower_no", type: "INT", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "furnace_no", type: "INT", constraints: "", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
    { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "master_shift", category: "Master", columns: [
    { col: "shift_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "shift_name", type: "VARCHAR(10)", constraints: "NOT NULL UNIQUE", fk: "", desc: "A, B, C" },
    { col: "start_time", type: "TIME", constraints: "", fk: "", desc: "" },
    { col: "end_time", type: "TIME", constraints: "", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_operator", category: "Master", columns: [
    { col: "operator_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "operator_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "operator_type", type: "VARCHAR(30)", constraints: "CHECK", fk: "", desc: "loading/shift_incharge/die/ground/furnace" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_team", category: "Master", columns: [
    { col: "team_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "team_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "team_type", type: "VARCHAR(30)", constraints: "CHECK", fk: "", desc: "die/ground/furnace" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_preform_type", category: "Master", columns: [
    { col: "preform_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "preform_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "G652D, G657A1" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_product_type", category: "Master", columns: [
    { col: "product_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "product_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_process_type", category: "Master", columns: [
    { col: "process_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "process_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_accept_user", category: "Master", columns: [
    { col: "accept_user_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "emp_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "emp_contract", type: "VARCHAR(20)", constraints: "CHECK", fk: "", desc: "on_roll/off_roll" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_handle_join_user", category: "Master", columns: [
    { col: "join_user_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "emp_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "emp_contract", type: "VARCHAR(20)", constraints: "CHECK", fk: "", desc: "on_roll/off_roll" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_observation", category: "Master", columns: [
    { col: "observation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "observation_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "observation_type", type: "VARCHAR(30)", constraints: "CHECK", fk: "", desc: "winding/scr" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_spool_status", category: "Master", columns: [
    { col: "status_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "status_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_die_clean", category: "Master", columns: [
    { col: "die_clean_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "die_clean_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_coating", category: "Master", columns: [
    { col: "coating_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "coating_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "coating_category", type: "VARCHAR(30)", constraints: "CHECK", fk: "", desc: "primary/secondary/type" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_batch", category: "Master", columns: [
    { col: "batch_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "batch_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "batch_category", type: "VARCHAR(20)", constraints: "CHECK", fk: "", desc: "primary/secondary" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_indication_fiber_cut", category: "Master", columns: [
    { col: "indication_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "indication_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_undefined_reason", category: "Master", columns: [
    { col: "reason_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "reason_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_phase", category: "Master", columns: [
    { col: "phase_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "phase_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  // ===== NEW MASTER TABLES (PT/Rewinding/Colouring) =====
  { name: "master_pt_strain", category: "Master", columns: [
    { col: "strain_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "strain_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_pt_machine", category: "Master", columns: [
    { col: "machine_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "machine_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_bobbin_type", category: "Master", columns: [
    { col: "bobbin_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "bobbin_type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_bobbin_color", category: "Master", columns: [
    { col: "bobbin_color_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "color_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_running_strain", category: "Master", columns: [
    { col: "running_strain_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "strain_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "Strain-A" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_payoff_vibration", category: "Master", columns: [
    { col: "payoff_vibration_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "vibration_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "Normal/High" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_dancer_vibration", category: "Master", columns: [
    { col: "vibration_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "vibration_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "Normal/High" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_bsa_technician", category: "Master", columns: [
    { col: "technician_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "technician_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_main_break_type", category: "Master", columns: [
    { col: "break_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "break_type_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_sub_reason", category: "Master", columns: [
    { col: "sub_reason_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "sub_reason_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "reason_level", type: "VARCHAR(10)", constraints: "CHECK", fk: "", desc: "sub/next_sub" },
    { col: "parent_break_type_id", type: "INT", constraints: "FK", fk: "master_main_break_type(break_type_id)", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_colour", category: "Master", columns: [
    { col: "colour_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "colour_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "Blue, Red" },
    { col: "colour_code", type: "VARCHAR(20)", constraints: "", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_rew_reason", category: "Master", columns: [
    { col: "rew_reason_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "reason_name", type: "VARCHAR(100)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  { name: "master_rew_type", category: "Master", columns: [
    { col: "rew_type_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "type_name", type: "VARCHAR(50)", constraints: "NOT NULL UNIQUE", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
  ]},
  // ===== TRANSACTION TABLES (Draw Tower) =====
  { name: "preform_data", category: "Transaction", columns: [
    { col: "preform_id", type: "VARCHAR(20)", constraints: "PRIMARY KEY", fk: "", desc: "TEF524220" },
    { col: "preform_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
    { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "" },
    { col: "material_code", type: "VARCHAR(20)", constraints: "", fk: "", desc: "" },
    { col: "material_description", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "uom", type: "VARCHAR(10)", constraints: "DEFAULT 'KG'", fk: "", desc: "" },
    { col: "is_active", type: "BOOLEAN", constraints: "DEFAULT TRUE", fk: "", desc: "" },
    { col: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "preform_accept", category: "Transaction", columns: [
    { col: "accept_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
    { col: "preform_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
    { col: "charge_weight", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
    { col: "preform_length/charge_length/drawing_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "material_code", type: "VARCHAR(20)", constraints: "", fk: "", desc: "" },
    { col: "dia_variation/cut_off/mfd", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "accepted_by", type: "INT", constraints: "NOT NULL, FK", fk: "master_accept_user(accept_user_id)", desc: "Dropdown" },
    { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "Dropdown" },
    { col: "acceptance_status", type: "VARCHAR(10)", constraints: "CHECK", fk: "", desc: "accepted/rejected" },
    { col: "rejection_note", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "handle_join", category: "Transaction", columns: [
    { col: "handle_join_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
    { col: "dia1-dia5", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "5 columns" },
    { col: "handle_length/handle_diameter/cone_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "handle_number", type: "INT", constraints: "", fk: "", desc: "" },
    { col: "joined_by", type: "INT", constraints: "NOT NULL, FK", fk: "master_handle_join_user(join_user_id)", desc: "Dropdown" },
    { col: "additional_notes", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "flame_entry", category: "Transaction", columns: [
    { col: "flame_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "handle_join_id", type: "INT", constraints: "NOT NULL, FK", fk: "handle_join(handle_join_id)", desc: "CASCADE" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "FK", fk: "preform_data(preform_id)", desc: "" },
    { col: "parameter_name", type: "VARCHAR(100)", constraints: "NOT NULL", fk: "", desc: "H2 Flow 1, O2 Line 1" },
    { col: "flow_lpm/time_min/consumption_m3", type: "DECIMAL", constraints: "DEFAULT 0", fk: "", desc: "" },
  ]},
  { name: "preform_allocation", category: "Transaction", columns: [
    { col: "allocation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
    { col: "allocation_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "Dropdown" },
    { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
    { col: "operator_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "product_type_id", type: "INT", constraints: "FK", fk: "master_product_type(product_type_id)", desc: "Dropdown" },
    { col: "process_type_id", type: "INT", constraints: "FK", fk: "master_process_type(process_type_id)", desc: "Dropdown" },
    { col: "dia1-dia5/cone_length/average_diameter", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "spool_entry", category: "Transaction", columns: [
    { col: "spool_entry_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "tower_id", type: "INT", constraints: "NOT NULL, FK", fk: "draw_tower(tower_id)", desc: "Dropdown" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "NOT NULL, FK", fk: "preform_data(preform_id)", desc: "" },
    { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
    { col: "All operator IDs", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "4 operator dropdowns" },
    { col: "All observation/status IDs", type: "INT", constraints: "FK", fk: "Various master tables", desc: "Multiple dropdowns" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "spool_draw_flaws", category: "Transaction", columns: [
    { col: "flaw_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "spool_entry_id", type: "INT", constraints: "NOT NULL, FK", fk: "spool_entry(spool_entry_id)", desc: "CASCADE" },
    { col: "flaw_position/flaw_type/flaw_description", type: "DECIMAL/VARCHAR/TEXT", constraints: "", fk: "", desc: "" },
  ]},
  { name: "draw_shift_plan + _detail", category: "Transaction", columns: [
    { col: "plan_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "Header" },
    { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
    { col: "die/ground/furnace_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdowns" },
    { col: "shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "_detail: tower_id", type: "INT", constraints: "FK", fk: "draw_tower(tower_id)", desc: "Per DT row" },
    { col: "_detail: theo_speed/actual_speed/co_num/co_time/etc", type: "DECIMAL/INT", constraints: "DEFAULT 0", fk: "", desc: "" },
  ]},
  { name: "draw_shift_report + _detail", category: "Transaction", columns: [
    { col: "report_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "Header" },
    { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
    { col: "die/ground/furnace_team_id", type: "INT", constraints: "FK", fk: "master_team(team_id)", desc: "Dropdowns" },
    { col: "shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "total_plan/gap/total_draw/total_breaks", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "_detail: plan_fkm/achieved_fkm/drawn_fkm/timeloss cols", type: "DECIMAL/INT", constraints: "DEFAULT 0", fk: "", desc: "Per DT" },
  ]},
  { name: "draw_timeloss_entry + _detail", category: "Transaction", columns: [
    { col: "timeloss_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "Header" },
    { col: "floor_type", type: "VARCHAR(20)", constraints: "CHECK", fk: "", desc: "furnace_floor/ground_floor" },
    { col: "shift_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_shift(shift_id)", desc: "Dropdown" },
    { col: "phase_id", type: "INT", constraints: "FK", fk: "master_phase(phase_id)", desc: "Dropdown" },
    { col: "operator_id/shift_incharge_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdowns" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "_detail: shift entry + furnace + ground cols", type: "DECIMAL/INT", constraints: "DEFAULT 0", fk: "", desc: "Per DT" },
  ]},
  // ===== TRANSACTION TABLES (Proof Testing) =====
  { name: "pt_allocation", category: "Transaction", columns: [
    { col: "pt_allocation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "drawn_spool_barcode", type: "VARCHAR(50)", constraints: "NOT NULL", fk: "", desc: "Scanned" },
    { col: "allocation_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "FK", fk: "preform_data(preform_id)", desc: "Auto" },
    { col: "tower_id", type: "INT", constraints: "FK", fk: "draw_tower(tower_id)", desc: "Auto" },
    { col: "drawn_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "Auto" },
    { col: "product_type_id", type: "INT", constraints: "FK", fk: "master_product_type(product_type_id)", desc: "Auto" },
    { col: "pt_strain_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_pt_strain(strain_id)", desc: "Dropdown" },
    { col: "pt_machine_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_pt_machine(machine_id)", desc: "Dropdown" },
    { col: "allocated_by", type: "INT", constraints: "NOT NULL, FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "shift_incharge_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "remark", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "allocation_status", type: "VARCHAR(20)", constraints: "CHECK", fk: "", desc: "allocated/rejected" },
    { col: "pt_done", type: "BOOLEAN", constraints: "DEFAULT FALSE", fk: "", desc: "" },
    { col: "balance_length", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "pt_entry", category: "Transaction", columns: [
    { col: "pt_entry_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "drawn_spool_id", type: "VARCHAR(50)", constraints: "NOT NULL", fk: "", desc: "Scanned" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "FK", fk: "preform_data(preform_id)", desc: "Auto" },
    { col: "tower_id", type: "INT", constraints: "FK", fk: "draw_tower(tower_id)", desc: "Auto" },
    { col: "pt_machine_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_pt_machine(machine_id)", desc: "Dropdown" },
    { col: "operator_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "shift_incharge_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "bobbin_color_id", type: "INT", constraints: "FK", fk: "master_bobbin_color(bobbin_color_id)", desc: "Dropdown" },
    { col: "bobbin_type_id", type: "INT", constraints: "FK", fk: "master_bobbin_type(bobbin_type_id)", desc: "Dropdown" },
    { col: "running_strain_id", type: "INT", constraints: "FK", fk: "master_running_strain(running_strain_id)", desc: "Dropdown" },
    { col: "payoff_vibration_id", type: "INT", constraints: "FK", fk: "master_payoff_vibration(payoff_vibration_id)", desc: "Dropdown" },
    { col: "dancer_vibration_id", type: "INT", constraints: "FK", fk: "master_dancer_vibration(vibration_id)", desc: "Dropdown" },
    { col: "product_type_id", type: "INT", constraints: "FK", fk: "master_product_type(product_type_id)", desc: "Auto" },
    { col: "rejection flags (7 booleans)", type: "BOOLEAN", constraints: "DEFAULT FALSE", fk: "", desc: "Checkboxes" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "pt_entry_draw_flaw_log", category: "Transaction", columns: [
    { col: "flaw_log_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "pt_entry_id", type: "INT", constraints: "NOT NULL, FK", fk: "pt_entry(pt_entry_id)", desc: "CASCADE" },
    { col: "draw_flaw", type: "VARCHAR(100)", constraints: "", fk: "", desc: "" },
    { col: "pos1/pos2/defect_len/act_cut_len", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
  ]},
  { name: "pt_entry_process_log", category: "Transaction", columns: [
    { col: "process_log_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "pt_entry_id", type: "INT", constraints: "NOT NULL, FK", fk: "pt_entry(pt_entry_id)", desc: "CASCADE" },
    { col: "barcode_id_flaw", type: "VARCHAR(100)", constraints: "", fk: "", desc: "" },
    { col: "length", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
    { col: "reason", type: "TEXT", constraints: "", fk: "", desc: "" },
  ]},
  { name: "pt_break_analysis", category: "Transaction", columns: [
    { col: "break_analysis_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "entry_date", type: "DATE", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "bsa_technician_id", type: "INT", constraints: "NOT NULL, FK", fk: "master_bsa_technician(technician_id)", desc: "Dropdown" },
    { col: "brk_pt_id", type: "VARCHAR(50)", constraints: "", fk: "", desc: "" },
    { col: "main_break_type_id", type: "INT", constraints: "FK", fk: "master_main_break_type(break_type_id)", desc: "Dropdown" },
    { col: "sub_reason_id", type: "INT", constraints: "FK", fk: "master_sub_reason(sub_reason_id)", desc: "Dropdown" },
    { col: "next_sub_reason_id", type: "INT", constraints: "FK", fk: "master_sub_reason(sub_reason_id)", desc: "Dropdown" },
    { col: "dist_from_periphery/particle_size/flaw_size", type: "DECIMAL(10,2)", constraints: "", fk: "", desc: "" },
    { col: "preform_type_id", type: "INT", constraints: "FK", fk: "master_preform_type(preform_type_id)", desc: "" },
    { col: "tower_id", type: "INT", constraints: "FK", fk: "draw_tower(tower_id)", desc: "" },
    { col: "pt_mc_id", type: "INT", constraints: "FK", fk: "master_pt_machine(machine_id)", desc: "" },
    { col: "pt_operator_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "" },
    { col: "preform_id", type: "VARCHAR(20)", constraints: "FK", fk: "preform_data(preform_id)", desc: "" },
    { col: "pt_breaks/breaks_checked/pending", type: "INT", constraints: "DEFAULT 0", fk: "", desc: "" },
    { col: "bsa_remark", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date_ts/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "pt_break_analysis_log", category: "Transaction", columns: [
    { col: "analysis_log_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "break_analysis_id", type: "INT", constraints: "NOT NULL, FK", fk: "pt_break_analysis(break_analysis_id)", desc: "CASCADE" },
    { col: "sr_no", type: "INT", constraints: "", fk: "", desc: "" },
    { col: "spool_id", type: "VARCHAR(50)", constraints: "", fk: "", desc: "" },
    { col: "pt_breaks/break_checked", type: "INT", constraints: "DEFAULT 0", fk: "", desc: "" },
    { col: "pt_brks_per_k/bsa_percent", type: "DECIMAL(10,2)", constraints: "DEFAULT 0", fk: "", desc: "" },
  ]},
  // ===== TRANSACTION TABLES (Rewinding & Colouring) =====
  { name: "rewinding_entry", category: "Transaction", columns: [
    { col: "rewinding_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "spool_id", type: "VARCHAR(50)", constraints: "NOT NULL", fk: "", desc: "Fetched" },
    { col: "colour_id", type: "INT", constraints: "FK", fk: "master_colour(colour_id)", desc: "Auto" },
    { col: "colour_batch_code", type: "VARCHAR(50)", constraints: "", fk: "", desc: "Auto" },
    { col: "rew_reason_id", type: "INT", constraints: "FK", fk: "master_rew_reason(rew_reason_id)", desc: "Dropdown" },
    { col: "length", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
    { col: "rew_type_id", type: "INT", constraints: "FK", fk: "master_rew_type(rew_type_id)", desc: "Dropdown" },
    { col: "machine_id", type: "INT", constraints: "FK", fk: "master_pt_machine(machine_id)", desc: "Dropdown" },
    { col: "fid", type: "VARCHAR(50)", constraints: "", fk: "", desc: "Generated" },
    { col: "scrap_length", type: "DECIMAL(10,3)", constraints: "DEFAULT 0", fk: "", desc: "" },
    { col: "bobbin_type_id", type: "INT", constraints: "FK", fk: "master_bobbin_type(bobbin_type_id)", desc: "Dropdown" },
    { col: "operator_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "bobbin_colour_id", type: "INT", constraints: "FK", fk: "master_bobbin_color(bobbin_color_id)", desc: "Dropdown" },
    { col: "q_remark/remark", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "rewinding_fid_detail", category: "Transaction", columns: [
    { col: "fid_detail_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "rewinding_id", type: "INT", constraints: "NOT NULL, FK", fk: "rewinding_entry(rewinding_id)", desc: "CASCADE" },
    { col: "dfg_id/rewinding_value/scrap_value/balance_value", type: "VARCHAR/DECIMAL", constraints: "", fk: "", desc: "" },
  ]},
  { name: "rewinding_length_allocation", category: "Transaction", columns: [
    { col: "allocation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "rewinding_id", type: "INT", constraints: "NOT NULL, FK", fk: "rewinding_entry(rewinding_id)", desc: "CASCADE" },
    { col: "length/fid/barcode_scrap_id/start_pos/end_pos", type: "DECIMAL/VARCHAR", constraints: "", fk: "", desc: "" },
  ]},
  { name: "rewinding_instructions", category: "Transaction", columns: [
    { col: "instruction_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "rewinding_id", type: "INT", constraints: "NOT NULL, FK", fk: "rewinding_entry(rewinding_id)", desc: "CASCADE" },
    { col: "instruction", type: "TEXT", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "is_selected", type: "BOOLEAN", constraints: "DEFAULT FALSE", fk: "", desc: "Checkbox" },
    { col: "length_km", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
  ]},
  { name: "colouring_entry", category: "Transaction", columns: [
    { col: "colouring_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "spool_id", type: "VARCHAR(50)", constraints: "NOT NULL", fk: "", desc: "Fetched" },
    { col: "colour_id", type: "INT", constraints: "FK", fk: "master_colour(colour_id)", desc: "Auto" },
    { col: "colour_batch_code", type: "VARCHAR(50)", constraints: "", fk: "", desc: "Auto" },
    { col: "rew_reason_id", type: "INT", constraints: "FK", fk: "master_rew_reason(rew_reason_id)", desc: "Dropdown" },
    { col: "length", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
    { col: "rew_type_id", type: "INT", constraints: "FK", fk: "master_rew_type(rew_type_id)", desc: "Dropdown" },
    { col: "machine_id", type: "INT", constraints: "FK", fk: "master_pt_machine(machine_id)", desc: "Dropdown" },
    { col: "fid", type: "VARCHAR(50)", constraints: "", fk: "", desc: "Generated" },
    { col: "scrap_length", type: "DECIMAL(10,3)", constraints: "DEFAULT 0", fk: "", desc: "" },
    { col: "bobbin_type_id", type: "INT", constraints: "FK", fk: "master_bobbin_type(bobbin_type_id)", desc: "Dropdown" },
    { col: "operator_id", type: "INT", constraints: "FK", fk: "master_operator(operator_id)", desc: "Dropdown" },
    { col: "bobbin_colour_id", type: "INT", constraints: "FK", fk: "master_bobbin_color(bobbin_color_id)", desc: "Dropdown" },
    { col: "q_remark/remark", type: "TEXT", constraints: "", fk: "", desc: "" },
    { col: "logged_in_user", type: "INT", constraints: "NOT NULL, FK", fk: "user_table(user_id)", desc: "Who logged in" },
    { col: "entry_date/entry_time", type: "DATE/TIME", constraints: "DEFAULT NOW", fk: "", desc: "" },
  ]},
  { name: "colouring_fid_detail", category: "Transaction", columns: [
    { col: "fid_detail_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "colouring_id", type: "INT", constraints: "NOT NULL, FK", fk: "colouring_entry(colouring_id)", desc: "CASCADE" },
    { col: "dfg_id/rewinding_value/scrap_value/balance_value", type: "VARCHAR/DECIMAL", constraints: "", fk: "", desc: "" },
  ]},
  { name: "colouring_length_allocation", category: "Transaction", columns: [
    { col: "allocation_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "colouring_id", type: "INT", constraints: "NOT NULL, FK", fk: "colouring_entry(colouring_id)", desc: "CASCADE" },
    { col: "length/fid/barcode_scrap_id/start_pos/end_pos", type: "DECIMAL/VARCHAR", constraints: "", fk: "", desc: "" },
  ]},
  { name: "colouring_instructions", category: "Transaction", columns: [
    { col: "instruction_id", type: "SERIAL", constraints: "PRIMARY KEY", fk: "", desc: "" },
    { col: "colouring_id", type: "INT", constraints: "NOT NULL, FK", fk: "colouring_entry(colouring_id)", desc: "CASCADE" },
    { col: "instruction", type: "TEXT", constraints: "NOT NULL", fk: "", desc: "" },
    { col: "is_selected", type: "BOOLEAN", constraints: "DEFAULT FALSE", fk: "", desc: "Checkbox" },
    { col: "length_km", type: "DECIMAL(10,3)", constraints: "", fk: "", desc: "" },
  ]},
];

// Populate Sheet 1
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
  { header: "From Table", key: "from", width: 28 },
  { header: "From Column", key: "fromCol", width: 28 },
  { header: "→", key: "arrow", width: 5 },
  { header: "To Table", key: "to", width: 28 },
  { header: "To Column", key: "toCol", width: 28 },
  { header: "Relationship", key: "rel", width: 15 },
  { header: "Screen", key: "screen", width: 25 },
];
ws2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws2.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };

const relationships = [
  // Draw Tower screens
  { from: "preform_data", fromCol: "preform_type_id", to: "master_preform_type", toCol: "preform_type_id", rel: "N:1", screen: "Base Data" },
  { from: "preform_accept", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "Preform Accept" },
  { from: "preform_accept", fromCol: "accepted_by", to: "master_accept_user", toCol: "accept_user_id", rel: "N:1", screen: "Preform Accept" },
  { from: "preform_accept", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Preform Accept" },
  { from: "handle_join", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "Handle Join" },
  { from: "handle_join", fromCol: "joined_by", to: "master_handle_join_user", toCol: "join_user_id", rel: "N:1", screen: "Handle Join" },
  { from: "handle_join", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Handle Join" },
  { from: "flame_entry", fromCol: "handle_join_id", to: "handle_join", toCol: "handle_join_id", rel: "N:1", screen: "Handle Join" },
  { from: "preform_allocation", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "N:1", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "operator_id", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "Allocation" },
  { from: "preform_allocation", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Allocation" },
  { from: "spool_entry", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "N:1", screen: "Spool Entry" },
  { from: "spool_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Spool Entry" },
  { from: "spool_draw_flaws", fromCol: "spool_entry_id", to: "spool_entry", toCol: "spool_entry_id", rel: "N:1", screen: "Spool Entry" },
  { from: "draw_shift_plan", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "N:1", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "die_team_id", to: "master_team", toCol: "team_id", rel: "N:1", screen: "Shift Plan" },
  { from: "draw_shift_plan", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Shift Plan" },
  { from: "draw_shift_plan_detail", fromCol: "plan_id", to: "draw_shift_plan", toCol: "plan_id", rel: "N:1", screen: "Shift Plan" },
  { from: "draw_shift_plan_detail", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "Shift Plan" },
  { from: "draw_shift_report", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "N:1", screen: "Shift Report" },
  { from: "draw_shift_report", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Shift Report" },
  { from: "draw_shift_report_detail", fromCol: "report_id", to: "draw_shift_report", toCol: "report_id", rel: "N:1", screen: "Shift Report" },
  { from: "draw_shift_report_detail", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "Shift Report" },
  { from: "draw_timeloss_entry", fromCol: "shift_id", to: "master_shift", toCol: "shift_id", rel: "N:1", screen: "Timeloss" },
  { from: "draw_timeloss_entry", fromCol: "phase_id", to: "master_phase", toCol: "phase_id", rel: "N:1", screen: "Timeloss" },
  { from: "draw_timeloss_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Timeloss" },
  { from: "draw_timeloss_detail", fromCol: "timeloss_id", to: "draw_timeloss_entry", toCol: "timeloss_id", rel: "N:1", screen: "Timeloss" },
  { from: "draw_timeloss_detail", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "Timeloss" },
  // PT screens
  { from: "pt_allocation", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_allocation", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_allocation", fromCol: "pt_strain_id", to: "master_pt_strain", toCol: "strain_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_allocation", fromCol: "pt_machine_id", to: "master_pt_machine", toCol: "machine_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_allocation", fromCol: "allocated_by", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_allocation", fromCol: "shift_incharge_id", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_allocation", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "PT Allocation" },
  { from: "pt_entry", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "pt_machine_id", to: "master_pt_machine", toCol: "machine_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "operator_id", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "shift_incharge_id", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "bobbin_color_id", to: "master_bobbin_color", toCol: "bobbin_color_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "bobbin_type_id", to: "master_bobbin_type", toCol: "bobbin_type_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "running_strain_id", to: "master_running_strain", toCol: "running_strain_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "payoff_vibration_id", to: "master_payoff_vibration", toCol: "payoff_vibration_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "dancer_vibration_id", to: "master_dancer_vibration", toCol: "vibration_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry_draw_flaw_log", fromCol: "pt_entry_id", to: "pt_entry", toCol: "pt_entry_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_entry_process_log", fromCol: "pt_entry_id", to: "pt_entry", toCol: "pt_entry_id", rel: "N:1", screen: "PT Entry" },
  { from: "pt_break_analysis", fromCol: "bsa_technician_id", to: "master_bsa_technician", toCol: "technician_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "main_break_type_id", to: "master_main_break_type", toCol: "break_type_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "sub_reason_id", to: "master_sub_reason", toCol: "sub_reason_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "next_sub_reason_id", to: "master_sub_reason", toCol: "sub_reason_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "preform_id", to: "preform_data", toCol: "preform_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "tower_id", to: "draw_tower", toCol: "tower_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "pt_mc_id", to: "master_pt_machine", toCol: "machine_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "PT Break Analysis" },
  { from: "pt_break_analysis_log", fromCol: "break_analysis_id", to: "pt_break_analysis", toCol: "break_analysis_id", rel: "N:1", screen: "PT Break Analysis" },
  // Rewinding & Colouring
  { from: "rewinding_entry", fromCol: "colour_id", to: "master_colour", toCol: "colour_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "rew_reason_id", to: "master_rew_reason", toCol: "rew_reason_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "rew_type_id", to: "master_rew_type", toCol: "rew_type_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "machine_id", to: "master_pt_machine", toCol: "machine_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "bobbin_type_id", to: "master_bobbin_type", toCol: "bobbin_type_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "operator_id", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "bobbin_colour_id", to: "master_bobbin_color", toCol: "bobbin_color_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_fid_detail", fromCol: "rewinding_id", to: "rewinding_entry", toCol: "rewinding_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_length_allocation", fromCol: "rewinding_id", to: "rewinding_entry", toCol: "rewinding_id", rel: "N:1", screen: "Rewinding" },
  { from: "rewinding_instructions", fromCol: "rewinding_id", to: "rewinding_entry", toCol: "rewinding_id", rel: "N:1", screen: "Rewinding" },
  { from: "colouring_entry", fromCol: "colour_id", to: "master_colour", toCol: "colour_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "rew_reason_id", to: "master_rew_reason", toCol: "rew_reason_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "rew_type_id", to: "master_rew_type", toCol: "rew_type_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "machine_id", to: "master_pt_machine", toCol: "machine_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "bobbin_type_id", to: "master_bobbin_type", toCol: "bobbin_type_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "operator_id", to: "master_operator", toCol: "operator_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "bobbin_colour_id", to: "master_bobbin_color", toCol: "bobbin_color_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_entry", fromCol: "logged_in_user", to: "user_table", toCol: "user_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_fid_detail", fromCol: "colouring_id", to: "colouring_entry", toCol: "colouring_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_length_allocation", fromCol: "colouring_id", to: "colouring_entry", toCol: "colouring_id", rel: "N:1", screen: "Colouring" },
  { from: "colouring_instructions", fromCol: "colouring_id", to: "colouring_entry", toCol: "colouring_id", rel: "N:1", screen: "Colouring" },
];

relationships.forEach((r) => {
  ws2.addRow({ from: r.from, fromCol: r.fromCol, arrow: "→", to: r.to, toCol: r.toCol, rel: r.rel, screen: r.screen });
});

// ============ SHEET 3: SCREEN MAPPING ============
const ws3 = workbook.addWorksheet("Screen Mapping", {
  properties: { tabColor: { argb: "FF5B9BD5" } },
});
ws3.columns = [
  { header: "Screen", key: "screen", width: 25 },
  { header: "URL", key: "url", width: 40 },
  { header: "Main Table", key: "mainTable", width: 28 },
  { header: "Child Tables", key: "childTables", width: 50 },
  { header: "Master Tables Used (Dropdowns)", key: "masters", width: 80 },
];
ws3.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws3.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B9BD5" } };

const screens = [
  { screen: "Preform Acceptance", url: "/drawmange/acceptance", mainTable: "preform_accept", childTables: "-", masters: "master_accept_user, master_preform_type, user_table" },
  { screen: "Handle Joining", url: "/drawmange/handlejoining", mainTable: "handle_join", childTables: "flame_entry, preform_diameter", masters: "master_handle_join_user, user_table" },
  { screen: "Preform Allocation", url: "/drawmange/allocation", mainTable: "preform_allocation", childTables: "-", masters: "draw_tower, master_shift, master_operator, master_preform_type, master_product_type, master_process_type, user_table" },
  { screen: "Draw Spool Entry", url: "/drawmange/drawspoolentry", mainTable: "spool_entry", childTables: "spool_draw_flaws", masters: "draw_tower, master_shift, master_operator, master_observation, master_spool_status, master_die_clean, master_coating, master_batch, master_indication_fiber_cut, master_undefined_reason, user_table" },
  { screen: "Draw Shift Plan", url: "/drawmange/drawshiftplan", mainTable: "draw_shift_plan", childTables: "draw_shift_plan_detail", masters: "master_shift, master_team, master_operator, draw_tower, user_table" },
  { screen: "Draw Shift Report", url: "/drawmange/drawshiftreport", mainTable: "draw_shift_report", childTables: "draw_shift_report_detail", masters: "master_shift, master_team, master_operator, draw_tower, user_table" },
  { screen: "Draw Timeloss Entry", url: "/drawmange/drawtimeloss", mainTable: "draw_timeloss_entry", childTables: "draw_timeloss_detail", masters: "master_shift, master_phase, master_operator, draw_tower, user_table" },
  { screen: "PT Allocation", url: "/prooftesting/ptallocation", mainTable: "pt_allocation", childTables: "-", masters: "master_pt_strain, master_pt_machine, master_operator, draw_tower, master_product_type, user_table" },
  { screen: "PT Entry", url: "/prooftesting/ptentry", mainTable: "pt_entry", childTables: "pt_entry_draw_flaw_log, pt_entry_process_log", masters: "master_pt_machine, master_operator, master_bobbin_color, master_bobbin_type, master_running_strain, master_payoff_vibration, master_dancer_vibration, master_product_type, draw_tower, user_table" },
  { screen: "PT Break Analysis", url: "/prooftesting/ptbreakanalysis", mainTable: "pt_break_analysis", childTables: "pt_break_analysis_log", masters: "master_bsa_technician, master_main_break_type, master_sub_reason, master_preform_type, master_pt_machine, master_operator, draw_tower, user_table" },
  { screen: "Rewinding Entry", url: "/prooftesting/rewcoltentry (Rewinding)", mainTable: "rewinding_entry", childTables: "rewinding_fid_detail, rewinding_length_allocation, rewinding_instructions", masters: "master_colour, master_rew_reason, master_rew_type, master_pt_machine, master_bobbin_type, master_operator, master_bobbin_color, user_table" },
  { screen: "Colouring Entry", url: "/prooftesting/rewcoltentry (Colouring)", mainTable: "colouring_entry", childTables: "colouring_fid_detail, colouring_length_allocation, colouring_instructions", masters: "master_colour, master_rew_reason, master_rew_type, master_pt_machine, master_bobbin_type, master_operator, master_bobbin_color, user_table" },
];
screens.forEach((s) => ws3.addRow(s));

// ============ SHEET 4: ER DIAGRAM ============
const ws4 = workbook.addWorksheet("ER Diagram", {
  properties: { tabColor: { argb: "FFED7D31" } },
});
ws4.columns = [{ header: "MES Fiber Optic - Complete Database ER Diagram", key: "line", width: 130 }];
ws4.getRow(1).font = { bold: true, size: 14 };

const diagram = [
  "",
  "══════════════════════════════════════════════════════════════════════════════════════════════════════════",
  "                              MES FIBER OPTIC - COMPLETE DATABASE SCHEMA",
  "══════════════════════════════════════════════════════════════════════════════════════════════════════════",
  "",
  "┌──────────────────────────────────────── MASTER TABLES ────────────────────────────────────────────────┐",
  "│                                                                                                       │",
  "│  [user_table]  [department]  [draw_tower]  [master_shift]  [master_operator]  [master_team]           │",
  "│  [master_preform_type]  [master_product_type]  [master_process_type]  [master_phase]                  │",
  "│  [master_accept_user]  [master_handle_join_user]  [master_observation]  [master_spool_status]         │",
  "│  [master_die_clean]  [master_coating]  [master_batch]  [master_indication_fiber_cut]                  │",
  "│  [master_undefined_reason]  [master_pt_strain]  [master_pt_machine]  [master_bobbin_type]             │",
  "│  [master_bobbin_color]  [master_running_strain]  [master_payoff_vibration]  [master_dancer_vibration] │",
  "│  [master_bsa_technician]  [master_main_break_type]  [master_sub_reason]  [master_colour]              │",
  "│  [master_rew_reason]  [master_rew_type]                                                               │",
  "│                                                                                                       │",
  "└───────────────────────────────────────────────────────────────────────────────────────────────────────┘",
  "",
  "┌──────────────────────── DRAW TOWER MODULE ─────────────────────────┐",
  "│                                                                     │",
  "│                    ┌──────────────┐                                 │",
  "│                    │ preform_data │                                 │",
  "│                    └──────┬───────┘                                 │",
  "│           ┌───────────────┼───────────────┐                        │",
  "│           ▼               ▼               ▼                        │",
  "│  ┌────────────────┐ ┌───────────┐ ┌──────────────────┐            │",
  "│  │ preform_accept │ │handle_join│ │preform_allocation│            │",
  "│  └────────────────┘ └─────┬─────┘ └──────────────────┘            │",
  "│                            │                                        │",
  "│                    ┌───────┴───────┐                               │",
  "│                    ▼               ▼                                │",
  "│           ┌─────────────┐  ┌──────────────┐                       │",
  "│           │ flame_entry │  │preform_diam. │                       │",
  "│           └─────────────┘  └──────────────┘                       │",
  "│                                                                     │",
  "│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐   │",
  "│  │ spool_entry │  │ draw_shift_plan  │  │draw_shift_report   │   │",
  "│  └──────┬──────┘  └────────┬─────────┘  └────────┬───────────┘   │",
  "│         ▼                   ▼                      ▼               │",
  "│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐   │",
  "│  │spool_draw_   │  │ _plan_detail │  │  _report_detail       │   │",
  "│  │flaws         │  └──────────────┘  └───────────────────────┘   │",
  "│  └──────────────┘                                                  │",
  "│                    ┌────────────────────┐                          │",
  "│                    │draw_timeloss_entry │                          │",
  "│                    └────────┬───────────┘                          │",
  "│                             ▼                                       │",
  "│                    ┌────────────────────┐                          │",
  "│                    │ _timeloss_detail   │                          │",
  "│                    └────────────────────┘                          │",
  "└────────────────────────────────────────────────────────────────────┘",
  "",
  "┌──────────────────── PROOF TESTING MODULE ──────────────────────────┐",
  "│                                                                     │",
  "│  ┌───────────────┐     ┌──────────┐     ┌───────────────────┐    │",
  "│  │ pt_allocation │ ──▶ │ pt_entry │     │pt_break_analysis  │    │",
  "│  └───────────────┘     └────┬─────┘     └────────┬──────────┘    │",
  "│                              │                     │               │",
  "│                    ┌─────────┼─────────┐          ▼               │",
  "│                    ▼                    ▼  ┌──────────────────┐   │",
  "│         ┌──────────────────┐ ┌────────────┐│pt_break_analysis│   │",
  "│         │pt_entry_draw_    │ │pt_entry_   ││_log             │   │",
  "│         │flaw_log          │ │process_log │└──────────────────┘   │",
  "│         └──────────────────┘ └────────────┘                       │",
  "└────────────────────────────────────────────────────────────────────┘",
  "",
  "┌──────────────── REWINDING & COLOURING MODULE ──────────────────────┐",
  "│                                                                      │",
  "│  ┌──────────────────┐              ┌──────────────────┐             │",
  "│  │ rewinding_entry  │              │ colouring_entry  │             │",
  "│  └────────┬─────────┘              └────────┬─────────┘             │",
  "│           │                                  │                       │",
  "│     ┌─────┼──────────┐               ┌──────┼──────────┐           │",
  "│     ▼     ▼          ▼               ▼      ▼          ▼           │",
  "│  ┌─────┐┌──────┐┌──────────┐  ┌─────┐┌──────┐┌──────────┐        │",
  "│  │_fid ││_len_ ││_instruct.│  │_fid ││_len_ ││_instruct.│        │",
  "│  │det. ││alloc.││          │  │det. ││alloc.││          │        │",
  "│  └─────┘└──────┘└──────────┘  └─────┘└──────┘└──────────┘        │",
  "└──────────────────────────────────────────────────────────────────────┘",
  "",
  "══════════════════════════════════════════════════════════════════════════════════════════════════════════",
  "LEGEND:",
  "  • All transaction tables have: logged_in_user → user_table(user_id)",
  "  • All transaction tables have: entry_date + entry_time (auto-filled on submit)",
  "  • All dropdown fields reference their respective master_* table via FK",
  "  • Header-Detail pattern: plan/report/timeloss have _detail child tables (per DT row)",
  "  • Total tables: 30 master + 20 transaction = 50 tables",
  "══════════════════════════════════════════════════════════════════════════════════════════════════════════",
];

diagram.forEach((line) => ws4.addRow({ line }));
ws4.eachRow((row, rowNumber) => {
  if (rowNumber > 1) row.font = { name: "Consolas", size: 10 };
});

// ============ SAVE ============
const filePath = "./Schemas/MES_Database_Schema.xlsx";
await workbook.xlsx.writeFile(filePath);
console.log(`Excel generated: ${filePath}`);
console.log(`Total tables defined: ${tables.length}`);
console.log(`Total relationships: ${relationships.length}`);
