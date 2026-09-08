-- Central log for every SAP integration call made from services/sap_integrate.
-- One row is written per SAP HTTP call (success or failure). Bulk runs share a
-- correlation_id so all calls in one run can be grouped together.

create table sap_transaction_log(
    log_id            bigserial primary key,

    -- what operation this was
    operation         varchar(50) not null,   -- FG_CONFIRMATION, SCRAP_GOODS_ISSUE,
                                               -- INSPECTION_LOT_UD, STOCK_TRANSFER_MTM,
                                               -- STOCK_TRANSFER_LTL, MATERIAL_STOCK, GET_ORDER
    sap_endpoint      varchar(255),           -- endpoint slug (prdorderconfirmation ...)
    sap_url           text,                   -- full URL called
    http_method       varchar(10) default 'POST',
    movement_type     varchar(10),            -- 309 / 311 / 551 etc. when relevant

    -- outcome
    status            varchar(10) not null,   -- SUCCESS | FAILED
    http_status_code  int,                    -- HTTP / SAP StatusCode (200,201,401,500...)
    sap_status        varchar(5),             -- business status from Data.Status (S | E)
    message           text,                   -- success or error message

    -- business reference keys (nullable, filled when known)
    reference_type    varchar(50),            -- what reference_id means
    reference_id      varchar(100),           -- prod_order / inspection_lot / stock_transfer_id ...
    material_document varchar(50),
    material_code     varchar(50),
    batch             varchar(100),
    inspection_lot    varchar(50),
    prod_order        varchar(50),

    -- correlation for bulk runs
    correlation_id    uuid,
    source_table      varchar(50),            -- sap_transaction / material_move / stock_transfer ...
    source_ids        int[],                  -- affected row ids in the source table

    -- full payloads for debugging
    request_payload   jsonb,
    response_payload  jsonb,
    error_detail      text,

    -- who / when
    triggered_by      varchar(100),
    duration_ms       int,
    created_at        timestamptz not null default now()
);

create index idx_sap_log_operation   on sap_transaction_log (operation);
create index idx_sap_log_status       on sap_transaction_log (status);
create index idx_sap_log_created_at    on sap_transaction_log (created_at desc);
create index idx_sap_log_prod_order    on sap_transaction_log (prod_order);
create index idx_sap_log_inspection    on sap_transaction_log (inspection_lot);
create index idx_sap_log_mat_doc       on sap_transaction_log (material_document);
create index idx_sap_log_correlation   on sap_transaction_log (correlation_id);
