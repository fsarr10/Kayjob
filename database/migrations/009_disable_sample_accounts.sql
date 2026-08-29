-- Hide local sample accounts from production-facing queries without deleting audit history.

WITH sample_users AS (
  SELECT id FROM users WHERE pseudo IN ('client-test', 'awadesign', 'mfallcode', 'fatoulearn')
)
UPDATE services
SET is_active = false
WHERE profile_id IN (SELECT id FROM student_profiles WHERE user_id IN (SELECT id FROM sample_users));

WITH sample_users AS (
  SELECT id FROM users WHERE pseudo IN ('client-test', 'awadesign', 'mfallcode', 'fatoulearn')
)
UPDATE missions
SET is_open = false
WHERE client_id IN (SELECT id FROM sample_users);

UPDATE users
SET is_active = false
WHERE pseudo IN ('client-test', 'awadesign', 'mfallcode', 'fatoulearn');
