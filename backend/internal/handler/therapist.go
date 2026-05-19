package handler

import (
	"net/http"

	mw "github.com/ontherapy/backend/internal/middleware"
	"github.com/ontherapy/backend/internal/repository"
)

type TherapistHandler struct {
	users *repository.UserRepository
}

func NewTherapistHandler(users *repository.UserRepository) *TherapistHandler {
	return &TherapistHandler{users: users}
}

// GET /api/therapist/patients
func (h *TherapistHandler) ListMyPatients(w http.ResponseWriter, r *http.Request) {
	claims := mw.ClaimsFromCtx(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	patients, err := h.users.ListPatientsByTherapist(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list patients")
		return
	}
	writeJSON(w, http.StatusOK, patients)
}
