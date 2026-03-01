package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"backend/captcha"
	_ "backend/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Skystrike Captcha API
// @version         1.0
// @description     This is a captcha service API for Skystrike.
// @host            localhost:8080
// @BasePath        /api

func main() {
	// Wire up the captcha service and handler
	captchaSvc := captcha.NewCaptchaService("my-super-secret-key")
	captchaHandler := captcha.NewCaptchaHandler(captchaSvc)

	router := gin.Default()
	router.Use(cors.Default())

	// Signup module would do the same with its own router group:
	// captchaGroup := signupRouter.Group("/captcha")
	captchaGroup := router.Group("/api/captcha")
	captchaHandler.RegisterRoutes(captchaGroup)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Println("Server starting on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
