package captcha

import (
	"testing"
)

// These tests use the REAL captchaServiceImpl (no mock).
// go-captcha runs locally — no network, no DB — so using the real
// implementation here is correct. We're verifying our wrapper works.

func TestCaptchaServiceImpl_Generate_ReturnsImageAndToken(t *testing.T) {
	svc := NewCaptchaService("test-secret-key")

	image, text, token, err := svc.Generate()

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if image == "" {
		t.Error("expected base64 image, got empty string")
	}
	if text == "" {
		t.Error("expected captcha text, got empty string")
	}
	if token == "" {
		t.Error("expected signed token, got empty string")
	}
}

func TestCaptchaServiceImpl_Verify_CorrectText(t *testing.T) {
	svc := NewCaptchaService("test-secret-key")

	_, text, token, err := svc.Generate()
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	// Use the real text returned from Generate to verify correctly
	if err := svc.Verify(text, token); err != nil {
		t.Errorf("expected verify to pass with correct text, got: %v", err)
	}
}

func TestCaptchaServiceImpl_Verify_WrongText(t *testing.T) {
	svc := NewCaptchaService("test-secret-key")

	_, _, token, err := svc.Generate()
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	// Wrong text must fail
	if err := svc.Verify("DEFINITELYWRONG", token); err == nil {
		t.Error("expected error for wrong captcha text, got nil")
	}
}

func TestCaptchaServiceImpl_Verify_TamperedToken(t *testing.T) {
	svc := NewCaptchaService("test-secret-key")

	// A tampered or random token must fail regardless of text
	if err := svc.Verify("anything", "fake.tampered.token"); err == nil {
		t.Error("expected error for tampered token, got nil")
	}
}

func TestCaptchaServiceImpl_Verify_EmptyToken(t *testing.T) {
	svc := NewCaptchaService("test-secret-key")

	if err := svc.Verify("AB12", ""); err == nil {
		t.Error("expected error for empty token, got nil")
	}
}

func TestCaptchaServiceImpl_DifferentSecretKeys_TokenNotInterchangeable(t *testing.T) {
	svc1 := NewCaptchaService("secret-one")
	svc2 := NewCaptchaService("secret-two")

	_, text, token, err := svc1.Generate()
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	// Token signed by svc1 must not verify against svc2
	if err := svc2.Verify(text, token); err == nil {
		t.Error("expected error: token from a different secret should not verify")
	}
}
