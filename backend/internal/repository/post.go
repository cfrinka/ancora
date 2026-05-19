package repository

import (
	"context"
	"fmt"

	"github.com/ancora/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostRepository struct {
	db *pgxpool.Pool
}

func NewPostRepository(db *pgxpool.Pool) *PostRepository {
	return &PostRepository{db: db}
}

// CreatePost inserts the post and its emotion links in a single transaction.
func (r *PostRepository) CreatePost(ctx context.Context, authorID uuid.UUID, content string, emotionIDs []int) (*model.Post, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	post := &model.Post{}
	const insertPost = `INSERT INTO posts (author_id, content) VALUES ($1, $2) RETURNING id, author_id, content, created_at, updated_at`
	if err := tx.QueryRow(ctx, insertPost, authorID, content).
		Scan(&post.ID, &post.AuthorID, &post.Content, &post.CreatedAt, &post.UpdatedAt); err != nil {
		return nil, fmt.Errorf("insert post: %w", err)
	}

	for _, eid := range emotionIDs {
		if _, err := tx.Exec(ctx,
			`INSERT INTO post_emotions (post_id, emotion_id) VALUES ($1, $2)`,
			post.ID, eid,
		); err != nil {
			return nil, fmt.Errorf("insert post_emotion: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.FindByID(ctx, post.ID)
}

// FeedForPatient returns all posts by a given patient, newest first.
func (r *PostRepository) FeedForPatient(ctx context.Context, patientID uuid.UUID) ([]*model.Post, error) {
	const q = `SELECT id, author_id, content, created_at, updated_at FROM posts WHERE author_id = $1 ORDER BY created_at DESC`
	return r.queryPosts(ctx, q, patientID)
}

// FeedForTherapist returns posts from all patients assigned to a therapist.
func (r *PostRepository) FeedForTherapist(ctx context.Context, therapistID uuid.UUID) ([]*model.Post, error) {
	const q = `
		SELECT p.id, p.author_id, p.content, p.created_at, p.updated_at
		FROM posts p
		JOIN users u ON u.id = p.author_id
		WHERE u.therapist_id = $1
		ORDER BY p.created_at DESC`
	return r.queryPosts(ctx, q, therapistID)
}

func (r *PostRepository) FindByID(ctx context.Context, postID uuid.UUID) (*model.Post, error) {
	const q = `SELECT id, author_id, content, created_at, updated_at FROM posts WHERE id = $1`
	posts, err := r.queryPosts(ctx, q, postID)
	if err != nil {
		return nil, err
	}
	if len(posts) == 0 {
		return nil, fmt.Errorf("post not found")
	}
	return posts[0], nil
}

// queryPosts is a generic helper that also hydrates emotions.
func (r *PostRepository) queryPosts(ctx context.Context, q string, arg interface{}) ([]*model.Post, error) {
	rows, err := r.db.Query(ctx, q, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*model.Post
	var ids []uuid.UUID
	postMap := map[uuid.UUID]*model.Post{}

	for rows.Next() {
		p := &model.Post{}
		if err := rows.Scan(&p.ID, &p.AuthorID, &p.Content, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, p)
		ids = append(ids, p.ID)
		postMap[p.ID] = p
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return posts, nil
	}

	// Hydrate emotions in a single query via unnest
	const emotionQ = `
		SELECT pe.post_id, e.id, e.label, e.is_active, e.created_at
		FROM post_emotions pe
		JOIN emotions e ON e.id = pe.emotion_id
		WHERE pe.post_id = ANY($1)`

	eRows, err := r.db.Query(ctx, emotionQ, ids)
	if err != nil {
		return nil, err
	}
	defer eRows.Close()

	for eRows.Next() {
		var pid uuid.UUID
		e := model.Emotion{}
		if err := eRows.Scan(&pid, &e.ID, &e.Label, &e.IsActive, &e.CreatedAt); err != nil {
			return nil, err
		}
		if p, ok := postMap[pid]; ok {
			p.Emotions = append(p.Emotions, e)
		}
	}
	return posts, eRows.Err()
}
