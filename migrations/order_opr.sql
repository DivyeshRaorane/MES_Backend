create table  order_opr(
order_opr_id serial primary key,
order_no varchar(10),
operation_no int,
workcenter varchar(10),
operation_qty decimal(10,2),
activity_1 int,
activity_2 int,
activity_3 int,
activity_4 int,
activity_5 int,
activity_6 int
)