package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	JWTExpiry      time.Duration
	ServerPort     string
	AllowedOrigins string
	Env            string
}

func Load() (*Config, error) {
	jwtExpiryHours, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRY_HOURS: %w", err)
	}

	return &Config{
		DatabaseURL:    mustEnv("DATABASE_URL"),
		JWTSecret:      mustEnv("JWT_SECRET"),
		JWTExpiry:      time.Duration(jwtExpiryHours) * time.Hour,
		ServerPort:     getEnv("SERVER_PORT", "8080"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		Env:            getEnv("APP_ENV", "development"),
	}, nil
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
