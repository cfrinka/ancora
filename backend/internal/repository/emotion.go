package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ontherapy/backend/internal/model"
)

type EmotionRepository struct {
	db *pgxpool.Pool
}

func NewEmotionRepository(db *pgxpool.Pool) *EmotionRepository {
	return &EmotionRepository{db: db}
}

func (r *EmotionRepository) List(ctx context.Context, activeOnly bool) ([]*model.Emotion, error) {
	q := `SELECT id, label, is_active, created_at FROM emotions`
	if activeOnly {
		q += ` WHERE is_active = TRUE`
	}
	q += ` ORDER BY label`

	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var emotions []*model.Emotion
	for rows.Next() {
		e := &model.Emotion{}
		if err := rows.Scan(&e.ID, &e.Label, &e.IsActive, &e.CreatedAt); err != nil {
			return nil, err
		}
		emotions = append(emotions, e)
	}
	return emotions, rows.Err()
}

func (r *EmotionRepository) Create(ctx context.Context, label string) (*model.Emotion, error) {
	const q = `INSERT INTO emotions (label) VALUES ($1) RETURNING id, label, is_active, created_at`
	e := &model.Emotion{}
	err := r.db.QueryRow(ctx, q, label).Scan(&e.ID, &e.Label, &e.IsActive, &e.CreatedAt)
	return e, err
}

func (r *EmotionRepository) Update(ctx context.Context, id int, label string, isActive bool) (*model.Emotion, error) {
	const q = `UPDATE emotions SET label = $1, is_active = $2 WHERE id = $3 RETURNING id, label, is_active, created_at`
	e := &model.Emotion{}
	err := r.db.QueryRow(ctx, q, label, isActive, id).Scan(&e.ID, &e.Label, &e.IsActive, &e.CreatedAt)
	return e, err
}

func (r *EmotionRepository) Delete(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM emotions WHERE id = $1`, id)
	return err
}
