package handler

import (
	"net/http"
	"time"

	"github.com/ancora/backend/internal/auth"
	"github.com/ancora/backend/internal/config"
	mw "github.com/ancora/backend/internal/middleware"
	"github.com/ancora/backend/internal/model"
	"github.com/ancora/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	users *repository.UserRepository
	cfg   *config.Config
}

func NewAuthHandler(users *repository.UserRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{users: users, cfg: cfg}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.users.FindByEmail(r.Context(), req.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.RoleName, h.cfg.JWTSecret, h.cfg.JWTExpiry)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not generate token")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		HttpOnly: true,
		Secure:   h.cfg.Env == "production",
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.cfg.JWTExpiry),
	})

	writeJSON(w, http.StatusOK, model.AuthResponse{User: user})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.FullName == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email, full_name and password are required")
		return
	}
	if req.Role != model.RoleTherapist && req.Role != model.RolePatient {
		writeError(w, http.StatusBadRequest, "role must be 'therapist' or 'patient'")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	var user *model.User
	if req.Role == model.RoleTherapist {
		user, err = h.users.CreateTherapist(r.Context(), req.Email, string(hash), req.FullName)
	} else {
		user, err = h.users.CreatePatient(r.Context(), req.Email, string(hash), req.FullName, req.TherapistID)
	}
	if err != nil {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.RoleName, h.cfg.JWTSecret, h.cfg.JWTExpiry)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not generate token")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		HttpOnly: true,
		Secure:   h.cfg.Env == "production",
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(h.cfg.JWTExpiry),
	})

	writeJSON(w, http.StatusCreated, model.AuthResponse{User: user})
}

func (h *AuthHandler) ListTherapistsPublic(w http.ResponseWriter, r *http.Request) {
	list, err := h.users.ListTherapistsPublic(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not fetch therapists")
		return
	}
	if list == nil {
		list = []model.PublicTherapist{}
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		HttpOnly: true,
		Secure:   h.cfg.Env == "production",
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   -1,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromRequest(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	user, err := h.users.FindByID(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, model.AuthResponse{User: user})
}

func claimsFromRequest(r *http.Request) *auth.Claims {
	return mw.ClaimsFromCtx(r.Context())
}
