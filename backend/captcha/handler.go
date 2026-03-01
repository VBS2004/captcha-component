package captcha

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CaptchaVerifyRequest is the JSON payload for the verify endpoint
type CaptchaVerifyRequest struct {
	Token string `json:"token" binding:"required"`
	Text  string `json:"text" binding:"required"`
}

// CaptchaHandler holds the HTTP handlers for the captcha routes.
// It depends on CaptchaService — never on the concrete implementation.
type CaptchaHandler struct {
	captchaSvc CaptchaService
}

// NewCaptchaHandler creates a new CaptchaHandler with the CaptchaService injected.
// The signup module (or cmd/main.go) calls this during wiring.
func NewCaptchaHandler(captchaSvc CaptchaService) *CaptchaHandler {
	return &CaptchaHandler{captchaSvc: captchaSvc}
}

// RegisterRoutes attaches the captcha routes to a given router group.
// The signup module can call this with its own router group:
//
//	captchaGroup := signupRouter.Group("/captcha")
//	captchaHandler.RegisterRoutes(captchaGroup)
func (h *CaptchaHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/generate", h.generate)
	rg.POST("/verify", h.verify)
}

// @Summary      Generate Captcha
// @Description  Generates a new base64 captcha image and a corresponding token
// @Tags         captcha
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /captcha/generate [get]
func (h *CaptchaHandler) generate(c *gin.Context) {
	base64Image, _, token, err := h.captchaSvc.Generate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate captcha"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"image": base64Image,
		"token": token,
	})
}

// @Summary      Verify Captcha
// @Description  Verifies if the provided captcha text matches the token
// @Tags         captcha
// @Accept       json
// @Produce      json
// @Param        request body CaptchaVerifyRequest true "Captcha verification payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Router       /captcha/verify [post]
func (h *CaptchaHandler) verify(c *gin.Context) {
	var req CaptchaVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.captchaSvc.Verify(req.Text, req.Token); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid captcha"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Captcha verified successfully"})
}
