-- Persistent local/UAT data. Safe to re-run: all records use deterministic natural keys.
INSERT INTO regions (name) VALUES ('Dakar'), ('Thiès'), ('Saint-Louis'), ('Kaolack'), ('Ziguinchor') ON CONFLICT (name) DO NOTHING;
INSERT INTO cities (region_id, name)
SELECT r.id, x.name FROM regions r JOIN (VALUES ('Dakar','Dakar'),('Thiès','Thiès'),('Saint-Louis','Saint-Louis'),('Kaolack','Kaolack'),('Ziguinchor','Ziguinchor')) x(region_name,name) ON x.region_name = r.name
ON CONFLICT (region_id, name) DO NOTHING;
INSERT INTO categories (name) VALUES ('Informatique'), ('Design'), ('Média'), ('Éducation'), ('Digital'), ('Services physiques') ON CONFLICT (name) DO NOTHING;

INSERT INTO users (full_name, pseudo, email, phone, city_id, can_sell, verification_status, role)
SELECT x.full_name, x.pseudo, x.email, x.phone, c.id, true, 'verified', 'both'
FROM (VALUES
  ('Awa Diop','awadesign','awa.test@kayjob.sn','+221770000101','Kaolack'),
  ('Mamadou Fall','mfallcode','mamadou.test@kayjob.sn','+221770000102','Dakar'),
  ('Fatou Ndiaye','fatoulearn','fatou.test@kayjob.sn','+221770000103','Saint-Louis'),
  ('Client KayJob','client-test','client.test@kayjob.sn','+221770000199','Dakar')
) x(full_name,pseudo,email,phone,city_name)
JOIN cities c ON c.name = x.city_name
ON CONFLICT (pseudo) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone, city_id = EXCLUDED.city_id, can_sell = true, verification_status = 'verified', role = 'both';

INSERT INTO wallets (user_id) SELECT id FROM users WHERE pseudo IN ('awadesign','mfallcode','fatoulearn','client-test') ON CONFLICT (user_id) DO NOTHING;
INSERT INTO student_profiles (user_id, headline, bio, availability, sama_score)
SELECT u.id, x.headline, x.bio, 'Disponible cette semaine', x.score
FROM users u JOIN (VALUES
 ('awadesign','Designer graphique étudiant','Logos, identités et supports de communication pour PME sénégalaises.',92),
 ('mfallcode','Développeur web étudiant','Sites vitrines rapides, accessibles et adaptés aux petites entreprises.',89),
 ('fatoulearn','Accompagnement scolaire','Cours, correction et rédaction avec une méthode simple et structurée.',86)
) x(pseudo,headline,bio,score) ON x.pseudo = u.pseudo
ON CONFLICT (user_id) DO UPDATE SET headline = EXCLUDED.headline, bio = EXCLUDED.bio, sama_score = EXCLUDED.sama_score;

INSERT INTO services (profile_id, category_id, title, description, delivery_mode, starting_price, delivery_days)
SELECT sp.id, c.id, x.title, x.description, x.mode::delivery_mode, x.price, x.days
FROM student_profiles sp JOIN users u ON u.id = sp.user_id JOIN (VALUES
 ('awadesign','Design','Logo et identité visuelle','Logo professionnel avec déclinaisons réseaux sociaux.','remote',5000,3),
 ('mfallcode','Informatique','Site vitrine React','Site responsive avec formulaire de contact et mise en ligne.','remote',15000,5),
 ('fatoulearn','Éducation','Cours particuliers et correction','Accompagnement personnalisé pour devoirs et mémoires.','both',3000,2)
) x(pseudo,category,title,description,mode,price,days) ON x.pseudo = u.pseudo JOIN categories c ON c.name = x.category
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.profile_id = sp.id AND s.title = x.title);

INSERT INTO portfolio_items (profile_id, title, description, external_url, item_type)
SELECT sp.id, x.title, x.description, x.url, 'link'
FROM student_profiles sp JOIN users u ON u.id = sp.user_id JOIN (VALUES
 ('awadesign','Identité visuelle restaurant','Logo et kit réseaux sociaux pour un commerce local.','https://behance.net/'),
 ('mfallcode','Site vitrine association','Interface responsive avec espace de contact.','https://github.com/'),
 ('fatoulearn','Support de révision','Fiches structurées pour élèves de terminale.','https://drive.google.com/')
) x(pseudo,title,description,url) ON x.pseudo = u.pseudo
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items p WHERE p.profile_id = sp.id AND p.title = x.title);

INSERT INTO missions (client_id, category_id, city_id, title, description, delivery_mode, budget_max)
SELECT u.id, c.id, city.id, x.title, x.description, x.mode::delivery_mode, x.budget
FROM users u
JOIN (VALUES
 ('client-test','Média','Kaolack','Filmer une cérémonie','Capturer une cérémonie familiale samedi prochain.', 'onsite',18000),
 ('client-test','Design','Dakar','Créer une affiche de conférence','Affiche web et impression pour un événement étudiant.', 'remote',6000)
) x(client_pseudo,category,city,title,description,mode,budget) ON x.client_pseudo = u.pseudo
JOIN categories c ON c.name = x.category
JOIN cities city ON city.name = x.city
WHERE NOT EXISTS (SELECT 1 FROM missions m WHERE m.client_id = u.id AND m.title = x.title);

INSERT INTO orders (client_id, profile_id, service_id, status, gross_amount, commission_amount, net_amount, escrow_reference, amount_total, amount_net_provider, payment_provider, payment_reference, held_at, delivered_at, review_deadline_at, released_at)
SELECT client.id, sp.id, s.id, x.status::order_status, s.starting_price, 500, s.starting_price - 500, x.reference, s.starting_price, s.starting_price - 500, 'wave', x.reference, CASE WHEN x.status <> 'awaiting_payment' THEN CURRENT_TIMESTAMP - INTERVAL '4 days' END, CASE WHEN x.status IN ('final_delivered','client_review','completed_released') THEN CURRENT_TIMESTAMP - INTERVAL '2 days' END, CASE WHEN x.status = 'client_review' THEN CURRENT_TIMESTAMP - INTERVAL '1 hour' END, CASE WHEN x.status = 'completed_released' THEN CURRENT_TIMESTAMP - INTERVAL '1 day' END
FROM users client
JOIN (VALUES
 ('mfallcode','Site vitrine React','escrowed','KJ-TEST-WAVE-1001'),
 ('awadesign','Logo et identité visuelle','client_review','KJ-TEST-WAVE-1002'),
 ('fatoulearn','Cours particuliers et correction','completed_released','KJ-TEST-WAVE-1003')
) x(provider,service,status,reference) ON true
JOIN users provider ON provider.pseudo = x.provider
JOIN student_profiles sp ON sp.user_id = provider.id
JOIN services s ON s.profile_id = sp.id AND s.title = x.service
WHERE client.pseudo = 'client-test'
AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.payment_reference = x.reference);

INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, provider, provider_reference, idempotency_key, metadata)
SELECT o.id, o.client_id, 'hold', 'credit', o.amount_total, o.payment_provider, o.payment_reference, 'seed-hold:' || o.payment_reference, '{"source":"local_test_seed"}'::jsonb
FROM orders o WHERE o.payment_reference LIKE 'KJ-TEST-%' AND o.status <> 'awaiting_payment' ON CONFLICT (idempotency_key) DO NOTHING;
INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, idempotency_key, metadata)
SELECT o.id, sp.user_id, 'release', 'credit', o.amount_net_provider, 'seed-release:' || o.payment_reference, '{"source":"local_test_seed"}'::jsonb
FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.status = 'completed_released' ON CONFLICT (idempotency_key) DO NOTHING;
INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, idempotency_key, metadata)
SELECT o.id, sp.user_id, 'commission', 'debit', o.commission_amount, 'seed-commission:' || o.payment_reference, '{"source":"local_test_seed"}'::jsonb
FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.status = 'completed_released' ON CONFLICT (idempotency_key) DO NOTHING;
UPDATE wallets w SET available_xof = GREATEST(w.available_xof, 14500), updated_at = CURRENT_TIMESTAMP WHERE w.user_id = (SELECT id FROM users WHERE pseudo = 'fatoulearn');

INSERT INTO notifications (user_id, type, title, body)
SELECT u.id, 'test_seed', 'Compte de test prêt', 'Tes données KayJob persistantes sont disponibles pour les tests locaux.' FROM users u WHERE u.pseudo IN ('client-test','awadesign','mfallcode','fatoulearn') AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'test_seed');
