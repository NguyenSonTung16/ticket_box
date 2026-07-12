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
-- Data for Name: concerts; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.concerts DISABLE TRIGGER ALL;

COPY public.concerts (id, organizer_id, slug, "performanceDate", status, current_step, created_at, updated_at) FROM stdin;
1	50511a78-31e2-45dc-924b-e61d2358b11e	\N	2026-10-10 07:00:00	ACTIVE	1	2026-07-11 16:22:29.686057	2026-07-11 16:22:29.686057
2	50511a78-31e2-45dc-924b-e61d2358b11e	\N	2026-11-20 07:00:00	ACTIVE	1	2026-07-11 16:22:29.719504	2026-07-11 16:22:29.719504
3	50511a78-31e2-45dc-924b-e61d2358b11e	\N	2026-12-05 07:00:00	ACTIVE	1	2026-07-11 16:22:29.735574	2026-07-11 16:22:29.735574
4	50511a78-31e2-45dc-924b-e61d2358b11e	\N	2026-12-20 07:00:00	ACTIVE	1	2026-07-11 16:22:29.75108	2026-07-11 16:22:29.75108
6	61b77172-cd38-4892-a84a-667047f73123	\N	2027-12-02 01:00:00	DRAFT	2	2026-07-12 03:48:14.501958	2026-07-12 03:48:14.543799
5	61b77172-cd38-4892-a84a-667047f73123	test-concert-1783828091307	2027-10-16 03:00:00	ACTIVE	4	2026-07-12 03:48:14.330409	2026-07-12 03:48:14.667321
8	7f13cb91-c20a-47ed-82a8-3538a783e4b4	\N	2027-12-02 01:00:00	DRAFT	2	2026-07-12 03:49:07.542005	2026-07-12 03:49:07.600855
7	7f13cb91-c20a-47ed-82a8-3538a783e4b4	test-concert-1783828146381	2027-10-16 03:00:00	CANCELLED	4	2026-07-12 03:49:07.451591	2026-07-12 03:49:07.781093
\.


ALTER TABLE public.concerts ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, email, "passwordHash", role, status, "createdAt") FROM stdin;
f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	tung161020146@gmail.com	$2b$10$TMQN3YpnXYhifHgRkiroqOth6HveGjglySPHnGLe1V96kDnzEVaaK	USER	ACTIVE	2026-07-11 14:54:34.516111
50511a78-31e2-45dc-924b-e61d2358b11e	admin@ticketbox.com	$2b$10$wC8NmFYs4B5D44k4qD5Tme1kHtsUWz7dGthV2snlYHnVJgHUeLcNK	ORGANIZER	ACTIVE	2026-07-11 14:22:09.64416
440681cf-c7f1-486b-b7a5-d01c11a3d2fd	organizer@ticketbox.com	$2b$10$wC8NmFYs4B5D44k4qD5Tme1kHtsUWz7dGthV2snlYHnVJgHUeLcNK	ORGANIZER	ACTIVE	2026-07-12 01:14:01.580456
39ce20dd-e13e-4f1d-8ddb-7e585286891c	staff@ticketbox.com	$2b$10$wC8NmFYs4B5D44k4qD5Tme1kHtsUWz7dGthV2snlYHnVJgHUeLcNK	CHECKIN_STAFF	ACTIVE	2026-07-12 01:14:27.255077
b2ad7674-a530-40ec-9884-a46f0d8f9337	user@ticketbox.com	$2b$10$wC8NmFYs4B5D44k4qD5Tme1kHtsUWz7dGthV2snlYHnVJgHUeLcNK	USER	ACTIVE	2026-07-12 01:14:27.310771
311ee2d6-1311-4746-a637-bfae96466f73	locked@ticketbox.com	$2b$10$wC8NmFYs4B5D44k4qD5Tme1kHtsUWz7dGthV2snlYHnVJgHUeLcNK	USER	LOCKED	2026-07-12 01:14:27.337972
0f715181-be7c-438f-95ef-ff29a5e3e4af	tung22643@gmail.com	$2b$10$opua0rmymGqUccBCqxWP6OwEDAwcHjYwPzRwq0V2z.gS7y8JyOC0q	USER	ACTIVE	2026-07-12 01:35:37.686294
99d902cf-b79a-4d3b-bcee-5cdcec0df09e	canatom297@gmail.com	$2b$10$Omk67BOUiXqwH7jM.C8b3O4qtLv6OUKHVmhqwQqCLwqd0NShacEh2	USER	ACTIVE	2026-07-12 02:13:08.70075
7266c080-1dc0-4804-ac84-88bb45615c06	mnatx1111@gmail.com	$2b$10$sUqkZrmCB5AqEhKreGe.PuRaAz.2WAWnxkLN2m3pM1mgfQez6ohcy	USER	ACTIVE	2026-07-12 03:18:55.619061
61b77172-cd38-4892-a84a-667047f73123	test_organizer_1783828091301@ticketbox.dev	$2b$10$YMBOz.yOonDvQ4Q9.Aai3es2hKxCOJ7NVAGRxwruvkto8vi9NO95e	USER	ACTIVE	2026-07-12 03:48:14.126623
7f13cb91-c20a-47ed-82a8-3538a783e4b4	test_organizer_1783828146377@ticketbox.dev	$2b$10$W.ZYryEHHl27721TJsEzp.dzuL/75Zqex8ysRsKoLJyIoddc.kz8W	USER	ACTIVE	2026-07-12 03:49:07.285045
3160b717-4a79-438b-80fd-9f855cde89ed	testuser_1783838517894_2@gmail.com	$2b$10$xrc8gD/jvtmbQONlE5pglOfv24bK0x/ytJN15mnp9vHflx5HZFpVy	USER	ACTIVE	2026-07-12 06:42:00.136583
85e17c4f-7908-45c0-9f90-6f2e6b274edd	testuser_1783838517826_1@gmail.com	$2b$10$5.ADayeypemjhWis/yx8lOYmpYdChtARLj.3W.cnGhIQ1z8XF48Pi	USER	ACTIVE	2026-07-12 06:42:00.131298
c71a7b51-a025-4e67-a23c-948254690e8f	testuser_1783838561225_1@gmail.com	$2b$10$gNR9OQcRKUyK6qV2gGGfseLPNyncV/JQExHmphOho6hdbK7Ds3O4e	USER	ACTIVE	2026-07-12 06:42:42.587533
be843719-dffe-4c8c-bf1c-971bb6a614ef	testuser_1783838561228_2@gmail.com	$2b$10$3mWaujT67GJwTIgAeL/nqu4b4oxbsH4rIzkRH2Sw1xLA6KElpv1E.	USER	ACTIVE	2026-07-12 06:42:42.591077
40732e0b-4f5d-4f26-a478-3ba65bd4bb6a	testuser_1783838583802_1@gmail.com	$2b$10$blwOoZRB67E/eknWCtMnzucvm5W9OH73M4sK542Noqu8V70rL6AwO	USER	ACTIVE	2026-07-12 06:43:05.965073
8bf18616-97d0-429c-bfbf-00802e747413	testuser_1783838583898_2@gmail.com	$2b$10$m9eNHTycpm8vTg6Kl0fKReEgwYmJCel70KMEAa8r.5D8OoLG955FO	USER	ACTIVE	2026-07-12 06:43:06.064359
4e22092f-e04d-4278-8ede-18a48aaf6f29	testuser_1783838617439_1@gmail.com	$2b$10$Qs1aBQmz93cIuzipKZot7eEsMslM3P59gwIEtdy5OshBeW12Ps/Ue	USER	ACTIVE	2026-07-12 06:43:39.571067
b8d7e286-1c61-4a9c-9355-3bc2a0dbfd44	testuser_1783838617489_2@gmail.com	$2b$10$stT1BfTsIvklxksU7SvMwOI2FFeJudcO/00870qU8UXuIzQNafBem	USER	ACTIVE	2026-07-12 06:43:39.597734
1c7cafb9-c6d6-4d29-9113-cb91f25c3dbf	testuser_1783838641590_1@gmail.com	$2b$10$DA2uKzNsyPXW0QIsx/DKSOcU22x4mT5ik3fcymrN5HnfIcjaslOH.	USER	ACTIVE	2026-07-12 06:44:04.407805
f29cabd9-8cf7-4e5a-8b18-23a2963122b5	testuser_1783838641587_2@gmail.com	$2b$10$8Dy4IJQt0Y.f2AoR4JQ/b.Yfj9IsojYyGn0/HFKslOo5l3zpXpOnC	USER	ACTIVE	2026-07-12 06:44:04.424266
6dccad64-9881-4587-a2b7-2f2b6f02ddd4	testuser_1783838729404_2@gmail.com	$2b$10$8heRTo6KmCXpyWil7LZ3a.fwHjqPeJR6yQKNw77IrO09TXoAe9YRG	USER	ACTIVE	2026-07-12 06:45:30.379668
b5a09697-fe42-4280-b1c0-d14aaf0c1ec3	testuser_1783838729401_1@gmail.com	$2b$10$rOLlbdKKHGiuJuR7b1NlsOU/vWwvuO/r5M47KbRwDyOHcLNONHjte	USER	ACTIVE	2026-07-12 06:45:30.379812
b97db362-7811-4de3-a8ce-8839cd90d87f	tung1610@gmail.com	$2b$10$1Jh17Xh6jE0nJo8i8qmai.wqVdf6uan3Vr6TJXhLLJ4sAGia0hGdm	USER	ACTIVE	2026-07-12 06:48:02.12978
f3844232-9623-4e13-a343-cffd301b91d1	tttt@gmail.com	$2b$10$Z6uPRIvYyNMtE/gzdAdG1uz2mL2KKbPXoTc0LhCBUktmZ6lnZCqIC	USER	ACTIVE	2026-07-12 06:48:10.931403
3da2d100-b3c2-4e66-b1b0-e58209b443a5	testuser_1783838986602_1@gmail.com	$2b$10$NALbR6Pl1pav96NgUHCPE..kfkNF1VG9Lx9P0QdZ9SBXwfUaGYMGa	USER	ACTIVE	2026-07-12 06:49:48.716279
7821e1ac-4b1a-4559-8e06-458b8249d180	testuser_1783838986601_2@gmail.com	$2b$10$437MkrAo7QkB6okJkOmDAeE0wv4uCOsvrxyDmOIJNW95zktR0aLPi	USER	ACTIVE	2026-07-12 06:49:48.775264
3cc4b91d-e13f-4a0e-a36e-518cfecbc594	testuser_1783839005065_2@gmail.com	$2b$10$xUbBbC2I8WA7IcqGuanMFer2A8pDysebOPThOHe8sNQVDD2/ZEgCO	USER	ACTIVE	2026-07-12 06:50:08.351074
24ebc879-2c51-4cb4-83c5-0eb132b9902c	testuser_1783839005069_1@gmail.com	$2b$10$Go08b0c7COcUKb6ii3YvSuAfd546PMI.HT.6l6Sn6VYj7UvMPPrLK	USER	ACTIVE	2026-07-12 06:50:08.351198
d3054908-6a3d-45b7-98cd-631dc149148f	testuser_1783839102071_2@gmail.com	$2b$10$zr8mpecUG0ug5SsXjRxfuucw3Y7a692u8V7RZ6L20vOp5d5TZef5m	USER	ACTIVE	2026-07-12 06:51:45.49487
4d3ff256-e1d2-4eb8-9cc8-e1130fac42dd	testuser_1783839102072_1@gmail.com	$2b$10$PXa9XTN31MfuzAM5u/DxYuBJCeMEBplRFcBoLKmw.snEDPYAA0wx2	USER	ACTIVE	2026-07-12 06:51:45.49502
6b292c4c-fb97-4a03-9d99-9f7e3f979af5	testuser_1783839145512_2@gmail.com	$2b$10$RzWxhMC9uMASH0VzgPqNmewfSogsF/Y.PCJlC2zHlOgoKxGJf782.	USER	ACTIVE	2026-07-12 06:52:28.336533
37637d96-51ef-4265-8b45-f26db9e4d5de	testuser_1783839145511_1@gmail.com	$2b$10$jn03aKGCAb3wYHyjKORpT.sVqGRv92mASXYDDdjZdauZaAVCaTEO2	USER	ACTIVE	2026-07-12 06:52:28.352025
7783e989-0172-4ec6-b79a-7d526e88e9cc	testuser_1783839286202_1@gmail.com	$2b$10$jXpKfXTSkbxMGiYIf7Q..eDuzsYdj87i3GHnI1Kv01AZaQA/HhXna	USER	ACTIVE	2026-07-12 06:54:47.906703
2b68a74d-d4cb-4713-832c-f3445d4d9a57	testuser_1783839286202_2@gmail.com	$2b$10$7mx0IaF2tRolzWJQQzXCZ.PgFADBm6vMwURXt9oPZWQBhpP3jzABa	USER	ACTIVE	2026-07-12 06:54:47.906881
f9eac2db-8568-43e0-914e-c83f29d9ae8c	testuser_1783839315726_1@gmail.com	$2b$10$.DWK8nk4ODRUG/WtDc26bOxS2v/Jc3GVdzg8MV57qoQyLgIR3M2mC	USER	ACTIVE	2026-07-12 06:55:17.65786
d577c4ee-0b62-4738-aac7-6dc52650f9f4	testuser_1783839315726_2@gmail.com	$2b$10$N0o8EMpPjgB7RByWDj.a8O6E3TX1g6Zf3OYQCDbjx2uI0gPSsoDre	USER	ACTIVE	2026-07-12 06:55:17.677105
00162be8-6fea-4969-a4da-7b6eae3a11a5	testuser_1783839385876_2@gmail.com	$2b$10$GOc7mz.WpwmVan3yFyVEd.hHaiz/S6imUYT5z9.5HvTH94oirLMry	USER	ACTIVE	2026-07-12 06:56:26.824308
d1aaaf93-5974-474b-9186-77cc1a07b155	testuser_1783839385875_1@gmail.com	$2b$10$VWeVxHmpqsdvIxQNicC62uPo7BX.09ALXBOOTgaIEPaghjNiulo36	USER	ACTIVE	2026-07-12 06:56:26.824825
ade86523-f17e-4b9a-aa0d-4ee5f5ce000a	testuser_1783839409590_2@gmail.com	$2b$10$RoMmVPsAXGFn0QCHniqkgesU4VAABPnia0qg2ZDGAwKbDS26stehm	USER	ACTIVE	2026-07-12 06:56:51.888027
5439f44d-fd91-40f4-b8ef-ec9ffc024493	testuser_1783839409591_1@gmail.com	$2b$10$.6MrsX52jQOgpA2GfGDw4u8UyIo4e1keNAW7/lTqrWX2T6zZLSEoi	USER	ACTIVE	2026-07-12 06:56:51.90424
ca6d8374-b60d-4af1-bfd8-e038a92bbe26	testuser_1783839453935_2@gmail.com	$2b$10$naaHO0O7gq0izmL/.9oTRu5vhcLELn2MXhS6G8ibHTKzMJo3uCmYy	USER	ACTIVE	2026-07-12 06:57:38.00977
7009d708-594c-4114-8e2c-5a8ed1b90924	testuser_1783839453935_1@gmail.com	$2b$10$KLxuENsme2OziSnBKzrD3u5DuklEjVSlEOHt7iiXeOz02XQNgQgl6	USER	ACTIVE	2026-07-12 06:57:38.011376
5c7ec667-7f06-46fe-85d0-82faa52c3826	testuser_1783839511529_2@gmail.com	$2b$10$Xu3qg5M.xVhywKfyY9KRieJa5XYmcdIA5jlFrFFo7K73IXmEOp1E.	USER	ACTIVE	2026-07-12 06:58:33.527144
24db2a24-cd4e-4152-86d4-df7f0ed9b64c	testuser_1783839511533_1@gmail.com	$2b$10$enYXNtdm2sWXfOfT42mSEehLKUFx5KkOvIWhlh2jXi/zFRU6K2ygu	USER	ACTIVE	2026-07-12 06:58:33.528953
33409c50-c85b-4eb0-a593-602b59d28919	testuser_1783839624693_1@gmail.com	$2b$10$ALAaalH61yHRNO586uUHaes9nilN1Qw6PzlUHkQJtbi3OD7iuWYMK	USER	ACTIVE	2026-07-12 07:00:28.171738
4425929c-905e-4aa8-830b-349f75d29a00	testuser_1783839624707_2@gmail.com	$2b$10$RfWqjX3LGRe9qjhpw2oJiOSFCoLroSYMY28O0Dfxn8H5Sv9lSwC4m	USER	ACTIVE	2026-07-12 07:00:28.196169
613e702f-6411-442b-a786-0f7b86bb944c	testuser_1783839669618_2@gmail.com	$2b$10$DsF1JpdIZKySXCQMofSJ5O7tIcYI625h7oqZALQy0oTiBeD4ZJJVG	USER	ACTIVE	2026-07-12 07:01:12.089853
cb7a91ae-f34f-4ef4-8454-5ba682ba7801	testuser_1783839669626_1@gmail.com	$2b$10$D7R.3BddsWj8krZkNdqQq.c9vaCcnKcrxO5tvcGtB8OpRNqJAAxVa	USER	ACTIVE	2026-07-12 07:01:12.106421
822857c0-3842-4f4a-8dee-28b8a07f19d3	testuser_1783839779060_1@gmail.com	$2b$10$8twsaN1q7p91r1Msl/GafOuG/av.l34KhJ2SwztZ167CZBqdSTpLu	USER	ACTIVE	2026-07-12 07:03:03.307733
84c9d825-3287-4e10-92b4-242842820a59	testuser_1783839779060_2@gmail.com	$2b$10$tonagcKkZRU.JM4DV2gn7uALBE5rUtG.Wpk6KeERXniC4jhBXahIu	USER	ACTIVE	2026-07-12 07:03:03.330515
e3cfa582-328c-450d-a4b7-017af6b3d1c9	testuser_1783839807359_2@gmail.com	$2b$10$nLhz/0j6iCsTP3fRljFPI.DA9pq7fV9qsBExp1rOgvuUaXRzGFqq6	USER	ACTIVE	2026-07-12 07:03:29.256505
d9889b0f-7360-417d-bb3c-14d47e822535	testuser_1783839807360_1@gmail.com	$2b$10$X84Mx.sLir.VWx8IoVRVZ.Qkh1jtWNQ9p88TDC66FSX4o43G1Tlkq	USER	ACTIVE	2026-07-12 07:03:29.275589
3e9c5083-5af1-4c32-b508-0c172dca4958	testuser_1783840205126_1@gmail.com	$2b$10$JcgrC7s50vTxKYCwIuDEmu8Divhd2zspcBIXiqHbJ.f48dicwjynu	USER	ACTIVE	2026-07-12 07:10:09.324697
53b88137-5c16-4e17-8c4c-da973ba8ce79	testuser_1783840205122_2@gmail.com	$2b$10$PPyKgHcOd/7dNWP3NT31veLzo1Qi8a1ZbR6/qLH/7sKUDQUIClhZu	USER	ACTIVE	2026-07-12 07:10:09.324744
61a7d144-3741-435a-bce6-d83dc4609814	testuser_1783840351578_2@gmail.com	$2b$10$2dNYsAXftjkUpUp9NLHxJuGIjPJKWpI/fAJB8fdLIO9ZCIjtD6loK	USER	ACTIVE	2026-07-12 07:12:34.528247
21016d35-9f16-4a05-b354-0b458a880f42	testuser_1783840351577_1@gmail.com	$2b$10$0ZHnfJCDmoZCvZQ8m8Nkgen7B6c3noYq3sbJbzbjY0l/R0zfmjUXy	USER	ACTIVE	2026-07-12 07:12:34.527892
a943ba2e-7b1f-409a-89f2-bbadcddcf36a	testuser_1783840380444_2@gmail.com	$2b$10$2U6swwll3xdnmyZw0EKQi.YZ0fYSNd8S73G0dQE9w0JR.0fYzeNEi	USER	ACTIVE	2026-07-12 07:13:03.679927
be2c33bc-4080-4605-9199-153103a998f3	testuser_1783840380444_1@gmail.com	$2b$10$izWkhgK7niox4oD43Nrrge61lvQpbVFlop4i4qVgRyhsUVwdjAbhG	USER	ACTIVE	2026-07-12 07:13:03.700728
d8f74bb9-f14d-4ea6-9567-e0fbf946bd63	testuser_1783840569447_1@gmail.com	$2b$10$Bi4S6ZfQLPtrf.HxJYy5JulAeZArRCqLHtB6BAGxXE1yvmtUfNyHG	USER	ACTIVE	2026-07-12 07:16:13.315702
f0040275-921a-4690-9867-00b4b7e1b4c6	testuser_1783840569446_2@gmail.com	$2b$10$5OdPh.Og5UgMLXzr/hBXyOH2ylazveGSH7cdbU4Gp4OdrVEWiad1S	USER	ACTIVE	2026-07-12 07:16:13.333222
bffd3f74-659f-468d-83f6-94c9ba84e4a5	testuser_1783840588165_1@gmail.com	$2b$10$.dw4qPIFX1wZxqnnAxOOJOhmMlnUv0ppxWBl5LY4nbLQ70qH7xe.m	USER	ACTIVE	2026-07-12 07:16:30.465083
cd965c0c-06f2-4dae-bf1a-4b6c4efb9f0d	testuser_1783840588165_2@gmail.com	$2b$10$TV1486lyHaW.78TDobDgE.fbDj71XCKOvG3Kbzv3MoYKaCUTgnvpS	USER	ACTIVE	2026-07-12 07:16:30.472682
9725ae04-a3ca-45a7-b9bc-2cb90b5c76cc	testuser_1783840657627_1@gmail.com	$2b$10$JUD8bjLfDLLKUFTb1PJuh.5uoApFOi98Yb.5MRo.fntZUpiHOp2JS	USER	ACTIVE	2026-07-12 07:17:39.597358
37fa4f79-e664-4afe-a093-d3604574d098	testuser_1783840657627_2@gmail.com	$2b$10$KKlAgHYq9f6ANdbGjaw3defbMD9MC7u9JDEAv2Yb8wqInqdwYMYc6	USER	ACTIVE	2026-07-12 07:17:39.599238
a2ee94a6-27d2-43af-acd8-52f02fa09a92	testuser_1783840672102_2@gmail.com	$2b$10$XEuVVBl50LSQMNDqlSyG5ega0bPfCYFdwQz/LXl6H8ts1E9f0ckU6	USER	ACTIVE	2026-07-12 07:17:55.622493
0fd5e38e-2885-42b9-860c-3ec57515d22c	testuser_1783840672102_1@gmail.com	$2b$10$zKgKrTR36aotv43u.cbUu.qMrmPIY.FcSJFlLFuGQSO30IC/Dh6eS	USER	ACTIVE	2026-07-12 07:17:55.662044
9abe6c4c-3077-4a1f-b143-b385d44fade9	testuser_1783840786636_1@gmail.com	$2b$10$c8AnrQ1zPnP.eEIb7FB8eOCHmbrURHmuVH2hLb.Ck1P7Z.tA2Dxfy	USER	ACTIVE	2026-07-12 07:19:48.771649
7510dd08-f735-466b-a7c4-484381e71b25	testuser_1783840786635_2@gmail.com	$2b$10$sgK2vFmxHjT2U2QlZEupy.0VQuQ5pH66eY.FO7D/i5RlDEBhIxjI6	USER	ACTIVE	2026-07-12 07:19:48.772822
89aa1259-4edd-4544-aaeb-5bd05d0f14ff	asdas@gmail.com	$2b$10$UE73bE/Kvy5orBbrorV3r.Wf4lJjI31aPsTGS9anezShVSW19q4kq	USER	ACTIVE	2026-07-12 09:53:25.139698
2509a0fa-f190-4524-904b-16166009e161	wewr@gmail.com	$2b$10$qf8iuCsZtAyWymkhMfBed.QkTmMy8h21wa9dX80k6pg6oZU6rCWi6	USER	ACTIVE	2026-07-12 09:59:15.407544
649409cc-6f0c-4900-9de9-0bbcf2a6b8fd	fgbfgh@gmail.com	$2b$10$X2olenZZe.NMljGkKRvZGegoksuyjL9GBUKjyeTUZM6.u5lT/JA3y	USER	ACTIVE	2026-07-12 10:01:50.136407
c5854c93-1792-410c-9c28-c37af702e7cf	sdfsdfsd@gmail.com	$2b$10$3cKn2msTqZckQFW5XMKdBOW6hLnKw3mNJafDMyRESpi75u3r.p5k.	USER	ACTIVE	2026-07-12 10:02:13.291669
679e6582-088e-4f1e-b71d-8b9fd31229f6	ccc@gmail.com	$2b$10$MR9cyRlpTI6n3m87akFlDuvx2tL2yAfkWjJartxgwZYO0fpXCkqJe	USER	ACTIVE	2026-07-12 10:15:00.172332
599214a9-ec7a-4422-9e88-8b42d2c7b77b	testuser_1783853028404_1@gmail.com	$2b$10$CH59/Ie7pELJ1xSaEzwa8O7qUCUYGUGtrcP46VBrCMT1L67kaZRSK	USER	ACTIVE	2026-07-12 10:43:51.045386
01ea9311-531a-4d17-b1ea-0e2611d1b06d	testuser_1783853028406_2@gmail.com	$2b$10$QqHn6JMDGVTc5LFJzGeSpuhO.2m/fu0YM/pTt7j1jq0FXYQ37X5Ny	USER	ACTIVE	2026-07-12 10:43:51.059692
88b37235-d3e2-4be7-a526-796cb747f804	testuser_1783853066584_2@gmail.com	$2b$10$gCd0Yf61FmL7iCKavyAdeueZkz46eRbFYVKfcC.b0MTFSZ70kXPG.	USER	ACTIVE	2026-07-12 10:44:32.060676
30f01f09-4113-4530-aa72-da8a5e9e4a40	testuser_1783853066588_1@gmail.com	$2b$10$vios.rgFr2bDKSI5SOQGjusLgmhNxH4cH2qGHT.cLpBKmmglxebMG	USER	ACTIVE	2026-07-12 10:44:32.092391
b4db83e1-9030-409d-859c-886cfe3c5db2	testuser_1783853105757_2@gmail.com	$2b$10$t7WLKC5M0HTKUDlFHI/F7emc9A4aYgpEqqIbrQ8IP41Z5cVBxWgrW	USER	ACTIVE	2026-07-12 10:45:10.628644
13a2857c-f30b-4155-9def-277388798e76	testuser_1783853105758_1@gmail.com	$2b$10$lwjM.quTajvPTIw5c16aDen8XXFU613G.DNa.XpxzYCBnwpt9AV26	USER	ACTIVE	2026-07-12 10:45:10.633228
96129eb2-bd36-44dc-823b-974b01fbd491	recovery_test_52755@example.com	$2b$10$x/e0etyoNtKCCh0t1Q6eHua4uuEZARCc4nklxNPZEz2c8Z9Na2iUS	USER	ACTIVE	2026-07-12 11:09:35.212145
af96f6b0-497b-4a00-93b3-ea07be9b6afe	recovery_test_53392@example.com	$2b$10$MRjtB9pji.p5mIXlMqMihuv/cE7lqUZlF4kwvmAQmOYKgl9OGX70G	USER	ACTIVE	2026-07-12 11:14:01.348272
b12ffa77-9d4c-435b-a8ce-3d7e3bd56949	recovery_test_83512@example.com	$2b$10$/zOD8NcpFUQfh34giatrB.TxJmTNL7KCVPRUXLoBYdkdgRbCJCYCC	USER	ACTIVE	2026-07-12 11:17:31.279288
35c21590-40a1-46e2-9fbf-e9394ff63fc0	recovery_test_41156@example.com	$2b$10$09rjPYP8Ic36SKxYOnLjv.A3jv6Xt285CGfJ9saAEy9PNGq.E1kFm	USER	ACTIVE	2026-07-12 11:19:27.067256
61628560-eed7-4375-b365-772b952092df	recovery_test_29995@example.com	$2b$10$TGDep52QAXLkqHyGXyPva.N58J3.5zI/TJ90mW.esAzPw9opBVLvW	USER	ACTIVE	2026-07-12 11:23:02.809227
79a0eca8-a4c9-410f-8871-f69a846770e2	recovery_test_44684@example.com	$2b$10$yRUCVGst/ap2AIhaK8pWSOZxLNdl5wH.hvXi0GWvro0dFvltFEuiS	USER	ACTIVE	2026-07-12 11:24:46.230363
54189ed2-f149-4893-8928-5cc63c64cc4d	recovery_test_52106@example.com	$2b$10$vVUGk1CFJJdugIHu/MihkeTiIxYxejyKx7CcwWcUoqn9U1BcJr3J6	USER	ACTIVE	2026-07-12 11:26:21.888109
ee9c50df-aad9-440d-a914-4994d604e9dc	recovery_test_64245@example.com	$2b$10$MPsyKVirJ.PVM2xYJa8UpexT7IHjpSERWBSr1h9kbKlayKPHm4y/G	USER	ACTIVE	2026-07-12 11:30:32.130592
d1f42b0a-3e1a-4aa4-a39c-3ae23aa02190	recovery_test_3673@example.com	$2b$10$OLE4cWQdptundnGyVlqIn.GjtFEBaoiiywIB9hn5zregReIn1avrK	USER	ACTIVE	2026-07-12 11:33:55.804192
6bc6779d-1388-41fe-a118-b49057f8d916	recovery_test_6801@example.com	$2b$10$LfGOw3553szLVxb139zwx.3VrIXT72WF7STUpoOVTS8dq6RvTd9x6	USER	ACTIVE	2026-07-12 11:39:25.498765
f1087485-1f61-43df-928b-7dcc50b0ffc3	recovery_test_76929@example.com	$2b$10$semdxCBCnSLFTHP8yB89Z.K.F3nrH8fwir84/RtfFpeZT7rnuv/AO	USER	ACTIVE	2026-07-12 11:40:04.170478
06a97f50-401d-4a50-93ac-6c52c6ff63f1	recovery_test_26120@example.com	$2b$10$at4UqDFJtqVouELiZsre7.0snojpuW9.n9dmauBkFwXkJG8ne335u	USER	ACTIVE	2026-07-12 11:40:42.883252
7763f2cc-734a-469d-a448-04be96f1902e	recovery_test_6458@example.com	$2b$10$UqJM24qcIe8pJHjurcrX0Ol0/kVa5lUJZ0fJRFBmmTuyoPvYaLWii	USER	ACTIVE	2026-07-12 11:49:03.600473
54c89e8a-abe7-4dd1-8700-561919da386c	testuser_1783861304188_1@gmail.com	$2b$10$82ufUQ972lr1djQC/DuIVuYNqbVS5QS0KbgsEULLikHfkFj8DZ3J.	USER	ACTIVE	2026-07-12 13:01:47.468957
7aa0faf9-6dce-4c6d-8fd8-49f35803a73e	testuser_1783861304184_2@gmail.com	$2b$10$PxmlUXxQm/BldMwE5DGTVuPohd.BRKGFJIVCDSWHs5dG0ifXmXYT6	USER	ACTIVE	2026-07-12 13:01:47.456007
edcf95e3-7eac-45b8-9040-c95f0ff864f1	testuser_1783861577757_2@gmail.com	$2b$10$ARpPImkZOogUPlCMjmbVLORf2O1fENatZhRQrQa147/IoHBjEmdOm	USER	ACTIVE	2026-07-12 13:06:20.314097
1040d416-7e99-4fe2-bc0e-6aa18402802e	testuser_1783861577757_1@gmail.com	$2b$10$KHEufG07yIQyV2Nwrvd/teCksvUpQaaXxuuZQizC8ue3vJFn/KRxu	USER	ACTIVE	2026-07-12 13:06:20.347155
daa8d790-0677-4e0f-8840-e376c5ca617e	testuser_1783861841758_2@gmail.com	$2b$10$o6yACGt0oQlDwSgLSVCfyOr/ULGADOny3kXgCjZ.RMNl/GFAbqvL6	USER	ACTIVE	2026-07-12 13:10:44.559534
9182513c-19ac-4ace-ae1a-28d58f4f19dd	testuser_1783861841783_1@gmail.com	$2b$10$Jw/8St4N9OT4TuxDHclzqOAu8N5TH0GEJ.Hh89lg1UJfKAoU8qi7u	USER	ACTIVE	2026-07-12 13:10:44.603053
9cd78b15-fded-46b8-9879-030414064816	testuser_1783861880279_2@gmail.com	$2b$10$tJdlzARl5ZkClhEBA00KyeuwyZcVveBH5YqJtqHwpRLg0hjNQHDPm	USER	ACTIVE	2026-07-12 13:11:22.58926
7640b3a9-765f-4411-9ad7-a09d1cdc4f89	testuser_1783861880330_1@gmail.com	$2b$10$hOTrC9cpCAZHLyPI5Dp8Y.D0wXYeJP7EF1d/tG7ulhWgcbgCLI7IS	USER	ACTIVE	2026-07-12 13:11:22.722859
495cee4d-e520-4ab5-a17b-86569fcc00d8	testuser_1783861915281_2@gmail.com	$2b$10$vKEFWVSXW58.NjkKnFq14eFVc.DftkoXFEAyVEx.i3ks9mCiVVcrK	USER	ACTIVE	2026-07-12 13:12:00.769478
b47e5ce5-3e99-4b1c-8c3a-59784c49e1e5	testuser_1783861915310_1@gmail.com	$2b$10$JLp0AGmCxiMPzVZcFN/S0uAUbjUQhiJDR.KqOxg.zTEePjC4Zs5Ei	USER	ACTIVE	2026-07-12 13:12:00.806202
25930254-1e40-436e-a936-ddc8c81e3599	testuser_1783862195982_1@gmail.com	$2b$10$y733yCfLgqQeatXZ8ZhzJOgGkpiMrn7ERYnsVYnrusU3M/F1Ynhjm	USER	ACTIVE	2026-07-12 13:16:40.019672
237c66f1-1dbf-4ad7-8e66-0ac01b828f9c	testuser_1783862195979_2@gmail.com	$2b$10$EwuIk.FwlSFx6QYMdnJWXuuEcCMRLzrjpslMS6fv6NmDUNyh9XoXe	USER	ACTIVE	2026-07-12 13:16:40.045753
967c7ea7-d875-46e0-bd82-338ce057b97c	testuser_1783862463917_2@gmail.com	$2b$10$QPRE/4C7iEA/VjXpAJqRNeoY5L0.5YMTcRUfvQSW5Ym3ndctpzVOm	USER	ACTIVE	2026-07-12 13:21:07.839435
872a9ada-b591-450f-93d3-8f42768d85ba	testuser_1783862463970_1@gmail.com	$2b$10$uxsIbjXvK5pOYSP46mky2ewK8XYLX1kd0BVTUAzCX8JtkXnsbUX9K	USER	ACTIVE	2026-07-12 13:21:07.944665
4be63362-c730-4657-a13e-b6cf20272bd9	recovery_test_97834@example.com	$2b$10$eOFWCQ4mtdnObpWcaRwUH.TZgovhc82XSl5y/x/.NMfjEXAIRJg2a	USER	ACTIVE	2026-07-12 13:24:34.91711
b72f4198-6398-4ad0-b74d-d6f60e2b1e24	recovery_test_82853@example.com	$2b$10$wJiKnTkClTtw3uxAVcfEyu5ojoUoTpDLvQbNKIKQRjN2H1Ym9rKJ2	USER	ACTIVE	2026-07-12 13:32:08.798254
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: artist_documents; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.artist_documents DISABLE TRIGGER ALL;

COPY public.artist_documents (id, "concertId", "fileName", "fileUrl", "fileSize", "uploadedBy", "createdAt") FROM stdin;
839e9c0a-93e5-4837-b886-ab2e76448426	1	FIT_4.0_DATH_PTTK HTTT_2526 (1).pdf	minio://artist-documents/839e9c0a-93e5-4837-b886-ab2e76448426.pdf	911676	50511a78-31e2-45dc-924b-e61d2358b11e	2026-07-12 01:15:42.306047
\.


ALTER TABLE public.artist_documents ENABLE TRIGGER ALL;

--
-- Data for Name: ai_jobs; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.ai_jobs DISABLE TRIGGER ALL;

COPY public.ai_jobs (id, "documentId", status, "errorMessage", "retryCount", "createdAt", "updatedAt") FROM stdin;
70163048-65cb-45c5-a200-a43283a36735	839e9c0a-93e5-4837-b886-ab2e76448426	COMPLETED	\N	0	2026-07-12 01:15:42.315793	2026-07-12 08:15:49.808
\.


ALTER TABLE public.ai_jobs ENABLE TRIGGER ALL;

--
-- Data for Name: prompt_templates; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.prompt_templates DISABLE TRIGGER ALL;

COPY public.prompt_templates (id, name, "templateText", "isActive", version, "createdAt") FROM stdin;
f8142b74-694b-41da-948c-e36bca927a9b	default_artist_bio_v1	System Role: Bạn là chuyên gia Marketing, Copywriter và Chuyên gia tối ưu hóa tìm kiếm (SEO) hàng đầu trong ngành công nghiệp âm nhạc và giải trí tại Việt Nam.\n\nNhiệm vụ: Dựa trên thông tin thô được cung cấp dưới đây về nghệ sĩ, hãy biên soạn và sinh ra 3 phiên bản giới thiệu (Bio) bao gồm: bản ngắn (short), bản vừa (medium) và bản tối ưu SEO (SEO).\n\nYêu cầu kỹ thuật chi tiết:\n1. Short Bio (Ngắn): Dài từ 50-70 từ, giọng văn lôi cuốn, tập trung vào điểm nổi bật lớn nhất của nghệ sĩ. Thích hợp hiển thị ở banner hoặc phần preview nhanh.\n2. Medium Bio (Vừa): Dài từ 150-200 từ, mô tả chi tiết hơn về phong cách âm nhạc, hành trình sự nghiệp và các bài hit/thành tựu nổi bật nhất.\n3. SEO Bio: Bản tóm tắt tối ưu hóa công cụ tìm kiếm, dài từ 100-120 từ, chứa từ khóa liên quan đến concert và nghệ sĩ một cách tự nhiên.\n4. SEO Keywords: Trích xuất danh sách 5-8 từ khóa SEO quan trọng nhất.\n\nDữ liệu thô của nghệ sĩ:\n---\n{{RAW_ARTIST_TEXT}}\n---\n\nĐịnh dạng đầu ra bắt buộc: Phải trả về duy nhất chuỗi JSON hợp lệ theo Schema dưới đây, tuyệt đối không bao gồm markdown code blocks (như ```json) hay ký tự thừa ngoài JSON.	t	1	2026-07-11 14:22:09.567738
\.


ALTER TABLE public.prompt_templates ENABLE TRIGGER ALL;

--
-- Data for Name: artist_bios; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.artist_bios DISABLE TRIGGER ALL;

COPY public.artist_bios (id, "concertId", "jobId", "promptTemplateId", "artistName", "stageName", category, "avatarUrl", genres, country, "shortBio", "mediumBio", "seoBio", status, "reviewedBy", "reviewedAt", "createdAt", "updatedAt") FROM stdin;
7b11c165-7fd2-495e-a124-00e8de3c7dac	1	70163048-65cb-45c5-a200-a43283a36735	f8142b74-694b-41da-948c-e36bca927a9b	\N	\N	\N	\N	\N	\N	Dữ liệu thô được cung cấp không chứa thông tin về nghệ sĩ hoặc ngành âm nhạc/giải trí, mà là mô tả chi tiết về một đồ án công nghệ thông tin. Do đó, không thể biên soạn giới thiệu nghệ sĩ ngắn gọn theo yêu cầu.	Với vai trò chuyên gia Marketing, Copywriter và SEO trong ngành âm nhạc/giải trí, tôi cần dữ liệu về phong cách âm nhạc, hành trình sự nghiệp và các bài hit/thành tựu của nghệ sĩ. Tuy nhiên, dữ liệu thô lại là bản mô tả đồ án 'Phân tích thiết kế hệ thống thông tin' cho một hệ thống quản lý ký túc xá (HomeStay Dorm). Vì không có thông tin liên quan đến nghệ sĩ, tôi không thể biên soạn bản bio trung bình.	Để tạo bản tóm tắt tối ưu SEO cho nghệ sĩ, cần có từ khóa liên quan đến concert, album, thể loại nhạc, tên nghệ sĩ và các sự kiện giải trí. Dữ liệu được cung cấp chỉ chứa các thuật ngữ chuyên ngành công nghệ thông tin như 'hệ thống ký túc xá', 'UML models', 'thiết kế CSDL', 'quy trình thuê phòng'. Do đó, không thể thực hiện yêu cầu này với dữ liệu không liên quan đến nghệ sĩ hoặc ngành giải trí.	APPROVED	50511a78-31e2-45dc-924b-e61d2358b11e	2026-07-12 08:18:07.554	2026-07-12 01:15:50.496147	2026-07-12 01:18:10.413579
\.


ALTER TABLE public.artist_bios ENABLE TRIGGER ALL;

--
-- Data for Name: gate_devices; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.gate_devices DISABLE TRIGGER ALL;

COPY public.gate_devices (id, "deviceCode", "gateName", location, status, "lastSyncAt", "createdAt") FROM stdin;
dddc6daa-82a6-4bec-8393-1de92be5aa53	gate-A-scanner-01	Default Gate	Main Gate	ACTIVE	\N	2026-07-12 01:19:15.996358
\.


ALTER TABLE public.gate_devices ENABLE TRIGGER ALL;

--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.invoices DISABLE TRIGGER ALL;

COPY public.invoices (id, "userId", concert_id, "totalAmount", status, "createdAt") FROM stdin;
ea78f222-f443-462c-8e00-7da4240e42db	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	345000	PAID	2026-07-12 02:54:08.813862
696bd981-ec61-4e05-b0cf-624aa55c4198	7266c080-1dc0-4804-ac84-88bb45615c06	2	2145000	PAID	2026-07-12 03:27:06.980775
928844b1-e3f9-4c23-bea7-3dada9c299c1	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	2	2145000	PAID	2026-07-12 03:33:29.249676
26c8785d-38df-4baa-b4e3-178a847301cf	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	4	2745000	REFUNDED_FULL	2026-07-12 03:37:59.871152
a48b3353-f72d-4ae4-a60f-6413d27c907b	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	1	1845000	REFUNDED_FULL	2026-07-12 03:44:10.930761
dfac084a-4b34-42d8-b70d-106ed884961a	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	1045000	PAID	2026-07-12 09:18:03.273679
aabadbd7-ca78-4f05-aee8-c853d50683a3	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	1045000	PAID	2026-07-12 09:19:37.486414
43235fb5-8820-4fc4-a173-ddf8620daafa	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	345000	PAID	2026-07-12 09:31:48.880799
12db1b15-eb3e-4e0c-af69-2d35b62aedb0	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	345000	PAID	2026-07-12 09:32:18.466047
ad356dc5-7dfc-4f69-9591-e178cfc334d3	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	345000	PAID	2026-07-12 09:48:59.670817
206ea7ca-97f9-482c-b4d0-0df9fb3796e1	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	2	1345000	PAID	2026-07-12 09:50:16.434939
cc7e90fc-c123-4c45-82bd-a624a8e9faff	89aa1259-4edd-4544-aaeb-5bd05d0f14ff	4	1945000	PAID	2026-07-12 09:56:17.595624
96d12723-2de7-48a5-b15c-77dcb1a98c20	c5854c93-1792-410c-9c28-c37af702e7cf	3	1645000	PAID	2026-07-12 10:02:55.031273
639a0a82-0e45-4dd2-8a48-f5c9259d8dd3	c5854c93-1792-410c-9c28-c37af702e7cf	2	645000	PAID	2026-07-12 10:13:45.806314
ee531316-990f-4972-a564-af53056e11d7	c5854c93-1792-410c-9c28-c37af702e7cf	2	1245000	PAID	2026-07-12 10:14:38.72432
db44da28-ba75-4145-8f28-772abad2bbf5	679e6582-088e-4f1e-b71d-8b9fd31229f6	3	1845000	PAID	2026-07-12 10:15:39.119141
197d6751-439c-4273-a23a-e950215dc3ce	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	1	1045000	PAID	2026-07-12 14:12:28.166825
\.


ALTER TABLE public.invoices ENABLE TRIGGER ALL;

--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.tickets DISABLE TRIGGER ALL;

COPY public.tickets (id, concert_id, "seatNo", zone, price, "qrCodeUrl", status, "guestName", "guestEmail", "sponsorId", "importJobId", "createdAt", "updatedAt", "invoiceId") FROM stdin;
8b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-A-13	SVIP	2500000	\N	checked_in	\N	\N	\N	\N	2026-07-12 01:14:27.953422	2026-07-12 01:14:27.953422	\N
7b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-A-14	SVIP	2500000	\N	refunded	\N	\N	\N	\N	2026-07-12 01:14:28.046093	2026-07-12 01:14:28.046093	\N
1a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-01	SVIP	2500000	\N	valid	\N	\N	\N	\N	2026-07-12 01:14:28.132952	2026-07-12 01:14:28.132952	\N
2b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-02	SVIP	2500000	\N	valid	\N	\N	\N	\N	2026-07-12 01:14:28.138399	2026-07-12 01:14:28.138399	\N
4d4deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-04	SVIP	2500000	\N	valid	\N	\N	\N	\N	2026-07-12 01:14:28.149591	2026-07-12 01:14:28.149591	\N
5e5deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-05	SVIP	2500000	\N	valid	\N	\N	\N	\N	2026-07-12 01:14:28.154703	2026-07-12 01:14:28.154703	\N
6f6deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-06	SVIP	2500000	\N	valid	\N	\N	\N	\N	2026-07-12 01:14:28.159021	2026-07-12 01:14:28.159021	\N
7a7deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-07	SVIP	2500000	\N	invalid	\N	\N	\N	\N	2026-07-12 01:14:28.166036	2026-07-12 01:14:28.166036	\N
8b8deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-08	SVIP	2500000	\N	refunded	\N	\N	\N	\N	2026-07-12 01:14:28.170445	2026-07-12 01:14:28.170445	\N
9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-A-12	SVIP	2500000	\N	checked_in	\N	\N	\N	\N	2026-07-12 01:14:27.531873	2026-07-12 01:19:16.009408	\N
19712d35-6b94-4d31-9a14-7c31fcd24348	1	\N	Normal	300000	\N	valid	\N	\N	\N	\N	2026-07-12 02:54:08.826571	2026-07-12 02:54:08.826571	ea78f222-f443-462c-8e00-7da4240e42db
e97e35ba-05b9-43aa-869e-d98e7f093358	2	B-3	SVIP	2100000	\N	valid	\N	\N	\N	\N	2026-07-12 03:27:06.99081	2026-07-12 03:27:06.99081	696bd981-ec61-4e05-b0cf-624aa55c4198
9164ad9a-b1b1-457f-a1f8-1bb9bdc74e6f	2	B-18	SVIP	2100000	\N	valid	\N	\N	\N	\N	2026-07-12 03:33:29.259404	2026-07-12 03:33:29.259404	928844b1-e3f9-4c23-bea7-3dada9c299c1
1d10f63c-5db2-4ca5-93e9-df8a538a2829	1	\N	VIP	1000000	\N	valid	\N	\N	\N	\N	2026-07-12 09:18:03.291629	2026-07-12 09:18:03.291629	dfac084a-4b34-42d8-b70d-106ed884961a
a57b5d2d-a9c1-4081-b577-12f4e475898c	1	\N	VIP	1000000	\N	valid	\N	\N	\N	\N	2026-07-12 09:19:37.499499	2026-07-12 09:19:37.499499	aabadbd7-ca78-4f05-aee8-c853d50683a3
8268f275-1776-4753-9090-a482b0920c44	1	\N	Normal	300000	\N	valid	\N	\N	\N	\N	2026-07-12 09:31:48.890071	2026-07-12 09:31:48.890071	43235fb5-8820-4fc4-a173-ddf8620daafa
b979ed44-788c-4815-be72-6d94ce84b7ce	1	\N	Normal	300000	\N	valid	\N	\N	\N	\N	2026-07-12 09:32:18.473398	2026-07-12 09:32:18.473398	12db1b15-eb3e-4e0c-af69-2d35b62aedb0
690e4836-fda8-4a4a-9974-46ea49ed39b4	1	\N	Normal	300000	\N	valid	\N	\N	\N	\N	2026-07-12 09:48:59.678833	2026-07-12 09:48:59.678833	ad356dc5-7dfc-4f69-9591-e178cfc334d3
72b3da16-7b4c-4fe7-aefd-1324573b9ab6	2	\N	VIP	1300000	\N	valid	\N	\N	\N	\N	2026-07-12 09:50:16.46069	2026-07-12 09:50:16.46069	206ea7ca-97f9-482c-b4d0-0df9fb3796e1
e18a3fe0-68c6-4d85-b522-68e6b74d3b94	4	\N	VIP	1900000	\N	valid	\N	\N	\N	\N	2026-07-12 09:56:17.602684	2026-07-12 09:56:17.602684	cc7e90fc-c123-4c45-82bd-a624a8e9faff
6b81a77b-6711-4d11-822c-4786740fc733	3	\N	VIP	1600000	\N	valid	\N	\N	\N	\N	2026-07-12 10:02:55.037149	2026-07-12 10:02:55.037149	96d12723-2de7-48a5-b15c-77dcb1a98c20
dc2a7913-fe72-446d-becc-c700291fdf6b	2	\N	Normal	600000	\N	valid	\N	\N	\N	\N	2026-07-12 10:13:45.815276	2026-07-12 10:13:45.815276	639a0a82-0e45-4dd2-8a48-f5c9259d8dd3
4a309e7e-88e5-44ea-a4dd-e56d0c539d05	2	\N	Normal	600000	\N	valid	\N	\N	\N	\N	2026-07-12 10:14:38.733068	2026-07-12 10:14:38.733068	ee531316-990f-4972-a564-af53056e11d7
afb1b8e9-ea45-46c1-b23d-adfc40842f47	2	\N	Normal	600000	\N	valid	\N	\N	\N	\N	2026-07-12 10:14:38.733068	2026-07-12 10:14:38.733068	ee531316-990f-4972-a564-af53056e11d7
0c016122-03d9-4f52-96f6-1d1ebd94dceb	3	\N	Normal	900000	\N	valid	\N	\N	\N	\N	2026-07-12 10:15:39.125743	2026-07-12 10:15:39.125743	db44da28-ba75-4145-8f28-772abad2bbf5
9db8e081-e7f9-4d5c-988a-c7e86b20ff53	3	\N	Normal	900000	\N	valid	\N	\N	\N	\N	2026-07-12 10:15:39.125743	2026-07-12 10:15:39.125743	db44da28-ba75-4145-8f28-772abad2bbf5
b5372235-b5c5-40eb-b2eb-6ea0ee73cbd9	1	\N	VIP	1000000	\N	valid	\N	\N	\N	\N	2026-07-12 14:12:28.189383	2026-07-12 14:12:28.189383	197d6751-439c-4273-a23a-e950215dc3ce
3c3deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	1	SVIP-B-03	SVIP	2500000	\N	checked_in	\N	\N	\N	\N	2026-07-12 01:14:28.143244	2026-07-12 14:33:15.641374	\N
\.


ALTER TABLE public.tickets ENABLE TRIGGER ALL;

--
-- Data for Name: checkins; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.checkins DISABLE TRIGGER ALL;

COPY public.checkins (id, "ticketId", "checkerId", "deviceId", "scannedAt", "syncedAt", "isOffline", "syncStatus", "rawPayload", "createdAt") FROM stdin;
9ce398f6-7f77-4175-84b7-ba23971373a5	9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	39ce20dd-e13e-4f1d-8ddb-7e585286891c	dddc6daa-82a6-4bec-8393-1de92be5aa53	2026-07-12 08:19:13.152	\N	f	SUCCESS	{"ticketId":"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d","concertId":"1","seatInfo":"SVIP-A-12","issuedAt":1717848000,"signature":"gfMfUyBtKtYsG_8AhYwBV8Mq-sgPSfyC0yQBkehAlbJQu9yTj-nVMatTL6nvs6_JseDcLOxNArN5MoTCrad6Dg"}	2026-07-12 01:19:16.002635
29a105ab-c029-4e03-a1bf-7d39c9388ac3	3c3deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d	39ce20dd-e13e-4f1d-8ddb-7e585286891c	dddc6daa-82a6-4bec-8393-1de92be5aa53	2026-07-12 21:33:11.905	\N	f	SUCCESS	{"ticketId":"3c3deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d","concertId":"1","seatInfo":"SVIP-B-03","issuedAt":1717848000,"signature":"jUkRsdsafwQuVRKAKmv-wdBP3wyubMwXBvGpcH9UzljIfRiYBCFBDBLjKCvzMrNlswhSXKSj-jZ2IjqwmmnpCw"}	2026-07-12 14:33:15.608487
\.


ALTER TABLE public.checkins ENABLE TRIGGER ALL;

--
-- Data for Name: event_ticket_types; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.event_ticket_types DISABLE TRIGGER ALL;

COPY public.event_ticket_types (id, "showId", name, price, is_free, total_quantity, min_per_order, max_per_order, sale_start, sale_end, description, ticket_image_url, sort_order, created_at, updated_at) FROM stdin;
fab933ee-7ba6-48f1-8da0-1f022a0659a1	5	VIP	1000000	f	50	1	4	\N	\N	\N	\N	0	2026-07-12 03:48:14.436436	2026-07-12 03:48:14.436436
c01193da-3205-465c-a3b5-734108ccd5ef	5	GA	500000	f	200	1	10	\N	\N	\N	\N	1	2026-07-12 03:48:14.436436	2026-07-12 03:48:14.436436
473502f6-9a83-4a73-9657-745ae26027d2	6	GA	0	t	10	1	10	\N	\N	\N	\N	0	2026-07-12 03:48:14.537767	2026-07-12 03:48:14.537767
d2803010-2602-405d-aa69-f9ca8d61302e	7	VIP	1000000	f	50	1	4	\N	\N	\N	\N	0	2026-07-12 03:49:07.501365	2026-07-12 03:49:07.501365
272fdfaa-006e-452a-98a8-2d9bba7d4ec6	7	GA	500000	f	200	1	10	\N	\N	\N	\N	1	2026-07-12 03:49:07.501365	2026-07-12 03:49:07.501365
72668bc3-20f5-4027-a58f-0184d4c8c342	8	GA	0	t	10	1	10	\N	\N	\N	\N	0	2026-07-12 03:49:07.582273	2026-07-12 03:49:07.582273
\.


ALTER TABLE public.event_ticket_types ENABLE TRIGGER ALL;

--
-- Data for Name: idempotency_keys; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.idempotency_keys DISABLE TRIGGER ALL;

COPY public.idempotency_keys (id, key, "userId", status, "responsePayload", "requestPayload", "paypalOrderId", concert_id, "createdAt", "expiresAt") FROM stdin;
ccf996d6-d587-45ae-abad-fcee9a7cd84b	25267cf0-7f16-4d1b-99a8-31ab767da9b7	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": ["A-11"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2695000}	8D573136BC353331Y	3	2026-07-11 16:36:37.274929	2026-07-12 23:36:37.971
8869bc64-265a-427c-bb3b-f4b2a6385c48	1dc285e5-73b3-420f-ac1e-20ba05207f23	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": ["A-8"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1845000}	0VW8963252504333Y	1	2026-07-11 17:03:08.274801	2026-07-13 00:03:07.943
cf7d06e8-5401-42a7-8fa6-f112218105d0	459f21f7-3d4c-4a72-b6bd-f101f6ec27be	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": ["B-19", "B-20"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 5445000}	6Y272331HL6784314	4	2026-07-11 17:11:30.318683	2026-07-13 00:11:30.203
f9d02f8a-df8f-46b0-a838-e18b44cfb2c9	ae854a43-b96c-4e6c-98d1-29a3a8f344d9	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": ["A-6", "A-7"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 4245000}	2U064387UN549794F	2	2026-07-11 17:14:10.239123	2026-07-13 00:14:09.371
eef598f2-a4f0-4f69-8df8-966f2e3376c8	ad54110f-1344-4c19-8888-147febc087cb	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": ["B-19", "B-18"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 5445000}	3C696919BP6909932	4	2026-07-12 01:25:52.611161	2026-07-13 08:25:50.1
59623f68-f233-4afa-b9b5-06b87443ea2d	610530d3-88fe-4dea-b59b-8c570564f76b	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	PENDING	\N	{"svipSeats": ["B-15", "B-16"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 4845000}	5G511346W30873939	3	2026-07-12 02:13:25.495455	2026-07-13 09:13:23.468
35b867fc-8378-4056-8171-c30440d52f0f	76cfb3c4-6d7a-4fe6-aa96-970a03d9076b	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	PENDING	\N	{"svipSeats": ["A-10", "B-11"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 3645000}	3P292563ND3202300	1	2026-07-12 02:25:51.045024	2026-07-13 09:25:48.348
5785fc38-36b3-445e-8312-b47874ddc9af	090845d6-220a-4da8-a2b8-518a4fdcf0cd	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	PENDING	\N	{"svipSeats": ["A-9", "A-10"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 4845000}	5R573388RG5046157	3	2026-07-12 02:36:01.041085	2026-07-13 09:36:00.244
4f82c0d8-dda8-4343-a142-f47b5c52b162	e89f130e-1c2e-4c7d-a9d6-ab901a107e7a	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	PENDING	\N	{"svipSeats": ["A-10"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2145000}	4Y879887HL285554W	2	2026-07-12 02:41:04.269876	2026-07-13 09:41:01.273
15bf1893-95eb-4ede-accd-9e9cd7b45b7b	62ee9cda-0403-4a72-bd94-03cebcd374d9	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": ["A-16"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2745000}	4FC45201XT776180M	4	2026-07-12 02:41:47.521342	2026-07-13 09:41:45.491
ae38aa02-cd67-4b3d-99b7-8f739ab386e0	4b29036e-987a-4c7c-b518-b3dca2b9411f	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	PENDING	\N	{"svipSeats": ["B-14"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1845000}	1N402122KE477743G	1	2026-07-12 03:10:17.467176	2026-07-13 10:10:16.15
0977b8f8-ace1-4b3c-9e22-e97a774e7311	39bff7a8-fda6-4998-a010-c03136de876b	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 300000}], "invoiceId": "ea78f222-f443-462c-8e00-7da4240e42db", "paypalOrderId": "41231227M41400307"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 345000}	41231227M41400307	1	2026-07-12 02:53:44.756588	2026-07-13 09:53:42.465
901667b0-8cc0-4e51-a7f1-8f0d57f76caf	a1b85b3f-e9c3-45ea-aeba-75251cb6ef66	7266c080-1dc0-4804-ac84-88bb45615c06	PENDING	\N	{"svipSeats": ["B-18", "B-17"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 4245000}	6NY27388RN282591V	2	2026-07-12 03:19:08.412839	2026-07-13 10:19:07.75
b0ca3d8a-2eaf-437b-b74b-20782270d283	b4931765-51ac-4904-9033-3e5183cf2095	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1645000}	4D763926WD987444K	3	2026-07-12 03:20:34.987571	2026-07-13 10:20:33.267
2e250bb6-46dd-434f-894f-f023231f8e26	8148c37a-a950-4549-93cf-a02c88bbc001	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 1}, "totalAmountVND": 3145000}	9GD50021KF425745N	4	2026-07-12 03:24:56.760384	2026-07-13 10:24:55.027
aa1447dd-3e73-47bd-8010-7bc3e1eadd63	3397a483-3037-4d23-8ec2-ac082798ec9f	7266c080-1dc0-4804-ac84-88bb45615c06	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "SVIP", "price": 2100000, "seatNo": "B-3"}], "invoiceId": "696bd981-ec61-4e05-b0cf-624aa55c4198", "paypalOrderId": "3EL887903V266792E"}	{"svipSeats": ["B-3"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2145000}	3EL887903V266792E	2	2026-07-12 03:26:42.2306	2026-07-13 10:26:41.165
afcb47f8-81d1-461d-bde7-42fa85a585c1	0dfce11c-5c4a-48c6-89b3-12c368d6983b	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [], "invoiceId": "a48b3353-f72d-4ae4-a60f-6413d27c907b", "paypalOrderId": "3CP26859TH176184U"}	{"svipSeats": ["A-12"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1845000}	3CP26859TH176184U	1	2026-07-12 03:43:49.458696	2026-07-13 10:43:46.542
31b41542-c6f1-495e-a038-1c7ad43da813	bbdc621e-f46a-4168-8e28-0af1de0fcba8	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "SVIP", "price": 2100000, "seatNo": "B-18"}], "invoiceId": "928844b1-e3f9-4c23-bea7-3dada9c299c1", "paypalOrderId": "3NY623809T798054F"}	{"svipSeats": ["B-18"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2145000}	3NY623809T798054F	2	2026-07-12 03:33:09.540813	2026-07-13 10:33:07.981
aff3ad05-2e97-47b5-86fa-5fb6d2fac1e8	e983c2aa-028e-4fac-9197-07414248c136	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [], "invoiceId": "26c8785d-38df-4baa-b4e3-178a847301cf", "paypalOrderId": "3X74457300153291D"}	{"svipSeats": ["B-1"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2745000}	3X74457300153291D	4	2026-07-12 03:37:06.414811	2026-07-13 10:37:05.556
c3cd614f-511b-4f5a-8e0e-db87ca83d052	4a3b20ab-517d-4ab4-932f-c5dcfbeb40d5	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 2}, "totalAmountVND": 1645000}	4XU9148932640463S	1	2026-07-12 04:09:45.536289	2026-07-13 11:09:42.898
10eda7c2-5948-419f-a290-6fabc5534e02	bb7164e8-ddd1-43b1-afdf-7d5bc67a1322	b97db362-7811-4de3-a8ce-8839cd90d87f	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 345000}	1UB28416E4662291F	1	2026-07-12 08:25:01.712898	2026-07-13 15:24:59.139
7d469cf9-bacb-445f-99f2-be620605fbf5	d90154e0-21f8-4ad4-b02b-fde4b8ea311e	b97db362-7811-4de3-a8ce-8839cd90d87f	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 2, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2045000}	4N122355MY8936047	1	2026-07-12 08:26:03.098669	2026-07-13 15:26:00.174
1058ddd8-5bf6-47fb-b91a-b04c25455881	7c2e683f-703d-4719-a099-4b1e1b26f601	b97db362-7811-4de3-a8ce-8839cd90d87f	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1045000}	90U72860WM934642W	1	2026-07-12 08:29:24.452098	2026-07-13 15:29:21.96
ac1645b8-b978-4656-a39b-38b22a9b1b21	fe0e3620-ea96-4247-aaf9-28421c823772	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 2, "SVIP": 0, "Normal": 0}, "totalAmountVND": 2045000}	8NW93471TD587014S	1	2026-07-12 08:44:57.913884	2026-07-13 15:44:55.31
366753dc-17b3-47be-90ec-f8397129036b	65cfe709-a8a6-4bb6-87a0-d2bda0929eda	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 945000}	64P883724X5056108	3	2026-07-12 08:58:09.126788	2026-07-13 15:58:06.604
4a9cb7ad-fd95-4267-81aa-4721e085157c	21148e40-dfe6-4a54-b37c-013f6774a1f1	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	PENDING	\N	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1045000}	0PD487967R608971J	1	2026-07-12 08:59:26.719858	2026-07-13 15:59:25.412
87ae69d7-f294-498e-b4d2-c5de02248223	4c85b228-d15f-410b-b1dd-72f1d96643b7	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "VIP", "price": 1300000}], "invoiceId": "206ea7ca-97f9-482c-b4d0-0df9fb3796e1", "paypalOrderId": "3VM312515A222481R"}	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1345000}	3VM312515A222481R	2	2026-07-12 09:49:56.535897	2026-07-13 16:49:54.774
9f925b2d-b06d-48f6-9b5b-3e376bb0e512	995086cb-b395-461c-9c94-9722f34bf48d	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "VIP", "price": 1000000}], "invoiceId": "dfac084a-4b34-42d8-b70d-106ed884961a", "paypalOrderId": "40A57646ST228371U"}	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1045000}	40A57646ST228371U	1	2026-07-12 09:17:18.256253	2026-07-13 16:17:13.76
8ee3f3f8-06d8-406f-a81e-07f4e8db1c78	fee6f04a-75b6-4715-99da-3cb53af7ad47	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 300000}], "invoiceId": "12db1b15-eb3e-4e0c-af69-2d35b62aedb0", "paypalOrderId": "03K72828026150319"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 345000}	03K72828026150319	1	2026-07-12 09:31:55.493727	2026-07-13 16:31:52.163
1dcc8e64-c883-4a29-9eb1-effd5e0d9b06	7ed1637e-adf5-4eca-8639-de27bba46ac7	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "VIP", "price": 1000000}], "invoiceId": "aabadbd7-ca78-4f05-aee8-c853d50683a3", "paypalOrderId": "34B01664R4102160J"}	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1045000}	34B01664R4102160J	1	2026-07-12 09:19:15.010216	2026-07-13 16:19:12.359
745b69ec-a660-4b0f-9f4d-653c78936c9a	ea851b00-f0d4-40f5-8562-1ae201c7a542	c5854c93-1792-410c-9c28-c37af702e7cf	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 600000}], "invoiceId": "639a0a82-0e45-4dd2-8a48-f5c9259d8dd3", "paypalOrderId": "9GJ322736G5973617"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 645000}	9GJ322736G5973617	2	2026-07-12 10:13:25.159758	2026-07-13 17:13:20.635
c107e36a-11a3-4ef1-82e5-19e210826680	f753d208-749f-43b6-bcf9-e6e761b07f0e	c5854c93-1792-410c-9c28-c37af702e7cf	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "VIP", "price": 1600000}], "invoiceId": "96d12723-2de7-48a5-b15c-77dcb1a98c20", "paypalOrderId": "0YS704158D8880033"}	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1645000}	0YS704158D8880033	3	2026-07-12 10:02:38.267797	2026-07-13 17:02:35.95
6e0116e6-632e-49e3-9faf-f481f91ed5fc	0e250bba-c6af-4786-8268-1035829494c5	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 300000}], "invoiceId": "43235fb5-8820-4fc4-a173-ddf8620daafa", "paypalOrderId": "5PL72751WM8432645"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 345000}	5PL72751WM8432645	1	2026-07-12 09:31:25.723518	2026-07-13 16:31:22.774
4c7362de-7a6c-4eac-9d76-f5092c6c9bb0	887ea109-ca18-4dfc-981b-99d71ae90357	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 300000}], "invoiceId": "ad356dc5-7dfc-4f69-9591-e178cfc334d3", "paypalOrderId": "2GG55821RB599800T"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 1}, "totalAmountVND": 345000}	2GG55821RB599800T	1	2026-07-12 09:48:21.024528	2026-07-13 16:48:19.76
a7df7498-63ff-49d3-baa4-cefb77983466	0ffad38b-1b46-473e-abff-a640a2381018	89aa1259-4edd-4544-aaeb-5bd05d0f14ff	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "VIP", "price": 1900000}], "invoiceId": "cc7e90fc-c123-4c45-82bd-a624a8e9faff", "paypalOrderId": "53Y82555U41698035"}	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1945000}	53Y82555U41698035	4	2026-07-12 09:55:53.689673	2026-07-13 16:55:50.856
7eb192db-bc33-4b6b-8dd9-e4958c69c5b8	47a9528e-285f-4912-a4f8-c32913b365cc	c5854c93-1792-410c-9c28-c37af702e7cf	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 600000}, {"zone": "Normal", "price": 600000}], "invoiceId": "ee531316-990f-4972-a564-af53056e11d7", "paypalOrderId": "8XX57546EG396253E"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 2}, "totalAmountVND": 1245000}	8XX57546EG396253E	2	2026-07-12 10:14:17.267862	2026-07-13 17:14:14.81
4668d3a7-be56-49f1-a728-8bba4029ebd8	ea9375bd-9801-4ce1-adfe-e0cfd254f9a2	679e6582-088e-4f1e-b71d-8b9fd31229f6	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "Normal", "price": 900000}, {"zone": "Normal", "price": 900000}], "invoiceId": "db44da28-ba75-4145-8f28-772abad2bbf5", "paypalOrderId": "2EA229506P3081258"}	{"svipSeats": [], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 2}, "totalAmountVND": 1845000}	2EA229506P3081258	3	2026-07-12 10:15:21.071981	2026-07-13 17:15:18.315
290fe294-c000-4f58-aef2-00ce2138060b	11557999-cb68-4a20-afff-ee93a3e6c981	79a0eca8-a4c9-410f-8871-f69a846770e2	PENDING	\N	{"svipSeats": ["A-7"], "ticketCounts": {"VIP": 0, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1845000}	40W2862664445182T	1	2026-07-12 11:25:00.781786	2026-07-13 18:25:00.797
108953dd-3c5b-401d-b183-349ab4cb19c1	80ec5eda-904c-4df6-af91-30b3c59df55a	f9eb0597-6cbf-4b5b-b6b6-cb7602c029ef	COMPLETED	{"message": "Thanh toán thành công", "success": true, "tickets": [{"zone": "VIP", "price": 1000000}], "invoiceId": "197d6751-439c-4273-a23a-e950215dc3ce", "paypalOrderId": "3P297950F6580743K"}	{"svipSeats": [], "ticketCounts": {"VIP": 1, "SVIP": 0, "Normal": 0}, "totalAmountVND": 1045000}	3P297950F6580743K	1	2026-07-12 14:12:02.037141	2026-07-13 21:11:57.592
\.


ALTER TABLE public.idempotency_keys ENABLE TRIGGER ALL;

--
-- Data for Name: import_jobs; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.import_jobs DISABLE TRIGGER ALL;

COPY public.import_jobs (id, "fileKey", "showId", "sponsorId", "totalRows", "successCount", "errorCount", "errorDetails", "idempotencyKey", "startedAt", "completedAt", "createdAt", "processedRows", status) FROM stdin;
\.


ALTER TABLE public.import_jobs ENABLE TRIGGER ALL;

--
-- Data for Name: offline_sync_logs; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.offline_sync_logs DISABLE TRIGGER ALL;

COPY public.offline_sync_logs (id, "deviceId", "batchId", "totalRecords", "successRecords", "failedRecords", "syncError", "createdAt") FROM stdin;
\.


ALTER TABLE public.offline_sync_logs ENABLE TRIGGER ALL;

--
-- Data for Name: seat_inventory; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.seat_inventory DISABLE TRIGGER ALL;

COPY public.seat_inventory ("seatId", concert_id, zone, "seatNo", status, "reservedBy", "expiryTime", "sponsorId", "createdAt", "updatedAt") FROM stdin;
c5625993-700a-439c-8229-291bf85b0a72	1	SVIP	A-2	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
6837163b-c3bf-48d0-bae1-33b629f528e8	1	SVIP	A-3	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
b67fc554-b1a3-4b17-a703-7be9cf833e6a	1	SVIP	A-4	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
805d4373-ee50-41c8-9acc-b492c262d0d4	1	SVIP	A-5	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
03dadea1-3603-4db2-be9e-9ea20cca285a	1	SVIP	A-6	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
c986fb06-2069-4b0a-a44c-14be5a66657b	2	SVIP	A-13	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
69ac97b4-9eb8-4e62-99d8-454375d25db9	1	SVIP	A-8	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
07a74c82-3d9c-4c30-bfda-8e34bd930a7d	1	SVIP	A-9	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
ac057f4a-3e56-47a6-af7c-5ae901452697	1	SVIP	A-11	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
bb91bc41-81f9-4783-ab03-dc3e09fd098f	1	SVIP	A-13	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 13:26:53.986505
2ab43e94-a513-4170-ba92-191efca0dad7	1	SVIP	A-14	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
418ce56f-7ce5-4e5f-826b-1bd944425493	1	SVIP	A-16	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
72d2d0e8-673d-478e-928a-62d16efc4a19	1	SVIP	A-17	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
b05e4c18-ccb9-48f4-857d-b905f990c21d	1	SVIP	A-18	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
f05225b7-0dce-4169-8e47-eddf24d25931	1	SVIP	A-19	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
99de923a-39a7-484e-aeeb-627b73dee584	1	SVIP	A-20	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
74957e3d-ee3f-448d-9bb2-2d7d1c3bb8b4	1	SVIP	B-1	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
c84f5c75-558a-4c3a-bb44-209209f26450	1	SVIP	B-2	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
5fa7977e-bbb8-4ea6-9268-df2c88ccb8b1	1	SVIP	B-3	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
6191e181-cdcb-459a-9657-f6b5c385f27d	1	SVIP	B-4	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
26b5feeb-4602-4b82-aa96-91549b2495b2	1	SVIP	B-5	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
ef795e67-ba10-4e12-8469-c472cb7d2422	1	SVIP	B-6	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
3a906e74-5f85-4857-8d29-873de8c1996f	1	SVIP	B-7	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
fbeb640b-5d57-448e-a2ec-e15528367ed3	1	SVIP	B-8	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
24f6cbc6-ff8e-4482-9681-16d1cc136311	1	SVIP	B-9	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
6cd005da-a4f0-4ff6-931e-c736a0948781	1	SVIP	B-10	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
bcbceb41-5e0e-43a5-9a89-4a1753fe583f	1	SVIP	B-11	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
c51a6469-d61e-46d4-bcd5-a9b4682860f1	1	SVIP	B-12	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
66c453e9-7224-4f09-8093-7f0da84a644e	2	SVIP	A-7	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
b430d672-f275-40b1-b8ae-77795a2ab333	1	SVIP	B-15	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
3060d852-ef75-4eef-943a-cdfb15a5828f	1	SVIP	B-16	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
510b3e20-c0aa-4ed1-9425-64b2f1cf6d44	1	SVIP	B-17	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
bba5954b-bab3-4cfa-b959-074e5e259e17	1	SVIP	B-18	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
9a797af4-c502-4297-afce-b9033f531e66	1	SVIP	B-19	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
9d4704e5-635c-4872-9d49-be82c48f7ac1	1	SVIP	B-20	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 03:16:50.670113
8989ae68-83d3-42c5-b78a-6fdd4e1b37d7	1	SVIP	A-7	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 13:37:50.46504
6962b0d0-ce56-4b1d-9d58-b110927d04ac	2	SVIP	A-2	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
0485cfff-5435-4138-a8ad-f7a6271a452a	2	SVIP	A-3	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
32e1d235-b540-4082-8f00-2ed31a46df7d	2	SVIP	A-4	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
f5ed214c-1352-46ae-8048-98658a89e5b3	2	SVIP	A-5	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
400e0368-08cd-4353-a2b1-f1ae379129cd	2	SVIP	A-6	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
8ea50ec8-b548-4d11-be19-0ea73d303971	2	SVIP	A-8	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
61d19402-01f0-433d-aad9-6c5b7e187bae	1	SVIP	A-1	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 07:18:22.784994
fe67018a-8418-4f18-b7d8-90e3774bad68	2	SVIP	A-11	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
d0dd6528-4278-4752-ab30-ad46383871c1	2	SVIP	A-12	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
beb02758-e420-4467-aec7-325ddcf83599	2	SVIP	A-14	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
74557dfd-53d0-41b6-a819-03b0652eaccc	2	SVIP	A-16	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
02adf1ca-0d9e-4faa-9c7b-128f99ff7c2c	2	SVIP	A-17	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
7f2450f8-d1e5-4cc9-b0c9-1879e03ad6bb	2	SVIP	A-19	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
679fbcba-0b96-4964-b26a-cc541f003509	2	SVIP	B-1	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
835875e0-6825-402e-869f-6cdecc9a56c0	2	SVIP	B-2	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
5c801f18-1383-4b13-9468-ac41f8f35e11	2	SVIP	B-4	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
b76e0f32-ac25-4a35-a2a8-c3dd84446801	2	SVIP	B-5	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
2667ad2b-1ee8-4a98-a7b4-0834514ca00a	2	SVIP	B-6	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
e0264495-9513-4f1a-a7bc-dd0c05b3ddfc	2	SVIP	B-7	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
da09fbc5-2ed5-4d2e-9423-99a953a8df8e	2	SVIP	B-8	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
fdac502c-52a7-455e-9abc-118f7e074b79	2	SVIP	B-9	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
aa058f6a-07a8-48cd-8ceb-b49c30e032ec	2	SVIP	B-10	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
deb07a6a-dea0-4f84-aafe-91ba66c9e669	2	SVIP	B-11	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
fecd1bb1-fde3-461f-9583-c8adae70d4df	2	SVIP	B-12	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
a6ef9a1c-0960-4725-a43a-72cd31d088c1	2	SVIP	B-13	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
b395af8e-856c-4a76-bca4-e1d3d78030b6	2	SVIP	B-14	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
0a82f049-a592-4ac5-bc10-280c5ade06f3	2	SVIP	B-16	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
2d0f37f5-f111-4c39-9d31-176f8fbfa8bc	1	SVIP	A-10	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 07:21:47.01078
c6530957-be54-41ed-8543-575964ff973d	2	SVIP	B-19	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
bc427664-1781-4c18-8392-ddc4437ee953	2	SVIP	B-20	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
30123e24-c770-45a5-9dc6-f7e4a80ce5fb	1	SVIP	A-15	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 07:23:22.654585
e4672089-abb9-4694-8d1f-4c64020004ae	3	SVIP	A-2	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
c4cf5fbf-cdd7-469d-bbbe-c38df14781de	3	SVIP	A-3	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
f6323736-1240-43d3-9b5a-f14abb6e9e2c	1	SVIP	B-13	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 07:25:16.078294
cc80fbca-1da2-4c51-a032-83bb9a44d0fe	2	SVIP	B-3	BOOKED	7266c080-1dc0-4804-ac84-88bb45615c06	2026-07-12 10:36:32.798	\N	2026-07-12 03:16:50.706953	2026-07-12 03:27:06.965804
083de962-231f-404c-8b76-5b5f52ed7102	2	SVIP	A-9	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:30:33.845775
602c2603-38e4-436f-853b-94a34109ba16	1	SVIP	A-12	BOOKED	00000000-0000-0000-0000-000000000000	2026-07-12 10:53:31.129	vinamilk	2026-07-12 03:16:50.670113	2026-07-12 03:43:32.583878
ffc0538f-4498-4746-9d02-5b580634e008	2	SVIP	A-18	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 09:58:53.624253
a231c41b-39d3-40db-9240-f083e642c616	2	SVIP	A-20	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 10:00:26.951102
9d60fb6b-40d6-4022-8fc0-95ceeeb9735d	2	SVIP	A-15	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 10:18:52.58246
6db9efda-f3bb-41df-94a4-937c92f7cb66	2	SVIP	B-15	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 10:18:53.513469
a968cdce-ba20-49e7-b3ee-d55f7348d5ef	1	SVIP	B-14	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.670113	2026-07-12 06:53:39.356274
1e298199-9cee-4932-a4da-fdd25e24c73c	3	SVIP	A-4	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
e063d373-845f-4409-a20e-56ec2864a548	3	SVIP	A-5	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
e5d9e337-5085-43c1-bd38-cbee4cf75ff6	3	SVIP	A-6	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
f566e8d9-d788-46f1-9348-c2f2422d9412	3	SVIP	A-8	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
61c929c7-9466-4c56-9edc-4c750b471556	3	SVIP	A-9	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
26b98077-eca9-46bf-8398-35431b6e24fc	3	SVIP	A-11	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
df489965-6a82-4314-8210-c396943a7b74	3	SVIP	A-12	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
b0a3b113-b1ed-47bd-8e9f-16c81bbec8df	3	SVIP	A-14	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
0e2c664c-86e5-41f2-a00d-879f60fe5f18	3	SVIP	A-15	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
c35cb1c5-294b-4b43-a6dd-c9f723fc2837	3	SVIP	A-16	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
02bbd4da-177d-4dba-83bf-4dc9213904ab	3	SVIP	A-17	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
42e6051f-af82-4c35-a720-21f4686a8489	3	SVIP	A-18	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
96c25eab-1816-44c7-9a6d-0134bd2753ba	3	SVIP	A-19	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
7224f0a5-eb2a-4c63-bfae-09fa7c1c6cf2	3	SVIP	A-20	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
999aef5f-283c-4cd1-af18-790e6adbbfb8	3	SVIP	B-1	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
817eebc5-c17d-4c2f-9b40-b4d0f6df58d3	3	SVIP	B-2	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
e17bfc70-1799-4597-9b64-637ab9257fff	3	SVIP	B-3	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
4e8084a5-3af1-4bd1-8111-b8e9a1ffbb32	3	SVIP	B-4	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
9b0df3df-a0b5-4f4a-b0e4-e071dc25fd70	3	SVIP	B-5	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
9a9494c2-2d30-4acf-abf3-5a42484bc18b	3	SVIP	B-6	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
a1047d06-aeac-4352-b484-de12a7de7369	3	SVIP	B-7	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
a9a34db6-7d9b-47eb-a674-64ff7a778bc2	3	SVIP	B-8	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
91cdd72e-dd9a-4b9e-8461-5e503d78c69f	3	SVIP	B-9	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
cbde98b9-a754-4df9-b86e-d1e27e7fe360	3	SVIP	B-10	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
d1032c46-bd34-44e0-9b26-d73526691c61	3	SVIP	B-11	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
4b3a9e6d-b7c8-4716-8c93-7002c1d278ee	3	SVIP	B-12	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
4adfb2ff-748a-45a5-8edc-3b86b1d71ecb	3	SVIP	B-13	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
bba57aa6-24d2-49db-8347-9fc7ca5ee3c0	3	SVIP	B-14	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
6e238381-0df4-4ce3-a32f-3c193ebefc83	3	SVIP	B-15	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
51660d50-3083-4a1f-acd5-5db2f214e627	3	SVIP	A-13	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
34bba398-2679-422d-a29e-ee5ba265bf78	3	SVIP	B-17	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
30b0edd1-ae21-441f-870b-4feb8da70aae	3	SVIP	B-18	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
330f1391-599e-41fb-af9a-29a499a82d70	3	SVIP	B-19	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
1b529659-786a-4279-8bbe-ca5bb13d651c	3	SVIP	B-20	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
9c0ab9c0-13fd-4e91-94e7-6101c5dcd5b7	3	SVIP	A-7	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
ebed41b3-1c0d-43f0-8f3d-151b5da50261	4	SVIP	A-2	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
45641a0e-b6fd-4bd9-b472-c41cf9b43491	4	SVIP	A-3	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
a5b947cf-31b1-424b-925c-67ed817511ea	4	SVIP	A-4	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
ea4b745b-3446-4262-83ab-a58968dc6de9	4	SVIP	A-5	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
7a28e68d-5798-488a-ae88-9126571aa068	4	SVIP	A-8	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
7e144fe1-e28d-4c16-a5ee-1168b56cb0a1	4	SVIP	A-9	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
27054af0-be6e-48f9-80f8-81ca418f44b4	4	SVIP	A-12	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
a8814134-aab9-44ea-83cc-02b390ef4370	4	SVIP	A-7	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
998dde32-03c1-463b-86f9-a278e54a2512	4	SVIP	A-14	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
034a980b-2572-40f8-83ae-fe2e3b0d1a72	4	SVIP	A-15	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
cb806ebe-7f02-4c60-9fc4-02643da47f6b	4	SVIP	A-16	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
57c50938-1ab8-43f6-a24a-b9ef8dd00691	4	SVIP	A-17	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
a17f42f9-5994-4319-af63-8354607a4053	4	SVIP	A-18	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
a177e673-6ca4-4f89-a904-129f97b84ccc	4	SVIP	A-19	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
aee952fa-c27d-4853-8753-2b40f971cfe8	4	SVIP	B-2	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
de33b248-392a-4ddf-8db9-05cd4b9044d6	4	SVIP	B-3	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
52360d28-ff9d-4565-80fa-7fe2b084be09	4	SVIP	B-4	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
fe1b62ef-f0b7-48eb-9623-7b12672036ec	4	SVIP	B-5	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
7f971042-b7e9-429c-b206-e8062d072220	4	SVIP	B-6	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
439305de-787a-45b0-a1dc-c3e9503fe061	4	SVIP	B-7	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
3c6a287c-7b05-4d07-90bc-d19e586d454d	4	SVIP	B-8	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
b117ab4f-efcd-4828-84a9-f3c46425fb75	4	SVIP	B-10	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
2895e82f-3dfb-45c7-a954-e45974550602	4	SVIP	B-11	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
66620b1f-8f7b-4e6a-9094-2e30c994612e	4	SVIP	B-13	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
f79bdd43-94ce-4207-a46a-3692eef796e6	4	SVIP	B-14	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
75a9087e-7303-4338-a078-e901ea013185	4	SVIP	B-16	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
bf554606-a19a-46db-9ae5-dc5fecd0354a	4	SVIP	B-17	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
d9fcdf08-9133-41e2-91c5-b8ce4dc5b36d	4	SVIP	B-18	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
4dc43b07-3595-42bc-9457-81968163acb1	4	SVIP	B-19	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
a3eb3776-ad8e-4078-bfef-c1535513565b	4	SVIP	B-20	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
3d6d77c2-e377-4284-b864-267411d13420	2	SVIP	A-10	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:30:33.855804
a4a43963-508d-427a-b398-486fd6f6a6ba	3	SVIP	A-10	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
a7e2f58b-25e1-4121-9a95-dcab19075fa5	4	SVIP	A-10	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
fd77d641-e3b6-4e6f-894c-411cf3035150	2	SVIP	B-17	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.706953	2026-07-12 03:24:29.747843
72478d40-f636-4696-aacb-0d200fa3bb79	2	SVIP	B-18	BOOKED	99d902cf-b79a-4d3b-bcee-5cdcec0df09e	2026-07-12 10:43:04.481	\N	2026-07-12 03:16:50.706953	2026-07-12 03:33:29.226991
0acf727e-2d1e-46ad-9aec-2933d3c4a585	4	SVIP	B-1	BOOKED	00000000-0000-0000-0000-000000000000	2026-07-12 10:46:48.905	\N	2026-07-12 03:16:50.767109	2026-07-12 03:36:51.150537
71586e6c-c65f-4864-8f79-f254656d942b	3	SVIP	A-1	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.736568	2026-07-12 03:16:50.736568
593bca37-ee87-40b3-8cf6-b968704a924b	4	SVIP	A-11	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 10:00:44.771401
35c4a5fb-ffeb-4695-a704-cc7288a8ecda	4	SVIP	B-12	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 10:02:03.808389
08861b8d-d778-4f3f-9304-739cf8027352	4	SVIP	B-15	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 10:04:37.355761
043a0ee9-2200-4a66-9c38-43a9d10e24ec	4	SVIP	A-20	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 10:05:11.714711
1a38843d-d537-4fb4-b4fd-5dfe57d842f9	4	SVIP	B-9	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.767109	2026-07-12 10:06:53.604095
5ecf2497-6b90-4d40-b0cf-137ccf4f3423	4	SVIP	A-6	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 10:06:57.99063
ff7f5d54-ac7b-4a8c-9baf-8c0c15cb6c0f	3	SVIP	B-16	AVAILABLE	\N	\N	\N	2026-07-12 03:16:50.736568	2026-07-12 10:21:26.445597
2d521b80-5c80-4e98-ba74-fd3a30307faf	4	SVIP	A-13	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
1468e906-b7f7-49d5-a897-2aa4b6d7121c	2	SVIP	A-1	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.706953	2026-07-12 03:16:50.706953
d9c2026a-335b-4b24-8fdc-f5100b6a92fc	4	SVIP	A-1	AVAILABLE	\N	\N	vinamilk	2026-07-12 03:16:50.767109	2026-07-12 03:16:50.767109
\.


ALTER TABLE public.seat_inventory ENABLE TRIGGER ALL;

--
-- Data for Name: ticket_types; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.ticket_types DISABLE TRIGGER ALL;

COPY public.ticket_types (id, concert_id, name, price, total_quantity, remaining_quantity) FROM stdin;
\.


ALTER TABLE public.ticket_types ENABLE TRIGGER ALL;

--
-- Data for Name: zone_inventory; Type: TABLE DATA; Schema: public; Owner: ticketbox
--

ALTER TABLE public.zone_inventory DISABLE TRIGGER ALL;

COPY public.zone_inventory (zone, concert_id, "totalCapacity", "availableSlots", price, "ticketLimit") FROM stdin;
SVIP	1	40	40	1800000	2
SVIP	2	40	40	2100000	2
SVIP	3	40	40	2400000	2
SVIP	4	40	40	2700000	2
Normal	4	100	100	1200000	4
Normal	1	100	97	300000	4
VIP	2	75	74	1300000	5
VIP	4	75	74	1900000	5
VIP	3	75	74	1600000	5
Normal	2	100	97	600000	4
Normal	3	100	98	900000	4
VIP	1	75	72	1000000	5
\.


ALTER TABLE public.zone_inventory ENABLE TRIGGER ALL;

--
-- Name: concerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ticketbox
--

SELECT pg_catalog.setval('public.concerts_id_seq', 8, true);


--
-- Name: ticket_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ticketbox
--

SELECT pg_catalog.setval('public.ticket_types_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict tWgb7SO5se9Y7bqEboTaP86XiS3nQkWizYoR4lCDeW8Qa2I87PcK8ztyenarbaY

