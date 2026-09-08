create table sap_transaction(
    transaction_id serial primary key,
    prod_order varchar(10),
    operation int,
    conf_qty decimal(10,2),
    fg_batch varchar(10),
    fg_material_code varchar(50),
    comp_material_code varchar(20),
    plant int,
    s_location int,
    comp_batch varchar(20),
    comp_quantity decimal(10,2),
    status boolean default false,
    type varchar(10),
    ud_required boolean default false,
    created_at timestamp default current_timestamp,
    updated_at timestamp

)
