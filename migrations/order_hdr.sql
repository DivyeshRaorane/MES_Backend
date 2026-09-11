create table order_hdr(
order_no varchar(10) Primary key,
material_code varchar(10),
order_qty decimal(10,2),
uom varchar(10),
gr_qty decimal(10,2),
order_status varchar(20),
order_creation_date date,
updated_at timestamp
)

-- Add storage_location (SAP StorageLocation) to header
ALTER TABLE order_hdr ADD COLUMN IF NOT EXISTS storage_location varchar(10);

-- Order type (DRAW/PT/REW/COLOR) lives in the existing `type` column.
-- Exposed via the API as `order_type` (SELECT type AS order_type).
ALTER TABLE order_hdr ADD COLUMN IF NOT EXISTS type varchar(10);

-- Soft-delete flag. Disabled orders (is_active = false) are hidden from the
-- frontend list and are NOT overwritten by the SAP re-sync. Defaults to true
-- so existing/synced orders remain visible.
ALTER TABLE order_hdr ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
