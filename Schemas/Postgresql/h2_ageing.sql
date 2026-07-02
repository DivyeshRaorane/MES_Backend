CREATE TABLE h2_ageing(
    h2_ageing_id SERIAL PRIMARY KEY,
    d2_batch_id VARCHAR(20) NOT NULL,
    h2_date DATE DEFAULT CURRENT_DATE,
    h2_time TIME DEFAULT CURRENT_TIME,
    h2_operator_id INT NOT NULL,

    befor_date DATE DEFAULT CURRENT_DATE,
    after_date DATE DEFAULT CURRENT_DATE,
    date_14_day DATE DEFAULT CURRENT_DATE,

    attn_1240_before DECIMAL(10,3),
    attn_1240_after DECIMAL(10,3),
    attn_1240_14_days DECIMAL(10,3),

    attn_1310_before DECIMAL(10,3),
    attn_1310_after DECIMAL(10,3),
    attn_1310_14_days DECIMAL(10,3),

    attn_1383_before DECIMAL(10,3),
    attn_1383_after DECIMAL(10,3),
    attn_1383_14_days DECIMAL(10,3),

    attn_1550_before DECIMAL(10,3),
    attn_1550_after DECIMAL(10,3),
    attn_1550_14_days DECIMAL(10,3),

    attn_1625_before DECIMAL(10,3),
    attn_1625_after DECIMAL(10,3),
    attn_1625_14_days DECIMAL(10,3),

    befor_operator_id INT NOT NULL,
    after_operator_id INT NOT NULL,
    date_14_day_operator_id INT NOT NULL,

    CONSTRAINT fk_d2_batch_id_d2_h2_ageing FOREIGN KEY (d2_batch_id) REFERENCES d2_issue(d2_batch_id),


)