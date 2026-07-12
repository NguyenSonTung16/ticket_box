--
-- PostgreSQL database dump
--


-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_jobs; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.ai_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "documentId" uuid NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_jobs OWNER TO ticketbox;

--
-- Name: artist_bios; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.artist_bios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "concertId" integer,
    "jobId" uuid,
    "promptTemplateId" uuid,
    "artistName" character varying(150),
    "stageName" character varying(150),
    category character varying(100),
    "avatarUrl" character varying(500),
    genres text,
    country character varying(100),
    "shortBio" text NOT NULL,
    "mediumBio" text NOT NULL,
    "seoBio" text NOT NULL,
    status character varying(50) DEFAULT 'PENDING_REVIEW'::character varying NOT NULL,
    "reviewedBy" uuid,
    "reviewedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.artist_bios OWNER TO ticketbox;

--
-- Name: artist_documents; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.artist_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "concertId" integer NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "fileUrl" character varying(512) NOT NULL,
    "fileSize" integer NOT NULL,
    "uploadedBy" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.artist_documents OWNER TO ticketbox;

--
-- Name: checkins; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.checkins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "ticketId" uuid NOT NULL,
    "checkerId" uuid NOT NULL,
    "deviceId" uuid NOT NULL,
    "scannedAt" timestamp without time zone NOT NULL,
    "syncedAt" timestamp without time zone,
    "isOffline" boolean DEFAULT false NOT NULL,
    "syncStatus" character varying(50) DEFAULT 'SUCCESS'::character varying NOT NULL,
    "rawPayload" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.checkins OWNER TO ticketbox;

--
-- Name: concerts; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.concerts (
    id integer NOT NULL,
    organizer_id uuid NOT NULL,
    slug character varying(100),
    "performanceDate" timestamp without time zone,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    current_step smallint DEFAULT '1'::smallint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.concerts OWNER TO ticketbox;

--
-- Name: concerts_id_seq; Type: SEQUENCE; Schema: public; Owner: ticketbox
--

CREATE SEQUENCE public.concerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.concerts_id_seq OWNER TO ticketbox;

--
-- Name: concerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ticketbox
--

ALTER SEQUENCE public.concerts_id_seq OWNED BY public.concerts.id;


--
-- Name: event_ticket_types; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.event_ticket_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "showId" integer NOT NULL,
    name character varying(100) NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    is_free boolean DEFAULT false NOT NULL,
    total_quantity integer NOT NULL,
    min_per_order integer DEFAULT 1 NOT NULL,
    max_per_order integer DEFAULT 10 NOT NULL,
    sale_start timestamp without time zone,
    sale_end timestamp without time zone,
    description text,
    ticket_image_url character varying(255),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_ticket_types OWNER TO ticketbox;

--
-- Name: gate_devices; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.gate_devices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "deviceCode" character varying(100) NOT NULL,
    "gateName" character varying(100) NOT NULL,
    location character varying(255),
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "lastSyncAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gate_devices OWNER TO ticketbox;

--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.idempotency_keys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying NOT NULL,
    "userId" uuid NOT NULL,
    status character varying DEFAULT 'PENDING'::character varying NOT NULL,
    "responsePayload" jsonb,
    "requestPayload" jsonb,
    "paypalOrderId" character varying,
    concert_id integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp without time zone
);


ALTER TABLE public.idempotency_keys OWNER TO ticketbox;

--
-- Name: import_jobs; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.import_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "fileKey" character varying(500) NOT NULL,
    "showId" character varying(100) NOT NULL,
    "sponsorId" character varying(100) NOT NULL,
    "totalRows" integer DEFAULT 0 NOT NULL,
    "successCount" integer DEFAULT 0 NOT NULL,
    "errorCount" integer DEFAULT 0 NOT NULL,
    "errorDetails" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "idempotencyKey" character varying(64) NOT NULL,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "processedRows" integer DEFAULT 0 NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL
);


ALTER TABLE public.import_jobs OWNER TO ticketbox;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    concert_id integer NOT NULL,
    "totalAmount" numeric NOT NULL,
    status character varying DEFAULT 'PAID'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invoices OWNER TO ticketbox;

--
-- Name: offline_sync_logs; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.offline_sync_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "deviceId" uuid NOT NULL,
    "batchId" character varying(100) NOT NULL,
    "totalRecords" integer NOT NULL,
    "successRecords" integer NOT NULL,
    "failedRecords" integer NOT NULL,
    "syncError" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.offline_sync_logs OWNER TO ticketbox;

--
-- Name: prompt_templates; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.prompt_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    "templateText" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prompt_templates OWNER TO ticketbox;

--
-- Name: seat_inventory; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.seat_inventory (
    "seatId" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    concert_id integer NOT NULL,
    zone character varying(100) NOT NULL,
    "seatNo" character varying(50),
    status character varying(20) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    "reservedBy" uuid,
    "expiryTime" timestamp without time zone,
    "sponsorId" character varying(100),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seat_inventory OWNER TO ticketbox;

--
-- Name: ticket_types; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.ticket_types (
    id bigint NOT NULL,
    concert_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    price numeric NOT NULL,
    total_quantity integer NOT NULL,
    remaining_quantity integer NOT NULL
);


ALTER TABLE public.ticket_types OWNER TO ticketbox;

--
-- Name: ticket_types_id_seq; Type: SEQUENCE; Schema: public; Owner: ticketbox
--

CREATE SEQUENCE public.ticket_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ticket_types_id_seq OWNER TO ticketbox;

--
-- Name: ticket_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ticketbox
--

ALTER SEQUENCE public.ticket_types_id_seq OWNED BY public.ticket_types.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    concert_id integer NOT NULL,
    "seatNo" character varying,
    zone character varying,
    price numeric NOT NULL,
    "qrCodeUrl" character varying,
    status character varying(50) DEFAULT 'valid'::character varying NOT NULL,
    "guestName" character varying(255),
    "guestEmail" character varying(255),
    "sponsorId" character varying(100),
    "importJobId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "invoiceId" uuid
);


ALTER TABLE public.tickets OWNER TO ticketbox;

--
-- Name: users; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    "passwordHash" character varying NOT NULL,
    role character varying(20) DEFAULT 'USER'::character varying NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO ticketbox;

--
-- Name: zone_inventory; Type: TABLE; Schema: public; Owner: ticketbox
--

CREATE TABLE public.zone_inventory (
    zone character varying NOT NULL,
    concert_id integer NOT NULL,
    "totalCapacity" integer NOT NULL,
    "availableSlots" integer NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    "ticketLimit" integer DEFAULT 4 NOT NULL
);


ALTER TABLE public.zone_inventory OWNER TO ticketbox;

--
-- Name: concerts id; Type: DEFAULT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.concerts ALTER COLUMN id SET DEFAULT nextval('public.concerts_id_seq'::regclass);


--
-- Name: ticket_types id; Type: DEFAULT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.ticket_types ALTER COLUMN id SET DEFAULT nextval('public.ticket_types_id_seq'::regclass);


--
-- Name: artist_bios PK_0711901513d0845570427fe2417; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_bios
    ADD CONSTRAINT "PK_0711901513d0845570427fe2417" PRIMARY KEY (id);


--
-- Name: offline_sync_logs PK_12ef7586cb234e7c0e0f904bb4c; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.offline_sync_logs
    ADD CONSTRAINT "PK_12ef7586cb234e7c0e0f904bb4c" PRIMARY KEY (id);


--
-- Name: gate_devices PK_261b554671f72437d887e81a9c0; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.gate_devices
    ADD CONSTRAINT "PK_261b554671f72437d887e81a9c0" PRIMARY KEY (id);


--
-- Name: tickets PK_343bc942ae261cf7a1377f48fd0; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY (id);


--
-- Name: import_jobs PK_4d206c602f173f98e4bb85819a3; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT "PK_4d206c602f173f98e4bb85819a3" PRIMARY KEY (id);


--
-- Name: ticket_types PK_5510ce7e18a4edc648c9fbfc283; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT "PK_5510ce7e18a4edc648c9fbfc283" PRIMARY KEY (id);


--
-- Name: seat_inventory PK_6532b609d13f9481c000cb7ef8c; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.seat_inventory
    ADD CONSTRAINT "PK_6532b609d13f9481c000cb7ef8c" PRIMARY KEY ("seatId");


--
-- Name: invoices PK_668cef7c22a427fd822cc1be3ce; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY (id);


--
-- Name: concerts PK_6ca96059628588a3988a5f3236a; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.concerts
    ADD CONSTRAINT "PK_6ca96059628588a3988a5f3236a" PRIMARY KEY (id);


--
-- Name: zone_inventory PK_765f9e6bddd804b1c78483a44e8; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.zone_inventory
    ADD CONSTRAINT "PK_765f9e6bddd804b1c78483a44e8" PRIMARY KEY (zone, concert_id);


--
-- Name: ai_jobs PK_895e59e4adb993a3f45dacb1d6b; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT "PK_895e59e4adb993a3f45dacb1d6b" PRIMARY KEY (id);


--
-- Name: idempotency_keys PK_8ad20779ad0411107a56e53d0f6; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT "PK_8ad20779ad0411107a56e53d0f6" PRIMARY KEY (id);


--
-- Name: checkins PK_99c62633386398b154840f0708c; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT "PK_99c62633386398b154840f0708c" PRIMARY KEY (id);


--
-- Name: artist_documents PK_9b00d8138d0ba551066c7b5a8b6; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_documents
    ADD CONSTRAINT "PK_9b00d8138d0ba551066c7b5a8b6" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: event_ticket_types PK_d6128b718a27ad5740d5b8a756a; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.event_ticket_types
    ADD CONSTRAINT "PK_d6128b718a27ad5740d5b8a756a" PRIMARY KEY (id);


--
-- Name: prompt_templates PK_d8621cc428ff586db3e3a8f5b74; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT "PK_d8621cc428ff586db3e3a8f5b74" PRIMARY KEY (id);


--
-- Name: idempotency_keys UQ_0afd83cbf08c9d12089a9bffc5e; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT "UQ_0afd83cbf08c9d12089a9bffc5e" UNIQUE (key);


--
-- Name: prompt_templates UQ_13e976ba22546e827e6dd7e8ab4; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT "UQ_13e976ba22546e827e6dd7e8ab4" UNIQUE (name);


--
-- Name: tickets UQ_2bff1e5ce2bb756a36269b1bb62; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "UQ_2bff1e5ce2bb756a36269b1bb62" UNIQUE (concert_id, "seatNo");


--
-- Name: gate_devices UQ_5b78c18ab26e272637a2e4b01fa; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.gate_devices
    ADD CONSTRAINT "UQ_5b78c18ab26e272637a2e4b01fa" UNIQUE ("deviceCode");


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: concerts UQ_b0239f527cb129cc0e7e63487cf; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.concerts
    ADD CONSTRAINT "UQ_b0239f527cb129cc0e7e63487cf" UNIQUE (slug);


--
-- Name: import_jobs UQ_d6dab259405842c6df5195fdf73; Type: CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT "UQ_d6dab259405842c6df5195fdf73" UNIQUE ("idempotencyKey");


--
-- Name: idx_concerts_slug; Type: INDEX; Schema: public; Owner: ticketbox
--

CREATE INDEX idx_concerts_slug ON public.concerts USING btree (slug);


--
-- Name: idx_concerts_status; Type: INDEX; Schema: public; Owner: ticketbox
--

CREATE INDEX idx_concerts_status ON public.concerts USING btree (status);


--
-- Name: idx_event_ticket_types_show; Type: INDEX; Schema: public; Owner: ticketbox
--

CREATE INDEX idx_event_ticket_types_show ON public.event_ticket_types USING btree ("showId");


--
-- Name: idx_idempotency_key_unique; Type: INDEX; Schema: public; Owner: ticketbox
--

CREATE UNIQUE INDEX idx_idempotency_key_unique ON public.idempotency_keys USING btree (key);


--
-- Name: idx_seat_inventory_lookup; Type: INDEX; Schema: public; Owner: ticketbox
--

CREATE INDEX idx_seat_inventory_lookup ON public.seat_inventory USING btree (concert_id, zone, status);


--
-- Name: invoices FK_1476f0f12a1ae6f434abe834204; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_1476f0f12a1ae6f434abe834204" FOREIGN KEY (concert_id) REFERENCES public.concerts(id);


--
-- Name: checkins FK_23a4509421eb1240d870717aff8; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT "FK_23a4509421eb1240d870717aff8" FOREIGN KEY ("ticketId") REFERENCES public.tickets(id);


--
-- Name: checkins FK_51487882ae71aeff7dcd281b76a; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT "FK_51487882ae71aeff7dcd281b76a" FOREIGN KEY ("deviceId") REFERENCES public.gate_devices(id);


--
-- Name: artist_documents FK_594c5512304f5342df84c21f3e4; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_documents
    ADD CONSTRAINT "FK_594c5512304f5342df84c21f3e4" FOREIGN KEY ("concertId") REFERENCES public.concerts(id);


--
-- Name: artist_bios FK_6482b57ce08cbe088c5d4de3917; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_bios
    ADD CONSTRAINT "FK_6482b57ce08cbe088c5d4de3917" FOREIGN KEY ("concertId") REFERENCES public.concerts(id);


--
-- Name: artist_bios FK_65f879dde194b1aab0885ed653c; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_bios
    ADD CONSTRAINT "FK_65f879dde194b1aab0885ed653c" FOREIGN KEY ("jobId") REFERENCES public.ai_jobs(id);


--
-- Name: checkins FK_66977452a4e8ca70b75e01a9781; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT "FK_66977452a4e8ca70b75e01a9781" FOREIGN KEY ("checkerId") REFERENCES public.users(id);


--
-- Name: idempotency_keys FK_7a3aaa526470ebb79221693d325; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT "FK_7a3aaa526470ebb79221693d325" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: offline_sync_logs FK_864f4c1988b6c6ca8d9b6c3546b; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.offline_sync_logs
    ADD CONSTRAINT "FK_864f4c1988b6c6ca8d9b6c3546b" FOREIGN KEY ("deviceId") REFERENCES public.gate_devices(id);


--
-- Name: artist_bios FK_9a964d5ea58486f9fe2d9a5e0b9; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_bios
    ADD CONSTRAINT "FK_9a964d5ea58486f9fe2d9a5e0b9" FOREIGN KEY ("reviewedBy") REFERENCES public.users(id);


--
-- Name: artist_bios FK_ac429b191ad819b47f94601ff5c; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_bios
    ADD CONSTRAINT "FK_ac429b191ad819b47f94601ff5c" FOREIGN KEY ("promptTemplateId") REFERENCES public.prompt_templates(id);


--
-- Name: artist_documents FK_b0c76622e8f4ca64ca726e48db8; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.artist_documents
    ADD CONSTRAINT "FK_b0c76622e8f4ca64ca726e48db8" FOREIGN KEY ("uploadedBy") REFERENCES public.users(id);


--
-- Name: ai_jobs FK_d04af1ace3a76f1de3bb638e0d3; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.ai_jobs
    ADD CONSTRAINT "FK_d04af1ace3a76f1de3bb638e0d3" FOREIGN KEY ("documentId") REFERENCES public.artist_documents(id);


--
-- Name: idempotency_keys FK_d059696295d6fdcc442773b9dd0; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT "FK_d059696295d6fdcc442773b9dd0" FOREIGN KEY (concert_id) REFERENCES public.concerts(id);


--
-- Name: tickets FK_f8f58f3e5a23a4702a850703270; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "FK_f8f58f3e5a23a4702a850703270" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id);


--
-- Name: invoices FK_fcbe490dc37a1abf68f19c5ccb9; Type: FK CONSTRAINT; Schema: public; Owner: ticketbox
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_fcbe490dc37a1abf68f19c5ccb9" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict cx38WYxapKz5hsGzFcYfxjpHPfDs6Wnr8tBsUfGBFsjK2RbhrSI1D5LzI4OTFHv

