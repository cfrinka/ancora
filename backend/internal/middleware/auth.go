package middleware

import (
	"context"
	"net/http"

	"github.com/ontherapy/backend/internal/auth"
	"github.com/ontherapy/backend/internal/model"
)

type contextKey string

const (
	ContextKeyClaims contextKey = "claims"
)

func Authenticate(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("auth_token")
			if err != nil {
				writeUnauthorized(w)
				return
			}

			claims, err := auth.ValidateToken(cookie.Value, jwtSecret)
			if err != nil {
				writeUnauthorized(w)
				return
			}

			ctx := context.WithValue(r.Context(), ContextKeyClaims, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ClaimsFromCtx(r.Context())
			if claims == nil {
				writeUnauthorized(w)
				return
			}
			if _, ok := allowed[claims.Role]; !ok {
				writeForbidden(w)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func ClaimsFromCtx(ctx context.Context) *auth.Claims {
	c, _ := ctx.Value(ContextKeyClaims).(*auth.Claims)
	return c
}

func writeUnauthorized(w http.ResponseWriter) {
	http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
}

func writeForbidden(w http.ResponseWriter) {
	http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
}

// RequireAdmin is a convenience alias.
func RequireAdmin() func(http.Handler) http.Handler {
	return RequireRole(model.RoleAdmin)
}

// RequireTherapist allows therapists only.
func RequireTherapist() func(http.Handler) http.Handler {
	return RequireRole(model.RoleTherapist)
}

// RequirePatient allows patients only.
func RequirePatient() func(http.Handler) http.Handler {
	return RequireRole(model.RolePatient)
}
