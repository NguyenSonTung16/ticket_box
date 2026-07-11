TRUNCATE TABLE artist_bios CASCADE;
INSERT INTO artist_bios ("artistName", "stageName", category, "shortBio", "mediumBio", "seoBio", status, "createdAt", "updatedAt") VALUES 
('Son Tùng M-TP', 'M-TP', 'Singer', 'Ca si, nh?c si hàng d?u Vi?t Nam v?i hàng lo?t b?n hit dình dám và phong cách âm nh?c d?c dáo.', 'Medium bio', 'SEO bio', 'APPROVED', '2026-07-01T08:00:00Z', '2026-07-10T10:00:00Z'),
('Hà Anh Tu?n', 'HAT', 'Singer', 'Gi?ng ca tr? tình n?i ti?ng v?i nh?ng b?n ballad sâu l?ng v? tình yêu và cu?c s?ng.', 'Medium bio', 'SEO bio', 'APPROVED', '2026-07-02T09:00:00Z', '2026-07-09T14:30:00Z'),
('Tùng Duong', 'Tùng Duong', 'Singer', 'Ngh? si da tài v?i kh? nang bi?n hóa phong cách âm nh?c t? jazz d?n nh?c dân gian duong d?i.', 'Medium bio', 'SEO bio', 'PENDING_REVIEW', '2026-07-03T10:00:00Z', '2026-07-08T16:00:00Z'),
('Ðen Vâu', 'Ðen', 'Rapper', 'Rapper n?i b?t v?i l?i rap chân th?c, g?n gui v? cu?c s?ng và con ngu?i Vi?t Nam.', 'Medium bio', 'SEO bio', 'APPROVED', '2026-07-04T11:00:00Z', '2026-07-07T12:00:00Z'),
('Bích Phuong', 'Bích Phuong', 'Singer', 'Ca si tr? nang d?ng v?i nh?ng b?n nh?c pop sôi d?ng và vu d?o b?t m?t.', 'Medium bio', 'SEO bio', 'REJECTED', '2026-07-05T08:00:00Z', '2026-07-06T09:00:00Z'),
('MONO', 'MONO', 'Singer', 'Gi?ng ca tr? tài nang thu?c th? h? ngh? si m?i v?i phong cách âm nh?c hi?n d?i.', 'Medium bio', 'SEO bio', 'PENDING_REVIEW', '2026-07-05T08:30:00Z', '2026-07-05T15:00:00Z');

