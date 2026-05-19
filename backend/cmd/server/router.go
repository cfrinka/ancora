package main

import (
	"net/http"

	"github.com/ancora/backend/internal/config"
	"github.com/ancora/backend/internal/handler"
	mw "github.com/ancora/backend/internal/middleware"
	"github.com/ancora/backend/internal/model"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func buildRouter(
	cfg *config.Config,
	authH *handler.AuthHandler,
	postH *handler.PostHandler,
	emotionH *handler.EmotionHandler,
	therapistH *handler.TherapistHandler,
	adminH *handler.AdminHandler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigins},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
	}))

	// Public
	r.Post("/api/auth/login", authH.Login)
	r.Post("/api/auth/register", authH.Register)
	r.Get("/api/auth/therapists", authH.ListTherapistsPublic)

	// Authenticated
	r.Group(func(r chi.Router) {
		r.Use(mw.Authenticate(cfg.JWTSecret))

		r.Post("/api/auth/logout", authH.Logout)
		r.Get("/api/auth/me", authH.Me)

		// Active emotions list (patients need this to create posts)
		r.Get("/api/emotions", emotionH.ListActive)

		// --- Patient routes ---
		r.Group(func(r chi.Router) {
			r.Use(mw.RequireRole(model.RolePatient))
			r.Get("/api/patient/posts", postH.PatientFeed)
			r.Post("/api/patient/posts", postH.CreatePost)
		})

		// --- Therapist routes ---
		r.Group(func(r chi.Router) {
			r.Use(mw.RequireRole(model.RoleTherapist))
			r.Get("/api/therapist/feed", postH.TherapistFeed)
			r.Get("/api/therapist/patients", therapistH.ListMyPatients)
		})

		// --- Admin routes ---
		r.Group(func(r chi.Router) {
			r.Use(mw.RequireRole(model.RoleAdmin))
			r.Get("/api/admin/therapists", adminH.ListTherapists)
			r.Post("/api/admin/therapists", adminH.CreateTherapist)
			r.Get("/api/admin/patients", adminH.ListPatients)
			r.Put("/api/admin/patients/{patientID}/assign", adminH.AssignPatient)
			r.Get("/api/admin/emotions", adminH.ListEmotions)
			r.Post("/api/admin/emotions", adminH.CreateEmotion)
			r.Put("/api/admin/emotions/{id}", adminH.UpdateEmotion)
			r.Delete("/api/admin/emotions/{id}", adminH.DeleteEmotion)
		})
	})

	return r
}
