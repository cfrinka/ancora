package handler

import (
	"net/http"
	"strconv"

	"github.com/ancora/backend/internal/model"
	"github.com/ancora/backend/internal/repository"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	users    *repository.UserRepository
	emotions *repository.EmotionRepository
}

func NewAdminHandler(users *repository.UserRepository, emotions *repository.EmotionRepository) *AdminHandler {
	return &AdminHandler{users: users, emotions: emotions}
}

// ---- Therapist management ----

// POST /api/admin/therapists
func (h *AdminHandler) CreateTherapist(w http.ResponseWriter, r *http.Request) {
	var req model.CreateTherapistRequest
	if err := decode(r, &req); err != nil || req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email, full_name, and password are required")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	user, err := h.users.CreateTherapist(r.Context(), req.Email, string(hash), req.FullName)
	if err != nil {
		writeError(w, http.StatusConflict, "email already in use or database error")
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

// GET /api/admin/therapists
func (h *AdminHandler) ListTherapists(w http.ResponseWriter, r *http.Request) {
	therapists, err := h.users.ListTherapists(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list therapists")
		return
	}
	writeJSON(w, http.StatusOK, therapists)
}

// ---- Patient management ----

// GET /api/admin/patients
func (h *AdminHandler) ListPatients(w http.ResponseWriter, r *http.Request) {
	patients, err := h.users.ListPatients(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list patients")
		return
	}
	writeJSON(w, http.StatusOK, patients)
}

// PUT /api/admin/patients/{patientID}/assign
func (h *AdminHandler) AssignPatient(w http.ResponseWriter, r *http.Request) {
	patientIDStr := chi.URLParam(r, "patientID")
	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid patient ID")
		return
	}

	var req model.AssignPatientRequest
	if err := decode(r, &req); err != nil || req.TherapistID == "" {
		writeError(w, http.StatusBadRequest, "therapist_id is required")
		return
	}

	therapistID, err := uuid.Parse(req.TherapistID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid therapist ID")
		return
	}

	if err := h.users.AssignPatientToTherapist(r.Context(), patientID, therapistID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- Emotion CRUD ----

// GET /api/admin/emotions
func (h *AdminHandler) ListEmotions(w http.ResponseWriter, r *http.Request) {
	emotions, err := h.emotions.List(r.Context(), false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list emotions")
		return
	}
	writeJSON(w, http.StatusOK, emotions)
}

// POST /api/admin/emotions
func (h *AdminHandler) CreateEmotion(w http.ResponseWriter, r *http.Request) {
	var req model.CreateEmotionRequest
	if err := decode(r, &req); err != nil || req.Label == "" {
		writeError(w, http.StatusBadRequest, "label is required")
		return
	}
	emotion, err := h.emotions.Create(r.Context(), req.Label)
	if err != nil {
		writeError(w, http.StatusConflict, "emotion already exists or database error")
		return
	}
	writeJSON(w, http.StatusCreated, emotion)
}

// PUT /api/admin/emotions/{id}
func (h *AdminHandler) UpdateEmotion(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid emotion ID")
		return
	}

	var req model.UpdateEmotionRequest
	if err := decode(r, &req); err != nil || req.Label == "" {
		writeError(w, http.StatusBadRequest, "label is required")
		return
	}

	emotion, err := h.emotions.Update(r.Context(), id, req.Label, req.IsActive)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not update emotion")
		return
	}
	writeJSON(w, http.StatusOK, emotion)
}

// DELETE /api/admin/emotions/{id}
func (h *AdminHandler) DeleteEmotion(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid emotion ID")
		return
	}
	if err := h.emotions.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "could not delete emotion")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
