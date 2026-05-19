package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ancora/backend/internal/config"
	"github.com/ancora/backend/internal/handler"
	"github.com/ancora/backend/internal/repository"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	ctx := context.Background()
	pool, err := repository.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db error: %v", err)
	}
	defer pool.Close()

	// Repositories
	userRepo := repository.NewUserRepository(pool)
	postRepo := repository.NewPostRepository(pool)
	emotionRepo := repository.NewEmotionRepository(pool)

	// Handlers
	authH := handler.NewAuthHandler(userRepo, cfg)
	postH := handler.NewPostHandler(postRepo)
	emotionH := handler.NewEmotionHandler(emotionRepo)
	therapistH := handler.NewTherapistHandler(userRepo)
	adminH := handler.NewAdminHandler(userRepo, emotionRepo)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.ServerPort),
		Handler:      buildRouter(cfg, authH, postH, emotionH, therapistH, adminH),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("server listening on :%s", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown error: %v", err)
	}
	log.Println("server stopped")
}
