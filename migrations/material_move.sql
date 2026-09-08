-- material_move: records a product-type upgrade for a bobbin so the physical
-- material movement can be tracked/posted later.
--
-- Populated when a bobbin's final grade drives a product_type upgrade
-- (e.g. final_grade = 'DCA1' -> product_type G652D250 upgraded to G657A1250).
--   existing_product_type = product_type before the upgrade
--   new_product_type      = product_type after the upgrade
--   movement              = false until the corresponding stock movement is done

CREATE TABLE IF NOT EXISTS material_move (
    material_move_id      serial PRIMARY KEY,
    bobbin_no             varchar(10) NOT NULL,
    existing_product_type varchar(20),
    new_product_type      varchar(20),
    qty                   decimal(10,2),
    movement              boolean DEFAULT false,
    created_at            timestamp DEFAULT current_timestamp,
    updated_at            timestamp
);
