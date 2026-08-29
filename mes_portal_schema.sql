--
-- PostgreSQL database dump
--

\restrict Z6odKLe58g2KI7vBbM0LnYwvxSbsZdNGtgABJ8tzOhlzXc6agYpXCeGgo9cCg5t

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aat_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aat_day_entry (
    aat_day_entry_id integer NOT NULL,
    aat_entry_id integer,
    bobbin_no character varying(50),
    aat_date date,
    aat_day integer,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.aat_day_entry OWNER TO postgres;

--
-- Name: aat_day_entry_aat_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aat_day_entry_aat_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aat_day_entry_aat_day_entry_id_seq OWNER TO postgres;

--
-- Name: aat_day_entry_aat_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aat_day_entry_aat_day_entry_id_seq OWNED BY public.aat_day_entry.aat_day_entry_id;


--
-- Name: aat_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aat_entry (
    aat_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    title character varying(200),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    temp numeric(10,3),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.aat_entry OWNER TO postgres;

--
-- Name: aat_entry_aat_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aat_entry_aat_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aat_entry_aat_entry_id_seq OWNER TO postgres;

--
-- Name: aat_entry_aat_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aat_entry_aat_entry_id_seq OWNED BY public.aat_entry.aat_entry_id;


--
-- Name: bobbin_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bobbin_color (
    bobbin_color_id integer NOT NULL,
    bobbin_color_name character varying(20) NOT NULL,
    is_disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bobbin_color OWNER TO postgres;

--
-- Name: bobbin_color_bobbin_color_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bobbin_color_bobbin_color_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bobbin_color_bobbin_color_id_seq OWNER TO postgres;

--
-- Name: bobbin_color_bobbin_color_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bobbin_color_bobbin_color_id_seq OWNED BY public.bobbin_color.bobbin_color_id;


--
-- Name: bobbin_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bobbin_entries (
    fid_create_id integer NOT NULL,
    fid character varying(20) NOT NULL,
    spool_id character varying(20) NOT NULL,
    bobbin_no character varying(20) NOT NULL,
    tower_no integer,
    pt_machine_no integer,
    fiber_length numeric(10,2) NOT NULL,
    drawn_date date NOT NULL,
    pt_date date NOT NULL,
    drawn_length numeric(10,2),
    operator character varying(50),
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_pv boolean DEFAULT false,
    preform_type character varying(50),
    product_type character varying(50),
    spool_fid character varying(50),
    preform_id character varying(20),
    fiber_type character varying(50),
    fiber_color character varying(50),
    d2_issue boolean DEFAULT false,
    is_d2 boolean DEFAULT false,
    is_h2 boolean DEFAULT false,
    h2_issue boolean DEFAULT false,
    d2_batch_id character varying(50),
    h2_batch_id character varying(50),
    temp_grade character varying(50),
    final_grade character varying(50),
    lock boolean DEFAULT false,
    is_qc_out boolean DEFAULT false,
    dispatch_status character varying(20) DEFAULT 'NO'::character varying,
    is_h2_after boolean DEFAULT false,
    pt_strain integer,
    CONSTRAINT bobbin_entries_dispatch_status_check CHECK (((dispatch_status)::text = ANY ((ARRAY['NO'::character varying, 'YES'::character varying, 'COLOR'::character varying, 'REW'::character varying, 'PACKED'::character varying])::text[])))
);


ALTER TABLE public.bobbin_entries OWNER TO postgres;

--
-- Name: bobbin_entries_fid_create_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bobbin_entries_fid_create_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bobbin_entries_fid_create_id_seq OWNER TO postgres;

--
-- Name: bobbin_entries_fid_create_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bobbin_entries_fid_create_id_seq OWNED BY public.bobbin_entries.fid_create_id;


--
-- Name: bobbin_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bobbin_type (
    bobbin_type_id integer NOT NULL,
    bobbin_type_name character varying(20) NOT NULL,
    is_disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bobbin_type OWNER TO postgres;

--
-- Name: bobbin_type_bobbin_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bobbin_type_bobbin_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bobbin_type_bobbin_type_id_seq OWNER TO postgres;

--
-- Name: bobbin_type_bobbin_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bobbin_type_bobbin_type_id_seq OWNED BY public.bobbin_type.bobbin_type_id;


--
-- Name: bom_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom_master (
    bom_id integer NOT NULL,
    material_code character varying(50) NOT NULL,
    material_desc text,
    component_material_code character varying(50) NOT NULL,
    component_material_desc text,
    consume_qty_per_km numeric(10,3) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bom_master OWNER TO postgres;

--
-- Name: bom_master_bom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bom_master_bom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_master_bom_id_seq OWNER TO postgres;

--
-- Name: bom_master_bom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bom_master_bom_id_seq OWNED BY public.bom_master.bom_id;


--
-- Name: coloring_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coloring_entry (
    colouring_id integer NOT NULL,
    bobbin_no character varying(20) CONSTRAINT coloring_entry_spool_no_not_null NOT NULL,
    original_color character varying(30),
    current_color character varying(30),
    color_batch_code character varying(50),
    fiber_length numeric(10,3),
    fid character varying(50),
    machine_no integer,
    is_scrap boolean DEFAULT false,
    bobbin_type character varying(50),
    operator character varying(50),
    bobbin_color character varying(50),
    remark text,
    logged_in_user character varying(50) NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    die_change character varying(20)
);


ALTER TABLE public.coloring_entry OWNER TO postgres;

--
-- Name: coloring_entry_colouring_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coloring_entry_colouring_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coloring_entry_colouring_id_seq OWNER TO postgres;

--
-- Name: coloring_entry_colouring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coloring_entry_colouring_id_seq OWNED BY public.coloring_entry.colouring_id;


--
-- Name: customer_complaint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_complaint (
    complaint_id character varying(50) NOT NULL,
    complaint_type character varying(50),
    customer_name character varying(100) NOT NULL,
    raised_by integer NOT NULL,
    complaint_date date,
    closed_date date,
    product_details text,
    po_no character varying(50),
    po_quantity numeric(10,3),
    reject_quantity numeric(10,3),
    shipment_date date,
    grn_no character varying(50),
    test_cert_no character varying(50),
    complaint_feedback text,
    complaint_status character varying(20) DEFAULT 'open'::character varying,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_complaint_complaint_status_check CHECK (((complaint_status)::text = ANY ((ARRAY['open'::character varying, 'close'::character varying])::text[])))
);


ALTER TABLE public.customer_complaint OWNER TO postgres;

--
-- Name: customer_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_table (
    customer_id integer NOT NULL,
    customer_name character varying(150),
    customer_since date,
    disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cust_address text
);


ALTER TABLE public.customer_table OWNER TO postgres;

--
-- Name: customer_table_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_table_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_table_customer_id_seq OWNER TO postgres;

--
-- Name: customer_table_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_table_customer_id_seq OWNED BY public.customer_table.customer_id;


--
-- Name: d2_chamber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_chamber (
    d2_chamber_id integer NOT NULL,
    d2_chamber_no integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.d2_chamber OWNER TO postgres;

--
-- Name: d2_chamber_d2_chamber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_chamber_d2_chamber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_chamber_d2_chamber_id_seq OWNER TO postgres;

--
-- Name: d2_chamber_d2_chamber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_chamber_d2_chamber_id_seq OWNED BY public.d2_chamber.d2_chamber_id;


--
-- Name: d2_gas_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_gas_entry (
    d2_gas_id integer NOT NULL,
    d2_batch_id character varying(20) NOT NULL,
    d2_chamber integer NOT NULL,
    gas_concentration numeric(10,3) NOT NULL,
    fresh_gas numeric(10,3) NOT NULL,
    used_gas numeric(10,3) NOT NULL,
    n2_gas numeric(10,3) NOT NULL,
    tank_pressure numeric(10,3),
    gas_issue_date date,
    gas_issue_time time without time zone,
    cycle_time_min integer,
    d2_gas_operator character varying(50),
    total_bobbins integer,
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shift character varying(10)
);


ALTER TABLE public.d2_gas_entry OWNER TO postgres;

--
-- Name: d2_gas_entry_d2_gas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_gas_entry_d2_gas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_gas_entry_d2_gas_id_seq OWNER TO postgres;

--
-- Name: d2_gas_entry_d2_gas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_gas_entry_d2_gas_id_seq OWNED BY public.d2_gas_entry.d2_gas_id;


--
-- Name: d2_issue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_issue (
    d2_isseue_id integer NOT NULL,
    d2_batch_id character varying(20) NOT NULL,
    start_operator character varying(50),
    d2_start_date date,
    d2_start_time time without time zone,
    d2_end_date date,
    d2_end_time time without time zone,
    end_operator character varying(50),
    bobbin_fid character varying(20),
    bobbin_no character varying(20),
    chamber integer NOT NULL,
    process_hours numeric(10,3),
    d2_type character varying(50),
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_h2 boolean DEFAULT false
);


ALTER TABLE public.d2_issue OWNER TO postgres;

--
-- Name: d2_issue_d2_isseue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_issue_d2_isseue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_issue_d2_isseue_id_seq OWNER TO postgres;

--
-- Name: d2_issue_d2_isseue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_issue_d2_isseue_id_seq OWNED BY public.d2_issue.d2_isseue_id;


--
-- Name: d2_issue_draft; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d2_issue_draft (
    d2_draft_id bigint NOT NULL,
    d2_batch_id character varying(100) NOT NULL,
    bobbin_fid character varying(100) NOT NULL,
    bobbin_no character varying(100) NOT NULL,
    chamber character varying(50),
    d2_type character varying(50),
    created_by character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.d2_issue_draft OWNER TO postgres;

--
-- Name: d2_issue_draft_d2_draft_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d2_issue_draft_d2_draft_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d2_issue_draft_d2_draft_id_seq OWNER TO postgres;

--
-- Name: d2_issue_draft_d2_draft_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d2_issue_draft_d2_draft_id_seq OWNED BY public.d2_issue_draft.d2_draft_id;


--
-- Name: d_fiber_cut_reasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d_fiber_cut_reasons (
    dfcr_id integer NOT NULL,
    dfcr_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false,
    indication_fiber_cut_id integer
);


ALTER TABLE public.d_fiber_cut_reasons OWNER TO postgres;

--
-- Name: d_fiber_cut_reasons_dfcr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq OWNER TO postgres;

--
-- Name: d_fiber_cut_reasons_dfcr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq OWNED BY public.d_fiber_cut_reasons.dfcr_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    d_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    disable boolean DEFAULT false
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: draw_break_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_break_analysis (
    break_analysis_id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    machine_no integer,
    break_length numeric(10,3),
    break_type character varying(50),
    break_category character varying(50),
    break_remark text,
    break_c_by character varying(50),
    entry_done_by character varying(50),
    main_break_type character varying(50),
    sub_reason character varying(50),
    next_sub_reason character varying(50),
    dist_from_pheriphery numeric(10,3),
    particle_size numeric(10,3),
    flaw_size numeric(10,3),
    bsa_remark character varying(100),
    bsa_done_by character varying(50),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_break_analysis OWNER TO postgres;

--
-- Name: draw_break_analysis_break_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_break_analysis_break_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_break_analysis_break_analysis_id_seq OWNER TO postgres;

--
-- Name: draw_break_analysis_break_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_break_analysis_break_analysis_id_seq OWNED BY public.draw_break_analysis.break_analysis_id;


--
-- Name: draw_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_entry (
    spool_id character varying(20) NOT NULL,
    preform_id character varying(20),
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    drawn_weight numeric(10,2),
    drawn_length numeric(10,2),
    balance_weight numeric(10,2),
    shift character varying(20),
    drawn_line_speed integer,
    draw_tension numeric(10,2),
    furnace_power numeric(10,2),
    furnace_argon numeric(10,2),
    furnace_he numeric(10,2),
    tube_he numeric(10,2),
    co2_flow numeric(10,2),
    n2_flow numeric(10,2),
    uv_air numeric(10,2),
    winding_observation character varying(20),
    scr_observation character varying(100),
    top_end_scrap numeric(10,2),
    bottom_end_scrap numeric(10,2),
    die_clean boolean,
    spool_status character varying(20),
    indication_fiber_cut character varying(20),
    remark text,
    primary_coating character varying(20),
    secondary_coating character varying(20),
    coating_type character varying(20),
    primary_pressure numeric(10,2),
    secondary_pressure numeric(10,2),
    primary_batch character varying(20),
    secondary_batch character varying(20),
    process_type character varying(20),
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shift_incharge character varying(20),
    furnace_operator character varying(20),
    die_operator character varying(20),
    ground_operator character varying(20),
    indication_reason character varying(20),
    tower_no character varying(20) CONSTRAINT draw_entry_tower_id_not_null NOT NULL,
    is_pt_allocate boolean DEFAULT false,
    preform_type character varying(20),
    product_type character varying(20),
    spool_no integer NOT NULL,
    spool_fid character varying(50) NOT NULL,
    is_first boolean DEFAULT false,
    is_last boolean DEFAULT false,
    pt_break_count integer DEFAULT 0,
    CONSTRAINT draw_entry_spool_status_check CHECK (((spool_status)::text = ANY ((ARRAY['Ok'::character varying, 'Not Ok'::character varying])::text[])))
);


ALTER TABLE public.draw_entry OWNER TO postgres;

--
-- Name: draw_flaw_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_flaw_details (
    draw_flaw_id integer NOT NULL,
    spool_id character varying(20) NOT NULL,
    reason text CONSTRAINT draw_flaw_details_flaw_desc_not_null NOT NULL,
    pos1 numeric(10,2),
    pos2 numeric(10,2),
    defect_length numeric(10,2),
    actual_cutting numeric(10,2),
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_flaw_details OWNER TO postgres;

--
-- Name: draw_flaw_details_draw_flaw_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_flaw_details_draw_flaw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_flaw_details_draw_flaw_id_seq OWNER TO postgres;

--
-- Name: draw_flaw_details_draw_flaw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_flaw_details_draw_flaw_id_seq OWNED BY public.draw_flaw_details.draw_flaw_id;


--
-- Name: draw_shift_plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_shift_plan (
    dsp_id integer NOT NULL,
    plan_date date,
    shift character varying(10),
    die_operator character varying(50),
    ground_operator character varying(50),
    furnace_operator character varying(50),
    shift_incharge character varying(50),
    tower_no integer NOT NULL,
    theo_speed numeric(10,3),
    actu_speed numeric(10,3),
    ch_ov_num integer NOT NULL,
    ch_ov_time numeric(10,3),
    ch_ov_tl numeric(10,3),
    fur_cl_time numeric(10,3),
    pm_tl numeric(10,3),
    downtime numeric(10,3),
    draw_plan numeric(10,3),
    shift_time numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_shift_plan OWNER TO postgres;

--
-- Name: draw_shift_plan_dsp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_shift_plan_dsp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_shift_plan_dsp_id_seq OWNER TO postgres;

--
-- Name: draw_shift_plan_dsp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_shift_plan_dsp_id_seq OWNED BY public.draw_shift_plan.dsp_id;


--
-- Name: draw_tower; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_tower (
    tower_id integer NOT NULL,
    tower_no integer NOT NULL,
    furnace_count integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false
);


ALTER TABLE public.draw_tower OWNER TO postgres;

--
-- Name: draw_tower_tower_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_tower_tower_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_tower_tower_id_seq OWNER TO postgres;

--
-- Name: draw_tower_tower_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_tower_tower_id_seq OWNED BY public.draw_tower.tower_id;


--
-- Name: draw_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_users (
    draw_user_id integer NOT NULL,
    emp_id character varying(20),
    draw_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.draw_users OWNER TO postgres;

--
-- Name: draw_users_draw_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_users_draw_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_users_draw_user_id_seq OWNER TO postgres;

--
-- Name: draw_users_draw_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_users_draw_user_id_seq OWNED BY public.draw_users.draw_user_id;


--
-- Name: dyanmic_fartique; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyanmic_fartique (
    dynamic_fartique_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    gr_clause_no numeric(10,3),
    title character varying(200),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dyanmic_fartique OWNER TO postgres;

--
-- Name: dyanmic_fartique_dynamic_fartique_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyanmic_fartique_dynamic_fartique_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyanmic_fartique_dynamic_fartique_id_seq OWNER TO postgres;

--
-- Name: dyanmic_fartique_dynamic_fartique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyanmic_fartique_dynamic_fartique_id_seq OWNED BY public.dyanmic_fartique.dynamic_fartique_id;


--
-- Name: dyanmic_fartique_speed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyanmic_fartique_speed (
    dyanmic_fartique_speed_id integer NOT NULL,
    dynamic_fartique_id integer,
    bobbin_no character varying(50),
    fiber_type character varying(50),
    speed numeric(10,3),
    ts_kg numeric(10,3),
    ext_mm numeric(10,3),
    gpa numeric(10,3),
    time_min numeric(10,3),
    stress_rate numeric(10,3),
    ln_stress_rate numeric(10,3),
    ln_stress numeric(10,3),
    slope numeric(10,3),
    n_value numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dyanmic_fartique_speed_fiber_type_check CHECK (((fiber_type)::text = ANY ((ARRAY['Unaged Fiber'::character varying, 'Aged Fiber'::character varying])::text[])))
);


ALTER TABLE public.dyanmic_fartique_speed OWNER TO postgres;

--
-- Name: dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq OWNER TO postgres;

--
-- Name: dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq OWNED BY public.dyanmic_fartique_speed.dyanmic_fartique_speed_id;


--
-- Name: f_cable_cable_cutoff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_cable_cable_cutoff (
    id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    length numeric(10,2),
    measurement_date date,
    measurement_time character varying(20),
    operator character varying(50),
    cable_cutoff_flag character varying(5),
    cutoff_wavelength numeric(10,2),
    target_column character varying(30),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.f_cable_cable_cutoff OWNER TO postgres;

--
-- Name: f_cable_cable_cutoff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_cable_cable_cutoff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_cable_cable_cutoff_id_seq OWNER TO postgres;

--
-- Name: f_cable_cable_cutoff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_cable_cable_cutoff_id_seq OWNED BY public.f_cable_cable_cutoff.id;


--
-- Name: f_cd_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_cd_history (
    id integer NOT NULL,
    bobbin_id character varying(100) NOT NULL,
    length numeric(12,3),
    measurement_date date,
    measurement_time time without time zone,
    wavelength numeric(10,3),
    delay numeric(12,3),
    dispersion numeric(10,3),
    slope numeric(10,3)
);


ALTER TABLE public.f_cd_history OWNER TO postgres;

--
-- Name: f_cd_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_cd_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_cd_history_id_seq OWNER TO postgres;

--
-- Name: f_cd_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_cd_history_id_seq OWNED BY public.f_cd_history.id;


--
-- Name: f_coating_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_coating_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    secondary_coating_dia_top numeric,
    secondary_coating_concentricity_top numeric,
    coating_ovality_top numeric,
    primary_coating_dia_top numeric,
    primary_coating_concentricity_top numeric,
    coating_inner_non_circularity_top numeric,
    coating_fiber_dia_top numeric,
    coating_fiber_concentricity_top numeric,
    coating_fiber_non_circularity_top numeric,
    secondary_coating_dia_bottom numeric,
    secondary_coating_concentricity_bottom numeric,
    coating_ovality_bottom numeric,
    primary_coating_dia_bottom numeric,
    primary_coating_concentricity_bottom numeric,
    coating_inner_non_circularity_bottom numeric,
    coating_fiber_dia_bottom numeric,
    coating_fiber_concentricity_bottom numeric,
    coating_fiber_non_circularity_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_coating_history OWNER TO postgres;

--
-- Name: f_coating_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_coating_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_coating_history_id_seq OWNER TO postgres;

--
-- Name: f_coating_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_coating_history_id_seq OWNED BY public.f_coating_history.id;


--
-- Name: f_curl_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_curl_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    fiber_curl_top numeric,
    fiber_curl_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_curl_history OWNER TO postgres;

--
-- Name: f_curl_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_curl_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_curl_history_id_seq OWNER TO postgres;

--
-- Name: f_curl_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_curl_history_id_seq OWNED BY public.f_curl_history.id;


--
-- Name: f_cutoff_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_cutoff_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    cut_off_top numeric,
    cut_off_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_cutoff_history OWNER TO postgres;

--
-- Name: f_cutoff_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_cutoff_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_cutoff_history_id_seq OWNER TO postgres;

--
-- Name: f_cutoff_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_cutoff_history_id_seq OWNED BY public.f_cutoff_history.id;


--
-- Name: f_geometry_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_geometry_history (
    id integer NOT NULL,
    bobbin_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    core_dia_top numeric,
    core_ovality_top numeric,
    core_clad_concentricity_top numeric,
    clad_dia_top numeric,
    clad_ovality_top numeric,
    core_dia_bottom numeric,
    core_ovality_bottom numeric,
    core_clad_concentricity_bottom numeric,
    clad_dia_bottom numeric,
    clad_ovality_bottom numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_geometry_history OWNER TO postgres;

--
-- Name: f_geometry_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_geometry_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_geometry_history_id_seq OWNER TO postgres;

--
-- Name: f_geometry_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_geometry_history_id_seq OWNED BY public.f_geometry_history.id;


--
-- Name: f_length_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_length_history (
    id integer NOT NULL,
    bobbin_id character varying,
    length numeric,
    measurement_date date,
    measurement_time character varying,
    measured_length numeric,
    measured_time_us numeric,
    wavelength numeric
);


ALTER TABLE public.f_length_history OWNER TO postgres;

--
-- Name: f_length_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_length_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_length_history_id_seq OWNER TO postgres;

--
-- Name: f_length_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_length_history_id_seq OWNED BY public.f_length_history.id;


--
-- Name: f_mbend_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_mbend_history (
    id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    measurement_date date,
    measurement_time character varying(20),
    operator character varying(50),
    sample_type character varying(20),
    turn numeric,
    mandrel_diameter numeric,
    sample_length numeric,
    wavelength numeric,
    attenuation numeric(10,4),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.f_mbend_history OWNER TO postgres;

--
-- Name: f_mbend_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_mbend_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_mbend_history_id_seq OWNER TO postgres;

--
-- Name: f_mbend_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_mbend_history_id_seq OWNED BY public.f_mbend_history.id;


--
-- Name: f_mfd_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_mfd_history (
    id integer NOT NULL,
    fiber_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    mfd_wavelength_top_1310 numeric,
    gaussian_mfd_top_1310 numeric,
    mfd_1310_top numeric,
    effective_area_1310 numeric,
    mfd_wavelength_bottom_1310 numeric,
    gaussian_mfd_bottom_1310 numeric,
    mfd_1310_bottom numeric,
    effective_area_bottom_1310 numeric,
    mfd_wavelength_top_1550 numeric,
    gaussian_mfd_top_1550 numeric,
    mfd_1550_top numeric,
    effective_area_1550 numeric,
    mfd_wavelength_bottom_1550 numeric,
    gaussian_mfd_bottom_1550 numeric,
    mfd_1550_bottom numeric,
    effective_area_bottom_1550 numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_mfd_history OWNER TO postgres;

--
-- Name: f_mfd_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_mfd_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_mfd_history_id_seq OWNER TO postgres;

--
-- Name: f_mfd_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_mfd_history_id_seq OWNED BY public.f_mfd_history.id;


--
-- Name: f_pmd_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_pmd_history (
    id integer NOT NULL,
    bobbin_id character varying(100) NOT NULL,
    length numeric(12,3),
    measurement_date date,
    measurement_time time without time zone,
    reported_wavelength integer,
    pmd numeric(10,4),
    pmd_coefficient numeric(10,4),
    gaussian_compliance numeric(10,4),
    second_order_pmd numeric(10,4),
    second_order_pmd_coeff numeric(10,4)
);


ALTER TABLE public.f_pmd_history OWNER TO postgres;

--
-- Name: f_pmd_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_pmd_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_pmd_history_id_seq OWNER TO postgres;

--
-- Name: f_pmd_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_pmd_history_id_seq OWNED BY public.f_pmd_history.id;


--
-- Name: f_spectral_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.f_spectral_history (
    id integer NOT NULL,
    bobbin_id character varying(100),
    length numeric,
    measurement_date date,
    measurement_time time without time zone,
    location character varying(50),
    wavelength numeric,
    attenuation numeric,
    operator character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.f_spectral_history OWNER TO postgres;

--
-- Name: f_spectral_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.f_spectral_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.f_spectral_history_id_seq OWNER TO postgres;

--
-- Name: f_spectral_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.f_spectral_history_id_seq OWNED BY public.f_spectral_history.id;


--
-- Name: fg_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fg_color (
    fg_color_id integer NOT NULL,
    bobbin_no character varying(50) NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    current_color character varying(20),
    require_color character varying(20),
    total_length numeric(10,3),
    balance_length numeric(10,3),
    request_by character varying(50),
    date date,
    "time" time without time zone,
    last_child_fid character varying(50),
    count integer NOT NULL,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    remark text,
    is_done boolean DEFAULT false
);


ALTER TABLE public.fg_color OWNER TO postgres;

--
-- Name: fg_color_fg_color_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fg_color_fg_color_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fg_color_fg_color_id_seq OWNER TO postgres;

--
-- Name: fg_color_fg_color_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fg_color_fg_color_id_seq OWNED BY public.fg_color.fg_color_id;


--
-- Name: fg_rewind; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fg_rewind (
    fg_rewind_id integer NOT NULL,
    bobbin_no character varying(50),
    bobbin_fid character varying(50),
    total_length numeric(10,3),
    balance_length numeric(10,3),
    rewinding_type character varying(50),
    last_child_fid character varying(50),
    count integer NOT NULL,
    request_by character varying(50),
    date date,
    "time" time without time zone,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_rew_done boolean DEFAULT false,
    CONSTRAINT fg_rewind_rewinding_type_check CHECK (((rewinding_type)::text = ANY ((ARRAY['CUT'::character varying, 'REWINDING'::character varying])::text[])))
);


ALTER TABLE public.fg_rewind OWNER TO postgres;

--
-- Name: fg_rewind_fg_rewind_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fg_rewind_fg_rewind_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fg_rewind_fg_rewind_id_seq OWNER TO postgres;

--
-- Name: fg_rewind_fg_rewind_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fg_rewind_fg_rewind_id_seq OWNED BY public.fg_rewind.fg_rewind_id;


--
-- Name: fiber_cut_indication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiber_cut_indication (
    indication_fiber_cut_id integer NOT NULL,
    indication_name character varying(100) NOT NULL,
    disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fiber_cut_indication OWNER TO postgres;

--
-- Name: fiber_cut_indication_indication_fiber_cut_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiber_cut_indication_indication_fiber_cut_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiber_cut_indication_indication_fiber_cut_id_seq OWNER TO postgres;

--
-- Name: fiber_cut_indication_indication_fiber_cut_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiber_cut_indication_indication_fiber_cut_id_seq OWNED BY public.fiber_cut_indication.indication_fiber_cut_id;


--
-- Name: grade_mandatory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_mandatory (
    grade_mandatory_id integer NOT NULL,
    grade character varying(20),
    product_type character varying(50),
    mandatory_params text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.grade_mandatory OWNER TO postgres;

--
-- Name: grade_mandatory_grade_mandatory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grade_mandatory_grade_mandatory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grade_mandatory_grade_mandatory_id_seq OWNER TO postgres;

--
-- Name: grade_mandatory_grade_mandatory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grade_mandatory_grade_mandatory_id_seq OWNED BY public.grade_mandatory.grade_mandatory_id;


--
-- Name: h2_ageing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h2_ageing (
    h2_ageing_id integer NOT NULL,
    d2_batch_id character varying(30) NOT NULL,
    h2_batch_id character varying(30) NOT NULL,
    bobbin_no character varying(20) NOT NULL,
    h2_date date,
    h2_time time without time zone,
    h2_operator character varying(50),
    before_date date,
    before_time time without time zone,
    before_operator character varying(50),
    attn_1240_before numeric(10,3),
    attn_1310_before numeric(10,3),
    attn_1383_before numeric(10,3),
    attn_1550_before numeric(10,3),
    attn_1625_before numeric(10,3),
    after_date date,
    after_time time without time zone,
    after_operator character varying(50),
    attn_1240_after numeric(10,3),
    attn_1310_after numeric(10,3),
    attn_1383_after numeric(10,3),
    attn_1550_after numeric(10,3),
    attn_1625_after numeric(10,3),
    date_14_day date,
    time_14_day time without time zone,
    date_14_day_operator character varying(50),
    attn_1240_14_days numeric(10,3),
    attn_1310_14_days numeric(10,3),
    attn_1383_14_days numeric(10,3),
    attn_1550_14_days numeric(10,3),
    attn_1625_14_days numeric(10,3),
    logged_in_user integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.h2_ageing OWNER TO postgres;

--
-- Name: h2_ageing_h2_ageing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h2_ageing_h2_ageing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h2_ageing_h2_ageing_id_seq OWNER TO postgres;

--
-- Name: h2_ageing_h2_ageing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h2_ageing_h2_ageing_id_seq OWNED BY public.h2_ageing.h2_ageing_id;


--
-- Name: h2_chamber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h2_chamber (
    h2_chamber_id integer NOT NULL,
    h2_chamber_no integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.h2_chamber OWNER TO postgres;

--
-- Name: h2_chamber_h2_chamber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h2_chamber_h2_chamber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h2_chamber_h2_chamber_id_seq OWNER TO postgres;

--
-- Name: h2_chamber_h2_chamber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h2_chamber_h2_chamber_id_seq OWNED BY public.h2_chamber.h2_chamber_id;


--
-- Name: handle_join; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.handle_join (
    handle_join_id integer NOT NULL,
    preform_id character varying(20) NOT NULL,
    dia1 numeric(10,2),
    dia2 numeric(10,2),
    dia3 numeric(10,2),
    dia4 numeric(10,2),
    dia5 numeric(10,2),
    h2flow1 numeric(10,2),
    h2flow2 numeric(10,2),
    h2flow3 numeric(10,2),
    o2line1_flow1 numeric(10,2),
    o2line1_flow2 numeric(10,2),
    o2line1_flow3 numeric(10,2),
    h2flow1_time numeric(10,2),
    h2flow2_time numeric(10,2),
    h2flow3_time numeric(10,2),
    o2line1_flow1_time numeric(10,2),
    o2line1_flow2_time numeric(10,2),
    o2line1_flow3_time numeric(10,2),
    h2flow1_cons numeric(10,2),
    h2flow2_cons numeric(10,2),
    h2flow3_cons numeric(10,2),
    o2line1_flow1_cons numeric(10,2),
    o2line1_flow2_cons numeric(10,2),
    o2line1_flow3_cons numeric(10,2),
    handle_length numeric(10,2),
    handle_diameter numeric(10,2),
    cone_length numeric(10,2),
    handle_number character varying(50),
    joined_by integer NOT NULL,
    additional_notes text,
    is_handle_join boolean DEFAULT true NOT NULL,
    is_allocate boolean DEFAULT false NOT NULL,
    disconnect_remark text,
    disconnected_at timestamp without time zone,
    disconnected_by integer,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    handle_rejected boolean DEFAULT false
);


ALTER TABLE public.handle_join OWNER TO postgres;

--
-- Name: handle_join_handle_join_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.handle_join_handle_join_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.handle_join_handle_join_id_seq OWNER TO postgres;

--
-- Name: handle_join_handle_join_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.handle_join_handle_join_id_seq OWNED BY public.handle_join.handle_join_id;


--
-- Name: hot_water_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hot_water_day_entry (
    hot_water_day_entry_id integer NOT NULL,
    hot_water_entry_id integer,
    bobbin_no character varying(50),
    hw_date date,
    hw_day integer,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hot_water_day_entry OWNER TO postgres;

--
-- Name: hot_water_day_entry_hot_water_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hot_water_day_entry_hot_water_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hot_water_day_entry_hot_water_day_entry_id_seq OWNER TO postgres;

--
-- Name: hot_water_day_entry_hot_water_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hot_water_day_entry_hot_water_day_entry_id_seq OWNED BY public.hot_water_day_entry.hot_water_day_entry_id;


--
-- Name: hot_water_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hot_water_entry (
    hot_water_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    title character varying(200),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    temp numeric(10,3),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hot_water_entry OWNER TO postgres;

--
-- Name: hot_water_entry_hot_water_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hot_water_entry_hot_water_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hot_water_entry_hot_water_entry_id_seq OWNER TO postgres;

--
-- Name: hot_water_entry_hot_water_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hot_water_entry_hot_water_entry_id_seq OWNED BY public.hot_water_entry.hot_water_entry_id;


--
-- Name: htha_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.htha_day_entry (
    htha_day_entry_id integer NOT NULL,
    htha_entry_id integer,
    bobbin_no character varying(50),
    htha_date date,
    htha_day integer,
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.htha_day_entry OWNER TO postgres;

--
-- Name: htha_day_entry_htha_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.htha_day_entry_htha_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.htha_day_entry_htha_day_entry_id_seq OWNER TO postgres;

--
-- Name: htha_day_entry_htha_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.htha_day_entry_htha_day_entry_id_seq OWNED BY public.htha_day_entry.htha_day_entry_id;


--
-- Name: htha_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.htha_entry (
    htha_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    gr_clause_no numeric(10,3),
    title character varying(200),
    req_per_gr text,
    testing_standard character varying(50),
    marker_a character varying(50),
    marker_b character varying(50),
    temp numeric(10,3),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.htha_entry OWNER TO postgres;

--
-- Name: htha_entry_htha_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.htha_entry_htha_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.htha_entry_htha_entry_id_seq OWNER TO postgres;

--
-- Name: htha_entry_htha_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.htha_entry_htha_entry_id_seq OWNED BY public.htha_entry.htha_entry_id;


--
-- Name: master_preform_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_preform_type (
    preform_type_id integer NOT NULL,
    preform_type_name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(50)
);


ALTER TABLE public.master_preform_type OWNER TO postgres;

--
-- Name: master_preform_type_preform_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.master_preform_type_preform_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.master_preform_type_preform_type_id_seq OWNER TO postgres;

--
-- Name: master_preform_type_preform_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_preform_type_preform_type_id_seq OWNED BY public.master_preform_type.preform_type_id;


--
-- Name: mat_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mat_stock (
    mat_stock_id integer NOT NULL,
    m_code character varying(20) NOT NULL,
    batch_id character varying(20) NOT NULL,
    uom character varying(10) NOT NULL,
    activity character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    qty numeric(10,3),
    balance_qty numeric(10,3),
    p_count integer DEFAULT 0,
    last_fid character varying(50) NOT NULL,
    pending_after_rejection character varying(50) DEFAULT NULL::character varying
);


ALTER TABLE public.mat_stock OWNER TO postgres;

--
-- Name: mat_stock_mat_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mat_stock_mat_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mat_stock_mat_stock_id_seq OWNER TO postgres;

--
-- Name: mat_stock_mat_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mat_stock_mat_stock_id_seq OWNED BY public.mat_stock.mat_stock_id;


--
-- Name: material_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_master (
    material_code character varying(50) NOT NULL,
    material_category character varying(50) NOT NULL,
    material_description text NOT NULL,
    preform_type character varying(50),
    product_type character varying(50),
    uom character varying(10) NOT NULL,
    is_sample boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_master OWNER TO postgres;

--
-- Name: packing_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packing_order (
    packing_order_id integer NOT NULL,
    order_no character varying(50) NOT NULL,
    customer_name character varying(100),
    required_km numeric(10,2),
    box_capacity integer NOT NULL,
    stack_capacity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_packed boolean DEFAULT false,
    tc_generated boolean DEFAULT false
);


ALTER TABLE public.packing_order OWNER TO postgres;

--
-- Name: packing_order_bobbin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packing_order_bobbin (
    packing_order_bobbin_id integer NOT NULL,
    packing_order character varying(50) NOT NULL,
    bobbin_no character varying(50) NOT NULL,
    length_km numeric(10,2),
    stack_no character varying(50),
    box_no character varying(50)
);


ALTER TABLE public.packing_order_bobbin OWNER TO postgres;

--
-- Name: packing_order_bobbin_packing_order_bobbin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packing_order_bobbin_packing_order_bobbin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packing_order_bobbin_packing_order_bobbin_id_seq OWNER TO postgres;

--
-- Name: packing_order_bobbin_packing_order_bobbin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packing_order_bobbin_packing_order_bobbin_id_seq OWNED BY public.packing_order_bobbin.packing_order_bobbin_id;


--
-- Name: packing_order_packing_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packing_order_packing_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packing_order_packing_order_id_seq OWNER TO postgres;

--
-- Name: packing_order_packing_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packing_order_packing_order_id_seq OWNED BY public.packing_order.packing_order_id;


--
-- Name: preform_accept; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_accept (
    acceptance_id integer NOT NULL,
    preform_id character varying(20) NOT NULL,
    preform_weight numeric(10,3),
    charge_weight numeric(10,3),
    preform_length numeric(10,2),
    charge_length numeric(10,2),
    drawing_length numeric(10,2),
    material_code character varying(20),
    dia_variation numeric(10,2),
    cut_off numeric(10,2),
    mfd numeric(10,2),
    accepted_by character varying(20),
    preform_type character varying(10),
    material_description text,
    remarks text,
    draw_instruction text,
    acceptance_status character varying(10) DEFAULT 'accepted'::character varying NOT NULL,
    rejection_note text,
    logged_in_user character varying(50),
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_handle_join boolean DEFAULT false NOT NULL,
    product_type character(20),
    CONSTRAINT preform_accept_acceptance_status_check CHECK (((acceptance_status)::text = ANY ((ARRAY['accepted'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.preform_accept OWNER TO postgres;

--
-- Name: preform_accept_acceptance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_accept_acceptance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_accept_acceptance_id_seq OWNER TO postgres;

--
-- Name: preform_accept_acceptance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_accept_acceptance_id_seq OWNED BY public.preform_accept.acceptance_id;


--
-- Name: preform_allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_allocation (
    allocation_id integer NOT NULL,
    preform_id character varying(20) NOT NULL,
    allocation_date date NOT NULL,
    tower_no character varying(20) CONSTRAINT preform_allocation_tower_id_not_null NOT NULL,
    shift character varying(20) CONSTRAINT preform_allocation_shift_id_not_null NOT NULL,
    operator character varying(20) CONSTRAINT preform_allocation_operator_id_not_null NOT NULL,
    preform_type character varying(20),
    product_type character varying(20),
    process_type character varying(20),
    preform_draw boolean DEFAULT false,
    average_diameter numeric(10,2),
    draw_instruction text,
    process_remarks text,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.preform_allocation OWNER TO postgres;

--
-- Name: preform_allocation_allocation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_allocation_allocation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_allocation_allocation_id_seq OWNER TO postgres;

--
-- Name: preform_allocation_allocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_allocation_allocation_id_seq OWNED BY public.preform_allocation.allocation_id;


--
-- Name: preform_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_data (
    preform_id character varying(50) NOT NULL,
    preform_weight numeric(10,3),
    preform_type character varying(10),
    material_code character varying(20),
    material_description text,
    plant character varying(10),
    storage_location character varying(10),
    uom character varying(10) DEFAULT 'KG'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    product_type character varying(20)
);


ALTER TABLE public.preform_data OWNER TO postgres;

--
-- Name: preform_process_type_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_process_type_mapping (
    mapping_id integer NOT NULL,
    preform_type character varying(50) NOT NULL,
    process_type_id integer NOT NULL
);


ALTER TABLE public.preform_process_type_mapping OWNER TO postgres;

--
-- Name: preform_process_type_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preform_process_type_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preform_process_type_mapping_mapping_id_seq OWNER TO postgres;

--
-- Name: preform_process_type_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_process_type_mapping_mapping_id_seq OWNED BY public.preform_process_type_mapping.mapping_id;


--
-- Name: process_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_order (
    process_o_id integer NOT NULL,
    process_o_no character varying(50),
    material_code character varying(50) NOT NULL,
    process_qty numeric(12,3) NOT NULL,
    balance_qty numeric(12,3) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.process_order OWNER TO postgres;

--
-- Name: process_order_process_o_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.process_order_process_o_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_order_process_o_id_seq OWNER TO postgres;

--
-- Name: process_order_process_o_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.process_order_process_o_id_seq OWNED BY public.process_order.process_o_id;


--
-- Name: process_type_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_type_master (
    process_type_id integer NOT NULL,
    process_type integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.process_type_master OWNER TO postgres;

--
-- Name: process_type_master_process_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.process_type_master_process_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_type_master_process_type_id_seq OWNER TO postgres;

--
-- Name: process_type_master_process_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.process_type_master_process_type_id_seq OWNED BY public.process_type_master.process_type_id;


--
-- Name: pt_allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_allocation (
    pt_allocation_id integer NOT NULL,
    spool_id character varying(20) NOT NULL,
    allocation_date date DEFAULT CURRENT_DATE,
    preform_id character varying(20) NOT NULL,
    tower_no character varying(10) CONSTRAINT pt_allocation_tower_id_not_null NOT NULL,
    drawn_length numeric(10,2) NOT NULL,
    product_type character varying(20),
    pt_strain integer NOT NULL,
    pt_machine_no integer CONSTRAINT pt_allocation_pt_machine_id_not_null NOT NULL,
    allocated_by character varying(50) CONSTRAINT pt_allocation_allocated_by_id_not_null NOT NULL,
    shift_incharge character varying(50) CONSTRAINT pt_allocation_shift_incharge_id_not_null NOT NULL,
    allocation_remark text,
    is_pt_complete boolean DEFAULT false,
    logged_in_user integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_reject boolean DEFAULT false
);


ALTER TABLE public.pt_allocation OWNER TO postgres;

--
-- Name: pt_allocation_pt_allocation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_allocation_pt_allocation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_allocation_pt_allocation_id_seq OWNER TO postgres;

--
-- Name: pt_allocation_pt_allocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_allocation_pt_allocation_id_seq OWNED BY public.pt_allocation.pt_allocation_id;


--
-- Name: pt_break_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_break_analysis (
    break_analysis_id integer NOT NULL,
    fiber_id character varying(50) NOT NULL,
    machine_no integer,
    break_length numeric(10,3),
    break_type character varying(50),
    break_category character varying(50),
    break_remark text,
    break_c_by character varying(50),
    entry_done_by character varying(50),
    main_break_type character varying(50),
    sub_reason character varying(50),
    next_sub_reason character varying(50),
    dist_from_pheriphery numeric(10,3),
    particle_size numeric(10,3),
    flaw_size numeric(10,3),
    bsa_remark character varying(100),
    bsa_done_by character varying(50),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pt_break_analysis OWNER TO postgres;

--
-- Name: pt_break_analysis_break_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_break_analysis_break_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_break_analysis_break_analysis_id_seq OWNER TO postgres;

--
-- Name: pt_break_analysis_break_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_break_analysis_break_analysis_id_seq OWNED BY public.pt_break_analysis.break_analysis_id;


--
-- Name: pt_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_entry (
    pt_entry_id integer NOT NULL,
    spool_id character varying(20) NOT NULL,
    preform_id character varying(20) NOT NULL,
    drawn_length numeric(10,2),
    tower_no integer CONSTRAINT pt_entry_dt_no_not_null NOT NULL,
    drawn_date date,
    pt_entry date DEFAULT CURRENT_DATE,
    fid character varying(20),
    bobbin_no character varying(20),
    spool_status character varying(20),
    pt_machine integer NOT NULL,
    operator_name character varying(50),
    shift_incharge character varying(50),
    bobbin_color character varying(20),
    bobbin_type character varying(20),
    pt_length numeric(10,2),
    status character varying(50) NOT NULL,
    payoff_vibration character varying(20),
    dancer_vibration character varying(20),
    rejection boolean DEFAULT false,
    rejection_reason character varying(20),
    bal_draw_rejection boolean DEFAULT false,
    bal_draw_rejection_reason character varying(20),
    multiple_end boolean DEFAULT false,
    scratch boolean DEFAULT false,
    pt_scrap boolean DEFAULT false,
    ztmd boolean DEFAULT false,
    ztmd_id character varying(20),
    doc boolean DEFAULT false,
    doc_id character varying(20),
    is_break boolean DEFAULT false,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_first boolean DEFAULT false,
    is_last boolean DEFAULT false,
    start_length numeric(10,3),
    end_length numeric(10,3),
    before_rejection character varying(50),
    after_rejection character varying(50),
    active_rejection_type character varying(50),
    pt_flaw_remark text,
    a_cut_flaw text,
    full_check boolean DEFAULT false,
    is_sample boolean DEFAULT false,
    full_mbend boolean,
    no integer DEFAULT 0
);


ALTER TABLE public.pt_entry OWNER TO postgres;

--
-- Name: pt_entry_pt_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_entry_pt_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_entry_pt_entry_id_seq OWNER TO postgres;

--
-- Name: pt_entry_pt_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_entry_pt_entry_id_seq OWNED BY public.pt_entry.pt_entry_id;


--
-- Name: pt_flaw_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_flaw_details (
    pt_flaw_id integer NOT NULL,
    spool_id character varying(20) NOT NULL,
    reason text,
    pos1 numeric(10,3),
    pos2 numeric(10,3),
    defect_length numeric(10,2),
    actual_cutting numeric(10,2),
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_done boolean DEFAULT false,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    booked_at timestamp without time zone,
    missed_at timestamp without time zone,
    flaw_remark text,
    is_booked boolean DEFAULT false
);


ALTER TABLE public.pt_flaw_details OWNER TO postgres;

--
-- Name: pt_flaw_details_pt_flaw_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_flaw_details_pt_flaw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_flaw_details_pt_flaw_id_seq OWNER TO postgres;

--
-- Name: pt_flaw_details_pt_flaw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_flaw_details_pt_flaw_id_seq OWNED BY public.pt_flaw_details.pt_flaw_id;


--
-- Name: pt_machine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_machine (
    pt_machine_id integer NOT NULL,
    pt_machine_no integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pt_machine OWNER TO postgres;

--
-- Name: pt_machine_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_machine_logs (
    spool_code_tu character varying(100) NOT NULL,
    spool_code_po character varying(100),
    start_time time without time zone,
    end_time time without time zone,
    operator character varying(100),
    set_length integer,
    real_length integer,
    machine_stop_reason_t text,
    start_date date,
    end_date date,
    run_speed integer,
    machine_total_time integer,
    machine_total_length integer,
    idle_time interval,
    runtime interval,
    processed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    machine_number character varying(10) NOT NULL
);


ALTER TABLE public.pt_machine_logs OWNER TO postgres;

--
-- Name: pt_machine_pt_machine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_machine_pt_machine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_machine_pt_machine_id_seq OWNER TO postgres;

--
-- Name: pt_machine_pt_machine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_machine_pt_machine_id_seq OWNED BY public.pt_machine.pt_machine_id;


--
-- Name: pt_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pt_users (
    pt_user_id integer NOT NULL,
    emp_id character varying(20),
    pt_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pt_users OWNER TO postgres;

--
-- Name: pt_users_pt_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pt_users_pt_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pt_users_pt_user_id_seq OWNER TO postgres;

--
-- Name: pt_users_pt_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pt_users_pt_user_id_seq OWNED BY public.pt_users.pt_user_id;


--
-- Name: pv_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pv_entries (
    pv_entry_id integer NOT NULL,
    pv_type character varying(50) NOT NULL,
    pv_operator character varying(100) NOT NULL,
    shift character varying(10) NOT NULL,
    pv_date date DEFAULT CURRENT_DATE NOT NULL,
    pv_time time without time zone DEFAULT CURRENT_TIME NOT NULL,
    pv_remark text,
    bobbin_no character varying(100) CONSTRAINT pv_entries_bobbin_id_not_null NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    spool_fid character varying(50) NOT NULL,
    spool_id character varying(100),
    preform_id character varying(100),
    fiber_type character varying(50),
    colour character varying(50),
    qty_kms numeric(10,3),
    logged_in_user character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pv_entries OWNER TO postgres;

--
-- Name: pv_entries_pv_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pv_entries_pv_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pv_entries_pv_entry_id_seq OWNER TO postgres;

--
-- Name: pv_entries_pv_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pv_entries_pv_entry_id_seq OWNED BY public.pv_entries.pv_entry_id;


--
-- Name: qc_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_entry (
    bobbin_no character varying(20) NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    product_type character varying(50),
    avg_lsa_atn_1310 numeric(10,3),
    avg_lsa_atn_1550 numeric(10,3),
    avg_lsa_atn_1625 numeric(10,3),
    avg_lsa_atn_1383 numeric(10,3),
    max_lsa_atn_1310 numeric(10,3),
    max_lsa_atn_1550 numeric(10,3),
    max_lsa_atn_1625 numeric(10,3),
    max_lsa_atn_1383 numeric(10,3),
    min_lsa_atn_1310 numeric(10,3),
    min_lsa_atn_1550 numeric(10,3),
    min_lsa_atn_1625 numeric(10,3),
    min_lsa_atn_1383 numeric(10,3),
    atn_1310_top numeric(10,3),
    atn_1550_top numeric(10,3),
    atn_1625_top numeric(10,3),
    atn_1383_top numeric(10,3),
    atn_1310_bottom numeric(10,3),
    atn_1550_bottom numeric(10,3),
    atn_1625_bottom numeric(10,3),
    atn_1383_bottom numeric(10,3),
    max_atn_1310_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    max_tb_1310 numeric(10,3),
    max_tb_1550 numeric(10,3),
    max_tb_1625 numeric(10,3),
    max_tb_1383 numeric(10,3),
    atn_1310_tb numeric(10,3),
    atn_1550_tb numeric(10,3),
    atn_1625_tb numeric(10,3),
    atn_1383_tb numeric(10,3),
    atn_uniformity_1310 numeric(10,3),
    atn_uniformity_1550 numeric(10,3),
    atn_uniformity_1625 numeric(10,3),
    atn_uniformity_1383 numeric(10,3),
    mfd_uniformity_1310 numeric(10,3),
    mfd_uniformity_1550 numeric(10,3),
    mfd_uniformity_1625 numeric(10,3),
    mfd_uniformity_1383 numeric(10,3),
    step_1310_size numeric(10,3),
    step_1550_size numeric(10,3),
    step_1625_size numeric(10,3),
    step_1383_size numeric(10,3),
    spike_1310_size numeric(10,3),
    spike_1550_size numeric(10,3),
    spike_1625_size numeric(10,3),
    spike_1383_size numeric(10,3),
    spec_1310 numeric(10,3),
    spec_1550 numeric(10,3),
    spec_1285_1330 numeric(10,3),
    mfd_1310_top numeric(10,3),
    mfd_1310_bottom numeric(10,3),
    mfd_1550_top numeric(10,3),
    mfd_1550_bottom numeric(10,3),
    effective_area_1310 numeric(10,3),
    effective_area_1550 numeric(10,3),
    cut_off_top numeric(10,3),
    cut_off_bottom numeric(10,3),
    cable_cut_off numeric(10,3),
    mac_value numeric(10,3),
    clad_dia_top numeric(10,3),
    clad_dia_bottom numeric(10,3),
    core_clad_concentricity_top numeric(10,3),
    core_clad_concentricity_bottom numeric(10,3),
    clad_ovality_top numeric(10,3),
    clad_ovality_bottom numeric(10,3),
    core_dia_top numeric(10,3),
    core_dia_bottom numeric(10,3),
    core_ovality_top numeric(10,3),
    core_ovality_bottom numeric(10,3),
    primary_coating_dia_top numeric(10,3),
    primary_coating_dia_bottom numeric(10,3),
    secondary_coating_dia_top numeric(10,3),
    secondary_coating_dia_bottom numeric(10,3),
    primary_coating_concentricity_top numeric(10,3),
    primary_coating_concentricity_bottom numeric(10,3),
    secondary_coating_concentricity_top numeric(10,3),
    secondary_coating_concentricity_bottom numeric(10,3),
    coating_ovality_top numeric(10,3),
    coating_ovality_bottom numeric(10,3),
    fiber_curl_top numeric(10,3),
    fiber_curl_bottom numeric(10,3),
    curl_defection_top numeric(10,3),
    curl_defection_bottom numeric(10,3),
    zero_disp_wave numeric(10,3),
    slope_zero_disp numeric(10,3),
    disp_1550 numeric(10,3),
    disp_1285_1330 numeric(10,3),
    disp_1270_1340 numeric(10,3),
    disp_1575 numeric(10,3),
    cd_1460 numeric(10,3),
    disp_1625 numeric(10,3),
    disp_1570 numeric(10,3),
    disp_1260 numeric(10,3),
    pmd_1310 numeric(10,3),
    pmd_1550 numeric(10,3),
    disp_slope numeric(10,3),
    m_100t_50mm_1550 numeric(10,3),
    m_100t_50mm_1310 numeric(10,3),
    m_100t_50mm_1625 numeric(10,3),
    m_100t_60mm_1550 numeric(10,3),
    m_100t_60mm_1310 numeric(10,3),
    m_100t_60mm_1625 numeric(10,3),
    m_1t_32mm_1550 numeric(10,3),
    m_1t_32mm_1310 numeric(10,3),
    m_1t_32mm_1625 numeric(10,3),
    m_10t_30mm_1550 numeric(10,3),
    m_10t_30mm_1310 numeric(10,3),
    m_10t_30mm_1625 numeric(10,3),
    m_1t_20mm_1550 numeric(10,3),
    m_1t_20mm_1310 numeric(10,3),
    m_1t_20mm_1625 numeric(10,3),
    m_1t_15mm_1550 numeric(10,3),
    m_1t_15mm_1310 numeric(10,3),
    m_1t_15mm_1625 numeric(10,3),
    m_1t_10mm_1550 numeric(10,3),
    m_1t_10mm_1310 numeric(10,3),
    m_1t_10mm_1625 numeric(10,3),
    temp_grade character varying(50),
    final_grade character varying(50),
    optical_length numeric(10,3),
    status character varying(20),
    reason character varying(20),
    remark character varying(300),
    is_rew_done boolean DEFAULT false,
    otdr_test_date character varying(100),
    nc_cause character varying(100),
    otdr_operator character varying(100),
    otdr_machine character varying(100),
    disp_1270_1360 numeric(10,3),
    disp_1460 numeric(10,3),
    disp_1490 numeric(10,3),
    slope_1550 numeric(10,3),
    slope_1290 numeric(10,3),
    slope_1490 numeric(10,3)
);


ALTER TABLE public.qc_entry OWNER TO postgres;

--
-- Name: qc_entry_temp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_entry_temp (
    bobbin_no character varying(20) NOT NULL,
    bobbin_fid character varying(50),
    product_type character varying(50),
    avg_lsa_atn_1310 numeric(10,3),
    avg_lsa_atn_1550 numeric(10,3),
    avg_lsa_atn_1625 numeric(10,3),
    avg_lsa_atn_1383 numeric(10,3),
    max_lsa_atn_1310 numeric(10,3),
    max_lsa_atn_1550 numeric(10,3),
    max_lsa_atn_1625 numeric(10,3),
    max_lsa_atn_1383 numeric(10,3),
    min_lsa_atn_1310 numeric(10,3),
    min_lsa_atn_1550 numeric(10,3),
    min_lsa_atn_1625 numeric(10,3),
    min_lsa_atn_1383 numeric(10,3),
    atn_1310_top numeric(10,3),
    atn_1550_top numeric(10,3),
    atn_1625_top numeric(10,3),
    atn_1383_top numeric(10,3),
    atn_1310_bottom numeric(10,3),
    atn_1550_bottom numeric(10,3),
    atn_1625_bottom numeric(10,3),
    atn_1383_bottom numeric(10,3),
    max_atn_1310_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    max_tb_1310 numeric(10,3),
    max_tb_1550 numeric(10,3),
    max_tb_1625 numeric(10,3),
    max_tb_1383 numeric(10,3),
    atn_1310_tb numeric(10,3),
    atn_1550_tb numeric(10,3),
    atn_1625_tb numeric(10,3),
    atn_1383_tb numeric(10,3),
    atn_uniformity_1310 numeric(10,3),
    atn_uniformity_1550 numeric(10,3),
    atn_uniformity_1625 numeric(10,3),
    atn_uniformity_1383 numeric(10,3),
    mfd_uniformity_1310 numeric(10,3),
    mfd_uniformity_1550 numeric(10,3),
    mfd_uniformity_1625 numeric(10,3),
    mfd_uniformity_1383 numeric(10,3),
    step_1310_size numeric(10,3),
    step_1550_size numeric(10,3),
    step_1625_size numeric(10,3),
    step_1383_size numeric(10,3),
    spike_1310_size numeric(10,3),
    spike_1550_size numeric(10,3),
    spike_1625_size numeric(10,3),
    spike_1383_size numeric(10,3),
    spec_1310 numeric(10,3),
    spec_1550 numeric(10,3),
    spec_1285_1330 numeric(10,3),
    mfd_1310_top numeric(10,3),
    mfd_1310_bottom numeric(10,3),
    mfd_1550_top numeric(10,3),
    mfd_1550_bottom numeric(10,3),
    effective_area_1310 numeric(10,3),
    effective_area_1550 numeric(10,3),
    cut_off_top numeric(10,3),
    cut_off_bottom numeric(10,3),
    cable_cut_off numeric(10,3),
    mac_value numeric(10,3),
    clad_dia_top numeric(10,3),
    clad_dia_bottom numeric(10,3),
    core_clad_concentricity_top numeric(10,3),
    core_clad_concentricity_bottom numeric(10,3),
    clad_ovality_top numeric(10,3),
    clad_ovality_bottom numeric(10,3),
    core_dia_top numeric(10,3),
    core_dia_bottom numeric(10,3),
    core_ovality_top numeric(10,3),
    core_ovality_bottom numeric(10,3),
    primary_coating_dia_top numeric(10,3),
    primary_coating_dia_bottom numeric(10,3),
    secondary_coating_dia_top numeric(10,3),
    secondary_coating_dia_bottom numeric(10,3),
    primary_coating_concentricity_top numeric(10,3),
    primary_coating_concentricity_bottom numeric(10,3),
    secondary_coating_concentricity_top numeric(10,3),
    secondary_coating_concentricity_bottom numeric(10,3),
    coating_ovality_top numeric(10,3),
    coating_ovality_bottom numeric(10,3),
    fiber_curl_top numeric(10,3),
    fiber_curl_bottom numeric(10,3),
    curl_defection_top numeric(10,3),
    curl_defection_bottom numeric(10,3),
    zero_disp_wave numeric(10,3),
    slope_zero_disp numeric(10,3),
    disp_1550 numeric(10,3),
    disp_1285_1330 numeric(10,3),
    disp_1270_1340 numeric(10,3),
    disp_1575 numeric(10,3),
    cd_1460 numeric(10,3),
    disp_1625 numeric(10,3),
    disp_1570 numeric(10,3),
    disp_1260 numeric(10,3),
    pmd_1310 numeric(10,3),
    pmd_1550 numeric(10,3),
    disp_slope numeric(10,3),
    m_100t_50mm_1550 numeric(10,3),
    m_100t_50mm_1310 numeric(10,3),
    m_100t_50mm_1625 numeric(10,3),
    m_100t_60mm_1550 numeric(10,3),
    m_100t_60mm_1310 numeric(10,3),
    m_100t_60mm_1625 numeric(10,3),
    m_1t_32mm_1550 numeric(10,3),
    m_1t_32mm_1310 numeric(10,3),
    m_1t_32mm_1625 numeric(10,3),
    m_10t_30mm_1550 numeric(10,3),
    m_10t_30mm_1310 numeric(10,3),
    m_10t_30mm_1625 numeric(10,3),
    m_1t_20mm_1550 numeric(10,3),
    m_1t_20mm_1310 numeric(10,3),
    m_1t_20mm_1625 numeric(10,3),
    m_1t_15mm_1550 numeric(10,3),
    m_1t_15mm_1310 numeric(10,3),
    m_1t_15mm_1625 numeric(10,3),
    m_1t_10mm_1550 numeric(10,3),
    m_1t_10mm_1310 numeric(10,3),
    m_1t_10mm_1625 numeric(10,3),
    temp_grade character varying(50),
    final_grade character varying(50),
    optical_length numeric(10,3),
    status character varying(20),
    reason character varying(20),
    remark character varying(300),
    is_rew_done boolean DEFAULT false,
    otdr_test_date character varying(100),
    nc_cause character varying(100),
    otdr_operator character varying(100),
    otdr_machine character varying(100),
    disp_1270_1360 numeric(10,3),
    disp_1460 numeric(10,3),
    disp_1490 numeric(10,3),
    slope_1550 numeric(10,3),
    slope_1290 numeric(10,3),
    slope_1490 numeric(10,3)
);


ALTER TABLE public.qc_entry_temp OWNER TO postgres;

--
-- Name: qc_grade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_grade (
    qc_entry_id integer NOT NULL,
    grade character varying(20),
    product_type character varying(50),
    priority integer,
    status boolean,
    min_avg_lsa_atn_1310 numeric(10,3),
    max_avg_lsa_atn_1310 numeric(10,3),
    min_avg_lsa_atn_1550 numeric(10,3),
    max_avg_lsa_atn_1550 numeric(10,3),
    min_avg_lsa_atn_1625 numeric(10,3),
    max_avg_lsa_atn_1625 numeric(10,3),
    min_avg_lsa_atn_1383 numeric(10,3),
    max_avg_lsa_atn_1383 numeric(10,3),
    min_max_lsa_atn_1310 numeric(10,3),
    max_max_lsa_atn_1310 numeric(10,3),
    min_max_lsa_atn_1550 numeric(10,3),
    max_max_lsa_atn_1550 numeric(10,3),
    min_max_lsa_atn_1625 numeric(10,3),
    max_max_lsa_atn_1625 numeric(10,3),
    min_max_lsa_atn_1383 numeric(10,3),
    max_max_lsa_atn_1383 numeric(10,3),
    min_min_lsa_atn_1310 numeric(10,3),
    max_min_lsa_atn_1310 numeric(10,3),
    min_min_lsa_atn_1550 numeric(10,3),
    max_min_lsa_atn_1550 numeric(10,3),
    min_min_lsa_atn_1625 numeric(10,3),
    max_min_lsa_atn_1625 numeric(10,3),
    min_min_lsa_atn_1383 numeric(10,3),
    max_min_lsa_atn_1383 numeric(10,3),
    min_atn_1310_top numeric(10,3),
    max_atn_1310_top numeric(10,3),
    min_atn_1550_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    min_atn_1625_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    min_atn_1383_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    min_atn_1310_bottom numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    min_atn_1550_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    min_atn_1625_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    min_atn_1383_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    min_max_atn_1310_top numeric(10,3),
    max_max_atn_1310_top numeric(10,3),
    min_max_atn_1550_top numeric(10,3),
    max_max_atn_1550_top numeric(10,3),
    min_max_atn_1625_top numeric(10,3),
    max_max_atn_1625_top numeric(10,3),
    min_max_atn_1383_top numeric(10,3),
    max_max_atn_1383_top numeric(10,3),
    min_max_atn_1310_bottom numeric(10,3),
    max_max_atn_1310_bottom numeric(10,3),
    min_max_atn_1550_bottom numeric(10,3),
    max_max_atn_1550_bottom numeric(10,3),
    min_max_atn_1625_bottom numeric(10,3),
    max_max_atn_1625_bottom numeric(10,3),
    min_max_atn_1383_bottom numeric(10,3),
    max_max_atn_1383_bottom numeric(10,3),
    min_max_tb_1310 numeric(10,3),
    max_max_tb_1310 numeric(10,3),
    min_max_tb_1550 numeric(10,3),
    max_max_tb_1550 numeric(10,3),
    min_max_tb_1625 numeric(10,3),
    max_max_tb_1625 numeric(10,3),
    min_max_tb_1383 numeric(10,3),
    max_max_tb_1383 numeric(10,3),
    min_atn_1310_tb numeric(10,3),
    max_atn_1310_tb numeric(10,3),
    min_atn_1550_tb numeric(10,3),
    max_atn_1550_tb numeric(10,3),
    min_atn_1625_tb numeric(10,3),
    max_atn_1625_tb numeric(10,3),
    min_atn_1383_tb numeric(10,3),
    max_atn_1383_tb numeric(10,3),
    min_atn_uniformity_1310 numeric(10,3),
    max_atn_uniformity_1310 numeric(10,3),
    min_atn_uniformity_1550 numeric(10,3),
    max_atn_uniformity_1550 numeric(10,3),
    min_atn_uniformity_1625 numeric(10,3),
    max_atn_uniformity_1625 numeric(10,3),
    min_atn_uniformity_1383 numeric(10,3),
    max_atn_uniformity_1383 numeric(10,3),
    min_mfd_uniformity_1310 numeric(10,3),
    max_mfd_uniformity_1310 numeric(10,3),
    min_mfd_uniformity_1550 numeric(10,3),
    max_mfd_uniformity_1550 numeric(10,3),
    min_mfd_uniformity_1625 numeric(10,3),
    max_mfd_uniformity_1625 numeric(10,3),
    min_mfd_uniformity_1383 numeric(10,3),
    max_mfd_uniformity_1383 numeric(10,3),
    min_step_1310_size numeric(10,3),
    max_step_1310_size numeric(10,3),
    min_step_1550_size numeric(10,3),
    max_step_1550_size numeric(10,3),
    min_step_1625_size numeric(10,3),
    max_step_1625_size numeric(10,3),
    min_step_1383_size numeric(10,3),
    max_step_1383_size numeric(10,3),
    min_spike_1310_size numeric(10,3),
    max_spike_1310_size numeric(10,3),
    min_spike_1550_size numeric(10,3),
    max_spike_1550_size numeric(10,3),
    min_spike_1625_size numeric(10,3),
    max_spike_1625_size numeric(10,3),
    min_spike_1383_size numeric(10,3),
    max_spike_1383_size numeric(10,3),
    min_spec_1310 numeric(10,3),
    max_spec_1310 numeric(10,3),
    min_spec_1550 numeric(10,3),
    max_spec_1550 numeric(10,3),
    min_spec_1285_1330 numeric(10,3),
    max_spec_1285_1330 numeric(10,3),
    min_mfd_1310_top numeric(10,3),
    max_mfd_1310_top numeric(10,3),
    min_mfd_1310_bottom numeric(10,3),
    max_mfd_1310_bottom numeric(10,3),
    min_mfd_1550_top numeric(10,3),
    max_mfd_1550_top numeric(10,3),
    min_mfd_1550_bottom numeric(10,3),
    max_mfd_1550_bottom numeric(10,3),
    min_effective_area_1310 numeric(10,3),
    max_effective_area_1310 numeric(10,3),
    min_effective_area_1550 numeric(10,3),
    max_effective_area_1550 numeric(10,3),
    min_cut_off_top numeric(10,3),
    max_cut_off_top numeric(10,3),
    min_cut_off_bottom numeric(10,3),
    max_cut_off_bottom numeric(10,3),
    min_cable_cut_off numeric(10,3),
    max_cable_cut_off numeric(10,3),
    min_mac_value numeric(10,3),
    max_mac_value numeric(10,3),
    min_clad_dia_top numeric(10,3),
    max_clad_dia_top numeric(10,3),
    min_clad_dia_bottom numeric(10,3),
    max_clad_dia_bottom numeric(10,3),
    min_core_clad_concentricity_top numeric(10,3),
    max_core_clad_concentricity_top numeric(10,3),
    min_core_clad_concentricity_bottom numeric(10,3),
    max_core_clad_concentricity_bottom numeric(10,3),
    min_clad_ovality_top numeric(10,3),
    max_clad_ovality_top numeric(10,3),
    min_clad_ovality_bottom numeric(10,3),
    max_clad_ovality_bottom numeric(10,3),
    min_core_dia_top numeric(10,3),
    max_core_dia_top numeric(10,3),
    min_core_dia_bottom numeric(10,3),
    max_core_dia_bottom numeric(10,3),
    min_core_ovality_top numeric(10,3),
    max_core_ovality_top numeric(10,3),
    min_core_ovality_bottom numeric(10,3),
    max_core_ovality_bottom numeric(10,3),
    min_primary_coating_dia_top numeric(10,3),
    max_primary_coating_dia_top numeric(10,3),
    min_primary_coating_dia_bottom numeric(10,3),
    max_primary_coating_dia_bottom numeric(10,3),
    min_secondary_coating_dia_top numeric(10,3),
    max_secondary_coating_dia_top numeric(10,3),
    min_secondary_coating_dia_bottom numeric(10,3),
    max_secondary_coating_dia_bottom numeric(10,3),
    min_primary_coating_concentricity_top numeric(10,3),
    max_primary_coating_concentricity_top numeric(10,3),
    min_primary_coating_concentricity_bottom numeric(10,3),
    max_primary_coating_concentricity_bottom numeric(10,3),
    min_secondary_coating_concentricity_top numeric(10,3),
    max_secondary_coating_concentricity_top numeric(10,3),
    min_secondary_coating_concentricity_bottom numeric(10,3),
    max_secondary_coating_concentricity_bottom numeric(10,3),
    min_coating_ovality_top numeric(10,3),
    max_coating_ovality_top numeric(10,3),
    min_coating_ovality_bottom numeric(10,3),
    max_coating_ovality_bottom numeric(10,3),
    min_fiber_curl_top numeric(10,3),
    max_fiber_curl_top numeric(10,3),
    min_fiber_curl_bottom numeric(10,3),
    max_fiber_curl_bottom numeric(10,3),
    min_curl_defection_top numeric(10,3),
    max_curl_defection_top numeric(10,3),
    min_curl_defection_bottom numeric(10,3),
    max_curl_defection_bottom numeric(10,3),
    min_zero_disp_wave numeric(10,3),
    max_zero_disp_wave numeric(10,3),
    min_slope_zero_disp numeric(10,3),
    max_slope_zero_disp numeric(10,3),
    min_disp_1550 numeric(10,3),
    max_disp_1550 numeric(10,3),
    min_disp_1285_1330 numeric(10,3),
    max_disp_1285_1330 numeric(10,3),
    min_disp_1270_1340 numeric(10,3),
    max_disp_1270_1340 numeric(10,3),
    min_disp_1575 numeric(10,3),
    max_disp_1575 numeric(10,3),
    min_cd_1460 numeric(10,3),
    max_cd_1460 numeric(10,3),
    min_disp_1625 numeric(10,3),
    max_disp_1625 numeric(10,3),
    min_disp_1570 numeric(10,3),
    max_disp_1570 numeric(10,3),
    min_disp_1260 numeric(10,3),
    max_disp_1260 numeric(10,3),
    min_pmd_1310 numeric(10,3),
    max_pmd_1310 numeric(10,3),
    min_pmd_1550 numeric(10,3),
    max_pmd_1550 numeric(10,3),
    min_disp_slope numeric(10,3),
    max_disp_slope numeric(10,3),
    min_m_100t_50mm_1550 numeric(10,3),
    max_m_100t_50mm_1550 numeric(10,3),
    min_m_100t_50mm_1310 numeric(10,3),
    max_m_100t_50mm_1310 numeric(10,3),
    min_m_100t_50mm_1625 numeric(10,3),
    max_m_100t_50mm_1625 numeric(10,3),
    min_m_100t_60mm_1550 numeric(10,3),
    max_m_100t_60mm_1550 numeric(10,3),
    min_m_100t_60mm_1310 numeric(10,3),
    max_m_100t_60mm_1310 numeric(10,3),
    min_m_100t_60mm_1625 numeric(10,3),
    max_m_100t_60mm_1625 numeric(10,3),
    min_m_1t_32mm_1550 numeric(10,3),
    max_m_1t_32mm_1550 numeric(10,3),
    min_m_1t_32mm_1310 numeric(10,3),
    max_m_1t_32mm_1310 numeric(10,3),
    min_m_1t_32mm_1625 numeric(10,3),
    max_m_1t_32mm_1625 numeric(10,3),
    min_m_10t_30mm_1550 numeric(10,3),
    max_m_10t_30mm_1550 numeric(10,3),
    min_m_10t_30mm_1310 numeric(10,3),
    max_m_10t_30mm_1310 numeric(10,3),
    min_m_10t_30mm_1625 numeric(10,3),
    max_m_10t_30mm_1625 numeric(10,3),
    min_m_1t_20mm_1550 numeric(10,3),
    max_m_1t_20mm_1550 numeric(10,3),
    min_m_1t_20mm_1310 numeric(10,3),
    max_m_1t_20mm_1310 numeric(10,3),
    min_m_1t_20mm_1625 numeric(10,3),
    max_m_1t_20mm_1625 numeric(10,3),
    min_m_1t_15mm_1550 numeric(10,3),
    max_m_1t_15mm_1550 numeric(10,3),
    min_m_1t_15mm_1310 numeric(10,3),
    max_m_1t_15mm_1310 numeric(10,3),
    min_m_1t_15mm_1625 numeric(10,3),
    max_m_1t_15mm_1625 numeric(10,3),
    min_m_1t_10mm_1550 numeric(10,3),
    max_m_1t_10mm_1550 numeric(10,3),
    min_m_1t_10mm_1310 numeric(10,3),
    max_m_1t_10mm_1310 numeric(10,3),
    min_m_1t_10mm_1625 numeric(10,3),
    max_m_1t_10mm_1625 numeric(10,3),
    min_disp_1270_1360 numeric(10,3),
    max_disp_1270_1360 numeric(10,3),
    max_disp_1460 numeric(10,3),
    min_disp_1460 numeric(10,3),
    min_disp_1490 numeric(10,3),
    max_disp_1490 numeric(10,3),
    max_slope_1550 numeric(10,3),
    min_slope_1550 numeric(10,3),
    min_slope_1290 numeric(10,3),
    max_slope_1290 numeric(10,3),
    max_slope_1490 numeric(10,3),
    min_slope_1490 numeric(10,3)
);


ALTER TABLE public.qc_grade OWNER TO postgres;

--
-- Name: qc_grade_qc_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qc_grade_qc_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qc_grade_qc_entry_id_seq OWNER TO postgres;

--
-- Name: qc_grade_qc_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qc_grade_qc_entry_id_seq OWNED BY public.qc_grade.qc_entry_id;


--
-- Name: qc_out; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_out (
    qc_out_id integer NOT NULL,
    bobbin_no character varying(50) NOT NULL,
    bobbin_fid character varying(50) NOT NULL,
    out_date date NOT NULL,
    out_time time without time zone NOT NULL,
    "user" character varying(50) NOT NULL,
    shift character varying(10) NOT NULL,
    fiber_length numeric(10,3) NOT NULL,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qc_out OWNER TO postgres;

--
-- Name: qc_out_qc_out_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qc_out_qc_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qc_out_qc_out_id_seq OWNER TO postgres;

--
-- Name: qc_out_qc_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qc_out_qc_out_id_seq OWNED BY public.qc_out.qc_out_id;


--
-- Name: qc_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qc_users (
    qc_user_id integer NOT NULL,
    emp_id character varying(20),
    qc_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qc_users OWNER TO postgres;

--
-- Name: qc_users_qc_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qc_users_qc_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qc_users_qc_user_id_seq OWNER TO postgres;

--
-- Name: qc_users_qc_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qc_users_qc_user_id_seq OWNED BY public.qc_users.qc_user_id;


--
-- Name: report_execution_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_execution_log (
    id integer NOT NULL,
    report_id integer,
    executed_by integer,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms integer,
    row_count integer,
    filters_applied jsonb,
    status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    ip_address character varying(50)
);


ALTER TABLE public.report_execution_log OWNER TO postgres;

--
-- Name: report_execution_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_execution_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_execution_log_id_seq OWNER TO postgres;

--
-- Name: report_execution_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_execution_log_id_seq OWNED BY public.report_execution_log.id;


--
-- Name: report_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_master (
    id integer NOT NULL,
    report_name character varying(255) NOT NULL,
    description text,
    module character varying(100),
    status character varying(20) DEFAULT 'active'::character varying,
    main_table character varying(255) NOT NULL,
    columns jsonb DEFAULT '[]'::jsonb,
    column_display_names jsonb DEFAULT '{}'::jsonb,
    column_order jsonb DEFAULT '[]'::jsonb,
    joins jsonb DEFAULT '[]'::jsonb,
    expressions jsonb DEFAULT '[]'::jsonb,
    filters jsonb DEFAULT '[]'::jsonb,
    sorting jsonb DEFAULT '[]'::jsonb,
    group_by jsonb DEFAULT '[]'::jsonb,
    aggregates jsonb DEFAULT '[]'::jsonb,
    "having" jsonb DEFAULT '[]'::jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    updated_at timestamp without time zone,
    deleted_by integer,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version integer DEFAULT 1,
    is_multi_sheet boolean DEFAULT false
);


ALTER TABLE public.report_master OWNER TO postgres;

--
-- Name: report_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_master_id_seq OWNER TO postgres;

--
-- Name: report_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_master_id_seq OWNED BY public.report_master.id;


--
-- Name: report_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_permissions (
    id integer NOT NULL,
    report_id integer,
    permission_type character varying(10) NOT NULL,
    entity_id character varying(100) NOT NULL,
    entity_name character varying(255),
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_export boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_permissions OWNER TO postgres;

--
-- Name: report_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_permissions_id_seq OWNER TO postgres;

--
-- Name: report_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_permissions_id_seq OWNED BY public.report_permissions.id;


--
-- Name: report_saved_filters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_saved_filters (
    id integer NOT NULL,
    report_id integer,
    user_id integer,
    filter_name character varying(255) NOT NULL,
    filter_values jsonb NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_saved_filters OWNER TO postgres;

--
-- Name: report_saved_filters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_saved_filters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_saved_filters_id_seq OWNER TO postgres;

--
-- Name: report_saved_filters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_saved_filters_id_seq OWNED BY public.report_saved_filters.id;


--
-- Name: report_section_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_section_mapping (
    mapping_id integer NOT NULL,
    report_id integer NOT NULL,
    section_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_section_mapping OWNER TO postgres;

--
-- Name: report_section_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_section_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_section_mapping_mapping_id_seq OWNER TO postgres;

--
-- Name: report_section_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_section_mapping_mapping_id_seq OWNED BY public.report_section_mapping.mapping_id;


--
-- Name: report_section_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_section_master (
    section_id integer NOT NULL,
    section_key character varying(50) NOT NULL,
    section_name character varying(100) NOT NULL,
    display_order integer DEFAULT 0,
    disable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_section_master OWNER TO postgres;

--
-- Name: report_section_master_section_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_section_master_section_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_section_master_section_id_seq OWNER TO postgres;

--
-- Name: report_section_master_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_section_master_section_id_seq OWNED BY public.report_section_master.section_id;


--
-- Name: report_sheets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_sheets (
    id integer NOT NULL,
    report_id integer NOT NULL,
    sheet_name character varying(100) NOT NULL,
    display_order integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.report_sheets OWNER TO postgres;

--
-- Name: report_sheets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_sheets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_sheets_id_seq OWNER TO postgres;

--
-- Name: report_sheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_sheets_id_seq OWNED BY public.report_sheets.id;


--
-- Name: report_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_tables (
    id integer NOT NULL,
    sheet_id integer NOT NULL,
    report_id integer NOT NULL,
    table_name character varying(255) NOT NULL,
    main_table character varying(255) NOT NULL,
    columns jsonb DEFAULT '[]'::jsonb,
    column_display_names jsonb DEFAULT '{}'::jsonb,
    column_order jsonb DEFAULT '[]'::jsonb,
    joins jsonb DEFAULT '[]'::jsonb,
    expressions jsonb DEFAULT '[]'::jsonb,
    filters jsonb DEFAULT '[]'::jsonb,
    sorting jsonb DEFAULT '[]'::jsonb,
    group_by jsonb DEFAULT '[]'::jsonb,
    aggregates jsonb DEFAULT '[]'::jsonb,
    "having" jsonb DEFAULT '[]'::jsonb,
    display_order integer DEFAULT 1 NOT NULL,
    spacing integer DEFAULT 2,
    formatting jsonb DEFAULT '{"autoWidth": true, "headerBold": true, "borderEnabled": true, "headerBgColor": "#1e293b", "headerTextColor": "#ffffff"}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.report_tables OWNER TO postgres;

--
-- Name: report_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_tables_id_seq OWNER TO postgres;

--
-- Name: report_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_tables_id_seq OWNED BY public.report_tables.id;


--
-- Name: report_version_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_version_history (
    id integer NOT NULL,
    report_id integer,
    version integer NOT NULL,
    metadata jsonb NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    change_description text
);


ALTER TABLE public.report_version_history OWNER TO postgres;

--
-- Name: report_version_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_version_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_version_history_id_seq OWNER TO postgres;

--
-- Name: report_version_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_version_history_id_seq OWNED BY public.report_version_history.id;


--
-- Name: rewind_instr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewind_instr (
    rewind_instr_id integer NOT NULL,
    bobbin_no character varying(50),
    bobbin_fid character varying(50),
    p1 numeric(10,3),
    p2 numeric(10,3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    instruction character varying(100),
    is_done boolean DEFAULT false,
    logged_in_user character varying(50)
);


ALTER TABLE public.rewind_instr OWNER TO postgres;

--
-- Name: rewind_instr_rewind_instr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewind_instr_rewind_instr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewind_instr_rewind_instr_id_seq OWNER TO postgres;

--
-- Name: rewind_instr_rewind_instr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewind_instr_rewind_instr_id_seq OWNED BY public.rewind_instr.rewind_instr_id;


--
-- Name: rewinding_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewinding_entry (
    rewinding_id integer NOT NULL,
    bobbin_no character varying(20) NOT NULL,
    fiber_length numeric(10,3),
    fid character varying(50),
    machine_no integer,
    rew_reason character varying(50),
    rew_type character varying(50),
    is_scrap boolean DEFAULT false,
    bobbin_type character varying(50),
    operator character varying(50),
    bobbin_colour character varying(50),
    remark text,
    logged_in_user character varying(50) NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_bobbin_no character varying(50)
);


ALTER TABLE public.rewinding_entry OWNER TO postgres;

--
-- Name: rewinding_entry_rewinding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewinding_entry_rewinding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewinding_entry_rewinding_id_seq OWNER TO postgres;

--
-- Name: rewinding_entry_rewinding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewinding_entry_rewinding_id_seq OWNED BY public.rewinding_entry.rewinding_id;


--
-- Name: sap_transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sap_transaction (
    id integer NOT NULL,
    transaction_no character varying(50) NOT NULL,
    process_order_no character varying(50) NOT NULL,
    material_code character varying(50) NOT NULL,
    material_description text,
    plant character varying(10) DEFAULT '1200'::character varying,
    storage_location character varying(10) DEFAULT '1204'::character varying,
    movement_type character varying(10) NOT NULL,
    quantity numeric(12,3) NOT NULL,
    uom character varying(10),
    batch character varying(100),
    posting_date date DEFAULT CURRENT_DATE,
    sap_status character varying(20) DEFAULT 'PENDING'::character varying,
    draw_entry_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sap_transaction OWNER TO postgres;

--
-- Name: sap_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sap_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sap_transaction_id_seq OWNER TO postgres;

--
-- Name: sap_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sap_transaction_id_seq OWNED BY public.sap_transaction.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    shift_id integer NOT NULL,
    shift_name character varying(20) NOT NULL,
    shift_start_time time without time zone NOT NULL,
    shift_end_time time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: shifts_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_shift_id_seq OWNER TO postgres;

--
-- Name: shifts_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_shift_id_seq OWNED BY public.shifts.shift_id;


--
-- Name: spec_mandatory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spec_mandatory (
    spec_mandatory_id integer NOT NULL,
    spec_id integer NOT NULL,
    product_type character varying(100) NOT NULL,
    mandatory_params jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.spec_mandatory OWNER TO postgres;

--
-- Name: spec_mandatory_spec_mandatory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.spec_mandatory_spec_mandatory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spec_mandatory_spec_mandatory_id_seq OWNER TO postgres;

--
-- Name: spec_mandatory_spec_mandatory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.spec_mandatory_spec_mandatory_id_seq OWNED BY public.spec_mandatory.spec_mandatory_id;


--
-- Name: spec_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spec_master (
    spec_id integer NOT NULL,
    customer_name character varying(200),
    po_number character varying(100),
    pt_strain character varying(100),
    cust_spec_name character varying(200),
    product_type character varying(100),
    coating_type character varying(100),
    quantity_km numeric(10,3),
    color character varying(100),
    priority integer DEFAULT 1,
    remarks text,
    is_active boolean DEFAULT true,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    min_avg_lsa_atn_1310 numeric(10,3),
    max_avg_lsa_atn_1310 numeric(10,3),
    min_avg_lsa_atn_1550 numeric(10,3),
    max_avg_lsa_atn_1550 numeric(10,3),
    min_avg_lsa_atn_1625 numeric(10,3),
    max_avg_lsa_atn_1625 numeric(10,3),
    min_avg_lsa_atn_1383 numeric(10,3),
    max_avg_lsa_atn_1383 numeric(10,3),
    min_max_lsa_atn_1310 numeric(10,3),
    max_max_lsa_atn_1310 numeric(10,3),
    min_max_lsa_atn_1550 numeric(10,3),
    max_max_lsa_atn_1550 numeric(10,3),
    min_max_lsa_atn_1625 numeric(10,3),
    max_max_lsa_atn_1625 numeric(10,3),
    min_max_lsa_atn_1383 numeric(10,3),
    max_max_lsa_atn_1383 numeric(10,3),
    min_min_lsa_atn_1310 numeric(10,3),
    max_min_lsa_atn_1310 numeric(10,3),
    min_min_lsa_atn_1550 numeric(10,3),
    max_min_lsa_atn_1550 numeric(10,3),
    min_min_lsa_atn_1625 numeric(10,3),
    max_min_lsa_atn_1625 numeric(10,3),
    min_min_lsa_atn_1383 numeric(10,3),
    max_min_lsa_atn_1383 numeric(10,3),
    min_atn_1310_top numeric(10,3),
    max_atn_1310_top numeric(10,3),
    min_atn_1550_top numeric(10,3),
    max_atn_1550_top numeric(10,3),
    min_atn_1625_top numeric(10,3),
    max_atn_1625_top numeric(10,3),
    min_atn_1383_top numeric(10,3),
    max_atn_1383_top numeric(10,3),
    min_atn_1310_bottom numeric(10,3),
    max_atn_1310_bottom numeric(10,3),
    min_atn_1550_bottom numeric(10,3),
    max_atn_1550_bottom numeric(10,3),
    min_atn_1625_bottom numeric(10,3),
    max_atn_1625_bottom numeric(10,3),
    min_atn_1383_bottom numeric(10,3),
    max_atn_1383_bottom numeric(10,3),
    min_max_atn_1310_top numeric(10,3),
    max_max_atn_1310_top numeric(10,3),
    min_max_atn_1550_top numeric(10,3),
    max_max_atn_1550_top numeric(10,3),
    min_max_atn_1625_top numeric(10,3),
    max_max_atn_1625_top numeric(10,3),
    min_max_atn_1383_top numeric(10,3),
    max_max_atn_1383_top numeric(10,3),
    min_max_atn_1310_bottom numeric(10,3),
    max_max_atn_1310_bottom numeric(10,3),
    min_max_atn_1550_bottom numeric(10,3),
    max_max_atn_1550_bottom numeric(10,3),
    min_max_atn_1625_bottom numeric(10,3),
    max_max_atn_1625_bottom numeric(10,3),
    min_max_atn_1383_bottom numeric(10,3),
    max_max_atn_1383_bottom numeric(10,3),
    min_max_tb_1310 numeric(10,3),
    max_max_tb_1310 numeric(10,3),
    min_max_tb_1550 numeric(10,3),
    max_max_tb_1550 numeric(10,3),
    min_max_tb_1625 numeric(10,3),
    max_max_tb_1625 numeric(10,3),
    min_max_tb_1383 numeric(10,3),
    max_max_tb_1383 numeric(10,3),
    min_atn_1310_tb numeric(10,3),
    max_atn_1310_tb numeric(10,3),
    min_atn_1550_tb numeric(10,3),
    max_atn_1550_tb numeric(10,3),
    min_atn_1625_tb numeric(10,3),
    max_atn_1625_tb numeric(10,3),
    min_atn_1383_tb numeric(10,3),
    max_atn_1383_tb numeric(10,3),
    min_atn_uniformity_1310 numeric(10,3),
    max_atn_uniformity_1310 numeric(10,3),
    min_atn_uniformity_1550 numeric(10,3),
    max_atn_uniformity_1550 numeric(10,3),
    min_atn_uniformity_1625 numeric(10,3),
    max_atn_uniformity_1625 numeric(10,3),
    min_atn_uniformity_1383 numeric(10,3),
    max_atn_uniformity_1383 numeric(10,3),
    min_mfd_uniformity_1310 numeric(10,3),
    max_mfd_uniformity_1310 numeric(10,3),
    min_mfd_uniformity_1550 numeric(10,3),
    max_mfd_uniformity_1550 numeric(10,3),
    min_mfd_uniformity_1625 numeric(10,3),
    max_mfd_uniformity_1625 numeric(10,3),
    min_mfd_uniformity_1383 numeric(10,3),
    max_mfd_uniformity_1383 numeric(10,3),
    min_step_1310_size numeric(10,3),
    max_step_1310_size numeric(10,3),
    min_step_1550_size numeric(10,3),
    max_step_1550_size numeric(10,3),
    min_step_1625_size numeric(10,3),
    max_step_1625_size numeric(10,3),
    min_step_1383_size numeric(10,3),
    max_step_1383_size numeric(10,3),
    min_spike_1310_size numeric(10,3),
    max_spike_1310_size numeric(10,3),
    min_spike_1550_size numeric(10,3),
    max_spike_1550_size numeric(10,3),
    min_spike_1625_size numeric(10,3),
    max_spike_1625_size numeric(10,3),
    min_spike_1383_size numeric(10,3),
    max_spike_1383_size numeric(10,3),
    min_spec_1310 numeric(10,3),
    max_spec_1310 numeric(10,3),
    min_spec_1550 numeric(10,3),
    max_spec_1550 numeric(10,3),
    min_spec_1285_1330 numeric(10,3),
    max_spec_1285_1330 numeric(10,3),
    min_mfd_1310_top numeric(10,3),
    max_mfd_1310_top numeric(10,3),
    min_mfd_1310_bottom numeric(10,3),
    max_mfd_1310_bottom numeric(10,3),
    min_mfd_1550_top numeric(10,3),
    max_mfd_1550_top numeric(10,3),
    min_mfd_1550_bottom numeric(10,3),
    max_mfd_1550_bottom numeric(10,3),
    min_effective_area_1310 numeric(10,3),
    max_effective_area_1310 numeric(10,3),
    min_effective_area_1550 numeric(10,3),
    max_effective_area_1550 numeric(10,3),
    min_cut_off_top numeric(10,3),
    max_cut_off_top numeric(10,3),
    min_cut_off_bottom numeric(10,3),
    max_cut_off_bottom numeric(10,3),
    min_cable_cut_off numeric(10,3),
    max_cable_cut_off numeric(10,3),
    min_mac_value numeric(10,3),
    max_mac_value numeric(10,3),
    min_clad_dia_top numeric(10,3),
    max_clad_dia_top numeric(10,3),
    min_clad_dia_bottom numeric(10,3),
    max_clad_dia_bottom numeric(10,3),
    min_core_clad_concentricity_top numeric(10,3),
    max_core_clad_concentricity_top numeric(10,3),
    min_core_clad_concentricity_bottom numeric(10,3),
    max_core_clad_concentricity_bottom numeric(10,3),
    min_clad_ovality_top numeric(10,3),
    max_clad_ovality_top numeric(10,3),
    min_clad_ovality_bottom numeric(10,3),
    max_clad_ovality_bottom numeric(10,3),
    min_core_dia_top numeric(10,3),
    max_core_dia_top numeric(10,3),
    min_core_dia_bottom numeric(10,3),
    max_core_dia_bottom numeric(10,3),
    min_core_ovality_top numeric(10,3),
    max_core_ovality_top numeric(10,3),
    min_core_ovality_bottom numeric(10,3),
    max_core_ovality_bottom numeric(10,3),
    min_primary_coating_dia_top numeric(10,3),
    max_primary_coating_dia_top numeric(10,3),
    min_primary_coating_dia_bottom numeric(10,3),
    max_primary_coating_dia_bottom numeric(10,3),
    min_secondary_coating_dia_top numeric(10,3),
    max_secondary_coating_dia_top numeric(10,3),
    min_secondary_coating_dia_bottom numeric(10,3),
    max_secondary_coating_dia_bottom numeric(10,3),
    min_primary_coating_concentricity_top numeric(10,3),
    max_primary_coating_concentricity_top numeric(10,3),
    min_primary_coating_concentricity_bottom numeric(10,3),
    max_primary_coating_concentricity_bottom numeric(10,3),
    min_secondary_coating_concentricity_top numeric(10,3),
    max_secondary_coating_concentricity_top numeric(10,3),
    min_secondary_coating_concentricity_bottom numeric(10,3),
    max_secondary_coating_concentricity_bottom numeric(10,3),
    min_coating_ovality_top numeric(10,3),
    max_coating_ovality_top numeric(10,3),
    min_coating_ovality_bottom numeric(10,3),
    max_coating_ovality_bottom numeric(10,3),
    min_fiber_curl_top numeric(10,3),
    max_fiber_curl_top numeric(10,3),
    min_fiber_curl_bottom numeric(10,3),
    max_fiber_curl_bottom numeric(10,3),
    min_curl_defection_top numeric(10,3),
    max_curl_defection_top numeric(10,3),
    min_curl_defection_bottom numeric(10,3),
    max_curl_defection_bottom numeric(10,3),
    min_zero_disp_wave numeric(10,3),
    max_zero_disp_wave numeric(10,3),
    min_slope_zero_disp numeric(10,3),
    max_slope_zero_disp numeric(10,3),
    min_disp_1550 numeric(10,3),
    max_disp_1550 numeric(10,3),
    min_disp_1285_1330 numeric(10,3),
    max_disp_1285_1330 numeric(10,3),
    min_disp_1270_1340 numeric(10,3),
    max_disp_1270_1340 numeric(10,3),
    min_disp_1575 numeric(10,3),
    max_disp_1575 numeric(10,3),
    min_cd_1460 numeric(10,3),
    max_cd_1460 numeric(10,3),
    min_disp_1625 numeric(10,3),
    max_disp_1625 numeric(10,3),
    min_disp_1570 numeric(10,3),
    max_disp_1570 numeric(10,3),
    min_disp_1260 numeric(10,3),
    max_disp_1260 numeric(10,3),
    min_pmd_1310 numeric(10,3),
    max_pmd_1310 numeric(10,3),
    min_pmd_1550 numeric(10,3),
    max_pmd_1550 numeric(10,3),
    min_disp_slope numeric(10,3),
    max_disp_slope numeric(10,3),
    min_m_100t_50mm_1550 numeric(10,3),
    max_m_100t_50mm_1550 numeric(10,3),
    min_m_100t_50mm_1310 numeric(10,3),
    max_m_100t_50mm_1310 numeric(10,3),
    min_m_100t_50mm_1625 numeric(10,3),
    max_m_100t_50mm_1625 numeric(10,3),
    min_m_100t_60mm_1550 numeric(10,3),
    max_m_100t_60mm_1550 numeric(10,3),
    min_m_100t_60mm_1310 numeric(10,3),
    max_m_100t_60mm_1310 numeric(10,3),
    min_m_100t_60mm_1625 numeric(10,3),
    max_m_100t_60mm_1625 numeric(10,3),
    min_m_1t_32mm_1550 numeric(10,3),
    max_m_1t_32mm_1550 numeric(10,3),
    min_m_1t_32mm_1310 numeric(10,3),
    max_m_1t_32mm_1310 numeric(10,3),
    min_m_1t_32mm_1625 numeric(10,3),
    max_m_1t_32mm_1625 numeric(10,3),
    min_m_10t_30mm_1550 numeric(10,3),
    max_m_10t_30mm_1550 numeric(10,3),
    min_m_10t_30mm_1310 numeric(10,3),
    max_m_10t_30mm_1310 numeric(10,3),
    min_m_10t_30mm_1625 numeric(10,3),
    max_m_10t_30mm_1625 numeric(10,3),
    min_m_1t_20mm_1550 numeric(10,3),
    max_m_1t_20mm_1550 numeric(10,3),
    min_m_1t_20mm_1310 numeric(10,3),
    max_m_1t_20mm_1310 numeric(10,3),
    min_m_1t_20mm_1625 numeric(10,3),
    max_m_1t_20mm_1625 numeric(10,3),
    min_m_1t_15mm_1550 numeric(10,3),
    max_m_1t_15mm_1550 numeric(10,3),
    min_m_1t_15mm_1310 numeric(10,3),
    max_m_1t_15mm_1310 numeric(10,3),
    min_m_1t_15mm_1625 numeric(10,3),
    max_m_1t_15mm_1625 numeric(10,3),
    min_m_1t_10mm_1550 numeric(10,3),
    max_m_1t_10mm_1550 numeric(10,3),
    min_m_1t_10mm_1310 numeric(10,3),
    max_m_1t_10mm_1310 numeric(10,3),
    min_m_1t_10mm_1625 numeric(10,3),
    max_m_1t_10mm_1625 numeric(10,3),
    min_disp_1270_1360 numeric(10,3),
    max_disp_1270_1360 numeric(10,3),
    min_disp_1460 numeric(10,3),
    max_disp_1460 numeric(10,3),
    min_disp_1490 numeric(10,3),
    max_disp_1490 numeric(10,3),
    min_slope_1550 numeric(10,3),
    max_slope_1550 numeric(10,3),
    min_slope_1290 numeric(10,3),
    max_slope_1290 numeric(10,3),
    min_slope_1490 numeric(10,3),
    max_slope_1490 numeric(10,3)
);


ALTER TABLE public.spec_master OWNER TO postgres;

--
-- Name: spec_master_spec_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.spec_master_spec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spec_master_spec_id_seq OWNER TO postgres;

--
-- Name: spec_master_spec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.spec_master_spec_id_seq OWNED BY public.spec_master.spec_id;


--
-- Name: splicing_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.splicing_entry (
    splicing_id integer NOT NULL,
    bobbin_a_no character varying(50),
    bobbin_b_no character varying(50),
    machine_loss numeric(10,3),
    product_type character varying(50),
    brand_name character varying(50),
    remark text,
    a_1310 numeric(10,3),
    a_1550 numeric(10,3),
    a_1625 numeric(10,3),
    b_1310 numeric(10,3),
    b_1550 numeric(10,3),
    b_1625 numeric(10,3),
    ave_loss_1310 numeric(10,3),
    ave_loss_1550 numeric(10,3),
    ave_loss_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.splicing_entry OWNER TO postgres;

--
-- Name: splicing_entry_splicing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.splicing_entry_splicing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.splicing_entry_splicing_id_seq OWNER TO postgres;

--
-- Name: splicing_entry_splicing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.splicing_entry_splicing_id_seq OWNED BY public.splicing_entry.splicing_id;


--
-- Name: tc_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tc_detail (
    tc_detail_id integer NOT NULL,
    tc_id integer NOT NULL,
    bobbin_no character varying(100) NOT NULL,
    bobbin_fid character varying(100),
    length_km numeric(10,3),
    box_no character varying(50),
    stack_no character varying(50),
    qc_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.tc_detail OWNER TO postgres;

--
-- Name: tc_detail_tc_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tc_detail_tc_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tc_detail_tc_detail_id_seq OWNER TO postgres;

--
-- Name: tc_detail_tc_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tc_detail_tc_detail_id_seq OWNED BY public.tc_detail.tc_detail_id;


--
-- Name: tc_header; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tc_header (
    tc_id integer NOT NULL,
    packing_order character varying(100) NOT NULL,
    tc_number character varying(100) NOT NULL,
    tc_date date,
    customer_ref character varying(255),
    inspection_date date,
    inspection_by character varying(100),
    approved_by character varying(100),
    remarks text,
    revision character varying(20) DEFAULT '0'::character varying,
    version character varying(20) DEFAULT '1.0'::character varying,
    total_km numeric(12,3),
    total_bobbins integer,
    mb_1turn text,
    mb_10turn text,
    mech_proof text,
    mech_coat text,
    mech_aged text,
    mech_unaged text,
    env_temp text,
    env_thc text,
    env_htha text,
    env_water text,
    env_accel text,
    opc_egir text,
    opc_attn1 text,
    opc_attn2 text,
    opc_pd text,
    opc_nd text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.tc_header OWNER TO postgres;

--
-- Name: tc_header_tc_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tc_header_tc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tc_header_tc_id_seq OWNER TO postgres;

--
-- Name: tc_header_tc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tc_header_tc_id_seq OWNED BY public.tc_header.tc_id;


--
-- Name: temp_cycle_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_cycle_entry (
    temp_cycle_id integer NOT NULL,
    temp_entry_id integer,
    bobbin_no character varying(50),
    temperature integer,
    date date,
    "time" time without time zone,
    nm_1310 numeric(10,3),
    nm_1550 numeric(10,3),
    nm_1625 numeric(10,3),
    operator character varying(50),
    remark text,
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.temp_cycle_entry OWNER TO postgres;

--
-- Name: temp_cycle_entry_temp_cycle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.temp_cycle_entry_temp_cycle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_cycle_entry_temp_cycle_id_seq OWNER TO postgres;

--
-- Name: temp_cycle_entry_temp_cycle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.temp_cycle_entry_temp_cycle_id_seq OWNED BY public.temp_cycle_entry.temp_cycle_id;


--
-- Name: temp_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temp_entry (
    temp_entry_id integer NOT NULL,
    tesing_standrd character varying(100),
    format_no character varying(50),
    gr_clause_no numeric(10,3),
    req_per_gr text,
    bobbin_no character varying(50),
    fiber_length numeric(10,3),
    marker_a character varying(50),
    marker_b character varying(50),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    remark text,
    result character varying(10),
    prepared_by character varying(50),
    checked_by character varying(50),
    physical_obs character varying(100),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT temp_entry_result_check CHECK (((result)::text = ANY ((ARRAY['pass'::character varying, 'fail'::character varying])::text[])))
);


ALTER TABLE public.temp_entry OWNER TO postgres;

--
-- Name: temp_entry_temp_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.temp_entry_temp_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_entry_temp_entry_id_seq OWNER TO postgres;

--
-- Name: temp_entry_temp_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.temp_entry_temp_entry_id_seq OWNED BY public.temp_entry.temp_entry_id;


--
-- Name: tray_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tray_master (
    tray_id integer NOT NULL,
    tray_no integer NOT NULL,
    tray_name character varying(50),
    total_positions integer DEFAULT 60,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tray_master OWNER TO postgres;

--
-- Name: tray_master_tray_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tray_master_tray_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tray_master_tray_id_seq OWNER TO postgres;

--
-- Name: tray_master_tray_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tray_master_tray_id_seq OWNED BY public.tray_master.tray_id;


--
-- Name: tray_position; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tray_position (
    tray_position_id integer NOT NULL,
    tray_id integer NOT NULL,
    position_no integer NOT NULL,
    bobbin_no character varying(50),
    status character varying(20) DEFAULT 'EMPTY'::character varying,
    updated_by character varying(50),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tray_position_status_check CHECK (((status)::text = ANY ((ARRAY['EMPTY'::character varying, 'OCCUPIED'::character varying])::text[])))
);


ALTER TABLE public.tray_position OWNER TO postgres;

--
-- Name: tray_position_tray_position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tray_position_tray_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tray_position_tray_position_id_seq OWNER TO postgres;

--
-- Name: tray_position_tray_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tray_position_tray_position_id_seq OWNED BY public.tray_position.tray_position_id;


--
-- Name: trh_cycle_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trh_cycle_entry (
    trh_cycle_entry_id integer CONSTRAINT trh_cycle_entry_trh_cyce_entry_id_not_null NOT NULL,
    trh_entry_id integer,
    bobbin_no character varying(50),
    cycle_no integer,
    temperature integer,
    rh character varying(20),
    trh_date date,
    trh_time time without time zone,
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    tested_by character varying(50),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trh_cycle_entry OWNER TO postgres;

--
-- Name: trh_cycle_entry_trh_cyce_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trh_cycle_entry_trh_cyce_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trh_cycle_entry_trh_cyce_entry_id_seq OWNER TO postgres;

--
-- Name: trh_cycle_entry_trh_cyce_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trh_cycle_entry_trh_cyce_entry_id_seq OWNED BY public.trh_cycle_entry.trh_cycle_entry_id;


--
-- Name: trh_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trh_entry (
    trh_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    gr_clause_no numeric(10,3),
    req_per_gr text,
    temp_hum_range character varying(100),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trh_entry OWNER TO postgres;

--
-- Name: trh_entry_trh_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trh_entry_trh_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trh_entry_trh_entry_id_seq OWNER TO postgres;

--
-- Name: trh_entry_trh_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trh_entry_trh_entry_id_seq OWNED BY public.trh_entry.trh_entry_id;


--
-- Name: user_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_departments (
    id integer NOT NULL,
    emp_id character varying(50) NOT NULL,
    department_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_departments OWNER TO postgres;

--
-- Name: user_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_departments_id_seq OWNER TO postgres;

--
-- Name: user_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_departments_id_seq OWNED BY public.user_departments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    emp_id character varying(50) NOT NULL,
    emp_name character varying(100) NOT NULL,
    emp_mail_id character varying(150),
    mobile_no character varying(15),
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password character varying(255),
    is_active boolean DEFAULT true,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'supervisor'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wi_day_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wi_day_entry (
    wi_day_entry_id integer NOT NULL,
    wi_entry_id integer,
    bobbin_no character varying(50),
    wi_date date,
    wi_day integer,
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wi_day_entry OWNER TO postgres;

--
-- Name: wi_day_entry_wi_day_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wi_day_entry_wi_day_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wi_day_entry_wi_day_entry_id_seq OWNER TO postgres;

--
-- Name: wi_day_entry_wi_day_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wi_day_entry_wi_day_entry_id_seq OWNED BY public.wi_day_entry.wi_day_entry_id;


--
-- Name: wi_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wi_entry (
    wi_entry_id integer NOT NULL,
    bobbin_no character varying(50),
    format_no character varying(100),
    tite character varying(200),
    temp numeric(10,3),
    testing_standard character varying(100),
    marker_a character varying(50),
    marker_b character varying(50),
    start_date date,
    start_time time without time zone,
    end_date date,
    end_time time without time zone,
    fiber_length numeric(10,3),
    remark text,
    tested_by character varying(50),
    checked_by character varying(50),
    at_1310 numeric(10,3),
    at_1550 numeric(10,3),
    at_1625 numeric(10,3),
    logged_in_user character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wi_entry OWNER TO postgres;

--
-- Name: wi_entry_wi_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wi_entry_wi_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wi_entry_wi_entry_id_seq OWNER TO postgres;

--
-- Name: wi_entry_wi_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wi_entry_wi_entry_id_seq OWNED BY public.wi_entry.wi_entry_id;


--
-- Name: winding_observation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winding_observation (
    wind_obs_id integer NOT NULL,
    w_o_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    disable boolean DEFAULT false
);


ALTER TABLE public.winding_observation OWNER TO postgres;

--
-- Name: winding_observation_wind_obs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.winding_observation_wind_obs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.winding_observation_wind_obs_id_seq OWNER TO postgres;

--
-- Name: winding_observation_wind_obs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.winding_observation_wind_obs_id_seq OWNED BY public.winding_observation.wind_obs_id;


--
-- Name: aat_day_entry aat_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_day_entry ALTER COLUMN aat_day_entry_id SET DEFAULT nextval('public.aat_day_entry_aat_day_entry_id_seq'::regclass);


--
-- Name: aat_entry aat_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_entry ALTER COLUMN aat_entry_id SET DEFAULT nextval('public.aat_entry_aat_entry_id_seq'::regclass);


--
-- Name: bobbin_color bobbin_color_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_color ALTER COLUMN bobbin_color_id SET DEFAULT nextval('public.bobbin_color_bobbin_color_id_seq'::regclass);


--
-- Name: bobbin_entries fid_create_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries ALTER COLUMN fid_create_id SET DEFAULT nextval('public.bobbin_entries_fid_create_id_seq'::regclass);


--
-- Name: bobbin_type bobbin_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_type ALTER COLUMN bobbin_type_id SET DEFAULT nextval('public.bobbin_type_bobbin_type_id_seq'::regclass);


--
-- Name: bom_master bom_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master ALTER COLUMN bom_id SET DEFAULT nextval('public.bom_master_bom_id_seq'::regclass);


--
-- Name: coloring_entry colouring_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coloring_entry ALTER COLUMN colouring_id SET DEFAULT nextval('public.coloring_entry_colouring_id_seq'::regclass);


--
-- Name: customer_table customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_table ALTER COLUMN customer_id SET DEFAULT nextval('public.customer_table_customer_id_seq'::regclass);


--
-- Name: d2_chamber d2_chamber_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_chamber ALTER COLUMN d2_chamber_id SET DEFAULT nextval('public.d2_chamber_d2_chamber_id_seq'::regclass);


--
-- Name: d2_gas_entry d2_gas_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_gas_entry ALTER COLUMN d2_gas_id SET DEFAULT nextval('public.d2_gas_entry_d2_gas_id_seq'::regclass);


--
-- Name: d2_issue d2_isseue_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue ALTER COLUMN d2_isseue_id SET DEFAULT nextval('public.d2_issue_d2_isseue_id_seq'::regclass);


--
-- Name: d2_issue_draft d2_draft_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue_draft ALTER COLUMN d2_draft_id SET DEFAULT nextval('public.d2_issue_draft_d2_draft_id_seq'::regclass);


--
-- Name: d_fiber_cut_reasons dfcr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons ALTER COLUMN dfcr_id SET DEFAULT nextval('public.d_fiber_cut_reasons_dfcr_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: draw_break_analysis break_analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_break_analysis ALTER COLUMN break_analysis_id SET DEFAULT nextval('public.draw_break_analysis_break_analysis_id_seq'::regclass);


--
-- Name: draw_flaw_details draw_flaw_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details ALTER COLUMN draw_flaw_id SET DEFAULT nextval('public.draw_flaw_details_draw_flaw_id_seq'::regclass);


--
-- Name: draw_shift_plan dsp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_shift_plan ALTER COLUMN dsp_id SET DEFAULT nextval('public.draw_shift_plan_dsp_id_seq'::regclass);


--
-- Name: draw_tower tower_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower ALTER COLUMN tower_id SET DEFAULT nextval('public.draw_tower_tower_id_seq'::regclass);


--
-- Name: draw_users draw_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_users ALTER COLUMN draw_user_id SET DEFAULT nextval('public.draw_users_draw_user_id_seq'::regclass);


--
-- Name: dyanmic_fartique dynamic_fartique_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique ALTER COLUMN dynamic_fartique_id SET DEFAULT nextval('public.dyanmic_fartique_dynamic_fartique_id_seq'::regclass);


--
-- Name: dyanmic_fartique_speed dyanmic_fartique_speed_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique_speed ALTER COLUMN dyanmic_fartique_speed_id SET DEFAULT nextval('public.dyanmic_fartique_speed_dyanmic_fartique_speed_id_seq'::regclass);


--
-- Name: f_cable_cable_cutoff id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cable_cable_cutoff ALTER COLUMN id SET DEFAULT nextval('public.f_cable_cable_cutoff_id_seq'::regclass);


--
-- Name: f_cd_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cd_history ALTER COLUMN id SET DEFAULT nextval('public.f_cd_history_id_seq'::regclass);


--
-- Name: f_coating_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_coating_history ALTER COLUMN id SET DEFAULT nextval('public.f_coating_history_id_seq'::regclass);


--
-- Name: f_curl_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_curl_history ALTER COLUMN id SET DEFAULT nextval('public.f_curl_history_id_seq'::regclass);


--
-- Name: f_cutoff_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cutoff_history ALTER COLUMN id SET DEFAULT nextval('public.f_cutoff_history_id_seq'::regclass);


--
-- Name: f_geometry_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_geometry_history ALTER COLUMN id SET DEFAULT nextval('public.f_geometry_history_id_seq'::regclass);


--
-- Name: f_length_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_length_history ALTER COLUMN id SET DEFAULT nextval('public.f_length_history_id_seq'::regclass);


--
-- Name: f_mbend_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mbend_history ALTER COLUMN id SET DEFAULT nextval('public.f_mbend_history_id_seq'::regclass);


--
-- Name: f_mfd_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mfd_history ALTER COLUMN id SET DEFAULT nextval('public.f_mfd_history_id_seq'::regclass);


--
-- Name: f_pmd_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_pmd_history ALTER COLUMN id SET DEFAULT nextval('public.f_pmd_history_id_seq'::regclass);


--
-- Name: f_spectral_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_spectral_history ALTER COLUMN id SET DEFAULT nextval('public.f_spectral_history_id_seq'::regclass);


--
-- Name: fg_color fg_color_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_color ALTER COLUMN fg_color_id SET DEFAULT nextval('public.fg_color_fg_color_id_seq'::regclass);


--
-- Name: fg_rewind fg_rewind_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_rewind ALTER COLUMN fg_rewind_id SET DEFAULT nextval('public.fg_rewind_fg_rewind_id_seq'::regclass);


--
-- Name: fiber_cut_indication indication_fiber_cut_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_cut_indication ALTER COLUMN indication_fiber_cut_id SET DEFAULT nextval('public.fiber_cut_indication_indication_fiber_cut_id_seq'::regclass);


--
-- Name: grade_mandatory grade_mandatory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_mandatory ALTER COLUMN grade_mandatory_id SET DEFAULT nextval('public.grade_mandatory_grade_mandatory_id_seq'::regclass);


--
-- Name: h2_ageing h2_ageing_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_ageing ALTER COLUMN h2_ageing_id SET DEFAULT nextval('public.h2_ageing_h2_ageing_id_seq'::regclass);


--
-- Name: h2_chamber h2_chamber_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_chamber ALTER COLUMN h2_chamber_id SET DEFAULT nextval('public.h2_chamber_h2_chamber_id_seq'::regclass);


--
-- Name: handle_join handle_join_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join ALTER COLUMN handle_join_id SET DEFAULT nextval('public.handle_join_handle_join_id_seq'::regclass);


--
-- Name: hot_water_day_entry hot_water_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_day_entry ALTER COLUMN hot_water_day_entry_id SET DEFAULT nextval('public.hot_water_day_entry_hot_water_day_entry_id_seq'::regclass);


--
-- Name: hot_water_entry hot_water_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_entry ALTER COLUMN hot_water_entry_id SET DEFAULT nextval('public.hot_water_entry_hot_water_entry_id_seq'::regclass);


--
-- Name: htha_day_entry htha_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_day_entry ALTER COLUMN htha_day_entry_id SET DEFAULT nextval('public.htha_day_entry_htha_day_entry_id_seq'::regclass);


--
-- Name: htha_entry htha_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_entry ALTER COLUMN htha_entry_id SET DEFAULT nextval('public.htha_entry_htha_entry_id_seq'::regclass);


--
-- Name: master_preform_type preform_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type ALTER COLUMN preform_type_id SET DEFAULT nextval('public.master_preform_type_preform_type_id_seq'::regclass);


--
-- Name: mat_stock mat_stock_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mat_stock ALTER COLUMN mat_stock_id SET DEFAULT nextval('public.mat_stock_mat_stock_id_seq'::regclass);


--
-- Name: packing_order packing_order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order ALTER COLUMN packing_order_id SET DEFAULT nextval('public.packing_order_packing_order_id_seq'::regclass);


--
-- Name: packing_order_bobbin packing_order_bobbin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin ALTER COLUMN packing_order_bobbin_id SET DEFAULT nextval('public.packing_order_bobbin_packing_order_bobbin_id_seq'::regclass);


--
-- Name: preform_accept acceptance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept ALTER COLUMN acceptance_id SET DEFAULT nextval('public.preform_accept_acceptance_id_seq'::regclass);


--
-- Name: preform_allocation allocation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation ALTER COLUMN allocation_id SET DEFAULT nextval('public.preform_allocation_allocation_id_seq'::regclass);


--
-- Name: preform_process_type_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.preform_process_type_mapping_mapping_id_seq'::regclass);


--
-- Name: process_order process_o_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_order ALTER COLUMN process_o_id SET DEFAULT nextval('public.process_order_process_o_id_seq'::regclass);


--
-- Name: process_type_master process_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_type_master ALTER COLUMN process_type_id SET DEFAULT nextval('public.process_type_master_process_type_id_seq'::regclass);


--
-- Name: pt_allocation pt_allocation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation ALTER COLUMN pt_allocation_id SET DEFAULT nextval('public.pt_allocation_pt_allocation_id_seq'::regclass);


--
-- Name: pt_break_analysis break_analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_break_analysis ALTER COLUMN break_analysis_id SET DEFAULT nextval('public.pt_break_analysis_break_analysis_id_seq'::regclass);


--
-- Name: pt_entry pt_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry ALTER COLUMN pt_entry_id SET DEFAULT nextval('public.pt_entry_pt_entry_id_seq'::regclass);


--
-- Name: pt_flaw_details pt_flaw_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_flaw_details ALTER COLUMN pt_flaw_id SET DEFAULT nextval('public.pt_flaw_details_pt_flaw_id_seq'::regclass);


--
-- Name: pt_machine pt_machine_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine ALTER COLUMN pt_machine_id SET DEFAULT nextval('public.pt_machine_pt_machine_id_seq'::regclass);


--
-- Name: pt_users pt_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_users ALTER COLUMN pt_user_id SET DEFAULT nextval('public.pt_users_pt_user_id_seq'::regclass);


--
-- Name: pv_entries pv_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pv_entries ALTER COLUMN pv_entry_id SET DEFAULT nextval('public.pv_entries_pv_entry_id_seq'::regclass);


--
-- Name: qc_grade qc_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_grade ALTER COLUMN qc_entry_id SET DEFAULT nextval('public.qc_grade_qc_entry_id_seq'::regclass);


--
-- Name: qc_out qc_out_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_out ALTER COLUMN qc_out_id SET DEFAULT nextval('public.qc_out_qc_out_id_seq'::regclass);


--
-- Name: qc_users qc_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_users ALTER COLUMN qc_user_id SET DEFAULT nextval('public.qc_users_qc_user_id_seq'::regclass);


--
-- Name: report_execution_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_execution_log ALTER COLUMN id SET DEFAULT nextval('public.report_execution_log_id_seq'::regclass);


--
-- Name: report_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_master ALTER COLUMN id SET DEFAULT nextval('public.report_master_id_seq'::regclass);


--
-- Name: report_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_permissions ALTER COLUMN id SET DEFAULT nextval('public.report_permissions_id_seq'::regclass);


--
-- Name: report_saved_filters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_saved_filters ALTER COLUMN id SET DEFAULT nextval('public.report_saved_filters_id_seq'::regclass);


--
-- Name: report_section_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.report_section_mapping_mapping_id_seq'::regclass);


--
-- Name: report_section_master section_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_master ALTER COLUMN section_id SET DEFAULT nextval('public.report_section_master_section_id_seq'::regclass);


--
-- Name: report_sheets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sheets ALTER COLUMN id SET DEFAULT nextval('public.report_sheets_id_seq'::regclass);


--
-- Name: report_tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables ALTER COLUMN id SET DEFAULT nextval('public.report_tables_id_seq'::regclass);


--
-- Name: report_version_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_version_history ALTER COLUMN id SET DEFAULT nextval('public.report_version_history_id_seq'::regclass);


--
-- Name: rewind_instr rewind_instr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewind_instr ALTER COLUMN rewind_instr_id SET DEFAULT nextval('public.rewind_instr_rewind_instr_id_seq'::regclass);


--
-- Name: rewinding_entry rewinding_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewinding_entry ALTER COLUMN rewinding_id SET DEFAULT nextval('public.rewinding_entry_rewinding_id_seq'::regclass);


--
-- Name: sap_transaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sap_transaction ALTER COLUMN id SET DEFAULT nextval('public.sap_transaction_id_seq'::regclass);


--
-- Name: shifts shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN shift_id SET DEFAULT nextval('public.shifts_shift_id_seq'::regclass);


--
-- Name: spec_mandatory spec_mandatory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_mandatory ALTER COLUMN spec_mandatory_id SET DEFAULT nextval('public.spec_mandatory_spec_mandatory_id_seq'::regclass);


--
-- Name: spec_master spec_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_master ALTER COLUMN spec_id SET DEFAULT nextval('public.spec_master_spec_id_seq'::regclass);


--
-- Name: splicing_entry splicing_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splicing_entry ALTER COLUMN splicing_id SET DEFAULT nextval('public.splicing_entry_splicing_id_seq'::regclass);


--
-- Name: tc_detail tc_detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_detail ALTER COLUMN tc_detail_id SET DEFAULT nextval('public.tc_detail_tc_detail_id_seq'::regclass);


--
-- Name: tc_header tc_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_header ALTER COLUMN tc_id SET DEFAULT nextval('public.tc_header_tc_id_seq'::regclass);


--
-- Name: temp_cycle_entry temp_cycle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_cycle_entry ALTER COLUMN temp_cycle_id SET DEFAULT nextval('public.temp_cycle_entry_temp_cycle_id_seq'::regclass);


--
-- Name: temp_entry temp_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_entry ALTER COLUMN temp_entry_id SET DEFAULT nextval('public.temp_entry_temp_entry_id_seq'::regclass);


--
-- Name: tray_master tray_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_master ALTER COLUMN tray_id SET DEFAULT nextval('public.tray_master_tray_id_seq'::regclass);


--
-- Name: tray_position tray_position_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position ALTER COLUMN tray_position_id SET DEFAULT nextval('public.tray_position_tray_position_id_seq'::regclass);


--
-- Name: trh_cycle_entry trh_cycle_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_cycle_entry ALTER COLUMN trh_cycle_entry_id SET DEFAULT nextval('public.trh_cycle_entry_trh_cyce_entry_id_seq'::regclass);


--
-- Name: trh_entry trh_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_entry ALTER COLUMN trh_entry_id SET DEFAULT nextval('public.trh_entry_trh_entry_id_seq'::regclass);


--
-- Name: user_departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments ALTER COLUMN id SET DEFAULT nextval('public.user_departments_id_seq'::regclass);


--
-- Name: wi_day_entry wi_day_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_day_entry ALTER COLUMN wi_day_entry_id SET DEFAULT nextval('public.wi_day_entry_wi_day_entry_id_seq'::regclass);


--
-- Name: wi_entry wi_entry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_entry ALTER COLUMN wi_entry_id SET DEFAULT nextval('public.wi_entry_wi_entry_id_seq'::regclass);


--
-- Name: winding_observation wind_obs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winding_observation ALTER COLUMN wind_obs_id SET DEFAULT nextval('public.winding_observation_wind_obs_id_seq'::regclass);


--
-- Name: aat_day_entry aat_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_day_entry
    ADD CONSTRAINT aat_day_entry_pkey PRIMARY KEY (aat_day_entry_id);


--
-- Name: aat_entry aat_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_entry
    ADD CONSTRAINT aat_entry_pkey PRIMARY KEY (aat_entry_id);


--
-- Name: bobbin_color bobbin_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_color
    ADD CONSTRAINT bobbin_color_pkey PRIMARY KEY (bobbin_color_id);


--
-- Name: bobbin_entries bobbin_entries_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries
    ADD CONSTRAINT bobbin_entries_fid_key UNIQUE (fid);


--
-- Name: bobbin_entries bobbin_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_entries
    ADD CONSTRAINT bobbin_entries_pkey PRIMARY KEY (fid_create_id);


--
-- Name: bobbin_type bobbin_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bobbin_type
    ADD CONSTRAINT bobbin_type_pkey PRIMARY KEY (bobbin_type_id);


--
-- Name: bom_master bom_master_material_code_component_material_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master
    ADD CONSTRAINT bom_master_material_code_component_material_code_key UNIQUE (material_code, component_material_code);


--
-- Name: bom_master bom_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master
    ADD CONSTRAINT bom_master_pkey PRIMARY KEY (bom_id);


--
-- Name: coloring_entry coloring_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coloring_entry
    ADD CONSTRAINT coloring_entry_pkey PRIMARY KEY (colouring_id);


--
-- Name: customer_complaint customer_complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_complaint
    ADD CONSTRAINT customer_complaint_pkey PRIMARY KEY (complaint_id);


--
-- Name: customer_table customer_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_table
    ADD CONSTRAINT customer_table_pkey PRIMARY KEY (customer_id);


--
-- Name: d2_chamber d2_chamber_d2_chamber_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_chamber
    ADD CONSTRAINT d2_chamber_d2_chamber_no_key UNIQUE (d2_chamber_no);


--
-- Name: d2_chamber d2_chamber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_chamber
    ADD CONSTRAINT d2_chamber_pkey PRIMARY KEY (d2_chamber_id);


--
-- Name: d2_gas_entry d2_gas_entry_d2_batch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_gas_entry
    ADD CONSTRAINT d2_gas_entry_d2_batch_id_key UNIQUE (d2_batch_id);


--
-- Name: d2_gas_entry d2_gas_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_gas_entry
    ADD CONSTRAINT d2_gas_entry_pkey PRIMARY KEY (d2_gas_id);


--
-- Name: d2_issue d2_issue_bobbin_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue
    ADD CONSTRAINT d2_issue_bobbin_fid_key UNIQUE (bobbin_fid);


--
-- Name: d2_issue d2_issue_bobbin_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue
    ADD CONSTRAINT d2_issue_bobbin_no_key UNIQUE (bobbin_no);


--
-- Name: d2_issue_draft d2_issue_draft_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue_draft
    ADD CONSTRAINT d2_issue_draft_pkey PRIMARY KEY (d2_draft_id);


--
-- Name: d2_issue d2_issue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue
    ADD CONSTRAINT d2_issue_pkey PRIMARY KEY (d2_isseue_id);


--
-- Name: d_fiber_cut_reasons d_fiber_cut_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons
    ADD CONSTRAINT d_fiber_cut_reasons_pkey PRIMARY KEY (dfcr_id);


--
-- Name: departments departments_d_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_d_name_key UNIQUE (d_name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: draw_break_analysis draw_break_analysis_fiber_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_break_analysis
    ADD CONSTRAINT draw_break_analysis_fiber_id_key UNIQUE (fiber_id);


--
-- Name: draw_break_analysis draw_break_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_break_analysis
    ADD CONSTRAINT draw_break_analysis_pkey PRIMARY KEY (break_analysis_id);


--
-- Name: draw_entry draw_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT draw_entry_pkey PRIMARY KEY (spool_id);


--
-- Name: draw_flaw_details draw_flaw_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details
    ADD CONSTRAINT draw_flaw_details_pkey PRIMARY KEY (draw_flaw_id);


--
-- Name: draw_shift_plan draw_shift_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_shift_plan
    ADD CONSTRAINT draw_shift_plan_pkey PRIMARY KEY (dsp_id);


--
-- Name: draw_tower draw_tower_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower
    ADD CONSTRAINT draw_tower_pkey PRIMARY KEY (tower_id);


--
-- Name: draw_tower draw_tower_tower_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower
    ADD CONSTRAINT draw_tower_tower_no_key UNIQUE (tower_no);


--
-- Name: draw_users draw_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_users
    ADD CONSTRAINT draw_users_pkey PRIMARY KEY (draw_user_id);


--
-- Name: dyanmic_fartique dyanmic_fartique_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique
    ADD CONSTRAINT dyanmic_fartique_pkey PRIMARY KEY (dynamic_fartique_id);


--
-- Name: dyanmic_fartique_speed dyanmic_fartique_speed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique_speed
    ADD CONSTRAINT dyanmic_fartique_speed_pkey PRIMARY KEY (dyanmic_fartique_speed_id);


--
-- Name: f_cable_cable_cutoff f_cable_cable_cutoff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cable_cable_cutoff
    ADD CONSTRAINT f_cable_cable_cutoff_pkey PRIMARY KEY (id);


--
-- Name: f_cd_history f_cd_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cd_history
    ADD CONSTRAINT f_cd_history_pkey PRIMARY KEY (id);


--
-- Name: f_coating_history f_coating_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_coating_history
    ADD CONSTRAINT f_coating_history_pkey PRIMARY KEY (id);


--
-- Name: f_curl_history f_curl_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_curl_history
    ADD CONSTRAINT f_curl_history_pkey PRIMARY KEY (id);


--
-- Name: f_cutoff_history f_cutoff_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_cutoff_history
    ADD CONSTRAINT f_cutoff_history_pkey PRIMARY KEY (id);


--
-- Name: f_geometry_history f_geometry_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_geometry_history
    ADD CONSTRAINT f_geometry_history_pkey PRIMARY KEY (id);


--
-- Name: f_length_history f_length_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_length_history
    ADD CONSTRAINT f_length_history_pkey PRIMARY KEY (id);


--
-- Name: f_mbend_history f_mbend_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mbend_history
    ADD CONSTRAINT f_mbend_history_pkey PRIMARY KEY (id);


--
-- Name: f_mfd_history f_mfd_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_mfd_history
    ADD CONSTRAINT f_mfd_history_pkey PRIMARY KEY (id);


--
-- Name: f_pmd_history f_pmd_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_pmd_history
    ADD CONSTRAINT f_pmd_history_pkey PRIMARY KEY (id);


--
-- Name: f_spectral_history f_spectral_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.f_spectral_history
    ADD CONSTRAINT f_spectral_history_pkey PRIMARY KEY (id);


--
-- Name: fg_color fg_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_color
    ADD CONSTRAINT fg_color_pkey PRIMARY KEY (fg_color_id);


--
-- Name: fg_rewind fg_rewind_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fg_rewind
    ADD CONSTRAINT fg_rewind_pkey PRIMARY KEY (fg_rewind_id);


--
-- Name: fiber_cut_indication fiber_cut_indication_indication_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_cut_indication
    ADD CONSTRAINT fiber_cut_indication_indication_name_key UNIQUE (indication_name);


--
-- Name: fiber_cut_indication fiber_cut_indication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_cut_indication
    ADD CONSTRAINT fiber_cut_indication_pkey PRIMARY KEY (indication_fiber_cut_id);


--
-- Name: grade_mandatory grade_mandatory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_mandatory
    ADD CONSTRAINT grade_mandatory_pkey PRIMARY KEY (grade_mandatory_id);


--
-- Name: h2_ageing h2_ageing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_ageing
    ADD CONSTRAINT h2_ageing_pkey PRIMARY KEY (h2_ageing_id);


--
-- Name: h2_chamber h2_chamber_h2_chamber_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_chamber
    ADD CONSTRAINT h2_chamber_h2_chamber_no_key UNIQUE (h2_chamber_no);


--
-- Name: h2_chamber h2_chamber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h2_chamber
    ADD CONSTRAINT h2_chamber_pkey PRIMARY KEY (h2_chamber_id);


--
-- Name: handle_join handle_join_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join
    ADD CONSTRAINT handle_join_pkey PRIMARY KEY (handle_join_id);


--
-- Name: hot_water_day_entry hot_water_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_day_entry
    ADD CONSTRAINT hot_water_day_entry_pkey PRIMARY KEY (hot_water_day_entry_id);


--
-- Name: hot_water_entry hot_water_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_entry
    ADD CONSTRAINT hot_water_entry_pkey PRIMARY KEY (hot_water_entry_id);


--
-- Name: htha_day_entry htha_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_day_entry
    ADD CONSTRAINT htha_day_entry_pkey PRIMARY KEY (htha_day_entry_id);


--
-- Name: htha_entry htha_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_entry
    ADD CONSTRAINT htha_entry_pkey PRIMARY KEY (htha_entry_id);


--
-- Name: master_preform_type master_preform_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_pkey PRIMARY KEY (preform_type_id);


--
-- Name: master_preform_type master_preform_type_preform_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_preform_type_name_key UNIQUE (preform_type_name);


--
-- Name: mat_stock mat_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mat_stock
    ADD CONSTRAINT mat_stock_pkey PRIMARY KEY (mat_stock_id);


--
-- Name: material_master material_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_master
    ADD CONSTRAINT material_master_pkey PRIMARY KEY (material_code);


--
-- Name: packing_order_bobbin packing_order_bobbin_packing_order_bobbin_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin
    ADD CONSTRAINT packing_order_bobbin_packing_order_bobbin_no_key UNIQUE (packing_order, bobbin_no);


--
-- Name: packing_order_bobbin packing_order_bobbin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin
    ADD CONSTRAINT packing_order_bobbin_pkey PRIMARY KEY (packing_order_bobbin_id);


--
-- Name: packing_order packing_order_order_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order
    ADD CONSTRAINT packing_order_order_no_key UNIQUE (order_no);


--
-- Name: packing_order packing_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order
    ADD CONSTRAINT packing_order_pkey PRIMARY KEY (packing_order_id);


--
-- Name: preform_accept preform_accept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT preform_accept_pkey PRIMARY KEY (acceptance_id);


--
-- Name: preform_allocation preform_allocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_pkey PRIMARY KEY (allocation_id);


--
-- Name: preform_data preform_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_data
    ADD CONSTRAINT preform_data_pkey PRIMARY KEY (preform_id);


--
-- Name: preform_process_type_mapping preform_process_type_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping
    ADD CONSTRAINT preform_process_type_mapping_pkey PRIMARY KEY (mapping_id);


--
-- Name: preform_process_type_mapping preform_process_type_mapping_preform_type_process_type_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping
    ADD CONSTRAINT preform_process_type_mapping_preform_type_process_type_id_key UNIQUE (preform_type, process_type_id);


--
-- Name: process_order process_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_order
    ADD CONSTRAINT process_order_pkey PRIMARY KEY (process_o_id);


--
-- Name: process_type_master process_type_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_type_master
    ADD CONSTRAINT process_type_master_pkey PRIMARY KEY (process_type_id);


--
-- Name: process_type_master process_type_master_process_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_type_master
    ADD CONSTRAINT process_type_master_process_type_key UNIQUE (process_type);


--
-- Name: pt_allocation pt_allocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation
    ADD CONSTRAINT pt_allocation_pkey PRIMARY KEY (pt_allocation_id);


--
-- Name: pt_break_analysis pt_break_analysis_fiber_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_break_analysis
    ADD CONSTRAINT pt_break_analysis_fiber_id_key UNIQUE (fiber_id);


--
-- Name: pt_break_analysis pt_break_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_break_analysis
    ADD CONSTRAINT pt_break_analysis_pkey PRIMARY KEY (break_analysis_id);


--
-- Name: pt_entry pt_entry_bobbin_no_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry
    ADD CONSTRAINT pt_entry_bobbin_no_unique UNIQUE (bobbin_no);


--
-- Name: pt_entry pt_entry_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry
    ADD CONSTRAINT pt_entry_fid_key UNIQUE (fid);


--
-- Name: pt_entry pt_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_entry
    ADD CONSTRAINT pt_entry_pkey PRIMARY KEY (pt_entry_id);


--
-- Name: pt_flaw_details pt_flaw_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_flaw_details
    ADD CONSTRAINT pt_flaw_details_pkey PRIMARY KEY (pt_flaw_id);


--
-- Name: pt_machine_logs pt_machine_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine_logs
    ADD CONSTRAINT pt_machine_logs_pkey PRIMARY KEY (spool_code_tu, machine_number);


--
-- Name: pt_machine pt_machine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine
    ADD CONSTRAINT pt_machine_pkey PRIMARY KEY (pt_machine_id);


--
-- Name: pt_machine pt_machine_pt_machine_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_machine
    ADD CONSTRAINT pt_machine_pt_machine_no_key UNIQUE (pt_machine_no);


--
-- Name: pt_users pt_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_users
    ADD CONSTRAINT pt_users_pkey PRIMARY KEY (pt_user_id);


--
-- Name: pv_entries pv_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pv_entries
    ADD CONSTRAINT pv_entries_pkey PRIMARY KEY (pv_entry_id);


--
-- Name: qc_entry qc_entry_bobbin_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry
    ADD CONSTRAINT qc_entry_bobbin_fid_key UNIQUE (bobbin_fid);


--
-- Name: qc_entry qc_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry
    ADD CONSTRAINT qc_entry_pkey PRIMARY KEY (bobbin_no);


--
-- Name: qc_entry_temp qc_entry_temp_bobbin_fid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry_temp
    ADD CONSTRAINT qc_entry_temp_bobbin_fid_key UNIQUE (bobbin_fid);


--
-- Name: qc_entry_temp qc_entry_temp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_entry_temp
    ADD CONSTRAINT qc_entry_temp_pkey PRIMARY KEY (bobbin_no);


--
-- Name: qc_grade qc_grade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_grade
    ADD CONSTRAINT qc_grade_pkey PRIMARY KEY (qc_entry_id);


--
-- Name: qc_out qc_out_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_out
    ADD CONSTRAINT qc_out_pkey PRIMARY KEY (qc_out_id);


--
-- Name: qc_users qc_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qc_users
    ADD CONSTRAINT qc_users_pkey PRIMARY KEY (qc_user_id);


--
-- Name: report_execution_log report_execution_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_execution_log
    ADD CONSTRAINT report_execution_log_pkey PRIMARY KEY (id);


--
-- Name: report_master report_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_master
    ADD CONSTRAINT report_master_pkey PRIMARY KEY (id);


--
-- Name: report_permissions report_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_permissions
    ADD CONSTRAINT report_permissions_pkey PRIMARY KEY (id);


--
-- Name: report_saved_filters report_saved_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_saved_filters
    ADD CONSTRAINT report_saved_filters_pkey PRIMARY KEY (id);


--
-- Name: report_section_mapping report_section_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_pkey PRIMARY KEY (mapping_id);


--
-- Name: report_section_mapping report_section_mapping_report_id_section_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_report_id_section_id_key UNIQUE (report_id, section_id);


--
-- Name: report_section_master report_section_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_master
    ADD CONSTRAINT report_section_master_pkey PRIMARY KEY (section_id);


--
-- Name: report_section_master report_section_master_section_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_master
    ADD CONSTRAINT report_section_master_section_key_key UNIQUE (section_key);


--
-- Name: report_sheets report_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sheets
    ADD CONSTRAINT report_sheets_pkey PRIMARY KEY (id);


--
-- Name: report_tables report_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables
    ADD CONSTRAINT report_tables_pkey PRIMARY KEY (id);


--
-- Name: report_version_history report_version_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_version_history
    ADD CONSTRAINT report_version_history_pkey PRIMARY KEY (id);


--
-- Name: rewind_instr rewind_instr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewind_instr
    ADD CONSTRAINT rewind_instr_pkey PRIMARY KEY (rewind_instr_id);


--
-- Name: rewinding_entry rewinding_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewinding_entry
    ADD CONSTRAINT rewinding_entry_pkey PRIMARY KEY (rewinding_id);


--
-- Name: sap_transaction sap_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sap_transaction
    ADD CONSTRAINT sap_transaction_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (shift_id);


--
-- Name: spec_mandatory spec_mandatory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_mandatory
    ADD CONSTRAINT spec_mandatory_pkey PRIMARY KEY (spec_mandatory_id);


--
-- Name: spec_master spec_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spec_master
    ADD CONSTRAINT spec_master_pkey PRIMARY KEY (spec_id);


--
-- Name: splicing_entry splicing_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splicing_entry
    ADD CONSTRAINT splicing_entry_pkey PRIMARY KEY (splicing_id);


--
-- Name: tc_detail tc_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_detail
    ADD CONSTRAINT tc_detail_pkey PRIMARY KEY (tc_detail_id);


--
-- Name: tc_header tc_header_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_header
    ADD CONSTRAINT tc_header_pkey PRIMARY KEY (tc_id);


--
-- Name: tc_header tc_header_tc_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_header
    ADD CONSTRAINT tc_header_tc_number_key UNIQUE (tc_number);


--
-- Name: temp_cycle_entry temp_cycle_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_cycle_entry
    ADD CONSTRAINT temp_cycle_entry_pkey PRIMARY KEY (temp_cycle_id);


--
-- Name: temp_entry temp_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_entry
    ADD CONSTRAINT temp_entry_pkey PRIMARY KEY (temp_entry_id);


--
-- Name: tray_master tray_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_master
    ADD CONSTRAINT tray_master_pkey PRIMARY KEY (tray_id);


--
-- Name: tray_master tray_master_tray_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_master
    ADD CONSTRAINT tray_master_tray_no_key UNIQUE (tray_no);


--
-- Name: tray_position tray_position_bobbin_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_bobbin_no_key UNIQUE (bobbin_no);


--
-- Name: tray_position tray_position_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_pkey PRIMARY KEY (tray_position_id);


--
-- Name: tray_position tray_position_tray_id_position_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_tray_id_position_no_key UNIQUE (tray_id, position_no);


--
-- Name: trh_cycle_entry trh_cycle_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_cycle_entry
    ADD CONSTRAINT trh_cycle_entry_pkey PRIMARY KEY (trh_cycle_entry_id);


--
-- Name: trh_entry trh_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_entry
    ADD CONSTRAINT trh_entry_pkey PRIMARY KEY (trh_entry_id);


--
-- Name: d2_issue_draft uq_d2_issue_draft_bobbin; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d2_issue_draft
    ADD CONSTRAINT uq_d2_issue_draft_bobbin UNIQUE (bobbin_no);


--
-- Name: preform_accept uq_preform_accept_preform_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT uq_preform_accept_preform_id UNIQUE (preform_id);


--
-- Name: user_departments user_departments_emp_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_emp_id_department_id_key UNIQUE (emp_id, department_id);


--
-- Name: user_departments user_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (emp_id);


--
-- Name: wi_day_entry wi_day_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_day_entry
    ADD CONSTRAINT wi_day_entry_pkey PRIMARY KEY (wi_day_entry_id);


--
-- Name: wi_entry wi_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_entry
    ADD CONSTRAINT wi_entry_pkey PRIMARY KEY (wi_entry_id);


--
-- Name: winding_observation winding_observation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winding_observation
    ADD CONSTRAINT winding_observation_pkey PRIMARY KEY (wind_obs_id);


--
-- Name: idx_f_cable_cable_cutoff_fiber_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_f_cable_cable_cutoff_fiber_id ON public.f_cable_cable_cutoff USING btree (fiber_id);


--
-- Name: idx_f_mbend_history_fiber_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_f_mbend_history_fiber_id ON public.f_mbend_history USING btree (fiber_id);


--
-- Name: idx_process_order_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_order_material ON public.process_order USING btree (material_code) WHERE (is_active = true);


--
-- Name: idx_pt_entry_spool_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pt_entry_spool_id ON public.pt_entry USING btree (spool_id);


--
-- Name: idx_pt_entry_spool_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pt_entry_spool_start ON public.pt_entry USING btree (spool_id, start_length);


--
-- Name: idx_qc_entry_spec_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qc_entry_spec_priority ON public.qc_grade USING btree (product_type, priority);


--
-- Name: idx_report_execution_log_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_execution_log_report ON public.report_execution_log USING btree (report_id);


--
-- Name: idx_report_execution_log_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_execution_log_user ON public.report_execution_log USING btree (executed_by);


--
-- Name: idx_report_master_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_master_module ON public.report_master USING btree (module) WHERE (is_deleted = false);


--
-- Name: idx_report_master_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_master_status ON public.report_master USING btree (status) WHERE (is_deleted = false);


--
-- Name: idx_report_permissions_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_permissions_entity ON public.report_permissions USING btree (permission_type, entity_id);


--
-- Name: idx_report_permissions_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_permissions_report ON public.report_permissions USING btree (report_id);


--
-- Name: idx_report_saved_filters_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_saved_filters_report ON public.report_saved_filters USING btree (report_id, user_id);


--
-- Name: idx_report_section_mapping_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_section_mapping_report ON public.report_section_mapping USING btree (report_id);


--
-- Name: idx_report_section_mapping_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_section_mapping_section ON public.report_section_mapping USING btree (section_id);


--
-- Name: idx_report_sheets_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_sheets_report_id ON public.report_sheets USING btree (report_id);


--
-- Name: idx_report_tables_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_tables_report_id ON public.report_tables USING btree (report_id);


--
-- Name: idx_report_tables_sheet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_tables_sheet_id ON public.report_tables USING btree (sheet_id);


--
-- Name: idx_sap_transaction_draw_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_transaction_draw_entry ON public.sap_transaction USING btree (draw_entry_id);


--
-- Name: idx_sap_transaction_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_transaction_material ON public.sap_transaction USING btree (material_code);


--
-- Name: idx_sap_transaction_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_transaction_no ON public.sap_transaction USING btree (transaction_no);


--
-- Name: idx_sap_transaction_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sap_transaction_status ON public.sap_transaction USING btree (sap_status);


--
-- Name: idx_spool_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spool_logs_date ON public.pt_machine_logs USING btree (start_date);


--
-- Name: idx_tc_detail_bobbin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_detail_bobbin ON public.tc_detail USING btree (bobbin_no);


--
-- Name: idx_tc_detail_tc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_detail_tc ON public.tc_detail USING btree (tc_id);


--
-- Name: idx_tc_header_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_header_number ON public.tc_header USING btree (tc_number);


--
-- Name: idx_tc_header_packing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_header_packing ON public.tc_header USING btree (packing_order);


--
-- Name: aat_day_entry aat_day_entry_aat_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aat_day_entry
    ADD CONSTRAINT aat_day_entry_aat_entry_id_fkey FOREIGN KEY (aat_entry_id) REFERENCES public.aat_entry(aat_entry_id) ON DELETE CASCADE;


--
-- Name: bom_master bom_master_component_material_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom_master
    ADD CONSTRAINT bom_master_component_material_code_fkey FOREIGN KEY (component_material_code) REFERENCES public.material_master(material_code);


--
-- Name: d_fiber_cut_reasons d_fiber_cut_reasons_indication_fiber_cut_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons
    ADD CONSTRAINT d_fiber_cut_reasons_indication_fiber_cut_id_fkey FOREIGN KEY (indication_fiber_cut_id) REFERENCES public.fiber_cut_indication(indication_fiber_cut_id);


--
-- Name: draw_entry draw_entry_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT draw_entry_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: draw_flaw_details draw_flaw_details_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details
    ADD CONSTRAINT draw_flaw_details_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.draw_entry(spool_id);


--
-- Name: dyanmic_fartique_speed dyanmic_fartique_speed_dynamic_fartique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyanmic_fartique_speed
    ADD CONSTRAINT dyanmic_fartique_speed_dynamic_fartique_id_fkey FOREIGN KEY (dynamic_fartique_id) REFERENCES public.dyanmic_fartique(dynamic_fartique_id) ON DELETE CASCADE;


--
-- Name: pt_allocation fk_pta_preform_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation
    ADD CONSTRAINT fk_pta_preform_id FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: pt_allocation fk_pta_spool_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pt_allocation
    ADD CONSTRAINT fk_pta_spool_id FOREIGN KEY (spool_id) REFERENCES public.draw_entry(spool_id);


--
-- Name: handle_join handle_join_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join
    ADD CONSTRAINT handle_join_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: hot_water_day_entry hot_water_day_entry_hot_water_entry_id_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_water_day_entry
    ADD CONSTRAINT hot_water_day_entry_hot_water_entry_id_entry_id_fkey FOREIGN KEY (hot_water_entry_id) REFERENCES public.hot_water_entry(hot_water_entry_id) ON DELETE CASCADE;


--
-- Name: htha_day_entry htha_day_entry_htha_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.htha_day_entry
    ADD CONSTRAINT htha_day_entry_htha_entry_id_fkey FOREIGN KEY (htha_entry_id) REFERENCES public.htha_entry(htha_entry_id) ON DELETE CASCADE;


--
-- Name: master_preform_type master_preform_type_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(emp_id);


--
-- Name: packing_order_bobbin packing_order_bobbin_packing_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_order_bobbin
    ADD CONSTRAINT packing_order_bobbin_packing_order_fkey FOREIGN KEY (packing_order) REFERENCES public.packing_order(order_no);


--
-- Name: preform_accept preform_accept_logged_in_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT preform_accept_logged_in_user_fkey FOREIGN KEY (logged_in_user) REFERENCES public.users(emp_id);


--
-- Name: preform_allocation preform_allocation_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- Name: preform_process_type_mapping preform_process_type_mapping_process_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_process_type_mapping
    ADD CONSTRAINT preform_process_type_mapping_process_type_id_fkey FOREIGN KEY (process_type_id) REFERENCES public.process_type_master(process_type_id) ON DELETE CASCADE;


--
-- Name: report_execution_log report_execution_log_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_execution_log
    ADD CONSTRAINT report_execution_log_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id);


--
-- Name: report_permissions report_permissions_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_permissions
    ADD CONSTRAINT report_permissions_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_saved_filters report_saved_filters_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_saved_filters
    ADD CONSTRAINT report_saved_filters_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_section_mapping report_section_mapping_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_section_mapping report_section_mapping_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_section_mapping
    ADD CONSTRAINT report_section_mapping_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.report_section_master(section_id) ON DELETE CASCADE;


--
-- Name: report_sheets report_sheets_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_sheets
    ADD CONSTRAINT report_sheets_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_tables report_tables_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables
    ADD CONSTRAINT report_tables_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id) ON DELETE CASCADE;


--
-- Name: report_tables report_tables_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_tables
    ADD CONSTRAINT report_tables_sheet_id_fkey FOREIGN KEY (sheet_id) REFERENCES public.report_sheets(id) ON DELETE CASCADE;


--
-- Name: report_version_history report_version_history_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_version_history
    ADD CONSTRAINT report_version_history_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_master(id);


--
-- Name: tc_detail tc_detail_tc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tc_detail
    ADD CONSTRAINT tc_detail_tc_id_fkey FOREIGN KEY (tc_id) REFERENCES public.tc_header(tc_id);


--
-- Name: temp_cycle_entry temp_cycle_entry_temp_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temp_cycle_entry
    ADD CONSTRAINT temp_cycle_entry_temp_entry_id_fkey FOREIGN KEY (temp_entry_id) REFERENCES public.temp_entry(temp_entry_id) ON DELETE CASCADE;


--
-- Name: tray_position tray_position_tray_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tray_position
    ADD CONSTRAINT tray_position_tray_id_fkey FOREIGN KEY (tray_id) REFERENCES public.tray_master(tray_id);


--
-- Name: trh_cycle_entry trh_cycle_entry_trh_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trh_cycle_entry
    ADD CONSTRAINT trh_cycle_entry_trh_entry_id_fkey FOREIGN KEY (trh_entry_id) REFERENCES public.trh_entry(trh_entry_id) ON DELETE CASCADE;


--
-- Name: user_departments user_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: user_departments user_departments_emp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_emp_id_fkey FOREIGN KEY (emp_id) REFERENCES public.users(emp_id) ON DELETE CASCADE;


--
-- Name: wi_day_entry wi_day_entry_wi_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wi_day_entry
    ADD CONSTRAINT wi_day_entry_wi_entry_id_fkey FOREIGN KEY (wi_entry_id) REFERENCES public.wi_entry(wi_entry_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Z6odKLe58g2KI7vBbM0LnYwvxSbsZdNGtgABJ8tzOhlzXc6agYpXCeGgo9cCg5t

