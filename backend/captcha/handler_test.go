package captcha

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// ---------------------------------------------------------------------------
// MockCaptchaService — hand-rolled mock implementing CaptchaService
// In the modular monolith, replace this with a Mockery-generated mock
// once the package is not package main (Mockery works fine here now).
// ---------------------------------------------------------------------------

type MockCaptchaService struct {
	GenerateFunc func() (string, string, string, error)
	VerifyFunc   func(text, token string) error
}

func (m *MockCaptchaService) Generate() (string, string, string, error) {
	return m.GenerateFunc()
}

func (m *MockCaptchaService) Verify(text, token string) error {
	return m.VerifyFunc(text, token)
}

// ---------------------------------------------------------------------------
// Test helper — builds a test router with mock injected
// ---------------------------------------------------------------------------

func newTestCaptchaRouter(captchaSvc CaptchaService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	captchaHandler := NewCaptchaHandler(captchaSvc)
	captchaGroup := router.Group("/api/captcha")
	captchaHandler.RegisterRoutes(captchaGroup)
	return router
}

// ---------------------------------------------------------------------------
// GET /api/captcha/generate
// ---------------------------------------------------------------------------

func TestCaptchaGenerate_Success(t *testing.T) {
	mockCaptchaSvc := &MockCaptchaService{
		GenerateFunc: func() (string, string, string, error) {
			return "data:image/png;base64,abc123", "AB12", "tok-xyz", nil
		},
	}

	router := newTestCaptchaRouter(mockCaptchaSvc)

	req, _ := http.NewRequest(http.MethodGet, "/api/captcha/generate", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)

	if body["image"] == "" {
		t.Error("expected image in response")
	}
	if body["token"] != "tok-xyz" {
		t.Errorf("expected token 'tok-xyz', got '%s'", body["token"])
	}
}

func TestCaptchaGenerate_ServiceError(t *testing.T) {
	mockCaptchaSvc := &MockCaptchaService{
		GenerateFunc: func() (string, string, string, error) {
			return "", "", "", errors.New("captcha generation failed")
		},
	}

	router := newTestCaptchaRouter(mockCaptchaSvc)

	req, _ := http.NewRequest(http.MethodGet, "/api/captcha/generate", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// POST /api/captcha/verify
// ---------------------------------------------------------------------------

func TestCaptchaVerify_Success(t *testing.T) {
	mockCaptchaSvc := &MockCaptchaService{
		GenerateFunc: func() (string, string, string, error) { return "", "", "", nil },
		VerifyFunc: func(text, token string) error {
			// Assert the handler passes the values correctly
			if text != "AB12" || token != "tok-xyz" {
				t.Errorf("unexpected verify args: text=%s token=%s", text, token)
			}
			return nil
		},
	}

	router := newTestCaptchaRouter(mockCaptchaSvc)

	payload := CaptchaVerifyRequest{Token: "tok-xyz", Text: "AB12"}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "/api/captcha/verify", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp["success"] != true {
		t.Error("expected success: true")
	}
}

func TestCaptchaVerify_WrongText(t *testing.T) {
	mockCaptchaSvc := &MockCaptchaService{
		VerifyFunc: func(text, token string) error {
			return errors.New("captcha mismatch")
		},
	}

	router := newTestCaptchaRouter(mockCaptchaSvc)

	payload := CaptchaVerifyRequest{Token: "tok-xyz", Text: "WRONG"}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "/api/captcha/verify", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestCaptchaVerify_MissingFields(t *testing.T) {
	mockCaptchaSvc := &MockCaptchaService{}
	router := newTestCaptchaRouter(mockCaptchaSvc)

	// Only sending token, missing required 'text' field
	body := bytes.NewBufferString(`{"token":"tok-xyz"}`)
	req, _ := http.NewRequest(http.MethodPost, "/api/captcha/verify", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}
