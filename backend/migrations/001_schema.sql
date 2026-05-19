-- ============================================================
-- Migration 001: Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------
-- Roles lookup table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL  -- 'admin' | 'therapist' | 'patient'
);

INSERT INTO roles (name) VALUES ('admin'), ('therapist'), ('patient')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------
-- Users (unified table; role_id determines behaviour)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role_id       INTEGER      NOT NULL REFERENCES roles(id),
    therapist_id  UUID         REFERENCES users(id) ON DELETE SET NULL,  -- NULL unless role = patient
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_therapist   ON users(therapist_id);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);

-- -----------------------------------------------------------
-- Emotion master list (admin-managed)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS emotions (
    id         SERIAL      PRIMARY KEY,
    label      VARCHAR(100) UNIQUE NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Posts (created by patients only)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

-- -----------------------------------------------------------
-- Post <-> Emotion join table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_emotions (
    post_id    UUID    NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
    emotion_id INTEGER NOT NULL REFERENCES emotions(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, emotion_id)
);

-- -----------------------------------------------------------
-- updated_at auto-update trigger
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
