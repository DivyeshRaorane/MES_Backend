create table order_conf(
order_conf_id serial primary key,
order_no varchar(10),
confrmation_no int,
confirmation_counter int,
cancelling_flag boolean default false,
operation_no int,
confirmed_qty decimal(10,2),
gr_document int,
inspection_lot int,
ud boolean default false,
ud_required boolean default false,
fg_batch varchar(10)
)