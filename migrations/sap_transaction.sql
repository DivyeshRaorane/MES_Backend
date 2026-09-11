CREATE TABLE transactions (
    transaction_id        SERIAL PRIMARY KEY,

    -- ── Transaction type: FG | SCRAP | MTM | LTL ──
    type                  VARCHAR(30) NOT NULL,

    -- ── FG confirmation fields (type = FG) ──
    prod_order            VARCHAR(50),          -- released process order (looked up)
    operation             INTEGER,              -- operation number
    conf_qty              NUMERIC(10, 2),       -- confirmed quantity
    fg_batch              VARCHAR(50),          -- finished-goods batch
    fg_material_code      VARCHAR(50),          -- finished-goods material code

    -- ── Component / issuing-material fields (FG comp, SCRAP, MTM, LTL) ──
    comp_material_code    VARCHAR(50),          -- Material  (issuing / component)
    comp_batch            VARCHAR(50),          -- Batch
    comp_quantity         NUMERIC(10, 2),       -- QuantityInEntryUnit

    -- ── Plant / storage location (varchar to keep leading zeros) ──
    plant                 VARCHAR(10),          -- issuing plant
    s_location            VARCHAR(10),          -- issuing storage location

    -- ── Receiving side (LTL requires s_location; MTM requires material) ──
    receiving_plant       VARCHAR(10),          -- IssuingOrReceivingPlant
    receiving_s_location  VARCHAR(10),          -- IssuingOrReceivingStorageLoc (LTL)
    issg_or_rcvg_material VARCHAR(50),          -- IssgOrRcvgMaterial (MTM 309, required)
    receiving_batch       VARCHAR(50),          -- IssuingOrReceivingBatch (MTM optional)

    -- ── Shared / misc ──
    uom                   VARCHAR(10),          -- EntryUnit (KG, etc.)
    inspection_lot        BIGINT,               -- SAP inspection lot (FG / UD)
    ud_required           BOOLEAN NOT NULL DEFAULT false,  -- usage decision needed?

    -- ── Posting state ──
    status                BOOLEAN NOT NULL DEFAULT false,  -- false = pending, true = posted
    created_at            TIMESTAMP WITHOUT TIME ZONE DEFAULT current_timestamp NOT NULL,
    updated_at            TIMESTAMP WITHOUT TIME ZONE
);

-- Scheduler pulls pending rows in FIFO order; index helps that query.
CREATE INDEX idx_transactions_pending
    ON transactions (transaction_id)
    WHERE status = false;
