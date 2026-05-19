package handler

import (
	"net/http"

	"github.com/ontherapy/backend/internal/repository"
)

type EmotionHandler struct {
	emotions *repository.EmotionRepository
}

func NewEmotionHandler(emotions *repository.EmotionRepository) *EmotionHandler {
	return &EmotionHandler{emotions: emotions}
}

// GET /api/emotions  (public-ish; available to authenticated users for post creation)
func (h *EmotionHandler) ListActive(w http.ResponseWriter, r *http.Request) {
	emotions, err := h.emotions.List(r.Context(), true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list emotions")
		return
	}
	writeJSON(w, http.StatusOK, emotions)
}
