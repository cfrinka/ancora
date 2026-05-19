package handler

import (
	"net/http"

	mw "github.com/ancora/backend/internal/middleware"
	"github.com/ancora/backend/internal/model"
	"github.com/ancora/backend/internal/repository"
)

type PostHandler struct {
	posts *repository.PostRepository
}

func NewPostHandler(posts *repository.PostRepository) *PostHandler {
	return &PostHandler{posts: posts}
}

// POST /api/patient/posts
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	claims := mw.ClaimsFromCtx(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req model.CreatePostRequest
	if err := decode(r, &req); err != nil || req.Content == "" {
		writeError(w, http.StatusBadRequest, "content is required")
		return
	}

	post, err := h.posts.CreatePost(r.Context(), claims.UserID, req.Content, req.EmotionIDs)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create post")
		return
	}
	writeJSON(w, http.StatusCreated, post)
}

// GET /api/patient/posts
func (h *PostHandler) PatientFeed(w http.ResponseWriter, r *http.Request) {
	claims := mw.ClaimsFromCtx(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	posts, err := h.posts.FeedForPatient(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch feed")
		return
	}
	writeJSON(w, http.StatusOK, posts)
}

// GET /api/therapist/feed
func (h *PostHandler) TherapistFeed(w http.ResponseWriter, r *http.Request) {
	claims := mw.ClaimsFromCtx(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	posts, err := h.posts.FeedForTherapist(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch feed")
		return
	}
	writeJSON(w, http.StatusOK, posts)
}
