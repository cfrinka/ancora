package repository

import (
	"context"
	"fmt"

	"github.com/ancora/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	const q = `
		SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
		       ro.name AS role_name, u.therapist_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		JOIN roles ro ON ro.id = u.role_id
		WHERE u.email = $1 AND u.is_active = TRUE`

	row := r.db.QueryRow(ctx, q, email)
	return scanUser(row)
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	const q = `
		SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
		       ro.name AS role_name, u.therapist_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		JOIN roles ro ON ro.id = u.role_id
		WHERE u.id = $1`

	row := r.db.QueryRow(ctx, q, id)
	return scanUser(row)
}

func (r *UserRepository) CreateTherapist(ctx context.Context, email, passwordHash, fullName string) (*model.User, error) {
	const q = `
		INSERT INTO users (email, password_hash, full_name, role_id)
		VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = 'therapist'))
		RETURNING id, email, password_hash, full_name, role_id, 'therapist' AS role_name,
		          therapist_id, is_active, created_at, updated_at`

	row := r.db.QueryRow(ctx, q, email, passwordHash, fullName)
	return scanUser(row)
}

func (r *UserRepository) CreatePatient(ctx context.Context, email, passwordHash, fullName string, therapistID *string) (*model.User, error) {
	const q = `
		INSERT INTO users (email, password_hash, full_name, role_id, therapist_id)
		VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = 'patient'),
		        CASE WHEN $4::text IS NULL THEN NULL ELSE $4::uuid END)
		RETURNING id, email, password_hash, full_name, role_id, 'patient' AS role_name,
		          therapist_id, is_active, created_at, updated_at`

	var tid interface{}
	if therapistID != nil && *therapistID != "" {
		tid = *therapistID
	}
	row := r.db.QueryRow(ctx, q, email, passwordHash, fullName, tid)
	return scanUser(row)
}

func (r *UserRepository) ListTherapistsPublic(ctx context.Context) ([]model.PublicTherapist, error) {
	const q = `
		SELECT id::text, full_name FROM users
		WHERE role_id = (SELECT id FROM roles WHERE name = 'therapist') AND is_active = TRUE
		ORDER BY full_name`

	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.PublicTherapist
	for rows.Next() {
		var t model.PublicTherapist
		if err := rows.Scan(&t.ID, &t.FullName); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

func (r *UserRepository) AssignPatientToTherapist(ctx context.Context, patientID, therapistID uuid.UUID) error {
	const q = `UPDATE users SET therapist_id = $1 WHERE id = $2 AND role_id = (SELECT id FROM roles WHERE name = 'patient')`
	tag, err := r.db.Exec(ctx, q, therapistID, patientID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("patient not found or not a patient role")
	}
	return nil
}

func (r *UserRepository) ListTherapists(ctx context.Context) ([]*model.User, error) {
	const q = `
		SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
		       ro.name AS role_name, u.therapist_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		JOIN roles ro ON ro.id = u.role_id
		WHERE ro.name = 'therapist'
		ORDER BY u.full_name`

	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectUsers(rows)
}

func (r *UserRepository) ListPatients(ctx context.Context) ([]*model.User, error) {
	const q = `
		SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
		       ro.name AS role_name, u.therapist_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		JOIN roles ro ON ro.id = u.role_id
		WHERE ro.name = 'patient'
		ORDER BY u.full_name`

	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectUsers(rows)
}

func (r *UserRepository) ListPatientsByTherapist(ctx context.Context, therapistID uuid.UUID) ([]*model.User, error) {
	const q = `
		SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
		       ro.name AS role_name, u.therapist_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		JOIN roles ro ON ro.id = u.role_id
		WHERE ro.name = 'patient' AND u.therapist_id = $1
		ORDER BY u.full_name`

	rows, err := r.db.Query(ctx, q, therapistID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectUsers(rows)
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

type scanner interface {
	Scan(dest ...any) error
}

func scanUser(row scanner) (*model.User, error) {
	u := &model.User{}
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
		&u.RoleID, &u.RoleName, &u.TherapistID,
		&u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func collectUsers(rows interface {
	Next() bool
	Scan(...any) error
	Err() error
}) ([]*model.User, error) {
	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(
			&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
			&u.RoleID, &u.RoleName, &u.TherapistID,
			&u.IsActive, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
