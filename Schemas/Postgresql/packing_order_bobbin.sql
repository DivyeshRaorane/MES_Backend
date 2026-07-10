CREATE TABLE packing_order_bobbin (
    packing_order_bobbin_id SERIAL PRIMARY KEY,

    packing_order INT NOT NULL
        REFERENCES packing_order(order_no),

    bobbin_no VARCHAR(50) NOT NULL,

    length_km DECIMAL(10,2),

    stack_no VARCHAR(50),
    box_no VARCHAR(50),

    UNIQUE(packing_order, bobbin_no)
);