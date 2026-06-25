--
-- PostgreSQL database dump
--

\restrict Ge0uJw7MeXU4L1LN1AvQzMDo5JzuBUT5qlggtaK41Lcl5aDTsGTdsxdOFiT7hOk

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-24 11:41:12

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
-- TOC entry 245 (class 1259 OID 16855)
-- Name: d_fiber_cut_reasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.d_fiber_cut_reasons (
    dfcr_id integer NOT NULL,
    dfcr_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.d_fiber_cut_reasons OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16854)
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
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 244
-- Name: d_fiber_cut_reasons_dfcr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.d_fiber_cut_reasons_dfcr_id_seq OWNED BY public.d_fiber_cut_reasons.dfcr_id;


--
-- TOC entry 221 (class 1259 OID 16553)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    d_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16552)
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
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 235 (class 1259 OID 16770)
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
    shift_id integer,
    drawn_line_speed integer,
    draw_tension numeric(10,2),
    furnace_power numeric(10,2),
    furnace_argon numeric(10,2),
    furnace_he numeric(10,2),
    tube_he numeric(10,2),
    co2_flow numeric(10,2),
    n2_flow numeric(10,2),
    uv_air numeric(10,2),
    winding_observation_id integer,
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
    process_type text,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shift_incharge character varying(20),
    furnace_operator character varying(20),
    die_operator character varying(20),
    ground_operator character varying(20),
    indication_reason_id integer,
    CONSTRAINT draw_entry_spool_status_check CHECK (((spool_status)::text = ANY ((ARRAY['Ok'::character varying, 'Not Ok'::character varying])::text[])))
);


ALTER TABLE public.draw_entry OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16794)
-- Name: draw_flaw_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_flaw_details (
    draw_flaw_id integer NOT NULL,
    spool_id character varying(20) NOT NULL,
    flaw_desc text NOT NULL,
    start_length numeric(10,2),
    end_length numeric(10,2),
    defect_length numeric(10,2),
    actual_cutting numeric(10,2),
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_flaw_details OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16793)
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
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 236
-- Name: draw_flaw_details_draw_flaw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_flaw_details_draw_flaw_id_seq OWNED BY public.draw_flaw_details.draw_flaw_id;


--
-- TOC entry 232 (class 1259 OID 16726)
-- Name: draw_tower; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_tower (
    tower_id integer NOT NULL,
    tower_no integer NOT NULL,
    furnace_count integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_tower OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16725)
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
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 231
-- Name: draw_tower_tower_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_tower_tower_id_seq OWNED BY public.draw_tower.tower_id;


--
-- TOC entry 241 (class 1259 OID 16834)
-- Name: draw_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_users (
    draw_user_id integer NOT NULL,
    emp_id character varying(20),
    draw_user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.draw_users OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16833)
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
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 240
-- Name: draw_users_draw_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_users_draw_user_id_seq OWNED BY public.draw_users.draw_user_id;


--
-- TOC entry 230 (class 1259 OID 16701)
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
    handle_number integer,
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
-- TOC entry 229 (class 1259 OID 16700)
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
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 229
-- Name: handle_join_handle_join_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.handle_join_handle_join_id_seq OWNED BY public.handle_join.handle_join_id;


--
-- TOC entry 225 (class 1259 OID 16590)
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
-- TOC entry 224 (class 1259 OID 16589)
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
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 224
-- Name: master_preform_type_preform_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.master_preform_type_preform_type_id_seq OWNED BY public.master_preform_type.preform_type_id;


--
-- TOC entry 228 (class 1259 OID 16655)
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
    accepted_by integer,
    preform_type_id integer,
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
    CONSTRAINT preform_accept_acceptance_status_check CHECK (((acceptance_status)::text = ANY ((ARRAY['accepted'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.preform_accept OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16654)
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
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 227
-- Name: preform_accept_acceptance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_accept_acceptance_id_seq OWNED BY public.preform_accept.acceptance_id;


--
-- TOC entry 234 (class 1259 OID 16740)
-- Name: preform_allocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_allocation (
    allocation_id integer NOT NULL,
    preform_id character varying(20) NOT NULL,
    allocation_date date NOT NULL,
    tower_id integer NOT NULL,
    shift_id integer NOT NULL,
    operator_id integer NOT NULL,
    preform_type_id integer,
    product_type_id integer,
    process_type_id integer,
    preform_draw boolean DEFAULT false,
    average_diameter numeric(10,2),
    draw_instruction text,
    process_remarks text,
    logged_in_user integer NOT NULL,
    entry_date date DEFAULT CURRENT_DATE,
    entry_time time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    loaded_by integer NOT NULL
);


ALTER TABLE public.preform_allocation OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16739)
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
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 233
-- Name: preform_allocation_allocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preform_allocation_allocation_id_seq OWNED BY public.preform_allocation.allocation_id;


--
-- TOC entry 226 (class 1259 OID 16607)
-- Name: preform_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preform_data (
    preform_id character varying(20) NOT NULL,
    preform_weight numeric(10,3),
    preform_type_id integer,
    material_code character varying(20),
    material_description text,
    plant character varying(10),
    storage_location character varying(10),
    uom character varying(10) DEFAULT 'KG'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.preform_data OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16821)
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
-- TOC entry 238 (class 1259 OID 16820)
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
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 238
-- Name: shifts_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_shift_id_seq OWNED BY public.shifts.shift_id;


--
-- TOC entry 223 (class 1259 OID 16565)
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
-- TOC entry 222 (class 1259 OID 16564)
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
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 222
-- Name: user_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_departments_id_seq OWNED BY public.user_departments.id;


--
-- TOC entry 219 (class 1259 OID 16541)
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
-- TOC entry 243 (class 1259 OID 16845)
-- Name: winding_observation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winding_observation (
    wind_obs_id integer NOT NULL,
    w_o_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.winding_observation OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16844)
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
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 242
-- Name: winding_observation_wind_obs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.winding_observation_wind_obs_id_seq OWNED BY public.winding_observation.wind_obs_id;


--
-- TOC entry 4869 (class 2604 OID 16858)
-- Name: d_fiber_cut_reasons dfcr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons ALTER COLUMN dfcr_id SET DEFAULT nextval('public.d_fiber_cut_reasons_dfcr_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 16556)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4859 (class 2604 OID 16797)
-- Name: draw_flaw_details draw_flaw_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details ALTER COLUMN draw_flaw_id SET DEFAULT nextval('public.draw_flaw_details_draw_flaw_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 16729)
-- Name: draw_tower tower_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower ALTER COLUMN tower_id SET DEFAULT nextval('public.draw_tower_tower_id_seq'::regclass);


--
-- TOC entry 4865 (class 2604 OID 16837)
-- Name: draw_users draw_user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_users ALTER COLUMN draw_user_id SET DEFAULT nextval('public.draw_users_draw_user_id_seq'::regclass);


--
-- TOC entry 4841 (class 2604 OID 16704)
-- Name: handle_join handle_join_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join ALTER COLUMN handle_join_id SET DEFAULT nextval('public.handle_join_handle_join_id_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 16593)
-- Name: master_preform_type preform_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type ALTER COLUMN preform_type_id SET DEFAULT nextval('public.master_preform_type_preform_type_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 16658)
-- Name: preform_accept acceptance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept ALTER COLUMN acceptance_id SET DEFAULT nextval('public.preform_accept_acceptance_id_seq'::regclass);


--
-- TOC entry 4851 (class 2604 OID 16743)
-- Name: preform_allocation allocation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation ALTER COLUMN allocation_id SET DEFAULT nextval('public.preform_allocation_allocation_id_seq'::regclass);


--
-- TOC entry 4863 (class 2604 OID 16824)
-- Name: shifts shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN shift_id SET DEFAULT nextval('public.shifts_shift_id_seq'::regclass);


--
-- TOC entry 4827 (class 2604 OID 16568)
-- Name: user_departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments ALTER COLUMN id SET DEFAULT nextval('public.user_departments_id_seq'::regclass);


--
-- TOC entry 4867 (class 2604 OID 16848)
-- Name: winding_observation wind_obs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winding_observation ALTER COLUMN wind_obs_id SET DEFAULT nextval('public.winding_observation_wind_obs_id_seq'::regclass);


--
-- TOC entry 5098 (class 0 OID 16855)
-- Dependencies: 245
-- Data for Name: d_fiber_cut_reasons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.d_fiber_cut_reasons (dfcr_id, dfcr_name, created_at) FROM stdin;
1	Preform End	2026-06-24 10:55:22.713058
2	Preform Remove	2026-06-24 10:55:37.593413
\.


--
-- TOC entry 5074 (class 0 OID 16553)
-- Dependencies: 221
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, d_name, created_at) FROM stdin;
1	Draw	2026-06-14 17:36:19.459467
2	Proof Testing	2026-06-14 17:45:04.550701
3	All	2026-06-14 17:45:39.862279
\.


--
-- TOC entry 5088 (class 0 OID 16770)
-- Dependencies: 235
-- Data for Name: draw_entry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.draw_entry (spool_id, preform_id, start_date, end_date, start_time, end_time, drawn_weight, drawn_length, balance_weight, shift_id, drawn_line_speed, draw_tension, furnace_power, furnace_argon, furnace_he, tube_he, co2_flow, n2_flow, uv_air, winding_observation_id, scr_observation, top_end_scrap, bottom_end_scrap, die_clean, spool_status, indication_fiber_cut, remark, primary_coating, secondary_coating, coating_type, primary_pressure, secondary_pressure, primary_batch, secondary_batch, process_type, logged_in_user, entry_date, entry_time, created_at, shift_incharge, furnace_operator, die_operator, ground_operator, indication_reason_id) FROM stdin;
\.


--
-- TOC entry 5090 (class 0 OID 16794)
-- Dependencies: 237
-- Data for Name: draw_flaw_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.draw_flaw_details (draw_flaw_id, spool_id, flaw_desc, start_length, end_length, defect_length, actual_cutting, logged_in_user, entry_date, entry_time, created_at) FROM stdin;
\.


--
-- TOC entry 5085 (class 0 OID 16726)
-- Dependencies: 232
-- Data for Name: draw_tower; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.draw_tower (tower_id, tower_no, furnace_count, is_active, created_at) FROM stdin;
3	3	\N	t	2026-06-16 20:10:12.009154
4	4	\N	t	2026-06-16 20:10:16.515487
1	1	\N	f	2026-06-16 20:09:48.195701
2	2	\N	f	2026-06-16 20:10:06.487986
\.


--
-- TOC entry 5094 (class 0 OID 16834)
-- Dependencies: 241
-- Data for Name: draw_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.draw_users (draw_user_id, emp_id, draw_user_name, created_at) FROM stdin;
1	1112	Divyesh Raorane	2026-06-23 17:02:56.824214
2	1113	Rahul Soni	2026-06-23 17:03:11.336085
\.


--
-- TOC entry 5083 (class 0 OID 16701)
-- Dependencies: 230
-- Data for Name: handle_join; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.handle_join (handle_join_id, preform_id, dia1, dia2, dia3, dia4, dia5, h2flow1, h2flow2, h2flow3, o2line1_flow1, o2line1_flow2, o2line1_flow3, h2flow1_time, h2flow2_time, h2flow3_time, o2line1_flow1_time, o2line1_flow2_time, o2line1_flow3_time, h2flow1_cons, h2flow2_cons, h2flow3_cons, o2line1_flow1_cons, o2line1_flow2_cons, o2line1_flow3_cons, handle_length, handle_diameter, cone_length, handle_number, joined_by, additional_notes, is_handle_join, is_allocate, disconnect_remark, disconnected_at, disconnected_by, logged_in_user, entry_date, entry_time, created_at, handle_rejected) FROM stdin;
14	Divy1234	20.00	20.00	20.00	11.00	12.00	286.00	5.00	5.00	5.00	6.00	7.00	5.00	5.00	5.00	6.00	7.00	8.00	1.43	0.03	0.03	0.03	0.04	0.06	12.00	12.00	121.00	12	1111	This is for only demo	t	t	\N	\N	\N	1111	2026-06-16	18:05:36.789489	2026-06-16 18:05:36.789489	f
15	PF-AUTO-9985	45.00	45.00	55.00	6.00	8.00	56.00	55.00	656.00	55.00	565.00	5.00	65.00	66.00	665.00	55.00	5.00	656.00	3.64	3.63	436.24	3.03	2.83	3.28	66.00	77.00	88.00	2	1111	testing	t	t	\N	\N	\N	1111	2026-06-20	14:18:53.32222	2026-06-20 14:18:53.32222	f
16	PF-AUTO-9986	22.00	33.00	4.00	43.00	44.00	6.00	6.00	6.00	6.00	6.00	66.00	66.00	6.00	6.00	66.00	5.00	65.00	0.40	0.04	0.04	0.40	0.03	4.29	54.00	54.00	44.00	44	1111	5	t	f	\N	\N	\N	1111	2026-06-22	14:12:22.804479	2026-06-22 14:12:22.804479	f
\.


--
-- TOC entry 5078 (class 0 OID 16590)
-- Dependencies: 225
-- Data for Name: master_preform_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_preform_type (preform_type_id, preform_type_name, is_active, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 5081 (class 0 OID 16655)
-- Dependencies: 228
-- Data for Name: preform_accept; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preform_accept (acceptance_id, preform_id, preform_weight, charge_weight, preform_length, charge_length, drawing_length, material_code, dia_variation, cut_off, mfd, accepted_by, preform_type_id, material_description, remarks, draw_instruction, acceptance_status, rejection_note, logged_in_user, entry_date, entry_time, created_at, is_handle_join) FROM stdin;
17	Divy1234	50.000	20.000	202.00	20.00	20.00	20	20.00	20.00	20.00	20	1234	Demo Preform	Yes	D	accepted		1111	2026-06-15	22:46:57.115853	2026-06-15 22:46:57.115853	t
31	PF-AUTO-9985	50.000	59.000	20.00	30.00	40.00	12345	5.00	3.00	6.00	1111	1111	Demo is t	please process	ok	accepted		1111	2026-06-20	14:17:55.418976	2026-06-20 14:17:55.418976	t
32	PF-AUTO-9986	50.000	7.000	5.00	65.00	65.00	12345	55.00	55.00	55.00	1111	1111	k	k	k	accepted		1111	2026-06-20	14:58:31.091115	2026-06-20 14:58:31.091115	t
\.


--
-- TOC entry 5087 (class 0 OID 16740)
-- Dependencies: 234
-- Data for Name: preform_allocation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preform_allocation (allocation_id, preform_id, allocation_date, tower_id, shift_id, operator_id, preform_type_id, product_type_id, process_type_id, preform_draw, average_diameter, draw_instruction, process_remarks, logged_in_user, entry_date, entry_time, created_at, loaded_by) FROM stdin;
7	Divy1234	2026-06-19	1	1	1111	1	1	1	f	16.60	d	\N	1111	2026-06-18	13:06:25.87971	2026-06-18 13:06:25.87971	1111
8	PF-AUTO-9985	2026-06-21	2	1	1111	1	1	1	f	31.80	yes	\N	1111	2026-06-20	14:19:33.980502	2026-06-20 14:19:33.980502	1111
\.


--
-- TOC entry 5079 (class 0 OID 16607)
-- Dependencies: 226
-- Data for Name: preform_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preform_data (preform_id, preform_weight, preform_type_id, material_code, material_description, plant, storage_location, uom, is_active, created_at) FROM stdin;
Divy1234	50.000	1234	111pref	Demo Preform	Hydarabad	WCO	KG	f	2026-06-15 11:39:06.404489
PF-AUTO-9982	50.000	1111	12345	This is demo test	hydarabad	WCO	KG	t	2026-06-20 13:54:22.672624
PF-AUTO-9983	50.000	1111	12345	Demo test	hydarabad	WCO	KG	t	2026-06-20 14:13:04.036358
PF-AUTO-9984	50.000	1111	12345	Demo is t	hydarabad	WCO	KG	t	2026-06-20 14:14:53.428587
PF-AUTO-9985	50.000	1111	12345	Demo is t	hydarabad	WCO	KG	f	2026-06-20 14:16:54.603114
PF-AUTO-9986	50.000	1111	12345	k	hydarabad	WCO	KG	f	2026-06-20 14:57:06.722451
\.


--
-- TOC entry 5092 (class 0 OID 16821)
-- Dependencies: 239
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (shift_id, shift_name, shift_start_time, shift_end_time, created_at) FROM stdin;
1	A	07:00:00	15:00:00	2026-06-23 16:00:34.264164
2	B	15:00:00	23:00:00	2026-06-23 16:00:56.916222
3	C	23:00:00	07:00:00	2026-06-23 16:01:12.367265
4	journal	09:00:00	17:30:00	2026-06-23 16:02:13.98033
\.


--
-- TOC entry 5076 (class 0 OID 16565)
-- Dependencies: 223
-- Data for Name: user_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_departments (id, emp_id, department_id, created_at) FROM stdin;
1	1111	1	2026-06-14 22:48:31.532504
\.


--
-- TOC entry 5072 (class 0 OID 16541)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (emp_id, emp_name, emp_mail_id, mobile_no, role, created_at, updated_at, password, is_active) FROM stdin;
1111	Divyesh	div@gmail.com	\N	admin	2026-06-14 22:48:31.532504	2026-06-14 22:48:31.532504	$2b$10$8yNi7w9pcM8SDtfsP/fCYOc3yMyquQNsmk4D/tp6kwV0.CpUjA.Ji	t
\.


--
-- TOC entry 5096 (class 0 OID 16845)
-- Dependencies: 243
-- Data for Name: winding_observation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.winding_observation (wind_obs_id, w_o_name, created_at) FROM stdin;
1	Ok	2026-06-24 09:49:16.147215
2	Not Ok	2026-06-24 09:49:23.806042
\.


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 244
-- Name: d_fiber_cut_reasons_dfcr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.d_fiber_cut_reasons_dfcr_id_seq', 2, true);


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 3, true);


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 236
-- Name: draw_flaw_details_draw_flaw_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.draw_flaw_details_draw_flaw_id_seq', 1, false);


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 231
-- Name: draw_tower_tower_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.draw_tower_tower_id_seq', 4, true);


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 240
-- Name: draw_users_draw_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.draw_users_draw_user_id_seq', 2, true);


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 229
-- Name: handle_join_handle_join_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.handle_join_handle_join_id_seq', 16, true);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 224
-- Name: master_preform_type_preform_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.master_preform_type_preform_type_id_seq', 1, false);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 227
-- Name: preform_accept_acceptance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preform_accept_acceptance_id_seq', 32, true);


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 233
-- Name: preform_allocation_allocation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preform_allocation_allocation_id_seq', 8, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 238
-- Name: shifts_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_shift_id_seq', 4, true);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 222
-- Name: user_departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_departments_id_seq', 1, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 242
-- Name: winding_observation_wind_obs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.winding_observation_wind_obs_id_seq', 2, true);


--
-- TOC entry 4913 (class 2606 OID 16863)
-- Name: d_fiber_cut_reasons d_fiber_cut_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.d_fiber_cut_reasons
    ADD CONSTRAINT d_fiber_cut_reasons_pkey PRIMARY KEY (dfcr_id);


--
-- TOC entry 4877 (class 2606 OID 16563)
-- Name: departments departments_d_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_d_name_key UNIQUE (d_name);


--
-- TOC entry 4879 (class 2606 OID 16561)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 16786)
-- Name: draw_entry draw_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT draw_entry_pkey PRIMARY KEY (spool_id);


--
-- TOC entry 4905 (class 2606 OID 16808)
-- Name: draw_flaw_details draw_flaw_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details
    ADD CONSTRAINT draw_flaw_details_pkey PRIMARY KEY (draw_flaw_id);


--
-- TOC entry 4897 (class 2606 OID 16735)
-- Name: draw_tower draw_tower_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower
    ADD CONSTRAINT draw_tower_pkey PRIMARY KEY (tower_id);


--
-- TOC entry 4899 (class 2606 OID 16737)
-- Name: draw_tower draw_tower_tower_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_tower
    ADD CONSTRAINT draw_tower_tower_no_key UNIQUE (tower_no);


--
-- TOC entry 4909 (class 2606 OID 16842)
-- Name: draw_users draw_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_users
    ADD CONSTRAINT draw_users_pkey PRIMARY KEY (draw_user_id);


--
-- TOC entry 4895 (class 2606 OID 16719)
-- Name: handle_join handle_join_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join
    ADD CONSTRAINT handle_join_pkey PRIMARY KEY (handle_join_id);


--
-- TOC entry 4885 (class 2606 OID 16599)
-- Name: master_preform_type master_preform_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_pkey PRIMARY KEY (preform_type_id);


--
-- TOC entry 4887 (class 2606 OID 16601)
-- Name: master_preform_type master_preform_type_preform_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_preform_type_name_key UNIQUE (preform_type_name);


--
-- TOC entry 4891 (class 2606 OID 16670)
-- Name: preform_accept preform_accept_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT preform_accept_pkey PRIMARY KEY (acceptance_id);


--
-- TOC entry 4901 (class 2606 OID 16758)
-- Name: preform_allocation preform_allocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_pkey PRIMARY KEY (allocation_id);


--
-- TOC entry 4889 (class 2606 OID 16617)
-- Name: preform_data preform_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_data
    ADD CONSTRAINT preform_data_pkey PRIMARY KEY (preform_id);


--
-- TOC entry 4907 (class 2606 OID 16832)
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (shift_id);


--
-- TOC entry 4893 (class 2606 OID 16699)
-- Name: preform_accept uq_preform_accept_preform_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT uq_preform_accept_preform_id UNIQUE (preform_id);


--
-- TOC entry 4881 (class 2606 OID 16576)
-- Name: user_departments user_departments_emp_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_emp_id_department_id_key UNIQUE (emp_id, department_id);


--
-- TOC entry 4883 (class 2606 OID 16574)
-- Name: user_departments user_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 16551)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (emp_id);


--
-- TOC entry 4911 (class 2606 OID 16853)
-- Name: winding_observation winding_observation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winding_observation
    ADD CONSTRAINT winding_observation_pkey PRIMARY KEY (wind_obs_id);


--
-- TOC entry 4921 (class 2606 OID 16787)
-- Name: draw_entry draw_entry_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT draw_entry_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- TOC entry 4924 (class 2606 OID 16809)
-- Name: draw_flaw_details draw_flaw_details_spool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_flaw_details
    ADD CONSTRAINT draw_flaw_details_spool_id_fkey FOREIGN KEY (spool_id) REFERENCES public.draw_entry(spool_id);


--
-- TOC entry 4922 (class 2606 OID 16875)
-- Name: draw_entry fk_draw_entry_indication_reason; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT fk_draw_entry_indication_reason FOREIGN KEY (indication_reason_id) REFERENCES public.d_fiber_cut_reasons(dfcr_id);


--
-- TOC entry 4923 (class 2606 OID 16870)
-- Name: draw_entry fk_draw_entry_winding_observation_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_entry
    ADD CONSTRAINT fk_draw_entry_winding_observation_id FOREIGN KEY (winding_observation_id) REFERENCES public.winding_observation(wind_obs_id);


--
-- TOC entry 4918 (class 2606 OID 16720)
-- Name: handle_join handle_join_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.handle_join
    ADD CONSTRAINT handle_join_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- TOC entry 4916 (class 2606 OID 16602)
-- Name: master_preform_type master_preform_type_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_preform_type
    ADD CONSTRAINT master_preform_type_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(emp_id);


--
-- TOC entry 4917 (class 2606 OID 16671)
-- Name: preform_accept preform_accept_logged_in_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_accept
    ADD CONSTRAINT preform_accept_logged_in_user_fkey FOREIGN KEY (logged_in_user) REFERENCES public.users(emp_id);


--
-- TOC entry 4919 (class 2606 OID 16759)
-- Name: preform_allocation preform_allocation_preform_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_preform_id_fkey FOREIGN KEY (preform_id) REFERENCES public.preform_accept(preform_id);


--
-- TOC entry 4920 (class 2606 OID 16764)
-- Name: preform_allocation preform_allocation_tower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preform_allocation
    ADD CONSTRAINT preform_allocation_tower_id_fkey FOREIGN KEY (tower_id) REFERENCES public.draw_tower(tower_id);


--
-- TOC entry 4914 (class 2606 OID 16582)
-- Name: user_departments user_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 4915 (class 2606 OID 16577)
-- Name: user_departments user_departments_emp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_departments
    ADD CONSTRAINT user_departments_emp_id_fkey FOREIGN KEY (emp_id) REFERENCES public.users(emp_id) ON DELETE CASCADE;


-- Completed on 2026-06-24 11:41:13

--
-- PostgreSQL database dump complete
--

\unrestrict Ge0uJw7MeXU4L1LN1AvQzMDo5JzuBUT5qlggtaK41Lcl5aDTsGTdsxdOFiT7hOk

