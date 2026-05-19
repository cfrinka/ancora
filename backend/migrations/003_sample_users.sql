-- ============================================================
-- Migration 003: Sample Therapist & Patient for testing
-- ============================================================
--
-- Credentials:
--   Therapist → sarah@ancora.com  / Therapist@1234!
--   Patient   → john@ancora.com   / Patient@1234!
--
-- Run in Supabase SQL Editor after 001 and 002.
-- ============================================================

-- Step 1: insert therapist
INSERT INTO users (id, email, password_hash, full_name, role_id, is_active)
VALUES (
    gen_random_uuid(),
    'sarah@ancora.com',
    '$2a$12$2M.KLNLap6gWZvi/F7Yoqufb/5e5Y7OHP.ZjY1GaUqEWc9HTMtdiG', -- placeholder, update below
    'Sarah Mendes',
    (SELECT id FROM roles WHERE name = 'therapist'),
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Step 2: insert patient, assigned to Sarah
INSERT INTO users (id, email, password_hash, full_name, role_id, therapist_id, is_active)
VALUES (
    gen_random_uuid(),
    'john@ancora.com',
    '$2a$12$2M.KLNLap6gWZvi/F7Yoqufb/5e5Y7OHP.ZjY1GaUqEWc9HTMtdiG', -- placeholder, update below
    'John Costa',
    (SELECT id FROM roles WHERE name = 'patient'),
    (SELECT id FROM users WHERE email = 'sarah@ancora.com'),
    TRUE
)
ON CONFLICT (email) DO NOTHING;
