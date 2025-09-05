--
-- PostgreSQL database dump
--

\restrict g28DlYjV7jefMOY3dMiLNTGaITc2qbiocZTl7lwqqCQBuA51ytKjoc2hPeTbGNt

-- Dumped from database version 15.10 (Debian 15.10-1.pgdg120+1)
-- Dumped by pg_dump version 17.6

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

DROP DATABASE IF EXISTS delfi;
--
-- Name: delfi; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE delfi WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE delfi OWNER TO postgres;

\unrestrict g28DlYjV7jefMOY3dMiLNTGaITc2qbiocZTl7lwqqCQBuA51ytKjoc2hPeTbGNt
\connect delfi
\restrict g28DlYjV7jefMOY3dMiLNTGaITc2qbiocZTl7lwqqCQBuA51ytKjoc2hPeTbGNt

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BudgetTransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BudgetTransactionType" AS ENUM (
    'TRANSACTION',
    'TRANSFER'
);


ALTER TYPE public."BudgetTransactionType" OWNER TO postgres;

--
-- Name: CategoryType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CategoryType" AS ENUM (
    'EXPENSE',
    'INCOME',
    'TRANSFER'
);


ALTER TYPE public."CategoryType" OWNER TO postgres;

--
-- Name: RecurrenceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RecurrenceType" AS ENUM (
    'SCHEDULE',
    'TRIGGER'
);


ALTER TYPE public."RecurrenceType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    account_id text NOT NULL,
    external_account_id text,
    display_name text,
    external_name text NOT NULL,
    mask text,
    type text NOT NULL,
    subtype text NOT NULL,
    current_balance double precision NOT NULL,
    available_balance double precision,
    "limit" double precision,
    apy double precision,
    iso_currency_code text,
    source text NOT NULL,
    source_id text,
    source_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_successful_sync timestamp(3) without time zone,
    last_failed_sync timestamp(3) without time zone,
    sync_error text,
    workspace_id text NOT NULL,
    institution_id text,
    plaid_item_id text,
    plaid_account_id text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: AccountPartition; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AccountPartition" (
    account_partition_id text NOT NULL,
    name text NOT NULL,
    current_balance double precision NOT NULL,
    account_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AccountPartition" OWNER TO postgres;

--
-- Name: BalanceAdjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BalanceAdjustment" (
    balance_adjustment_id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    balance double precision NOT NULL,
    account_id text,
    account_partition_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BalanceAdjustment" OWNER TO postgres;

--
-- Name: Budget; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Budget" (
    budget_id text NOT NULL,
    memo text NOT NULL,
    recurrence_type public."RecurrenceType" NOT NULL,
    workspace_id text NOT NULL,
    origin_account_id text,
    target_account_partition_id text,
    origin_account_partition_id text,
    category_id text,
    account_id text NOT NULL,
    transaction_type public."BudgetTransactionType" NOT NULL,
    group_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Budget" OWNER TO postgres;

--
-- Name: BudgetChildItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BudgetChildItem" (
    budget_child_item_id text NOT NULL,
    budget_id text NOT NULL,
    amount double precision NOT NULL,
    date text NOT NULL,
    date_order text,
    authorized_date text,
    iso_currency_code text,
    memo text NOT NULL,
    transaction_type public."BudgetTransactionType" NOT NULL,
    account_id text NOT NULL,
    origin_account_id text,
    target_account_partition_id text,
    origin_account_partition_id text,
    category_id text,
    group_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BudgetChildItem" OWNER TO postgres;

--
-- Name: BudgetScheduleVariant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BudgetScheduleVariant" (
    budget_id text NOT NULL,
    amount double precision,
    schedule jsonb NOT NULL,
    window_interval text,
    window_quantity integer,
    projection_interval text,
    projection_quantity integer,
    schedule_variant_id text NOT NULL,
    amount_type text DEFAULT 'fixed'::text NOT NULL,
    trigger_filter jsonb,
    trigger_operand double precision,
    trigger_operator text,
    month_amounts jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BudgetScheduleVariant" OWNER TO postgres;

--
-- Name: BudgetTriggerVariant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BudgetTriggerVariant" (
    budget_id text NOT NULL,
    start text,
    "end" text,
    trigger_filter jsonb NOT NULL,
    trigger_operator text NOT NULL,
    trigger_operand double precision NOT NULL,
    trigger_variant_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BudgetTriggerVariant" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    category_id text NOT NULL,
    name text NOT NULL,
    type public."CategoryType" NOT NULL,
    workspace_id text NOT NULL,
    icon text,
    parent_category_id text,
    color text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: CategoryDetectionMapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CategoryDetectionMapping" (
    workspace_id text NOT NULL,
    detection_key text NOT NULL,
    category_id text NOT NULL
);


ALTER TABLE public."CategoryDetectionMapping" OWNER TO postgres;

--
-- Name: Group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Group" (
    group_id text NOT NULL,
    name text NOT NULL,
    workspace_id text NOT NULL,
    color text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Group" OWNER TO postgres;

--
-- Name: Institution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Institution" (
    institution_id text NOT NULL,
    name text NOT NULL,
    logo text,
    plaid_institution_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Institution" OWNER TO postgres;

--
-- Name: Merchant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Merchant" (
    merchant_id text NOT NULL,
    name text NOT NULL,
    logo text,
    plaid_merchant_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hostname text,
    detection_key text
);


ALTER TABLE public."Merchant" OWNER TO postgres;

--
-- Name: PlaidItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlaidItem" (
    plaid_item_id text NOT NULL,
    plaid_institution_id text NOT NULL,
    access_token text NOT NULL,
    workspace_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PlaidItem" OWNER TO postgres;

--
-- Name: SavingsGoal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SavingsGoal" (
    savings_goal_id text NOT NULL,
    target_balance double precision NOT NULL,
    target_date timestamp(3) without time zone,
    schedule_details jsonb,
    account_id text,
    account_partition_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SavingsGoal" OWNER TO postgres;

--
-- Name: Tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tag" (
    tag_id text NOT NULL,
    name text NOT NULL,
    workspace_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Tag" OWNER TO postgres;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transaction" (
    transaction_id text NOT NULL,
    amount double precision NOT NULL,
    date text NOT NULL,
    authorized_date text,
    iso_currency_code text,
    notes text,
    original_description text NOT NULL,
    pending boolean DEFAULT false NOT NULL,
    done_pending boolean DEFAULT false NOT NULL,
    location_address text,
    location_lat double precision,
    location_lon double precision,
    location_city text,
    location_region text,
    location_postal text,
    source text NOT NULL,
    source_id text,
    source_data jsonb,
    account_id text NOT NULL,
    merchant_id text,
    pending_transaction_id text,
    workspace_id text NOT NULL,
    date_order text,
    account_balance double precision,
    plaid_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    transfer_pair_id text
);


ALTER TABLE public."Transaction" OWNER TO postgres;

--
-- Name: TransactionAttribution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransactionAttribution" (
    transaction_attribution_id text NOT NULL,
    amount double precision NOT NULL,
    memo text,
    transaction_id text NOT NULL,
    account_partition_id text,
    category_id text,
    budget_id text,
    group_id text,
    budget_child_item_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TransactionAttribution" OWNER TO postgres;

--
-- Name: TransactionReview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransactionReview" (
    transaction_review_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    transaction_id text NOT NULL,
    workspace_id text NOT NULL,
    assigned_to_id text,
    reviewed_by_id text,
    reviewed_at timestamp(3) without time zone,
    dismissed_at timestamp(3) without time zone
);


ALTER TABLE public."TransactionReview" OWNER TO postgres;

--
-- Name: TransactionRule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransactionRule" (
    transaction_rule_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    workspace_id text,
    filter jsonb NOT NULL
);


ALTER TABLE public."TransactionRule" OWNER TO postgres;

--
-- Name: TransactionRuleAction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransactionRuleAction" (
    transaction_rule_action_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    transaction_rule_id text NOT NULL,
    action text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public."TransactionRuleAction" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    user_id text NOT NULL,
    auth_id text NOT NULL,
    email text NOT NULL,
    given_name text NOT NULL,
    family_name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Workspace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Workspace" (
    workspace_id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Workspace" OWNER TO postgres;

--
-- Name: _BudgetChildTags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_BudgetChildTags" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_BudgetChildTags" OWNER TO postgres;

--
-- Name: _BudgetTags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_BudgetTags" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_BudgetTags" OWNER TO postgres;

--
-- Name: _TransactionTags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_TransactionTags" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_TransactionTags" OWNER TO postgres;

--
-- Name: _UserToWorkspace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_UserToWorkspace" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_UserToWorkspace" OWNER TO postgres;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (account_id, external_account_id, display_name, external_name, mask, type, subtype, current_balance, available_balance, "limit", apy, iso_currency_code, source, source_id, source_data, created_at, last_successful_sync, last_failed_sync, sync_error, workspace_id, institution_id, plaid_item_id, plaid_account_id, updated_at) FROM stdin;
9477913d-2f77-4483-99e8-894aed68e4a8	2	\N	Checking	9094	depository	checking	934.23	1066.94	\N	\N	USD	scraper	\N	{"mask": "9094", "type": "depository", "subtype": "checking", "external_name": "Checking", "current_balance": 1066.94, "available_balance": 1066.94, "iso_currency_code": "USD", "external_account_id": "2"}	2025-06-23 20:58:46.966	2025-09-03 20:00:50.749	2025-09-03 18:00:56.376	Failed to log in to institution: page.waitForSelector: Timeout 30000ms exceeded.\nCall log:\n  - waiting for locator('input#password-callback-1') to be visible\n	f2b1c2d3-4e5f-6789-abcd-ef0123456789	test-afcu-id	gnB9xAw4A7Cm0DN9Qn4eI4b5MpXYZ4FqAdnp5	vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk	2025-09-03 20:00:50.75
7381361c-130a-4374-9348-44df4b0eca54	5	\N	Visa Classic	9094	credit	credit_card	0	\N	1500	\N	USD	scraper	\N	{"mask": "9094", "type": "credit", "limit": 1500, "subtype": "credit_card", "external_name": "Visa Classic", "current_balance": 0, "iso_currency_code": "USD", "external_account_id": "5"}	2025-06-23 20:58:46.973	2025-09-03 20:00:50.749	2025-09-03 18:00:56.376	Failed to log in to institution: page.waitForSelector: Timeout 30000ms exceeded.\nCall log:\n  - waiting for locator('input#password-callback-1') to be visible\n	f2b1c2d3-4e5f-6789-abcd-ef0123456789	test-afcu-id	\N	\N	2025-09-03 20:00:50.75
4eb631c2-53c9-4715-b992-234fab39a67c	3	\N	Expense Savings	9094	depository	savings	16446.11	13000.05	\N	\N	USD	scraper	\N	{"mask": "9094", "type": "depository", "subtype": "savings", "external_name": "Expense Savings", "current_balance": 13000.05, "available_balance": 13000.05, "iso_currency_code": "USD", "external_account_id": "3"}	2025-06-23 20:58:46.951	2025-09-03 20:00:50.749	2025-09-03 18:00:56.376	Failed to log in to institution: page.waitForSelector: Timeout 30000ms exceeded.\nCall log:\n  - waiting for locator('input#password-callback-1') to be visible\n	f2b1c2d3-4e5f-6789-abcd-ef0123456789	test-afcu-id	\N	\N	2025-09-03 20:00:50.75
72ac1f3d-5efb-4612-8495-a5d550e19586	6	\N	Line of Credit	9094	credit	line_of_credit	0	\N	500	\N	USD	scraper	\N	{"mask": "9094", "type": "credit", "limit": 500, "subtype": "line_of_credit", "external_name": "Line of Credit", "current_balance": 0, "iso_currency_code": "USD", "external_account_id": "6"}	2025-06-23 20:58:46.981	2025-09-03 20:00:50.749	2025-09-03 18:00:56.376	Failed to log in to institution: page.waitForSelector: Timeout 30000ms exceeded.\nCall log:\n  - waiting for locator('input#password-callback-1') to be visible\n	f2b1c2d3-4e5f-6789-abcd-ef0123456789	test-afcu-id	\N	\N	2025-09-03 20:00:50.75
fd87ef91-f556-44aa-b2f3-4517a30009e6	4	\N	My Market	9094	depository	savings	0.01	0.01	\N	\N	USD	scraper	\N	{"mask": "9094", "type": "depository", "subtype": "savings", "external_name": "My Market", "current_balance": 0.01, "available_balance": 0.01, "iso_currency_code": "USD", "external_account_id": "4"}	2025-06-23 20:58:46.96	2025-09-03 20:00:50.749	2025-09-03 18:00:56.377	Failed to log in to institution: page.waitForSelector: Timeout 30000ms exceeded.\nCall log:\n  - waiting for locator('input#password-callback-1') to be visible\n	f2b1c2d3-4e5f-6789-abcd-ef0123456789	test-afcu-id	\N	\N	2025-09-03 20:00:50.75
a75c699e-08e4-4211-8b47-7f12e34321f8	1	\N	Tax Reserve	9094	depository	savings	1.1	0.1	\N	\N	USD	scraper	\N	{"mask": "9094", "type": "depository", "subtype": "savings", "external_name": "Tax Reserve", "current_balance": 1.1, "available_balance": 0.1, "iso_currency_code": "USD", "external_account_id": "1"}	2025-06-23 20:58:46.919	2025-09-03 20:00:50.749	2025-09-03 18:00:56.377	Failed to log in to institution: page.waitForSelector: Timeout 30000ms exceeded.\nCall log:\n  - waiting for locator('input#password-callback-1') to be visible\n	f2b1c2d3-4e5f-6789-abcd-ef0123456789	test-afcu-id	gnB9xAw4A7Cm0DN9Qn4eI4b5MpXYZ4FqAdnp5	3JavPOrMObHLQ1npXew4Sko6R5pdk3izVk1dz	2025-09-03 20:00:50.75
\.


--
-- Data for Name: AccountPartition; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AccountPartition" (account_partition_id, name, current_balance, account_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: BalanceAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BalanceAdjustment" (balance_adjustment_id, date, amount, balance, account_id, account_partition_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Budget; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Budget" (budget_id, memo, recurrence_type, workspace_id, origin_account_id, target_account_partition_id, origin_account_partition_id, category_id, account_id, transaction_type, group_id, created_at, updated_at) FROM stdin;
f9e8d7c6-5b4a-3210-9876-543210fedcba	Groceries	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.39
fe89138d-43e6-4733-aa6e-77b4f76e8582	Arthur Life Insurance	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.365
d9e0f1a2-3456-abcd-ef01-234567890123	Gas Bill	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.377
a3c1d3e4-5f6a-7890-abcd-ef0123456789	Rachel Life Insurance	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.367
a20e1f2-4567-abcd-ef01-234567890123	Power Bill	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.379
98765432-1fed-cba9-8765-432109876543	Fuel	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.391
d3e4f5a6-7890-abcd-ef01-234567890123	Car Insurance	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	a9701bf6-4ad9-4ef2-8b3f-acddd562e6e6	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.368
b30e1f2-4567-abcd-ef01-234567890123	Internet	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.38
1a2b3c4d-5e6f-7890-abcd-ef0123456789	Arthur $	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.393
2b3c4d5e-6f78-90ab-cdef-0123456789ab	Rachel $	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.394
3c4d5e6f-7890-abcd-ef01-23456789abcd	Family Fun	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.397
c40e1f2-4567-abcd-ef01-234567890123	Preschool	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	fd4e361a-23b0-4492-9768-2e8235a7c5f6	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.383
e12f34a5-67b8-90cd-ef12-345678901234	Car Savings	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	4eb631c2-53c9-4715-b992-234fab39a67c	TRANSFER	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.385
d21e1f2-4567-abcd-ef01-23456789d213	Thanksgiving Point Membership	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:13:28.004	2025-09-03 20:00:42.398
4d5e6f78-90ab-cdef-0123-456789abcdef	Travel	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.407
f13a34a5-67b8-90cd-ef12-345678901335	Hannah-Claire Savings	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	4eb631c2-53c9-4715-b992-234fab39a67c	TRANSFER	\N	2025-09-03 05:51:09.245	2025-09-03 20:00:42.386
d4e5f6a7-8901-abcd-ef01-234567890123	Clozd Salary	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	881890d0-64d9-436b-a8d4-982b11276e68	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.37
7c13f6a7-8901-abcd-ef01-234567895f3b	Clozd Bonus	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	79a890d0-64d9-436b-a8d4-982b11272d56	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-28 19:54:17.862	2025-09-03 20:00:42.371
c5d6e7f8-9012-abcd-ef01-234567890123	Tithing	TRIGGER	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.372
d6e7f8a9-0123-abcd-ef01-234567890123	Fast Offering	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	e9f0b1d3-3e4a-4f5c-9b6e-7d8f0b1c2e5a	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.373
d7e8f9a0-1234-abcd-ef01-234567890123	Mortgage	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	98bd1be3-fcde-4fbe-af1b-7178315a25da	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.374
d8e9f0a1-2345-abcd-ef01-234567890123	HOA	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	b7ce7783-9da9-4698-95f9-7d615174216b	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.376
a14f34a5-67b8-90cd-ef12-34567890a144	August Savings	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	4eb631c2-53c9-4715-b992-234fab39a67c	TRANSFER	\N	2025-09-03 05:51:09.247	2025-09-03 20:00:42.387
42f56a78-90b1-2c3d-e4f5-678901234567	Emergency Savings	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	4eb631c2-53c9-4715-b992-234fab39a67c	TRANSFER	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.389
d50e1f2-4567-abcd-ef01-234567890123	Rachel Focus Babysitter	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	7d9334c5-7942-4adc-844b-dc17c6352aac	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-08-15 06:44:40.257	2025-09-03 20:00:42.384
3c4a4d5e-6f78-90ab-cdef-01234567a73f	Date Night	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.591	2025-09-03 20:00:42.396
c30e1f2-4567-abcd-ef01-234567890123	Costco Membership	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.595	2025-09-03 20:00:42.4
df151f2-4567-abcd-ef01-234567892856	Back2School	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	8c04591a-1ab8-4e08-9f01-83ae9d413ca0	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.597	2025-09-03 20:00:42.401
fe251f2-4567-abcd-ef01-234567890962	Hannah-Claire Party	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.598	2025-09-03 20:00:42.402
fe241f2-4567-abcd-ef01-234567882962	Hannah-Claire Gift	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	594b69f1-cef7-4f49-b275-174d00ecece0	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.599	2025-09-03 20:00:42.404
df251f2-4567-abcd-ef01-234567890973	August Party	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.601	2025-09-03 20:00:42.405
df361f2-4567-abcd-ef01-234567451973	August Gift	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	594b69f1-cef7-4f49-b275-174d00ecece0	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.602	2025-09-03 20:00:42.406
adeff2-4567-abcd-ef01-234567897935	Phone Bill	SCHEDULE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	8ce8b6b3-3308-4b84-9d12-ce386b829d75	9477913d-2f77-4483-99e8-894aed68e4a8	TRANSACTION	\N	2025-09-03 14:09:59.576	2025-09-03 20:00:42.381
\.


--
-- Data for Name: BudgetChildItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BudgetChildItem" (budget_child_item_id, budget_id, amount, date, date_order, authorized_date, iso_currency_code, memo, transaction_type, account_id, origin_account_id, target_account_partition_id, origin_account_partition_id, category_id, group_id, created_at, updated_at) FROM stdin;
5e6f7890-abcd-ef01-2345-6789abcdef01	4d5e6f78-90ab-cdef-0123-456789abcdef	-500	2025-06-15	\N	\N	\N	Round-trip flights to Montreal	TRANSACTION	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	\N	0fffae2e-9c68-432f-9ac2-c2dccbe1d13c	test-montreal-2025	2025-08-15 06:44:40.257	2025-09-03 20:00:42.409
6f7890ab-cdef-0123-4567-89abcdef0123	4d5e6f78-90ab-cdef-0123-456789abcdef	-1000	2025-06-16	\N	\N	\N	Airbnb	TRANSACTION	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	\N	c199d55c-6e60-4e6a-8b15-675d6909db7b	test-montreal-2025	2025-08-15 06:44:40.257	2025-09-03 20:00:42.41
7890abcd-ef01-2345-6789-abcdef012345	4d5e6f78-90ab-cdef-0123-456789abcdef	-500	2025-06-18	\N	\N	\N	Activities and Purchases	TRANSACTION	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	\N	\N	test-montreal-2025	2025-08-15 06:44:40.257	2025-09-03 20:00:42.41
\.


--
-- Data for Name: BudgetScheduleVariant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BudgetScheduleVariant" (budget_id, amount, schedule, window_interval, window_quantity, projection_interval, projection_quantity, schedule_variant_id, amount_type, trigger_filter, trigger_operand, trigger_operator, month_amounts, created_at, updated_at) FROM stdin;
c5d6e7f8-9012-abcd-ef01-234567890123	\N	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	651622f4-0481-48eb-831b-16434c504e28	triggered	[{"operand": "INCOME", "operator": "eq", "property": "Category.type"}]	-10	percent	\N	2025-08-15 06:44:40.258	2025-08-15 06:44:40.258
fe89138d-43e6-4733-aa6e-77b4f76e8582	-300	{"start": "2021-04-05", "frequency": "MONTHLY", "byDayOfMonth": [5]}	\N	\N	\N	\N	4e006438-dabc-4eb0-b930-deea591309de	fixed	\N	\N	\N	null	2025-09-03 20:00:42.366	2025-09-03 20:00:42.366
a3c1d3e4-5f6a-7890-abcd-ef0123456789	-70	{"start": "2021-04-05", "frequency": "MONTHLY", "byDayOfMonth": [5]}	\N	\N	\N	\N	64ffc5aa-2b3d-459d-9f9f-343a3f788845	fixed	\N	\N	\N	null	2025-09-03 20:00:42.368	2025-09-03 20:00:42.368
d3e4f5a6-7890-abcd-ef01-234567890123	-55	{"start": "2021-04-08", "frequency": "MONTHLY", "byDayOfMonth": [8]}	\N	\N	\N	\N	d3af2578-c883-4ccb-be50-8874b849d909	fixed	\N	\N	\N	null	2025-09-03 20:00:42.369	2025-09-03 20:00:42.369
d4e5f6a7-8901-abcd-ef01-234567890123	3593	{"start": "2021-04-08", "frequency": "MONTHLY", "byDayOfMonth": [14, 27]}	\N	\N	\N	\N	b97533ee-29a4-4cde-9bf0-f8601dedf397	fixed	\N	\N	\N	null	2025-09-03 20:00:42.37	2025-09-03 20:00:42.37
7c13f6a7-8901-abcd-ef01-234567895f3b	800	{"start": "2021-01-01", "interval": 3, "frequency": "MONTHLY", "byDayOfMonth": [27]}	\N	\N	\N	\N	0dc1903a-06c9-463a-a993-85dd478a773c	fixed	\N	\N	\N	null	2025-09-03 20:00:42.372	2025-09-03 20:00:42.372
d6e7f8a9-0123-abcd-ef01-234567890123	-100	{"start": "2022-05-07", "frequency": "MONTHLY", "byDayOfMonth": [7]}	\N	\N	\N	\N	7ff3dca5-0843-4f75-beb1-23fd72ed81ee	fixed	\N	\N	\N	null	2025-09-03 20:00:42.374	2025-09-03 20:00:42.374
d7e8f9a0-1234-abcd-ef01-234567890123	-2725	{"start": "2022-06-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	eab65c8d-1577-4e01-8deb-0239335766c8	fixed	\N	\N	\N	null	2025-09-03 20:00:42.375	2025-09-03 20:00:42.375
d8e9f0a1-2345-abcd-ef01-234567890123	-240	{"start": "2022-06-18", "frequency": "MONTHLY", "byDayOfMonth": [18]}	\N	\N	\N	\N	5e3045f4-f6a9-4161-81e9-7d2f24f996fe	fixed	\N	\N	\N	null	2025-09-03 20:00:42.377	2025-09-03 20:00:42.377
d9e0f1a2-3456-abcd-ef01-234567890123	-50	{"start": "2022-06-18", "frequency": "MONTHLY", "byDayOfMonth": [18]}	\N	\N	\N	\N	4698c532-ef25-4cd0-acfa-4d8388489374	fixed	\N	\N	\N	null	2025-09-03 20:00:42.378	2025-09-03 20:00:42.378
a20e1f2-4567-abcd-ef01-234567890123	\N	{"start": "2022-06-17", "frequency": "MONTHLY", "byDayOfMonth": [17]}	\N	\N	\N	\N	6592ed02-59aa-4804-b54f-c13e79dd9ce0	seasonal	\N	\N	\N	{"0": -56, "1": -42, "2": -40, "3": -37, "4": -45, "5": -74, "6": -100, "7": -86, "8": -107, "9": -46, "10": -49, "11": -54}	2025-09-03 20:00:42.379	2025-09-03 20:00:42.379
b30e1f2-4567-abcd-ef01-234567890123	-50	{"start": "2022-06-17", "frequency": "MONTHLY", "byDayOfMonth": [17]}	\N	\N	\N	\N	7ed2c63b-8b41-4d1a-983f-748d29d16d67	fixed	\N	\N	\N	null	2025-09-03 20:00:42.381	2025-09-03 20:00:42.381
adeff2-4567-abcd-ef01-234567897935	-50	{"start": "2022-06-17", "frequency": "MONTHLY", "byDayOfMonth": [17]}	\N	\N	\N	\N	523d4719-3896-4c77-acab-3137371865ef	fixed	\N	\N	\N	null	2025-09-03 20:00:42.382	2025-09-03 20:00:42.382
c40e1f2-4567-abcd-ef01-234567890123	-170	{"end": "2025-05-31", "start": "2024-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	cdf71f8f-3ee6-4827-8a46-907025885607	fixed	\N	\N	\N	null	2025-09-03 20:00:42.383	2025-09-03 20:00:42.383
d50e1f2-4567-abcd-ef01-234567890123	-60	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	b6c832c2-f161-4837-8461-d8f468b1e74d	fixed	\N	\N	\N	null	2025-09-03 20:00:42.384	2025-09-03 20:00:42.384
e12f34a5-67b8-90cd-ef12-345678901234	1000	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	9544b330-3607-4bc5-a56c-4efac932c659	fixed	\N	\N	\N	null	2025-09-03 20:00:42.386	2025-09-03 20:00:42.386
f13a34a5-67b8-90cd-ef12-345678901335	50	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	82f5d310-53ed-4a9d-ae64-67788308b767	fixed	\N	\N	\N	null	2025-09-03 20:00:42.387	2025-09-03 20:00:42.387
a14f34a5-67b8-90cd-ef12-34567890a144	50	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	13aa95a2-415e-4145-b14f-970d12cb0418	fixed	\N	\N	\N	null	2025-09-03 20:00:42.388	2025-09-03 20:00:42.388
42f56a78-90b1-2c3d-e4f5-678901234567	250	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	7ff9e40d-9fa4-408d-96a7-6ba320da9e03	fixed	\N	\N	\N	null	2025-09-03 20:00:42.389	2025-09-03 20:00:42.389
f9e8d7c6-5b4a-3210-9876-543210fedcba	-350	{"start": "2022-09-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	week	2	8f759ef6-2b0f-4101-be41-bf91c68b0a21	fixed	\N	\N	\N	null	2025-09-03 20:00:42.39	2025-09-03 20:00:42.39
98765432-1fed-cba9-8765-432109876543	-50	{"start": "2021-04-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	cf81dbb4-ac22-4c7c-8953-136dba0591da	fixed	\N	\N	\N	null	2025-09-03 20:00:42.392	2025-09-03 20:00:42.392
1a2b3c4d-5e6f-7890-abcd-ef0123456789	-50	{"start": "2021-04-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	0fe22394-4af2-41a4-b71b-6bedc6340e6a	fixed	\N	\N	\N	null	2025-09-03 20:00:42.393	2025-09-03 20:00:42.393
2b3c4d5e-6f78-90ab-cdef-0123456789ab	-50	{"start": "2021-04-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	3c7a3851-add8-49c1-814f-727c6c78e9c1	fixed	\N	\N	\N	null	2025-09-03 20:00:42.395	2025-09-03 20:00:42.395
3c4a4d5e-6f78-90ab-cdef-01234567a73f	-50	{"start": "2021-04-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	862e8480-af33-416e-ac4c-8c4cddbcb864	fixed	\N	\N	\N	null	2025-09-03 20:00:42.396	2025-09-03 20:00:42.396
3c4d5e6f-7890-abcd-ef01-23456789abcd	-50	{"start": "2021-04-01", "frequency": "MONTHLY", "byDayOfMonth": [1]}	\N	\N	\N	\N	83273cd3-8640-47ff-a9d0-010fb1ea1c8e	fixed	\N	\N	\N	null	2025-09-03 20:00:42.398	2025-09-03 20:00:42.398
d21e1f2-4567-abcd-ef01-23456789d213	-269	{"start": "2021-05-01", "frequency": "YEARLY"}	\N	\N	\N	\N	f025f8e8-98fb-4132-8b2a-e98066b9fe10	fixed	\N	\N	\N	null	2025-09-03 20:00:42.399	2025-09-03 20:00:42.399
c30e1f2-4567-abcd-ef01-234567890123	-69	{"start": "2021-01-01", "frequency": "YEARLY"}	\N	\N	\N	\N	b816d47e-16bb-4539-8066-53a4d02b4c10	fixed	\N	\N	\N	null	2025-09-03 20:00:42.4	2025-09-03 20:00:42.4
df151f2-4567-abcd-ef01-234567892856	-100	{"start": "2021-08-01", "frequency": "YEARLY"}	\N	\N	\N	\N	9ae9976a-cc3d-46d8-b349-87ef03b6f354	fixed	\N	\N	\N	null	2025-09-03 20:00:42.402	2025-09-03 20:00:42.402
fe251f2-4567-abcd-ef01-234567890962	-100	{"start": "2021-02-01", "frequency": "YEARLY"}	\N	\N	\N	\N	77a38c84-218a-41b4-b17f-3625184101eb	fixed	\N	\N	\N	null	2025-09-03 20:00:42.403	2025-09-03 20:00:42.403
fe241f2-4567-abcd-ef01-234567882962	-50	{"start": "2021-02-01", "frequency": "YEARLY"}	\N	\N	\N	\N	5ba69cef-f804-4305-a660-020dc77f21a7	fixed	\N	\N	\N	null	2025-09-03 20:00:42.404	2025-09-03 20:00:42.404
df251f2-4567-abcd-ef01-234567890973	-100	{"start": "2021-08-01", "frequency": "YEARLY"}	\N	\N	\N	\N	82cbea08-f426-4088-87df-60465e442bf2	fixed	\N	\N	\N	null	2025-09-03 20:00:42.405	2025-09-03 20:00:42.405
df361f2-4567-abcd-ef01-234567451973	-50	{"start": "2021-08-01", "frequency": "YEARLY"}	\N	\N	\N	\N	017ebdf5-8d8a-4e77-816b-b7b189f9cd5f	fixed	\N	\N	\N	null	2025-09-03 20:00:42.406	2025-09-03 20:00:42.406
4d5e6f78-90ab-cdef-0123-456789abcdef	-2000	{"start": "2022-01-01", "frequency": "YEARLY"}	\N	\N	month	3	fe0e27bf-a954-42c9-8f51-ab190e1e47b7	fixed	\N	\N	\N	null	2025-09-03 20:00:42.408	2025-09-03 20:00:42.408
\.


--
-- Data for Name: BudgetTriggerVariant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BudgetTriggerVariant" (budget_id, start, "end", trigger_filter, trigger_operator, trigger_operand, trigger_variant_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (category_id, name, type, workspace_id, icon, parent_category_id, color, created_at, updated_at) FROM stdin;
b812dac6-6a37-429e-a1c1-ede2c7f99b63	Lawn & Garden	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.313
98bd1be3-fcde-4fbe-af1b-7178315a25da	Mortgage & Rent	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.313
881890d0-64d9-436b-a8d4-982b11276e68	Paycheck	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.313
c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	Entertainment	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	smiley	\N	orange1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.272
f549c254-cd52-4668-bd24-b3f131eb1559	Banking	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	bank	\N	teal1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.272
79a890d0-64d9-436b-a8d4-982b11272d56	Bonus	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-28 19:53:33.266	2025-09-03 20:00:42.314
f26d6a29-64e9-443f-b2c3-81d2b9921142	Interest Earned	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.314
a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a	Financial	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	dollar-bills	\N	teal3	2025-08-15 06:44:40.259	2025-09-03 20:00:42.273
f3c1b0d2-4a5e-4b8c-9f6d-7c8e1b2f3a4c	Retirement Income	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	graduation-cap	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	navy1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.315
b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e	Food & Dining	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	utensils	\N	cherry1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.274
c1b2a2ca-c82b-4efd-9b0d-b2ff3f252303	Tax Refund	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.315
c3d4e5f6-a7b8-4c7d-ae2f-9a0b1c2d3e4f	Gifts & Celebrations	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	party-popper	\N	yellow3	2025-08-15 06:44:40.259	2025-09-03 20:00:42.274
c2d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d67	ATM Deposit	TRANSFER	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.315
ae4c5e34-27ca-4652-a422-ec7673d90cc7	Books	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.295
b3c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	ATM Withdrawal	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.296
d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	Cash Advance	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-25 15:32:53.008	2025-09-03 20:00:42.317
b0ef4648-5801-4745-8fd6-9c23c0d8c23a	Withdrawal	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.319
c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	Parties	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	party-popper	c3d4e5f6-a7b8-4c7d-ae2f-9a0b1c2d3e4f	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.305
b2d285a2-59a7-469d-9bbc-7d3e1095c193	Savings	TRANSFER	f2b1c2d3-4e5f-6789-abcd-ef0123456789	piggy-bank	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.329
c2c2d3e4-5678-9abc-def0-1234567890ab	Car Rental	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.331
d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	Church Donations	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	af34c2d3-4b5c-6d7e-8f9a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.306
bdc8aade-ea65-4e20-bb4a-7c40ebadc0a1	Gym	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.309
1233f9f8-b986-4934-a58c-edaf9a062a35	Home Insurance	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.311
c0f8b1d2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	Home Repairs & Maintenance	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.311
50dbd848-3862-4a58-a18b-cd366db603f0	Home Supplies	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.312
af34c2d3-4b5c-6d7e-8f9a-0b1c2d3e4f5a	Religion & Charity	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	church	\N	blush2	2025-08-15 06:44:40.259	2025-09-03 20:00:42.275
5461213e-ffd5-464b-b3c4-bc2f6fc957cb	Late Fee	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.299
e9f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4d	Gifted Money	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	give-heart	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.316
92d6b0df-8fcc-40a2-9591-cf03af9dc723	Parking	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	parking-sign	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.284
04a4d5e0-b664-463a-adf9-4c5cb23089b9	Shipping	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.291
15510c92-62d3-49bc-8bdf-0891c1097dcf	Movies & DVDs	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.295
a9701bf6-4ad9-4ef2-8b3f-acddd562e6e6	Auto Insurance	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.282
b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	Travel	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	compass	\N	orange3	2025-08-15 06:44:40.259	2025-09-03 20:00:42.281
c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	Utilities	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	ba16a566-cf88-4a3f-8b7c-877d3357d123	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.287
f1ac1ce7-b6b2-4fd1-abbc-0f624c7f7223	Internet	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	ba16a566-cf88-4a3f-8b7c-877d3357d123	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.286
9e1724be-d700-4296-a918-f578860c2f0e	Legal	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.289
e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	Shopping	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	shopping-cart	\N	magenta2	2025-08-15 06:44:40.259	2025-09-03 20:00:42.279
e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	Business Services	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	briefcase	\N	yellow1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.271
5d0b38c6-cd30-446b-824a-a5e1c137663a	ATM Fee	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.297
f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	Income	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	money-bag	\N	lime2	2025-08-15 06:44:40.259	2025-09-03 20:00:42.277
05c69d5a-4472-4dad-bbe7-35fa673afc17	Sports and Activities	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f3c1b0d2-4a5e-4b8c-9f6d-7c8e1b2f3a4c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.293
e5cbbf97-6ef6-46d6-be78-ecfe196fdd9c	Office Supplies	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.29
4acd8f6c-a108-41f7-bb74-44f342008f5e	Public Transportation	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.284
58198b08-ae3b-4a87-bc73-1504647e578e	Music	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.295
312482e9-9aa0-4710-a312-4a5dd308dedb	Amusement	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.294
ee167832-1262-4caf-bb78-4a6e987cd172	Arts	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.294
53ce18c1-8dc2-44a4-9ec7-cc355f59019a	Vehicle Purchase	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.282
d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	Health & Fitness	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	heartbeat	\N	apple1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.276
8adb79fa-2857-41a5-af14-73e6a3b471aa	Auto Payment	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.283
2734e341-e0c9-40c7-bad7-98db8e1e32f0	Television	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	ba16a566-cf88-4a3f-8b7c-877d3357d123	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.286
50c047e5-d08a-424f-b65b-b6cd66093584	Advertising	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.288
6e20d2ed-f8f0-4562-ae37-7881e6560a62	Banking Fee	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.297
b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	Kids	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	child	\N	peach2	2025-08-15 06:44:40.259	2025-09-03 20:00:42.278
c9d0e1f2-a3b4-4c3d-ae8f-5a6b7c8d9e0f	Personal Care	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	self-care	\N	lavender1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.279
57c39298-5057-4aed-b4ef-f6b6e0341a06	Printing	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.29
68a5922f-88cb-4f93-abac-194ab7c5193a	Service & Parts	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.285
40676754-e08b-4928-826f-a23961a2a042	Finance Charge	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.298
ab0bb7ab-0367-4d7a-adbb-30846f5ec897	Fuel	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	fuel	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.283
d0e1f2a3-b4c5-4d4e-bf9a-6b7c8d9e0f1a	Pets	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	paw	\N	chocolate1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.279
8ce8b6b3-3308-4b84-9d12-ce386b829d75	Phone Plan	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	ba16a566-cf88-4a3f-8b7c-877d3357d123	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.285
a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d	Investments	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	chart-line	\N	teal1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.278
bd4c5e34-27ca-4652-a422-ec7673d90cc7	Newspapers & Magazines	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.296
8c04591a-1ab8-4e08-9f01-83ae9d413ca0	Books & Supplies	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f3c1b0d2-4a5e-4b8c-9f6d-7c8e1b2f3a4c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.292
f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c	Taxes	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	gavel	\N	navy3	2025-08-15 06:44:40.259	2025-09-03 20:00:42.28
e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	Home	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	home	\N	forest1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.276
42e60fe3-a98c-4270-86ad-4803ae25de24	Software	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.287
fd4e361a-23b0-4492-9768-2e8235a7c5f6	Tuition	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f3c1b0d2-4a5e-4b8c-9f6d-7c8e1b2f3a4c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.293
7d2babb7-1065-4a7c-8552-67ba2f185f75	Transportation	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	commute	\N	sky3	2025-08-15 06:44:40.259	2025-09-03 20:00:42.27
a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	Transfer	TRANSFER	f2b1c2d3-4e5f-6789-abcd-ef0123456789	transfer	\N	sky1	2025-08-15 06:44:40.259	2025-09-03 20:00:42.28
ba16a566-cf88-4a3f-8b7c-877d3357d123	Bills & Utilities	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	lightbulb	\N	yellow3	2025-08-15 06:44:40.259	2025-09-03 20:00:42.27
4cc55ded-9014-4863-a0d6-4d084fea3ea6	Alcohol & Bars	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.302
c9188777-62fb-4411-b4a1-9ed1e5447212	Holiday	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	gift	c3d4e5f6-a7b8-4c7d-ae2f-9a0b1c2d3e4f	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.305
257d286a-6593-41ae-a5a5-55e961a47998	Reimbursement	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.316
d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4b	Religious Services	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	af34c2d3-4b5c-6d7e-8f9a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.306
b19e46a3-ce8f-4a96-b1d3-28cdd313fb85	Eyecare	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.309
33736d95-667c-4f8d-8434-487cb9caff3d	Pharmacy	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.31
ceb21839-7cc0-4534-986d-4ecaac759a46	Returned Purchase	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.317
11bda97c-7de0-4004-89fc-56191b2e1b3a	Sell	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.319
aea68813-cb83-472e-9ecd-387e2182ad37	Allowance	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.32
030d6853-7ef8-4aa2-b574-4f48a83a1e84	Kids Activities	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.321
aad5343d-75b9-481b-bbeb-4d45e445f120	Hair	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c9d0e1f2-a3b4-4c3d-ae8f-5a6b7c8d9e0f	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.322
b4e435b8-d774-407f-afeb-5d79e4288f5f	Service Fee	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.299
b6b62d72-1cbc-4087-b928-6163abcff64a	Trade Commissions	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.3
ef5e7110-72f7-4fb8-a650-7e3db4f406f6	Coffee Shops	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.303
d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4e	Service	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	give-heart	af34c2d3-4b5c-6d7e-8f9a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.307
db218c86-5d58-40c9-9695-f179a3d44f2d	Furnishings	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.31
f0ed5497-ce37-41ad-91a3-4fd9675ac609	Laundry	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c9d0e1f2-a3b4-4c3d-ae8f-5a6b7c8d9e0f	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.322
4bca50a9-190f-44eb-94d2-e02df52ca312	Fast Food	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	fast-food	b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.303
6f58cb2e-f20e-47c1-8584-078d419c4e30	Restaurants	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.304
c795f728-f94e-48d1-9cd2-77221bb50a1b	Dentist	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.308
48aa9eed-143a-44aa-9352-8dff4b3c2d68	Home Improvement	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.311
b7ce7783-9da9-4698-95f9-7d615174216b	Home Services	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.312
ee69d893-35b3-4a66-9d54-a4176797e5dc	Baby Supplies	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.32
7d9334c5-7942-4adc-844b-dc17c6352aac	Babysitter & Daycare	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.321
887e74ee-b201-47da-9f3c-378ade64559c	Child Support	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.321
69c87283-4a58-4aac-8cb3-c67d26e121a0	Financial Advisor	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.3
a4524662-e6f5-4bfe-9e4e-4fbec5814628	Doctor	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.308
53b6de9b-0761-42e0-b724-e5badf1a11fd	Buy	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.318
05c3c8b1-002f-424b-9ca0-556f5ddbb21b	Deposit	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.318
7f989aae-f1b3-408e-95fb-d7b90b88be5f	Life Insurance	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.301
3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	Treats and Sweets	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	ice-cream	b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.301
594b69f1-cef7-4f49-b275-174d00ecece0	Gift	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	gift	c3d4e5f6-a7b8-4c7d-ae2f-9a0b1c2d3e4f	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.304
a06575b1-b94f-4f08-91c7-27b58a1ef6ab	Dividend & Cap Gains	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.318
d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4d	Gifted Money	INCOME	f2b1c2d3-4e5f-6789-abcd-ef0123456789	give-heart	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	2025-08-15 06:44:40.259	2025-08-15 06:44:40.259
3a5d255c-4210-430c-9522-528edaf60c57	Hobbies	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.325
c28290c3-5900-46e8-8e79-10ca31cd0e42	Sporting Goods	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.326
62ce18c1-8dc2-44a4-9ec7-cc355f59018b	Vehicle Registration	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	7d2babb7-1065-4a7c-8552-67ba2f185f75	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.281
8c72592c-d453-46ac-9a2f-a9ea1570c1b9	Train	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.33
d4e5f6a7-8b9c-def0-1234-56789abcdef0	Taxi & Rideshare	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.331
4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	Credit Card Payment	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f549c254-cd52-4668-bd24-b3f131eb1559	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.298
e9f0b1d3-3e4a-4f5c-9b6e-7d8f0b1c2e5a	Charitable Donations	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	give-heart	af34c2d3-4b5c-6d7e-8f9a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.307
36deecac-e079-48ff-9b0d-b2ff3f252303	Health Insurance	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.309
253feafa-5ae0-4f9e-9b60-336e9949c580	Spa & Massage	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	c9d0e1f2-a3b4-4c3d-ae8f-5a6b7c8d9e0f	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.322
fae9177b-c986-4db7-b98f-feb71e266a9d	Pet Food & Supplies	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d0e1f2a3-b4c5-4d4e-bf9a-6b7c8d9e0f1a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.323
7ca8b829-b60d-4a99-8f7e-28f9760afc14	Toys	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.326
f1c2d3e4-5678-9abc-def0-1234567890ab	Souvenirs	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.326
cbae3766-7d64-49f6-92de-19ad1c576ba5	Federal Tax	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.327
e3970bf9-efae-496b-bd53-4f98a8c8163b	Local Tax	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.327
22090305-6510-4acd-8b2c-440a200ba311	Property Tax	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.328
b83703ff-3f6d-4565-bfbe-5c76ebf442d6	Pet Grooming	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d0e1f2a3-b4c5-4d4e-bf9a-6b7c8d9e0f1a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.323
ddee763e-dc14-4f77-ba75-105adadcba4b	Veterinary	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	d0e1f2a3-b4c5-4d4e-bf9a-6b7c8d9e0f1a	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.324
b1c2d3e4-5678-9abc-def0-1234567890ab	Car Rental	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	\N	2025-08-15 06:44:40.259	2025-08-15 06:44:40.259
93d35092-b4a7-424e-a86b-c3d4ff99e4e5	Groceries	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	grocery	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.324
2c65aa58-cba0-49c8-a813-56b8c5f8df50	Sales Tax	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.328
4d4b349f-f31c-4d81-b1cf-39476126fd0f	State Tax	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.328
58685d03-42d9-416e-ad98-ebd0d0072e40	Transfer for Spending	TRANSFER	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.329
b83f3fad-f06b-4052-b35b-01d261009c50	Clothing	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	shirt	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.324
5826e87d-17e4-4ade-84bc-8e2a2309792d	Mortgage Payment	TRANSFER	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.329
ddd1f2b7-f087-49fe-86dc-318fb574dd9f	Electronics & Software	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.325
c199d55c-6e60-4e6a-8b15-675d6909db7b	Lodging	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.33
0fffae2e-9c68-432f-9ac2-c2dccbe1d13c	Flights	EXPENSE	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e	\N	2025-08-15 06:44:40.259	2025-09-03 20:00:42.33
\.


--
-- Data for Name: CategoryDetectionMapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CategoryDetectionMapping" (workspace_id, detection_key, category_id) FROM stdin;
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	LOAN_PAYMENTS_CREDIT_CARD_PAYMENT	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7
f2b1c2d3-4e5f-6789-abcd-ef0123456789	ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS	312482e9-9aa0-4710-a312-4a5dd308dedb
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_DIVIDENDS	a06575b1-b94f-4f08-91c7-27b58a1ef6ab
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_INTEREST_EARNED	f26d6a29-64e9-443f-b2c3-81d2b9921142
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_RETIREMENT_PENSION	881890d0-64d9-436b-a8d4-982b11276e68
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_TAX_REFUND	c1b2a2ca-c82b-4efd-9b0d-b2ff3f252303
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_UNEMPLOYMENT	881890d0-64d9-436b-a8d4-982b11276e68
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_WAGES	881890d0-64d9-436b-a8d4-982b11276e68
f2b1c2d3-4e5f-6789-abcd-ef0123456789	INCOME_OTHER_INCOME	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_IN_CASH_ADVANCES_AND_LOANS	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_IN_DEPOSIT	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_PRIMARY_CARE	a4524662-e6f5-4bfe-9e4e-4fbec5814628
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_OUT_WITHDRAWAL	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_VETERINARY_SERVICES	ddee763e-dc14-4f77-ba75-105adadcba4b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_OUT_OTHER_TRANSFER_OUT	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	LOAN_PAYMENTS_CAR_PAYMENT	8adb79fa-2857-41a5-af14-73e6a3b471aa
f2b1c2d3-4e5f-6789-abcd-ef0123456789	LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7
f2b1c2d3-4e5f-6789-abcd-ef0123456789	LOAN_PAYMENTS_MORTGAGE_PAYMENT	5826e87d-17e4-4ade-84bc-8e2a2309792d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT	b2d285a2-59a7-469d-9bbc-7d3e1095c193
f2b1c2d3-4e5f-6789-abcd-ef0123456789	LOAN_PAYMENTS_OTHER_PAYMENT	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7
f2b1c2d3-4e5f-6789-abcd-ef0123456789	BANK_FEES_ATM_FEES	5d0b38c6-cd30-446b-824a-a5e1c137663a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	BANK_FEES_FOREIGN_TRANSACTION_FEES	b4e435b8-d774-407f-afeb-5d79e4288f5f
f2b1c2d3-4e5f-6789-abcd-ef0123456789	BANK_FEES_INSUFFICIENT_FUNDS	6e20d2ed-f8f0-4562-ae37-7881e6560a62
f2b1c2d3-4e5f-6789-abcd-ef0123456789	BANK_FEES_INTEREST_CHARGE	40676754-e08b-4928-826f-a23961a2a042
f2b1c2d3-4e5f-6789-abcd-ef0123456789	BANK_FEES_OVERDRAFT_FEES	6e20d2ed-f8f0-4562-ae37-7881e6560a62
f2b1c2d3-4e5f-6789-abcd-ef0123456789	BANK_FEES_OTHER_BANK_FEES	f549c254-cd52-4668-bd24-b3f131eb1559
f2b1c2d3-4e5f-6789-abcd-ef0123456789	ENTERTAINMENT_CASINOS_AND_GAMBLING	312482e9-9aa0-4710-a312-4a5dd308dedb
f2b1c2d3-4e5f-6789-abcd-ef0123456789	ENTERTAINMENT_MUSIC_AND_AUDIO	58198b08-ae3b-4a87-bc73-1504647e578e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	ENTERTAINMENT_TV_AND_MOVIES	15510c92-62d3-49bc-8bdf-0891c1097dcf
f2b1c2d3-4e5f-6789-abcd-ef0123456789	ENTERTAINMENT_VIDEO_GAMES	ddd1f2b7-f087-49fe-86dc-318fb574dd9f
f2b1c2d3-4e5f-6789-abcd-ef0123456789	ENTERTAINMENT_OTHER_ENTERTAINMENT	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR	4cc55ded-9014-4863-a0d6-4d084fea3ea6
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_COFFEE	ef5e7110-72f7-4fb8-a650-7e3db4f406f6
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_FAST_FOOD	4bca50a9-190f-44eb-94d2-e02df52ca312
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_GROCERIES	93d35092-b4a7-424e-a86b-c3d4ff99e4e5
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_RESTAURANT	6f58cb2e-f20e-47c1-8584-078d419c4e30
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_VENDING_MACHINES	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3
f2b1c2d3-4e5f-6789-abcd-ef0123456789	FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK	b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS	ae4c5e34-27ca-4652-a422-ec7673d90cc7
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES	b83f3fad-f06b-4052-b35b-01d261009c50
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_CONVENIENCE_STORES	93d35092-b4a7-424e-a86b-c3d4ff99e4e5
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_DEPARTMENT_STORES	b83f3fad-f06b-4052-b35b-01d261009c50
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_DISCOUNT_STORES	93d35092-b4a7-424e-a86b-c3d4ff99e4e5
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_ELECTRONICS	ddd1f2b7-f087-49fe-86dc-318fb574dd9f
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES	594b69f1-cef7-4f49-b275-174d00ecece0
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_IN_SAVINGS	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_OFFICE_SUPPLIES	e5cbbf97-6ef6-46d6-be78-ecfe196fdd9c
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_ONLINE_MARKETPLACES	ddd1f2b7-f087-49fe-86dc-318fb574dd9f
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_PET_SUPPLIES	fae9177b-c986-4db7-b98f-feb71e266a9d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_SPORTING_GOODS	c28290c3-5900-46e8-8e79-10ca31cd0e42
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_SUPERSTORES	93d35092-b4a7-424e-a86b-c3d4ff99e4e5
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_TOBACCO_AND_VAPE	4cc55ded-9014-4863-a0d6-4d084fea3ea6
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	HOME_IMPROVEMENT_FURNITURE	db218c86-5d58-40c9-9695-f179a3d44f2d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	HOME_IMPROVEMENT_HARDWARE	48aa9eed-143a-44aa-9352-8dff4b3c2d68
f2b1c2d3-4e5f-6789-abcd-ef0123456789	HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE	b7ce7783-9da9-4698-95f9-7d615174216b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	HOME_IMPROVEMENT_SECURITY	b7ce7783-9da9-4698-95f9-7d615174216b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT	48aa9eed-143a-44aa-9352-8dff4b3c2d68
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_DENTAL_CARE	c795f728-f94e-48d1-9cd2-77221bb50a1b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_EYE_CARE	b19e46a3-ce8f-4a96-b1d3-28cdd313fb85
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_NURSING_CARE	a4524662-e6f5-4bfe-9e4e-4fbec5814628
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_PHARMACIES_AND_SUPPLEMENTS	33736d95-667c-4f8d-8434-487cb9caff3d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_IN_ACCOUNT_TRANSFER	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_IN_OTHER_TRANSFER_IN	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_OUT_SAVINGS	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSFER_OUT_ACCOUNT_TRANSFER	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d
f2b1c2d3-4e5f-6789-abcd-ef0123456789	PERSONAL_CARE_HAIR_AND_BEAUTY	aad5343d-75b9-481b-bbeb-4d45e445f120
f2b1c2d3-4e5f-6789-abcd-ef0123456789	PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING	f0ed5497-ce37-41ad-91a3-4fd9675ac609
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_BIKES_AND_SCOOTERS	4acd8f6c-a108-41f7-bb74-44f342008f5e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_GAS	ab0bb7ab-0367-4d7a-adbb-30846f5ec897
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_OTHER_UTILITIES	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_PARKING	92d6b0df-8fcc-40a2-9591-cf03af9dc723
f2b1c2d3-4e5f-6789-abcd-ef0123456789	PERSONAL_CARE_OTHER_PERSONAL_CARE	c9d0e1f2-a3b4-4c3d-ae8f-5a6b7c8d9e0f
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING	69c87283-4a58-4aac-8cb3-c67d26e121a0
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_AUTOMOTIVE	68a5922f-88cb-4f93-abac-194ab7c5193a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_CHILDCARE	7d9334c5-7942-4adc-844b-dc17c6352aac
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_PUBLIC_TRANSIT	4acd8f6c-a108-41f7-bb74-44f342008f5e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_TAXIS_AND_RIDE_SHARES	4acd8f6c-a108-41f7-bb74-44f342008f5e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_TOLLS	92d6b0df-8fcc-40a2-9591-cf03af9dc723
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_CONSULTING_AND_LEGAL	9e1724be-d700-4296-a918-f578860c2f0e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_EDUCATION	fd4e361a-23b0-4492-9768-2e8235a7c5f6
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRANSPORTATION_OTHER_TRANSPORTATION	7d2babb7-1065-4a7c-8552-67ba2f185f75
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRAVEL_FLIGHTS	0fffae2e-9c68-432f-9ac2-c2dccbe1d13c
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_INSURANCE	36deecac-e079-48ff-9b0d-b2ff3f252303
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRAVEL_LODGING	c199d55c-6e60-4e6a-8b15-675d6909db7b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRAVEL_RENTAL_CARS	c2c2d3e4-5678-9abc-def0-1234567890ab
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_POSTAGE_AND_SHIPPING	04a4d5e0-b664-463a-adf9-4c5cb23089b9
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_STORAGE	b7ce7783-9da9-4698-95f9-7d615174216b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	TRAVEL_OTHER_TRAVEL	b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GENERAL_SERVICES_OTHER_GENERAL_SERVICES	b7ce7783-9da9-4698-95f9-7d615174216b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_GAS_AND_ELECTRICITY	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_INTERNET_AND_CABLE	f1ac1ce7-b6b2-4fd1-abbc-0f624c7f7223
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GOVERNMENT_AND_NON_PROFIT_DONATIONS	e9f0b1d3-3e4a-4f5c-9b6e-7d8f0b1c2e5a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES	62ce18c1-8dc2-44a4-9ec7-cc355f59018b
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT	cbae3766-7d64-49f6-92de-19ad1c576ba5
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_RENT	98bd1be3-fcde-4fbe-af1b-7178315a25da
f2b1c2d3-4e5f-6789-abcd-ef0123456789	GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT	e9f0b1d3-3e4a-4f5c-9b6e-7d8f0b1c2e5a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a
f2b1c2d3-4e5f-6789-abcd-ef0123456789	MEDICAL_OTHER_MEDICAL	a4524662-e6f5-4bfe-9e4e-4fbec5814628
f2b1c2d3-4e5f-6789-abcd-ef0123456789	PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS	bdc8aade-ea65-4e20-bb4a-7c40ebadc0a1
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_TELEPHONE	8ce8b6b3-3308-4b84-9d12-ce386b829d75
f2b1c2d3-4e5f-6789-abcd-ef0123456789	RENT_AND_UTILITIES_WATER	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a
\.


--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Group" (group_id, name, workspace_id, color, created_at, updated_at) FROM stdin;
test-montreal-2025	Montreal 2025	f2b1c2d3-4e5f-6789-abcd-ef0123456789	yellow2	2025-08-15 06:44:40.259	2025-09-03 20:00:42.498
test-wyoming-2025	Wyoming 2025	f2b1c2d3-4e5f-6789-abcd-ef0123456789	yellow2	2025-08-15 06:44:40.259	2025-09-03 20:00:42.5
\.


--
-- Data for Name: Institution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Institution" (institution_id, name, logo, plaid_institution_id, created_at, updated_at) FROM stdin;
test-afcu-id	America First Credit Union	https://www.abc4.com/wp-content/uploads/sites/4/2022/07/AFCU_Logo.jpg?resize=258	\N	2025-08-15 06:44:40.259	2025-08-15 06:44:40.259
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Merchant" (merchant_id, name, logo, plaid_merchant_id, created_at, updated_at, hostname, detection_key) FROM stdin;
1875dfd9-3487-44a4-be05-145b761a5906	Pacific Power	https://www.pacificpower.net/etc.clientlibs/pcorp/clientlibs/main/resources/img/apple-touch-icon.png	\N	2025-08-18 22:12:48.288	2025-08-18 22:12:48.288	www.pacificpower.net	RENT_AND_UTILITIES_GAS_AND_ELECTRICITY
dc463616-53ef-4b58-8a32-43e86c148ff4	Chevron	https://plaid-merchant-logos.plaid.com/chevron_195.png	54Bo6XYgmrd6o9r9ZjMrOj2k2RV3j2vDQyEyv	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	www.chevron.com	TRANSPORTATION_GAS
0dad559b-53a0-48c2-8910-045d59fd60bf	Little America Hotel	https://wyoming.littleamerica.com/wp-content/themes/little-america/assets/img/favicons/apple-touch-icon.png	\N	2025-08-18 23:00:01.934	2025-08-18 23:00:01.934	wyoming.littleamerica.com	\N
9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	AMAZON MKTPL	https://plaid-merchant-logos.plaid.com/amazon_44.png	2gOwmq9qK56K60oDm3eLrREV2B2mVadkRn8MW	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	\N
5cfa3fb0-16bd-4140-a0ee-a1029e53e44a	Home Depot	https://plaid-merchant-logos.plaid.com/home_depot_491.png	kVawvV6p0R25gKw3qbp4Kq7kEzDdY5RnjV7RK	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT
3af7197b-95bc-41ac-b900-6edd277f744e	State Farm	https://plaid-merchant-logos.plaid.com/state_farm_960.png	8B5dWMaXnbZQOa82WQ1XMJo1kWKmDJy73ogLK	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	www.statefarm.com	\N
f01f8a23-85d1-43ba-a6e9-30208d1a48dd	MAVERIK	https://plaid-merchant-logos.plaid.com/maverik_616.png	61zgLDvXnKbD5bDY2gKn2gqYvOQkX6krDkWKD	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	www.maverik.com	TRANSPORTATION_GAS
7d811758-d002-4108-89cc-62b4b8516db5	Winco Foods	https://plaid-merchant-logos.plaid.com/winco_foods_1124.png	g57XDMV3K94M3X6Y9a7z5kL2wXqDrZwdW1dM5	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	careers.wincofoods.com	FOOD_AND_DRINK_GROCERIES
23ff673d-8053-4d97-bd23-f0a3b1af57c4	Dollar Tree	https://corporate.dollartree.com/_assets/_ae3de0e8598279dcfe03269b92ba4ace/dollartreeinfo/files/theme/images/favicons/apple-touch-icon.png	\N	2025-08-18 22:03:10.654	2025-08-18 22:03:10.654	corporate.dollartree.com	\N
af8bb24b-5ae8-4f16-a834-246d7cfd31a4	The Church of Jesus Chris of Latter-Day Saints	https://www.churchofjesuschrist.org/services/platform/v4/resources/static/image/favicon.ico		2025-08-18 21:41:00.066	2025-08-18 21:41:00.066	www.churchofjesuschrist.org	\N
364333e5-8d24-49ea-a544-b3d866aa6ada	HYATT PLACE	https://plaid-merchant-logos.plaid.com/hyatt_resorts_508.png	WJwJ8VwL0897q5g0y1zoZM99b82nELw2Ad7Ra	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	TRAVEL_LODGING
a4118033-64da-4395-9924-cb5dd7460633	Los Hermanos	https://media-cdn.getbento.com/accounts/992ddcc250fa930f6b3605cbfcb475df/media/images/38163favicon.png	\N	2025-08-18 22:42:10.489	2025-08-18 22:42:10.489	www.loshermanosutah.com	FOOD_AND_DRINK_RESTAURANT
8dbf6573-0bc2-4f8b-8842-c811452c2596	Direct Communications	https://directcom.com/wp-content/uploads/2025/03/cropped-Direct-Communications-Favicon-180x180.png	\N	2025-08-18 22:57:00.257	2025-08-18 22:57:00.257	directcom.com	RENT_AND_UTILITIES_INTERNET_AND_CABLE
498fd7dc-5d3f-4d0c-9913-71f14fbed33b	Papa Murphy's	https://plaid-merchant-logos.plaid.com/papa_murphys_717.png	wYmDnj8WV98oNVmkaK4goXoqoJ4bnJoXzqBz4	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	\N
1dceec67-003e-428a-b077-92797423bc79	HOLIDAY OIL	https://plaid-merchant-logos.plaid.com/holiday_oil_488.png	vmXk4kNYoQn4qONJ6NgKjWbgd1424mJM0QW4Y	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	TRANSPORTATION_GAS
5faa92f0-205c-4250-a40a-25b2ae248e97	Cabela’s	https://stores.cabelas.com/assets/static/favicon-cabelas-CYc-89R-.ico	\N	2025-08-18 22:47:07.747	2025-08-18 22:47:07.747	stores.cabelas.com	\N
dec45eae-1d76-405e-be2f-710e55bc2215	Ridley's	https://plaid-merchant-logos.plaid.com/ridleys_family_markets_2486.png	AwEn3gkwdnRqEAjpqMdj25wLqM3dJjyAvknm7	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	\N
75790fa2-060c-457a-859b-eaa387d3f648	Transamerica	https://plaid-merchant-logos.plaid.com/transamerica_1043.png	raveAXr3NdZd92nqyKpkpmbpNWV0nkyVXqmDR	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	\N
01379a33-d815-47f1-be5e-4ada7dcb0455	CAFE RIO	\N	\N	2025-08-18 22:52:41.421	2025-08-18 22:52:41.421	www.caferio.com	\N
d1a7ff54-1234-450b-b7c8-cb02828a7efe	Wendy's	https://plaid-merchant-logos.plaid.com/wendys_1114.png	1YZ03w08myRAQ0mRgMvD2EBoOb92RmBXN6nmK	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	FOOD_AND_DRINK_FAST_FOOD
c0f7e68b-9680-46ab-adfb-fc68c154510a	Domino's	https://plaid-merchant-logos.plaid.com/dominos_292.png	a4r8Wog9LbWrwqWpXZeJZr9b8rRbgavga0dkM	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	FOOD_AND_DRINK_FAST_FOOD
211815cf-6651-4b6e-af94-9821afd1a672	Costco	https://plaid-merchant-logos.plaid.com/costco_235.png	pBowAoZJMM9DKR37jvNmzM4yWBBXyMzV2rM3A	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	www.costco.com	\N
898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	Wal-Mart	https://plaid-merchant-logos.plaid.com/walmart_1100.png	O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	\N
c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	SMITH'S FOOD	https://plaid-merchant-logos.plaid.com/smiths_917.png	VJMjzL8D214p3z76Zr411N4goOLmr4MmQV1Z5	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	www.smithfoods.com	\N
27a45ff7-2c93-428c-824b-e9ac869532be	Eagle Mountain City	https://eaglemountain.gov/nitropack_static/DhTTWweZTQydmgChuSZOujUcPnaCqjQK/assets/images/optimized/rev-5f3e12d/eaglemountain.gov/wp-content/uploads/2024/10/favicon.png	\N	2025-08-19 13:49:19.125	2025-08-19 13:49:19.125	eaglemountaincity.com	\N
4cfef107-cd65-4a0c-918e-34e6e1f4f6a8	Chick-fil-A	https://www.chick-fil-a.com/Assets/Theming/apple-touch-icon.png	\N	2025-08-18 22:30:34.668	2025-08-18 22:30:34.668	www.chick-fil-a.com	FOOD_AND_DRINK_FAST_FOOD
2ff6f7d5-876a-4e2b-a62b-8020dfd5e259	Peach And Bee Honey	https://peachandbeehoney.com/cdn/shop/files/Untitled_design_-_2024-04-22T115823.677_32x32.png?v=1713808716	\N	2025-08-19 11:43:27.56	2025-08-19 11:43:27.56	peachandbeehoney.com	FOOD_AND_DRINK_GROCERIES
0e98e918-9fb7-4e76-b8d4-2be328938bce	Olive Garden	https://plaid-merchant-logos.plaid.com/olive_garden_699.png	jBdgR49b48OQQo7gL171XNdOd73zwBbJXeO3A	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	olivegarden-menu.com	FOOD_AND_DRINK_RESTAURANT
b1ce77d0-b6fd-4034-a3b3-25092395612d	Subway	https://www.subway.com/Assets/RemoteOrder/img/favicons/android-chrome-192x192.png	\N	2025-08-18 23:01:05.5	2025-08-18 23:01:05.5	www.subway.com	FOOD_AND_DRINK_FAST_FOOD
04fe2780-aac4-47b3-84dc-1638a365a176	Dominion Energy	https://plaid-merchant-logos.plaid.com/dominion_energy_291.png	rbzJ96M24rV4KpYK7kYNB3WD7ARNvk6NzqXNr	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26	\N	RENT_AND_UTILITIES_GAS_AND_ELECTRICITY
32791291-30d5-4bcf-81b3-318f3fa5865c	Jiffy Lube	https://jiffylube-assets1.imgix.net/favicons/apple-touch-icon-180x180.png	\N	2025-08-21 16:34:03.314	2025-08-21 16:34:03.314	www.jiffylube.com	\N
5210ccac-6041-4a06-9f8e-fe36c9779562	Shell Locations	https://find.shell.com/fuel/assets/apple-touch-icon-eb2f768da4e4425deabed06e152c7c0f70cf096b44ef04ff1992b9e4b851921c.png	\N	2025-08-18 22:54:04.535	2025-08-18 22:54:04.535	find.shell.com	TRANSPORTATION_GAS
f4b5be3d-a85e-4be3-8f8e-f4f0e5fc527d	Pilot Flying J	https://locations.pilotflyingj.com/permanent-b0b701/assets/images/pilotflyingjFavicon.bca99e3d.ico	\N	2025-08-18 22:44:24.532	2025-08-18 22:44:24.532	locations.pilotflyingj.com	TRANSPORTATION_GAS
49eec762-1ec7-4e31-93da-473e7071c166	Venmo	https://venmo.com/favicon.ico	\N	2025-08-21 17:37:07.596	2025-08-21 17:37:07.596	venmo.com	\N
bc3b2e2e-9993-4ba8-aaf1-52a71d83fbed	Deseret Book	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAlL0lEQVR42ux9CXRUx5luqVsLQmKTutUSQita2FehBS0QG2LjDRs7sWNPHHs8M46TkxnnvLxk5uSNk5xMXuyZN0lmMl4mnjiZeLfBEBm8gB8BCUlISGIzmEVYu4RaQkLs2t/3Xfr6gSKE+nbfe7ul+s+p092Cvvd21ff9W1X9JYQUKRNYAmQXeEcWL1kydd68eUk9PT0L8DEezY6WgjYFzYqW7vrbWOUC2gm0brSLaDVo7Wj1wSEhp4599lnjgf37W2TPSwIYKkuXLbOkpaUl9/b2FuBjNtpstEUBAQEzhvVngBf6emiUz0OQLrwedpFjf3Bw8P6TJ09+Wl1VdUGOlCSAV2R5RsbklJSULAD+S/h4K4C+GK+TXH0X4AP9ODTs9RKIcQyv5UFBQTtPnTpVXFVZ2S5HUhJgTLIiM1MkJSUt6uvruwcf19G7AeivBbw/9NmQ2ih4PYJWCEJ8XFdbW1JRUSEHWhLgetAnJiZmA/T3A+wPokXjzxZXGw99RBIMsoEPnWjbQIaN9fX1f6ooL78iCTABJSsrS8QlJOT0XwX9Q2hRLsBbJ8DPV8nQhbY5MCjod40NDXvL9+6VBBjvkp2TMy02NvbxwcHBJwD6VPwpcIKA/kYywAYitFgslheam5vf3FtW1iQJMN6An529JHbWrP8J4N8B4Ie5gC9dwOvdpH4QoRd9tDMwMPCnIMM+kEESwF8lZ+VKMXPmzHv6+/ufhnbLdAWzVon1MblIfSDDYfTbT1tbWwtLS0okAfxFVubmiujo6HswgP8LoF+EPwW5/Hsp7luFHvRjDfrxN6dPn/4PEGFIEsCHge9wOJi+/KEL+CHSzfEaEWgRGvH6TFtb2xvjxSIEjCPw3wF35yfwXxdI4OtKhF66Rnj9mdPp3FKyZ48kgJmSm5c32263/x9o/LVoodLVMSxG6EF8UIn44DsgwUFJAOOBLwD8/w3QP4GBiIRWksGtCURAv59B+0NHR8eP9hQXX5QEMEDy8vPvQJD7S3R8IlqwxKHJIAoIYOq0CWPxDIjwOoggCaCT1o+y2WzPQ+Pfhk6fIqHnc0TgKtSPnW1t3y4uLm6TBPCy1nc4HL/E22RomkAJN58VTqY1DAwMPNPV2fl6sY9bA58nQH5+/uQZERH/ZrVa73etuZfiP9bgQ6fT+WhxUZHPLrjz6cARWn8ptP4bAP8d+BguYeVXwtgsPTw8/IHIyMjDDRBpAcaq9QsKxPRp074VGBT0A2iSWUKmNv1a4BK19vf1/bq7u/vnRUVF0gKMJgUAf1RU1EvWwMC/w0eHkBNa48EdmhIYGJgTFha21G6zbauvr++TBBjZ37dFORyF0Bjr8TFMQmdcCddjpYWFhxfYbLbihvr6LkmA692eJQD/ZoA/09VZUsaf0JWNR1xwm91u/xSWoF4SgG7PqlWPwO35T4A/Xfr7498jQrPBHVoDElwBByonNAGg+b8J8P8M4I+T/v6EkqmhoaGZycnJQTEzZxabZQxMAxy0voAW+PtJkyZ917UfV8rEDJBZ+OvN9vb2p4p2754YFoDgh/l7MSgo6Cl8jJQwmNDCXXrzoAzjouz2bUZbAqtJ4H8BLs83xNWygVKkBKkksBtMAkMJkH81x/88wP8YPk6W4y5lJBLYbLZtDQaRwDACUPMD/C+6NL8Ev5QbkiA8PNwwS2BYynHy5Mn09x+S4JdyM6hAST7KGHHV6tXjgwBwfZ4KDQ19Bj9suhxfKWMhAZUllOa3/N4FAvjXw/X5Od7OlOMqxQ2ZFBQUlGGz2y8jHtjnlwQA+JcC/C9z66IcTykaBOFA+EK7zVat17IJq47gDwH4twL88+Q4SvFApoWFh2cjJvgYHOj0CwIweMEDE/x5cvykeEG4dmgJMPWut5dS6xIET5ky5T/wcqscNyneEijTHBDgV0yn+zQB4Po8HBwc/AgeWC5pluJNIZ6+OnXq1L/3WRcI4E9xOByvAPwxcryk6CAhVqt1gT0qqgquUJ1PEUCZ6XU4Ng4NDi6T4yRFRwlHUJwJd+i/vREPeM0Fmj5t2rNw1HLl+EgxIB6YC7z9wmcsQH5+fkH41Kmc7Joqh0eKARIQYLXOtttsTQ0NDYdNJQDAPyUqOvo90DJJjosUwxggxKTw8PAlNpvtnYb6es0Hg3vsAs2IiPhHOdklxSRXKDkiIuLXplmAvPz81WDhzwJk1TYppvlCAQmwAqw8d0KjJdEMfuGIji4ZGhxcKYdBiqkksFiOt50+PUdLWXbNVZYjIyP/BuBf7mWTJgYGBpRXKYZrUhEY6J9Ft4HDNOCRSZh/MMQC5OXlxdqjokrRafHe/CFWq1VMnTpVWDkQkgSGgv/y5cuiublZ9Pf3K585FhaLRSEF3/OVn304HmiH5MEKuOUKaaJ8pM32P1xFa70m1Pzw5cS3v/1tMWPGDEkAgwnA/r9y5YoYHBxUSNDe0SHanU7R2NQkmtAaGhtFZ2enCA0NFcHBwQohfMlS4zfYbHb7P+PtvboSIDcvbzk0wSPCy+uI2JlBQUEiPi5OTJ8uN475gEYVPT094tKlS4p1OH/+vKgHCT799FNRUV4u2trauOhRIYPPcECItbm5uXeVlJRsHbPX4e5dMjIyXgbblnr76al56P6sKijg/mGJQB+JCajxOS60zslJSWLe3LkiJydHpKSmirNdXaIJbhOFyssHnjkIz5o6IyLi5cYxHkfglgVYmZvLdT4FEh4TUxgD0D1lS0xMFMuWLhUnT54U27ZtExX79jExYnqcAEW6MCoqioelF3rdAmSsWPGfYNkCoUNJRVqAadOmiTVr1ohJkyZJtPkBGWgZSIT58+eL6JgYcezYMXHx4kWz3SJiOjWSVqCx0XsEoPYPDw//MQgQohNzuQFULFm8WOlc1fdkY6dKt8h3XSUSIQ0uUVpammg7fVqc+vxzxXUy75ECbMDS4c8+++z4Tf/zWK9634YNhbjwXUKngroMuqg5oqOj/ywfrf4bTJtYc+utYuHChR7fj8Taf+CAaG5qEmfPnlWyHr29vcqAXivMiMTGxiqDHArLBP9SCdSTk5O98rtbAZg/btkiampqRBgUgBXk1zO3ovalDe4K+3r27NkiPj5eCWi9IZ8D/O+99574ePt2pc9MDOIrEaivKC0p8ZwAOStXrkBn7QQ4wnV+aAVwI6XXaCE4cMwQPf7YYyIbgViwxsALmkG8t3mzOHXqlJLpIPDVFOBI9w0LC1OCPObDQ0JClM9sCQkJYin8YPrCWoPASyAiCx5s3bpVbAdoeD9qTz1TjLSw/B2TcZ8pJDZeY0CGFZmZIguN/+aJdECZFBYWijfefJPL5IVJydI+4PWBTRs3FnrsAmVmZv4IF8sSOpdTVydgRmqqVaC2pm+XnZWluEzuirO9Xbz66qti7969ihVQZ555/ZEaga0Ss6+vT3HNurq6RGtrq+DBh/R7eRYu31OjTnVTk/L6dptNLIAfnQxtzJy70+lUtOeNnsnTxv7kb7oC8nd3d4t29An7lAFtZWWlOHf+vJg7Z47mcaS7SgtJxVJZXS3CzHFfLRhbx/Fjx/7gEQFycnJ4pM0v9Nb+YyUIAXO6rU3RunRNhrssNxMCduef/iQuXLigWBR+/2bXUP8PG7UnAaQSg/lx5sRJgAN0qZqblYDQXSIw8E9CQDl37lyFYCdOnFD+5u7vc6cv1d9CUvAzYy327Sm4Y3TJ6O5F2e2ars9nj4Nr1dLSIljo1lOrojEWsM+YPv0TKJUWzQTIys7+K3F1ds1nTm+h2zIPGpP+KwfQHamoqBAHDx1SNL+n4FJBpJKBpr8eRNi/f79iqdIRFLqzvobXYypx/rx5yvORrLy+EalF9bcEoj/Zv5wBroGLOAnATUrSttVjCiz0zJkzRVVVlWJtjU6R4jcFToMlPXr06FZNBOCEBwKz13Gh6b5EAIKD7sY8AMVdzUItfRQxgDcIMBxA6vIAEoHB4Am4FNBAyrO6I3Tt5sAF6YELwXjFKBJcGyPw93DpA39HOKyZVhKQ0HTndhcVmWIFBoeG4jEGr8AKXHabANnZ2avx8rfCxw6uoz/OTAwDUHfnDI4cOSKOHz/+xaIvvdw0Xp/u0GfQ4iF4Rlord10IphbNIoEaj507d050wiXjDDDnabRcJwKuFF0quoruWmwv/I7JeO4aWIHqEcl+E6B9X/io6OUbe0vUOIE+8CuvvCI2bdqkWB13hIB7+GtfE3fddZfy3ZGyVHoLrVotrMDmLVs0X4MWYP369YprZZLCvGGVacsovn9EgMVSIOSxpR6RlGafAfebb72l5Mep0d0RphEfevBBkZWVpVzHaOLT6jD7dfjwYWUhnFZlkJ6ersQ2vJYJwfAC4HmuWwSIj4/fgC+GShh7LnRnGARuAgFKbjIxM5LQhfj6X/yFWL58uRJcG00CWjLGNds++EDzNRiM3nLLLcp8iwkMsMbFxX3dLQKAqV+X0PWOMDAmCajB34IloDZ1Vzjpdv+GDQIDaTiISDjGNEz1qqs/tZCIM/i0iCbsIwiAC/koreiYCJCZlRWBH71cuj/eFQ4+J7refucdMZaFWsNl8eLF4o5165RYwGgQ0Y3hPAGTCJqtANy5lJQUhUwmuEGxCYmJK8dEAGib+6T7ox8JqvfvFyWlpW5/lxN3a9euVZaBGO0KMRbgpN+JY8c8ItHMmBhTgnnIALyaB8ZEAOn+6AskAnfHJ5+IQ4cOuf19roW6DSTgBFOvmwG1p24QszhOxAKexEKpqalmWAAV6+tuSoAVmZmTpfujc1AMK8AdSwyIGRxrcYUYUHJdktGxAO/JWEarBaAbZNJeYrpBs4HvBaMSICkp6UucPJAw1ZkE0IblFRWafGp+NzMzU1k7ZLQVUDfPa00GuDsX4mUJBL5vH5UAcH9ul/DUX9RJMubWtWjE1NmzWaBAWU5ttBXw9UnI0QT4Xn2zGIBHGwVIiBqgjgIDxaewAFxv43YwDSvAeYHZyclmTC75q9ANys3IyAgYkQDLMzLs9JMkAYxzg7jiU+sMa2pKisgACZid8Ret7APFtabPTklZNCIBUlJSeKpjoISmce4E/WlaAObYtRCIy8K54tKozArdNa1pTH7vAn6nyWQdQtx064gEwD/cImFpvBXgHoIGjedA0wpwhtWI2WF155zWvb501Vqamw1fETqCfOlGMUC2kOlPw4Nh7k2u0RAHUFiwipU0jIgDqMHVfdFaCcCdbiYTgOYn988IsHTZMitM0xwJSeN9YubWWZ1CS4qQYGJtnpiYGF3dIHU9EyfgtAr3FZysqTG9CjVwPmPZsmVJ1xEgLS2Nf5AHXZggXOLA8ijcnK5FCH7ujtNzvb1aHUPrzjBqfwb8dNV8IGAfTEtPz7uOAPD/eQS3LMlsglAjEvzcMaVFGASzbucVHQlAC8AyKskaCUDg79ixw8yCWdcZAeB99vAYYJGEojlCN4bgpxXQ+n26JixHotcyA7pnrBLh7tZO1XocOXpUsQC+UETXJXOGEyBWQtE8ArA+z5kzZzRfg8EwK7zpEQyTVKzwwB1dWjQ4f9vGTZt8IftzbSCcMZwAC4WcADMzMBPnABStgazdblfWBulBAK434q60L69d6772h+XYtXu3OHrkiBlVIUaThOEESJQwNDkO6OhQimJpEZYsZ6Ewb2eC6L4QuAsWLhRRDofb32cJmk0bN/qS6/NFly9evDhFIQDf8HABCUPzRE2HclmDVgJRS49U4NcToUVhfLH+nnvc/i7LR/7u978XHZ2dvkiAoXnz58cqBOAbITNAphOANXjYtEokCODNZRG9AD+rRhP87ub/GdS/+NJLrMqm1Ab1xZM/e3p6Ui2uNzESguYTgBtNPCEA8/QMhr2x5r4f12DQunr1aqW5C/7nX3hBlJeX+/q5DvFqDJAiA2DzhZrbE+1NsHHLpKd7bvkMvEZ+Xp7YcN99bs3cMt1JzU/wa6nebbCEq79Mgt9kUVOh3OzuCQG4UM0TAnCLJs9dWHf77eK+e+9VsktjFZaJf+vtt6/WE/V98BPzqSoBpkkImjwarv22WpZFX0sATla56wIpZwVcuSIGQJzEhARx+223KXuOx1oLlM/Mg/J4KgzLvvgB+FWZphIgTULQN+IATyaLuFiNG+4vgkijuS0kG60EicLGNOec9HQl1ZmRkSEWuXEE1V64Op988omorq5WMlAMmof855DzXmkBfEw88t8BbEd0tHJ4CAPi0TQ+rQUzRnR3YmfNUvYVsGjVWHZs0VU7cPCgUrWaJ8rU1tYqrpdJVd88kRkqAQYk9HwnDmDuXUvenFp/ZXa2mAttPhqQCVIuaeC8AUE7lnkD1gbleQfNroMzmN7kUU5cycpJOD8DviqpcvujD8YBdCW0EMDiOmGGzVvC56GmZ/mW4j17lGJeVhCNa4PocqmHgvipTJEE8ME4wJc2uCsHfkDL0z1iRqigoEB0njmjFMllWRcu41ZPnTR7o4sWkQSQMqrQVRoeFCs72AB+EqAVjQdjc6sjlz6QBHoe7icJIMV0YQDNoJmNwmXcx44fF3UIhhkcs8wLCeAPRJAEGGfCZQj014NHW3oMnz0Abkt4WJgyc0ygRkVFaQYrY47clSuVlpmVJaoqK8W+qipxzHW2mS9nhyQBxpnwMLp//cUvlAzPjfE/pACTE1Y8xTIUGp2HddPHnxUXJ9LS08V0jaVPVMvAqnVFxcWiBIEz44Upbp6bLAkgRZPwaFMuqBtLQMq9B3V1dQohmHolKWbNmiXS58xRypivyMgQcfisiQj4PhvPSi4sLBSHDh8edW5CEkCKIp6c/kIQs/SImp50V9Qzjpt27BDFRUWKK5MDtyY/N1fTEamUvLw8ZaPO62+8IYpwTR+zBO2Bkgi+I+oMLSeXtJLHk6XQ6hnHbHwWzvLyPLOTCHB5Ms2CBQs0XZelVL755JPKNXkmAl0vH4kJjqvTha0SfuYLwUtNq3X3FF0Yb+XiSQYCldfcDovw/IsvilINxzqpwn0KT33zm4pbxdluH8kO9aoEOC7h5xviSfVkrsrsQgzgzQrMXJ5Bq8TapVznTzfGExI88cQTIjk52ZTjUkeQEFkH1MdcIE8Ww6kE0KP8COOKrrNnxSu/+52y8lOrsIzjXz7++BdulslSqxKgTcLPfCFwPdHe1KrnLlzQrQZ/CGITZo7efvttzVXsKEyRrlmzRtkCaqIrNHRtDHBSyE3xpgo1P5cUc2JKq9C3JjD1LEBFcrGa9eYtWzRfg3HK3Xfd5bX9yx5Ij0KAkJCQDglB8wlAX9uTXDmL43IOQG8C9PT2ioqKCnH8uPbQkQV9ue3yssFnnA2TUwoBjh45UiPkuQCm+//UjJ5kcbgmhwTQ262g/869y+9v3erRNXJzc02NBaD46xTQHzx48Bwe4pyEobkWgJNEWk9fYWVoFtfVOofgjpBgnHQ7efKkaGnVnkHn+iOeeWzSwdkBR48ePXWt1q+VMDSXANOnTVN2V2mRswhO6f8btSaf92EQ60lalIvkcnJyDD3r+BrpOHjgQPe1BDgoA2GTLUB4uOYlB8zONDc3G0YAxgJMu36u8Wgn1Q3ieiFhvAvEG9aIYX7/PglD84RuQDhcIObbNamz9nblsD0ja3DymbkjzJOK1LbISBGB5mkxLw1Sdx0B4Ds2SwtgXgBM4EbHxGgCMGt41jc2isuXLhmaV2e2qefKFWVFqeZrwGJxZtiEdGjRdQQ4ceLEASEzQaYIB59r8ZkX16T9OzqUfQBarYcnwTD9d1aH0BxLgETRDofhFgAK/8B1BNhfXV0LTdQl4WgOASJclZ21CN0QTk4ZkQEaToA+uEGeFPRVA2qDpQ8K/4gYQePvkW6Q8UIf2gEtODMmRhN5WJiKG9SNBpJ60j13fHnqAhrscjZVV1WdG4kApZIA5sQAPN9LyzII7gDjHmCzDqAgCfysHMqQC+fizwgAE1ohZKVoQ4WZFPr+3DWlKZXR0KAQwMzzt/ytMBZwvmtEApyqqSEBLkpYGicMIll0intn3RW6H4cPHVLy/2ZZALXqg6dWxEijBZz/3xEJUFlZeQFsPiTdIGMDYJ69G6PB/2f6kYvSuHzCDC3Me3KJtDtnCIwkgwamQPHM7cB53YgEcMmHfCYJTWOCX7o+c+bM0eQ6KcWoQAKztL86f2HzoBYpzyQ409Wl2x6G4VxDe/86Czb8f+AHFeLFKuGpv9CFWbZsmVv1+FVh1ofrcMysJaoQABZgtBpEYyEyl1UbdIh2APC9dVQC1NbWHsYPa5BukP7BL9f9aDl9nev+y/buVYJfLSe3e02dQnsHeeACkUDtTqdCZoMswCXgu2RUAuyrqMBzDW2WBNBXCOLsrCyxZMkSt797/MQJsWPHDlPP3lX3L3AWV+smHvYBT5gxiMSDeOYq4Ns5KgFcbtB2IdOhuro+PHf3y2vXuu0+XLh4UezavVs0NDSYmvqk9qcF45FKWoWrSfft22cYkXGfd4f/bUQC1NfX/0lukNFHBlzn7955xx1i4aJF7qpdUVZWJnbv2mWq66MSgNknbmjRakE4g801TEb4/7jf5fq6uq1jIkBFefllfGGbkNkgr4OGvv+qggKxatUqt79fW18vPvroI2UjitnuD9cdzZ0zRymqq0XOnz+vbKk06Hco7k95eXndmAhAgX/3KwlZ74KGac/58+eLBx54wO2Vn9yDu3HTJuWIIrNPYqQVUza1r1unuS947BLLJBq1gA94fm2kv9+QAI2NjfvwoK2+GgxrBoAJwKHm54xvWlqaePzxx0VCQoJ7MQOCRZYh2bVzp+l1NWnBuOx69erVSpErLcLl2xs3bjTMjUN/9QDPm9wiQPnevcJqsfzBVwlAzaEl/x0Af9OovDnvQ8CQAPPmzRNPPvmkch6vu5mS7du3K/U5LR4WzvIGkfmbsrOzxX3r12u6Bq3gBx9+KCqrqowK4un+FAPPnW4RgNLc3PwqvnzJFwNJm92uyXzyQAhO3+u9AYNammdpcZBZIvw73/mO2+t9qPkJ/Ndff12cgwtkZtaHfc4+Y9bn4YcfVsiopU94qDYryzH7ZZAls8D9ee6G/zjaN8vKyj7Djy73tWCYWiRKIwE4aUPTq1fn87p0dwgYHjbxla98RTz99NNuHzTBglEE/2uvvaYEvTzFxaz1PuxvZmpYweEbjz4qHFFRmq7FcusvvPiikRt3OKfV0NzUtPOGscEYgod/w0Vu8SXtz4mXuPh4TekzbsAO1MEC8HoECieHYqKjRSq0/b333vvFQXLuCCs8fPjRR+L9999XsiWTTQC/mrFiH3O9UmZmprh/wwZNdYs4ZgT/f/32t8png5Y9KASAG/9Lpo41E6ClpeX96OjoRvh+ccKAybEbAZMAUAoowQe95+67Ne2eosTHxYmU5GRR+/nnX+TktWhF9SQXXkM9b4vXTkxKEqtXrRJLly7V9Hxc2vz2u+9enekFmYwAv9rn6u+h8L4Yd2WlKgvZLtGY76c13L17t/jNyy8rLqGe1neEcTrT0tr636Mq+JtdpKy0VGy4/376UL/WmwDK8lr4ucODVAKMmQdqHw7Ig1/9qgI4rXLnnXeKs93d4sCBA0qQOZagmEM2BKCoNTyZilRe8UyR8Gdng1Q8RJqg0SIsa8jjRd8F+HnUKH8rwahn7Ux1OQNBqZ7vS+tK/zwpMVFkZWVpWqmqCnerfbJzp3gDMQz7jdc30JINYlzfKS0tHXWf+5gAvTI3N9DhcJzEBRP0JAGXCNwN7X7d+nbXpIsdfueiBQsUF8YbwgVYzEawsFMvSOBK24wKFA4gB5Igj505U8TyQLn0dDHVC+deseb+HwsLFcAbleokoUNdmn4ySMA+TkxI0Jze/CJGg6Vm2cSP0L/sYyoLo7NXTN60tbUtLy0pOeYxASj3bdjwPRDgWaHjUmn6vu9t2uRRiXAtwkkmatuAUQhAzWh02RF/FG6QL6+oEH/cskU5OV5rrVNP8Y/2IbB0501j3LFeEWx6B1bg+wCJXa+nJgCZ8TCaAEbfb7wJg39aVFrTDz74QFnhSTeKi+VMylxddLa1PTOW/ztmAsCUNMAK/B5vvyfkStEJL9zJRR//TEeHsjybwOfiNu4PYIkXAt+kGWvedHdJSUmVVwlAcTqdP42KinpQz4yQgSkyKW5mipjFYVqWhbA+r6tTzhFmepOfGbeoZwCbuVQD9+4GTn881v/vFgFK9uw5Dyvwz3j773oQgIEStYriaw/J/TimiWsJxyUE5NywToA729tFA0BPbV9z6pRSjj3Udaax1pLuOmn/94DTyjH/VHfvkJeXZ7VHRR2BFUjzNgnoS/IcWQacg5IAponFFYux4C4zZNx4z/S0coIND9LGq5lrkkbR/h3tTueiPXv2tOpGAMr6e++9G67KO3g7ybuKJ0BJAw5J8PuAEbha8U199YMxGYKb9i9bNm/+gTtf0lTTDoHP+9ExMeW44SovM1imGn0RWX6gkPCMtR0dHT9w93uaIk7uR42IiDg4OSxsAzREmISIFJOlB8r4uzu2bz/strun9Y7ws/bjptwvILdNSjHbXSvt7Ox8XVO848mNcdOf4OYn5RBIMdH1aW1ra/ubYo2H9XmUdG+or++NjIysgyu0DtF0qBwOKQZLL7yQ5+D6FGq9gMe5rD3FxVsH+vrehR2SqRsphrs+XV1dz3pyDa8kc7vOnv0uHuaEHBIphrk+QjQ74foU7d7t0XW8su4ArlCfzWZrCAsLW4uPk+XwSNFZ9V/u7+v7lx07dhR6eimvTechCCns7e39DSxBrxwhKTq7Plu7u7uf9ca1vDqffa67+4d42SWHSIpeYrFYjrY7nY956vp41QVSpb6+nhXPtoeHh7NoTKQcLilelian0/lX8Da8lnr3+tpjxAMX7XZ7w+TJkwvwcaocMylecnvOwcX+8Sc7drzrVYuix8PCPBX29PT8DA/dLYdOihekD+3t8+fPv+DtC+u2+yQmJqYyLCwsHm+XCHnkkhTPtP/Ojvb2r+72kt9vCAFc8cA2xAN5+Jgk5DZKKdrAf7i9vf0WeBX9elxfV83ccJUEG0GCXBcJpEhxB/zHEPQ+iqC3Ua976O6agAT9CIo/gjt0Oz465LBKGSP4a6H5HwL4q/W8jyG+Odyhi7AEe2EJuIHGJodXyk3A3wrw/xBuz8d638uw4BSW4DRIUAoS5OOjXQ6zlBuAv43VR6D5f2vE/QzNzpAEcIfK4A4VSBJIGQn80PwE/wtG3dPw9GT9VRKUggTSHZJyHfg7AH64Pc8beV9T8vMqCVyzxdISSPA3Q/P/E8D/gtH3Nm2CiiSwgQSICbJdJLBIKEw44Saqzzs6Ov4W4H/NFPKZ3QMFq1aFwBpsGxoaWi3kjPFEEtbvPwHN/wjAX23WQ5gOOFiCARDgHcQEmfjImqOBEhvjXgYA/jKA/6/NBL9PEMBFgn6bzfYa3KGZrpKLsjrW+PX3e9F2Afx3APyNZj+Pz7gcXDZht9m2BQUGnrdYLIvQSXIp9Xhz+IeGuvt6e1/t7Op6SK+1PX4XA4wk+QUF+VFRUS+hw9JlXDBu/P3mdqfz50VFRS/60oP5JLhgDRoiIyPfhUuUgY6bKeMCv5Y+jGG50+n8RnFR0fu+9nA+q10bGhouIS74Q3BwcBg6cA5aqJBLqv3N3+9GewvgfwTgb/DJZ/SHjszLz893OBw8mGM53KIgCS2fl36e0D4wMPDjrq6uV7WWLZQEuJ4EYREREb+yWq0PQKtMk9bAZ7X+BbzscLa1PVVcXNzm88/rbx0MItwVHR39I2iYRWjBEnI+A/yBwcHBBrRnOjs7X/Nlre/XBHCRgDvNnkWnP44WKWSmyEwZ4rGkaNs7Ojqe2lNc7PQr4vpzz+fm5c2OiYn5V2idNeJqdWq5nshY6bFYLIdPnz79ExZJ9scf4Neas7GhoWtGRMRbYWFhR/ExFdbAJq2BIdIHjd+C139kbf6SPXv8tjDyuAkkV+bmWhwOx7fw9nsgQjReQyROdQE+az39l9Pp/AcA3/9jl/E2QiBCAILkb2GgfgAicBO+DJQ9F6Y1z+L1DQD/OQC/ZdwE7+N1xGgREB88hfjg+yBCjLg6myxTpxo0Pvz8N1pbW58rLSlpGW8/cNwDIjsnxxobG/sIiPA0iDDPRQQZJ9xYBl0a/zSA/1xLS8tLZaWl4/YgxAmjEXNycsTM2NjMgf7+pwMslnUgQ7iLCNIqXJUBgP7K0OBguTUw8N8B/D8C+OP+R0/Iwc/Kzp4eFx//WH9f31+DCClo1glqFQao8QH8dqvV+mpTU9Pv95aVHZtIHTDhtV9mVtbyhISEr/X39z8EIkSJq3MJlnHcNyronWhvBQYFbWqsry8rLy+fkOMvzf//J4JITEzM7evruw0f17vihQBX8+cJtiFXI+hP4/WdIIC+rq6utGKCgl4SYAySsWJFQnJy8hoQYjU+ftm15CLgmubrgKecA+hLAPhdtbW1H+6rqDgiR1YSQJMsW748PjU1dU1vb++XGFODENdu4A8woT+Hhr0yc8M9toxcy4KDg/fW1NTsr6qslIMnCaADIZYtm5aWnp4AQrCaxWK0WLQF4moZeKuHfT50Ex++Du0wWhPaCYC96sTx459WV1eflyMjCWC6LFq8OGb+/PnJPT09PDOZVS44Edfnshj8zG2eI20KJ3G41IBrazjzyuUc9NuPh4SEXDp65EjtwYMHW2QPe0/+nwADAF+xJWUo3CCKAAAAAElFTkSuQmCC	\N	2025-08-21 17:45:35.222	2025-08-21 17:45:35.222	www.deseretbook.com	\N
2983aae0-c54b-4e9b-9571-91c1b44b4063	Betterment	https://www.betterment.com/hubfs/Graphics/shared-assets/Favicon-navy-circle.png	\N	2025-08-21 21:39:54.339	2025-08-21 21:39:54.339	www.betterment.com	\N
d38b6e7e-ddaf-4b47-a3f5-a77e584ec62d	Arctic Circle	https://upload.wikimedia.org/wikipedia/commons/5/5d/Arctic_Circle_Restaurants_Logo.svg	\N	2025-08-19 11:55:23.86	2025-08-19 11:55:23.86	acburger.com	FOOD_AND_DRINK_FAST_FOOD
dcef8c8c-28a0-4597-ae61-4d5f120379e0	Bestbuy.com	https://corporate.bestbuy.com/wp-content/uploads/2022/11/BBY-logo-white-background.jpeg	\N	2025-08-28 19:38:55.378	2025-08-28 19:38:55.378	www.bestbuy.com	\N
92018f00-405a-4ee7-aec4-672f4ea6f9af	Autozone	https://www.autozone.com/apple-touch-icon.png	\N	2025-09-02 19:36:40.629	2025-09-02 19:36:40.629	www.autozone.com	GENERAL_SERVICES_AUTOMOTIVE
40195c8e-94db-402d-8b31-f1a01b354298	Carta	https://carta.com/favicon.ico	\N	2025-09-02 19:44:27.519	2025-09-02 19:44:27.519	carta.com	\N
12a43531-7e0c-451a-85df-7bd727f4ec69	Google	https://freelogopng.com/images/all_img/1657952641google-logo-png-image.png	\N	2025-09-02 20:43:13.494	2025-09-02 20:43:13.494	www.google.com	\N
9f493484-368a-45f7-bed0-ba778c5ffeae	CAL Ranch	https://www.calranch.com/globalassets/header/calranchlogo.svg	\N	2025-09-02 21:53:46.642	2025-09-02 21:53:46.642	https://www.calranch.com/	\N
4daae974-37d4-484a-a4f1-c373dc222857	Iceberg Drive Inn	https://icebergdriveinn.com/cdn/shop/t/6/assets/logo.png?v=110720542562003116151684816632	\N	2025-09-02 21:55:26.684	2025-09-02 21:55:26.684	icebergdriveinn.com	\N
23d17bc3-7c15-4917-9892-fdd5c0f8fab5	Jack in the Box	https://www.jackinthebox.com/favicon.ico	\N	2025-09-02 21:56:07.514	2025-09-02 21:56:07.514	www.jackinthebox.com	\N
db3c647f-1dae-402e-b9b3-022c6bb44573	Eastman Adams Photography	https://eastmanadams.com/cms-data/blog/blog/our-schools/image/our-schools-sq.jpg	\N	2025-09-03 06:51:16.846	2025-09-03 06:51:16.846	eastmanadams.com	\N
\.


--
-- Data for Name: PlaidItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlaidItem" (plaid_item_id, plaid_institution_id, access_token, workspace_id, created_at, updated_at) FROM stdin;
gnB9xAw4A7Cm0DN9Qn4eI4b5MpXYZ4FqAdnp5	ins_120013	access-production-8b922830-8767-435f-b0e3-db3b986cd173	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15 06:44:40.26	2025-08-15 06:44:40.26
\.


--
-- Data for Name: SavingsGoal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SavingsGoal" (savings_goal_id, target_balance, target_date, schedule_details, account_id, account_partition_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tag" (tag_id, name, workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transaction" (transaction_id, amount, date, authorized_date, iso_currency_code, notes, original_description, pending, done_pending, location_address, location_lat, location_lon, location_city, location_region, location_postal, source, source_id, source_data, account_id, merchant_id, pending_transaction_id, workspace_id, date_order, account_balance, plaid_data, created_at, updated_at, transfer_pair_id) FROM stdin;
a3bbe05f-96ac-400b-a712-1b176777fecb	-50	2025-06-16	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-14	2719.77	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5e65b624-3c16-4311-aed7-fe17147578c7	554.04	2025-06-20	\N	USD		MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-17	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:04:43.27	eb462d1a-2c7a-4c1d-a378-68fd74dbaf9d
4a9ff1a3-bfa4-4b9a-923a-8272ccedc921	-18.5	2025-06-23	\N	USD	\N	VISA - 06/20 THANKSGIVING POINT 180-1766503 UT 020052	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-03	1370.94	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ae4481ad-2a83-4cc1-909f-365c261c4838	-17	2025-06-09	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WAL-MART #4438 136 W STATE ROAD 73 - 000000505101	f	f	136 W State Road 73	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-09-04	168.42	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a99526b8-1b01-4875-9f98-3b8f6ca4d555	105.29	2025-06-23	\N	USD		MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-01	0	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f080076d-5d1a-4835-b3b4-12e7122e03cc	-1	2025-06-25	2025-06-24	USD	\N	PENDING - 06/24 - SARATOGA SPRINGS TEM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
af16a8c0-8db3-4c7b-9ca5-919cb05dc0e9	6	2025-06-10	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-02	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:03:55.557	8065d66e-efa9-4e87-9d3a-bbf63b079ffc
6a0ba343-772f-4d8a-a876-9fad3c16c0b7	-49.4	2025-06-30	2025-06-30	USD	\N	PENDING - 06/30 - THE LIVING PLANET AQUA	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ce452f66-ddc3-41b8-860a-63e98d75e142	-14	2025-06-25	2025-06-23	USD	\N	PENDING - 06/23 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ca9f24f9-0c02-4b6f-ac51-7fd587be7df3	-47.51	2025-06-23	2025-06-21	USD	\N	VISA - 06/21 LA GRANDE ROUE DE MONTREA VANCOUVER CD 02076	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-06	125.13	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f4cef8fc-6ea6-47d8-8ef9-b4725ec39c50	-20	2025-06-29	2025-06-27	USD	\N	PENDING - 06/27 - DOMINO'S 9102	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ef3ba1a3-3201-4bbf-bd4c-491fccbca70d	-45.84	2025-07-01	2025-07-01	USD	\N	PENDING - 07/01 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d73f2383-e47b-4061-b6be-1057f69338e7	-38.11	2025-07-03	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, COSTCO GAS #1383 - 000000677854	f	f	1083 N Redwood Rd	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	211815cf-6651-4b6e-af94-9821afd1a672	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-04	214.92	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
7d0b976b-b6ba-44d0-8bc5-045db2436dde	-13.14	2025-06-29	2025-06-27	USD	\N	PENDING - 06/27 - THANKSGIVING POINT FS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0bd5e090-38b6-4311-a972-dba026d382cc	-41.9	2025-07-17	2025-07-17	USD	\N	PENDING - 07/17 - MAVERIK #380	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9437b7e0-5108-4757-b334-bafe99fda5d7	-20	2025-06-25	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-25-03	936.3	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a56e499f-148f-49c0-b0be-9dc8b7e3ba3d	-8.82	2025-06-21	2025-06-19	USD		VISA - 06/19 PATISSERIE ST.MARTIN MONTREAL CD 019873	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-04	43.27	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f932ba74-eefc-4eef-972d-cf7a083e0819	-3.46	2025-07-16	2025-07-15	USD	\N	PENDING - 07/15 - 138 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0ca8a006-e682-45a3-bf27-17172a547bb6	-1.67	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-07	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9d3ec1b1-6c64-40b3-9c72-7e0be6702948	17.15	2025-05-31	\N	USD	\N	DIVIDEND EARNED FOR PERIOD OF 05/01/2025 THROUGH 05/31/2025 ANNUAL PERCENTAGE YIELD EARNED IS 1.30%	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ffc98ada-b8bf-40af-9ded-5cf268dec42d	-1.67	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-05	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c055cec6-9a42-400f-abeb-940c2776673b	-14.86	2025-08-15	2025-08-15	USD	\N	PENDING - 08/15 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-07	\N	null	2025-08-15 19:00:46.37	2025-08-19 11:00:53.31	\N
0a9aa9df-e203-4c54-bffb-af0fd76e4243	-76.84	2025-06-25	2025-06-22	USD	\N	PENDING - 06/22 - PARTSELECT.COM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
28689d31-68ea-48cb-8a51-662743e0f613	-76.84	2025-06-23	2025-06-22	USD	\N	PENDING - 06/22 - PARTSELECT.COM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d6789287-da31-4f1a-843d-fc0c57e45075	-14	2025-06-25	2025-06-23	USD	\N	PENDING - 06/23 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
abab7896-b414-4cf0-a503-f639d7097ebd	-14	2025-06-23	2025-06-23	USD	\N	PENDING - 06/23 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c047ff1f-b706-4434-ab5d-e893fa0d9533	-3.46	2025-06-29	2025-06-28	USD	\N	PENDING - 06/28 - WENDY'S 6671	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c559d55e-ae98-47d3-852a-11db8354f98d	-33.8	2025-06-23	2025-06-23	USD	\N	PENDING - 06/23 - LIBRO.FM AUDIOBOOKS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ffad4915-f89e-4502-9f01-5981d3eba33b	-500	2025-06-01	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:02:16.242	d32711fc-ae47-4da7-9612-ea679d467c69
f27f81b3-a0de-40e5-9d64-25c42f0d34cc	-76.84	2025-06-23	2025-06-22	USD	\N	PENDING - 06/22 - PARTSELECT.COM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0518e8e3-87e9-474f-aee7-33e449091a33	-76.84	2025-06-25	2025-06-22	USD	\N	PENDING - 06/22 - PARTSELECT.COM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ad9996c7-71c0-4d7c-8d8d-92f310d71be6	-13.14	2025-06-29	2025-06-27	USD	\N	PENDING - 06/27 - THANKSGIVING POINT FS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ae6c4afe-eb29-4db6-97ba-8f0821968585	-164	2025-06-03	\N	USD		FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-03-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
bd90c540-5610-415a-aa67-1ea0ba0e62c1	-4.32	2025-06-27	2025-06-26	USD	\N	PENDING - 06/26 - CHUBBYS CAFE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d9246fcf-98f8-45de-8d10-de687f8ca717	-26.81	2025-06-17	2025-06-15	USD		VISA - 06/15 MUSEE NATIONAL DES BEA QUEBEC CD 015952	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-17-04	-259.21	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ae53556e-cd78-4aca-8997-b0c3db2d34f4	-1	2025-06-25	2025-06-24	USD	\N	PENDING - 06/24 - SARATOGA SPRINGS TEM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
2b54d730-605c-42a3-83b1-5d587e519dd6	-57.64	2025-06-29	2025-06-28	USD	\N	PENDING - 06/28 - SMITH'S FOOD #4207	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a5720bbe-2a4c-4c6d-89a2-623cf1474f41	-5.61	2025-06-27	\N	USD	\N	VISA - 06/25 RIDLEY'S 1165 EAGLE MOUNTAI UT 025759	f	f	4045 E Pony Express Pkwy	40.36208	-111.966324	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dec45eae-1d76-405e-be2f-710e55bc2215	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-27-02	4486.98	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
8a7c9b23-9658-4e3f-a0e1-8e9b6dbb75ad	-3.46	2025-06-29	2025-06-28	USD	\N	PENDING - 06/28 - WENDY'S 6671	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
81569488-1858-45b7-9f20-541a0d33e2f3	-20	2025-06-29	2025-06-27	USD	\N	PENDING - 06/27 - DOMINO'S 9102	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
fd0d11eb-b1b7-45d2-a7dc-fec64a28bb91	-4.32	2025-06-27	2025-06-26	USD	\N	PENDING - 06/26 - CHUBBYS CAFE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
78c81937-0499-48aa-8565-d035c8914812	135.07	2025-06-06	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-06-01	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:02:32.264	4d45664b-916a-416f-a26f-311910a17e32
cf85b15f-159c-4c45-b2be-d12793226bf8	-65.26	2025-06-13	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, SMITH'S FOOD #4207 689 NORTH REDWOOD R - 000000552641	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-13-04	3191.33	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
8f467b52-2042-4ceb-828a-5ca6156f95a1	14.08	2025-06-30	\N	USD		DIVIDEND EARNED FOR PERIOD OF 06/01/2025 THROUGH 06/30/2025 ANNUAL PERCENTAGE YIELD EARNED IS 1.30%	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-30-01	14014.13	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
eb462d1a-2c7a-4c1d-a378-68fd74dbaf9d	-554.04	2025-06-20	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-02	1181.07	\N	2025-08-15 06:44:40.261	2025-09-03 05:04:43.271	5e65b624-3c16-4311-aed7-fe17147578c7
3f5cc83f-32a9-46b8-b3e2-300cf1d02bfa	-10.79	2025-07-03	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, COSTCO WHSE #1383 - 000000527074	f	f	1083 N Redwood Rd	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	211815cf-6651-4b6e-af94-9821afd1a672	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-03	253.03	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9fd96348-3f43-438a-a89f-b79fb2628421	-135	2025-06-05	\N	USD	\N	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-05-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f74fcb08-dc1d-49ec-a0ee-d6df501fd541	164.16	2025-06-04	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-04-01	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:02:25.988	d04e8071-2632-4e59-b93d-4657ffb5efee
94a6518b-eedd-4f9f-a1be-e5647a98f1bd	-41.9	2025-07-17	2025-07-17	USD	\N	PENDING - 07/17 - MAVERIK #380	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a8db0298-7b59-4f16-9ba0-56d95ef2a3ad	-49.4	2025-06-30	2025-06-30	USD	\N	PENDING - 06/30 - THE LIVING PLANET AQUA	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
125e2d79-fce8-488b-9597-610bb34099fd	-200	2025-06-09	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-09-01	13089.05	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
3c68d23c-ba83-48b5-a04d-b17a39317fe6	1000	2025-07-14	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-02	14306.68	null	2025-08-15 06:44:40.261	2025-08-26 16:36:07.278	63ef458c-5a05-4120-88a2-88e298c5ca2d
3974dcfa-de1d-42ed-be3a-cfadb932d2d4	-45.84	2025-07-01	2025-07-01	USD	\N	PENDING - 07/01 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
68356084-8c08-4aaa-a6eb-443cc323ba1a	-11.08	2025-06-21	2025-06-19	USD		VISA - 06/19 EPLV - RESTO DU JARDIN MONTREAL CD 019619	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-05	54.35	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c85ef39c-11a4-4324-a283-2a1ec0e7c9f5	-178.87	2025-06-23	\N	USD	\N	POINT OF SALE PURCHASE USA UT HERRIMAN, WINCO FOODS #159 11969 - 000000833049	f	f	Anthem Park Blvd @ Mountain View Corridor Trl	\N	\N	Herriman	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	7d811758-d002-4108-89cc-62b4b8516db5	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-05	1066.94	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5a0c9891-75e4-4058-9ff2-065ec63d1334	-7.95	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-03	3069.8	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:42.967	b40319ed-3030-43df-a87c-ca3607c198d2
b5c22a30-d37b-409d-a293-e95ee8fe4879	-6.44	2025-06-13	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, SMITH'S FOOD #4207 689 NORTH REDWOOD R - 000000552642	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-13-05	3184.89	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d521c415-c053-4004-aca2-eb98510be705	101.72	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-09	-248.83	null	2025-08-15 06:44:40.261	2025-09-03 05:04:24.393	cf4d43a3-f249-4fa1-87ed-eb28ac16725d
8d01569e-de8e-4ba5-860e-2066bf90d5e3	-2.96	2025-06-21	2025-06-19	USD		VISA - 06/19 HAVRE AUX GLACES MONTREAL CD 019624	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-01	23.73	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
07c4a90f-10e9-42d9-a085-271952358e78	89	2025-06-10	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-07	89.51	\N	2025-08-15 06:44:40.261	2025-09-03 05:04:05.137	228e62c9-c4f8-4f3e-9f54-e74775485071
2c7b8742-8e03-4972-a99e-fd73ab2c9487	3593.13	2025-06-12	\N	USD	\N	AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-12-01	3676.64	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
74184355-96a3-4ab3-a8f3-dfe5cf452591	-9	2025-06-12	\N	USD		VISA - 06/09 DOMINO'S 9102 123-456-7890 UT 009617	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c0f7e68b-9680-46ab-adfb-fc68c154510a	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-12-03	3664.87	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e683857f-d16b-4c1f-a075-8bbafb89b224	-111	2025-06-10	\N	USD	\N	AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-06	0.51	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
81d29ff1-0d9c-4690-828d-d0839fda928c	-45.04	2025-06-13	\N	USD		AUTOMATIC WITHDRAWAL, ROCKYMTN/PACIFIC POWER BILL WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-13-02	3616.59	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
68afcbfb-eb6a-42d0-bf20-8885fb4f5bd8	-33.8	2025-06-25	2025-06-23	USD	\N	PENDING - 06/23 - LIBRO.FM AUDIOBOOKS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
213d358e-dabf-4c48-98ed-bfdc0b2a0e7f	-16.21	2025-07-17	2025-07-17	USD	\N	PENDING - 07/17 - DOMINO'S 9102	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
8065d66e-efa9-4e87-9d3a-bbf63b079ffc	-6	2025-06-10	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-08	83.51	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:55.559	af16a8c0-8db3-4c7b-9ca5-919cb05dc0e9
0f85429c-230d-46ba-b598-cfe19467b23e	-57.64	2025-06-29	2025-06-28	USD	\N	PENDING - 06/28 - SMITH'S FOOD #4207	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
92a0e697-7227-48a1-87ea-941b9e2c7e73	34.45	2025-08-07	\N	USD	\N	POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-02	290.39	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.802	a89600ea-f74d-4ba0-9738-bc057b0a7f5f
d0017fd2-80a8-4d7a-afbd-7a3323b08fd6	-31.49	2025-06-20	2025-06-18	USD		VISA - 06/18 BILLETTERIE GARE CENTRALE MONTREAL CD 018052	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-11	186.81	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
be389374-0a46-46ec-8958-4f8c6d297e7a	-360	2025-06-13	\N	USD	\N	AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-13-03	3256.59	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d8fd4211-d2f9-40a7-ac5e-30537e1c5f66	-0.28	2025-06-20	\N	USD		STAR NETWORK ATM CASH ADVANCE FEE	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-19	19.27	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
86bf286d-0a9b-45eb-bc0c-251515552b52	-57.07	2025-06-20	2025-06-16	USD		VISA - 06/16 MURPHYS PUB IRLANDAIS QUEBEC CD 016001	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-12	243.88	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5e94a215-08cf-421e-ac9e-fdb9fc7d5a39	6	2025-06-10	\N	USD	\N	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-05	111.51	\N	2025-08-15 06:44:40.261	2025-09-03 05:04:10.122	914729e1-11dd-4b6f-87bf-21db9b37d027
12e770c8-97cd-40fb-b251-2387abd45f9b	-14	2025-06-23	2025-06-23	USD	\N	PENDING - 06/23 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0c94a7ed-4890-427f-b4e3-9a086fe17ff7	-17.98	2025-07-01	2025-07-01	USD	\N	PENDING - 07/01 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
cff8124d-e733-4cff-a050-af35d746873c	-58.74	2025-07-16	2025-07-14	USD		PENDING - 07/14 - CAFE RIO 0100 LEHI	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-02	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ed405fb0-3c65-40bb-ac42-d573f606cb6f	-17.98	2025-07-01	2025-07-01	USD	\N	PENDING - 07/01 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4532ef14-11b8-4955-86f1-ebbb76a9a300	-5.18	2025-06-21	2025-06-19	USD		VISA - 06/19 TROTTIER FRERES MONTREAL CD 019228	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-02	28.91	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
820bfa7e-228a-487e-b4c8-519285510318	-18.99	2025-06-20	\N	USD		STAR NETWORK ATM CASH ADVANCE CAN PE MONTREAL, ST VIATEUR BAGEL - 000000619391	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-18	18.99	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
459bbeb2-1008-47be-a46e-0c01f4cc2bf0	-29.92	2025-06-20	2025-06-17	USD		VISA - 06/17 FROMAGERIE DE LISLE SAINTE-FAMILL CD 017253	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-10	155.32	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
111070f9-a5b1-4c41-99f8-0041dd866f25	-33.8	2025-06-25	2025-06-23	USD	\N	PENDING - 06/23 - LIBRO.FM AUDIOBOOKS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
7385393b-31a1-4d0d-86a5-9a5a24b9db5c	-12.34	2025-08-13	2025-08-13	USD	\N	PENDING - 08/13 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-13-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 13:00:50.277	\N
572f9afc-2959-4e4b-81e7-457742733235	-76.84	2025-06-24	2025-06-22	USD	\N	PENDING - 06/22 - PARTSELECT.COM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
53b30b28-807b-43a9-b2eb-0f397c358f08	-2724.81	2025-06-02	\N	USD		AUTOMATIC WITHDRAWAL, M & T MORTGAGE MTG PYT WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b40319ed-3030-43df-a87c-ca3607c198d2	7.95	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-03	-89.44	null	2025-08-15 06:44:40.261	2025-09-03 05:03:42.965	5a0c9891-75e4-4058-9ff2-065ec63d1334
77b5ed02-ae48-4bac-b95c-44bd90fb8265	-20	2025-06-02	\N	USD		AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ddd416fd-1127-4188-be79-744741bd24a1	-240	2025-06-03	\N	USD		AUTOMATIC WITHDRAWAL, ROCK CREEK HOA DUES PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-03-05	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f58554b6-cc73-42df-acb8-54b9b20e6f32	-132.5	2025-08-25	\N	USD	\N	AUTOMATIC WITHDRAWAL, UT DMV8012973507DMV PAYMNT PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-25-04	696.62	null	2025-08-27 04:02:47.324	2025-09-03 20:00:50.802	\N
435683c9-9892-4207-a847-84f429e771b9	-30	2025-07-14	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-01	13306.68	null	2025-08-15 06:44:40.261	2025-09-03 06:03:10.307	2f49d2cf-b896-4e56-a10c-47a2a314f95f
19916ba3-bc32-4d23-81e2-3b8dfb6044ec	300	2025-06-04	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-04-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ec7bf304-0419-410c-83da-b359ebe02da2	-50	2025-07-16	2025-07-15	USD	\N	PENDING - 07/15 - DIRECTCOM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
adb89961-7194-4486-b504-f50968910799	-250	2025-06-02	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e7550129-78f2-44e0-b5a7-ba19806052ad	-1.5	2025-06-20	\N	USD		STAR NETWORK ATM NON-AFCU ATM TRANSACTION FEE	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-20	20.77	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
840a7ec1-9c0f-43bd-9d5c-69860e303d24	19.81	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-07	-125.92	null	2025-08-15 06:44:40.261	2025-09-03 05:03:19.768	1c92c4d8-1c09-4984-8603-29abb3414593
ad7819f6-8b33-41b7-b15b-304cacd9f4de	-10.16	2025-06-17	2025-06-15	USD		VISA - 06/15 LA MAISON SMITH LES PLAIN QUEBEC CD 015126	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-17-02	-302.08	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
15733142-40bd-4af0-8d07-1ab2aa3171de	-29.12	2025-06-16	2025-06-14	USD		VISA - 06/14 WWW.HURON-WENDAT.QC.CA QUEBEC CD 014489	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-04	-60.32	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
2f5372fd-16d3-449a-8b44-57f29f581aaf	-33.8	2025-06-24	2025-06-23	USD	\N	PENDING - 06/23 - LIBRO.FM AUDIOBOOKS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
550061c0-2893-4365-af8c-f3f8d3558ba6	-5.5	2025-06-04	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-04-03	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e25392a9-3fd9-4faa-bf72-26e340ed5ed9	-135	2025-06-06	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-06-02	13289.05	null	2025-08-15 06:44:40.261	2025-09-03 05:02:43.058	c23cf767-b3eb-4419-9713-ea01edb21dc7
65ff36cc-95be-4361-bf16-97d104b9a27d	26.54	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-01	-71.43	null	2025-08-15 06:44:40.261	2025-09-03 05:03:10.912	0fde4bd9-2cc5-4e7e-86f1-729b94de8c18
f4030158-28c2-44ef-b89d-7106bbe36a9f	28.1	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-05	-88.42	null	2025-08-15 06:44:40.261	2025-09-03 05:03:29.782	906eabee-6cf8-4eba-8900-54c06cb55cb5
e018dc87-a9c7-4399-80cd-19fb46c627b9	-50	2025-06-03	\N	USD	\N	ZELLE AARON ANDERSON 866-224-2158;515400F0BUA6;2025-06-03;DR	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-03-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
986f1279-c5a3-49a3-82fb-f7480019fc8f	-50	2025-06-02	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f6578f11-dc89-4a75-8a33-0f9e7fda735e	17.69	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-06	-106.11	null	2025-08-15 06:44:40.261	2025-09-03 05:03:34.16	d15b3498-6fcd-41b9-ab10-0dd65984afc7
ef2cc03d-2386-4452-83bb-8a7104e2c5f3	14.94	2025-06-16	\N	USD		MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-11	-320.27	null	2025-08-15 06:44:40.261	2025-09-03 05:03:38.504	7c4746f2-6001-43dd-8799-9d610c4d453b
f8eda2fb-7b44-460a-beab-5f7a1952f0f4	10.06	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-02	-81.49	null	2025-08-15 06:44:40.261	2025-09-03 05:03:15.546	6ca776d2-3a93-4c2f-8d20-602a6bb860de
3621260e-3982-4205-95f0-167dae108a2a	164	2025-06-03	\N	USD	\N	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-03-04	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5a5e7dfa-4d47-4047-9ff0-6738dc7442b5	-24.37	2025-06-20	2025-06-19	USD		VISA - 06/19 DOMINOS PIZZA 10653 MONTREAL CD 018134	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-08	97.91	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
45dabfd5-b79e-471e-a034-87d43d8ad234	-5.54	2025-06-21	2025-06-19	USD		VISA - 06/19 COCHONS TOUT RONDS - SB SAINT BRUNO CD 01980	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-03	34.45	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0a8b2c87-6559-4d15-bb1f-e8fca86dacc9	-2724.81	2025-07-01	\N	USD		AUTOMATIC WITHDRAWAL, M & T MORTGAGE MTG PYT WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-01-04	222.22	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
818b984c-29ba-436a-ac80-32999e3f3aa5	-300	2025-06-04	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-04-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
849f8c78-f43a-4969-88f1-682b7a0aaf90	3593.13	2025-06-27	\N	USD	\N	AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-27-01	4492.59	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ab9bf84f-3ef4-4a76-9fa9-e91889cc01cb	-50	2025-06-01	\N	USD	\N	ZELLE RACHEL JUDD 866-224-2158;515200M0HD5A;2025-06-02;DR	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5ef435ec-cd1c-4d88-b7b1-994a297e89f7	-300	2025-06-05	\N	USD		AUTOMATIC WITHDRAWAL, TRANSAMERICA INSINSPAYMENT PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	75790fa2-060c-457a-859b-eaa387d3f648	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-05-04	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
00b0c1eb-6b81-41b0-a88f-c3300947c12c	0	2025-06-01	\N	USD		INTEREST CHARGE	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d721969b-14fe-49ba-a28d-ff2079a972ec	-76.84	2025-06-24	2025-06-22	USD	\N	PENDING - 06/22 - PARTSELECT.COM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c7ae8ef6-2a21-433f-9511-f3dfe03c8a60	135	2025-06-05	\N	USD	adfg oisdfg osdifg sd;f jn;sldfnb ;sodkfbkjnadf;v lakdfm ;alkdfm lfk	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-05-03	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b6dc4fda-7b3e-44ee-ac65-4d178b899bef	19.32	2025-06-10	\N	USD	\N	PURCHASE RETURN VISA DEBIT - 06/07 WM SUPERCENTER #4438 SARATOGA SPRI UT 007424	f	f	136 W State Road 73	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-01	187.74	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
2ee1af13-a045-4819-a421-13e664a4391d	-8	2025-06-09	\N	USD		VISA - 06/06 DOMINO'S 9102 123-456-7890 UT 006584	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c0f7e68b-9680-46ab-adfb-fc68c154510a	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-09-02	239.08	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
840645ef-5e69-41ae-bae0-4bc2dec4bf2a	-14.57	2025-06-07	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WM SUPERCENTER #4438 136 W STATE ROAD 73 - 000000366572	f	f	136 W State Road 73	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-07-02	47.08	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b745352b-ec70-4876-b491-d43975217ead	-53.66	2025-06-09	\N	USD	\N	VISA - 06/06 STATE FARM INSURANCE 800-956-6310 IL 006101	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	3af7197b-95bc-41ac-b900-6edd277f744e	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-09-03	185.42	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4e070657-1105-4e22-b859-7c04056033e6	-14.86	2025-08-15	2025-08-15	USD	\N	PENDING - 08/15 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-01	\N	null	2025-08-15 19:00:46.394	2025-08-19 11:00:53.311	\N
f5503f6d-95b0-4b96-935a-532fbaaf07c0	200	2025-06-09	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-09-01	247.08	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ce944a41-f7b2-4d76-890b-d6965cb24ca1	-70	2025-06-05	\N	USD	\N	AUTOMATIC WITHDRAWAL, TRANSAMERICA INSINSPAYMENT PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	75790fa2-060c-457a-859b-eaa387d3f648	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-05-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c23cf767-b3eb-4419-9713-ea01edb21dc7	135	2025-06-06	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-06-02	235.06	null	2025-08-15 06:44:40.261	2025-09-03 05:02:43.057	e25392a9-3fd9-4faa-bf72-26e340ed5ed9
16a54d5c-d030-4c53-8bbd-418ce34223a6	-38.34	2025-06-07	\N	USD		POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, MAVERIK #380 - 000000886730	f	f	9217 N Ranches Pkwy	40.380039	-111.974281	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-07-01	61.65	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e6e51bf3-7c77-4c6d-b2d7-dbed09614fd9	-7.9	2025-06-25	2025-06-25	USD	\N	PENDING - 06/25 - WENDY'S 6671	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
3a112f6e-482a-4c7a-b573-8c154a985233	-7.9	2025-06-25	2025-06-25	USD	\N	PENDING - 06/25 - WENDY'S 6671	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ae3295bc-167b-4d9b-9ec6-37592737af48	-14.42	2025-06-02	\N	USD		VISA - 05/30 SMITH'S FOOD #4207 SARATOGA SPRI UT 030316	f	f	689 N Redwood Rd	40.374569	-111.919418	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
70deeee8-7d97-4344-b31a-3adf6b93df91	-1000	2025-05-30	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4fffa20f-5a5e-4ae4-aeeb-d7bbf22a78a0	-57.73	2025-06-10	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WAL-MART #4438 136 W STATE ROAD 73 - 000033133838	f	f	136 W State Road 73	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-04	105.51	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
24310cb9-b823-4365-b447-98270a1171b4	-15.99	2025-06-27	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-27-05	3463.09	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
486fe256-679e-45fe-a77b-11852b425ea3	100	2025-06-06	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-06-01	100.06	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4d45664b-916a-416f-a26f-311910a17e32	-135.07	2025-06-06	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-06-03	99.99	\N	2025-08-15 06:44:40.261	2025-09-03 05:02:32.266	78c81937-0499-48aa-8565-d035c8914812
446c08dd-2df4-4c78-803d-eed7e24cf126	-16.34	2025-06-23	2025-06-21	USD		VISA - 06/21 11 ALIVE NEWS SHOP ATLANTA GA 021755	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-03	25.67	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a315a9a3-f5f9-4202-939e-6e2aa2c72886	-4.32	2025-05-30	2025-05-27	USD	\N	VISA - 05/27 138 ARCTIC CIRCLE EAGLE MOUNTAI UT 027235	f	f	1398 E Eagle Mountain Blvd	40.306999	-112.017105	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b44dac54-09c1-4b34-bc1e-6379bf183a3a	-3.46	2025-05-27	2025-05-24	USD	\N	VISA - 05/24 WENDYS 6094 SARATOGA SPRI UT 024713	f	f	1361 N Redwood Rd	40.386951	-111.916824	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
61d00b56-faef-4e0d-ba1a-42f7ddd9c92f	-6.28	2025-05-27	2025-05-24	USD	\N	VISA - 05/24 WENDYS 6094 SARATOGA SPRI UT 024336	f	f	1361 N Redwood Rd	40.386951	-111.916824	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9a064513-8984-467a-b298-4b983be88ad4	-4.92	2025-05-28	2025-05-26	USD	\N	VISA - 05/26 CHEVRON 0306371 EAGLE MOUNTAI UT 026618	f	f	3476 E Pony Express Pkwy	40.362156	-111.977165	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dc463616-53ef-4b58-8a32-43e86c148ff4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d319ca4a-7f02-4625-9f1b-287651779923	-41.25	2025-05-28	2025-05-26	USD	\N	VISA - 05/26 SMITH'S FOOD #4207 SARATOGA SPRI UT 026020	f	f	689 N Redwood Rd	40.374569	-111.919418	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4c7ad3c8-2ac5-4528-9e03-81bfec1e10ec	-5.61	2025-06-25	2025-06-25	USD	\N	PENDING - 06/25 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d344a05d-e2e5-49c4-af5a-b07e8fa0cd69	-15.32	2025-05-30	2025-05-28	USD	\N	VISA - 05/28 SQ *HUNTS TEXAS BBQ LEHI UT 028983	f	f	1400 W Morning Vista Dr	\N	\N	Lehi	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
18870172-2f63-49e7-b383-073c504844c5	3593.13	2025-05-29	\N	USD	\N	AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c80a9b2c-500d-4919-bcff-3f0b9555c31a	1000	2025-05-30	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6890022d-875e-4259-adf0-77d893c0a8f7	34	2025-05-28	\N	USD	\N	AUTOMATIC DEPOSIT, HEALTHEQUITY INCHEALTHEQUI PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
795b4e28-e652-4f90-aab7-964ec468f614	-10.97	2025-05-30	2025-05-28	USD	\N	VISA - 05/28 SQ *THE NUG SOUTH JORDAN UT 028925	f	f		\N	\N	South Jordan	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b1e9562f-98d4-44f7-9213-99449190b3a8	-100	2025-06-06	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-06-01	13424.05	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
fefa0ecb-47dc-449d-afcb-5f0a2e416e94	-14	2025-06-24	2025-06-23	USD	\N	PENDING - 06/23 - 123 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
23584ea7-3c2d-48b1-a1ca-b9c9bc72f40d	-360	2025-05-30	\N	USD	\N	AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
280095d9-6c35-4f48-a208-213f3054c4b2	-21.85	2025-05-30	2025-05-28	USD	\N	VISA - 05/28 SQ *LA UNION MEXICAN FOOD EAGLE MOUNTAI UT 0	f	f	2000 E Red Oak Rd	\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c40c28e4-96ce-4ef9-9f31-34914cd1af50	-26.78	2025-05-28	2025-05-26	USD	\N	VISA - 05/26 PAPA MURPHY'S UT056 OLO OLO.COM UT 026215	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	498fd7dc-5d3f-4d0c-9913-71f14fbed33b	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e02f373a-3894-43c3-accd-f36cbe8c290f	-5.52	2025-05-28	2025-05-26	USD	\N	VISA - 05/26 WENDY'S 6671 EAGLE MOUNTAI UT 026285	f	f	4302 E Pony Express Pkwy	\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f594953f-ab1c-45b2-8678-9ac1989373e6	-33.8	2025-05-31	2025-05-29	USD	\N	VISA - 05/29 LIBRO.FM AUDIOBOOKS 413-206-9290 WA 029522	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c9fecc3b-b536-4183-8430-4a24fd58c85c	-7.68	2025-05-27	2025-05-23	USD	\N	VISA - 05/23 WENDY'S 6671 EAGLE MOUNTAI UT 023182	f	f	4302 E Pony Express Pkwy	\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
8e72c4fe-bcf9-4fef-b428-c63a253f26a0	-105.88	2025-05-27	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGASPRIN, THE HOME DEPOT #4461 - 000000724300	f	f	1226 N Exchange Dr	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	5cfa3fb0-16bd-4140-a0ee-a1029e53e44a	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
71e57548-6059-4aba-8a9f-ece7d491f576	-22.36	2025-05-30	2025-05-28	USD	\N	VISA - 05/28 RIDLEY'S 1165 EAGLE MOUNTAI UT 028309	f	f	4045 E Pony Express Pkwy	40.36208	-111.966324	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dec45eae-1d76-405e-be2f-710e55bc2215	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
1400a470-1f28-4337-ab9c-745c236a2b0a	-9.33	2025-06-23	2025-06-20	USD		VISA - 06/20 CHEZ PSYCHO MONTREAL CD 020578	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-02	9.33	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
05a6616a-2991-4aed-86f8-168c69cd4e23	-12.34	2025-08-13	2025-08-13	USD	\N	PENDING - 08/13 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-13-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 12:34:20.869	\N
97f66183-ca96-4033-bc27-2b6663e79dc8	-223.82	2025-05-29	\N	USD	\N	AUTOMATIC WITHDRAWAL, CARTA B627C776-9EDI PYMNTS PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
df885720-afae-439e-971a-12b938751553	-3511.3	2025-05-30	\N	USD	\N	POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, JEPPSON AUTOMOTIVE REPA - 000000278559	f	f		\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ce224e3f-bea7-4c56-88c0-faa0161f7222	-33.8	2025-06-24	2025-06-23	USD	\N	PENDING - 06/23 - LIBRO.FM AUDIOBOOKS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d2d4d17c-c7a8-4a3e-bc54-027bc88f34f3	-105.29	2025-06-23	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-01	1075.53	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4d7b2f5f-6ec1-4b9e-be66-64d492080648	-7.9	2025-06-27	\N	USD	\N	VISA - 06/25 WENDY'S 6671 EAGLE MOUNTAI UT 025807	f	f	4302 E Pony Express Pkwy	\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-27-03	4479.08	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
01f9a132-c5b8-4c0a-854d-4b1577da80d8	-2.85	2025-07-14	2025-07-12	USD	\N	VISA - 07/12 MAVERIK #651 POCATELLO ID 012002	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-04	3662.66	null	2025-08-15 06:44:40.261	2025-08-18 22:51:04.013	\N
2aadf383-7960-46ba-8114-e8954e933475	-14.58	2025-07-14	2025-07-12	USD	\N	VISA - 07/12 MAVERIK #380 EAGLE MOUNTAI UT 012672	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-07	3624.07	null	2025-08-15 06:44:40.261	2025-08-21 15:18:26.548	\N
63ef458c-5a05-4120-88a2-88e298c5ca2d	-1000	2025-07-14	\N	USD		MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-08	2624.07	null	2025-08-15 06:44:40.261	2025-08-26 16:36:07.28	3c68d23c-ba83-48b5-a04d-b17a39317fe6
2a6d3b1e-51b3-45ac-9848-df0cc8fc60b2	-38.29	2025-07-14	\N	USD		POINT OF SALE PURCHASE USA ID CHUBBUCK, MAVERIK #489 - 000000237848	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-02	72.38	null	2025-08-15 06:44:40.261	2025-08-18 22:51:29.654	\N
d9761a4a-8920-4dbd-a3e1-3b25c1aa1ce1	-131.13	2025-07-03	\N	USD		MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-01	13883	null	2025-08-15 06:44:40.261	2025-09-03 06:46:16.207	bcfc44ec-b730-4d82-a676-9ef6e006d3a7
ebc094cf-206a-44db-879b-abac918c7346	-48.45	2025-05-31	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGASPRIN, THE HOME DEPOT #4461 - 000000576267	f	f	1226 N Exchange Dr	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	5cfa3fb0-16bd-4140-a0ee-a1029e53e44a	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
db1c3087-2336-45f1-9f9d-7b9bb6a4ab6e	43.89	2025-08-28	\N	USD	\N	POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-01	482.51	null	2025-08-28 08:06:55.096	2025-09-03 20:00:50.817	b065dd6a-942e-49f2-a0bc-ac1f05a33257
4356cbfe-3edd-415e-b57b-c5f1fae8949c	100	2025-08-07	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-04	120.26	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.801	8d462eee-9559-461e-a8ac-9dc16e536275
145e9a16-7e2f-4fc8-954e-c5c04f2a101a	-21.19	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-10	2942.93	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:24.325	4a6044ce-b667-44ec-9232-8e5835079ab9
8513eab1-b71f-4b9b-8345-16314affddda	-5.61	2025-06-25	2025-06-25	USD	\N	PENDING - 06/25 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0447bec1-f0d4-4450-a05a-e53b33fd88ca	-200	2025-07-03	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-02	13683	null	2025-08-15 06:44:40.261	2025-09-03 06:02:15.505	8bd32618-723b-4552-9fe3-a13f909b3b1a
6a48e00f-3a57-4151-8e15-7aa766d9fb3b	3593.13	2025-07-14	\N	USD		AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-03	3665.51	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
37a190b2-2af7-45c6-8fd5-69f595dd02c8	-11.05	2025-07-14	2025-07-10	USD	\N	VISA - 07/10 WENDYS 6094 SARATOGA SPRI UT 010228	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-05	3651.61	null	2025-08-15 06:44:40.261	2025-08-18 22:51:10.132	\N
320e5fed-8680-49c3-bd61-6e7ecb37e653	100	2025-07-12	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-12-01	111.05	null	2025-08-15 06:44:40.261	2025-09-03 06:02:52.511	c1771b3b-8533-4fff-9301-660c04ae77e3
3e50733e-4b46-437d-9326-b607cba26352	-12.96	2025-07-14	2025-07-12	USD	\N	VISA - 07/12 WENDY'S 6671 EAGLE MOUNTAI UT 012913	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-06	3638.65	null	2025-08-15 06:44:40.261	2025-08-18 22:51:16.108	\N
e221ee65-9e23-411d-9bfa-7e8bbf4f2c78	-500	2025-07-14	\N	USD		MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-09	2124.07	null	2025-08-15 06:44:40.261	2025-09-03 06:03:06.019	216baf0b-c9e9-4699-ad82-a2baa79026dd
58197b23-cfb3-4f3a-98a8-6607835fa1ee	-50	2025-06-17	2025-06-15	USD	\N	VISA - 06/15 DIRECTCOM 801-789-2800 ID 015566	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-17-05	-209.21	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ce9cf483-523a-4f95-8896-3a26a1dd273c	0	2025-07-01	\N	USD		INTEREST CHARGE	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-01-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c8ae9591-f3c6-4712-8054-2cf38dca9289	-360	2025-07-01	\N	USD		AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	af8bb24b-5ae8-4f16-a834-246d7cfd31a4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-01-03	2947.03	null	2025-08-15 06:44:40.261	2025-08-18 22:43:48.111	\N
f4d6ecad-435b-487d-9515-2bb4e6be633d	-30.38	2025-07-12	\N	USD	\N	POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, MAVERIK #380 - 000000413634	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-12-02	80.67	null	2025-08-15 06:44:40.261	2025-08-18 22:50:16.819	\N
4a309638-7e5d-4e0e-b9f3-a08b97b35138	-65.41	2025-08-13	2025-08-12	USD	\N	VISA - 08/12 AMAZON MKTPL*NP8ED1QV0 AMZN.COM/BILL WA 0107	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-13-01	177.76	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.811	\N
5314758d-4d54-4184-8e90-dc71bf45af52	-2724.81	2025-09-02	\N	USD	\N	AUTOMATIC WITHDRAWAL, M & T MORTGAGE MTG PYT WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-06	858.23	null	2025-09-03 05:00:54.686	2025-09-03 20:00:50.829	\N
cfce1d41-8063-4783-aff7-fb2160a2aa68	56.5	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-10	-305.33	null	2025-08-15 06:44:40.261	2025-09-03 05:04:29.518	3ad23759-fad1-4bfd-9e9c-991626c8e0d4
5e572568-7bb8-4b60-9729-cf9189e8f34d	-1	2025-06-24	2025-06-24	USD	\N	PENDING - 06/24 - SARATOGA SPRINGS TEM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a23de51e-ccb7-4212-9a19-2d6265547841	-2.77	2025-06-12	\N	USD		VISA - 06/09 HOLIDAY OIL #41 LEHI UT 009243	f	f	2121 N Thanksgiving Way	40.413589	-111.877357	Lehi	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	1dceec67-003e-428a-b077-92797423bc79	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-12-02	3673.87	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
42cbeb22-adec-4499-ba01-c0d3154db3a8	-33.8	2025-06-25	\N	USD	\N	VISA - 06/23 LIBRO.FM AUDIOBOOKS 413-206-9290 WA 023433	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-25-01	1033.14	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
228e62c9-c4f8-4f3e-9f54-e74775485071	-89	2025-06-10	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-01	13000.05	null	2025-08-15 06:44:40.261	2025-09-03 05:04:05.135	07c4a90f-10e9-42d9-a085-271952358e78
48aa6d50-8604-4aca-aba6-e6bd45e664cd	-59.02	2025-06-20	2025-06-18	USD		VISA - 06/18 ENTERPRISE CANADA C763 QUEBEC CD 017737	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-13	302.9	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
1b788d8c-e2eb-48c1-bf27-fdff7453facf	-50	2025-07-15	\N	USD		ZELLE AARON ANDERSON 866-224-2158;519600B05XSX;2025-07-15;DR	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-15-01	2074.07	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c44a8845-f505-4e85-8aff-503b2b7a762f	-73.79	2025-07-15	\N	USD		AUTOMATIC WITHDRAWAL, ROCKYMTN/PACIFIC POWER BILL WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	1875dfd9-3487-44a4-be05-145b761a5906	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-15-03	1985.89	null	2025-08-15 06:44:40.261	2025-08-18 22:50:52.493	\N
e93b0ec7-926c-4d9d-af79-ef7dab8c7a91	-4.32	2025-06-30	\N	USD		VISA - 06/27 CHUBBYS CAFE SARATOGA SPRI UT 026051	f	f	1284 N Redwood Rd # Not	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-30-02	3447.81	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d2c3d54d-cab9-4da1-bb91-0dda4e0c09da	-20	2025-06-30	\N	USD		VISA - 06/27 DOMINO'S 9102 123-456-7890 UT 027254	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c0f7e68b-9680-46ab-adfb-fc68c154510a	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-30-03	3427.81	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
643ac6ac-63f5-46d1-b401-b61ed0a736c0	-57.64	2025-06-30	\N	USD	\N	VISA - 06/28 SMITH'S FOOD #4207 SARATOGA SPRI UT 028194	f	f	689 N Redwood Rd	40.374569	-111.919418	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-30-04	3370.17	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b13ac6a2-3834-4e4d-89f6-a3006293a403	103.74	2025-06-05	\N	USD		AUTOMATIC DEPOSIT, AFCU OLB, CICOBK CK WEBXFR ARTHUR MATTHIAS P2P WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-05-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6966e938-9951-461d-9cab-82fcf8988be6	-58.74	2025-07-16	2025-07-14	USD	\N	PENDING - 07/14 - CAFE RIO 0100 LEHI	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
80e93aa9-24dd-4e7f-be8e-315ff7852ed4	-145.11	2025-06-03	\N	USD	\N	POINT OF SALE PURCHASE USA UT HERRIMAN, WINCO FOODS #159 11969 - 000000264762	f	f	Anthem Park Blvd @ Mountain View Corridor Trl	\N	\N	Herriman	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	7d811758-d002-4108-89cc-62b4b8516db5	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-03-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b0164948-2cbe-4b03-867f-60becb06404b	-3.46	2025-07-16	2025-07-15	USD	\N	PENDING - 07/15 - 138 ARCTIC CIRCLE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
f2972f4e-4f7c-42b1-a391-03a7f35bb9cf	1000	2025-06-27	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-27-01	14000.05	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
1815703b-2c93-462b-b03e-5af1cd9a1a28	-16.47	2025-06-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, DOMINION ENERGY QGC PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	04fe2780-aac4-47b3-84dc-1638a365a176	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-01	2085.11	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
cc359d45-afe6-4bf5-af4b-7480612d1cc3	-223.83	2025-08-01	\N	USD		AUTOMATIC WITHDRAWAL, CARTA 1E23DB24-9EDI PYMNTS PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	40195c8e-94db-402d-8b31-f1a01b354298	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-01-03	3888.02	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.169	\N
0577de06-6a4a-439b-ac64-4077a618715a	-12.16	2025-06-16	\N	USD		VISA - 06/13 AMAZON MKTPL*NA3YX9DB2 AMZN.COM/BILL WA 0124	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-05	3048.22	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5007a837-3ff3-4361-bbfc-2d04b358a43f	-5.82	2025-09-02	2025-08-30	USD	\N	PENDING - 08/30 - JACK IN THE BOX 6045	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-02	\N	null	2025-09-02 06:00:51.308	2025-09-02 17:12:41.332	\N
e29d55b1-d2d8-4bbd-a884-f1a8aba4d9b8	-50	2025-06-20	\N	USD	\N	FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-01	1735.11	\N	2025-08-15 06:44:40.261	2025-09-03 05:04:37.196	4b9fb2ad-ca40-423c-8489-e3fd8791e8c3
85060cfd-9b17-4c6f-a0ef-d890e7dbfe48	-14.39	2025-07-15	2025-07-13	USD	\N	VISA - 07/13 MAVERIK #489 CHUBBUCK ID 013822	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-15-02	2059.68	null	2025-08-15 06:44:40.261	2025-08-18 22:50:44.579	\N
05a3d659-4750-4694-a819-cd165157d499	-12.16	2025-07-16	2025-07-14	USD	\N	VISA - 07/14 AMAZON MKTPL*KT6AX8AO3 AMZN.COM/BILL WA 0134	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-01	1973.73	null	2025-08-15 06:44:40.261	2025-08-18 23:01:49.051	\N
0652c72d-2d2b-4c16-bdd8-1203c22e82fd	-31	2025-07-05	\N	USD	\N	POINT OF SALE PURCHASE USA ID CHUBBUCK, WM SUPERCENTER #1995 4240 YELLOWSTONE AVE - 000000026950	f	f	4240 Yellowstone Ave	42.90984	-112.463593	Chubbuck	ID		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-01	183.92	{"date": "2025-07-05", "name": "POINT OF SALE PURCHASE USA ID CHUBBUCK, WM SUPERCENTER #1995 4240 YELLOWSTONE AVE - 000000026950", "amount": 31, "pending": false, "website": "walmart.com", "category": null, "datetime": null, "location": {"lat": 42.90984, "lon": -112.463593, "city": "Chubbuck", "region": "ID", "address": "4240 Yellowstone Ave", "country": null, "postal_code": "83202", "store_number": "1995"}, "logo_url": "https://plaid-merchant-logos.plaid.com/walmart_1100.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-05-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Walmart", "counterparties": [{"name": "Walmart", "type": "merchant", "website": "walmart.com", "logo_url": "https://plaid-merchant-logos.plaid.com/walmart_1100.png", "entity_id": "O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "KBg5V9qZ93CwRmAO8x3XU59Qmj6xL1I1n9QQ3", "authorized_date": null, "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GENERAL_MERCHANDISE", "detailed": "GENERAL_MERCHANDISE_SUPERSTORES", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GENERAL_MERCHANDISE.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b2418016-b8a1-40d5-b567-994d7e00b23a	-140.82	2025-07-10	\N	USD		MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-01	13436.68	null	2025-08-15 06:44:40.261	2025-09-03 06:46:06.517	f79a74d6-d4e2-4a87-a074-cab8fa9b2187
0f606a1d-03c0-4a13-a109-4661bbce725d	3593.13	2025-08-14	\N	USD	\N	AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-01	3770.89	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.813	\N
dc200089-4a80-44e2-9e09-8175457c2d62	-12.34	2025-08-15	2025-08-13	USD	\N	VISA - 08/13 RIDLEY'S 1165 EAGLE MOUNTAI UT 013981	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dec45eae-1d76-405e-be2f-710e55bc2215	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-03	2252.36	null	2025-08-16 03:44:47.027	2025-09-03 20:00:50.817	\N
d04e8071-2632-4e59-b93d-4657ffb5efee	-164.16	2025-06-04	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-04-02	\N	{"date": "2025-06-04", "name": "MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT", "amount": 164.16, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-04-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "aV6Xvb9kb0Cb71vP0ykmf6kB9pbDk0f33nq6bz", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "LOAN_PAYMENTS", "detailed": "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_LOAN_PAYMENTS.png"}	2025-08-15 06:44:40.261	2025-09-03 05:02:25.99	f74fcb08-dc1d-49ec-a0ee-d6df501fd541
7a40530a-38a8-42da-a4c4-b922c6e2115c	28.83	2025-06-14	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-14-01	-28.83	null	2025-08-15 06:44:40.261	2025-09-03 05:03:06.957	9e5b4830-f874-40f7-a917-51372fd6e766
12d8cb07-32bc-4334-ac83-1e8326f6fabf	-20	2025-09-02	2025-08-30	USD	\N	PENDING - 08/30 - CALRANCH-POCATELLO #4	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-03	\N	null	2025-09-02 06:00:51.308	2025-09-02 17:12:41.332	\N
5d63ad67-261f-4661-8d48-990f75c52096	-8.03	2025-06-17	2025-06-15	USD		VISA - 06/15 LA PETITE CABANE A SUCRE QUEBEC CD 015123	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-17-01	-312.24	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
022752f2-524d-4662-93a3-517cd3fd1459	-50	2025-08-01	\N	USD		ZELLE RACHEL JUDD 866-224-2158;521300D0CCRV;2025-08-01;DR	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-01-01	3892.02	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.169	\N
d9abb795-e0c7-483b-b4f6-02bd440ad011	-43.05	2025-07-30	2025-07-27	USD		VISA - 07/27 LITTLE AMER WYOM F & B LITTLE AMERIC WY 0279	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	0dad559b-53a0-48c2-8910-045d59fd60bf	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-30-03	4805.33	null	2025-08-15 06:44:40.261	2025-08-28 22:00:48.665	\N
50f0a6f4-1151-4b27-8776-e9f6f9dab17f	-140.82	2025-07-10	\N	USD		POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-01	140.82	null	2025-08-15 06:44:40.261	2025-09-03 06:02:41.606	80d9df07-6fc8-4edd-977a-5787fa6b8785
57074918-f169-4eec-b67d-346c527a69ac	-32.86	2025-06-23	2025-06-21	USD		VISA - 06/21 SHAKE SHACK ATL CONCOURS COLLEGE PARK GA 021	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-05	77.62	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
8cca5f6c-acd6-4503-8d25-c908134a3fd3	-16.21	2025-07-17	2025-07-17	USD	\N	PENDING - 07/17 - DOMINO'S 9102	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d6fccb87-3c1a-4527-be90-cc2232a76c83	-12.3	2025-07-28	2025-07-26	USD		VISA - 07/26 NIC*WY CURT GOWDY SP CHEYENNE WY 026884	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-28-03	592.23	null	2025-08-15 06:44:40.261	2025-08-27 05:33:41.549	\N
bd5c9bcd-cbdf-46c9-a2e1-3126ff51b02c	-6	2025-08-15	2025-08-12	USD		VISA - 08/12 SARATOGA SPRINGS DI SARATOGA SPRI UT 012101	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-02	2264.7	null	2025-08-15 12:34:20.987	2025-09-03 20:00:50.813	\N
d32711fc-ae47-4da7-9612-ea679d467c69	500	2025-06-01	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:02:16.241	ffad4915-f89e-4502-9f01-5981d3eba33b
a2299a9b-e6d0-4af6-aad4-c3afca0900ee	50	2025-07-21	\N	USD		PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-21-01	\N	null	2025-08-15 06:44:40.261	2025-09-03 06:45:55.415	98a4df92-278b-418e-98e4-779578ead19f
5553196c-0745-42c9-8ef4-53e1ad8f82aa	-21.44	2025-06-20	2025-06-17	USD		VISA - 06/17 CANYON SAINTE-ANNE ST-JOACHIM-DE CD 017588	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-06	50.4	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
bb1a8b5a-1156-40e1-a61b-0d94d2ceefc8	-108.24	2025-08-15	2025-08-13	USD	\N	VISA - 08/13 AMAZON MKTPL*1J9F68X53 AMZN.COM/BILL WA 0121	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-04	2144.12	null	2025-08-15 13:43:19.477	2025-09-03 20:00:50.828	\N
ae027eee-a008-43c7-a8a9-eaa7fac31450	-31.31	2025-08-07	\N	USD		POINT OF SALE PURCHASE USA UT HERRIMAN, PEACH AND BEE PRODUCE 13256 - 000013503951	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2ff6f7d5-876a-4e2b-a62b-8020dfd5e259	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-01	255.94	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	\N
17bf15bd-6606-49a7-ae5e-f32e36cf80cc	-14.33	2025-07-24	\N	USD		POINT OF SALE PURCHASE USA WY LARAMIE, WAL-MART #1412 4308 E GRAND AVE - 000000705493	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-24-02	709.02	null	2025-08-15 06:44:40.261	2025-08-22 06:03:14.276	\N
22291402-2632-4a7a-b6e2-a1370b0f9ddf	-53.66	2025-08-16	2025-08-16	USD	\N	PENDING - 08/16 - STATE FARM INSURANCE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	3af7197b-95bc-41ac-b900-6edd277f744e	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-16-01	\N	null	2025-08-16 13:41:43.411	2025-08-18 15:24:51.702	\N
151dd499-4553-45c0-a10a-bd2befce4d46	-16.06	2025-06-17	2025-06-14	USD	\N	VISA - 06/14 MSP AIRP LEEANN CHIN 121 SAINT PAUL MN 01443	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-17-03	-286.02	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4a6044ce-b667-44ec-9232-8e5835079ab9	21.19	2025-06-16	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-08	-147.11	null	2025-08-15 06:44:40.261	2025-09-03 05:03:24.323	145e9a16-7e2f-4fc8-954e-c5c04f2a101a
1806564f-eab5-46cd-9b81-e5653ab6f19f	-435	2025-08-14	\N	USD	m	MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-05	2320.7	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.833	a82691d8-9a30-4d4a-9509-f81b5c49e85f
c2ef5be9-d427-49a3-9a32-5c208881ccbb	86	2025-08-23	2025-08-25	USD	for elk freezer	ZELLE DANIEL G DEAKIN 866-224-2158;523500P0JLLY;2025-08-25;CR	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-23-01	706.95	null	2025-08-27 04:02:47.324	2025-09-03 20:00:50.805	\N
9e6f64fd-9bee-43b3-869e-32e04472b690	23.61	2025-07-28	\N	USD		MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-28-01	-23.61	null	2025-08-15 06:44:40.261	2025-09-03 06:45:41.332	bce0209d-e93d-44d7-896f-c3e8e9afcdf5
7b92c7e9-24f5-4001-8dd2-42aa2a4937d9	-11.05	2025-07-10	2025-07-10	USD	\N	PENDING - 07/10 - WENDYS 6094	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-06	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
80d9df07-6fc8-4edd-977a-5787fa6b8785	140.82	2025-07-10	\N	USD		POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-04	208.64	null	2025-08-15 06:44:40.261	2025-09-03 06:02:41.603	50f0a6f4-1151-4b27-8776-e9f6f9dab17f
977dfa9d-d5a5-4bb0-821c-129ad00f01b8	-34.37	2025-07-28	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WM SUPERCENTER # 136 W STATE ROAD 73 - 000000472278	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-28-04	557.86	null	2025-08-15 06:44:40.261	2025-08-27 05:33:41.547	\N
25191cac-361b-44cf-a5c2-b86de442908b	-7.6	2025-08-26	2025-08-26	USD	\N	PENDING - 08/26 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-26-01	\N	null	2025-08-27 04:02:47.33	2025-08-28 16:10:57.351	\N
9e5b4830-f874-40f7-a917-51372fd6e766	-28.83	2025-06-14	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-14-03	3130.41	{"date": "2025-06-14", "name": "MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT", "amount": 28.83, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-14-03", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "BnAEJNMvNdCyR1vrXNE0HLRzDMX3R9FRR6pBL4", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-09-03 05:03:06.959	7a40530a-38a8-42da-a4c4-b922c6e2115c
4c20d0ee-fe35-4388-86c6-de959293e73e	-35.67	2025-08-04	\N	USD		POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, MAVERIK #380 - 000000825422	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-04-01	460.72	null	2025-08-15 06:44:40.261	2025-09-03 05:00:54.696	\N
67da2e9a-a9c4-4c7e-a700-2328562030c4	-197.59	2025-07-10	\N	USD		POINT OF SALE PURCHASE USA UT HERRIMAN, WINCO FOODS #159 11969 - 000000108652	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	7d811758-d002-4108-89cc-62b4b8516db5	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-05	11.05	null	2025-08-15 06:44:40.261	2025-08-18 22:49:59.749	\N
f79a74d6-d4e2-4a87-a074-cab8fa9b2187	140.82	2025-07-10	\N	USD		MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-02	0	null	2025-08-15 06:44:40.261	2025-09-03 06:46:06.519	b2418016-b8a1-40d5-b567-994d7e00b23a
3fa970d0-d0a7-4951-a58a-b6ee912948d0	-14.7	2025-06-03	\N	USD		VISA - 05/31 WENDY'S 6671 EAGLE MOUNTAI UT 031551	f	f	4302 E Pony Express Pkwy	\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-03-02	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9d58961f-24cc-4302-9ee1-a5ba4a0b32c7	-11.05	2025-07-10	2025-07-10	USD	\N	PENDING - 07/10 - WENDYS 6094	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
7e5e4550-aacf-4152-bf95-3562994a02b4	-2	2025-08-15	2025-08-15	USD	\N	PENDING - 08/15 - EAGLE MOUNTAIN CITY	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-05	\N	null	2025-08-15 17:23:00.505	2025-08-18 15:24:51.696	\N
d15b3498-6fcd-41b9-ab10-0dd65984afc7	-17.69	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-08	2983.93	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:34.162	f6578f11-dc89-4a75-8a33-0f9e7fda735e
f71ae439-3999-4dc3-a342-29968584ce9c	16.06	2025-06-14	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-14-02	-44.89	null	2025-08-15 06:44:40.261	2025-09-03 05:03:47.354	8e046abd-eee9-42b4-80b3-9f413848e5c6
4d147426-ae89-41c4-aa48-138ad0591e4b	-23.61	2025-07-29	2025-07-27	USD	\N	PENDING - 07/27 - LITTLE AMERICA WEST GAS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c686d30a-73e4-42ca-bfdf-e8674c8231aa	-5.5	2025-07-07	\N	USD		MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-01	13677.5	null	2025-08-15 06:44:40.261	2025-09-03 06:46:11.337	4ca376a3-ba11-4286-a295-f355a694eacf
4fac5386-516c-49b7-a9a0-1a76c3790f92	-34.45	2025-08-07	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-02	15519.93	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	9002bd4a-ef1b-4410-9d25-8a6f08bf90fd
a82691d8-9a30-4d4a-9509-f81b5c49e85f	435	2025-08-14	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-02	16653.49	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.81	1806564f-eab5-46cd-9b81-e5653ab6f19f
914729e1-11dd-4b6f-87bf-21db9b37d027	-6	2025-06-10	\N	USD	\N	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-01	6	null	2025-08-15 06:44:40.261	2025-09-03 05:04:10.12	5e94a215-08cf-421e-ac9e-fdb9fc7d5a39
4ca376a3-ba11-4286-a295-f355a694eacf	5.5	2025-07-07	\N	USD		MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-02	\N	null	2025-08-15 06:44:40.261	2025-09-03 06:46:11.335	c686d30a-73e4-42ca-bfdf-e8674c8231aa
e43b7af8-cc3b-48fd-b0e4-efcae52894d6	-1.07	2025-09-02	2025-09-01	USD	rachel polytopia skin	VISA - 09/01 GOOGLE THE BATTLE OF 650-2530000 CA 031506	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	12a43531-7e0c-451a-85df-7bd727f4ec69	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-01	3781.87	null	2025-09-02 20:33:53.664	2025-09-03 20:00:50.83	\N
10449371-b6a4-488f-81c3-3516633020b8	-5.5	2025-07-07	\N	USD		POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-01	5.5	null	2025-08-15 06:44:40.261	2025-09-03 06:02:25.897	62789f50-e3d4-4ccb-8fb8-e1cb026aa85e
61a1af63-49c6-44ca-8518-0767896532b5	-22.25	2025-08-04	2025-08-02	USD		VISA - 08/02 DESERET BOOK 51310 SARATOGA SPRI UT 001348	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	bc3b2e2e-9993-4ba8-aaf1-52a71d83fbed	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-04-02	438.47	null	2025-08-15 06:44:40.261	2025-09-03 05:00:54.701	\N
f19d9d54-4468-42e9-a4d9-7d1fb3642d52	-26.71	2025-08-30	2025-08-28	USD	HC school photos	VISA - 08/28 EASTMAN ADAMS PHOTOGRA WWW.EASTMANAD UT 0289	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	db3c647f-1dae-402e-b9b3-022c6bb44573	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-30-01	3891.42	null	2025-09-02 06:00:51.305	2025-09-03 20:00:50.82	\N
3ad23759-fad1-4bfd-9e9c-991626c8e0d4	-56.5	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-12	2784.71	\N	2025-08-15 06:44:40.261	2025-09-03 05:04:29.52	cfce1d41-8063-4783-aff7-fb2160a2aa68
ea96bd79-1603-49c4-b58a-55125804c691	-25	2025-07-25	2025-07-23	USD		VISA - 07/23 DINOSAUR NATIONAL MONMT DINOSAUR CO 023069	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-25-01	684.02	null	2025-08-15 06:44:40.261	2025-08-22 06:03:14.274	\N
355adbfe-9471-4db3-96b6-49f02f92b08c	-15.41	2025-08-21	\N	USD	\N	AUTOMATIC WITHDRAWAL, DOMINION ENERGY QGC PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	04fe2780-aac4-47b3-84dc-1638a365a176	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-21-01	658.85	null	2025-08-22 05:14:12.552	2025-09-03 20:00:50.805	\N
eedd955a-7d53-49b4-bc6a-1013b586ee71	-10.18	2025-08-25	2025-08-22	USD	\N	VISA - 08/22 SMITH'S FOOD #4207 SARATOGA SPRI UT 022187	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-25-02	868.77	null	2025-08-27 04:02:47.323	2025-09-03 20:00:50.806	\N
2d33daa8-883a-49e4-a06e-86ca7f9ae46a	-7.6	2025-08-26	2025-08-26	USD	\N	PENDING - 08/26 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-26-01	\N	null	2025-08-27 04:02:47.326	2025-08-28 16:10:57.332	\N
9002bd4a-ef1b-4410-9d25-8a6f08bf90fd	34.45	2025-08-07	\N	USD	\N	MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-02	0	\N	2025-08-15 06:44:40.261	2025-09-03 20:00:50.849	4fac5386-516c-49b7-a9a0-1a76c3790f92
250a27d1-cac6-495f-a05a-200e8900b60a	125.13	2025-06-23	\N	USD	\N	MOBILE BANKING PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-07	\N	null	2025-08-15 06:44:40.261	2025-09-03 05:04:48.21	2bb37182-730a-4a61-9d8c-666a0bf0fcd4
5b873442-38dd-4339-a42e-c47839f97dd0	-2	2025-08-15	2025-08-15	USD	\N	PENDING - 08/15 - EAGLE MOUNTAIN CITY	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-01	\N	null	2025-08-15 17:23:00.52	2025-08-18 15:24:51.702	\N
86133857-9d62-4381-9b03-e6e2f98d579d	-41.9	2025-07-19	2025-07-17	USD	\N	VISA - 07/17 MAVERIK #380 EAGLE MOUNTAI UT 017595	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-19-01	1082.31	null	2025-08-15 06:44:40.261	2025-08-21 16:12:47.959	\N
a816fa81-a7f5-4d43-9a86-fff4adc39f15	-33.8	2025-06-23	2025-06-23	USD	\N	PENDING - 06/23 - LIBRO.FM AUDIOBOOKS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e02eff9c-e414-46cc-bc82-eade460c2dc3	100	2025-07-07	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-03	190.43	null	2025-08-15 06:44:40.261	2025-09-03 06:02:33.092	036c9691-12fe-47c5-96b3-4545e69978a1
e7b8f5d1-c88d-4e7c-b062-188d7be09f4e	-1.67	2025-08-14	2025-08-12	USD	\N	VISA - 08/12 RIDLEY'S 1165 EAGLE MOUNTAI UT 012593	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dec45eae-1d76-405e-be2f-710e55bc2215	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-02	3769.22	null	2025-08-15 12:34:20.978	2025-09-03 20:00:50.819	\N
7a57c2d9-e797-48df-9d42-e865c3e4600e	-3.46	2025-07-18	2025-07-15	USD	\N	VISA - 07/15 138 ARCTIC CIRCLE EAGLE MOUNTAI UT 015641	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d38b6e7e-ddaf-4b47-a3f5-a77e584ec62d	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-18-01	1131.53	null	2025-08-15 06:44:40.261	2025-09-03 06:58:00.18	\N
6f6b61d6-131d-4676-8b5e-598ae83603d7	-1	2025-07-10	2025-07-08	USD		VISA - 07/08 SARATOGA SPRINGS TEMPLE SARATOGA SPRI UT 008	f	f	987 S Ensign Dr	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	af8bb24b-5ae8-4f16-a834-246d7cfd31a4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-01	132.6	{"date": "2025-07-10", "name": "VISA - 07/08 SARATOGA SPRINGS TEMPLE SARATOGA SPRI UT 008", "amount": 1, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": "987 S Ensign Dr", "country": null, "postal_code": "84045", "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-10-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Saratoga Springs Utah Temple", "counterparties": [{"name": "Saratoga Springs Utah Temple", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "XJg01MxLMPHvoK8DNxLos4MBzx3RbPCzO57J5", "authorized_date": "2025-07-08", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GOVERNMENT_AND_NON_PROFIT", "detailed": "GOVERNMENT_AND_NON_PROFIT_DONATIONS", "confidence_level": "MEDIUM"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GOVERNMENT_AND_NON_PROFIT.png"}	2025-08-15 06:44:40.261	2025-08-18 22:48:08.002	\N
a89600ea-f74d-4ba0-9738-bc057b0a7f5f	-34.45	2025-08-07	\N	USD	\N	POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-01	34.45	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.85	92a0e697-7227-48a1-87ea-941b9e2c7e73
9aab0e84-c1be-4480-a68c-9cec202b3fac	-70	2025-07-17	\N	USD		AUTOMATIC WITHDRAWAL, TRANSAMERICA INSINSPAYMENT PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	75790fa2-060c-457a-859b-eaa387d3f648	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-02	1134.99	null	2025-08-15 06:44:40.261	2025-08-18 22:53:30.266	\N
4c334cff-1060-4454-b949-5668ace49c80	-72.58	2025-07-07	2025-07-04	USD	\N	VISA - 07/04 OLIVE GARDEN 0021705 IDAHO FALLS ID 004652	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	0e98e918-9fb7-4e76-b8d4-2be328938bce	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-07	172.56	null	2025-08-15 06:44:40.261	2025-08-21 15:30:24.672	\N
747a1412-47ad-4980-b192-697c98f2b478	-19.09	2025-06-23	2025-06-20	USD		VISA - 06/20 CHEZ SCHWARTZ'S A COTE MONTREAL CD 020187	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-04	44.76	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
412a3207-d596-4edf-84b3-35a84d22ac49	-19.45	2025-07-21	2025-07-17	USD	\N	VISA - 07/17 DOMINO'S 9102 123-456-7890 UT 017262	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-21-02	1012.86	null	2025-08-15 06:44:40.261	2025-08-19 13:00:50.07	\N
a47fb9b2-e231-4d9b-8bdd-8a8cd8618e09	-10.44	2025-07-29	2025-07-28	USD	\N	PENDING - 07/28 - CLOUDFLARE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6d26f075-6cfb-4ac0-b42f-20a695128c7d	-7.32	2025-07-18	2025-07-16	USD	\N	VISA - 07/16 SMITH'S FOOD #4207 SARATOGA SPRI UT 016480	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-18-02	1124.21	null	2025-08-15 06:44:40.261	2025-08-18 22:55:12.131	\N
46689445-7831-4a3d-b727-1d2d047b1dee	-14.9	2025-07-07	\N	USD	Car dinner	POINT OF SALE PURCHASE USA ID MCCAMMON, FLYING J #641 587 E US HWY 30 - 000000037962	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f4b5be3d-a85e-4be3-8f8e-f4f0e5fc527d	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-04	175.53	null	2025-08-15 06:44:40.261	2025-08-18 22:44:51.357	\N
141df1cf-74ce-4b4f-a44c-92a6f1d3352d	-43.05	2025-07-29	2025-07-27	USD	\N	PENDING - 07/27 - LITTLE AMERICA WYOMI	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0da1307a-aa6d-47dc-9a2d-ef80d06bea80	-31.31	2025-07-29	2025-07-28	USD	\N	PENDING - 07/28 - CARPARTSCOM *	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
95857e07-ed4c-4d3b-a588-c76d54b0e9af	103.74	2025-07-07	\N	USD		AUTOMATIC DEPOSIT, AFCU OLB, CICOBK CK WEBXFR ARTHUR MATTHIAS P2P WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-05	279.27	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
91231b69-6c77-49b9-9c3e-f7ccc671f4b5	-14	2025-06-26	\N	USD		VISA - 06/23 123 ARCTIC CIRCLE SARATOGA SPRI UT 023519	f	f	1266 N Redwood Rd	40.38504	-111.915199	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-26-02	921.3	{"date": "2025-06-26", "name": "VISA - 06/23 123 ARCTIC CIRCLE SARATOGA SPRI UT 023519", "amount": 14, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": 40.38504, "lon": -111.915199, "city": "Saratoga Springs", "region": "UT", "address": "1266 N Redwood Rd", "country": null, "postal_code": "84045", "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-26-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Arctic Circle", "counterparties": [{"name": "Arctic Circle", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "7o6nygJLg4Hg4avq89XgszkZdbp4dwfDkDanY", "authorized_date": "2025-06-23", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_RESTAURANT", "confidence_level": "MEDIUM"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
34389030-6d57-4fb2-8c82-3403991aca59	-270.13	2025-08-07	\N	USD	\N	POINT OF SALE PURCHASE USA UT HERRIMAN, WINCO FOODS #159 WINCO1 - 000000651869	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	7d811758-d002-4108-89cc-62b4b8516db5	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-03	20.26	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.813	\N
dab8131a-ba4c-4f2b-a09e-b413647e3b18	-13.52	2025-08-14	2025-08-12	USD	\N	VISA - 08/12 AMAZON MKTPL*W70IT67K3 AMZN.COM/BILL WA 0127	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-03	3755.7	null	2025-08-15 12:34:20.981	2025-09-03 20:00:50.817	\N
0408e858-dd72-40ec-8651-6892d639da26	-24.38	2025-07-26	\N	USD		POINT OF SALE PURCHASE USA WY LARAMIE, BIG D #27 2901 E GRAND AVE - 000000944095	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-26-01	633.14	null	2025-08-15 06:44:40.261	2025-08-22 06:03:14.275	\N
dc510458-c369-4f3a-9f48-57434d237836	-37.5	2025-08-27	2025-08-27	USD	\N	PENDING - 08/27 - DESERET BOOK 51310	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-03	\N	null	2025-08-28 04:39:19.002	2025-08-29 12:34:04.692	\N
17fb7453-3131-42a3-9b82-07d31fc29029	-25	2025-07-28	\N	USD		AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-28-05	532.86	null	2025-08-15 06:44:40.261	2025-08-27 05:33:41.548	\N
187aeb27-f943-470f-b3d8-8cdec78664b9	-20	2025-07-23	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-23-06	737.93	null	2025-08-15 06:44:40.261	2025-08-22 05:14:12.545	\N
8228e2df-f4d5-4a7d-b250-7227a70dea66	-28.89	2025-07-23	\N	USD		POINT OF SALE PURCHASE USA UT VERNAL, WAL-MART #1572 1180 WEST HWY 40 - 000098486059	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-23-04	777.11	null	2025-08-15 06:44:40.261	2025-08-22 05:14:12.544	\N
8d462eee-9559-461e-a8ac-9dc16e536275	-100	2025-08-07	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-07-01	15554.38	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	4356cbfe-3edd-415e-b57b-c5f1fae8949c
6e056eaa-e937-44de-a19c-d0571dc1e9c8	-10.44	2025-07-30	2025-07-29	USD		VISA - 07/29 CLOUDFLARE CLOUDFLARE.CO CA 028493	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-30-02	4848.38	null	2025-08-15 06:44:40.261	2025-08-28 22:00:48.653	\N
fb4a757f-5da3-4a33-ab08-b7f3efe53ecf	-14.13	2025-08-15	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, DOLLAR TREE 1458 WEST COMMERCE DR - 000000017169	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	23ff673d-8053-4d97-bd23-f0a3b1af57c4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-05	2129.99	null	2025-08-15 18:00:47.124	2025-09-03 20:00:50.817	\N
d5a18522-2614-4c8c-a56f-c602c79e4052	-53.66	2025-08-16	2025-08-16	USD	\N	PENDING - 08/16 - STATE FARM INSURANCE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	3af7197b-95bc-41ac-b900-6edd277f744e	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-16-01	\N	null	2025-08-16 13:41:43.421	2025-08-18 15:24:51.697	\N
c85548ed-5998-476b-85b1-e2aab49fa1ed	-360	2025-08-15	\N	USD	note	AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	af8bb24b-5ae8-4f16-a834-246d7cfd31a4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-09	1615.35	null	2025-08-16 13:41:43.418	2025-09-03 20:00:50.805	\N
48fac275-0a5d-4fe0-972e-031120a6b30f	-86	2025-08-27	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-01	610.62	null	2025-08-28 04:39:19.002	2025-09-03 20:00:50.806	acb0ada5-6305-4f08-9527-5f64b963713a
0eb9183c-7c4a-412a-9d4c-815541f2c50d	-172	2025-08-27	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-02	438.62	null	2025-08-28 04:39:19.004	2025-09-03 20:00:50.806	34f56b75-40dd-4256-b1b0-ec0bca9bc485
d117f042-b050-4c0c-8c4c-4db18ee85c30	-37.9	2025-08-22	2025-08-20	USD	\N	VISA - 08/20 CHEVRON 0306371 EAGLE MOUNTAI UT 020650	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dc463616-53ef-4b58-8a32-43e86c148ff4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-22-01	620.95	null	2025-08-27 04:02:47.32	2025-09-03 20:00:50.807	\N
53ebc916-3ebf-4f8b-a80b-823d97726367	-11.5	2025-06-10	\N	USD	\N	VISA - 06/08 THANKSGIVING POINT 180-1766503 UT 008629	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-02	176.24	{"date": "2025-06-10", "name": "VISA - 06/08 THANKSGIVING POINT UT 008629", "amount": 11.5, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-10-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Thanksgiving Point", "counterparties": [{"name": "Thanksgiving Point", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "Qvg1nQA9Q0CqwnBdEepJFPjNzOYDj8CooZQ8dm", "authorized_date": "2025-06-08", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "ENTERTAINMENT", "detailed": "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_ENTERTAINMENT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4254f10f-cf10-4395-8e11-ab89ae0d6d3f	-23.14	2025-06-20	2025-06-17	USD		VISA - 06/17 CHOCOLATERIE DE L ILE SAINTE-PETRON CD 01715	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-07	73.54	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
07f0d0cc-1674-48da-976f-90db9d2b8aaa	-10.44	2025-07-29	2025-07-28	USD	\N	PENDING - 07/28 - CLOUDFLARE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a3915a4d-ea1d-4403-bb31-aaefb1ba9648	-43.05	2025-07-29	2025-07-27	USD	\N	PENDING - 07/27 - LITTLE AMERICA WYOMI	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5ebaa1d2-a409-4c1a-9402-b83af63094c7	-31.31	2025-07-29	2025-07-28	USD	\N	PENDING - 07/28 - CARPARTSCOM *	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
172b1729-91a3-462d-9612-8b27cb423791	-1.07	2025-09-02	2025-08-31	USD	\N	PENDING - 08/31 - GOOGLE THE BATTLE OF	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-01	\N	null	2025-09-02 06:00:51.337	2025-09-02 17:12:41.335	\N
91766d3a-ea18-4d81-bd86-937da0cd96be	-5.39	2025-08-15	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, DOLLAR TREE 1458 WEST COMMERCE DR - 000000017170	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	23ff673d-8053-4d97-bd23-f0a3b1af57c4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-06	2124.6	null	2025-08-15 18:00:47.124	2025-09-03 20:00:50.817	\N
a3ac637d-07f1-4472-8b1a-a8c9cfe8612b	-20.26	2025-08-08	2025-08-05	USD	Temple Tuesday	VISA - 08/05 CHICK-FIL-A #03348 TAYLORSVILLE UT 005309	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	4cfef107-cd65-4a0c-918e-34e6e1f4f6a8	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-08-01	100	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.828	\N
5e6fe0c2-7345-4236-8e1a-869ec09db450	-131	2025-07-02	\N	USD		FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-02-01	131	null	2025-08-15 06:44:40.261	2025-09-03 06:02:09.76	ff676339-f450-44bb-8c29-0f5d204ce19d
170e1872-c0a8-4069-9939-abba4056168b	-25.48	2025-08-15	\N	USD	\N	POINT OF SALE PURCHASE USA UT LEHI, HARMONS - TRAVERSE 18 - 000000771705	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-07	2099.12	null	2025-08-16 03:27:45.831	2025-09-03 20:00:50.798	\N
99f847fb-003a-400c-bcc8-a3d511c1d232	-34.13	2025-07-07	2025-07-04	USD		VISA - 07/04 OLIVE GARDEN 0021705 IDAHO FALLS ID 004990	f	f	1305 W Broadway St	43.495399	-112.052795	Idaho Falls	ID		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	0e98e918-9fb7-4e76-b8d4-2be328938bce	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-06	245.14	{"date": "2025-07-07", "name": "Olive Garden", "amount": 34.13, "pending": false, "website": "olivegarden.com", "category": null, "datetime": null, "location": {"lat": 43.495399, "lon": -112.052795, "city": "Idaho Falls", "region": "ID", "address": "1305 W Broadway St", "country": null, "postal_code": "83402", "store_number": null}, "logo_url": "https://plaid-merchant-logos.plaid.com/olive_garden_699.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-07-06", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Olive Garden", "counterparties": [{"name": "Olive Garden", "type": "merchant", "website": "olivegarden.com", "logo_url": "https://plaid-merchant-logos.plaid.com/olive_garden_699.png", "entity_id": "jBdgR49b48OQQo7gL171XNdOd73zwBbJXeO3A", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "XJg01MxLMPHvoK8DNxLZC5qy9wR0XPujqoOEya", "authorized_date": "2025-07-04", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "jBdgR49b48OQQo7gL171XNdOd73zwBbJXeO3A", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_RESTAURANT", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d37a1bf0-5d4f-4338-8bf8-c0714024f117	-53.66	2025-08-18	2025-08-16	USD	\N	VISA - 08/16 STATE FARM INSURANCE 800-956-6310 IL 016358	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	3af7197b-95bc-41ac-b900-6edd277f744e	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-02	1559.69	null	2025-08-18 21:02:11.054	2025-09-03 20:00:50.801	\N
63131b33-4638-4838-8966-878d606715d5	-53.66	2025-07-08	2025-07-08	USD	\N	PENDING - 07/08 - STATE FARM INSURANCE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-08-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
98a4df92-278b-418e-98e4-779578ead19f	-50	2025-07-21	\N	USD		FUNDS TRANSFER TO VISA CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-21-01	1032.31	null	2025-08-15 06:44:40.261	2025-09-03 06:45:55.416	a2299a9b-e6d0-4af6-aad4-c3afca0900ee
81766230-f823-4afc-ac35-8e72aa38c1a8	-1	2025-07-08	2025-07-08	USD	\N	PENDING - 07/08 - SARATOGA SPRINGS TEM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-08-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c1771b3b-8533-4fff-9301-660c04ae77e3	-100	2025-07-12	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-12-01	13336.68	null	2025-08-15 06:44:40.261	2025-09-03 06:02:52.513	320e5fed-8680-49c3-bd61-6e7ecb37e653
c2cb90ee-d5f6-49eb-b4d8-ed40e94a0439	-2	2025-08-18	2025-08-16	USD	\N	VISA - 08/16 EAGLE MOUNTAIN CITY 801-789-6600 UT 015418	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	27a45ff7-2c93-428c-824b-e9ac869532be	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-01	1613.35	null	2025-08-18 15:24:51.712	2025-09-03 20:00:50.801	\N
62789f50-e3d4-4ccb-8fb8-e1cb026aa85e	5.5	2025-07-07	\N	USD		POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-01	125.6	null	2025-08-15 06:44:40.261	2025-09-03 06:02:25.895	10449371-b6a4-488f-81c3-3516633020b8
fd2b4716-4951-48ae-a0af-f3087b6d9630	-5.82	2025-09-02	2025-08-30	USD	\N	PENDING - 08/30 - JACK IN THE BOX 6045	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-02	\N	null	2025-09-02 06:00:51.337	2025-09-02 17:12:41.335	\N
aded1ae9-bce4-42e2-92bd-9081e0a1d712	-37.5	2025-08-27	2025-08-27	USD	\N	PENDING - 08/27 - DESERET BOOK 51310	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-01	\N	null	2025-08-28 04:39:19.032	2025-08-29 12:34:04.69	\N
bce0209d-e93d-44d7-896f-c3e8e9afcdf5	-23.61	2025-07-28	\N	USD		MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-28-01	609.53	null	2025-08-15 06:44:40.261	2025-09-03 06:45:41.329	9e6f64fd-9bee-43b3-869e-32e04472b690
216baf0b-c9e9-4699-ad82-a2baa79026dd	500	2025-07-14	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-03	14806.68	null	2025-08-15 06:44:40.261	2025-09-03 06:03:06.021	e221ee65-9e23-411d-9bfa-7e8bbf4f2c78
0cba0864-2017-4a49-9bb6-7ce86261248e	-63.42	2025-08-09	2025-08-09	USD	\N	PENDING - 08/09 - LOS HERMANOS-PROVO	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-09-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
036c9691-12fe-47c5-96b3-4545e69978a1	-100	2025-07-07	\N	USD		MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-02	13577.5	null	2025-08-15 06:44:40.261	2025-09-03 06:02:33.09	e02eff9c-e414-46cc-bc82-eade460c2dc3
8bd32618-723b-4552-9fe3-a13f909b3b1a	200	2025-07-03	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-02	263.82	{"date": "2025-07-03", "name": "MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET", "amount": -200, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-03-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "xjDBp9469PIgJe5Yr43xfVK99mBxbQHKR7pNM", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_IN", "detailed": "TRANSFER_IN_ACCOUNT_TRANSFER", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_IN.png"}	2025-08-15 06:44:40.261	2025-09-03 06:02:15.507	0447bec1-f0d4-4450-a05a-e53b33fd88ca
2f49d2cf-b896-4e56-a10c-47a2a314f95f	30	2025-07-14	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-14-01	110.67	null	2025-08-15 06:44:40.261	2025-09-03 06:03:10.308	435683c9-9892-4207-a847-84f429e771b9
1106f967-d078-4e20-b077-297fb4456d92	-35.19	2025-06-21	2025-06-19	USD		VISA - 06/19 EPLV - BILLETTERIE JAR MONTREAL CD 019751	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-07	105.29	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
71504212-a2e3-4ae1-9c6a-fd8758fc0338	-53.66	2025-07-08	2025-07-08	USD	\N	PENDING - 07/08 - STATE FARM INSURANCE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-08-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
2dfdb578-8ad1-4bf2-a816-ccbcf871a85e	-1	2025-07-08	2025-07-08	USD	\N	PENDING - 07/08 - SARATOGA SPRINGS TEM	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-08-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
605d1c7e-5fd6-46a1-97ad-5dfaa7942d22	-53.66	2025-07-10	2025-07-08	USD		VISA - 07/08 STATE FARM INSURANCE 800-956-6310 IL 008908	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	3af7197b-95bc-41ac-b900-6edd277f744e	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-03	67.82	{"date": "2025-07-10", "name": "State Farm", "amount": 53.66, "pending": false, "website": "statefarm.com", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": "https://plaid-merchant-logos.plaid.com/state_farm_960.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-10-03", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "State Farm", "counterparties": [{"name": "State Farm", "type": "merchant", "website": "statefarm.com", "logo_url": "https://plaid-merchant-logos.plaid.com/state_farm_960.png", "entity_id": "8B5dWMaXnbZQOa82WQ1XMJo1kWKmDJy73ogLK", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "eRPv4KEjK7tBzvDyV4Rzsy5ENKVwPBF4Lzj6q", "authorized_date": "2025-07-08", "payment_channel": "online", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": "8B5dWMaXnbZQOa82WQ1XMJo1kWKmDJy73ogLK", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GENERAL_SERVICES", "detailed": "GENERAL_SERVICES_INSURANCE", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GENERAL_SERVICES.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
57bf344a-a82b-423f-b356-34cd129e5732	-1	2025-08-09	2025-08-09	USD	\N	PENDING - 08/09 - PROVO CITY CENTER TEMP	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-09-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c68b7f52-a659-4321-a3a4-27c418a717ef	-1000	2025-06-27	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-27-04	3479.08	{"date": "2025-06-27", "name": "MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET", "amount": 1000, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-27-04", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "1arNDz0VzRiPm9ypO4RVUBmLNVdvybFgMYrZj", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ff594fe6-d9c5-4193-8ea6-dbb93bc3e9f9	-26.5	2025-07-25	2025-07-24	USD		VISA - 07/24 SUBWAY 14943 CRAIG CO 023079	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	b1ce77d0-b6fd-4034-a3b3-25092395612d	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-25-02	657.52	null	2025-08-15 06:44:40.261	2025-08-22 06:03:14.275	\N
6a911fa3-09b8-432c-9710-8e186fa7c97d	-27.56	2025-07-22	\N	USD	\N	POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, MAVERIK #380 - 000000812155	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-22-01	933.02	null	2025-08-15 06:44:40.261	2025-08-20 22:03:38.414	\N
4957088a-3360-409b-a4d4-bc01a695cbee	-50	2025-08-15	\N	USD	\N	ZELLE AARON ANDERSON 866-224-2158;522700E0AR70;2025-08-15;DR	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-01	2270.7	null	2025-08-15 12:34:20.985	2025-09-03 20:00:50.82	\N
0408802b-d651-4f53-bdda-edecaccb6873	-20	2025-09-02	2025-08-30	USD	\N	PENDING - 08/30 - CALRANCH-POCATELLO #4	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-03	\N	null	2025-09-02 06:00:51.339	2025-09-02 17:12:41.335	\N
6e50a9a1-e630-468f-99dc-734a3d4302fa	-25	2025-07-09	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-09-01	133.6	{"date": "2025-07-09", "name": "Venmo", "amount": 25, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-09-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": "Braintree"}, "account_owner": null, "merchant_name": null, "counterparties": [{"name": "Venmo", "type": "payment_app", "website": "venmo.com", "logo_url": "https://plaid-counterparty-logos.plaid.com/venmo_74.png", "entity_id": "8VRm0p98Ydk05nn1kVd1o4Zgop4n1V9DdveE6", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "PAgDQZk7ZvhPZLXEN1gZHPwJ5JAOJAtAmOOmp", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-09-03 06:03:28.715	\N
1c92c4d8-1c09-4984-8603-29abb3414593	-19.81	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-09	2964.12	{"date": "2025-06-16", "name": "MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT", "amount": 19.81, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-16-09", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "L3MdOmB5myI93ynx8bjYHKoAekbYodfjj9Mqxx", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-09-03 05:03:19.769	840a7ec1-9c0f-43bd-9d5c-69860e303d24
ff676339-f450-44bb-8c29-0f5d204ce19d	131	2025-07-02	\N	USD		FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-02-01	353.22	{"date": "2025-07-02", "name": "FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING", "amount": -131, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-02-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "MygwMA3mAKILMd5Pe0RwSrwz3La5bgfpMny9o", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_IN", "detailed": "TRANSFER_IN_ACCOUNT_TRANSFER", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_IN.png"}	2025-08-15 06:44:40.261	2025-09-03 06:02:09.758	5e6fe0c2-7345-4236-8e1a-869ec09db450
c0a7a717-5fc8-48fe-9a04-604cef89e045	832	2025-07-31	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-31-01	15638.68	null	2025-08-15 06:44:40.261	2025-09-03 06:05:46.412	bab28a50-14e9-4557-b2fd-790d6abdea14
0dafffbf-d8dd-445b-aefa-9e23cd8b6fc9	-300	2025-08-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, TRANSAMERICA INSINSPAYMENT PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	75790fa2-060c-457a-859b-eaa387d3f648	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-08	789.69	null	2025-08-19 11:00:53.33	2025-09-03 20:00:50.812	\N
e1496622-16ba-4ac6-9316-4a5d6661b428	-63.42	2025-08-09	2025-08-09	USD	\N	PENDING - 08/09 - LOS HERMANOS-PROVO	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-09-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0d92fa33-fa10-4a4b-8663-1146b118bb63	-1	2025-08-09	2025-08-09	USD	\N	PENDING - 08/09 - PROVO CITY CENTER TEMP	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-09-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
04916a05-e6cf-450f-a665-8c2828887b65	-17	2025-06-14	\N	USD	\N	VISA - 06/12 LEHI CITY RECREATION 801-768-7100 UT 011816	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-14-02	3159.24	{"date": "2025-06-14", "name": "VISA - 06/12 LEHI CITY RECREATION UT 011816", "amount": 17, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-14-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Lehi City Recreation", "counterparties": [{"name": "Lehi City Recreation", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "q34YVwm7wEIpAbRVrB67fzBrK1pMBEt55eYdka", "authorized_date": "2025-06-12", "payment_channel": "online", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "ENTERTAINMENT", "detailed": "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_ENTERTAINMENT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d715c312-ac50-48e2-8717-7908b9c2705d	-7.32	2025-07-16	2025-07-16	USD	\N	PENDING - 07/16 - SMITH'S FOOD #4207	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4c35b05c-7130-4889-b0df-77530652547f	-8.65	2025-06-14	\N	USD		VISA - 06/12 TST* ICEBERG DRIVE INN - SARATOGA SPRI UT 01	f	f	1012 N Redwood Rd Unit A	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-14-01	3176.24	{"date": "2025-06-14", "name": "VISA - 06/12 TST* ICEBERG DRIVE INN - SARATOGA SPRI UT 01", "amount": 8.65, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": "1012 N Redwood Rd Unit A", "country": null, "postal_code": "84045", "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-14-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "IceBerg Drive Inn", "counterparties": [{"name": "IceBerg Drive Inn", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "VERY_HIGH"}, {"name": "Toast", "type": "payment_terminal", "website": "pos.toasttab.com", "logo_url": "https://plaid-counterparty-logos.plaid.com/toast_182.png", "entity_id": "VmnapWdRwMn50bwvEaKZRKNkQXW1LvNrwdLeW", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "PAgDQZk7ZvhPZLXEN1gKCqr81o5drkC55Xx9Kd", "authorized_date": "2025-06-12", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_RESTAURANT", "confidence_level": "MEDIUM"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e4bc98c4-0519-4dff-beff-f72f6bd9b39c	-88.61	2025-07-23	2025-07-21	USD	\N	VISA - 07/21 STRAIGHT UP DANCE STRAIGHTUPDAN UT 021897	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-23-01	844.41	null	2025-08-15 06:44:40.261	2025-08-22 05:14:12.544	\N
5c44aaa5-dd3f-44d3-90ae-4bbf786fbd4c	-11.12	2025-07-10	2025-07-07	USD		VISA - 07/07 ZAO - TRAVERSE LEHI UT 007186	f	f		\N	\N	Lehi	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-10-02	121.48	{"date": "2025-07-10", "name": "VISA - 07/07 ZAO - TRAVERSE LEHI UT 007186", "amount": 11.12, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Lehi", "region": "UT", "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-10-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "ZAO", "counterparties": [{"name": "ZAO", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "NKm6EQybQkHgZwQ1N68ZhxJpXYAM5ntyp9KAw", "authorized_date": "2025-07-07", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_RESTAURANT", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a9116fc3-50a7-4a67-9254-36e992898359	-19.18	2025-07-23	\N	USD		POINT OF SALE PURCHASE USA CO CRAIG, MAVERIK 5009 - 000000804189	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-23-05	757.93	null	2025-08-15 06:44:40.261	2025-09-03 06:29:21.461	\N
78b76808-720e-425d-9304-2ae5b1cd2eac	-250	2025-08-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2983aae0-c54b-4e9b-9571-91c1b44b4063	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-07	1089.69	null	2025-08-19 11:00:53.329	2025-09-03 20:00:50.802	\N
23f13b71-a5ea-4941-9154-763043b5abc0	-22.25	2025-08-02	2025-08-01	USD		PENDING - 08/01 - DESERET BOOK 51310	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-02-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ae150aaa-6506-40e2-bd2a-bae3c9c998dc	-100	2025-07-29	\N	USD	Costco trip. Chicken? Other things. Only ended up being 50-60	ZELLE RACHEL JUDD 866-224-2158;521000E04H7U;2025-07-30;DR	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-29-01	432.86	null	2025-08-15 06:44:40.261	2025-08-28 05:00:48.798	\N
b065dd6a-942e-49f2-a0bc-ac1f05a33257	-43.89	2025-08-28	\N	USD	\N	POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-01	43.89	null	2025-08-28 08:06:55.143	2025-09-03 20:00:50.849	db1c3087-2336-45f1-9f9d-7b9bb6a4ab6e
93e75786-1e2d-47bd-801b-454c63530886	-9.42	2025-09-03	2025-09-03	USD	\N	PENDING - 09/03 - WENDY'S 6671	t	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-03	\N	null	2025-09-03 20:00:50.794	2025-09-03 20:00:50.893	\N
9778e2f9-becd-457b-a42d-2b5e56ed374d	-100	2025-08-09	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-09-01	15419.93	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	bc8e54cb-462e-4367-a7fc-b359d4e6712d
7bc59d45-afe6-4bf5-af4b-7480612d11f6	-4	2025-08-01	\N	USD		AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	49eec762-1ec7-4e31-93da-473e7071c166	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-01-02	3888.02	null	2025-08-15 06:44:40.261	2025-09-03 08:16:03.387	\N
326874fb-05ed-4fbc-8598-134ba691a132	-7.32	2025-07-16	2025-07-16	USD	\N	PENDING - 07/16 - SMITH'S FOOD #4207	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-06	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
33ce69fc-0874-4681-b6bc-df576decf374	-360	2025-07-16	\N	USD		AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	af8bb24b-5ae8-4f16-a834-246d7cfd31a4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-05	1263.73	null	2025-08-15 06:44:40.261	2025-08-18 22:51:52.396	\N
95bf9242-1a16-4999-9c95-480a21c7c9a6	-50	2025-09-01	2025-09-02	USD	\N	ZELLE RACHEL JUDD 866-224-2158;524400C0745O;2025-09-02;DR	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-01-01	3807.82	null	2025-09-02 06:00:51.307	2025-09-03 20:00:50.82	\N
d3331192-a7da-4a63-8ed1-22a4d8494526	-2724.81	2025-08-01	\N	USD		AUTOMATIC WITHDRAWAL, M & T MORTGAGE MTG PYT WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-01-05	496.39	null	2025-08-15 06:44:40.261	2025-09-03 08:20:38.061	\N
6d78ee2e-fd74-40b2-9bc2-bfef999996f3	-14.49	2025-07-23	\N	USD		POINT OF SALE PURCHASE USA UT DUCHESNE, SHELL SERVICE STATION - 000000630410	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	5210ccac-6041-4a06-9f8e-fe36c9779562	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-23-02	829.92	null	2025-08-15 06:44:40.261	2025-08-22 05:14:12.544	\N
9bbe728c-39c4-47d6-89e2-95bc63e87b9b	-50	2025-07-16	\N	USD		AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2983aae0-c54b-4e9b-9571-91c1b44b4063	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-03	1873.73	null	2025-08-15 06:44:40.261	2025-09-03 06:01:16.557	\N
7c42768c-8042-4e98-8b39-7ec915fbad8e	-439.19	2025-08-28	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-02	16428.41	null	2025-08-28 08:06:55.106	2025-09-03 20:00:50.828	a37dbdcc-c24f-466d-b2ec-ae5b648e5f3a
bcfc44ec-b730-4d82-a676-9ef6e006d3a7	131.13	2025-07-03	\N	USD		MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-01	\N	null	2025-08-15 06:44:40.261	2025-09-03 06:46:16.205	d9761a4a-8920-4dbd-a3e1-3b25c1aa1ce1
b6659059-5df7-469b-a6f2-0a30c9e0af71	15.7	2025-07-31	\N	USD		DIVIDEND EARNED FOR PERIOD OF 07/01/2025 THROUGH 07/31/2025 ANNUAL PERCENTAGE YIELD EARNED IS 1.30%	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-31-02	15654.38	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.178	\N
0da57e8f-0ba7-4f6f-b85b-0024073d48e8	-50	2025-07-16	\N	USD		AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2983aae0-c54b-4e9b-9571-91c1b44b4063	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-02	1923.73	null	2025-08-15 06:44:40.261	2025-09-03 06:01:30.243	\N
bab28a50-14e9-4557-b2fd-790d6abdea14	-832	2025-07-31	\N	USD		MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-31-02	3942.02	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.176	c0a7a717-5fc8-48fe-9a04-604cef89e045
ad397715-cade-4a76-9d18-66a5d84af256	-22.25	2025-08-02	2025-08-01	USD		PENDING - 08/01 - DESERET BOOK 51310	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-02-01	\N	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
1252bf1c-63de-452b-9491-83b1d17700af	-250	2025-07-16	\N	USD		AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2983aae0-c54b-4e9b-9571-91c1b44b4063	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-16-04	1623.73	null	2025-08-15 06:44:40.261	2025-09-03 07:04:05.939	\N
3f6a5490-c5b0-4454-9055-f133f0262e70	-22.03	2025-08-08	2025-08-08	USD	\N	PENDING - 08/08 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-08-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
ca38497b-b0d3-457d-ba52-518e3cbda517	-5.82	2025-09-02	2025-08-31	USD	\N	VISA - 08/31 JACK IN THE BOX 6045 CHUBBUCK ID 030281	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	23d17bc3-7c15-4917-9892-fdd5c0f8fab5	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-02	3776.05	null	2025-09-02 17:12:41.326	2025-09-03 20:00:50.829	\N
e4429218-1648-4ede-b45f-41fb27c45b49	-443	2025-08-01	\N	USD		AUTOMATIC WITHDRAWAL, CH JESUSCHRIST DONATION WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	af8bb24b-5ae8-4f16-a834-246d7cfd31a4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-01-04	3221.2	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.179	\N
791dc0d8-eadb-45de-8192-35cd57e42b87	-23.61	2025-07-30	2025-07-27	USD		VISA - 07/27 LITTLE AMERICA WEST GAS LITTLE AMERIC WY 027	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	0dad559b-53a0-48c2-8910-045d59fd60bf	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-30-01	\N	null	2025-08-15 06:44:40.261	2025-09-03 07:04:57.466	\N
318d91a4-f35e-4628-a4ab-5a5602f6361b	-14.86	2025-08-19	2025-08-15	USD	\N	VISA - 08/15 123 ARCTIC CIRCLE SARATOGA SPRI UT 015454	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d38b6e7e-ddaf-4b47-a3f5-a77e584ec62d	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-19-01	774.83	null	2025-08-19 11:00:53.333	2025-09-03 20:00:50.801	\N
efaba4d3-01ad-4278-8b86-819bf86b53cb	-8.12	2025-09-03	2025-09-03	USD	\N	PENDING - 09/03 - RIDLEY'S 1165	t	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-02	\N	null	2025-09-03 20:00:50.794	2025-09-03 20:00:50.893	\N
78544e2a-d4b9-48e7-8a80-1c878a9b045f	-13	2025-06-10	\N	USD		VISA - 06/07 SARATOGA SPRINGS DI SARATOGA SPRI UT 007591	f	f		\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-10-03	163.24	{"date": "2025-06-10", "name": "VISA - 06/07 SARATOGA SPRINGS DI SARATOGA SPRI UT 007591", "amount": 13, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-10-03", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Saratoga Springs Di", "counterparties": [{"name": "Saratoga Springs Di", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "nP0xgDBoD7F4Y7bAQmEeh8zg0OEezxHXXdmzar", "authorized_date": "2025-06-07", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_RESTAURANT", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
21dcb77f-4068-42f2-bd70-46ca88eb0aa7	-3.24	2025-06-13	\N	USD	\N	VISA - 06/10 WENDYS 6094 SARATOGA SPRI UT 010046	f	f	1361 N Redwood Rd	40.386951	-111.916824	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-13-01	3661.63	{"date": "2025-06-13", "name": "Wendy's", "amount": 3.24, "pending": false, "website": "wendys.com", "category": null, "datetime": null, "location": {"lat": 40.386951, "lon": -111.916824, "city": "Saratoga Springs", "region": "UT", "address": "1361 N Redwood Rd", "country": null, "postal_code": "84045", "store_number": null}, "logo_url": "https://plaid-merchant-logos.plaid.com/wendys_1114.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-13-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Wendy's", "counterparties": [{"name": "Wendy's", "type": "merchant", "website": "wendys.com", "logo_url": "https://plaid-merchant-logos.plaid.com/wendys_1114.png", "entity_id": "1YZ03w08myRAQ0mRgMvD2EBoOb92RmBXN6nmK", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "w0L9njrwj1fojbzKVYBqIDqEL14Mq6fJJP4Q3p", "authorized_date": "2025-06-10", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "1YZ03w08myRAQ0mRgMvD2EBoOb92RmBXN6nmK", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_FAST_FOOD", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d1a3fbb7-2a19-4036-a7bf-5625a83f88b2	-50	2025-06-16	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-15	2669.77	{"date": "2025-06-16", "name": "AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)", "amount": 50, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-16-15", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Betterment", "counterparties": [{"name": "Betterment", "type": "financial_institution", "website": "betterment.com", "logo_url": "https://plaid-counterparty-logos.plaid.com/betterment_265.png", "entity_id": "27Nq5zY2mY3rQbnmnyrnJLn31b908Bqo5Om1E", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "BnAEJNMvNdCyR1vrXNE0HLRzDMX3R9FRR6pBLg", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
1a49460f-114e-43c7-bf44-a970671c8f73	4425.96	2025-07-30	\N	USD		AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-30-01	4858.82	null	2025-08-15 06:44:40.261	2025-08-28 22:00:48.656	\N
767a3a63-5a09-4b41-acb0-28072d72325a	-23.92	2025-07-23	\N	USD	5qt oil	POINT OF SALE PURCHASE USA UT VERNAL, WM SUPERCENTER # 1851 W HIGHWAY 40 - 000000989549	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-23-03	806	null	2025-08-15 06:44:40.261	2025-08-22 05:14:12.544	\N
d3462cf6-391f-431d-bed5-3054f8536a99	-65.41	2025-08-10	2025-08-10	USD	\N	PENDING - 08/10 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-10-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
acb0ada5-6305-4f08-9527-5f64b963713a	86	2025-08-27	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-01	16739.49	null	2025-08-28 04:39:18.998	2025-09-03 20:00:50.806	48fac275-0a5d-4fe0-972e-031120a6b30f
46d92940-d823-405c-a365-70b60a379abd	-22.03	2025-08-08	2025-08-08	USD	\N	PENDING - 08/08 - RIDLEY'S 1165	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-08-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
26262c71-dc87-45eb-8649-2ba12a2f5f35	-50	2025-08-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2983aae0-c54b-4e9b-9571-91c1b44b4063	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-04	1459.69	null	2025-08-19 11:00:53.33	2025-09-03 20:00:50.805	\N
5cd0ce97-1d5f-4549-ad56-e95702d41241	-10.27	2025-09-02	2025-08-29	USD	\N	VISA - 08/29 TST* ICEBERG DRIVE INN - SARATOGA SPRI UT 02	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	4daae974-37d4-484a-a4f1-c373dc222857	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-03	3765.78	null	2025-09-02 17:12:41.326	2025-09-03 20:00:50.829	\N
6db801ec-5c45-4206-b0ee-2901210a4a00	-49.4	2025-07-03	2025-06-30	USD		VISA - 06/30 THE LIVING PLANET INC 801-355-3474 UT 030728	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-03-01	63.82	{"date": "2025-07-03", "name": "VISA - 06/30 THE LIVING PLANET INC UT 030728", "amount": 49.4, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-03-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "The Living Planet Inc", "counterparties": [{"name": "The Living Planet Inc", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "vv65QojdoDCoRbBAVjqQIb6N0K96VaCprAAYD", "authorized_date": "2025-06-30", "payment_channel": "online", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GENERAL_MERCHANDISE", "detailed": "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GENERAL_MERCHANDISE.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9b812bdb-cf8e-40d1-ad75-9982222855ae	-7.5	2025-06-28	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGASPRIN, THE HOME DEPOT #4461 - 000000209548	f	f	1226 N Exchange Dr	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	5cfa3fb0-16bd-4140-a0ee-a1029e53e44a	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-28-01	3455.59	{"date": "2025-06-28", "name": "Home Depot", "amount": 7.5, "pending": false, "website": "homedepot.com", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": "1226 N Exchange Dr", "country": null, "postal_code": "84045", "store_number": "4461"}, "logo_url": "https://plaid-merchant-logos.plaid.com/home_depot_491.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-28-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "The Home Depot", "counterparties": [{"name": "The Home Depot", "type": "merchant", "website": "homedepot.com", "logo_url": "https://plaid-merchant-logos.plaid.com/home_depot_491.png", "entity_id": "kVawvV6p0R25gKw3qbp4Kq7kEzDdY5RnjV7RK", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "w0L9njrwj1fojbzKVYBNUZDpXvXpbotv6KmQj", "authorized_date": null, "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "kVawvV6p0R25gKw3qbp4Kq7kEzDdY5RnjV7RK", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "HOME_IMPROVEMENT", "detailed": "HOME_IMPROVEMENT_HARDWARE", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_HOME_IMPROVEMENT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
cc1c3c7e-e9b0-4bec-9994-39688c88566f	-65.41	2025-08-10	2025-08-10	USD	\N	PENDING - 08/10 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-10-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
56afa764-5cc6-4727-b228-160e11dba7d2	-50	2025-08-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, DIRECTCOM BILLPAY WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	8dbf6573-0bc2-4f8b-8842-c811452c2596	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-03	1509.69	null	2025-08-19 11:00:53.342	2025-09-03 20:00:50.805	\N
77c10558-faeb-4c16-8e9a-5a415f0e4b0e	-33.55	2025-07-21	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-21-04	960.58	null	2025-08-15 06:44:40.261	2025-08-19 13:00:50.075	\N
34f56b75-40dd-4256-b1b0-ec0bca9bc485	172	2025-08-27	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-02	16911.49	null	2025-08-28 04:39:18.999	2025-09-03 20:00:50.807	0eb9183c-7c4a-412a-9d4c-815541f2c50d
ec4a1b84-8d48-458c-903e-245ee3fb8ab7	-39.65	2025-08-25	2025-08-22	USD	\N	VISA - 08/22 PAPA MURPHY'S UT056 SARATOGA SPRI UT 022176	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	498fd7dc-5d3f-4d0c-9913-71f14fbed33b	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-25-03	829.12	null	2025-08-27 04:02:47.322	2025-09-03 20:00:50.817	\N
3d1f8c26-50bd-4ad5-b53e-faa81222ee34	-20	2025-09-02	2025-08-30	USD	\N	VISA - 08/30 CALRANCH-POCATELLO #4 AMMON ID 030343	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9f493484-368a-45f7-bed0-ba778c5ffeae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-04	3745.78	null	2025-09-02 17:12:41.326	2025-09-03 20:00:50.821	\N
7ec0439a-2492-45a7-95d8-1f221d73fb28	43.89	2025-08-28	\N	USD	\N	MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-02	0	null	2025-08-28 08:06:55.141	2025-09-03 20:00:50.849	cb3e0bf1-01e2-469a-9a8c-823bac787231
3286c48f-5d67-419e-8235-e0c9cd4a629b	-58.74	2025-07-17	2025-07-14	USD		VISA - 07/14 CAFE RIO 0100 LEHI LEHI UT 014177	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	01379a33-d815-47f1-be5e-4ada7dcb0455	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-01	1204.99	null	2025-08-15 06:44:40.261	2025-08-18 22:52:45.952	\N
8413fd89-04a1-4b59-8b35-f4ce005cc264	-50	2025-07-17	2025-07-15	USD		VISA - 07/15 DIRECTCOM 801-789-2800 ID 015156	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	8dbf6573-0bc2-4f8b-8842-c811452c2596	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-17-01	50	null	2025-08-15 06:44:40.261	2025-08-18 22:57:02.387	\N
c758b7e0-ba0b-4972-ad50-a48dad8d9a74	-11.12	2025-07-07	2025-07-07	USD	\N	PENDING - 07/07 - ZAO - TRAVERSE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0e6f31cb-3f88-4b48-947b-6057b6453917	-14.96	2025-08-04	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WAL-MART #4438 136 W STATE ROAD 73 - 000047725140	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-04-03	423.51	null	2025-08-15 06:44:40.261	2025-09-03 05:00:54.701	\N
355f0595-bd6c-4b24-b9fd-4f2b45293a63	76	2025-09-03	\N	USD	\N	AUTOMATIC DEPOSIT, VENMO CASHOUT PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	49eec762-1ec7-4e31-93da-473e7071c166	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-01	934.23	null	2025-09-03 15:42:11.339	2025-09-03 20:00:50.829	\N
939e4b15-acdf-4a7c-b188-55101915089c	-240	2025-08-04	\N	USD		AUTOMATIC WITHDRAWAL, ROCK CREEK HOA DUES PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-04-04	183.51	null	2025-08-15 06:44:40.261	2025-09-03 05:00:54.724	\N
32710e17-49b3-45ec-b344-6153897ff934	-5	2025-07-28	2025-07-25	USD		VISA - 07/25 USDA FS AFM MBR NF LARAMIE WY 025665	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-28-02	604.53	null	2025-08-15 06:44:40.261	2025-08-27 05:33:41.553	\N
961a531f-cf82-415a-bc2b-2bf7b9da0707	-1	2025-08-11	2025-08-09	USD	\N	VISA - 08/09 PROVO CITY CNTR TEMPLE PROVO UT 009317	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	af8bb24b-5ae8-4f16-a834-246d7cfd31a4	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-11-01	199	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.83	\N
d81d2191-ff1c-4b2d-ac05-8d8b61b767c6	-50	2025-08-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2983aae0-c54b-4e9b-9571-91c1b44b4063	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-05	1409.69	null	2025-08-19 11:00:53.342	2025-09-03 20:00:50.805	\N
2bb37182-730a-4a61-9d8c-666a0bf0fcd4	-125.13	2025-06-23	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-04	1245.81	{"date": "2025-06-23", "name": "MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT", "amount": 125.13, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-23-04", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "omjV713b1XHXb8QJrzM8hE5N6RbKwjh5DaBDn", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-09-03 05:04:48.212	250a27d1-cac6-495f-a05a-200e8900b60a
ad4b0ca8-91d1-4a78-8ed4-3a0db03d7862	-22.03	2025-08-11	2025-08-08	USD	flowers and cake	VISA - 08/08 RIDLEY'S 1165 EAGLE MOUNTAI UT 008679	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dec45eae-1d76-405e-be2f-710e55bc2215	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-11-02	176.97	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.831	\N
cb3e0bf1-01e2-469a-9a8c-823bac787231	-43.89	2025-08-28	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-01	16867.6	null	2025-08-28 08:06:55.105	2025-09-03 20:00:50.829	7ec0439a-2492-45a7-95d8-1f221d73fb28
29eb55b9-c3d5-4e66-b407-9e37884a9d7a	-8.12	2025-09-03	2025-09-03	USD	\N	PENDING - 09/03 - RIDLEY'S 1165	t	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-01	\N	null	2025-09-03 20:00:50.828	2025-09-03 20:00:50.894	\N
da5bcae8-b687-4eea-b577-46a3c1174073	-162.74	2025-09-02	2025-08-29	USD	2 cases for us, 2 for Heidi. Expect $76 from Heidi	VISA - 08/29 PEACH AND BEE PRODUCE HERRIMAN UT 029909	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	2ff6f7d5-876a-4e2b-a62b-8020dfd5e259	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-05	3583.04	null	2025-09-02 17:12:41.326	2025-09-03 20:00:50.829	\N
8ccf70d3-e33d-4ec1-874b-cd67c9a23a93	-35.17	2025-07-07	\N	USD		POINT OF SALE PURCHASE USA ID CHUBBUCK, MAVERIK #489 - 000000455113	f	f	4564 Yellowstone Ave	42.916656	-112.465874	Chubbuck	ID		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-02	90.43	{"date": "2025-07-07", "name": "POINT OF SALE PURCHASE USA ID CHUBBUCK, MAVERIK #489 - 000000455113", "amount": 35.17, "pending": false, "website": "maverik.com", "category": null, "datetime": null, "location": {"lat": 42.916656, "lon": -112.465874, "city": "Chubbuck", "region": "ID", "address": "4564 Yellowstone Ave", "country": null, "postal_code": "83202", "store_number": "489"}, "logo_url": "https://plaid-merchant-logos.plaid.com/maverik_616.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-07-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Maverik", "counterparties": [{"name": "Maverik", "type": "merchant", "website": "maverik.com", "logo_url": "https://plaid-merchant-logos.plaid.com/maverik_616.png", "entity_id": "61zgLDvXnKbD5bDY2gKn2gqYvOQkX6krDkWKD", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "5ZdeBEawEOUgnNQaXOxZs0JDdQVR35tRzpdAw", "authorized_date": null, "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "61zgLDvXnKbD5bDY2gKn2gqYvOQkX6krDkWKD", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GENERAL_MERCHANDISE", "detailed": "GENERAL_MERCHANDISE_CONVENIENCE_STORES", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GENERAL_MERCHANDISE.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
003f1961-8183-4e0a-8da1-db48d4218143	-11.12	2025-07-07	2025-07-07	USD	\N	PENDING - 07/07 - ZAO - TRAVERSE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-08	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
54330662-7ddf-48d0-a7f9-5df86519af0a	-14.96	2025-06-26	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WM SUPERCENTER #4438 136 W STATE ROAD 73 - 000000629604	f	f	136 W State Road 73	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-26-03	906.34	{"date": "2025-06-26", "name": "POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WM SUPERCENTER #4438 136 W STATE ROAD 73 - 000000629604", "amount": 14.96, "pending": false, "website": "walmart.com", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": "136 W State Road 73", "country": null, "postal_code": "84045", "store_number": "4438"}, "logo_url": "https://plaid-merchant-logos.plaid.com/walmart_1100.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-26-03", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Walmart", "counterparties": [{"name": "Walmart", "type": "merchant", "website": "walmart.com", "logo_url": "https://plaid-merchant-logos.plaid.com/walmart_1100.png", "entity_id": "O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "9gDzk9Z19ehPqxR57EokfrKd4dbz7ofkBE5Ey", "authorized_date": null, "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GENERAL_MERCHANDISE", "detailed": "GENERAL_MERCHANDISE_SUPERSTORES", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GENERAL_MERCHANDISE.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
bf04bb40-d299-430d-a448-9e0be7dc46f4	-31.31	2025-07-31	2025-07-29	USD		VISA - 07/29 CARPARTSCOM * 866-529-0412 CA 028747	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-31-01	4774.02	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.169	\N
5fea4729-5c25-4c44-9c62-591d58d37d4e	172	2025-08-25	\N	USD	For Elk freezer: EmmaBaden, IssaCorrine	AUTOMATIC DEPOSIT, VENMO CASHOUT PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-25-01	878.95	null	2025-08-27 04:02:47.322	2025-09-03 20:00:50.801	\N
4a395295-9b00-4bf5-bf4f-58736c82bc57	1000	2025-08-14	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-01	16218.49	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.808	c7679a26-b64d-42ac-b60a-a23d01a0e9b3
59414d9f-ae75-4c96-908d-be15639fa9df	-7.6	2025-08-28	2025-08-26	USD	\N	VISA - 08/26 RIDLEY'S 1165 EAGLE MOUNTAI UT 026538	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dec45eae-1d76-405e-be2f-710e55bc2215	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-04	484.91	null	2025-08-28 16:10:57.329	2025-09-03 20:00:50.829	\N
5995e962-51fe-4075-a67c-1f6fa6875400	-18.73	2025-07-21	\N	USD		AUTOMATIC WITHDRAWAL, DOMINION ENERGY QGC PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	04fe2780-aac4-47b3-84dc-1638a365a176	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-21-03	994.13	null	2025-08-15 06:44:40.261	2025-09-03 06:47:16.929	\N
49405c5c-e669-4ec4-9021-bc15bfcd9218	-9.42	2025-09-03	2025-09-03	USD	\N	PENDING - 09/03 - WENDY'S 6671	t	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-02	\N	null	2025-09-03 20:00:50.828	2025-09-03 20:00:50.895	\N
59a3add1-afb6-443c-8553-c98b53b06c7b	-100	2025-08-11	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-11-01	15319.93	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	fe87bbe6-0b6f-48da-bffb-54894f1cd604
aaa26a16-c598-47ee-af3e-a2b7b3fa2d05	-70	2025-08-18	\N	USD	\N	AUTOMATIC WITHDRAWAL, TRANSAMERICA INSINSPAYMENT PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	75790fa2-060c-457a-859b-eaa387d3f648	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-18-06	1339.69	null	2025-08-19 11:00:53.342	2025-09-03 20:00:50.805	\N
17478993-6375-41d9-810d-5fb874455add	313.91	2025-06-23	\N	USD		PURCHASE RETURN VISA DEBIT - 06/20 HYATT PLACE MONTREAL A DORVAL CD 020427	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	364333e5-8d24-49ea-a544-b3d866aa6ada	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-23-02	1389.44	{"date": "2025-06-23", "name": "PURCHASE RETURN VISA DEBIT - 06/20 HYATT PLACE MONTREAL A DORVAL CD 020427", "amount": -313.91, "pending": false, "website": "hyatt.com/promo/hyatt-resorts", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": "https://plaid-merchant-logos.plaid.com/hyatt_resorts_508.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-23-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Hyatt Resorts", "counterparties": [{"name": "Hyatt Resorts", "type": "merchant", "website": "hyatt.com/promo/hyatt-resorts", "logo_url": "https://plaid-merchant-logos.plaid.com/hyatt_resorts_508.png", "entity_id": "WJwJ8VwL0897q5g0y1zoZM99b82nELw2Ad7Ra", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "yr1od7aL7qtR0bnYzgybC5Rk1R18VKU3PnVBr", "authorized_date": "2025-06-20", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "WJwJ8VwL0897q5g0y1zoZM99b82nELw2Ad7Ra", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRAVEL", "detailed": "TRAVEL_LODGING", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRAVEL.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a37dbdcc-c24f-466d-b2ec-ae5b648e5f3a	439.19	2025-08-28	\N	USD	Cover cost of freezer. Accidentally pulled +10	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-03	492.51	null	2025-08-28 08:06:55.099	2025-09-03 20:00:50.819	7c42768c-8042-4e98-8b39-7ec915fbad8e
3e57e7a9-29a5-4230-938e-bdc2673d7ceb	-42	2025-08-20	\N	USD	\N	POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, JIFFY LUBE 4019 E PONY EXPRESS - 000000446521	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	32791291-30d5-4bcf-81b3-318f3fa5865c	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-20-02	674.26	null	2025-08-20 22:03:38.425	2025-09-03 20:00:50.805	\N
a1f2c779-610f-470a-bbcc-3a85ba602422	-13.14	2025-07-01	\N	USD		VISA - 06/27 THANKSGIVING POINT FS LEHI UT 027160	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-01-02	3307.03	{"date": "2025-07-01", "name": "VISA - 06/27 THANKSGIVING POINT FS LEHI UT 027160", "amount": 13.14, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-01-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Thanksgiving Point Fs", "counterparties": [{"name": "Thanksgiving Point Fs", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "omjV713b1XHXb8QJrzMksALJpb1jXeubAzxXO", "authorized_date": "2025-06-27", "payment_channel": "online", "transaction_code": null, "transaction_type": "digital", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "ENTERTAINMENT", "detailed": "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_ENTERTAINMENT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
a43e7180-9f42-44a6-a67f-9572e595974b	-0.25	2025-06-21	\N	USD		VISA - 06/19 VRAC EN FOLIE MONTREAL CD 019441	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-01	1180.82	{"date": "2025-06-21", "name": "VISA - 06/19 VRAC EN FOLIE MONTREAL CD 019441", "amount": 0.25, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-21-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Vrac En Folie Montreal", "counterparties": [{"name": "Vrac En Folie Montreal", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "j6K0ZdDJdntVmyojQOJ9H7wRAeJjwEukk0qxbq", "authorized_date": "2025-06-19", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_RESTAURANT", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
bc8e54cb-462e-4367-a7fc-b359d4e6712d	100	2025-08-09	\N	USD		MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-09-01	200	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.828	9778e2f9-becd-457b-a42d-2b5e56ed374d
f4f7c351-44fa-4506-b7aa-9a8352f66c8b	-13.96	2025-07-07	\N	USD	spare bike tube	POINT OF SALE PURCHASE USA UT LEHI, CABELAS LEHI. UT 2502 CABELAS BLVD - 000081512509	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	5faa92f0-205c-4250-a40a-25b2ae248e97	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-07-08	158.6	null	2025-08-15 06:44:40.261	2025-08-18 22:47:42.297	\N
e5bf40dc-36e5-4c31-99af-3e52a79a7be4	-30	2025-08-11	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	49eec762-1ec7-4e31-93da-473e7071c166	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-11-04	141.97	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.809	\N
46fe6d54-601e-4a65-8457-1703781a2784	-318.19	2025-06-17	\N	USD		VISA - 06/15 HYATT PLACE MONTREAL A DORVAL CD 014661	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	364333e5-8d24-49ea-a544-b3d866aa6ada	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-17-01	2101.58	{"date": "2025-06-17", "name": "VISA - 06/15 HYATT PLACE MONTREAL A DORVAL CD 014661", "amount": 318.19, "pending": false, "website": "hyatt.com/promo/hyatt-resorts", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": "https://plaid-merchant-logos.plaid.com/hyatt_resorts_508.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-17-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Hyatt Resorts", "counterparties": [{"name": "Hyatt Resorts", "type": "merchant", "website": "hyatt.com/promo/hyatt-resorts", "logo_url": "https://plaid-merchant-logos.plaid.com/hyatt_resorts_508.png", "entity_id": "WJwJ8VwL0897q5g0y1zoZM99b82nELw2Ad7Ra", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "KBg5V9qZ93CwRmAO8x3EI5jwMqaJjPfKK0j9zK", "authorized_date": "2025-06-15", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "WJwJ8VwL0897q5g0y1zoZM99b82nELw2Ad7Ra", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRAVEL", "detailed": "TRAVEL_LODGING", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRAVEL.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
7b31e323-be5d-428c-b62e-786e22d5df4a	-123.77	2025-08-15	\N	USD	\N	AUTOMATIC WITHDRAWAL, ROCKYMTN/PACIFIC POWER BILL WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	1875dfd9-3487-44a4-be05-145b761a5906	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-15-08	1975.35	null	2025-08-16 13:41:43.42	2025-09-03 20:00:50.801	\N
d2d80fd9-f049-46d6-b659-5aaeab0569e0	-50	2025-07-01	\N	USD		ZELLE RACHEL JUDD 866-224-2158;518200E0M3JY;2025-07-01;DR	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-01-01	3320.17	{"date": "2025-07-01", "name": "ZELLE RACHEL JUDD 866-224-2158;518200E0M3JY;2025-07-01;DR", "amount": 50, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-01-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [{"name": "Zelle", "type": "payment_app", "website": "zellepay.com", "logo_url": "https://plaid-counterparty-logos.plaid.com/zelle_73.png", "entity_id": "zQ64DmD0mdD4r6QrYndzZWLwJn7DyJEYdwLYp", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "kLk05w18wMFKmxbnVA8DheozQBXXQVu3YMBLz", "authorized_date": "2025-07-01", "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
179f8364-c357-4f90-9a97-957ef7ca3e6c	-58.57	2025-08-20	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, COSTCO WHSE #1383 - 000000683797	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	211815cf-6651-4b6e-af94-9821afd1a672	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-20-01	716.26	null	2025-08-20 22:03:38.427	2025-09-03 20:00:50.809	\N
7ec24567-b67f-44f2-9cfb-115de092a4c4	-5	2025-08-11	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	49eec762-1ec7-4e31-93da-473e7071c166	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-11-03	171.97	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.809	\N
932a65b6-c9d2-4a66-b750-52352f58c762	-17	2025-08-12	\N	USD	\N	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-01	17	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.853	3a8f59a4-d122-44b9-8f57-8d1a0efd4770
f5a67406-54bf-4367-9b3c-ece1d6384703	-30	2025-09-03	2025-09-03	USD	\N	PENDING - 09/03 - ALPINE KIDS DENTISTRY	t	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-02	\N	null	2025-09-03 16:02:10.066	2025-09-03 16:02:10.171	\N
f5c8b940-4333-422b-8432-9774873839d7	-20.26	2025-08-05	2025-08-05	USD	\N	PENDING - 08/05 - CHICK-FIL-A #03348	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-05-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6744d5c4-8c72-40fe-b40e-b41faaa21b36	-108.24	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 13:00:50.277	\N
793c7ad4-eeda-4f8c-97df-803b8360692f	-30	2025-09-03	2025-09-03	USD	\N	PENDING - 09/03 - ALPINE KIDS DENTISTRY	t	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-03-01	\N	null	2025-09-03 16:02:10.096	2025-09-03 16:02:10.172	\N
645cc2e6-d246-45a3-a4c4-944056598ef4	-240	2025-07-02	\N	USD		AUTOMATIC WITHDRAWAL, ROCK CREEK HOA DUES PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-02-02	113.22	{"date": "2025-07-02", "name": "AUTOMATIC WITHDRAWAL, ROCK CREEK HOA DUES PPD", "amount": 240, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-07-02-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "E6jA5JwrJLtL93NrnX4xS16XR47vJNHnp07PD", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "RENT_AND_UTILITIES", "detailed": "RENT_AND_UTILITIES_RENT", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_RENT_AND_UTILITIES.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
5f7a41ef-658d-4c44-9a7f-85bfae94b563	-37.9	2025-08-20	2025-08-20	USD	\N	PENDING - 08/20 - CHEVRON 0306371	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-20-01	\N	null	2025-08-20 22:03:38.427	2025-08-27 04:02:47.335	\N
04e77254-20a1-4e92-9821-fb638b19d931	-8.22	2025-08-27	2025-08-27	USD	\N	PENDING - 08/27 - SMITH'S FOOD #4207	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	c89b261a-3f4b-4e0b-9f22-c6dd27906e1f	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-01	\N	null	2025-08-27 16:35:26.761	2025-08-29 12:34:04.692	\N
8e046abd-eee9-42b4-80b3-9f413848e5c6	-16.06	2025-06-14	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-14-04	3114.35	{"date": "2025-06-14", "name": "MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT", "amount": 16.06, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-14-04", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": null, "counterparties": [], "transaction_id": "3JavPOrMObHLQ1npXew4Sko4rpb0oAcMMb51xK", "authorized_date": null, "payment_channel": "other", "transaction_code": null, "transaction_type": "special", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "TRANSFER_OUT", "detailed": "TRANSFER_OUT_ACCOUNT_TRANSFER", "confidence_level": "HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_TRANSFER_OUT.png"}	2025-08-15 06:44:40.261	2025-09-03 05:03:47.355	f71ae439-3999-4dc3-a342-29968584ce9c
7a395657-af80-4bee-a07c-eb5b505898e5	-13.52	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
17f36117-d75c-4bf9-8d28-76669ff2ccab	-20.26	2025-08-05	2025-08-05	USD	\N	PENDING - 08/05 - CHICK-FIL-A #03348	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-05-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
dbb89162-f91e-43b3-a7d1-30be6d3b96c4	-37.9	2025-08-20	2025-08-20	USD	\N	PENDING - 08/20 - CHEVRON 0306371	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-20-03	\N	null	2025-08-20 22:03:38.426	2025-08-27 04:02:47.331	\N
b7c6e06b-9d21-4a64-984a-d7da666693a6	0	2025-08-01	\N	USD		INTEREST CHARGE	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-01-01	0	null	2025-08-15 06:44:40.261	2025-08-29 22:00:55.178	\N
1933f171-481c-460e-8688-dc0b911a7f97	-26.71	2025-08-28	2025-08-28	USD	\N	PENDING - 08/28 - EASTMAN ADAMS PHOTOGRA	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-05	\N	null	2025-08-28 20:02:35.905	2025-09-02 06:00:51.313	\N
e2354211-6191-4643-8a72-3744a2027d82	-28.92	2025-07-05	2025-07-04	USD	\N	PENDING - 07/04 - OLIVE GARDEN 0021705	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-04	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4f31ea0c-f863-4e31-b880-bdcce18e3699	-61.51	2025-07-05	2025-07-04	USD	\N	PENDING - 07/04 - OLIVE GARDEN 0021705	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-05	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c97203ce-77a3-483b-9d42-f2f652fd9157	-76.84	2025-06-25	\N	USD	\N	VISA - 06/23 PARTSELECT.COM WWW.PARTSELEC GA 022478	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-25-02	956.3	{"date": "2025-06-25", "name": "VISA - 06/23 PARTSELECT.COM WWW.PARTSELEC GA 022478", "amount": 76.84, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": null, "region": null, "address": null, "country": null, "postal_code": null, "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-25-02", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Partselect", "counterparties": [{"name": "Partselect", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "LOW"}], "transaction_id": "j6K0ZdDJdntVmyojQOJ8hDw0Ar57Z7tkkqZJA5", "authorized_date": "2025-06-23", "payment_channel": "online", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "HOME_IMPROVEMENT", "detailed": "HOME_IMPROVEMENT_HARDWARE", "confidence_level": "LOW"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_HOME_IMPROVEMENT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6435eff9-d159-4fab-992d-c5b77c482e29	-6.88	2025-06-26	\N	USD		POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WM SUPERCENTER #4438 136 W STATE ROAD 73 - 000000131009	f	f	136 W State Road 73	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	898c1c67-9e0d-40c3-9648-2d1c9e1b25ae	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-26-04	899.46	{"date": "2025-06-26", "name": "POINT OF SALE PURCHASE USA UT SARATOGA SPRI, WM SUPERCENTER #4438 136 W STATE ROAD 73 - 000000131009", "amount": 6.88, "pending": false, "website": "walmart.com", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": "136 W State Road 73", "country": null, "postal_code": "84045", "store_number": "4438"}, "logo_url": "https://plaid-merchant-logos.plaid.com/walmart_1100.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-26-04", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Walmart", "counterparties": [{"name": "Walmart", "type": "merchant", "website": "walmart.com", "logo_url": "https://plaid-merchant-logos.plaid.com/walmart_1100.png", "entity_id": "O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "VagvLA4wADikR3XANQwaFd5JnJo4KOCXxgZgY", "authorized_date": null, "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "O5W5j4dN9OR3E6ypQmjdkWZZRoXEzVMz2ByWM", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GENERAL_MERCHANDISE", "detailed": "GENERAL_MERCHANDISE_SUPERSTORES", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GENERAL_MERCHANDISE.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
090a273f-b04b-4458-a799-e5dc57640045	-45.84	2025-07-05	2025-07-02	USD	\N	VISA - 07/02 AMAZON MKTPL*N362R2370 AMZN.COM/BILL WA 0016	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-03	120.1	null	2025-08-15 06:44:40.261	2025-08-19 10:16:03.533	\N
3a8f59a4-d122-44b9-8f57-8d1a0efd4770	17	2025-08-12	\N	USD	\N	FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-01	258.97	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.812	932a65b6-c9d2-4a66-b750-52352f58c762
cd63cdd8-ef0b-4043-a667-63ac8ce831f7	-17.98	2025-07-05	2025-07-02	USD	\N	VISA - 07/02 AMAZON MKTPL*N383J6AM0 AMZN.COM/BILL WA 0010	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-02	165.94	null	2025-08-15 06:44:40.261	2025-08-19 10:16:08.575	\N
4ba89747-3e15-4101-88c7-e8a4e0e1f459	-108.24	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 12:34:20.869	\N
9aa7adbe-1861-4bc3-aefc-6cb8ef400e54	-13.52	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - AMAZON MKTPLACE PMTS	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-04	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
91eb6eaf-ea39-447b-ad55-03935769b35c	-71.42	2025-08-12	2025-08-09	USD	\N	VISA - 08/09 LOS HERMANOS-PROVO PROVO UT 009913	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	a4118033-64da-4395-9924-cb5dd7460633	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-02	187.55	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.814	\N
052d91f6-22ad-4f9e-b6d6-42eff225474d	-14.58	2025-07-24	2025-07-22	USD		VISA - 07/22 MAVERIK #380 EAGLE MOUNTAI UT 022017	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-24-01	723.35	null	2025-08-15 06:44:40.261	2025-08-22 06:03:14.274	\N
c7679a26-b64d-42ac-b60a-a23d01a0e9b3	-1000	2025-08-14	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-14-04	2755.7	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.817	4a395295-9b00-4bf5-bf4f-58736c82bc57
49b1d16d-8afe-48eb-91ac-43056efd9292	-26.71	2025-08-28	2025-08-28	USD	\N	PENDING - 08/28 - EASTMAN ADAMS PHOTOGRA	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-03	\N	null	2025-08-28 20:02:35.931	2025-09-02 06:00:51.341	\N
5c4e8808-8e8b-466d-8dd3-eab71d2fa439	17.01	2025-08-12	\N	USD	\N	MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-02	0	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.85	02b22bb3-03c3-406e-aeb1-37214e2e7ca0
3e32d07f-4f05-474e-9864-9f4d25ce2692	-15	2025-08-12	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-01	15304.93	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	3fd8c46a-8d40-48a6-b952-349f359823a4
10ae8312-f78c-4e3b-a198-9f923bd51232	103.74	2025-08-06	\N	USD	\N	AUTOMATIC DEPOSIT, AFCU OLB, CICOBK CK WEBXFR ARTHUR MATTHIAS P2P WEB (R)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-06-01	287.25	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.799	\N
fe87bbe6-0b6f-48da-bffb-54894f1cd604	100	2025-08-11	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-11-05	241.97	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.809	59a3add1-afb6-443c-8553-c98b53b06c7b
c15b1d9d-1a99-4385-b1ed-9567e046a4cb	-429.19	2025-08-28	\N	USD	\N	POINT OF SALE PURCHASE USA MN WWW.BESTBUY.C, BESTBUY.COM -- - 000041261002	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	dcef8c8c-28a0-4597-ae61-4d5f120379e0	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-02	53.32	null	2025-08-28 08:06:55.096	2025-09-03 20:00:50.817	\N
e348ed55-3910-4332-ac14-5f911d2469da	-28.92	2025-07-05	2025-07-04	USD	\N	PENDING - 07/04 - OLIVE GARDEN 0021705	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-01	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
02b22bb3-03c3-406e-aeb1-37214e2e7ca0	-17.01	2025-08-12	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-02	15287.92	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.809	5c4e8808-8e8b-466d-8dd3-eab71d2fa439
3fd8c46a-8d40-48a6-b952-349f359823a4	15	2025-08-12	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-03	202.55	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.812	3e32d07f-4f05-474e-9864-9f4d25ce2692
cace569d-6d94-479e-92df-7bd5a7afe2d5	3593.13	2025-08-29	\N	USD	\N	AUTOMATIC DEPOSIT, 140574 CLOZD INCDIR DEP PPD	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-01	4043.04	null	2025-08-29 12:34:04.682	2025-09-03 20:00:50.82	\N
1b13c3ae-7e52-4780-9896-8bf58c34aa31	-61.51	2025-07-05	2025-07-04	USD	\N	PENDING - 07/04 - OLIVE GARDEN 0021705	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-07-05-02	\N	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
dddb15ec-2abd-4574-a17d-08c23ac38762	-6	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - SARATOGA SPRINGS DI	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-03	\N	\N	2025-08-15 06:44:40.261	2025-08-15 13:00:50.277	\N
043b4dc0-028c-4030-aaa9-7cf049ac2151	-37.5	2025-08-29	2025-08-28	USD	\N	VISA - 08/28 DESERET BOOK 51310 SARATOGA SPRI UT 027982	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-03	3997.32	null	2025-08-29 12:34:04.682	2025-09-03 20:00:50.82	\N
110d2039-a61d-4446-932e-0d994a9d37c3	-6	2025-08-12	2025-08-12	USD	\N	PENDING - 08/12 - SARATOGA SPRINGS DI	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-04	\N	\N	2025-08-15 06:44:40.261	2025-08-15 12:34:20.869	\N
61e34e72-bf52-4860-bda0-042896811bdc	-1	2025-06-26	\N	USD	\N	VISA - 06/24 SARATOGA SPRINGS TEMPLE SARATOGA SPRI UT 024	f	f	987 S Ensign Dr	\N	\N	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-26-01	935.3	{"date": "2025-06-26", "name": "VISA - 06/24 SARATOGA SPRINGS TEMPLE SARATOGA SPRI UT 024", "amount": 1, "pending": false, "website": null, "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Saratoga Springs", "region": "UT", "address": "987 S Ensign Dr", "country": null, "postal_code": "84045", "store_number": null}, "logo_url": null, "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-26-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Saratoga Springs Utah Temple", "counterparties": [{"name": "Saratoga Springs Utah Temple", "type": "merchant", "website": null, "logo_url": null, "entity_id": null, "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "gnB9xAw4A7Cm0DN9Qn4mTRO74gDA4rI343vjb", "authorized_date": "2025-06-24", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": null, "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "GOVERNMENT_AND_NON_PROFIT", "detailed": "GOVERNMENT_AND_NON_PROFIT_DONATIONS", "confidence_level": "MEDIUM"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_GOVERNMENT_AND_NON_PROFIT.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
1193be1e-6b5d-4584-ae9d-6605d1d2aac4	-35	2025-08-28	\N	USD	\N	AUTOMATIC WITHDRAWAL, VENMO PAYMENT WEB (S)	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-28-05	449.91	null	2025-08-29 12:34:04.683	2025-09-03 20:00:50.817	\N
011ee004-ce4a-4183-8f58-777dcf9d0d6f	-3.46	2025-06-30	\N	USD	\N	VISA - 06/28 WENDY'S 6671 EAGLE MOUNTAI UT 028790	f	f	4302 E Pony Express Pkwy	\N	\N	Eagle Mountain	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-30-01	3452.13	{"date": "2025-06-30", "name": "Wendy's", "amount": 3.46, "pending": false, "website": "wendys.com", "category": null, "datetime": null, "location": {"lat": null, "lon": null, "city": "Eagle Mountain", "region": "UT", "address": "4302 E Pony Express Pkwy", "country": null, "postal_code": "84005", "store_number": null}, "logo_url": "https://plaid-merchant-logos.plaid.com/wendys_1114.png", "account_id": "vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk", "date_order": "2025-06-30-01", "category_id": null, "check_number": null, "payment_meta": {"payee": null, "payer": null, "ppd_id": null, "reason": null, "by_order_of": null, "payment_method": null, "reference_number": null, "payment_processor": null}, "account_owner": null, "merchant_name": "Wendy's", "counterparties": [{"name": "Wendy's", "type": "merchant", "website": "wendys.com", "logo_url": "https://plaid-merchant-logos.plaid.com/wendys_1114.png", "entity_id": "1YZ03w08myRAQ0mRgMvD2EBoOb92RmBXN6nmK", "phone_number": null, "confidence_level": "VERY_HIGH"}], "transaction_id": "AQkBxmOAmYiaPKnrA8DDHBMykOxn61f58ryAA", "authorized_date": "2025-06-28", "payment_channel": "in store", "transaction_code": null, "transaction_type": "place", "iso_currency_code": "USD", "merchant_entity_id": "1YZ03w08myRAQ0mRgMvD2EBoOb92RmBXN6nmK", "authorized_datetime": null, "pending_transaction_id": null, "unofficial_currency_code": null, "personal_finance_category": {"primary": "FOOD_AND_DRINK", "detailed": "FOOD_AND_DRINK_FAST_FOOD", "confidence_level": "VERY_HIGH"}, "personal_finance_category_icon_url": "https://plaid-category-icons.plaid.com/PFC_FOOD_AND_DRINK.png"}	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0fb79aaf-9213-4f91-83f4-b574f265d75b	-8.22	2025-08-29	2025-08-27	USD	\N	VISA - 08/27 SMITH'S FOOD #4207 SARATOGA SPRI UT 027819	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-02	4034.82	null	2025-08-29 12:34:04.683	2025-09-03 20:00:50.817	\N
caa2081d-e015-419f-b93a-24f0f68dba32	-50	2025-08-12	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-03	15237.92	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.828	e4c27130-7474-40a6-b7fe-e110e8077705
36867686-2e69-4fd5-a367-02646d8e0598	-19.43	2025-08-12	\N	USD	\N	POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-03	19.43	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.85	46d780f7-d518-4d67-8b0c-46f6079e26b7
c74fda5b-b302-4f93-9109-e88beb91f0b8	-8.22	2025-08-27	2025-08-27	USD	\N	PENDING - 08/27 - SMITH'S FOOD #4207	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-27-01	\N	null	2025-08-27 16:35:26.795	2025-08-29 12:34:04.69	\N
e4c27130-7474-40a6-b7fe-e110e8077705	50	2025-08-12	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-06	243.17	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.81	caa2081d-e015-419f-b93a-24f0f68dba32
ead66086-0e34-418c-8d3e-03d367a3436e	-19.43	2025-08-12	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-04	15218.49	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.809	89694f1f-4d9c-4438-9ee2-cb23d18e1380
46d780f7-d518-4d67-8b0c-46f6079e26b7	19.43	2025-08-12	\N	USD	\N	POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-04	221.98	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.817	36867686-2e69-4fd5-a367-02646d8e0598
6f4b9f49-5db6-4a6c-9186-e86b90a456d2	-28.81	2025-08-12	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, COSTCO WHSE #1383 - 000000126502	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	211815cf-6651-4b6e-af94-9821afd1a672	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-05	193.17	null	2025-08-15 06:44:40.261	2025-09-03 20:00:50.832	\N
89694f1f-4d9c-4438-9ee2-cb23d18e1380	19.43	2025-08-12	\N	USD	\N	MOBILE BANKING PAYMENT FROM MONEY MARKET	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-12-04	0	\N	2025-08-15 06:44:40.261	2025-09-03 20:00:50.852	ead66086-0e34-418c-8d3e-03d367a3436e
cefc532d-a7fd-4744-b2b1-0889b6b54179	-10.27	2025-08-29	2025-08-29	USD	\N	PENDING - 08/29 - TST* ICEBERG DRIVE INN -	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-04	\N	null	2025-08-29 21:00:46.075	2025-09-02 17:12:41.332	\N
570026e5-93f5-4f17-adf5-fda22b6d5c87	-162.74	2025-08-29	2025-08-29	USD	\N	PENDING - 08/29 - PEACH AND BEE PRODUCE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-05	\N	null	2025-08-29 21:00:46.075	2025-09-02 17:12:41.332	\N
d602e08c-c3f2-43db-b170-444dd9fa154c	-10.27	2025-08-29	2025-08-29	USD	\N	PENDING - 08/29 - TST* ICEBERG DRIVE INN -	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-01	\N	null	2025-08-29 21:00:46.076	2025-09-02 17:12:41.335	\N
f068c0bb-95f0-4104-be26-8c8cbfd6aa30	-162.74	2025-08-29	2025-08-29	USD	\N	PENDING - 08/29 - PEACH AND BEE PRODUCE	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	72ac1f3d-5efb-4612-8495-a5d550e19586	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-02	\N	null	2025-08-29 21:00:46.079	2025-09-02 17:12:41.335	\N
b4f676e3-bdda-4a29-ba05-b65af21e07cb	-26.61	2025-08-29	\N	USD	\N	POINT OF SALE PURCHASE USA UT SARATOGA SPRI, COSTCO GAS #1383 - 000000805380	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	211815cf-6651-4b6e-af94-9821afd1a672	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-04	3970.71	null	2025-08-29 22:00:55.162	2025-09-03 20:00:50.819	\N
21c2f593-5c7b-4a4d-a84b-38e17bf28bce	-1.07	2025-09-02	2025-08-31	USD	\N	PENDING - 08/31 - GOOGLE THE BATTLE OF	t	t	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-02-01	\N	null	2025-09-02 06:00:51.307	2025-09-02 17:12:41.332	\N
cc68329d-12f9-40b7-a994-7a6c9d2356b8	-10.72	2025-08-29	\N	USD	\N	POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, AUTOZONE 3987 E PONY EX PKW - 000000874815	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	92018f00-405a-4ee7-aec4-672f4ea6f9af	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-05	3959.99	null	2025-09-02 06:00:51.313	2025-09-03 20:00:50.829	\N
77119f1a-58a5-45ed-99f1-f251f6a8eb6e	-24.88	2025-09-01	\N	USD	\N	POINT OF SALE PURCHASE USA ID CHUBBUCK, MAVERIK #489 - 000000099266	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	f01f8a23-85d1-43ba-a6e9-30208d1a48dd	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-09-01-02	3782.94	null	2025-09-02 06:00:51.307	2025-09-03 20:00:50.829	\N
465f77e5-a1c0-4f8e-9ca2-36bbc47f5fb4	17.7	2025-08-31	\N	USD	\N	DIVIDEND EARNED FOR PERIOD OF 08/01/2025 THROUGH 08/31/2025 ANNUAL PERCENTAGE YIELD EARNED IS 1.30%	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	4eb631c2-53c9-4715-b992-234fab39a67c	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-31-01	16446.11	null	2025-09-02 06:00:51.34	2025-09-03 20:00:50.828	\N
6edde683-c6ef-4cbd-91ed-e3ab6ade3d67	-33.6	2025-08-30	\N	USD	Radishes cheese orange juice sour cream ice cream	POINT OF SALE PURCHASE USA ID POCATELLO, WINCO FOODS #117 WINCO1 - 000000462509	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	7d811758-d002-4108-89cc-62b4b8516db5	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-30-02	3857.82	null	2025-09-02 06:00:51.307	2025-09-03 20:00:50.829	\N
aacafadb-9cfe-47ac-acc0-c18baf282da0	-21.4	2025-06-18	2025-06-16	USD		VISA - 06/16 SQ *VLADIMIR DAVYDOV QUEBEC CD 016929	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-03	-154.85	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
104574e6-5db1-4da0-b253-5e4fd5a13ed5	-28.38	2025-06-18	2025-06-16	USD		VISA - 06/16 MORRIN.ORG QUEBEC CD 016358	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-04	-126.47	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
c178b72c-be0a-4238-b15c-49ce07df1a3e	-2.24	2025-06-20	2025-06-17	USD		VISA - 06/17 SAINT-FRANCOIS-ILE-D ORLE SAINT-FRANCOI CD 0	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-02	-19.45	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
cf4d43a3-f249-4fa1-87ed-eb28ac16725d	-101.72	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-11	2841.21	\N	2025-08-15 06:44:40.261	2025-09-03 05:04:24.395	d521c415-c053-4004-aca2-eb98510be705
95d5dc9c-e97f-488d-ba06-87ef6fe07410	-41.86	2025-08-29	\N	USD	\N	POINT OF SALE PURCHASE USA UT EAGLE MOUNTAI, AUTOZONE 3987 E PONY EX PKW - 000000874897	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	92018f00-405a-4ee7-aec4-672f4ea6f9af	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-08-29-06	3918.13	null	2025-09-02 06:00:51.305	2025-09-03 20:00:50.829	\N
377021a9-a1f1-42ce-b30d-2332e5d5c488	-20.01	2025-06-20	2025-06-16	USD	\N	VISA - 06/16 LA MAISON SMITH DES JARDI QUEBEC CD 016376	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-05	28.96	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
7c4746f2-6001-43dd-8799-9d610c4d453b	-14.94	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-13	2769.77	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:38.506	ef2cc03d-2386-4452-83bb-8a7104e2c5f3
c0c9a42e-ff2f-4894-b60b-c7f62dcc54fb	-168.21	2025-06-20	2025-06-17	USD		VISA - 06/17 SITE TRADITIONNEL HURON WENDAKE CD 017512	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-15	604.04	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
074789bf-c89d-46e5-9747-4e4aa022d941	-9.39	2025-06-20	2025-06-17	USD		VISA - 06/17 CIDRERIE VERGER BILODE SAINT-PIERRE- CD 0170	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-03	-10.06	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
4b9fb2ad-ca40-423c-8489-e3fd8791e8c3	50	2025-06-20	\N	USD	\N	PAYMENT FROM CHECKING	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-16	554.04	null	2025-08-15 06:44:40.261	2025-09-03 05:04:37.195	e29d55b1-d2d8-4bbd-a884-f1a8aba4d9b8
b4ecf499-5f14-459d-91c9-61ff3da3fdf0	-27.49	2025-06-20	2025-06-18	USD		VISA - 06/18 BAGUETTE ET CHOCOLAT QUEBEC CD 018760	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-09	125.4	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
d16eaab2-abef-4e1c-bd75-ec8b5eb29169	-17.87	2025-06-18	2025-06-16	USD		VISA - 06/16 KIOSQUE FRONTENAC QUEBEC CD 016920	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-02	-176.25	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
e9925fe9-351b-4f17-a49c-25b81829db0d	-15.75	2025-06-21	2025-06-19	USD		VISA - 06/19 QUI LAIT CRU! MONTREAL CD 019544	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-21-06	70.1	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
bf564efc-7248-44d4-9b83-019e5840e881	-15.09	2025-06-18	2025-06-16	USD		VISA - 06/16 EPICERIE RICHARD QUEBEC CD 016821	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-01	-194.12	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
870b2d04-70a7-43c1-ae25-43b97ef66e37	-2.04	2025-06-20	2025-06-18	USD		VISA - 06/18 COUCHETARD #1084 MONTREAL CD 018255	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-01	-21.69	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
346f4000-661b-4ff7-8412-4a33cf95ba34	-300	2025-06-18	\N	USD	Double-billed because I requested to change the date of billing to the 15th. Called, they will apply it to July	AUTOMATIC WITHDRAWAL, TRANSAMERICA INSINSPAYMENT PPD	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	75790fa2-060c-457a-859b-eaa387d3f648	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-02	1785.11	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
9726ae23-1f0e-4a76-a6a4-4d3f520c2568	-250	2025-06-16	\N	USD	\N	AUTOMATIC WITHDRAWAL, BETTERMENT SEC TRANSFER WEB (R)	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-16	2419.77	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6ca776d2-3a93-4c2f-8d20-602a6bb860de	-10.06	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-02	3077.75	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:15.548	f8eda2fb-7b44-460a-beab-5f7a1952f0f4
906eabee-6cf8-4eba-8900-54c06cb55cb5	-28.1	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-07	3001.62	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:29.783	f4030158-28c2-44ef-b89d-7106bbe36a9f
392f7e43-0ffc-4e41-8bd9-b2d8fc9fac33	-9.42	2025-06-16	\N	USD	\N	VISA - 06/13 WENDYS 6094 SARATOGA SPRI UT 013917	f	f	1361 N Redwood Rd	40.386951	-111.916824	Saratoga Springs	UT		scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	d1a7ff54-1234-450b-b7c8-cb02828a7efe	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-04	3060.38	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
6aad5cfe-fa8a-4a13-a7d2-e435c3019102	-18.5	2025-06-16	\N	USD	\N	VISA - 06/14 THANKSGIVING POINT 180-1766503 UT 014982	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-06	3029.72	\N	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
09dc5ded-eb51-4a0c-a51b-642d4297f65e	-19.01	2025-06-20	2025-06-17	USD		VISA - 06/17 COUCHE-TARD #1087 QUEBEC CD 017282	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-04	8.95	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
b047ba4a-cdb7-44dc-9b84-ad32f71c6b86	-132.93	2025-06-20	2025-06-17	USD		VISA - 06/17 RESTAURANT LA TRAITE WENDAKE CD 017391	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-20-14	435.83	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
3f6d4955-6e10-446a-bc85-f6cb27178abd	-102.74	2025-06-18	2025-06-16	USD		VISA - 06/16 SQ *NICONICO QUEBEC CD 016315	f	f	\N	\N	\N	\N	\N	\N	scraper	\N	\N	7381361c-130a-4374-9348-44df4b0eca54	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-18-05	-23.73	null	2025-08-15 06:44:40.261	2025-08-15 06:44:40.261	\N
0fde4bd9-2cc5-4e7e-86f1-729b94de8c18	-26.54	2025-06-16	\N	USD	\N	MOBILE BANKING FUNDS TRANSFER TO VISA CREDIT	f	f		\N	\N				scraper	\N	\N	9477913d-2f77-4483-99e8-894aed68e4a8	\N	\N	f2b1c2d3-4e5f-6789-abcd-ef0123456789	2025-06-16-01	3087.81	\N	2025-08-15 06:44:40.261	2025-09-03 05:03:10.915	65ff36cc-95be-4361-bf16-97d104b9a27d
\.


--
-- Data for Name: TransactionAttribution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransactionAttribution" (transaction_attribution_id, amount, memo, transaction_id, account_partition_id, category_id, budget_id, group_id, budget_child_item_id, created_at, updated_at) FROM stdin;
d0f88d75-b36f-46ac-9115-ba1c8b2eda59	17.15	\N	9d3ec1b1-6c64-40b3-9c72-7e0be6702948	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
db6365bf-b0c8-40b5-b1cd-6d4d048c1915	-76.84	\N	f27f81b3-a0de-40e5-9d64-25c42f0d34cc	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d1bfd0f6-9f11-4757-8784-84e447fa56a7	-5	\N	7ec24567-b67f-44f2-9cfb-115de092a4c4	\N	\N	\N	\N	\N	2025-08-21 17:37:21.504	2025-08-21 17:37:21.504
780325ff-fa6f-4128-8a09-93d3592ac62a	-33.8	\N	a816fa81-a7f5-4d43-9a86-fff4adc39f15	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9e99f421-9469-4310-92a4-f303796ece41	-76.84	\N	28689d31-68ea-48cb-8a51-662743e0f613	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
599c1dda-665d-475e-acb7-2aa939402c6b	-17.98	\N	0c94a7ed-4890-427f-b4e3-9a086fe17ff7	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0afaa36a-3f83-4000-9cb2-be57d29565cd	-23.14	\N	4254f10f-cf10-4395-8e11-ab89ae0d6d3f	\N	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
548acd06-ed32-432a-a111-ac0821948346	832	\N	c0a7a717-5fc8-48fe-9a04-604cef89e045	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-09-03 06:05:46.419	2025-09-03 06:05:46.419
88d0cdb1-73b4-46e8-980d-682d2d8f8e0f	-832	\N	bab28a50-14e9-4557-b2fd-790d6abdea14	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-09-03 06:05:46.42	2025-09-03 06:05:46.42
8bcb7ac4-6bb2-4b96-81d2-cb5ccf3a1a34	-14	\N	12e770c8-97cd-40fb-b251-2387abd45f9b	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
493b3e70-b2e8-41ff-81e2-ff3d1a1ff035	-50	\N	1b788d8c-e2eb-48c1-bf27-fdff7453facf	\N	8ce8b6b3-3308-4b84-9d12-ce386b829d75	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
39e97e81-60f7-4734-ab8a-9ddc91e50910	300	\N	19916ba3-bc32-4d23-81e2-3b8dfb6044ec	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
00dfecc0-d5fd-4727-a35f-64bfe2457558	-14.86	\N	318d91a4-f35e-4628-a4ab-5a5602f6361b	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-23 03:36:59.343	2025-08-23 03:36:59.343
900c1b84-bd90-4b17-a179-2444547631a2	-58.74	Cafe Rio - Dinner with Heidi	3286c48f-5d67-419e-8235-e0c9cd4a629b	\N	\N	\N	\N	\N	2025-08-18 22:52:45.951	2025-08-18 22:52:45.951
25d8d22b-a71d-413c-9613-8a80d6540b7d	-33.8	\N	42cbeb22-adec-4499-ba01-c0d3154db3a8	\N	ae4c5e34-27ca-4652-a422-ec7673d90cc7	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d84c00e6-3a19-4a88-ab0c-81e5ad1ccb39	-70	\N	9aab0e84-c1be-4480-a68c-9cec202b3fac	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	a3c1d3e4-5f6a-7890-abcd-ef0123456789	\N	\N	2025-08-18 22:53:30.264	2025-08-18 22:53:30.264
8d9a9024-4260-4118-a438-5cf6c8080d29	-300	Extra charge for arthur	346f4000-661b-4ff7-8412-4a33cf95ba34	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	fe89138d-43e6-4733-aa6e-77b4f76e8582	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6389e19d-fe0d-49b6-aa86-334cf5a7f7f8	-1000	\N	c68b7f52-a659-4321-a3a4-27c418a717ef	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	e12f34a5-67b8-90cd-ef12-345678901234	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e40343b8-28a7-4c23-bb6b-7c7e010611fc	1000	\N	f2972f4e-4f7c-42b1-a391-03a7f35bb9cf	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	e12f34a5-67b8-90cd-ef12-345678901234	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
17a01115-74ce-42bc-bf41-c31cebfa9f8f	-33.8	\N	c559d55e-ae98-47d3-852a-11db8354f98d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e3ed9a2a-a119-4b8b-a414-8d387df98a01	-5.61	\N	4c7ad3c8-2ac5-4528-9e03-81bfec1e10ec	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d7e9c176-3f5d-4f49-b5f1-aa1ad1c65dde	-14	\N	abab7896-b414-4cf0-a503-f639d7097ebd	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
548c3de7-8c50-4264-b9af-6f89c4a7e332	-7.5	\N	9b812bdb-cf8e-40d1-ad75-9982222855ae	\N	b812dac6-6a37-429e-a1c1-ede2c7f99b63	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e22f9e44-057b-4ae2-bd12-5c135a05af85	-20	\N	d2c3d54d-cab9-4da1-bb91-0dda4e0c09da	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9b316ece-998b-4d95-8b99-a4d26ae3aa36	-20	\N	f4cef8fc-6ea6-47d8-8ef9-b4725ec39c50	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
f1071a39-015e-4f78-bbeb-3801ea7ba10c	-15.41	\N	355adbfe-9471-4db3-96b6-49f02f92b08c	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	d9e0f1a2-3456-abcd-ef01-234567890123	\N	\N	2025-08-23 03:38:26.935	2025-08-23 03:38:26.935
7b7bb19b-a1ad-4dac-b210-38328d243412	-24.37	\N	5a5e7dfa-4d47-4047-9ff0-6738dc7442b5	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
73959c5a-1c13-4047-899c-2b491ba1f9ef	-50	\N	a3bbe05f-96ac-400b-a712-1b176777fecb	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
bc2535bc-e199-49cd-a7a6-61dc61a05256	-1000	\N	70deeee8-7d97-4344-b31a-3adf6b93df91	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9de92893-b642-4eb0-9367-843ee5b49c21	-11.12	\N	5c44aaa5-dd3f-44d3-90ae-4bbf786fbd4c	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0f3bd08f-30ff-4bca-99ef-411f008fe80c	-14	\N	ce452f66-ddc3-41b8-860a-63e98d75e142	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
8e81ed77-015f-424e-a225-3fbe72f56bd7	-76.84	\N	0a9aa9df-e203-4c54-bffb-af0fd76e4243	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c194537d-7d37-468d-8198-c65bd3371cad	-49.4	\N	6a0ba343-772f-4d8a-a876-9fad3c16c0b7	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d8d99789-2535-4f32-a907-381dd1b96139	-33.8	\N	68afcbfb-eb6a-42d0-bf20-8885fb4f5bd8	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4317a647-bf8e-4598-bcea-a2c995f178ec	-33.8	\N	111070f9-a5b1-4c41-99f8-0041dd866f25	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5051a04d-9424-4280-90d8-1da7bd3788eb	-76.84	\N	572f9afc-2959-4e4b-81e7-457742733235	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
de9381da-db1d-4e99-a655-224738be7960	-1	\N	f080076d-5d1a-4835-b3b4-12e7122e03cc	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5819d06e-1b66-4788-83e5-03aa1951fc54	-33.8	\N	2f5372fd-16d3-449a-8b44-57f29f581aaf	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6af081d5-0d2e-4b37-80ed-b0c39bc728f9	-18.5	\N	6aad5cfe-fa8a-4a13-a7d2-e435c3019102	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
119db456-57f9-40f9-9532-a870ec17d349	-28.92	\N	e2354211-6191-4643-8a72-3744a2027d82	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3d4d850a-1f39-45cf-8e41-ea0d2f4ce8c6	-61.51	\N	4f31ea0c-f863-4e31-b880-bdcce18e3699	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9a969e40-deaf-468e-997b-c2878b8098c1	-132.5	Hyundai Elantra Registration	f58554b6-cc73-42df-acb8-54b9b20e6f32	\N	\N	\N	\N	\N	2025-09-02 19:31:54.518	2025-09-02 19:31:54.518
2cd87e65-74a5-45cf-8e84-97b3e8b91756	-22.25	Garments for rachel	61a1af63-49c6-44ca-8518-0767896532b5	\N	b83f3fad-f06b-4052-b35b-01d261009c50	\N	\N	\N	2025-08-21 17:45:53.571	2025-08-21 17:45:53.571
59eb379a-e55a-4093-a497-e7f61cee0a6e	164	\N	3621260e-3982-4205-95f0-167dae108a2a	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
483c039d-864b-4390-9199-22f7bbb62b08	-3.46	\N	f932ba74-eefc-4eef-972d-cf7a083e0819	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
eff8031b-22ba-4380-8354-d1ef777edbea	-50	\N	e018dc87-a9c7-4399-80cd-19fb46c627b9	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
8093501c-90bf-47c6-85e1-6e0e90b52d22	-2.77	\N	a23de51e-ccb7-4212-9a19-2d6265547841	\N	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	1a2b3c4d-5e6f-7890-abcd-ef0123456789	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b0250e08-7de4-473e-9a5f-0744dc717dfa	-300	\N	818b984c-29ba-436a-ac80-32999e3f3aa5	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
846cf8a5-8dc4-4c10-b014-6f6cbe4f0ce4	-19.18	\N	a9116fc3-50a7-4a67-9254-36e992898359	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-09-03 06:29:21.46	2025-09-03 06:29:21.46
550fb284-0a93-4f45-a30e-3abe5e273fa5	-14	\N	d6789287-da31-4f1a-843d-fc0c57e45075	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
bed5ff7b-189c-42be-afae-791bea33c565	-102.74	\N	3f6d4955-6e10-446a-bc85-f6cb27178abd	\N	f1c2d3e4-5678-9abc-def0-1234567890ab	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9b4cde21-dbba-46c4-a641-2b27eec0304d	-17.98	\N	ed405fb0-3c65-40bb-ac42-d573f606cb6f	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0416dfa7-10ee-4ecb-97cc-68f14a390b10	-28.92	\N	e348ed55-3910-4332-ac14-5f911d2469da	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
799eaf5f-063c-4467-98bd-94e0144aac25	-5.5	\N	550061c0-2893-4365-af8c-f3f8d3558ba6	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ca78f2f1-71e8-456c-8211-95492b81da94	-19.45	\N	412a3207-d596-4edf-84b3-35a84d22ac49	\N	\N	\N	\N	\N	2025-08-15 12:34:21.019	2025-08-15 12:34:21.019
c2d0e1d2-f59e-4b88-9088-7a74edc8e70d	-1	\N	81766230-f823-4afc-ac35-8e72aa38c1a8	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b35f3d0d-eaa5-45a4-87c1-87aadc83091e	-15.09	\N	bf564efc-7248-44d4-9b83-019e5840e881	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5cf3281b-f743-44fd-885e-1bc4e4869686	-9	\N	74184355-96a3-4ab3-a8f3-dfe5cf452591	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9b8c3476-69d7-4f71-ae26-f17ec43e708a	-3511.3	\N	df885720-afae-439e-971a-12b938751553	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
008da37f-883b-40fa-8750-077b95fb4cc9	-33.55	\N	77c10558-faeb-4c16-8e9a-5a415f0e4b0e	\N	\N	\N	\N	\N	2025-08-15 12:34:21.027	2025-08-15 12:34:21.027
01c4cd5e-a47d-4a9a-8708-5a5e3b23b856	-53.66	\N	63131b33-4638-4838-8966-878d606715d5	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
8cd66546-a350-4afa-94b0-ca2d8354bafe	-33.8	\N	f594953f-ab1c-45b2-8678-9ac1989373e6	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5eec6929-6e2f-4120-adce-a939216e63fa	-4.32	\N	bd90c540-5610-415a-aa67-1ea0ba0e62c1	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
fabf918c-9c2f-44ec-bb20-5bf333a0ca02	-15.32	\N	d344a05d-e2e5-49c4-af5a-b07e8fa0cd69	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3cbd438e-ed49-474f-b106-29023db6e7ea	-21.85	\N	280095d9-6c35-4f48-a208-213f3054c4b2	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
528e23c8-15f0-44b1-82b2-2b36b2e33854	-21.4	\N	aacafadb-9cfe-47ac-acc0-c18baf282da0	\N	f1c2d3e4-5678-9abc-def0-1234567890ab	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
51d27f20-7cf2-470d-87d9-5ee33534ad4a	3593.13	\N	18870172-2f63-49e7-b383-073c504844c5	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b909c8e7-e2e4-4fb8-b6ed-4b5405f0a734	-4.32	\N	fd0d11eb-b1b7-45d2-a7dc-fec64a28bb91	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4f02e540-9fb7-48f2-bda8-04f0cfeddc0a	-3.46	\N	c047ff1f-b706-4434-ab5d-e893fa0d9533	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9fb6e410-739d-442e-bd52-429bd8deb140	3593.13	\N	849f8c78-f43a-4969-88f1-682b7a0aaf90	\N	881890d0-64d9-436b-a8d4-982b11276e68	d4e5f6a7-8901-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a362c053-3ce5-4646-b6f3-7ff64c5cc1c5	-41.25	\N	d319ca4a-7f02-4625-9f1b-287651779923	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
fe196700-9f21-4496-be24-2dedd83573ab	-5.61	\N	8513eab1-b71f-4b9b-8345-16314affddda	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ebd7d298-e7b4-47ad-a4a3-80db4ae758c7	-7.68	\N	c9fecc3b-b536-4183-8430-4a24fd58c85c	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
36c61440-727f-4af0-9296-6ab58c882b71	-223.82	\N	97f66183-ca96-4033-bc27-2b6663e79dc8	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6edf3ffa-90d4-4350-8616-89f34521b649	-76.84	\N	d721969b-14fe-49ba-a28d-ff2079a972ec	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
eee6063e-6387-4c5e-8c76-694c590d360c	-48.45	\N	ebc094cf-206a-44db-879b-abac918c7346	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2087fdba-1c04-4f21-ac25-74366886420d	-22.36	\N	71e57548-6059-4aba-8a9f-ece7d491f576	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6b59d521-8c16-4814-ba86-14ce98d50dee	-16.47	\N	1815703b-2c93-462b-b03e-5af1cd9a1a28	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	d9e0f1a2-3456-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7a9f3f35-9855-41cf-9404-5c50eb01b10d	-6.28	\N	61d00b56-faef-4e0d-ba1a-42f7ddd9c92f	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e3b62242-203b-449e-a783-eb64102d05f4	34	\N	6890022d-875e-4259-adf0-77d893c0a8f7	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
fbb19c6e-33fb-4eb1-acb7-9a7002b9f0a6	-13.14	\N	7d0b976b-b6ba-44d0-8bc5-045db2436dde	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
08539c14-ee45-4384-9dc5-317089927236	-49.4	\N	a8db0298-7b59-4f16-9ba0-56d95ef2a3ad	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c07a88c9-827c-41f2-9850-990aae3f7c92	-76.84	\N	0518e8e3-87e9-474f-aee7-33e449091a33	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
66127628-1886-4ae3-844d-1c86df35e580	-2.04	\N	870b2d04-70a7-43c1-ae25-43b97ef66e37	\N	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
39c3e98c-b44a-458e-90dc-3d7836087662	-28.38	\N	104574e6-5db1-4da0-b253-5e4fd5a13ed5	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0e8820c5-6745-4718-be1f-3db7ff48d501	-23.61	\N	4d147426-ae89-41c4-aa48-138ad0591e4b	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
39dff65e-0b5c-430a-9d02-a3d24e8c412f	-14	\N	fefa0ecb-47dc-449d-afcb-5f0a2e416e94	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
07fb6ec8-7c69-47b0-bbd4-365b5da6c651	-88.61	\N	e4bc98c4-0519-4dff-beff-f72f6bd9b39c	\N	\N	\N	\N	\N	2025-08-15 12:34:21.034	2025-08-15 12:34:21.034
9fd2c511-2ec7-48f6-9dd2-da75d63ca38e	-10.72	oil filter	cc68329d-12f9-40b7-a994-7a6c9d2356b8	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-09-03 06:32:16.468	2025-09-03 06:32:16.468
8bfcf38f-efbb-4913-af8e-87369edd6e69	-20	\N	81569488-1858-45b7-9f20-541a0d33e2f3	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7d44c4e6-f642-4258-ab53-ebd468c4ab2d	-13.14	\N	ad9996c7-71c0-4d7c-8d8d-92f310d71be6	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a89794a2-1005-4f15-a236-cbeb9c139bd7	-3.46	\N	8a7c9b23-9658-4e3f-a0e1-8e9b6dbb75ad	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
56b510e2-9f98-44b2-948f-96ae3f493abf	-57.64	\N	2b54d730-605c-42a3-83b1-5d587e519dd6	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
bef3ca00-be09-460c-9fe2-8002c23376e6	-1	\N	ae53556e-cd78-4aca-8997-b0c3db2d34f4	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d4f819ec-964e-4717-9271-41dbe2ec8c90	1000	\N	3c68d23c-ba83-48b5-a04d-b17a39317fe6	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	e12f34a5-67b8-90cd-ef12-345678901234	\N	\N	2025-08-26 16:36:07.282	2025-08-26 16:36:07.282
208cfb40-00a7-4f3c-9fa9-991ec23b40d7	-30	Anniversary babysitting	e5bf40dc-36e5-4c31-99af-3e52a79a7be4	\N	7d9334c5-7942-4adc-844b-dc17c6352aac	\N	\N	\N	2025-08-21 17:50:56.472	2025-08-21 17:50:56.472
3ded5155-eb1c-43e0-87e7-a52b1b2e111c	-37.9	\N	d117f042-b050-4c0c-8c4c-4db18ee85c30	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-09-03 06:32:37.901	2025-09-03 06:32:37.901
92bd038a-4fa3-4549-adf4-91820828948b	-17	\N	0652c72d-2d2b-4c16-bdd8-1203c22e82fd	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7fa89f4c-6fbd-4257-b579-ac71bf402e55	-14	Spare bike tubes	0652c72d-2d2b-4c16-bdd8-1203c22e82fd	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6ec969cd-0906-488d-a3c8-0e4bab43ff4c	-1000	\N	63ef458c-5a05-4120-88a2-88e298c5ca2d	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	e12f34a5-67b8-90cd-ef12-345678901234	\N	\N	2025-08-26 16:36:07.283	2025-08-26 16:36:07.283
888a8171-20ab-4865-b742-41254bbfea71	-20	\N	187aeb27-f943-470f-b3d8-8cdec78664b9	\N	\N	\N	\N	\N	2025-08-15 12:34:21.055	2025-08-15 12:34:21.055
e27fe7e2-88f8-4223-b607-48e1219d8a75	-1	\N	2dfdb578-8ad1-4bf2-a816-ccbcf871a85e	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
71c2aa06-09d6-4c14-b391-5f853a03d5f4	-14.58	\N	052d91f6-22ad-4f9e-b6d6-42eff225474d	\N	\N	\N	\N	\N	2025-08-15 12:34:21.059	2025-08-15 12:34:21.059
ed957c83-9e10-42b9-849a-4a6eef9d46db	-14.33	\N	17bf15bd-6606-49a7-ae5e-f32e36cf80cc	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-15 12:34:21.062	2025-08-15 12:34:21.062
2e605d4f-9c0e-41af-b1f8-8ba6a4f41d57	-17	Lehi swimming pool	04916a05-e6cf-450f-a665-8c2828887b65	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	3c4d5e6f-7890-abcd-ef01-23456789abcd	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b157a93d-6f21-44d3-a01f-c21dc2348077	-53.66	\N	71504212-a2e3-4ae1-9c6a-fd8758fc0338	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
82263be7-d6bd-4052-8d49-c1777731f7d5	-18.5	\N	4a9ff1a3-bfa4-4b9a-923a-8272ccedc921	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
f8104467-4309-4fd6-8893-06ebbb4b9f82	-76.84	\N	c97203ce-77a3-483b-9d42-f2f652fd9157	\N	c0f8b1d2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
eca685a0-dd92-44a8-8a7b-78b31d2362a3	-25	\N	ea96bd79-1603-49c4-b58a-55125804c691	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-15 12:34:21.066	2025-08-15 12:34:21.066
15f82cea-170b-4921-8973-dc45c68e6f02	-8.22	\N	c74fda5b-b302-4f93-9109-e88beb91f0b8	\N	\N	\N	\N	\N	2025-08-27 16:35:26.842	2025-08-27 16:35:26.842
fab73340-7485-4bd1-9bdc-e38bc07412bb	-105.88	\N	8e72c4fe-bcf9-4fef-b428-c63a253f26a0	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5ba1abce-0be5-4a70-ba43-ac9cc10f2204	-3.46	\N	b44dac54-09c1-4b34-bc1e-6379bf183a3a	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
fa565fd9-190a-460c-b517-715e1ad27c2e	-23.92	\N	767a3a63-5a09-4b41-acb0-28072d72325a	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-18 22:54:16.23	2025-08-18 22:54:16.23
62dc41d7-ee17-44c4-b183-0f7f36ff61ec	-61.51	\N	1b13c3ae-7e52-4780-9896-8bf58c34aa31	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b5006b84-0199-40c1-9296-eb0e3d5bbeb5	-1	\N	61e34e72-bf52-4860-bda0-042896811bdc	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4b	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a10bb0fe-6ece-485e-8dca-207d1b00c042	-28.89	\N	8228e2df-f4d5-4a7d-b250-7227a70dea66	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-18 22:54:23.099	2025-08-18 22:54:23.099
510fa5fc-af69-4a6e-a626-607971045256	-27.56	\N	6a911fa3-09b8-432c-9710-8e186fa7c97d	\N	\N	\N	\N	\N	2025-08-18 22:54:45.54	2025-08-18 22:54:45.54
12404531-83fb-4b83-a905-1cae3013665c	-50	\N	986f1279-c5a3-49a3-82fb-f7480019fc8f	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2850dfd1-d889-4edd-976a-de5a06152028	-7.32	\N	6d26f075-6cfb-4ac0-b42f-20a695128c7d	\N	\N	\N	\N	\N	2025-08-18 22:55:12.13	2025-08-18 22:55:12.13
05632b12-40f5-4825-a744-d458742dde53	-50	\N	8413fd89-04a1-4b59-8b35-f4ce005cc264	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	b30e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-18 22:57:02.386	2025-08-18 22:57:02.386
3dce3091-61b5-4063-bd02-7442203333de	-6.88	Cookies for Bricker book signing	6435eff9-d159-4fab-992d-c5b77c482e29	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
051f9157-d551-4e5d-be34-75ffc8611a7f	-47.51	\N	ca9f24f9-0c02-4b6f-ac51-7fd587be7df3	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
93106698-3481-4346-bc9b-0cf4466a1ae4	-33.8	\N	ce224e3f-bea7-4c56-88c0-faa0161f7222	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3415a6cf-4047-4475-be0c-eb149f86f457	-43.05	\N	d9abb795-e0c7-483b-b4f6-02bd440ad011	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-18 23:00:05.904	2025-08-18 23:00:05.904
bf0cd15d-cbbb-4956-a649-a735bbb94499	-10.44	\N	a47fb9b2-e231-4d9b-8bdd-8a8cd8618e09	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b438b7b4-0d54-42ec-a2ca-d3ebf804d630	-17.87	\N	d16eaab2-abef-4e1c-bd75-ec8b5eb29169	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
467f8c38-b5b7-42a0-99cc-5b94cbc6f37d	-31.31	\N	0da1307a-aa6d-47dc-9a2d-ef80d06bea80	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6af84bd9-13b1-4e09-9dde-17c89a399753	-43.05	\N	141df1cf-74ce-4b4f-a44c-92a6f1d3352d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
90871559-3f4f-4de9-8cb9-36fe8e5d7a2a	-360	\N	c85548ed-5998-476b-85b1-e2aab49fa1ed	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	c5d6e7f8-9012-abcd-ef01-234567890123	\N	\N	2025-08-21 18:10:10.295	2025-08-21 18:10:10.295
9dc8c2e2-0269-49d3-97d0-18873599b19c	-34.37	\N	977dfa9d-d5a5-4bb0-821c-129ad00f01b8	\N	\N	\N	\N	\N	2025-08-18 23:00:30.646	2025-08-18 23:00:30.646
08ac82b8-5e13-4bf2-89ab-dd1c52eea645	-50	\N	d1a3fbb7-2a19-4036-a7bf-5625a83f88b2	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a5f6d4a3-3b72-475f-803c-c75bd85bfa4f	-50	\N	58197b23-cfb3-4f3a-98a8-6607835fa1ee	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	b30e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0aa1f7eb-54bf-4406-82c7-0e2193b6ac72	-7.9	\N	e6e51bf3-7c77-4c6d-b2d7-dbed09614fd9	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5d67eed9-aeaf-4ca8-b7f6-75e40205558c	-11.12	\N	c758b7e0-ba0b-4972-ad50-a48dad8d9a74	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ec8f0f36-d1d4-4378-ba79-915f190c4d65	0	\N	b7c6e06b-9d21-4a64-984a-d7da666693a6	\N	40676754-e08b-4928-826f-a23961a2a042	\N	\N	\N	2025-08-23 21:05:15.346	2025-08-23 21:05:15.346
19658ada-8402-47c5-823e-ef6634683226	-360	\N	c8ae9591-f3c6-4712-8054-2cf38dca9289	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	c5d6e7f8-9012-abcd-ef01-234567890123	\N	\N	2025-08-18 22:43:48.109	2025-08-18 22:43:48.109
f9610301-a3cb-42ba-a81a-6e126b6b4dbc	-45.84	\N	090a273f-b04b-4458-a799-e5dc57640045	\N	\N	\N	\N	\N	2025-08-19 10:16:03.53	2025-08-19 10:16:03.53
dc825766-fc96-43b9-922c-951d7568f4a8	-17.98	\N	cd63cdd8-ef0b-4043-a667-63ac8ce831f7	\N	\N	\N	\N	\N	2025-08-19 10:16:08.573	2025-08-19 10:16:08.573
d519b7be-a423-474e-ba61-a208197166be	-50	\N	56afa764-5cc6-4727-b228-160e11dba7d2	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	b30e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-27 18:24:44.697	2025-08-27 18:24:44.697
ce253950-0a4c-473b-9a0d-14651af0ca2c	-14.9	\N	46689445-7831-4a3d-b727-1d2d047b1dee	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-18 22:44:51.356	2025-08-18 22:44:51.356
61813083-0b53-442b-8b80-8bc1a6c33a1e	-57.64	\N	0f85429c-230d-46ba-b598-cfe19467b23e	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
83e2ac80-02ae-499b-a38f-1f4a9f3610e0	-23.61	\N	bce0209d-e93d-44d7-896f-c3e8e9afcdf5	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:45:41.333	2025-09-03 06:45:41.333
f460470d-a3cc-452a-9a26-e467de68d501	-20.26	\N	a3ac637d-07f1-4472-8b1a-a8c9cfe8612b	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-27 18:25:52.23	2025-08-27 18:25:52.23
61b59512-755a-41b9-81d2-78a2d4d6b663	-100	\N	b1e9562f-98d4-44f7-9213-99449190b3a8	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
299a802e-2ba7-41c6-a536-5c09a970a041	-41.86	oil	95d5dc9c-e97f-488d-ba06-87ef6fe07410	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-09-02 19:37:10.131	2025-09-02 19:37:10.131
68fec9ec-37a6-49ab-899b-f8d42d89a4a7	3593.13	\N	cace569d-6d94-479e-92df-7bd5a7afe2d5	\N	881890d0-64d9-436b-a8d4-982b11276e68	d4e5f6a7-8901-abcd-ef01-234567890123	\N	\N	2025-09-02 19:37:39.235	2025-09-02 19:37:39.235
b3a36b4a-588b-4f48-a64d-a375394d5c36	100	\N	486fe256-679e-45fe-a77b-11852b425ea3	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
de53be37-2088-4259-86c5-73ba95ee1f8c	23.61	\N	9e6f64fd-9bee-43b3-869e-32e04472b690	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:45:41.335	2025-09-03 06:45:41.335
694f7671-817e-4b37-8bbb-e1a81d435df6	-20	\N	0408802b-d651-4f53-bdda-edecaccb6873	\N	\N	\N	\N	\N	2025-09-02 06:00:51.404	2025-09-02 06:00:51.404
398f58b0-66ca-4173-90bb-5001833b0f4f	-5.61	\N	a5720bbe-2a4c-4c6d-89a2-623cf1474f41	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
97fa6fdc-6ac6-4bbf-a48b-637f758b5a9f	17.7	\N	465f77e5-a1c0-4f8e-9ca2-36bbc47f5fb4	\N	f26d6a29-64e9-443f-b2c3-81d2b9921142	\N	\N	\N	2025-09-02 19:38:19.365	2025-09-02 19:38:19.365
84f05aaf-6458-42a9-8ad9-b8f8f7e1aab0	-7.9	\N	4d7b2f5f-6ec1-4b9e-be66-64d492080648	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	1a2b3c4d-5e6f-7890-abcd-ef0123456789	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c105af3f-6fcc-4498-b690-15d239ce0c80	-250	\N	9726ae23-1f0e-4a76-a6a4-4d3f520c2568	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0397918e-5f7d-47e5-bd01-ff8c3e77db73	-13.96	\N	f4f7c351-44fa-4506-b7aa-9a8352f66c8b	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-08-18 22:47:42.295	2025-08-18 22:47:42.295
9ffd9a4e-766c-44dc-8a03-ec919ddb0b38	50	\N	a2299a9b-e6d0-4af6-aad4-c3afca0900ee	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:45:55.419	2025-09-03 06:45:55.419
0f0f1191-d072-46db-a95d-3d3357fb0b16	-70	\N	ce944a41-f7b2-4d76-890b-d6965cb24ca1	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	a3c1d3e4-5f6a-7890-abcd-ef0123456789	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2d0128e8-b4b7-4c3d-aa79-b194fc8bdea5	-50	\N	98a4df92-278b-418e-98e4-779578ead19f	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:45:55.421	2025-09-03 06:45:55.421
00e07e86-e550-4157-b30d-8053707d5724	-1	\N	6f6b61d6-131d-4676-8b5e-598ae83603d7	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4b	\N	\N	\N	2025-08-18 22:48:08.001	2025-08-18 22:48:08.001
6f72e3a5-6541-4137-aab9-930294c78419	-140.82	\N	b2418016-b8a1-40d5-b567-994d7e00b23a	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:46:06.521	2025-09-03 06:46:06.521
799358f1-9ff1-46f3-a451-e487229c27fe	-3.46	\N	b0164948-2cbe-4b03-867f-60becb06404b	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
eae3b3fb-8713-4222-a7c2-21408c7c46ee	-58.74	\N	6966e938-9951-461d-9cab-82fcf8988be6	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
8ffd55ab-0352-4bcb-b206-b75b88933ba8	140.82	\N	f79a74d6-d4e2-4a87-a074-cab8fa9b2187	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:46:06.522	2025-09-03 06:46:06.522
3382d461-455f-458b-ad8b-718cd385df25	5.5	\N	4ca376a3-ba11-4286-a295-f355a694eacf	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:46:11.339	2025-09-03 06:46:11.339
9db78263-7af0-4856-9878-200ea46ca160	-5.5	\N	c686d30a-73e4-42ca-bfdf-e8674c8231aa	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:46:11.341	2025-09-03 06:46:11.341
5076d099-b645-4d70-a785-316ad35b1452	-26.5	\N	ff594fe6-d9c5-4193-8ea6-dbb93bc3e9f9	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-18 23:01:10.786	2025-08-18 23:01:10.786
a3f8d228-e01f-466e-8265-4af858d61588	-26.81	\N	d9246fcf-98f8-45de-8d10-de687f8ca717	\N	ee167832-1262-4caf-bb78-4a6e987cd172	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
61255712-f580-43e8-9da5-29bc3ebb4f8e	131.13	\N	bcfc44ec-b730-4d82-a676-9ef6e006d3a7	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:46:16.208	2025-09-03 06:46:16.208
4bac6d3b-f2a1-4903-aeb3-67e4d6711e40	-12.16	\N	05a3d659-4750-4694-a819-cd165157d499	\N	\N	\N	\N	\N	2025-08-18 23:01:49.049	2025-08-18 23:01:49.049
eb80baed-53a9-4641-9281-71e46284c3a8	-16.06	\N	151dd499-4553-45c0-a10a-bd2befce4d46	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ccda7111-06a2-4b2e-8939-52c7837188c3	-9.42	\N	392f7e43-0ffc-4e41-8bd9-b2d8fc9fac33	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	1a2b3c4d-5e6f-7890-abcd-ef0123456789	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
91609534-3ca4-4142-920e-9b77e554d404	-63.42	\N	0cba0864-2017-4a49-9bb6-7ce86261248e	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
601598e9-59db-4bdc-9fe8-6819635fcc44	-15.99	"The Silent Canary"	24310cb9-b823-4365-b447-98270a1171b4	\N	ae4c5e34-27ca-4652-a422-ec7673d90cc7	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
01633cf0-cea7-4114-8e8b-e77b9bc81b7a	-131.13	\N	d9761a4a-8920-4dbd-a3e1-3b25c1aa1ce1	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 06:46:16.21	2025-09-03 06:46:16.21
b708731b-9db8-4325-9f68-0d3234e40af0	-18.73	\N	5995e962-51fe-4075-a67c-1f6fa6875400	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	d9e0f1a2-3456-abcd-ef01-234567890123	\N	\N	2025-09-03 06:47:16.928	2025-09-03 06:47:16.928
3f01b748-3400-4dfa-95a9-2a7f07e6efab	-360	\N	be389374-0a46-46ec-8958-4f8c6d297e7a	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	c5d6e7f8-9012-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4e40256b-5aa0-49ba-af22-b7900fbf2afd	-8.03	\N	5d63ad67-261f-4661-8d48-990f75c52096	\N	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5f5dfb44-2d22-4f99-85a0-9b8fb875b0d8	-50	\N	ec7bf304-0419-410c-83da-b359ebe02da2	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e90950f1-318e-4225-8fe5-9544c914659e	-10.16	\N	ad7819f6-8b33-41b7-b15b-304cacd9f4de	\N	8c72592c-d453-46ac-9a2f-a9ea1570c1b9	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ef2f632f-1d02-4efd-ab64-52c8ddb4d4b8	-20	\N	77b5ed02-ae48-4bac-b95c-44bd90fb8265	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
628d08fe-6448-4fa5-a750-1b8348341a2f	135	\N	c7ae8ef6-2a21-433f-9511-f3dfe03c8a60	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
10ed62b7-5a36-4a01-8864-382288a02d04	14.08	\N	8f467b52-2042-4ceb-828a-5ca6156f95a1	\N	f26d6a29-64e9-443f-b2c3-81d2b9921142	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
cf68f48d-3ae2-4301-bf51-7c076f388d25	-7.9	\N	3a112f6e-482a-4c7a-b573-8c154a985233	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a7f29899-9fbd-4795-8450-4e7fa8e2352f	-11.12	\N	003f1961-8183-4e0a-8da1-db48d4218143	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7911ce70-0814-4a00-9644-52307c8c4f27	-29.12	\N	15733142-40bd-4af0-8d07-1ab2aa3171de	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
1737a181-9678-42a0-9628-be0c8bd6d4b4	-3.24	\N	21dcb77f-4068-42f2-bd70-46ca88eb0aa7	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	1a2b3c4d-5e6f-7890-abcd-ef0123456789	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7548f87c-205b-430c-9a7d-61606867e9bf	-53.66	\N	22291402-2632-4a7a-b6e2-a1370b0f9ddf	\N	\N	\N	\N	\N	2025-08-16 13:41:43.455	2025-08-16 13:41:43.455
e3f0e885-0052-4078-a890-babc472129c4	-197.59	\N	67da2e9a-a9c4-4c7e-a700-2328562030c4	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-18 22:49:59.748	2025-08-18 22:49:59.748
f1e421e0-e864-46d4-b81e-570ed0ce68c4	-30.38	\N	f4d6ecad-435b-487d-9515-2bb4e6be633d	\N	\N	\N	\N	\N	2025-08-18 22:50:16.818	2025-08-18 22:50:16.818
6a5fe061-2113-4944-9dcc-193c545f8f04	-14.39	\N	85060cfd-9b17-4c6f-a0ef-d890e7dbfe48	\N	\N	\N	\N	\N	2025-08-18 22:50:44.578	2025-08-18 22:50:44.578
5fef81ee-0014-4f35-b416-1717a975e739	-73.79	\N	c44a8845-f505-4e85-8aff-503b2b7a762f	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	a20e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-18 22:50:52.491	2025-08-18 22:50:52.491
9cdbe0f5-8810-405b-9b38-b2bd822caa65	-164	\N	ae6c4afe-eb29-4db6-97ba-8f0821968585	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
8590453c-fcba-4769-8943-e95028600e8b	-2.85	\N	01f9a132-c5b8-4c0a-854d-4b1577da80d8	\N	\N	\N	\N	\N	2025-08-18 22:51:04.011	2025-08-18 22:51:04.011
588f7ce9-b12b-4360-aa04-08bf08da493b	-11.05	\N	37a190b2-2af7-45c6-8fd5-69f595dd02c8	\N	\N	\N	\N	\N	2025-08-18 22:51:10.13	2025-08-18 22:51:10.13
641f06da-ae37-4b70-9ef8-fc10a0dbc0f3	-12.96	\N	3e50733e-4b46-437d-9326-b607cba26352	\N	\N	\N	\N	\N	2025-08-18 22:51:16.107	2025-08-18 22:51:16.107
77211677-4cf3-4055-a572-26823d5e63ac	-10.44	\N	07f0d0cc-1674-48da-976f-90db9d2b8aaa	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
531d4ff5-052f-4bee-a0ee-f03fe81174ec	-14.42	\N	ae3295bc-167b-4d9b-9ec6-37592737af48	\N	e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0d4e6ff9-df54-4a1a-91c8-b17e7976081f	0	\N	00b0c1eb-6b81-41b0-a88f-c3300947c12c	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7101d290-fbb9-4cf4-b73c-dae79cf6817b	-318.19	\N	46fe6d54-601e-4a65-8457-1703781a2784	\N	c199d55c-6e60-4e6a-8b15-675d6909db7b	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	6f7890ab-cdef-0123-4567-89abcdef0123	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
06e8ec99-0630-4a60-9100-586c7ed81b1e	-0.25	\N	a43e7180-9f42-44a6-a67f-9572e595974b	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e05eb664-f5fd-4d1a-bb4c-93eb9d6a47e8	-3.46	\N	011ee004-ce4a-4183-8f58-777dcf9d0d6f	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	1a2b3c4d-5e6f-7890-abcd-ef0123456789	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b503e9d2-9ae1-4950-a7a9-223897459fb0	-31.31	\N	5ebaa1d2-a409-4c1a-9402-b83af63094c7	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2aa3dd57-9910-42de-b763-d129c7b15c24	-43.05	\N	a3915a4d-ea1d-4403-bb31-aaefb1ba9648	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
86a92330-2681-4271-8123-5fc5b8ed2b2f	-38.29	\N	2a6d3b1e-51b3-45ac-9848-df0cc8fc60b2	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-18 22:51:29.652	2025-08-18 22:51:29.652
388fb02d-5acf-44e4-9b7e-878bc920d00b	-360	\N	33ce69fc-0874-4681-b6bc-df576decf374	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	c5d6e7f8-9012-abcd-ef01-234567890123	\N	\N	2025-08-18 22:51:52.395	2025-08-18 22:51:52.395
91621b25-d12e-4b89-a8b5-7aea967d1cc1	-162.74	\N	570026e5-93f5-4f17-adf5-fda22b6d5c87	\N	\N	\N	\N	\N	2025-08-29 21:00:46.167	2025-08-29 21:00:46.167
380ba988-43f8-4090-9203-b638f26e9f57	-37.9	\N	5f7a41ef-658d-4c44-9a7f-85bfae94b563	\N	\N	\N	\N	\N	2025-08-20 22:03:38.462	2025-08-20 22:03:38.462
c5dc20da-6138-4437-888a-b47d338f608e	103.74	RMC	10ae8312-f78c-4e3b-a198-9f923bd51232	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	\N	\N	2025-08-21 21:46:33.141	2025-08-21 21:46:33.141
bb4f80a0-3f15-48bc-a2ab-a74da4ffa976	0	\N	ce9cf483-523a-4f95-8896-3a26a1dd273c	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
03e405bd-e1d0-4988-a9f3-6097a29da3c4	-14.7	\N	3fa970d0-d0a7-4951-a58a-b6ee912948d0	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
f2d457b9-a0cc-4f10-a4d6-8b04c2275ddd	-26.71	\N	f19d9d54-4468-42e9-a4d9-7d1fb3642d52	\N	\N	\N	\N	\N	2025-09-03 06:51:33.554	2025-09-03 06:51:33.554
cf54ac51-f1f1-437a-8482-3e3c6ac7221c	3593.13	\N	2c7b8742-8e03-4972-a99e-fd73ab2c9487	\N	881890d0-64d9-436b-a8d4-982b11276e68	d4e5f6a7-8901-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
fb8d0cc1-5513-48c4-8c71-5f44bb23725d	-1	\N	5e572568-7bb8-4b60-9729-cf9189e8f34d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e9867cdd-4dfe-430c-8723-8101ca856d01	-53.66	\N	b745352b-ec70-4876-b491-d43975217ead	\N	a9701bf6-4ad9-4ef2-8b3f-acddd562e6e6	d3e4f5a6-7890-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
62faca86-f6ad-4f81-8953-978d7bc517e9	-1	\N	57bf344a-a82b-423f-b356-34cd129e5732	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5d13af35-619b-4930-aa6d-76cb4eeb9d07	-71.42	Anniversary lunch provo	91eb6eaf-ea39-447b-ad55-03935769b35c	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	\N	\N	\N	2025-08-21 21:47:48.134	2025-08-21 21:47:48.134
2ae9bcc2-d241-4d7f-a2b7-713f2ac04656	105.29	\N	a99526b8-1b01-4875-9f98-3b8f6ca4d555	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
eeec3b84-568f-4364-85eb-e8320a5dd286	-45.84	\N	ef3ba1a3-3201-4bbf-bd4c-491fccbca70d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
05df301a-1192-463b-bdd9-734315a1f214	-13.14	\N	a1f2c779-610f-470a-bbcc-3a85ba602422	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
8c125b7e-a139-4fa6-9e93-4fd92e5c1b53	-37.9	\N	dbb89162-f91e-43b3-a7d1-30be6d3b96c4	\N	\N	\N	\N	\N	2025-08-20 22:03:38.462	2025-08-20 22:03:38.462
b782a462-0c2c-46c3-a2de-32817b86aa5c	-10.27	\N	d602e08c-c3f2-43db-b170-444dd9fa154c	\N	\N	\N	\N	\N	2025-08-29 21:00:46.167	2025-08-29 21:00:46.167
2d19760c-e7cf-44f7-990e-0fb27f0d2751	86	\N	c2ef5be9-d427-49a3-9a32-5c208881ccbb	\N	\N	\N	\N	\N	2025-09-02 19:26:51.684	2025-09-02 19:26:51.684
f9292b0b-956f-4c22-b4e8-7724b55a6e1d	313.91	\N	17478993-6375-41d9-810d-5fb874455add	\N	c199d55c-6e60-4e6a-8b15-675d6909db7b	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	6f7890ab-cdef-0123-4567-89abcdef0123	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
138cdbf7-6196-4f9a-bfaa-034558233467	172	\N	5fea4729-5c25-4c44-9c62-591d58d37d4e	\N	\N	\N	\N	\N	2025-09-02 19:27:36.339	2025-09-02 19:27:36.339
3ffe4d0d-3972-479a-b64a-6fa6795301fe	-86	\N	48fac275-0a5d-4fe0-972e-031120a6b30f	\N	\N	\N	\N	\N	2025-09-02 19:28:01.463	2025-09-02 19:28:01.463
b2301546-dda6-4ba0-a726-0b97bb043bed	86	\N	acb0ada5-6305-4f08-9527-5f64b963713a	\N	\N	\N	\N	\N	2025-09-02 19:28:01.464	2025-09-02 19:28:01.464
f8d326f6-5f47-4aa2-a2a0-8394033c9aa1	172	\N	34f56b75-40dd-4256-b1b0-ec0bca9bc485	\N	\N	\N	\N	\N	2025-09-02 19:28:06.254	2025-09-02 19:28:06.254
015d3e2c-27b5-4fdb-b6fb-88cd84e4def9	-172	\N	0eb9183c-7c4a-412a-9d4c-815541f2c50d	\N	\N	\N	\N	\N	2025-09-02 19:28:06.256	2025-09-02 19:28:06.256
fff14b14-19e2-4dd3-9866-2610d77ed7ea	-43.89	\N	cb3e0bf1-01e2-469a-9a8c-823bac787231	\N	\N	\N	\N	\N	2025-09-02 19:29:15.556	2025-09-02 19:29:15.556
b42ea423-b047-4035-ae76-9a531e577342	43.89	\N	7ec0439a-2492-45a7-95d8-1f221d73fb28	\N	\N	\N	\N	\N	2025-09-02 19:29:15.558	2025-09-02 19:29:15.558
7c37a007-2f58-400f-8857-0b932ec850b9	43.89	\N	db1c3087-2336-45f1-9f9d-7b9bb6a4ab6e	\N	\N	\N	\N	\N	2025-09-02 19:29:47.145	2025-09-02 19:29:47.145
b5d906ac-8fc6-4ec9-a2d9-3b10ea1fc3b8	-43.89	\N	b065dd6a-942e-49f2-a0bc-ac1f05a33257	\N	\N	\N	\N	\N	2025-09-02 19:29:47.146	2025-09-02 19:29:47.146
cf318e5f-2b18-4702-bb72-f7b0cb4cbea0	439.19	\N	a37dbdcc-c24f-466d-b2ec-ae5b648e5f3a	\N	\N	\N	\N	\N	2025-09-02 19:30:52.591	2025-09-02 19:30:52.591
527724fe-dbf4-4065-b923-282e01e44640	-439.19	\N	7c42768c-8042-4e98-8b39-7ec915fbad8e	\N	\N	\N	\N	\N	2025-09-02 19:30:52.593	2025-09-02 19:30:52.593
3ede404a-7496-4387-bf1b-51eb3f9dab24	-429.19	Elk Freezer	c15b1d9d-1a99-4385-b1ed-9567e046a4cb	\N	\N	\N	\N	\N	2025-09-02 19:31:10.597	2025-09-02 19:31:10.597
94660273-45b3-4df4-a605-df812cb381b2	-12.34	\N	dc200089-4a80-44e2-9e09-8175457c2d62	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 22:19:38.082	2025-08-21 22:19:38.082
0c8251cf-873b-4926-b17a-d549ce808659	-3.46	\N	7a57c2d9-e797-48df-9d42-e865c3e4600e	\N	\N	\N	\N	\N	2025-09-03 06:58:00.178	2025-09-03 06:58:00.178
313a5eb3-d104-4aea-9969-3e53ec069316	-63.42	\N	e1496622-16ba-4ac6-9316-4a5d6661b428	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7bff97c4-2c71-480e-b43a-a1c16afa717e	-1	\N	0d92fa33-fa10-4a4b-8663-1146b118bb63	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
dccaad9f-2660-43ae-9c6e-ca1d5dc3b60a	103.74	\N	b13ac6a2-3834-4e4d-89f6-a3006293a403	\N	881890d0-64d9-436b-a8d4-982b11276e68	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9d56979d-cc62-4199-a785-ad0543094fc2	-45.84	\N	3974dcfa-de1d-42ed-be3a-cfadb932d2d4	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
cb359d45-afe6-4bf5-af4b-7480612d1cb3	-223.83	\N	cc359d45-afe6-4bf5-af4b-7480612d1cc3	\N	\N	\N	\N	\N	2025-09-02 14:28:08.279	2025-09-02 14:28:08.279
03f6ec98-eca6-4293-91f4-9dbb262bca94	-38.34	\N	16a54d5c-d030-4c53-8bbd-418ce34223a6	\N	3a5d255c-4210-430c-9522-528edaf60c57	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
60a06603-e640-4ac1-9561-831b74898a1e	-8.12	\N	efaba4d3-01ad-4278-8b86-819bf86b53cb	\N	\N	\N	\N	\N	2025-09-03 20:00:50.892	2025-09-03 20:00:50.892
8be73ba0-2d30-49df-af89-5a5651002948	-6	DVDs	bd5c9bcd-cbdf-46c9-a2e1-3126ff51b02c	\N	\N	\N	\N	\N	2025-08-21 22:19:56.071	2025-08-21 22:19:56.071
bf23025d-7299-4c88-8044-1863cce0f092	-28.81	\N	6f4b9f49-5db6-4a6c-9186-e86b90a456d2	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 22:20:32.458	2025-08-21 22:20:32.458
1307f5fd-e049-4848-9e82-bc842e7f997a	1000	\N	c80a9b2c-500d-4919-bcff-3f0b9555c31a	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
504e4043-a4ed-4e0c-a317-2f2b67262ccb	-20	\N	9437b7e0-5108-4757-b334-bafe99fda5d7	\N	7d9334c5-7942-4adc-844b-dc17c6352aac	d50e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
f0ba923e-ceca-48c1-a61c-7d2926ccb1ba	-145.11	\N	80e93aa9-24dd-4e7f-be8e-315ff7852ed4	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a64f9487-a8c3-47ae-b493-906415d2dd79	-178.87	\N	c85ef39c-11a4-4324-a283-2a1ec0e7c9f5	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c444ef18-f0a4-4aca-80ee-38c29f340121	-53.66	\N	d5a18522-2614-4c8c-a56f-c602c79e4052	\N	\N	\N	\N	\N	2025-08-16 13:41:43.456	2025-08-16 13:41:43.456
83dae110-b31a-4585-bf59-86c37b2bb73a	-111	\N	e683857f-d16b-4c1f-a075-8bbafb89b224	\N	e9f0b1d3-3e4a-4f5c-9b6e-7d8f0b1c2e5a	d6e7f8a9-0123-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
1a295f42-7af2-4b42-8775-4adc22088341	-22.03	Anniversary gift	ad4b0ca8-91d1-4a78-8ed4-3a0db03d7862	\N	594b69f1-cef7-4f49-b275-174d00ecece0	\N	\N	\N	2025-08-21 22:21:40.72	2025-08-21 22:21:40.72
80478f7e-6893-41f0-a9fc-1d08c21f466b	-7.6	\N	59414d9f-ae75-4c96-908d-be15639fa9df	\N	\N	\N	\N	\N	2025-08-28 18:30:21.649	2025-08-28 18:30:21.649
74eb33cc-4f31-45df-93e1-900a647b8136	-26.78	\N	c40c28e4-96ce-4ef9-9f31-34914cd1af50	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
19df70ab-1c76-455c-ae36-03a87a7459a3	-135	\N	9fd96348-3f43-438a-a89f-b79fb2628421	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
85e825db-db05-4e0b-9155-85bc471ad089	-10.27	\N	cefc532d-a7fd-4744-b2b1-0889b6b54179	\N	\N	\N	\N	\N	2025-08-29 21:00:46.167	2025-08-29 21:00:46.167
0b68f53c-e411-47bd-8c62-a2462d7925c6	-16.34	\N	446c08dd-2df4-4c78-803d-eed7e24cf126	\N	f1c2d3e4-5678-9abc-def0-1234567890ab	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a5d033a8-eb69-48c9-ba96-46ad7589b1f8	-38.11	\N	d73f2383-e47b-4061-b6be-1057f69338e7	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5d5b428d-a7ca-4a7f-a949-43308fc59ab4	-32.86	\N	57074918-f169-4eec-b67d-346c527a69ac	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
dd0348e1-43b5-4f5d-935f-08755575061d	-2.96	\N	8d01569e-de8e-4ba5-860e-2066bf90d5e3	\N	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9c1c19f0-e59e-490b-901f-b9389c4de5e0	-35.19	\N	1106f967-d078-4e20-b077-297fb4456d92	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
cd5e3486-566d-43b1-a8c3-22336bbacca4	-5.54	\N	45dabfd5-b79e-471e-a034-87d43d8ad234	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3ac9e99a-5641-4d74-bc09-2e0dc52a4016	-5.18	\N	4532ef14-11b8-4955-86f1-ebbb76a9a300	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
011ada08-7656-42db-9bbb-ed3c61757a16	-250	\N	adb89961-7194-4486-b504-f50968910799	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4505c5c0-b394-4807-ac0c-1131ee0fd4a6	-8.82	\N	a56e499f-148f-49c0-b0be-9dc8b7e3ba3d	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4758403c-00ed-4d48-b608-9b62b59faf28	-8	\N	2ee1af13-a045-4819-a421-13e664a4391d	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	3c4d5e6f-7890-abcd-ef01-23456789abcd	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
56042c01-e89b-464f-8690-bb72b9191136	-300	\N	5ef435ec-cd1c-4d88-b7b1-994a297e89f7	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	fe89138d-43e6-4733-aa6e-77b4f76e8582	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
df6b1c2b-01e5-4b0a-8940-00c9bfa3ef6a	-7.6	\N	25191cac-361b-44cf-a5c2-b86de442908b	\N	\N	\N	\N	\N	2025-08-27 04:02:47.428	2025-08-27 04:02:47.428
02380d43-c39c-4625-82a5-d7103a2fb82c	-7.6	\N	2d33daa8-883a-49e4-a06e-86ca7f9ae46a	\N	\N	\N	\N	\N	2025-08-27 04:02:47.429	2025-08-27 04:02:47.429
8bc93299-55a9-4a99-803e-e9491ad1653c	-250	\N	1252bf1c-63de-452b-9491-83b1d17700af	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	42f56a78-90b1-2c3d-e4f5-678901234567	\N	\N	2025-09-03 07:04:05.938	2025-09-03 07:04:05.938
5e156ae2-a420-4dd4-9238-e8960ab845d0	-11.08	\N	68356084-8c08-4aaa-a6eb-443cc323ba1a	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
51f735f0-1064-4873-bbff-69d5e0c4362a	-8.22	\N	04e77254-20a1-4e92-9821-fb638b19d931	\N	\N	\N	\N	\N	2025-08-28 18:33:30.436	2025-08-28 18:33:30.436
d55bc671-441a-48ec-a119-44644503bc23	-15.75	\N	e9925fe9-351b-4f17-a49c-25b81829db0d	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
32e42452-2bf6-407d-b9f0-7884339372fd	-162.74	\N	f068c0bb-95f0-4104-be26-8c8cbfd6aa30	\N	\N	\N	\N	\N	2025-08-29 21:00:46.167	2025-08-29 21:00:46.167
d9ecdec5-2cc3-4252-be14-a408066baaf7	-1.5	\N	e7550129-78f2-44e0-b5a7-ba19806052ad	\N	5d0b38c6-cd30-446b-824a-a5e1c137663a	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
10ce5824-b771-4b48-a14d-0a6e4104a8ac	-23.61	\N	791dc0d8-eadb-45de-8192-35cd57e42b87	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-09-03 07:04:57.464	2025-09-03 07:04:57.464
b20e2356-51b3-4487-8a2f-f0179ab189c7	-24.88	\N	77119f1a-58a5-45ed-99f1-f251f6a8eb6e	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-09-03 04:03:52.597	2025-09-03 04:03:52.597
5da8e696-0ac5-47a4-a487-cbfd79f6181d	-59.02	\N	48aa6d50-8604-4aca-aba6-e6bd45e664cd	\N	b1c2d3e4-5678-9abc-def0-1234567890ab	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
048f34d1-59d4-4b6b-a5fa-03110876dce6	-9.39	\N	074789bf-c89d-46e5-9747-4e4aa022d941	\N	f1c2d3e4-5678-9abc-def0-1234567890ab	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
afa53109-1d34-46bc-8af6-3f23647e88b7	-21.44	\N	5553196c-0745-42c9-8ef4-53e1ad8f82aa	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b7e32c3e-1ab9-4f8c-8a32-e8db98b9dfd0	-17	\N	ae4481ad-2a83-4cc1-909f-365c261c4838	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ab2c0b5e-eb96-4568-867b-4b5ea49c1166	-200	\N	125e2d79-fce8-488b-9597-610bb34099fd	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c94a5e72-5b0d-4ecd-899f-a6e3cd8c818d	-50	\N	ab9bf84f-3ef4-4a76-9fa9-e91889cc01cb	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	2b3c4d5e-6f78-90ab-cdef-0123456789ab	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b91f81db-a8c9-441e-99da-589cb553ad95	-2.24	\N	c178b72c-be0a-4238-b15c-49ce07df1a3e	\N	92d6b0df-8fcc-40a2-9591-cf03af9dc723	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4b1fdd15-8e28-4a6f-bdf7-61f0bf7047f1	-4	\N	7bc59d45-afe6-4bf5-af4b-7480612d11f6	\N	\N	\N	\N	\N	2025-09-03 08:16:03.386	2025-09-03 08:16:03.386
86a130c6-2fdf-45d5-a5dc-2e9c6f478291	-58.74	\N	cff8124d-e733-4cff-a050-af35d746873c	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2fcb0a5a-c734-4b9a-a8f6-0c9ac3d23de3	-37.5	\N	dc510458-c369-4f3a-9f48-57434d237836	\N	\N	\N	\N	\N	2025-08-28 04:39:19.089	2025-08-28 04:39:19.089
1b4c2b5a-4246-4041-ad52-61ad002f8080	-270.13	\N	34389030-6d57-4fb2-8c82-3403991aca59	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 22:52:57.513	2025-08-21 22:52:57.513
cd5ffd14-b411-4279-bf34-785caa8e85f4	-22.25	\N	23f13b71-a5ea-4941-9154-763043b5abc0	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c132d9cd-b96c-4453-968e-775af5345aad	-22.25	Annabelle birthday gift	ad397715-cade-4a76-9d18-66a5d84af256	\N	594b69f1-cef7-4f49-b275-174d00ecece0	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0d70020e-acbc-4fe7-a141-9c66e4ffe14b	-1.07	\N	e43b7af8-cc3b-48fd-b0e4-efcae52894d6	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9b	2b3c4d5e-6f78-90ab-cdef-0123456789ab	\N	\N	2025-09-03 04:05:27.334	2025-09-03 04:05:27.334
537d0884-5793-4d87-8099-034d64e40f47	-20	Canning jars	3d1f8c26-50bd-4ad5-b53e-faa81222ee34	\N	\N	\N	\N	\N	2025-09-03 04:05:59.596	2025-09-03 04:05:59.596
28418232-64bd-40a6-a47d-57b6b8b2ccbb	-53.66	\N	605d1c7e-5fd6-46a1-97ad-5dfaa7942d22	\N	a9701bf6-4ad9-4ef2-8b3f-acddd562e6e6	d3e4f5a6-7890-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
15ba2d14-2989-4590-8df0-868185d88928	-35.17	\N	8ccf70d3-e33d-4ec1-874b-cd67c9a23a93	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c5b4502c-91ce-4180-8ffe-5b36f5a5c858	-29.92	\N	459bbeb2-1008-47be-a46e-0c01f4cc2bf0	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7704cdfb-7eff-4c03-ae85-6652f5022aa8	-57.07	\N	86bf286d-0a9b-45eb-bc0c-251515552b52	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
233ad5b5-e1db-456a-83a0-a3af28719bcd	-168.21	\N	c0c9a42e-ff2f-4894-b60b-c7f62dcc54fb	\N	f1c2d3e4-5678-9abc-def0-1234567890ab	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d4e8dbc4-c9f6-47a5-a278-575dbb9e3fba	-18.99	\N	820bfa7e-228a-487e-b4c8-519285510318	\N	b3c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c0eb151c-22d7-4d95-ac8e-fd6826aace40	-0.28	\N	d8fd4211-d2f9-40a7-ac5e-30537e1c5f66	\N	5d0b38c6-cd30-446b-824a-a5e1c137663a	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4d63cdad-1b05-4645-a174-03d12f3ed8b1	-31.49	\N	d0017fd2-80a8-4d7a-afbd-7a3323b08fd6	\N	4acd8f6c-a108-41f7-bb74-44f342008f5e	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
32a3c8d9-2c05-4ecb-a506-a2ba35faba57	-27.49	\N	b4ecf499-5f14-459d-91c9-61ff3da3fdf0	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
137f6832-b69c-458b-bd7a-384d2dddf6a2	-41.9	\N	0bd5e090-38b6-4311-a972-dba026d382cc	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
34dff0c5-5733-4bf5-a8d5-5b7d0d9706c0	-2724.81	\N	d3331192-a7da-4a63-8ed1-22a4d8494526	\N	98bd1be3-fcde-4fbe-af1b-7178315a25da	d7e8f9a0-1234-abcd-ef01-234567890123	\N	\N	2025-09-03 08:20:38.059	2025-09-03 08:20:38.059
430d8f34-e4e8-42fe-a9cc-56183a794063	-25.38	\N	0408e858-dd72-40ec-8651-6892d639da26	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-15 07:30:26.892	2025-08-15 07:30:26.892
6c713112-f8ff-4880-bbe7-7aa78fe8f2cf	-9.42	\N	93e75786-1e2d-47bd-801b-454c63530886	\N	\N	\N	\N	\N	2025-09-03 20:00:50.892	2025-09-03 20:00:50.892
ac70e190-fc1b-4db8-b882-a0e5abb0f346	-10.79	\N	3f5cc83f-32a9-46b8-b3e2-300cf1d02bfa	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ee25ed3b-8d62-4feb-aa8f-b5d6a6a2d800	-49.4	\N	6db801ec-5c45-4206-b0ee-2901210a4a00	\N	b83f3fad-f06b-4052-b35b-01d261009c50	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
c7de04ac-9a41-4b77-898c-8d273737fb69	-5	Turtle Rock entrance fee	32710e17-49b3-45ec-b344-6153897ff934	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-15 07:30:26.897	2025-08-15 07:30:26.897
8b1e1207-0e52-4ca9-8306-4360c005b378	-14	\N	91231b69-6c77-49b9-9c3e-f7ccc671f4b5	\N	4bca50a9-190f-44eb-94d2-e02df52ca312	3c4d5e6f-7890-abcd-ef01-23456789abcd	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5b9e508d-8f6f-4231-b32d-06bbd84c6aea	-7.32	\N	d715c312-ac50-48e2-8717-7908b9c2705d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
badb23b4-69ab-44f8-85da-654b7452f18f	-12.3	Reservoir entrance fee	d6fccb87-3c1a-4527-be90-cc2232a76c83	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-15 07:30:26.9	2025-08-15 07:30:26.9
e3d3843c-e2d7-449f-ab64-bec753365b7c	-162.74	Peaches	da5bcae8-b687-4eea-b577-46a3c1174073	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-09-03 04:07:39.989	2025-09-03 04:07:39.989
324ca485-4c24-40b9-86a8-bc6696049e33	-25	\N	17fb7453-3131-42a3-9b82-07d31fc29029	\N	\N	\N	\N	\N	2025-08-15 07:30:26.906	2025-08-15 07:30:26.906
7821c140-1945-4079-b1f2-36d900bd4a74	-6	\N	dddb15ec-2abd-4574-a17d-08c23ac38762	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ab41ec08-dabd-4cfd-9778-250b3f75bae8	-10.44	\N	6e056eaa-e937-44de-a19c-d0571dc1e9c8	\N	e8ddbfdf-7b34-41dd-90cb-134ef3c737f5	\N	\N	\N	2025-08-15 07:30:26.915	2025-08-15 07:30:26.915
e0c7d759-1e20-4a05-a335-630c66af00c5	-31.31	\N	bf04bb40-d299-430d-a448-9e0be7dc46f4	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-08-15 07:30:26.921	2025-08-15 07:30:26.921
e078b07d-b9c6-4bd8-b63e-bb479754c936	-50	\N	022752f2-524d-4662-93a3-517cd3fd1459	\N	\N	2b3c4d5e-6f78-90ab-cdef-0123456789ab	\N	\N	2025-08-15 07:30:26.927	2025-08-15 07:30:26.927
e7647537-b894-44bf-970b-5854ce4ece12	-26.61	\N	b4f676e3-bdda-4a29-ba05-b65af21e07cb	\N	\N	\N	\N	\N	2025-08-29 22:00:59.217	2025-08-29 22:00:59.217
aa51c153-9fb6-4214-9cb7-5e4526d50d65	-14.49	\N	6d78ee2e-fd74-40b2-9bc2-bfef999996f3	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	4d5e6f78-90ab-cdef-0123-456789abcdef	test-wyoming-2025	\N	2025-08-19 11:04:15.2	2025-08-19 11:04:15.2
53547b67-dffd-49a1-adcf-28558a684489	-14.58	oil	2aadf383-7960-46ba-8114-e8954e933475	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-08-21 15:18:26.546	2025-08-21 15:18:26.546
7046dbc6-2c7c-4c17-add7-f425c5092534	-22.03	\N	3f6a5490-c5b0-4454-9055-f133f0262e70	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
90e2e21d-e616-409a-8977-06e257073628	-41.9	\N	94a6518b-eedd-4f9f-a1be-e5647a98f1bd	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
f1969f5f-fb1a-44d6-893f-89370ebb5087	3593.13	\N	1a49460f-114e-43c7-bf44-a970671c8f73	\N	881890d0-64d9-436b-a8d4-982b11276e68	d4e5f6a7-8901-abcd-ef01-234567890123	\N	\N	2025-08-28 19:57:09.978	2025-08-28 19:57:09.978
655a078e-cf1d-4d9a-942b-8a665a02b11d	832.83	Q2 Bonus	1a49460f-114e-43c7-bf44-a970671c8f73	\N	79a890d0-64d9-436b-a8d4-982b11272d56	7c13f6a7-8901-abcd-ef01-234567895f3b	\N	\N	2025-08-28 19:57:09.978	2025-08-28 19:57:09.978
325cf141-d4e2-4941-a9a7-8086f4d285cb	-33.6	Pocatello groceries	6edde683-c6ef-4cbd-91ed-e3ab6ade3d67	\N	\N	\N	\N	\N	2025-09-03 13:31:26.072	2025-09-03 13:31:26.072
39bb0956-57bb-4f00-b7c3-7d030f6e51c2	-6	\N	110d2039-a61d-4446-932e-0d994a9d37c3	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
0359a5e8-9f6a-4b07-9f44-5dc3fc25bcba	-8.12	\N	29eb55b9-c3d5-4e66-b407-9e37884a9d7a	\N	\N	\N	\N	\N	2025-09-03 20:00:50.894	2025-09-03 20:00:50.894
9386482d-74f8-4423-9244-63e6521f83ed	-72.58	\N	4c334cff-1060-4454-b949-5668ace49c80	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	\N	\N	\N	2025-08-21 15:30:24.67	2025-08-21 15:30:24.67
7dfe9811-dc31-4c6b-8691-91a440b83526	-7.32	\N	326874fb-05ed-4fbc-8598-134ba691a132	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
53dedb5d-12ba-46c3-893c-ff9ee1513789	-12.16	laundry	0577de06-6a4a-439b-ac64-4077a618715a	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
762bec49-8057-4cf6-869b-c716667aedea	-45.04	\N	81d29ff1-0d9c-4690-828d-d0839fda928c	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	a20e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ae2a272d-4aa0-47f1-9501-34108c1173b2	-9.42	\N	49405c5c-e669-4ec4-9021-bc15bfcd9218	\N	\N	\N	\N	\N	2025-09-03 20:00:50.894	2025-09-03 20:00:50.894
7f105697-cb9c-45fa-bf89-f743963601a1	-11.05	\N	7b92c7e9-24f5-4001-8dd2-42aa2a4937d9	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e9afcc0d-d25c-448d-a947-4d3adf9ab14a	500	\N	d32711fc-ae47-4da7-9612-ea679d467c69	\N	\N	\N	\N	\N	2025-09-03 05:02:16.244	2025-09-03 05:02:16.244
85f932ab-45a8-47bb-84f9-21f05b0b9af7	-22.03	\N	46d92940-d823-405c-a365-70b60a379abd	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9ba2abe6-13f3-4288-a317-5b42d46a7d75	-100	Transfer For Rachel Costco	ae150aaa-6506-40e2-bd2a-bae3c9c998dc	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 15:33:00.927	2025-08-21 15:33:00.927
01d10389-d5b4-4be6-b4d2-8603493dbe26	-2724.81	\N	0a8b2c87-6559-4d15-bb1f-e8fca86dacc9	\N	98bd1be3-fcde-4fbe-af1b-7178315a25da	d7e8f9a0-1234-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3ed26b5f-9fd7-42e6-9f8b-a3ad04497cec	-500	\N	ffad4915-f89e-4502-9f01-5981d3eba33b	\N	\N	\N	\N	\N	2025-09-03 05:02:16.245	2025-09-03 05:02:16.245
40b8a03a-f2e3-4a91-9bd4-fb02bfdc888b	164.16	\N	f74fcb08-dc1d-49ec-a0ee-d6df501fd541	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:02:25.992	2025-09-03 05:02:25.992
3744e32e-7b36-4df6-9088-b59506b8cca3	-50	\N	d2d80fd9-f049-46d6-b659-5aaeab0569e0	\N	\N	2b3c4d5e-6f78-90ab-cdef-0123456789ab	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
ab47b4ea-088c-4145-bc71-3a5b73693812	-164.16	\N	d04e8071-2632-4e59-b93d-4657ffb5efee	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:02:25.993	2025-09-03 05:02:25.993
962428b5-4db7-4343-9347-3a81d48b7bbe	135.07	\N	78c81937-0499-48aa-8565-d035c8914812	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:02:32.268	2025-09-03 05:02:32.268
79635d8b-dcbc-4276-9fd3-5b9c06d2920b	-135.07	\N	4d45664b-916a-416f-a26f-311910a17e32	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:02:32.269	2025-09-03 05:02:32.269
672fb5cf-a174-4e0c-9565-d91945c8c0e6	135	\N	c23cf767-b3eb-4419-9713-ea01edb21dc7	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:02:43.06	2025-09-03 05:02:43.06
01c1db44-42f6-4740-a309-285e1be5af40	-135	\N	e25392a9-3fd9-4faa-bf72-26e340ed5ed9	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:02:43.061	2025-09-03 05:02:43.061
d15da16b-91c6-4404-aa21-0f55e8ef9283	28.83	\N	7a40530a-38a8-42da-a4c4-b922c6e2115c	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:06.961	2025-09-03 05:03:06.961
1e7c5f07-5a3b-4fae-bced-1e3f5e6fa33e	-28.83	\N	9e5b4830-f874-40f7-a917-51372fd6e766	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:06.962	2025-09-03 05:03:06.962
d2936561-e44c-40b6-91cf-4a5ea9d9596b	26.54	\N	65ff36cc-95be-4361-bf16-97d104b9a27d	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:10.918	2025-09-03 05:03:10.918
96ece416-f7d6-4f35-a6b0-ca256175d15a	-26.54	\N	0fde4bd9-2cc5-4e7e-86f1-729b94de8c18	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:10.92	2025-09-03 05:03:10.92
1792a708-11b2-48c9-9aa7-d7d3bcce24eb	10.06	\N	f8eda2fb-7b44-460a-beab-5f7a1952f0f4	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:15.551	2025-09-03 05:03:15.551
1ac64203-adab-4032-9baa-67a9b7c88cd3	-10.06	\N	6ca776d2-3a93-4c2f-8d20-602a6bb860de	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:15.552	2025-09-03 05:03:15.552
ca7b8f04-05ed-4024-91af-a65f66ce444d	19.81	\N	840a7ec1-9c0f-43bd-9d5c-69860e303d24	\N	\N	\N	\N	\N	2025-09-03 05:03:19.771	2025-09-03 05:03:19.771
74010b4e-4f3c-413d-891f-339b8006096b	-19.81	\N	1c92c4d8-1c09-4984-8603-29abb3414593	\N	\N	\N	\N	\N	2025-09-03 05:03:19.772	2025-09-03 05:03:19.772
c9d87f30-711f-469b-8941-deace9b83590	21.19	\N	4a6044ce-b667-44ec-9232-8e5835079ab9	\N	\N	\N	\N	\N	2025-09-03 05:03:24.327	2025-09-03 05:03:24.327
95b68ab5-844a-4f3d-89e8-4dd1d1c31de3	-21.19	\N	145e9a16-7e2f-4fc8-954e-c5c04f2a101a	\N	\N	\N	\N	\N	2025-09-03 05:03:24.328	2025-09-03 05:03:24.328
58ac59e8-a8bd-415b-993f-347014272c59	28.1	\N	f4030158-28c2-44ef-b89d-7106bbe36a9f	\N	\N	\N	\N	\N	2025-09-03 05:03:29.786	2025-09-03 05:03:29.786
03a71619-b3db-4499-92bf-569112f20b90	-28.1	\N	906eabee-6cf8-4eba-8900-54c06cb55cb5	\N	\N	\N	\N	\N	2025-09-03 05:03:29.787	2025-09-03 05:03:29.787
24421a84-0ced-484a-878b-8f6fbf0b6416	17.69	\N	f6578f11-dc89-4a75-8a33-0f9e7fda735e	\N	\N	\N	\N	\N	2025-09-03 05:03:34.164	2025-09-03 05:03:34.164
4cb1e540-1ab6-4c89-a2b1-229cdd3df6ca	-17.69	\N	d15b3498-6fcd-41b9-ab10-0dd65984afc7	\N	\N	\N	\N	\N	2025-09-03 05:03:34.165	2025-09-03 05:03:34.165
dd4077d7-651d-481e-b775-5c3792196b80	14.94	\N	ef2cc03d-2386-4452-83bb-8a7104e2c5f3	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:38.507	2025-09-03 05:03:38.507
7a50720e-4c91-4f39-8911-900ef58b2729	-14.94	\N	7c4746f2-6001-43dd-8799-9d610c4d453b	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:38.509	2025-09-03 05:03:38.509
f76faf22-f024-414e-8f64-1683f86158a4	7.95	\N	b40319ed-3030-43df-a87c-ca3607c198d2	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:42.969	2025-09-03 05:03:42.969
d084cf9c-312d-43ae-82b6-b778d47b34ff	-7.95	\N	5a0c9891-75e4-4058-9ff2-065ec63d1334	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:42.97	2025-09-03 05:03:42.97
69368703-ec9e-439e-abbf-6d15a2e1b3f8	16.06	\N	f71ae439-3999-4dc3-a342-29968584ce9c	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:47.357	2025-09-03 05:03:47.357
146d90dd-5d65-4c77-8c24-f289fdbc6497	-16.06	\N	8e046abd-eee9-42b4-80b3-9f413848e5c6	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:03:47.358	2025-09-03 05:03:47.358
7f56e681-1a51-496f-9706-e804a402c55b	6	\N	af16a8c0-8db3-4c7b-9ca5-919cb05dc0e9	\N	\N	\N	\N	\N	2025-09-03 05:03:55.56	2025-09-03 05:03:55.56
6faea408-6f8c-402d-a338-e57940c24dc5	-6	\N	8065d66e-efa9-4e87-9d3a-bbf63b079ffc	\N	\N	\N	\N	\N	2025-09-03 05:03:55.562	2025-09-03 05:03:55.562
af99befb-9b28-4660-a1c3-d9eca2671994	-89	\N	228e62c9-c4f8-4f3e-9f54-e74775485071	\N	\N	\N	\N	\N	2025-09-03 05:04:05.139	2025-09-03 05:04:05.139
91cf23de-914a-4695-a229-2bc87b60fe66	89	\N	07c4a90f-10e9-42d9-a085-271952358e78	\N	\N	\N	\N	\N	2025-09-03 05:04:05.14	2025-09-03 05:04:05.14
1e05222b-ea52-494b-903d-1b7f3bba1d5c	-6	\N	914729e1-11dd-4b6f-87bf-21db9b37d027	\N	\N	\N	\N	\N	2025-09-03 05:04:10.124	2025-09-03 05:04:10.124
2128fe57-f7bc-4a3a-8ea7-a1b8067f6434	6	\N	5e94a215-08cf-421e-ac9e-fdb9fc7d5a39	\N	\N	\N	\N	\N	2025-09-03 05:04:10.125	2025-09-03 05:04:10.125
b8eedd46-e4bd-466a-98d0-cd6b5bdf61a2	-11.05	\N	9d58961f-24cc-4302-9ee1-a5ba4a0b32c7	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
d8e08bd7-237f-4bed-8a8f-253dedbbe931	-19.09	\N	747a1412-47ad-4980-b192-697c98f2b478	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2d2fdc8d-d570-4c45-bde0-94192e704250	-14.96	\N	54330662-7ddf-48d0-a7f9-5df86519af0a	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
90e4b4ff-7029-4db0-b9f4-51de324d30b7	-6.44	\N	b5c22a30-d37b-409d-a293-e95ee8fe4879	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9d4a8240-1dff-4e36-a185-44bbe93926c6	-2	\N	5b873442-38dd-4339-a42e-c47839f97dd0	\N	\N	\N	\N	\N	2025-08-15 17:23:00.55	2025-08-15 17:23:00.55
cdf5da78-8b66-45fb-9bcf-0f5d70d2e249	-240	\N	645cc2e6-d246-45a3-a4c4-944056598ef4	\N	b7ce7783-9da9-4698-95f9-7d615174216b	d8e9f0a1-2345-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
db3b274e-3f6d-4010-9889-5c4dc1a51a9a	101.72	\N	d521c415-c053-4004-aca2-eb98510be705	\N	\N	\N	\N	\N	2025-09-03 05:04:24.397	2025-09-03 05:04:24.397
458be30c-64c5-4d54-8345-3f6a7f693d23	-41.9	\N	86133857-9d62-4381-9b03-e6e2f98d579d	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-21 16:12:47.956	2025-08-21 16:12:47.956
d6390a68-4e2c-484b-9aae-ab553948a203	-26.71	\N	1933f171-481c-460e-8688-dc0b911a7f97	\N	\N	\N	\N	\N	2025-08-28 20:02:35.992	2025-08-28 20:02:35.992
e3532048-5115-4fc3-8c94-eb55d562279b	-101.72	\N	cf4d43a3-f249-4fa1-87ed-eb28ac16725d	\N	\N	\N	\N	\N	2025-09-03 05:04:24.398	2025-09-03 05:04:24.398
016cf473-0550-479f-b4dd-b1008f5f8cac	-20	\N	12d8cb07-32bc-4334-ac83-1e8326f6fabf	\N	\N	\N	\N	\N	2025-09-02 06:00:51.403	2025-09-02 06:00:51.403
94df9dfe-2eca-4570-b005-82fc81b223e0	56.5	\N	cfce1d41-8063-4783-aff7-fb2160a2aa68	\N	\N	\N	\N	\N	2025-09-03 05:04:29.522	2025-09-03 05:04:29.522
8c1a1d40-18ce-4758-a8d6-7eb25b2597fd	-56.5	\N	3ad23759-fad1-4bfd-9e9c-991626c8e0d4	\N	\N	\N	\N	\N	2025-09-03 05:04:29.523	2025-09-03 05:04:29.523
b58908d2-c5c2-4042-8721-cb802dbcc537	50	\N	4b9fb2ad-ca40-423c-8489-e3fd8791e8c3	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:04:37.199	2025-09-03 05:04:37.199
5f48822f-a540-43a4-b9fa-5b8c123c8d96	-50	\N	e29d55b1-d2d8-4bbd-a884-f1a8aba4d9b8	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:04:37.2	2025-09-03 05:04:37.2
d64dce0e-e8b5-4644-8518-9e133118c087	554.04	\N	5e65b624-3c16-4311-aed7-fe17147578c7	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:04:43.273	2025-09-03 05:04:43.273
2bb5646d-292b-4576-bab5-31b94eade0da	-554.04	\N	eb462d1a-2c7a-4c1d-a378-68fd74dbaf9d	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:04:43.274	2025-09-03 05:04:43.274
32ceb07b-cfc2-4dd2-bd3a-e74bfe45f7f5	125.13	\N	250a27d1-cac6-495f-a05a-200e8900b60a	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:04:48.214	2025-09-03 05:04:48.214
155b03e2-9e59-4752-bdaf-5fe7539b9f8c	-125.13	\N	2bb37182-730a-4a61-9d8c-666a0bf0fcd4	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-09-03 05:04:48.216	2025-09-03 05:04:48.216
128053f9-2903-449c-87bb-3c77c4d119fc	-19.01	\N	09dc5ded-eb51-4a0c-a51b-642d4297f65e	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5478bfd1-5787-4217-aa9b-e84840f5d556	-2724.81	\N	53b30b28-807b-43a9-b2eb-0f397c358f08	\N	98bd1be3-fcde-4fbe-af1b-7178315a25da	d7e8f9a0-1234-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
562f0d4a-75e4-4621-a49e-407793e4b76b	-240	\N	ddd416fd-1127-4188-be79-744741bd24a1	\N	b7ce7783-9da9-4698-95f9-7d615174216b	d8e9f0a1-2345-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
2edc47d5-543a-4811-bbcc-2d03661a50a1	-4.32	\N	e93b0ec7-926c-4d9d-af79-ef7dab8c7a91	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
de5acf10-e448-494d-b9f3-0e7c8f35cf62	-16.21	\N	213d358e-dabf-4c48-98ed-bfdc0b2a0e7f	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4d7236e7-635f-4f63-83f4-96cb4b84befc	15.7	\N	b6659059-5df7-469b-a6f2-0a30c9e0af71	\N	f26d6a29-64e9-443f-b2c3-81d2b9921142	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b369255f-7030-4214-b6eb-8d4966a5930f	-2	\N	7e5e4550-aacf-4152-bf95-3562994a02b4	\N	\N	\N	\N	\N	2025-08-15 17:23:00.55	2025-08-15 17:23:00.55
b990c654-4d8c-4fb6-a8b9-50ab414d2d90	-65.41	\N	d3462cf6-391f-431d-bed5-3054f8536a99	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6fa9496c-a1b4-4dac-9e5e-95b92b3a5dd6	-1.67	\N	ffc98ada-b8bf-40af-9ded-5cf268dec42d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
fca21013-08b8-4d82-9018-c9707e98fa68	-1.67	\N	0ca8a006-e682-45a3-bf27-17172a547bb6	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
bb40e082-9d06-4ac8-91a1-ca2ede24c80d	-37.5	\N	aded1ae9-bce4-42e2-92bd-9081e0a1d712	\N	\N	\N	\N	\N	2025-08-28 04:39:19.089	2025-08-28 04:39:19.089
060acaa3-69e1-4f98-9436-ac06d7562b97	-26.71	\N	49b1d16d-8afe-48eb-91ac-43056efd9292	\N	\N	\N	\N	\N	2025-08-28 20:02:35.992	2025-08-28 20:02:35.992
23322785-9245-45b8-b639-78e332d2b428	-2724.81	\N	5314758d-4d54-4184-8e90-dc71bf45af52	\N	98bd1be3-fcde-4fbe-af1b-7178315a25da	d7e8f9a0-1234-abcd-ef01-234567890123	\N	\N	2025-09-03 05:37:52.844	2025-09-03 05:37:52.844
e75912b7-71d2-4a17-ba14-17cc8a0d052a	-42	Emissions test	3e57e7a9-29a5-4230-938e-bdc2673d7ceb	\N	62ce18c1-8dc2-44a4-9ec7-cc355f59018b	\N	\N	\N	2025-08-21 16:35:04.892	2025-08-21 16:35:04.892
4ec4e9e6-a63b-4471-a252-3fb618d72637	-16.21	\N	8cca5f6c-acd6-4503-8d25-c908134a3fd3	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
bcac78af-2f9d-4242-b3bc-0e0bf988aa27	-132.93	\N	b047ba4a-cdb7-44dc-9b84-ad32f71c6b86	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b2806cb3-6f6b-472d-b112-bff97b551af0	-65.41	\N	cc1c3c7e-e9b0-4bec-9994-39688c88566f	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3356bc96-6149-4dcf-a348-815f3be1770c	-2	print spidey masks	c2cb90ee-d5f6-49eb-b4d8-ed40e94a0439	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	\N	\N	\N	2025-08-21 16:37:41.136	2025-08-21 16:37:41.136
1e90b42b-738c-4ac8-aa3f-3fd09f687bc6	-5.39	Party supplies	91766d3a-ea18-4d81-bd86-937da0cd96be	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	\N	\N	\N	2025-08-21 16:38:23.917	2025-08-21 16:38:23.917
e0201ec8-ff7b-4cac-a951-1997f252f621	-14.13	Party supplies	fb4a757f-5da3-4a33-ab08-b7f3efe53ecf	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	\N	\N	\N	2025-08-21 16:38:33.925	2025-08-21 16:38:33.925
7852b664-7440-4183-bd32-8209c1ee993f	-25.48	Party cupcakes	170e1872-c0a8-4069-9939-abba4056168b	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	\N	\N	\N	2025-08-21 16:38:59.72	2025-08-21 16:38:59.72
5b91557e-445e-4ba8-9784-475dc136e56a	-123.77	\N	7b31e323-be5d-428c-b62e-786e22d5df4a	\N	c1b2a2ca-c82b-4efd-9bbe-31928173eb9a	a20e1f2-4567-abcd-ef01-234567890123	\N	\N	2025-08-21 16:39:13.759	2025-08-21 16:39:13.759
b0c0d64b-d6b5-4584-ad06-39e70f154061	-50	\N	d81d2191-ff1c-4b2d-ac05-8d8b61b767c6	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	a14f34a5-67b8-90cd-ef12-34567890a144	\N	\N	2025-09-03 05:55:30.796	2025-09-03 05:55:30.796
2ae2ecb8-e58c-4a71-938c-d93b0e94327b	-50	\N	26262c71-dc87-45eb-8649-2ba12a2f5f35	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	f13a34a5-67b8-90cd-ef12-345678901335	\N	\N	2025-09-03 05:55:42.57	2025-09-03 05:55:42.57
ba3debe9-091f-4d9d-84d3-c3f59a97748b	-10.18	\N	eedd955a-7d53-49b4-bc6a-1013b586ee71	\N	\N	\N	\N	\N	2025-08-27 04:07:00.787	2025-08-27 04:07:00.787
b3dce1b0-63eb-4113-b81b-c62f0bab9540	-30	\N	f5a67406-54bf-4367-9b3c-ece1d6384703	\N	\N	\N	\N	\N	2025-09-03 16:02:10.171	2025-09-03 16:02:10.171
09abad53-1d8d-4b0c-a160-813a4f11a681	-39.65	\N	ec4a1b84-8d48-458c-903e-245ee3fb8ab7	\N	\N	\N	\N	\N	2025-08-27 04:07:42.459	2025-08-27 04:07:42.459
88bc5c7c-2ea6-4a7c-aee8-cac240a09a75	3593.13	\N	6a48e00f-3a57-4151-8e15-7aa766d9fb3b	\N	881890d0-64d9-436b-a8d4-982b11276e68	d4e5f6a7-8901-abcd-ef01-234567890123	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
cffeec92-72cc-470b-b304-bc71a13ed325	-360	\N	23584ea7-3c2d-48b1-a1ca-b9c9bc72f40d	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4aefe248-eafd-4e7c-bd29-57c2c23f16a4	-105.29	\N	d2d4d17c-c7a8-4a3e-bc54-027bc88f34f3	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4c698065-f734-48ef-96b1-2e6387e93b36	-131	\N	5e6fe0c2-7345-4236-8e1a-869ec09db450	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:09.764	2025-09-03 06:02:09.764
706a52aa-ab61-4b95-b24d-17d7b1eb6443	-200	\N	0447bec1-f0d4-4450-a05a-e53b33fd88ca	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:15.51	2025-09-03 06:02:15.51
fdeaf966-8be9-48cc-bb92-43a1406d4855	200	\N	8bd32618-723b-4552-9fe3-a13f909b3b1a	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:15.511	2025-09-03 06:02:15.511
93df42f4-7a96-4a1a-9773-5fbb2ec47c8f	5.5	\N	62789f50-e3d4-4ccb-8fb8-e1cb026aa85e	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:25.898	2025-09-03 06:02:25.898
70369e83-7b44-41e6-ac60-720b65ae18fe	-8.65	\N	4c35b05c-7130-4889-b0df-77530652547f	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6c3c8fa8-b8f2-49ea-b43a-678cd543f7c5	-12.34	\N	7385393b-31a1-4d0d-86a5-9a5a24b9db5c	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
6afbab2f-2c00-49c8-923b-6d0aaa7bd04a	-250	\N	78b76808-720e-425d-9304-2ae5b1cd2eac	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	42f56a78-90b1-2c3d-e4f5-678901234567	\N	\N	2025-09-03 05:59:27.711	2025-09-03 05:59:27.711
90831c84-f1b3-4fb2-90f4-8ec63fd8acb6	-35	\N	1193be1e-6b5d-4584-ae9d-6605d1d2aac4	\N	\N	\N	\N	\N	2025-08-29 12:34:04.768	2025-08-29 12:34:04.768
7496e0bf-1fa7-4c54-80ee-9db4282a0f4b	103.74	\N	95857e07-ed4c-4d3b-a588-c76d54b0e9af	\N	f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
134bd5a1-bb92-4a67-a5e9-03a2ce27809c	-80	Shoes and Webshooters	bb1a8b5a-1156-40e1-a61b-0d94d2ceefc8	\N	594b69f1-cef7-4f49-b275-174d00ecece0	\N	\N	\N	2025-08-21 16:43:29.764	2025-08-21 16:43:29.764
b3c8981e-301c-4a5f-87c9-1705588f4543	-28.23999999999999	Party supplies	bb1a8b5a-1156-40e1-a61b-0d94d2ceefc8	\N	c2c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d56	\N	\N	\N	2025-08-21 16:43:29.764	2025-08-21 16:43:29.764
e37cc2a1-7801-4bb2-896a-1d01979510cc	3593.13	\N	0f606a1d-03c0-4a13-a109-4661bbce725d	\N	881890d0-64d9-436b-a8d4-982b11276e68	d4e5f6a7-8901-abcd-ef01-234567890123	\N	\N	2025-08-21 16:45:50.679	2025-08-21 16:45:50.679
34f9497d-a392-4f32-b671-83af6a43f912	-50	\N	9bbe728c-39c4-47d6-89e2-95bc63e87b9b	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	f13a34a5-67b8-90cd-ef12-345678901335	\N	\N	2025-09-03 06:01:16.555	2025-09-03 06:01:16.555
d8e97689-724a-4bc4-99b0-4962c0ada535	-4.32	\N	a315a9a3-f5f9-4202-939e-6e2aa2c72886	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b2a10612-a5d8-412d-a2ea-84a40dc98593	-5.52	\N	e02f373a-3894-43c3-accd-f36cbe8c290f	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4afd6ffc-5bab-45c9-95fa-433d883a40ee	-10.97	\N	795b4e28-e652-4f90-aab7-964ec468f614	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e56b4498-21b4-4ea9-9787-ef72aeb0c104	-50	\N	0da57e8f-0ba7-4f6f-b85b-0024073d48e8	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	a14f34a5-67b8-90cd-ef12-34567890a144	\N	\N	2025-09-03 06:01:30.241	2025-09-03 06:01:30.241
82ca018d-93f1-4699-b9d1-ee7a74b095c0	-4.92	\N	9a064513-8984-467a-b298-4b983be88ad4	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3deab5f3-5f63-441f-bc43-477335d2beae	-5.5	\N	10449371-b6a4-488f-81c3-3516633020b8	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:25.9	2025-09-03 06:02:25.9
24c98f72-797b-46bf-8838-82b5302e44d9	131	\N	ff676339-f450-44bb-8c29-0f5d204ce19d	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:09.762	2025-09-03 06:02:09.762
8f322f38-676d-4633-b62b-3133293426f9	-100	\N	036c9691-12fe-47c5-96b3-4545e69978a1	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:33.093	2025-09-03 06:02:33.093
af5c2d4f-9a6b-4252-bebc-4a6d6b08a99c	100	\N	e02eff9c-e414-46cc-bc82-eade460c2dc3	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:33.094	2025-09-03 06:02:33.094
d88011f3-a289-415c-8baa-7b4e53e843d9	140.82	\N	80d9df07-6fc8-4edd-977a-5787fa6b8785	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:41.608	2025-09-03 06:02:41.608
91545bb2-592e-4b12-a627-ee08986d1714	-140.82	\N	50f0a6f4-1151-4b27-8776-e9f6f9dab17f	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:41.61	2025-09-03 06:02:41.61
d684cba4-873c-40e4-adb9-f64f0d161c47	100	\N	320e5fed-8680-49c3-bd61-6e7ecb37e653	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:52.514	2025-09-03 06:02:52.514
4bc70986-cb92-42ea-a4fb-6c816a826a29	-100	\N	c1771b3b-8533-4fff-9301-660c04ae77e3	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:02:52.515	2025-09-03 06:02:52.515
6fb19042-759c-4095-b54a-d33b97684c29	-500	\N	e221ee65-9e23-411d-9bfa-7e8bbf4f2c78	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-09-03 06:03:06.023	2025-09-03 06:03:06.023
51cd31e5-6761-42c7-87b5-4ae96ace87ba	500	\N	216baf0b-c9e9-4699-ad82-a2baa79026dd	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-09-03 06:03:06.024	2025-09-03 06:03:06.024
08e2e8e7-0d33-476a-b5a8-73b0f04e36a8	-30	\N	435683c9-9892-4207-a847-84f429e771b9	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:03:10.31	2025-09-03 06:03:10.31
cde9b684-de02-4934-90e6-d2a1a733beab	30	\N	2f49d2cf-b896-4e56-a10c-47a2a314f95f	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-09-03 06:03:10.312	2025-09-03 06:03:10.312
fd4c612f-9d8f-459f-b197-0d74f9810e02	-25	\N	6e50a9a1-e630-468f-99dc-734a3d4302fa	\N	\N	\N	\N	\N	2025-09-03 06:03:28.714	2025-09-03 06:03:28.714
4440e1ea-d5ce-4065-b849-8c5735aeebbc	-30	\N	793c7ad4-eeda-4f8c-97df-803b8360692f	\N	\N	\N	\N	\N	2025-09-03 16:02:10.171	2025-09-03 16:02:10.171
2088d22f-2e16-4211-8e16-6195bbd6524e	-12.34	\N	05a6616a-2991-4aed-86f8-168c69cd4e23	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
75042738-47c4-45ab-85ff-83129ef654ef	1000	\N	4a395295-9b00-4bf5-bf4f-58736c82bc57	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	e12f34a5-67b8-90cd-ef12-345678901234	\N	\N	2025-08-27 05:32:21.347	2025-08-27 05:32:21.347
bd937cf6-e2d5-45c7-a5b8-2c975d0c5d0e	-1000	\N	c7679a26-b64d-42ac-b60a-a23d01a0e9b3	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	e12f34a5-67b8-90cd-ef12-345678901234	\N	\N	2025-08-27 05:32:21.348	2025-08-27 05:32:21.348
9d084706-8c49-4890-8c61-5e0e661e93b4	-50	\N	95bf9242-1a16-4999-9c95-480a21c7c9a6	\N	\N	2b3c4d5e-6f78-90ab-cdef-0123456789ab	\N	\N	2025-09-02 21:58:58.082	2025-09-02 21:58:58.082
75c4746a-c191-46ef-a51e-8c245d731a53	-240	\N	939e4b15-acdf-4a7c-b188-55101915089c	\N	b7ce7783-9da9-4698-95f9-7d615174216b	d8e9f0a1-2345-abcd-ef01-234567890123	\N	\N	2025-08-21 16:47:17.743	2025-08-21 16:47:17.743
004e3ea1-c3a8-44a5-81bf-a7b604b87622	-5.82	Egg rolls	ca38497b-b0d3-457d-ba52-518e3cbda517	\N	\N	1a2b3c4d-5e6f-7890-abcd-ef0123456789	\N	\N	2025-09-02 21:59:22.757	2025-09-02 21:59:22.757
25d675e2-ebc8-42d2-8557-ffd906636060	-13	\N	78544e2a-d4b9-48e7-8a80-1c878a9b045f	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
b82c6d2a-3bc0-4bf1-ac40-4c04f1df25c7	-9.33	\N	1400a470-1f28-4337-ab9c-745c236a2b0a	\N	3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3	4d5e6f78-90ab-cdef-0123-456789abcdef	test-montreal-2025	7890abcd-ef01-2345-6789-abcdef012345	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
880bbb69-8f1f-47dd-b7c9-dd086efa58b5	-435	\N	1806564f-eab5-46cd-9b81-e5653ab6f19f	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-08-27 05:34:23.951	2025-08-27 05:34:23.951
173cbc54-59f5-4ab8-97a7-b3a5bf4ea0e0	-58.57	\N	179f8364-c357-4f90-9a97-957ef7ca3e6c	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 17:03:38.289	2025-08-21 17:03:38.289
8d994148-6bdc-4459-ae78-ee707f99a76e	-10.27	\N	5cd0ce97-1d5f-4549-ad56-e95702d41241	\N	\N	\N	\N	\N	2025-09-02 22:03:23.164	2025-09-02 22:03:23.164
6ca331e4-2399-4ea2-9f01-8a992e20349f	435	\N	a82691d8-9a30-4d4a-9509-f81b5c49e85f	\N	b2d285a2-59a7-469d-9bbc-7d3e1095c193	\N	\N	\N	2025-08-27 05:34:23.952	2025-08-27 05:34:23.952
261fca21-ece4-4fd6-bfad-76d8f5a64aec	76	Heidi Peaches refund	355f0595-bd6c-4b24-b9fd-4f2b45293a63	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-09-03 16:24:11.468	2025-09-03 16:24:11.468
4fc601b4-09b5-42b2-a676-6fdebd65579d	50	\N	e4c27130-7474-40a6-b7fe-e110e8077705	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:31.055	2025-08-27 05:34:31.055
ca6f17bc-a566-4f04-be17-8e2d7c81f273	-50	\N	caa2081d-e015-419f-b93a-24f0f68dba32	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:31.057	2025-08-27 05:34:31.057
36c3a9d7-0a10-44d8-868e-df5107856b2b	-70	\N	aaa26a16-c598-47ee-af3e-a2b7b3fa2d05	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	a3c1d3e4-5f6a-7890-abcd-ef0123456789	\N	\N	2025-08-21 17:05:07.629	2025-08-21 17:05:07.629
cf34f3c4-26b8-421e-975f-34cf7a04125e	-300	\N	0dafffbf-d8dd-445b-aefa-9e23cd8b6fc9	\N	7f989aae-f1b3-408e-95fb-d7b90b88be5f	fe89138d-43e6-4733-aa6e-77b4f76e8582	\N	\N	2025-08-21 17:05:19.248	2025-08-21 17:05:19.248
62e3a46d-c7e4-4824-9f74-6728ce720663	-50	\N	4957088a-3360-409b-a4d4-bc01a695cbee	\N	8ce8b6b3-3308-4b84-9d12-ce386b829d75	\N	\N	\N	2025-08-21 17:05:30.527	2025-08-21 17:05:30.527
78e97be1-3e80-48fa-85a1-df2d41599a9a	15	\N	3fd8c46a-8d40-48a6-b952-349f359823a4	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:35.811	2025-08-27 05:34:35.811
7e789aa2-0319-44b2-9eef-7000eb7f1d78	-15	\N	3e32d07f-4f05-474e-9864-9f4d25ce2692	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:35.813	2025-08-27 05:34:35.813
4fa58fec-a2dd-4bc6-b919-98d3a6338b19	100	\N	fe87bbe6-0b6f-48da-bffb-54894f1cd604	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:42.048	2025-08-27 05:34:42.048
1c26832c-b190-4c08-a684-dabe34da59f1	-100	\N	59a3add1-afb6-443c-8553-c98b53b06c7b	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:42.05	2025-08-27 05:34:42.05
d51d83f9-8805-4fba-93e4-a9524435a9eb	100	\N	4356cbfe-3edd-415e-b57b-c5f1fae8949c	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:58.784	2025-08-27 05:34:58.784
42d4204b-3098-408a-b4cc-7e66db59e138	-100	\N	8d462eee-9559-461e-a8ac-9dc16e536275	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:34:58.785	2025-08-27 05:34:58.785
eeec45c4-37bf-4cba-8b4a-418ad645b9b2	-20.26	\N	f5c8b940-4333-422b-8432-9774873839d7	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a53a23c1-3bec-4e72-a723-a0fd32f8f0ba	-34.45	\N	4fac5386-516c-49b7-a9a0-1a76c3790f92	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-08-27 05:35:28.554	2025-08-27 05:35:28.554
6fd1ca0a-40ce-47e7-aa15-4069df5d7334	34.45	\N	9002bd4a-ef1b-4410-9d25-8a6f08bf90fd	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-08-27 05:35:28.555	2025-08-27 05:35:28.555
5462ed85-8c48-4661-9b48-683ae586d879	-35.67	\N	4c20d0ee-fe35-4388-86c6-de959293e73e	\N	ab0bb7ab-0367-4d7a-adbb-30846f5ec897	98765432-1fed-cba9-8765-432109876543	\N	\N	2025-08-19 13:23:18.441	2025-08-19 13:23:18.441
4270ea70-3901-4732-99f0-444c325c0a66	-1.67	Emergency avocados	e7b8f5d1-c88d-4e7c-b062-188d7be09f4e	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 17:06:10.133	2025-08-21 17:06:10.133
375aa7c3-8d95-458b-b509-96b566d3696c	-13.52	Laundry detergent	dab8131a-ba4c-4f2b-a09e-b413647e3b18	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-21 17:07:39.996	2025-08-21 17:07:39.996
1a9f622b-f722-41e1-9c20-b555f88fc264	17.01	\N	5c4e8808-8e8b-466d-8dd3-eab71d2fa439	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-08-27 05:35:45.284	2025-08-27 05:35:45.284
7505848c-0ab4-40f6-b16b-6e6a983c0603	-17.01	\N	02b22bb3-03c3-406e-aeb1-37214e2e7ca0	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-08-27 05:35:45.285	2025-08-27 05:35:45.285
a47baef8-2e34-481b-a70f-55dd4305d88a	-19.43	\N	ead66086-0e34-418c-8d3e-03d367a3436e	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-08-27 05:36:04.736	2025-08-27 05:36:04.736
73d053ac-7160-4bb2-b89e-5407917c532b	19.43	\N	89694f1f-4d9c-4438-9ee2-cb23d18e1380	\N	4b45bab9-fe7e-4224-a9d5-8738dd0f56a7	\N	\N	\N	2025-08-27 05:36:04.738	2025-08-27 05:36:04.738
440309b3-4b3f-4a44-b6ff-7e5908f9df91	-19.43	\N	36867686-2e69-4fd5-a367-02646d8e0598	\N	d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	\N	\N	\N	2025-08-27 05:37:01.022	2025-08-27 05:37:01.022
a674157a-4f41-4acb-8626-fe5773d7b237	19.43	\N	46d780f7-d518-4d67-8b0c-46f6079e26b7	\N	d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	\N	\N	\N	2025-08-27 05:37:01.023	2025-08-27 05:37:01.023
92fe15ea-0913-4808-9723-1d2d1268359b	17	\N	3a8f59a4-d122-44b9-8f57-8d1a0efd4770	\N	d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	\N	\N	\N	2025-08-27 05:37:06.015	2025-08-27 05:37:06.015
43a64b85-4117-4974-bdfe-4bab367d776b	-17	\N	932a65b6-c9d2-4a66-b750-52352f58c762	\N	d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	\N	\N	\N	2025-08-27 05:37:06.017	2025-08-27 05:37:06.017
4a62a8ae-7d0c-43d0-b620-cef216fff298	34.45	cash advance	92a0e697-7227-48a1-87ea-941b9e2c7e73	\N	d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	\N	\N	\N	2025-08-27 05:37:23.861	2025-08-27 05:37:23.861
15dbe7cd-028e-4039-aa43-06784177a2aa	-34.45	cash advance	a89600ea-f74d-4ba0-9738-bc057b0a7f5f	\N	d3d3e4f5-a6b7-4c8-9d0e-1f2a3b4c5d78	\N	\N	\N	2025-08-27 05:37:23.862	2025-08-27 05:37:23.862
71fb5fb6-584d-4498-b0f4-dab089b6d774	-20.26	\N	17f36117-d75c-4bf9-8d28-76669ff2ccab	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
bf7c7548-1e1b-47cc-b0e2-881e5cb4ee2d	100	\N	bc8e54cb-462e-4367-a7fc-b359d4e6712d	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:42:40.9	2025-08-27 05:42:40.9
de0c80f9-520e-44a2-88f2-04b50f4b8bc7	-14.86	\N	c055cec6-9a42-400f-abeb-940c2776673b	\N	\N	\N	\N	\N	2025-08-15 19:00:46.415	2025-08-15 19:00:46.415
12da30ca-c616-4af4-8911-c06eccbb4dd4	-100	\N	9778e2f9-becd-457b-a42d-2b5e56ed374d	\N	58685d03-42d9-416e-ad98-ebd0d0072e40	\N	\N	\N	2025-08-27 05:42:40.902	2025-08-27 05:42:40.902
08ae884f-6f53-4d98-84c8-fcadd1e17988	-53.66	\N	d37a1bf0-5d4f-4338-8bf8-c0714024f117	\N	a9701bf6-4ad9-4ef2-8b3f-acddd562e6e6	d3e4f5a6-7890-abcd-ef01-234567890123	\N	\N	2025-08-18 22:02:29.388	2025-08-18 22:02:29.388
f4e72c61-6273-42c5-94a4-4c6b60d25d16	-8.22	\N	0fb79aaf-9213-4f91-83f4-b574f265d75b	\N	\N	\N	\N	\N	2025-08-29 12:34:04.768	2025-08-29 12:34:04.768
b51a0e9b-ec27-488b-aec8-3e153e8ebe2e	-1.07	\N	172b1729-91a3-462d-9612-8b27cb423791	\N	\N	\N	\N	\N	2025-09-02 06:00:51.403	2025-09-02 06:00:51.403
586de3bc-b657-4ff0-963a-ec1189ad8f9a	-65.41	\N	4a309638-7e5d-4e0e-b9f3-a08b97b35138	\N	\N	\N	\N	\N	2025-08-19 13:46:46.161	2025-08-19 13:46:46.161
6b66c7b3-21f6-408a-8220-426146824b7d	-14.96	spare bike tires	0e6f31cb-3f88-4b48-947b-6057b6453917	\N	68a5922f-88cb-4f93-abac-194ab7c5193a	\N	\N	\N	2025-08-21 17:11:38.105	2025-08-21 17:11:38.105
f2b04b8a-626d-454d-b508-0154112f63ae	-34.13	\N	99f847fb-003a-400c-bcc8-a3d511c1d232	\N	6f58cb2e-f20e-47c1-8584-078d419c4e30	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
5382631e-4ad9-4034-aac1-c6e6d533629b	-108.24	\N	6744d5c4-8c72-40fe-b40e-b41faaa21b36	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
a2ad8aa7-0412-4b4f-b414-13aaf2b28cc8	-14.86	\N	4e070657-1105-4e22-b859-7c04056033e6	\N	\N	\N	\N	\N	2025-08-15 19:00:46.416	2025-08-15 19:00:46.416
c05406f2-ae26-4553-b309-45ec94a691f2	-37.5	\N	043b4dc0-028c-4030-aaa9-7cf049ac2151	\N	\N	\N	\N	\N	2025-08-29 12:34:04.768	2025-08-29 12:34:04.768
f2147779-4e6e-414e-b40f-f4e1aa14a1ba	-5.82	\N	fd2b4716-4951-48ae-a0af-f3087b6d9630	\N	\N	\N	\N	\N	2025-09-02 06:00:51.404	2025-09-02 06:00:51.404
10cfcde3-52aa-49a6-98ad-8002bdda2e45	-443	\N	e4429218-1648-4ede-b45f-41fb27c45b49	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4c	c5d6e7f8-9012-abcd-ef01-234567890123	\N	\N	2025-08-19 13:52:08.838	2025-08-19 13:52:08.838
3c2949fe-fdab-4252-9459-9136bb93fd28	-13.52	\N	7a395657-af80-4bee-a07c-eb5b505898e5	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
4a80b8c8-1599-4fe5-a18d-383baf607123	-31.31	\N	ae027eee-a008-43c7-a8a9-eaa7fac31450	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	f9e8d7c6-5b4a-3210-9876-543210fedcba	\N	\N	2025-08-27 13:03:16.08	2025-08-27 13:03:16.08
770fb250-f900-4df5-97ad-b2b95ab0d6a6	-1.07	\N	21c2f593-5c7b-4a4d-a84b-38e17bf28bce	\N	\N	\N	\N	\N	2025-09-02 06:00:51.402	2025-09-02 06:00:51.402
95efda65-ea2d-41e7-b594-ec25f6d93ec1	19.32	\N	b6dc4fda-7b3e-44ee-ac65-4d178b899bef	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9895a7fc-02b6-4afb-9c39-2e990a6d2a40	-108.24	\N	4ba89747-3e15-4101-88c7-e8a4e0e1f459	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
e650dbb5-2269-44b5-aa37-34164fd76898	-57.73	\N	4fffa20f-5a5e-4ae4-aeeb-d7bbf22a78a0	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7c54700b-9ae5-4c2f-96be-8b2586a1a246	-13.52	\N	9aa7adbe-1861-4bc3-aefc-6cb8ef400e54	\N	\N	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
3727afb0-bc93-4546-a8f9-3da6a88d180d	200	\N	f5503f6d-95b0-4b96-935a-532fbaaf07c0	\N	a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
9f3f9a93-b2ac-4de0-8809-3fdf3f224058	-14.57	\N	840645ef-5e69-41ae-bae0-4bc2dec4bf2a	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
7c75b794-6e32-442f-9434-970b5e2e9505	-5.82	\N	5007a837-3ff3-4361-bbfc-2d04b358a43f	\N	\N	\N	\N	\N	2025-09-02 06:00:51.402	2025-09-02 06:00:51.402
39a4efce-3162-4673-9d44-16ae242c8913	-11.5	\N	53ebc916-3ebf-4f8b-a80b-823d97726367	\N	312482e9-9aa0-4710-a312-4a5dd308dedb	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
13a7a7cb-e930-4c07-bc39-81a8030632f0	-1	\N	961a531f-cf82-415a-bc2b-2bf7b9da0707	\N	d8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4b	\N	\N	\N	2025-08-18 22:32:04.969	2025-08-18 22:32:04.969
16e0b804-4dab-4d79-943d-324a8424e07f	-65.26	\N	cf85b15f-159c-4c45-b2be-d12793226bf8	\N	93d35092-b4a7-424e-a86b-c3d4ff99e4e5	\N	\N	\N	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
\.


--
-- Data for Name: TransactionReview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransactionReview" (transaction_review_id, created_at, updated_at, transaction_id, workspace_id, assigned_to_id, reviewed_by_id, reviewed_at, dismissed_at) FROM stdin;
26e685f3-cf27-46ac-a84f-f8d0ed4d5173	2025-09-02 20:33:57.817	2025-09-02 21:35:39.801	e43b7af8-cc3b-48fd-b0e4-efcae52894d6	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a911cba0-3f61-4bc7-86a6-0d1c407baf18	2025-09-02 21:35:39.8	\N
7246e4b1-6588-4021-8363-32716fe80d9f	2025-09-03 05:00:58.949	2025-09-03 05:37:52.823	5314758d-4d54-4184-8e90-dc71bf45af52	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a911cba0-3f61-4bc7-86a6-0d1c407baf18	2025-09-03 05:37:52.822	\N
8e8fbaca-3048-483e-9d82-771da0e4b209	2025-09-03 16:02:10.174	2025-09-03 16:02:10.174	f5a67406-54bf-4367-9b3c-ece1d6384703	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N
e0b1d7f6-b102-4519-8276-c5ca72d1aaeb	2025-09-03 16:02:10.174	2025-09-03 16:02:10.174	793c7ad4-eeda-4f8c-97df-803b8360692f	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N
1eb0d27f-1c88-40fc-866c-a8c9642e4bb5	2025-09-03 15:42:15.464	2025-09-03 16:24:11.447	355f0595-bd6c-4b24-b9fd-4f2b45293a63	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	a911cba0-3f61-4bc7-86a6-0d1c407baf18	2025-09-03 16:24:11.446	\N
2d2e27b1-06f8-4d65-b99e-91b08808fb32	2025-09-03 20:00:50.897	2025-09-03 20:00:50.897	efaba4d3-01ad-4278-8b86-819bf86b53cb	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N
31f9f547-ace3-4404-855b-63cf0886c102	2025-09-03 20:00:50.897	2025-09-03 20:00:50.897	93e75786-1e2d-47bd-801b-454c63530886	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N
e979eb7e-8010-4857-84fd-fa88d180c8f9	2025-09-03 20:00:50.898	2025-09-03 20:00:50.898	49405c5c-e669-4ec4-9021-bc15bfcd9218	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N
8757b57d-7cfb-4fcf-87b2-f69a95ced555	2025-09-03 20:00:50.898	2025-09-03 20:00:50.898	29eb55b9-c3d5-4e66-b407-9e37884a9d7a	f2b1c2d3-4e5f-6789-abcd-ef0123456789	\N	\N	\N	\N
\.


--
-- Data for Name: TransactionRule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransactionRule" (transaction_rule_id, created_at, updated_at, workspace_id, filter) FROM stdin;
470bcf1e-3c57-44a8-be8d-09f665a529e7	2025-08-18 22:30:34.672	2025-08-18 22:30:34.672	\N	[{"operand": "CHICK-FIL-A", "operator": "inc", "property": "Transaction.original_description"}]
8f604d20-7369-4812-8d29-f098ac24c3f4	2025-08-18 22:31:26.993	2025-08-18 22:31:26.993	\N	[{"operand": "RIDLEY'S", "operator": "inc", "property": "Transaction.original_description"}]
bb2cfe0a-e5ff-4ff6-9082-7847fcc40648	2025-08-18 22:42:10.492	2025-08-18 22:42:10.492	\N	[{"operand": "LOS HERMANOS-PROVO PROVO", "operator": "inc", "property": "Transaction.original_description"}]
7c6896a9-2d58-4038-ae3d-eea1e1db59c1	2025-08-18 22:44:24.535	2025-08-18 22:44:24.535	\N	[{"operand": "FLYING J", "operator": "inc", "property": "Transaction.original_description"}]
7da97ec6-0040-4549-963b-112accfbdf50	2025-08-18 22:45:09.566	2025-08-18 22:45:09.566	\N	[{"operand": "OLIVE GARDEN", "operator": "inc", "property": "Transaction.original_description"}]
729cddbb-fd06-4d02-9e06-3a92371b826c	2025-08-18 22:47:07.749	2025-08-18 22:47:07.749	\N	[{"operand": "CABELAS LEHI. UT", "operator": "inc", "property": "Transaction.original_description"}]
c21698de-4357-4fa7-8311-6739ed508683	2025-08-18 22:52:41.424	2025-08-18 22:52:41.424	\N	[{"operand": "CAFE RIO", "operator": "inc", "property": "Transaction.original_description"}]
5350c093-9c7a-4de6-8cba-92ad133b1d0d	2025-08-18 22:54:04.538	2025-08-18 22:54:04.538	\N	[{"operand": "SHELL SERVICE STATION", "operator": "inc", "property": "Transaction.original_description"}]
dd891a8c-3a09-40ef-bc7d-16f2638e4f54	2025-08-18 22:55:03.407	2025-08-18 22:55:03.407	\N	[{"operand": "SMITH'S FOOD", "operator": "inc", "property": "Transaction.original_description"}]
82d8a427-5771-4d21-b0dd-ff209804f39d	2025-08-18 22:56:23.962	2025-08-18 22:56:23.962	\N	[{"operand": "ARCTIC CIRCLE EAGLE MOUNTAI", "operator": "inc", "property": "Transaction.original_description"}]
2d1cc213-698c-4a9d-a944-2cd18a09d3b3	2025-08-18 22:57:00.259	2025-08-18 22:57:00.259	\N	[{"operand": "DIRECTCOM", "operator": "inc", "property": "Transaction.original_description"}]
536575da-15bc-497e-bfed-1faf7bb30ac9	2025-08-18 23:00:01.936	2025-08-18 23:00:01.936	\N	[{"operand": "LITTLE AMER WYOM F & B LITTLE AMERIC", "operator": "inc", "property": "Transaction.original_description"}]
fed80a7e-778d-4827-9e97-9d96118f5062	2025-08-18 23:00:17.674	2025-08-18 23:00:17.674	\N	[{"operand": "LITTLE AMERICA WEST GAS LITTLE AMERIC", "operator": "inc", "property": "Transaction.original_description"}]
f8f47834-4977-4a5a-be25-ebf7f1eba239	2025-08-18 23:00:48.297	2025-08-18 23:00:48.297	\N	[{"operand": "BIG D", "operator": "inc", "property": "Transaction.original_description"}]
e68cb117-494d-4a00-887c-f57f4c4449eb	2025-08-18 23:01:05.502	2025-08-18 23:01:05.502	\N	[{"operand": "SUBWAY", "operator": "inc", "property": "Transaction.original_description"}]
85a58371-c462-4fb5-80fb-aaf552c79ee3	2025-08-19 11:00:56.721	2025-08-19 11:00:56.721	\N	[{"operand": "TRANSAMERICA INSINSPAYMENT", "operator": "inc", "property": "Transaction.original_description"}]
991f49c3-7df9-4827-94bb-276973fd8ad0	2025-08-19 11:11:40.651	2025-08-19 11:11:40.651	\N	[{"operand": "PEACH AND BEE PRODUCE 13256", "operator": "inc", "property": "Transaction.original_description"}]
63a345f8-8ffc-4dc7-bef9-eabca57627cd	2025-08-19 11:14:40.564	2025-08-19 11:14:40.564	\N	[{"operand": "PEACH AND BEE PRODUCE 13256", "operator": "inc", "property": "Transaction.original_description"}]
8dc636d6-84f6-47cd-832f-d17325ad72aa	2025-08-27 04:02:53.597	2025-08-27 04:02:53.597	\N	[{"operand": "SMITH'S FOOD", "operator": "inc", "property": "Transaction.original_description"}]
7fa738f1-e876-4192-87dc-982622ef9447	2025-08-28 04:39:25.66	2025-08-28 04:39:25.66	\N	[{"operand": "Transfer to MONEY MARKET", "operator": "inc", "property": "Transaction.original_description"}]
100d6ed5-524f-44ca-be11-587c866a19c2	2025-08-28 08:07:00.328	2025-08-28 08:07:00.328	\N	[{"operand": "Payment From MONEY MARKET", "operator": "inc", "property": "Transaction.original_description"}]
05ae22b9-bf7b-414e-9b9f-fac09bcabb66	2025-08-28 16:11:02.326	2025-08-28 16:11:02.326	\N	[{"operand": "RIDLEY'S", "operator": "inc", "property": "Transaction.original_description"}]
\.


--
-- Data for Name: TransactionRuleAction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransactionRuleAction" (transaction_rule_action_id, created_at, updated_at, transaction_rule_id, action, value) FROM stdin;
0fd7e4f1-1bab-46a0-9ec7-81249fe0d678	2025-08-18 22:30:34.672	2025-08-18 22:30:34.672	470bcf1e-3c57-44a8-be8d-09f665a529e7	merchant_id	4cfef107-cd65-4a0c-918e-34e6e1f4f6a8
b2c467d1-1824-42bf-817b-9995d2a2b3f3	2025-08-18 22:31:26.993	2025-08-18 22:31:26.993	8f604d20-7369-4812-8d29-f098ac24c3f4	merchant_id	dec45eae-1d76-405e-be2f-710e55bc2215
76dec56c-f263-4205-8f15-624f6ea07df4	2025-08-18 22:52:41.424	2025-08-18 22:52:41.424	c21698de-4357-4fa7-8311-6739ed508683	merchant_id	01379a33-d815-47f1-be5e-4ada7dcb0455
0aa30e54-779a-4b40-8238-04d34c1e6ae8	2025-08-18 22:54:04.538	2025-08-18 22:54:04.538	5350c093-9c7a-4de6-8cba-92ad133b1d0d	merchant_id	5210ccac-6041-4a06-9f8e-fe36c9779562
17f117e4-e1d9-47c3-bc1c-0df6eec165d1	2025-08-18 22:55:03.407	2025-08-18 22:55:03.407	dd891a8c-3a09-40ef-bc7d-16f2638e4f54	merchant_id	8a661848-f1f4-4514-bea6-298a818935b0
65f77f1f-efe7-4bdb-a432-bbcd9062ec22	2025-08-18 22:56:23.962	2025-08-18 22:56:23.962	82d8a427-5771-4d21-b0dd-ff209804f39d	merchant_id	891063de-e49f-42af-95be-712ac328e8b6
76fff470-8b31-43e6-abe6-ee072ba32ed2	2025-08-18 22:57:00.259	2025-08-18 22:57:00.259	2d1cc213-698c-4a9d-a944-2cd18a09d3b3	merchant_id	8dbf6573-0bc2-4f8b-8842-c811452c2596
a7df14ad-d4bb-4dbe-8f66-978acdfb47d5	2025-08-18 23:00:01.936	2025-08-18 23:00:01.936	536575da-15bc-497e-bfed-1faf7bb30ac9	merchant_id	0dad559b-53a0-48c2-8910-045d59fd60bf
a5754853-850b-4a83-b114-c4856d3d1af8	2025-08-18 23:00:17.674	2025-08-18 23:00:17.674	fed80a7e-778d-4827-9e97-9d96118f5062	merchant_id	0dad559b-53a0-48c2-8910-045d59fd60bf
20eef0c5-8e6b-42ba-bf40-a648527a46b9	2025-08-18 23:00:48.297	2025-08-18 23:00:48.297	f8f47834-4977-4a5a-be25-ebf7f1eba239	merchant_id	dd452ce7-ecf7-4ad0-b357-372323f00dd2
9315c89f-1129-4452-a3a8-fae82ef77bf8	2025-08-18 23:01:05.502	2025-08-18 23:01:05.502	e68cb117-494d-4a00-887c-f57f4c4449eb	merchant_id	b1ce77d0-b6fd-4034-a3b3-25092395612d
72050463-1ec8-4afa-9231-3627924b5bb1	2025-08-19 11:00:56.721	2025-08-19 11:00:56.721	85a58371-c462-4fb5-80fb-aaf552c79ee3	merchant_id	3929d8d3-ded8-4d3f-820f-315eafb3c298
a0f8ef78-4fef-4f9e-a25a-566b014cb6f2	2025-08-19 11:11:40.651	2025-08-19 11:11:40.651	991f49c3-7df9-4827-94bb-276973fd8ad0	merchant_id	ae527796-c279-4b67-b736-3955b7fd8f02
2bfbf068-5d09-4496-a06a-6fdc72d324eb	2025-08-19 11:14:40.564	2025-08-19 11:14:40.564	63a345f8-8ffc-4dc7-bef9-eabca57627cd	merchant_id	0fe25934-d71c-48e7-aca8-ea3e30b5130a
c88b6fec-55d9-46c0-a5c0-c048f9c11bf5	2025-08-27 04:02:53.597	2025-08-27 04:02:53.597	8dc636d6-84f6-47cd-832f-d17325ad72aa	merchant_id	6b24c3ea-99e2-468d-8a01-ce85edcfc581
567fe0ab-ecda-42c7-9c79-2b3f5b86d63f	2025-08-18 22:42:10.492	2025-08-18 22:42:10.492	bb2cfe0a-e5ff-4ff6-9082-7847fcc40648	merchant_id	a4118033-64da-4395-9924-cb5dd7460633
cc869998-1d74-4ba5-9415-6654aff7db2d	2025-08-18 22:44:24.535	2025-08-18 22:44:24.535	7c6896a9-2d58-4038-ae3d-eea1e1db59c1	merchant_id	f4b5be3d-a85e-4be3-8f8e-f4f0e5fc527d
f0bafc27-5b10-4b88-a1f9-fd6fd0c3800e	2025-08-18 22:45:09.566	2025-08-18 22:45:09.566	7da97ec6-0040-4549-963b-112accfbdf50	merchant_id	55d40a93-da6e-41c2-bf0a-f25e081e2e29
681e38f8-e5f5-457e-87e3-e36ca9a7e12c	2025-08-18 22:47:07.749	2025-08-18 22:47:07.749	729cddbb-fd06-4d02-9e06-3a92371b826c	merchant_id	5faa92f0-205c-4250-a40a-25b2ae248e97
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (user_id, auth_id, email, given_name, family_name, created_at, updated_at) FROM stdin;
a911cba0-3f61-4bc7-86a6-0d1c407baf18	5etpEgtKBCdDWG7XrmxOrlKFTI92	amjudd315@gmail.com	Arthur	Judd	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
\.


--
-- Data for Name: Workspace; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Workspace" (workspace_id, name, created_at, updated_at) FROM stdin;
f2b1c2d3-4e5f-6789-abcd-ef0123456789	SimplyOlives	2025-08-15 06:44:40.262	2025-08-15 06:44:40.262
\.


--
-- Data for Name: _BudgetChildTags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_BudgetChildTags" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _BudgetTags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_BudgetTags" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _TransactionTags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_TransactionTags" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _UserToWorkspace; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_UserToWorkspace" ("A", "B") FROM stdin;
a911cba0-3f61-4bc7-86a6-0d1c407baf18	f2b1c2d3-4e5f-6789-abcd-ef0123456789
\.


--
-- Name: AccountPartition AccountPartition_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountPartition"
    ADD CONSTRAINT "AccountPartition_pkey" PRIMARY KEY (account_partition_id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (account_id);


--
-- Name: BalanceAdjustment BalanceAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_pkey" PRIMARY KEY (balance_adjustment_id);


--
-- Name: BudgetChildItem BudgetChildItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_pkey" PRIMARY KEY (budget_child_item_id);


--
-- Name: BudgetScheduleVariant BudgetScheduleVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetScheduleVariant"
    ADD CONSTRAINT "BudgetScheduleVariant_pkey" PRIMARY KEY (schedule_variant_id);


--
-- Name: BudgetTriggerVariant BudgetTriggerVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetTriggerVariant"
    ADD CONSTRAINT "BudgetTriggerVariant_pkey" PRIMARY KEY (trigger_variant_id);


--
-- Name: Budget Budget_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (budget_id);


--
-- Name: CategoryDetectionMapping CategoryDetectionMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CategoryDetectionMapping"
    ADD CONSTRAINT "CategoryDetectionMapping_pkey" PRIMARY KEY (workspace_id, detection_key);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (category_id);


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY (group_id);


--
-- Name: Institution Institution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Institution"
    ADD CONSTRAINT "Institution_pkey" PRIMARY KEY (institution_id);


--
-- Name: Merchant Merchant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_pkey" PRIMARY KEY (merchant_id);


--
-- Name: PlaidItem PlaidItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlaidItem"
    ADD CONSTRAINT "PlaidItem_pkey" PRIMARY KEY (plaid_item_id);


--
-- Name: SavingsGoal SavingsGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY (savings_goal_id);


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (tag_id);


--
-- Name: TransactionAttribution TransactionAttribution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_pkey" PRIMARY KEY (transaction_attribution_id);


--
-- Name: TransactionReview TransactionReview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionReview"
    ADD CONSTRAINT "TransactionReview_pkey" PRIMARY KEY (transaction_review_id);


--
-- Name: TransactionRuleAction TransactionRuleAction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionRuleAction"
    ADD CONSTRAINT "TransactionRuleAction_pkey" PRIMARY KEY (transaction_rule_action_id);


--
-- Name: TransactionRule TransactionRule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionRule"
    ADD CONSTRAINT "TransactionRule_pkey" PRIMARY KEY (transaction_rule_id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (transaction_id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (user_id);


--
-- Name: Workspace Workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workspace"
    ADD CONSTRAINT "Workspace_pkey" PRIMARY KEY (workspace_id);


--
-- Name: Institution_plaid_institution_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Institution_plaid_institution_id_key" ON public."Institution" USING btree (plaid_institution_id);


--
-- Name: SavingsGoal_account_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SavingsGoal_account_id_key" ON public."SavingsGoal" USING btree (account_id);


--
-- Name: SavingsGoal_account_partition_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SavingsGoal_account_partition_id_key" ON public."SavingsGoal" USING btree (account_partition_id);


--
-- Name: TransactionReview_transaction_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TransactionReview_transaction_id_key" ON public."TransactionReview" USING btree (transaction_id);


--
-- Name: Transaction_pending_transaction_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Transaction_pending_transaction_id_key" ON public."Transaction" USING btree (pending_transaction_id);


--
-- Name: Transaction_transfer_pair_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Transaction_transfer_pair_id_key" ON public."Transaction" USING btree (transfer_pair_id);


--
-- Name: User_auth_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_auth_id_key" ON public."User" USING btree (auth_id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _BudgetChildTags_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_BudgetChildTags_AB_unique" ON public."_BudgetChildTags" USING btree ("A", "B");


--
-- Name: _BudgetChildTags_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_BudgetChildTags_B_index" ON public."_BudgetChildTags" USING btree ("B");


--
-- Name: _BudgetTags_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_BudgetTags_AB_unique" ON public."_BudgetTags" USING btree ("A", "B");


--
-- Name: _BudgetTags_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_BudgetTags_B_index" ON public."_BudgetTags" USING btree ("B");


--
-- Name: _TransactionTags_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_TransactionTags_AB_unique" ON public."_TransactionTags" USING btree ("A", "B");


--
-- Name: _TransactionTags_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_TransactionTags_B_index" ON public."_TransactionTags" USING btree ("B");


--
-- Name: _UserToWorkspace_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_UserToWorkspace_AB_unique" ON public."_UserToWorkspace" USING btree ("A", "B");


--
-- Name: _UserToWorkspace_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_UserToWorkspace_B_index" ON public."_UserToWorkspace" USING btree ("B");


--
-- Name: AccountPartition AccountPartition_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountPartition"
    ADD CONSTRAINT "AccountPartition_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Account Account_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_institution_id_fkey" FOREIGN KEY (institution_id) REFERENCES public."Institution"(institution_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Account Account_plaid_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_plaid_item_id_fkey" FOREIGN KEY (plaid_item_id) REFERENCES public."PlaidItem"(plaid_item_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Account Account_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BalanceAdjustment BalanceAdjustment_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BalanceAdjustment BalanceAdjustment_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BalanceAdjustment"
    ADD CONSTRAINT "BalanceAdjustment_account_partition_id_fkey" FOREIGN KEY (account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BudgetChildItem BudgetChildItem_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BudgetChildItem BudgetChildItem_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public."Budget"(budget_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BudgetChildItem BudgetChildItem_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BudgetChildItem BudgetChildItem_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public."Group"(group_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BudgetChildItem BudgetChildItem_origin_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_origin_account_id_fkey" FOREIGN KEY (origin_account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BudgetChildItem BudgetChildItem_origin_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_origin_account_partition_id_fkey" FOREIGN KEY (origin_account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BudgetChildItem BudgetChildItem_target_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetChildItem"
    ADD CONSTRAINT "BudgetChildItem_target_account_partition_id_fkey" FOREIGN KEY (target_account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BudgetScheduleVariant BudgetScheduleVariant_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetScheduleVariant"
    ADD CONSTRAINT "BudgetScheduleVariant_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public."Budget"(budget_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BudgetTriggerVariant BudgetTriggerVariant_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BudgetTriggerVariant"
    ADD CONSTRAINT "BudgetTriggerVariant_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public."Budget"(budget_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Budget Budget_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Budget Budget_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public."Group"(group_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_origin_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_origin_account_id_fkey" FOREIGN KEY (origin_account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_origin_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_origin_account_partition_id_fkey" FOREIGN KEY (origin_account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_target_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_target_account_partition_id_fkey" FOREIGN KEY (target_account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryDetectionMapping CategoryDetectionMapping_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CategoryDetectionMapping"
    ADD CONSTRAINT "CategoryDetectionMapping_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CategoryDetectionMapping CategoryDetectionMapping_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CategoryDetectionMapping"
    ADD CONSTRAINT "CategoryDetectionMapping_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Category Category_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parent_category_id_fkey" FOREIGN KEY (parent_category_id) REFERENCES public."Category"(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Category Category_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Group Group_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlaidItem PlaidItem_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlaidItem"
    ADD CONSTRAINT "PlaidItem_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SavingsGoal SavingsGoal_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SavingsGoal SavingsGoal_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_account_partition_id_fkey" FOREIGN KEY (account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tag Tag_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionAttribution TransactionAttribution_account_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_account_partition_id_fkey" FOREIGN KEY (account_partition_id) REFERENCES public."AccountPartition"(account_partition_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionAttribution TransactionAttribution_budget_child_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_budget_child_item_id_fkey" FOREIGN KEY (budget_child_item_id) REFERENCES public."BudgetChildItem"(budget_child_item_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionAttribution TransactionAttribution_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public."Budget"(budget_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionAttribution TransactionAttribution_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionAttribution TransactionAttribution_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public."Group"(group_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionAttribution TransactionAttribution_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionAttribution"
    ADD CONSTRAINT "TransactionAttribution_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public."Transaction"(transaction_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionReview TransactionReview_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionReview"
    ADD CONSTRAINT "TransactionReview_assigned_to_id_fkey" FOREIGN KEY (assigned_to_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionReview TransactionReview_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionReview"
    ADD CONSTRAINT "TransactionReview_reviewed_by_id_fkey" FOREIGN KEY (reviewed_by_id) REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionReview TransactionReview_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionReview"
    ADD CONSTRAINT "TransactionReview_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public."Transaction"(transaction_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionReview TransactionReview_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionReview"
    ADD CONSTRAINT "TransactionReview_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionRuleAction TransactionRuleAction_transaction_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionRuleAction"
    ADD CONSTRAINT "TransactionRuleAction_transaction_rule_id_fkey" FOREIGN KEY (transaction_rule_id) REFERENCES public."TransactionRule"(transaction_rule_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionRule TransactionRule_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransactionRule"
    ADD CONSTRAINT "TransactionRule_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public."Account"(account_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public."Merchant"(merchant_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_pending_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pending_transaction_id_fkey" FOREIGN KEY (pending_transaction_id) REFERENCES public."Transaction"(transaction_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_transfer_pair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_transfer_pair_id_fkey" FOREIGN KEY (transfer_pair_id) REFERENCES public."Transaction"(transaction_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _BudgetChildTags _BudgetChildTags_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BudgetChildTags"
    ADD CONSTRAINT "_BudgetChildTags_A_fkey" FOREIGN KEY ("A") REFERENCES public."BudgetChildItem"(budget_child_item_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BudgetChildTags _BudgetChildTags_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BudgetChildTags"
    ADD CONSTRAINT "_BudgetChildTags_B_fkey" FOREIGN KEY ("B") REFERENCES public."Tag"(tag_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BudgetTags _BudgetTags_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BudgetTags"
    ADD CONSTRAINT "_BudgetTags_A_fkey" FOREIGN KEY ("A") REFERENCES public."Budget"(budget_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BudgetTags _BudgetTags_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_BudgetTags"
    ADD CONSTRAINT "_BudgetTags_B_fkey" FOREIGN KEY ("B") REFERENCES public."Tag"(tag_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TransactionTags _TransactionTags_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_TransactionTags"
    ADD CONSTRAINT "_TransactionTags_A_fkey" FOREIGN KEY ("A") REFERENCES public."Tag"(tag_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TransactionTags _TransactionTags_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_TransactionTags"
    ADD CONSTRAINT "_TransactionTags_B_fkey" FOREIGN KEY ("B") REFERENCES public."TransactionAttribution"(transaction_attribution_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _UserToWorkspace _UserToWorkspace_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_UserToWorkspace"
    ADD CONSTRAINT "_UserToWorkspace_A_fkey" FOREIGN KEY ("A") REFERENCES public."User"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _UserToWorkspace _UserToWorkspace_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_UserToWorkspace"
    ADD CONSTRAINT "_UserToWorkspace_B_fkey" FOREIGN KEY ("B") REFERENCES public."Workspace"(workspace_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict g28DlYjV7jefMOY3dMiLNTGaITc2qbiocZTl7lwqqCQBuA51ytKjoc2hPeTbGNt

