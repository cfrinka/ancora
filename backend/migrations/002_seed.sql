-- ============================================================
-- Migration 002: Seed Data
-- Default admin account + starter emotion list
-- ============================================================
-- 
-- IMPORTANT: Change ADMIN_EMAIL / ADMIN_PASSWORD_HASH before deploying.
-- Generate a bcrypt hash with cost 12:
--   htpasswd -bnBC 12 "" yourpassword | tr -d ':\n'
--   or: go run ./cmd/hashpw yourpassword
--
-- Default credentials (change immediately after first login):
--   Email:    admin@ancora.com
--   Password: Admin@1234!
--   Hash below is bcrypt cost-12 of "Admin@1234!"
-- ============================================================

INSERT INTO users (id, email, password_hash, full_name, role_id, is_active)
VALUES (
    gen_random_uuid(),
    'admin@ancora.com',
    '$2a$12$2M.KLNLap6gWZvi/F7Yoqufb/5e5Y7OHP.ZjY1GaUqEWc9HTMtdiG',
    'System Administrator',
    (SELECT id FROM roles WHERE name = 'admin'),
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------
-- Starter emotion list
-- -----------------------------------------------------------
INSERT INTO emotions (label) VALUES
    ('Anxious'),
    ('Calm'),
    ('Overwhelmed'),
    ('Hopeful'),
    ('Sad'),
    ('Happy'),
    ('Frustrated'),
    ('Grateful'),
    ('Lonely'),
    ('Motivated'),
    ('Exhausted'),
    ('Confused'),
    ('Content'),
    ('Angry'),
    ('Fearful')
ON CONFLICT (label) DO NOTHING;
