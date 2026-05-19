package model

import (
	"time"

	"github.com/google/uuid"
)

type Role struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

const (
	RoleAdmin     = "admin"
	RoleTherapist = "therapist"
	RolePatient   = "patient"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	FullName     string     `json:"full_name"`
	RoleID       int        `json:"role_id"`
	RoleName     string     `json:"role"`
	TherapistID  *uuid.UUID `json:"therapist_id,omitempty"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type Emotion struct {
	ID        int       `json:"id"`
	Label     string    `json:"label"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type Post struct {
	ID        uuid.UUID `json:"id"`
	AuthorID  uuid.UUID `json:"author_id"`
	Content   string    `json:"content"`
	Emotions  []Emotion `json:"emotions"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// -----------------------------------------------------------
// Request / Response DTOs
// -----------------------------------------------------------

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	User *User `json:"user"`
}

type CreatePostRequest struct {
	Content    string `json:"content"`
	EmotionIDs []int  `json:"emotion_ids"`
}

type CreateTherapistRequest struct {
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Password string `json:"password"`
}

type AssignPatientRequest struct {
	TherapistID string `json:"therapist_id"`
}

type CreateEmotionRequest struct {
	Label string `json:"label"`
}

type UpdateEmotionRequest struct {
	Label    string `json:"label"`
	IsActive bool   `json:"is_active"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
