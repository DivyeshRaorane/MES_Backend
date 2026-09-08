create table  order_comp(
order_comp_id serial primary key,
order_no varchar(10),
material_code varchar(20),
mat_desc text,
qty decimal(10,2),
uom VARCHAR(10),
movement_type int
)

-- Add storage_location (SAP StorageLocation) to component
ALTER TABLE order_comp ADD COLUMN IF NOT EXISTS storage_location varchar(10);
