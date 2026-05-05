--
-- PostgreSQL database dump
--

\restrict NatOui5fkHc4DYi9Whc0DASFJmNLcoMY16Qau9Y8KgiaRDYtLEESLJPoqoloh7V

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: t_p68114469_cross_platform_logis; Type: SCHEMA; Schema: -; Owner: logistics_user
--

CREATE SCHEMA t_p68114469_cross_platform_logis;


ALTER SCHEMA t_p68114469_cross_platform_logis OWNER TO logistics_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_logs; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.action_logs (
    id integer NOT NULL,
    user_id integer,
    user_name text NOT NULL,
    action text NOT NULL,
    target text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE t_p68114469_cross_platform_logis.action_logs OWNER TO postgres;

--
-- Name: action_logs_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.action_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.action_logs_id_seq OWNER TO postgres;

--
-- Name: action_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.action_logs_id_seq OWNED BY t_p68114469_cross_platform_logis.action_logs.id;


--
-- Name: app_config; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: logistics_user
--

CREATE TABLE t_p68114469_cross_platform_logis.app_config (
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.app_config OWNER TO logistics_user;

--
-- Name: cargo_types; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.cargo_types (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.cargo_types OWNER TO postgres;

--
-- Name: cargo_types_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.cargo_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.cargo_types_id_seq OWNER TO postgres;

--
-- Name: cargo_types_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.cargo_types_id_seq OWNED BY t_p68114469_cross_platform_logis.cargo_types.id;


--
-- Name: column_config; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.column_config (
    key text NOT NULL,
    label text NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    sort_order integer NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.column_config OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.departments (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.departments_id_seq OWNED BY t_p68114469_cross_platform_logis.departments.id;


--
-- Name: locations; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.locations (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.locations_id_seq OWNED BY t_p68114469_cross_platform_logis.locations.id;


--
-- Name: orders; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.orders (
    id integer NOT NULL,
    order_num text NOT NULL,
    department text,
    applicant_name text,
    cargo_name text,
    quantity text,
    request_time text,
    load_place text,
    unload_place text,
    priority integer DEFAULT 50,
    vehicle_model text,
    driver_name text,
    driver_id integer,
    arrival_load_time text,
    load_start_time text,
    departure_load_time text,
    sender_sign text,
    arrival_unload_time text,
    unload_start_time text,
    departure_unload_time text,
    receiver_sign text,
    note text DEFAULT ''::text,
    done boolean DEFAULT false,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cargo_type_id integer,
    load_location_id integer,
    unload_location_id integer,
    vehicle_id integer,
    execution_date timestamp without time zone,
    stage integer DEFAULT 1,
    department_id integer,
    tc_master_name text,
    ppb_name text,
    tc_name text
);


ALTER TABLE t_p68114469_cross_platform_logis.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.orders_id_seq OWNED BY t_p68114469_cross_platform_logis.orders.id;


--
-- Name: role_labels; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.role_labels (
    role text NOT NULL,
    label text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.role_labels OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.sessions (
    token text NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE t_p68114469_cross_platform_logis.sessions OWNER TO postgres;

--
-- Name: stage_labels; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.stage_labels (
    stage integer NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.stage_labels OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.user_roles (
    user_id integer NOT NULL,
    role text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.users (
    id integer NOT NULL,
    name text NOT NULL,
    login text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    department_id integer,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['shop_chief'::text, 'ppb'::text, 'tc'::text, 'tc_master'::text, 'driver'::text, 'sender'::text, 'receiver'::text, 'admin'::text])))
);


ALTER TABLE t_p68114469_cross_platform_logis.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.users_id_seq OWNED BY t_p68114469_cross_platform_logis.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE TABLE t_p68114469_cross_platform_logis.vehicles (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE t_p68114469_cross_platform_logis.vehicles OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

CREATE SEQUENCE t_p68114469_cross_platform_logis.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE t_p68114469_cross_platform_logis.vehicles_id_seq OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER SEQUENCE t_p68114469_cross_platform_logis.vehicles_id_seq OWNED BY t_p68114469_cross_platform_logis.vehicles.id;


--
-- Name: action_logs id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.action_logs ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.action_logs_id_seq'::regclass);


--
-- Name: cargo_types id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.cargo_types ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.cargo_types_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.departments ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.departments_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.locations ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.locations_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.orders_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.users ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.vehicles ALTER COLUMN id SET DEFAULT nextval('t_p68114469_cross_platform_logis.vehicles_id_seq'::regclass);


--
-- Data for Name: action_logs; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.action_logs (id, user_id, user_name, action, target, created_at) FROM stdin;
1	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0001	2026-04-29 13:26:14.218383+03
2	14	!!!Работник ТЦ!!!	Обновил поля: priority, ppb_name	ЗПВ-0001	2026-04-29 13:32:30.701279+03
3	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0001	2026-04-29 13:32:36.317911+03
4	15	!!!Мастер ТЦ!!!	Обновил поля: driver_id, driver_name, tc_master_name	ЗПВ-0001	2026-04-29 13:39:36.490122+03
5	16	!!!Водитель!!!	Обновил поля: arrival_load_time, load_start_time	ЗПВ-0001	2026-04-29 13:40:19.754732+03
6	16	!!!Водитель!!!	Обновил поля: arrival_unload_time, unload_start_time	ЗПВ-0001	2026-04-29 13:44:14.166613+03
7	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0002	2026-04-29 13:50:42.115533+03
8	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0002	2026-04-29 13:57:28.8121+03
9	10	Администратор	Создал заявку	ЗПВ-0003	2026-04-29 13:59:30.985392+03
10	10	Администратор	Создал заявку	ЗПВ-0004	2026-04-29 13:59:43.710975+03
11	10	Администратор	Обновил поля: vehicle_id, vehicle_model	ЗПВ-0004	2026-04-29 13:59:43.82362+03
12	15	!!!Мастер ТЦ!!!	Обновил поля: driver_id, driver_name, tc_master_name	ЗПВ-0002	2026-04-29 14:05:43.891572+03
13	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0005	2026-04-29 14:06:32.131322+03
14	14	!!!Работник ТЦ!!!	Обновил поля: priority, ppb_name	ЗПВ-0005	2026-04-29 14:10:09.882907+03
15	10	Администратор	Удалил заявку	ЗПВ-0005	2026-04-29 14:18:56.678197+03
16	10	Администратор	Удалил заявку	ЗПВ-0004	2026-04-29 14:18:59.077047+03
17	10	Администратор	Удалил заявку	ЗПВ-0003	2026-04-29 14:19:01.016561+03
18	10	Администратор	Удалил заявку	ЗПВ-0002	2026-04-29 14:19:02.737873+03
19	10	Администратор	Удалил заявку	ЗПВ-0001	2026-04-29 14:19:04.620038+03
20	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0001	2026-04-29 14:19:30.39599+03
21	14	!!!Работник ТЦ!!!	Обновил поля: priority, ppb_name	ЗПВ-0001	2026-04-29 14:23:41.999749+03
22	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0001	2026-04-29 14:27:39.5615+03
23	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0002	2026-04-29 14:33:47.32032+03
24	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0002	2026-04-29 14:34:26.47859+03
25	15	!!!Мастер ТЦ!!!	Обновил поля: driver_id, driver_name, tc_master_name	ЗПВ-0002	2026-04-29 14:34:50.025155+03
26	16	!!!Водитель!!!	Обновил поля: arrival_load_time, load_start_time	ЗПВ-0002	2026-04-29 14:35:28.356202+03
27	17	!!!Ответственный за сдачу!!!	Обновил поля: departure_load_time, sender_sign	ЗПВ-0002	2026-04-29 14:36:03.740585+03
28	16	!!!Водитель!!!	Обновил поля: arrival_unload_time, unload_start_time	ЗПВ-0002	2026-04-29 14:36:40.57053+03
29	18	!!!Ответственный за приём!!!	Обновил поля: departure_unload_time, receiver_sign	ЗПВ-0002	2026-04-29 14:37:07.745958+03
30	13	!!!Заявитель!!!	Обновил поля: done	ЗПВ-0002	2026-04-29 14:52:16.311184+03
31	10	Администратор	Удалил заявку	ЗПВ-0001	2026-04-29 16:04:24.623322+03
32	10	Администратор	Удалил заявку	ЗПВ-0002	2026-04-29 16:04:27.837482+03
33	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0001	2026-04-29 16:05:00.472393+03
34	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0002	2026-04-29 16:06:00.38936+03
35	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0003	2026-04-29 16:13:23.560946+03
36	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0003	2026-04-29 16:19:10.967524+03
37	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0002	2026-04-29 16:19:52.62393+03
38	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0001	2026-04-29 16:26:52.677391+03
39	15	!!!Мастер ТЦ!!!	Обновил поля: driver_id, driver_name, tc_master_name	ЗПВ-0003	2026-04-29 16:27:53.055081+03
40	16	!!!Водитель!!!	Обновил поля: arrival_load_time, load_start_time	ЗПВ-0003	2026-04-29 16:28:35.745229+03
41	17	!!!Ответственный за сдачу!!!	Обновил поля: departure_load_time, sender_sign	ЗПВ-0003	2026-04-29 16:29:37.902293+03
42	16	!!!Водитель!!!	Обновил поля: arrival_unload_time, unload_start_time	ЗПВ-0003	2026-04-29 16:30:38.470859+03
43	18	!!!Ответственный за приём!!!	Обновил поля: departure_unload_time, receiver_sign	ЗПВ-0003	2026-04-29 16:30:59.754053+03
44	10	Администратор	Удалил заявку	ЗПВ-0003	2026-04-29 18:22:12.044619+03
45	10	Администратор	Удалил заявку	ЗПВ-0002	2026-04-29 18:22:12.044619+03
46	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0002	2026-04-29 18:29:35.867567+03
47	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0002	2026-04-29 18:30:11.137991+03
48	15	!!!Мастер ТЦ!!!	Обновил поля: driver_id, driver_name, tc_master_name	ЗПВ-0002	2026-04-29 18:30:29.215999+03
49	16	!!!Водитель!!!	Обновил поля: arrival_load_time, load_start_time	ЗПВ-0002	2026-04-29 18:31:24.64434+03
50	17	!!!Ответственный за сдачу!!!	Обновил поля: departure_load_time, sender_sign	ЗПВ-0002	2026-04-29 18:32:54.075596+03
51	16	!!!Водитель!!!	Обновил поля: arrival_unload_time, unload_start_time	ЗПВ-0002	2026-04-29 18:33:35.68028+03
52	13	!!!Заявитель!!!	Создал заявку	ЗПВ-0003	2026-04-30 12:05:54.673062+03
53	14	!!!Работник ТЦ!!!	Обновил поля: vehicle_id, vehicle_model, tc_name	ЗПВ-0003	2026-04-30 12:07:06.535734+03
54	10	Администратор	Обновил поля: driver_id, driver_name	ЗПВ-0003	2026-04-30 12:08:29.322559+03
55	16	!!!Водитель!!!	Обновил поля: arrival_load_time, load_start_time	ЗПВ-0003	2026-04-30 12:10:06.247046+03
56	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0003	2026-04-30 12:59:44.832776+03
57	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0003	2026-04-30 13:09:27.881585+03
58	10	Администратор	Обновил поля: driver_id, driver_name	ЗПВ-0001	2026-04-30 13:09:47.343628+03
59	10	Администратор	Обновил поля: arrival_load_time, load_start_time	ЗПВ-0001	2026-04-30 13:10:05.456045+03
60	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0001	2026-04-30 13:10:15.735213+03
61	10	Администратор	Обновил поля: departure_unload_time	ЗПВ-0002	2026-04-30 13:10:45.513655+03
62	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0003	2026-04-30 13:15:09.383123+03
63	10	Администратор	Обновил поля: departure_unload_time	ЗПВ-0002	2026-04-30 13:15:24.480362+03
64	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0001	2026-04-30 13:15:29.528485+03
65	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0003	2026-04-30 13:16:16.028937+03
66	10	Администратор	Обновил поля: departure_load_time	ЗПВ-0003	2026-04-30 13:16:24.268851+03
67	10	Администратор	Обновил поля: departure_load_time, sender_sign	ЗПВ-0003	2026-04-30 13:16:41.616749+03
\.


--
-- Data for Name: app_config; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: logistics_user
--

COPY t_p68114469_cross_platform_logis.app_config (key, value) FROM stdin;
header_title_color	#0055ff
process_name	Межцеховые перевозки
header_icon	Factory
header_icon_data	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAmACMDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDI+P8A+098VPDHxw8eaXpfjfVbTTLHWLmGC3j+7GizOqqPYAAfhXA/8NefGPv8QdXz/wBdcV6Df/BWP9oD9tT4ieEX1VtGRtU1C5FzHB5pJV24qDxl+w/rWk/HjSfhpoOu/wBpS3mnjUrjVrm1CC3g37W+Udea/R6c8DTjCnUS5uVPY+dkqzvJPqcL/wANefGP/ooWr/8Af6j/AIa4+Mh/5qFq/wD3+rofjF+yfJ8NPDVr4n0Txda+MPDi6qujahdQQbJLK68zy3BXuFbIrf8A2lf2J1/Z5+Hkfio+Ln1oyXkNgbMWYjA3rnIP4frW0amWycVZXl5C5a+uux+gv7L/AIi1rxl8AvBmtatqbXupXlmXnuJAC0jeY4yT68UVnfsd8/sz+ACDn/QD/wCjXor4KskqsktrvoerGo7Iu2fgX4O+BviNq/jOD+wtJ8WyPM17evqO2Tc7FpCyl8Akk5GK+SfHP7ZHhjRf2ur/AF/TZJtQ8JHRP+EcudUsY2kbcrs5mjI4dUZuo618wftQWsA/aK+JDCJC5167J/7+NXmzcMQBj2r7LBZTDlVSrNy5l9xwVcU78iVrH1L8SPj14L8L/s92Pww8F38vi28vdRTUNW1qSHyUkAmEjfK3VzjpX3PH4w+EX7TXw1059YvNF1TR38ud7G9ukR7aYLyjjPDKSQfcV+OVRS20UzBniU4710V8np1IxVOTi073M4YqUd1c/dvwf4Z8NaD4Z0/T9AhsY9Gt4tlqsLbkCZPCnuM55orzj9jeFR+zJ8PwvC/YDgf9tXor4KpFxnKLlsz1VUjbY+dfi1/wTp8T/EL4reJfEVt4w0qxtNW1Ce9WBraQuiySs4UkcEgNivQ/+He3hn/hQ6eAhqjLr32z+1Tr3lbmFxjBUAn/AFeeAOuKKK7547ExhTipuyIVGnd6GX+z/wD8E+tL+F+u3mueLdaXxPKsL2lvaww+XFGsgwX5/i5rzXxL/wAEtdYj1qcaB41sItJZ2+zw31vIZI48/KpK9SBgZooreGYYr28nzvUipRp8i0Psn4I/DXUvhj8KfDnhWa/t7ybS7c273EakK7B2JIzzjJooorx5VJOTbO6MVZH/2Q==
header_title	АО "Газстройдеталь"
process_name_color	#4400ff
\.


--
-- Data for Name: cargo_types; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.cargo_types (id, name) FROM stdin;
158	Прочее
146	Тройник
147	Переходы
148	Люк-лаз
149	Обечайка
150	Заготовки
151	Отвод
152	Металлопрокат
153	Инструмент
154	Расходные материалы
155	Оборудование
156	Днище
157	Угол
\.


--
-- Data for Name: column_config; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.column_config (key, label, visible, sort_order) FROM stdin;
order_num	№	t	1
applicant_name	Заявитель	t	2
created_date	Планируемая дата / время	t	3
cargo	Наименование груза	t	4
priority	Приоритет	f	5
ppb_name	Приоритет назначил	f	6
quantity	Кол-во	t	7
places	Место погрузки / выгрузки	t	8
vehicle_model	Транспорт	t	9
tc_name	Транспорт назначил	t	10
driver_name	Водитель	t	11
tc_master_name	Водителя назначил	t	12
sender_sign	Груз сдал	t	13
receiver_sign	Груз принял	t	14
stage	Этап / статус	t	15
row_highlight	Подсветка строк по цвету статуса	t	16
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.departments (id, name) FROM stdin;
11	СЦ
12	Ремонтный цех
13	ППБ
14	ЦСД №1
15	ЦСД №2
16	ТЦ
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.locations (id, name) FROM stdin;
15	ЦСД №2 покрасочная
16	ЦСД №2 ГИ
17	ЦСД №2 центральный
18	ЦСД №1
19	СЦ эстакада
20	СЦ
21	МСЦ ТО
22	МСЦ ЭУ
23	МСЦ Дёриес
24	МСЦ кузня
25	МСЦ ИУ
26	ЦСД №1 ТУ
27	Центральный склад
28	СГС
29	Склад комплектации
30	Кислородный участок
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.orders (id, order_num, department, applicant_name, cargo_name, quantity, request_time, load_place, unload_place, priority, vehicle_model, driver_name, driver_id, arrival_load_time, load_start_time, departure_load_time, sender_sign, arrival_unload_time, unload_start_time, departure_unload_time, receiver_sign, note, done, created_by, created_at, updated_at, cargo_type_id, load_location_id, unload_location_id, vehicle_id, execution_date, stage, department_id, tc_master_name, ppb_name, tc_name) FROM stdin;
11	ЗПВ-0002		!!!Заявитель!!!	Днище	1	\N	Склад комплектации	ЦСД №2 покрасочная	0	Газель Н579КА71	!!!Водитель!!!	16	18:31	18:35	18:45	!!!Ответственный за сдачу!!!	18:50	18:52	17:10	\N		f	13	2026-04-29 18:29:35.867567+03	2026-04-30 13:15:24.480362+03	156	29	15	8	2026-04-30 18:29:00	8	\N	!!!Мастер ТЦ!!!	\N	!!!Работник ТЦ!!!
8	ЗПВ-0001		!!!Заявитель!!!	Металлопрокат	1	\N	Проходная №1	Ремонтный цех	0	ГАЗель Бизнес	!!!Водитель!!!	16	14:09	14:10	16:10	\N	\N	\N	\N	\N		f	13	2026-04-29 16:05:00.472393+03	2026-04-30 13:15:29.528485+03	\N	\N	\N	\N	2026-04-30 16:04:00	6	\N	\N	\N	!!!Работник ТЦ!!!
12	ЗПВ-0003		!!!Заявитель!!!	Люк-лаз	1	\N	МСЦ Дёриес	СЦ эстакада	0	Погрузчик 41030	!!!Водитель!!!	16	14:09	14:11	12:36	Администратор	\N	\N	\N	\N		f	13	2026-04-30 12:05:54.673062+03	2026-04-30 13:16:41.616749+03	148	23	19	10	2026-05-01 14:05:00	7	\N	\N	\N	!!!Работник ТЦ!!!
\.


--
-- Data for Name: role_labels; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.role_labels (role, label) FROM stdin;
admin	Техническая поддержка
driver	Водители
ppb	Ответственные за приоритет
shop_chief	Заявители
tc	Ответственные за назначение транспорта
tc_master	Ответственные за назначение водителей
analyst	Аналитики
receiver	Ответственные за приём груза
sender	Ответственные за сдачу груза
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.sessions (token, user_id, created_at) FROM stdin;
ff6f85fc3f7fc8dc04a0c9442e5d03c39470fe5ad147eaaca42a2d6b17408020	10	2026-04-29 12:50:35.284503+03
2f89ff3f7a381ddef66a219984b6fcecd436cfbfc71e05ac5ce843da9903210b	10	2026-04-29 12:50:39.274777+03
93a4cd0d7477adc3244c1b537bfe8e6ee7119364b23074e3c4d425721912453f	10	2026-04-29 12:52:52.489011+03
588430503fb9e730017e08efed31fe5178a305c5744cad1b2586e6619fd0730c	10	2026-04-29 12:58:51.071775+03
2ae3f4ef0d15a7f65656a31c861cccd0022185bc814406bea968244a4db24565	10	2026-04-29 13:01:32.228604+03
bd39cdb9a8ca8b9985eb0e43521bd9977af5df576e3d76046c4bdfcbbb9f0630	16	2026-04-29 14:36:16.259626+03
f7e1d97063209baadbe1285d5167c2299c3d5285e378a0b464b6d2311d3011e9	18	2026-04-29 14:36:48.572145+03
bf367513fec27ab4ab5461f91d03cb683c03f282676206f25561874494ce3cbc	13	2026-04-29 14:37:16.989003+03
ced6cd3813acb673145d8e819c4bbf1516998b5019544e925f055ec9d45420a9	10	2026-04-29 14:52:20.785322+03
3f0e686af039d38f04127a5dffec6a44f5b4ea2ea7a7352c059d7aeb6e7ff6f9	10	2026-04-29 15:23:33.432275+03
19221a4f821c81bd1fbba735c5b09773f4a7310e6f306027dd4e60f928d6cf74	10	2026-04-29 13:04:45.459685+03
b136a5d87269e2063f19ee1d035368377e7b49a2b80e9503d5f388a5d257d46f	10	2026-04-29 13:04:45.552612+03
416020037fb1aed681410ba23060717b264a4c6188d02998e46d6e3c571c4d5d	10	2026-04-29 13:15:01.695341+03
d26f1f7e7a6010c239e9cd3f68d0d9b69596068c2dc766ab50ae4df757582a7e	10	2026-04-29 13:16:12.105769+03
94b61272d07e176b4c785d254c3827860534829a032b0c5dc9b992e43d6c6416	10	2026-04-29 13:16:50.629951+03
21b750c43f7b8b5517462c79c8a18ef8f6c161a736bb1eddd43dff0fc60767d3	10	2026-04-29 13:17:59.989625+03
eda137878c646f64e572ca88ca050695a6727d4dfc30f956c933e46c6652cf77	10	2026-04-29 13:18:49.507813+03
515b780495071d757df91ea6289114aa5fe5c6480cfbca6e40896a9ba1370e28	13	2026-04-29 13:25:51.553161+03
da21113420a2bf72fe8dcfa1e111afdd2187aaea9c495fe80b28967fb6b4a3be	14	2026-04-29 13:26:40.550731+03
c10212f320834411c1f47b0053fa7c29c246cda5a8362fa7ee04687aa36e582d	10	2026-04-29 13:27:32.399301+03
0ccf40280b0b94bd62e525b5f74b9c222d1de108040d4b10a2946c4f7f2adc81	14	2026-04-29 13:31:20.214207+03
35243c857e82ccfb3ed94a7512bd2154c5198b03a80c9f0405dbcca9d26d7a77	10	2026-04-29 13:31:40.646403+03
c9da7dafdffe2f1a44e964d350cb5b5104f4caf25c013f776e402f7fa653070b	14	2026-04-29 13:32:15.149234+03
e1157a5ad1dec588b447007d3e9532cf5a7d81c06e7524ca78612eea26edec2b	15	2026-04-29 13:35:03.572949+03
b73a8473837dfab6712c47bfbadea285dfc1ad2b3287a3b2d53291d336f7df10	10	2026-04-29 13:35:45.636415+03
3265bc870dc6b71f5a65459894e44bf3d176ff433139e698ad42a1a682cefef7	15	2026-04-29 13:36:41.843842+03
5e0b79bf7b7ac9360c342fe3b51d040cd3b6ef5b5ce657b978342b1499dc1ce0	15	2026-04-29 13:39:29.106735+03
e6652dc8845319109ecdb9501dcb7d44d6175c7add4cf6025b1eb604981b099d	16	2026-04-29 13:39:46.996019+03
4a49af23c0947ce1dcbcb9dfa980ee14c7f93c9a941fb169e88b86bdd7afda4e	16	2026-04-29 13:43:53.331975+03
7843ad850816ef6c47d55a99bcafcc34ea47d0616550fa9945eb7168b20f5e90	16	2026-04-29 13:48:24.583251+03
4997c42731fcac7467c162e2fb00bf2a7d28ce5523fc92b760c99dfb14691a37	17	2026-04-29 13:48:48.738256+03
d9df0604cd07d1873e828846ef9dbe871f0df50e02a62d839b5aea227bc100d4	13	2026-04-29 13:50:23.083184+03
723a81b46c6773ae71b8139d8db31f5bd9774e9e2f0cc751feee02f64429b668	14	2026-04-29 13:50:57.814264+03
ff72359554dacb4a397c785675affaa800e30c6c007486e7c0f51aae51e01338	10	2026-04-29 13:51:14.008976+03
a7e9017372417edaac780144f9f48c484fa9f5c2abe0121ac0568ed1500411ce	14	2026-04-29 13:54:53.492233+03
fd705a0560e063de33dcc3f7022fe3c1c3208001fa822ec111163f804d206504	14	2026-04-29 13:56:29.327833+03
1b13222886187a3d9b541ee6a792ac9984fa16e98d2c5957bb09460206f753c7	14	2026-04-29 13:57:23.267174+03
d9a64265ad71433319d8c318939d9c9a7e89fb00540056c14816567079815b0c	15	2026-04-29 13:57:47.745409+03
0c9c13ea2cb03fdf5e31f586b979689663decc4a34af8a836a86e930e04a3aee	10	2026-04-29 13:59:30.827813+03
c75859eb02ec2a65f415203a690589fd77dc94753adff676b16981f8ca1d8194	10	2026-04-29 13:59:43.567975+03
8831e4cbbd053e8d24ef898715d0e93b886d2fcbaaef63fdd46382bcd9178c39	15	2026-04-29 14:00:59.296743+03
9aacfdeac77e3c9e28ebaa60234aaf76af27ce6c94660da71cc457f56f0fe8b7	10	2026-04-29 14:01:25.206371+03
74eb19db1a60652162e47276603eb0eda6f94a7d5174fd02902e2a2aeee31550	10	2026-04-29 14:03:44.735024+03
2c2ce2b30a877826acc0f8fdddf5245ebb3797a148cb71b4b2182375a737f40f	10	2026-04-29 14:05:16.134677+03
13aca609ef87c7cf4f19b0c5acfb7aec2ba4ef4626ccb3540bcb39159c9c9cc9	15	2026-04-29 14:05:32.736302+03
d2672d50a198f35db0901cb0b7645409b87c0b78c5a5a0d596ea4e0650573825	13	2026-04-29 14:06:17.957446+03
994740a911df9de055f8daa129b9d28826313d9992e8778e83524dd2fa5376f3	14	2026-04-29 14:06:49.792927+03
5db412d076e3babfb81ed1a16706fb595d17707d6d62b3c0edc7b2b3294d742a	10	2026-04-29 14:07:48.147163+03
9d8d4af836c94e0e92b6e78d1ea574cc1f4bcea2f985282f51119f5e343167a5	14	2026-04-29 14:10:00.364678+03
3b9bdf0d8d35873d54d27850ff43d51db382e5049b7f2787c636421fb55b19cd	10	2026-04-29 14:14:36.385853+03
6d556de9ad6ecd71ad1ae02117864c8203ad0c078b9a2c9c97abe7b0fe1c8b93	13	2026-04-29 14:19:12.638269+03
215cb878a18d6105a17a47fceee0fc29e1c9c8809ba765e79aba4a9e971ec63e	10	2026-04-29 14:20:05.478166+03
e7fdb0989e2bf677346c4021ec4637f0224797d28f3860c3482af6045b2489ab	14	2026-04-29 14:20:31.175857+03
d90e3c5ceca3b0311f211c864e97ac25ca8541aa6e40a45812a56f5ebd5d2d28	10	2026-04-29 14:22:43.767058+03
4dd5a1e2478f422be50c02d9702fe9a97384c8f500a0b8f3fb13a8f83dcdc380	10	2026-04-29 14:22:43.8617+03
4ce8019654124b9203a28061c0c8f3666a9a8f93112659aba02dcdb3d1698874	14	2026-04-29 14:23:34.982888+03
f9b19ce0d9a329105a6506fa1962c24eec7d92b94bc49aca4f37d29e31e7d182	10	2026-04-29 14:26:25.00596+03
e86e733298caeb73168d6d1845609e95b36365a56387f8dc2087c48d564ca2ed	14	2026-04-29 14:27:34.074272+03
9455bb5d12a2396d1401f6ae5e7303d771d8a2f156bf2bb993587be066be32ac	10	2026-04-29 14:28:03.151818+03
57038571e30e38c6b4120f3e6c4dac09a4dffdd0ef967f622e7a589896ca1210	14	2026-04-29 14:28:33.78292+03
d44a7f4e119547a662b577537dac86fe2d91ad4e1e5833a9b5b0f703c687da6e	10	2026-04-29 14:29:06.542061+03
198ed94eb8cb9c398ff535cd661a416ad6727f1870ffbdc0de9b87e6dc3ad1e7	14	2026-04-29 14:31:13.416754+03
6dc62c539dd8f00040840b7236c6fd75aded18b89e02f80be08399db9865df26	10	2026-04-29 14:32:20.67447+03
672d1709d7884326ca5dfe0bb327e7922b876f3701747255fa028acdd2cd015a	10	2026-04-29 14:32:40.172496+03
f418f8bf786d688f42e82c9e8cc405f4f91cc0f8c650162cb78f43e48731dadd	13	2026-04-29 14:33:32.112314+03
b6967c0390dc2b903630df0d92bbe38f7c31f2fd704a194742d5156cda1b771f	14	2026-04-29 14:34:09.742308+03
9fc6a4cfb24fabeee1923ca6ac413cbb4d0d0660b8688dcf6b2bc2314776ca4a	15	2026-04-29 14:34:40.940754+03
3ed743dfb0f95ca4dedd67b3dab7b2766ce5622efa27c8d05e2ad80490b5e0f8	16	2026-04-29 14:35:02.401563+03
f0f87eead3acfafb2f47e8a257b9446a75d8c08ec381e6ce216f0772fdc5f30d	17	2026-04-29 14:35:43.421974+03
abda3ef9c2590c1d8bdf2be053c777719692d86bed39b4656d5f4b455e69594e	10	2026-04-29 15:28:57.982103+03
1931c23fb456c2a61e20c02e65a16d8b33d0a9d8cf9793429a22bcdd37b4488e	10	2026-04-29 15:30:15.401438+03
8721a898e30c3d8185dcf249db14ea050045b3ddae54872794b447e1829c948c	10	2026-04-29 15:31:20.591839+03
1da8b32d707574fe12bb9348039700dd5742333ad5c69237e9ed8c61e592e740	10	2026-04-29 15:31:26.063846+03
856cb515f15678fca0daa9e44b40d312c13763b7dc119e090fdbc721b6c67e1d	10	2026-04-29 15:31:31.96404+03
f259dfe7e13687515ffcfd0b0ff0cbaef346a30879b87bc5de03e04c36d37986	10	2026-04-29 15:43:57.855767+03
91a4ef94f27b8f5dd52040b7226534e8606c667f766aed0bf2c59a1b3eaeffaa	10	2026-04-29 15:55:53.813011+03
61f4d2037010565762fd8b81402ae99ea918622114e42455975ab76da8d26d29	13	2026-04-29 16:04:38.21754+03
e646ac4a57a541c68a44b65a2707789170e5ee7ae367df646ed89484ba1538ce	10	2026-04-29 16:07:01.902558+03
5ff0045958786a930b3c59614dfd9a789a0487ac601e421079b6478b42dd9055	13	2026-04-29 16:13:06.981853+03
8dfab2d33293b061cc623c5c37dbb4802490fb6c731d15176140b4dd3276f1b5	19	2026-04-29 16:15:12.509522+03
da4b50e90621116178660970eba4b00f72fba14d39c09fe09dcdb15d8356cf73	10	2026-04-29 16:15:47.643641+03
8879fa70cabadc162ac0be96717470dea10d24c3eeb54702b8d3ae97c1294981	19	2026-04-29 16:16:21.200693+03
d1b2e790f9c9b64a52fec4d6da3563cb13ac73222100200f2ccddeda031dcb8b	10	2026-04-29 16:16:59.072252+03
6dad2b511521e5e5fa4d522296c3af5f304d51d5709f8f8c5323243b7ad3d332	19	2026-04-29 16:17:31.755009+03
4bb5b5b6e8367f06c49c5dd39410d1d05566bf3b05e587dde7d044481eabcb4d	10	2026-04-29 16:17:52.659698+03
238951edab3cf2df668aef550577ecb5990c1c05d010effddeb9c1ed4308a182	19	2026-04-29 16:18:20.531092+03
85c0a7a3cc43507e7bdc548c34a704c7ad89e59ac96ada04736054ce295f9a8c	14	2026-04-29 16:18:57.95334+03
076f5e5707d73e5ed3065933b0c5524b25bfff5b19aa26db698dd45e2b9b08b7	10	2026-04-29 16:23:13.117944+03
f400c00104d768f4f848ef427b667d4df348f0c485e60ca66a016c591e5433b6	10	2026-04-29 16:24:10.690634+03
0a796b52f858f9a228e383cdc49d460a2352c9f15a37e82637e2178b4d7d71e7	10	2026-04-29 16:24:24.666489+03
676616f2a3139e37706bfb04bed96c7486fee7d1d75eddcf4aa11e1af22dd388	19	2026-04-29 16:24:44.522281+03
4a69736d85ee7f6c88a921df213d2192443f190c3638c7c627ded12fac8b5c77	14	2026-04-29 16:24:58.235162+03
25e80f9c5ad9676e3c5956368c011bf80b6747e58d54cb4574739ad73d5454e5	10	2026-04-29 16:25:47.433201+03
b5fbfb7f379a8b26dafc3c505548e4ac05a3f861f6647817f8a974c06ea2400a	10	2026-04-29 16:26:04.633851+03
052edeb1012dcf123e1ed289f3a0b2dd5a80ff967823bef0cbb514fa44f3adf4	14	2026-04-29 16:26:32.820357+03
ff0b829b5a0a687e1a9d2e93b13540ab27f3dc2f05d04a44ddbf18c83ababf65	15	2026-04-29 16:27:42.919027+03
cc949342cc9ef72fc11ceec76c6c46ea2c0cea5bc00bcc88be6ad43791533158	16	2026-04-29 16:28:19.551885+03
c4473106252942b2bc4ffa7bb9c4735be155ef22baf40dcb471c67833140af42	17	2026-04-29 16:29:01.289244+03
211c6c0a66dd96ed8e68f751e0cb867f3d06bb23123a6afe440a92331b25cecb	18	2026-04-29 16:29:51.292043+03
9814645a254cb8bc2bb04970882900f71c9a177ca32a5168f12a2b3d2cebb664	16	2026-04-29 16:30:19.789993+03
e538c03675fc8a85521ec2da650c2e94a43edecd0648487258c05a54c925a863	18	2026-04-29 16:30:50.548156+03
941b8e85513b47d0cf3246b2ee30737383f5ec773a0deaa99fe3d669ba7fef99	10	2026-04-29 16:31:28.078361+03
1508c1fab4d15ef235af616860f56967277c7cf5eef0ca3b6b88e04db8384d77	10	2026-04-29 16:34:52.114857+03
60513c8d6fea46b9ff7cceff12d134f49c606e4f4b733993a6aee5b0f5c03670	10	2026-04-29 16:35:08.914362+03
8ff91d72a54229a12afc4c7f6b7db95f0d39b444fe18aba4eb3108ad72841de3	10	2026-04-29 16:36:23.460465+03
ca4de19da6e79f2eb51cac4d8633b21bc38e9103732cda5de6d7a7dcc12fcb45	10	2026-04-29 16:40:22.525391+03
8d59545d2333182d5548392b48fb9cb535c896570715d2d2d3c309b31cfee63d	10	2026-04-29 16:44:32.83721+03
4bcfdeeaea927fcabd9e611048ee3e380e52da23603751e60539b80c35db7a4b	10	2026-04-29 16:44:53.6726+03
5a019366d3ee85e0d8739aa58ec463fddbe766cc3605c5677a797b477b3a5891	10	2026-04-29 16:45:09.459322+03
ad6a17724dcf5749595d224152ef319d6310ff81e270e68738d95a3c85ba7eca	10	2026-04-29 16:47:15.058097+03
157c70f899ab8bedade9f2922a650ce554b1f5e167b485245e93992d8547c22e	10	2026-04-29 16:48:20.966185+03
24b525d7ce5e977103219f70d4fa88532ec9effb8e25322338bf89b543ce2659	10	2026-04-29 17:03:17.126566+03
843cac33f7602935bad5776aaa0118a9195c3226af103c19c6a16ea33a11277a	10	2026-04-29 17:12:41.339076+03
6b3969b51ae42661bcb43bb951b190d52ba1f57324828eb49a380dcecd83c100	10	2026-04-29 17:15:41.587902+03
a74fbb3d2fda2ff29fd08f0754e9ddf7f0577e5b9f7c9b7f5e2d42bfbbd8813b	10	2026-04-29 17:19:46.092758+03
378f2e20fe980c3563e4b469f1e4292bb1f3ed5b162dd1a157477a7da2260ada	10	2026-04-29 17:21:34.041301+03
7939fd78c5f9821f7de15f13a8c75eebda3e8016f8cd9cd5cb451c3243c97e97	10	2026-04-29 17:27:36.354234+03
a107eb2d7f29f5e8f35221d45e9cec5c8e582d60b9f92e50fde982285bc1fbf3	10	2026-04-29 17:35:52.492117+03
11030b514d22ed041657b414a6d60442488865ecf120d1a32f972a304a7bb87d	10	2026-04-29 17:50:45.602051+03
8613a0fbded9604a69ab225c0cf491e6337ef3fa02b898e67a3337eec5de3a75	10	2026-04-29 17:55:31.115966+03
2d3f4845e59e666d4a843170dfb57552353664b2be5086dfb362e10cb317a9ec	10	2026-04-29 17:59:33.605799+03
807da6be06f6b13c6b6c60f36b981f774d06a01652b74540e0b378e9d8d81138	10	2026-04-29 18:08:58.266744+03
222b724d00ecf439f8b0366440fe0792fcd65fd9497c206a7c218c436c54199b	10	2026-04-29 18:13:35.749838+03
53658c8782e6fa7bdb0c27a022ae7311d169a4850d59a21f10d290fab7959c26	10	2026-04-29 18:22:11.802163+03
eafd8983e3c4099e4fa1dfe6d3b4d15297fccdc0d4a59213b056fb06771672ff	10	2026-04-29 18:28:33.607933+03
69e57cb56c624e32acbe0aece4730cb43f8bc168b0a35922282edaf6ec58442b	13	2026-04-29 18:29:07.508299+03
8fea900a398afeef559d68cfc47fe236e381b46183e666327e4e15dd04789566	14	2026-04-29 18:29:54.132949+03
91581ce061272dfb9741540c8b69ea6365d08cdf8d24d589850ea931818174f2	15	2026-04-29 18:30:21.059051+03
71d4839f743cb324c46c81788377d8a394499aef836d4fd7e7f7663e1c398337	16	2026-04-29 18:31:09.112477+03
4c60b361556b003b99f8345bf20ab23849b4596322546b334359af4de48db640	17	2026-04-29 18:31:48.411319+03
f92e6a194d90d7422dcc56ddcf2b83b5c1dff5e71a776730b0b534fbf62e9bf8	18	2026-04-29 18:31:58.682097+03
f9f410fb01c5cd842a98efc255c33120ee8376b00104f034446f5b242e0d01b4	17	2026-04-29 18:32:36.144177+03
094bafbe0e4a677ffc0a3258de087b07226646a4ec38097fcd1b9dd5c098bbc3	16	2026-04-29 18:33:06.741451+03
f8c5f4a5a9b475fcc065c3a68c1e9a0c3d37788d5b3d3ce95067c24eea7401ae	10	2026-04-29 18:33:41.231092+03
1381cb377b1ddefe53dbd2c2a998d33c6abce59e2f63a73ddbc62bc1a78494ac	10	2026-04-30 09:25:48.766473+03
c9daaa4cfcf7d631fe28fcc9a1b4b03bdd9fd973b35074a7e89ce24bd33e3dcd	10	2026-04-30 09:25:53.966107+03
bcad3b74ac0cd2fcd997121bd968826e794330b979429aea7b77fe3503a8c73c	10	2026-04-30 10:22:43.854218+03
fa4ad5e37d06ca2cacefc2fcd94ddce7e7a3834a752bb41520c2d8a1ffc62f9a	10	2026-04-30 12:05:12.314058+03
4f7ea5c15cd6a27cd03cb702147a5935b590f58715e3de46606430b6315a8d45	13	2026-04-30 12:05:30.81387+03
4f9b89e9e68087c6495da3ea6e3bba01d2dbb089cd289d853849cf7f6312aa7b	14	2026-04-30 12:06:48.446974+03
c83da8736c1649759256c4b357d219edd8a775bd3ab55ede53ea846fda61172a	10	2026-04-30 12:07:14.79806+03
d8280c01cd9bc6eb24293a4d4094669d086981a9d3ad25a29b28a36631fb9d0d	16	2026-04-30 12:08:56.109225+03
5e8fd6af7bbecbb0def5b848402784d486067b999297a4c8af6d5804fadc4b1a	10	2026-04-30 12:59:30.116686+03
f51bd18314fa2ebd638dd2df403783ca3b2740bbeba9168dc8046f625ba2a645	13	2026-04-30 13:00:04.277023+03
1c983031d7e2e8ca6ac2a4aab76407b90a9d705f07801cfc77fe7d64b3eecf71	10	2026-04-30 13:06:38.400027+03
b314ce47cbc336a13ce963520ab80a9b477488bd3076751ac968dfc87676200f	10	2026-04-30 13:09:21.522476+03
00ff4bbd46e95d720ced6ad17fd5ee3fc67ff4c21c3f27bae81977d57c434107	10	2026-04-30 13:15:03.119841+03
17c45d2528b3a973ccaca976b8e6dff56a84621abb7e95d4703b9bbe192d3be0	10	2026-04-30 13:16:15.83664+03
48501e0aad0ce30bdad5914c841464a6af2f35ee5441f0d00af47ee9570f62e3	10	2026-04-30 13:16:24.120588+03
2c2c4f08726c86b49547d6382fa50068bd7d2a5726207bb3f244d6251c487b8e	10	2026-04-30 13:16:41.476328+03
b5bb7ce17818857a5afe2073120ce397dbb76ca492db20a63f8845a8e8ef806c	10	2026-04-30 13:32:18.934173+03
45e1d3349a0b19318bfae73df7c145b876fc65cf22294e44cbd5fc8a16190fd0	10	2026-04-30 13:42:56.510618+03
e696d26b588adc949d95bc3c9189ab4c504383818ccb3748ff2b054f348825f8	10	2026-04-30 15:15:53.767994+03
c90e488b7a96cfe995e1374b928cea56d2f013f74dae29f120de5214a1a7a7ad	10	2026-04-30 15:20:44.231948+03
1f376becba8835925f0b6599d7977b61b3302c1f19ba31c953eff3375912f26b	10	2026-04-30 15:41:22.541089+03
a1abc266fbb6994df434a461bc4e68d374d384d0f74bcb461ca8d958c408b660	10	2026-05-04 13:52:46.126941+03
2da409edbfc13e8011d26c4f1768687349d6469a186bd01ab1aab9ba6b83864e	10	2026-05-05 09:21:57.09628+03
\.


--
-- Data for Name: stage_labels; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.stage_labels (stage, label, color) FROM stdin;
3	Поиск транспорта	#F97316
5	Погрузка	#8B5CF6
6	Отправка	#3B82F6
7	Прибытие	#06B6D4
8	Разгрузка	#10B981
9	Выполнено	#84CC16
1	Новая зявка	#ff002b
2	Определение приоритета	#ef5d4d
4	Назначение водителя	#F59E0B
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.user_roles (user_id, role) FROM stdin;
10	admin
13	shop_chief
14	tc
15	tc_master
15	ppb
16	driver
17	sender
18	receiver
14	ppb
19	ppb
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.users (id, name, login, password_hash, role, created_at, department_id) FROM stdin;
11	Bulk User 1	bulk_user_1_del_11_del_11_del_11	298cefbafe64b016b4c185a484164030	driver	2026-04-29 13:15:01.78439+03	\N
2	Диспетчер Смирнова	smirnova_del_2_del_2	6e0a14fd6ca2ce94de7bcf122f08e88a	ppb	2026-04-29 12:50:08.650782+03	\N
9	Кузнецова И.Р.	kuznetsova_del_9_del_9	f74f48510af95f436734182ffeab5d32	receiver	2026-04-29 12:50:08.650782+03	\N
8	Горелов П.И.	gorelov_del_8_del_8	27ee6de281e64c81230e28e8832a314e	sender	2026-04-29 12:50:08.650782+03	\N
3	Мастер ТЦ Орлов	orlov_del_3_del_3	29090992e1def3c47180673859350126	tc_master	2026-04-29 12:50:08.650782+03	\N
4	Иванов К.П.	ivanov_del_4_del_4	fedeec3bb7d0552837d92644878d2ff0	driver	2026-04-29 12:50:08.650782+03	\N
12	Bulk User 2	bulk_user_2_del_12_del_12_del_12	de0027b14d3170408a9572cbfab63fc6	driver	2026-04-29 13:15:01.835909+03	\N
1	Морозов В.А.	morozov_del_1_del_1	9b39fbe50e446f6658bb70987149093b	shop_chief	2026-04-29 12:50:08.650782+03	\N
5	Петров М.С.	petrov_del_5_del_5	0e67a8409550b56def11f987eaff54c0	driver	2026-04-29 12:50:08.650782+03	\N
7	Новиков Р.Е.	novikov_del_7_del_7	dc0c61dde2afd727510c83f7a9f28c9a	driver	2026-04-29 12:50:08.650782+03	\N
6	Сидоров А.В.	sidorov_del_6_del_6	621de06a580cd8a37ee2dafdbd6496c6	driver	2026-04-29 12:50:08.650782+03	\N
13	!!!Заявитель!!!	nc	1234	shop_chief	2026-04-29 13:22:15.077298+03	\N
15	!!!Мастер ТЦ!!!	MT	1234	tc_master	2026-04-29 13:23:47.24788+03	\N
16	!!!Водитель!!!	VD	1234	driver	2026-04-29 13:24:43.389052+03	\N
17	!!!Ответственный за сдачу!!!	OZ	1234	sender	2026-04-29 13:25:13.496805+03	\N
18	!!!Ответственный за приём!!!	OP	1234	receiver	2026-04-29 13:25:37.095306+03	\N
14	!!!Работник ТЦ!!!	RT	1234	tc	2026-04-29 13:22:53.025216+03	\N
19	!!!Ответственный за приоритет!!!	RP	1234	ppb	2026-04-29 16:11:59.262689+03	\N
10	Администратор	admin	1234	admin	2026-04-29 12:50:08.650782+03	\N
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

COPY t_p68114469_cross_platform_logis.vehicles (id, name) FROM stdin;
7	Камаз А105КР71
8	Газель Н579КА71
9	Камаз В365СВ71
10	Погрузчик 41030
11	Погрузчик 4086-07 Голиаф
12	ТЕУ FD100
\.


--
-- Name: action_logs_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.action_logs_id_seq', 67, true);


--
-- Name: cargo_types_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.cargo_types_id_seq', 158, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.departments_id_seq', 16, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.locations_id_seq', 30, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.orders_id_seq', 12, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.users_id_seq', 19, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

SELECT pg_catalog.setval('t_p68114469_cross_platform_logis.vehicles_id_seq', 12, true);


--
-- Name: action_logs action_logs_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.action_logs
    ADD CONSTRAINT action_logs_pkey PRIMARY KEY (id);


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: logistics_user
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (key);


--
-- Name: cargo_types cargo_types_name_key; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.cargo_types
    ADD CONSTRAINT cargo_types_name_key UNIQUE (name);


--
-- Name: cargo_types cargo_types_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.cargo_types
    ADD CONSTRAINT cargo_types_pkey PRIMARY KEY (id);


--
-- Name: column_config column_config_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.column_config
    ADD CONSTRAINT column_config_pkey PRIMARY KEY (key);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: locations locations_name_key; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.locations
    ADD CONSTRAINT locations_name_key UNIQUE (name);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_num_key; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_order_num_key UNIQUE (order_num);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: role_labels role_labels_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.role_labels
    ADD CONSTRAINT role_labels_pkey PRIMARY KEY (role);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: stage_labels stage_labels_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.stage_labels
    ADD CONSTRAINT stage_labels_pkey PRIMARY KEY (stage);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_name_key; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.vehicles
    ADD CONSTRAINT vehicles_name_key UNIQUE (name);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: action_logs action_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.action_logs
    ADD CONSTRAINT action_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES t_p68114469_cross_platform_logis.users(id);


--
-- Name: orders orders_cargo_type_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_cargo_type_id_fkey FOREIGN KEY (cargo_type_id) REFERENCES t_p68114469_cross_platform_logis.cargo_types(id);


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES t_p68114469_cross_platform_logis.users(id);


--
-- Name: orders orders_department_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_department_id_fkey FOREIGN KEY (department_id) REFERENCES t_p68114469_cross_platform_logis.departments(id);


--
-- Name: orders orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES t_p68114469_cross_platform_logis.users(id);


--
-- Name: orders orders_load_location_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_load_location_id_fkey FOREIGN KEY (load_location_id) REFERENCES t_p68114469_cross_platform_logis.locations(id);


--
-- Name: orders orders_unload_location_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_unload_location_id_fkey FOREIGN KEY (unload_location_id) REFERENCES t_p68114469_cross_platform_logis.locations(id);


--
-- Name: orders orders_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.orders
    ADD CONSTRAINT orders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES t_p68114469_cross_platform_logis.vehicles(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES t_p68114469_cross_platform_logis.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES t_p68114469_cross_platform_logis.users(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER TABLE ONLY t_p68114469_cross_platform_logis.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES t_p68114469_cross_platform_logis.departments(id);


--
-- Name: TABLE action_logs; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.action_logs TO logistics_user;


--
-- Name: SEQUENCE action_logs_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.action_logs_id_seq TO logistics_user;


--
-- Name: TABLE cargo_types; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.cargo_types TO logistics_user;


--
-- Name: SEQUENCE cargo_types_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.cargo_types_id_seq TO logistics_user;


--
-- Name: TABLE column_config; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.column_config TO logistics_user;


--
-- Name: TABLE departments; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.departments TO logistics_user;


--
-- Name: SEQUENCE departments_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.departments_id_seq TO logistics_user;


--
-- Name: TABLE locations; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.locations TO logistics_user;


--
-- Name: SEQUENCE locations_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.locations_id_seq TO logistics_user;


--
-- Name: TABLE orders; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.orders TO logistics_user;


--
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.orders_id_seq TO logistics_user;


--
-- Name: TABLE role_labels; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.role_labels TO logistics_user;


--
-- Name: TABLE sessions; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.sessions TO logistics_user;


--
-- Name: TABLE stage_labels; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.stage_labels TO logistics_user;


--
-- Name: TABLE user_roles; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.user_roles TO logistics_user;


--
-- Name: TABLE users; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.users TO logistics_user;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.users_id_seq TO logistics_user;


--
-- Name: TABLE vehicles; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE t_p68114469_cross_platform_logis.vehicles TO logistics_user;


--
-- Name: SEQUENCE vehicles_id_seq; Type: ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE t_p68114469_cross_platform_logis.vehicles_id_seq TO logistics_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA t_p68114469_cross_platform_logis GRANT SELECT,USAGE ON SEQUENCES TO logistics_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: t_p68114469_cross_platform_logis; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA t_p68114469_cross_platform_logis GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO logistics_user;


--
-- PostgreSQL database dump complete
--

\unrestrict NatOui5fkHc4DYi9Whc0DASFJmNLcoMY16Qau9Y8KgiaRDYtLEESLJPoqoloh7V

