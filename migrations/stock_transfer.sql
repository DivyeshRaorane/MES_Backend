-- stock_transfer: queued storage-location-to-storage-location (311) movements.
--
-- Each pending row (transfer = false) is posted to SAP as one
-- to_MaterialDocumentItem by the stock-transfer location-to-location service;
-- on success the row is flagged transfer = true.

create table stock_transfer(
    stock_transfer_id           serial primary key,
    material_code               varchar(20),
    plant                       int,
    storage_location            int,
    batch                       varchar(10),
    recievin_plant              int,
    recieving_storage_location  varchar(20),
    qty                         decimal(10,2),
    uom                         varchar(10),
    transfer                    boolean default false,
    created_at                  timestamp default current_timestamp,
    updated_at                  timestamp
);
