package captcha

import lib "github.com/kal72/go-captcha"

// CaptchaService defines the contract for generating and verifying captchas.
// Any module (e.g. signup) imports this interface, never the concrete lib.
// Mockery reads this file and auto-generates a mock from it.
type CaptchaService interface {
	Generate() (base64Image string, text string, token string, err error)
	Verify(text, token string) error
}

// captchaServiceImpl is the real production implementation wrapping go-captcha.
// We store the instance via closures to avoid exposing the unexported lib type.
type captchaServiceImpl struct {
	generate func() (string, string, string, error)
	verify   func(text, token string) error
}

// NewCaptchaService creates a production-ready CaptchaService.
// The signup module calls this in its dependency wiring.
func NewCaptchaService(secretKey string) CaptchaService {
	cap := lib.New(secretKey)
	return &captchaServiceImpl{
		generate: func() (string, string, string, error) {
			return cap.Generate()
		},
		verify: func(text, token string) error {
			return cap.Verify(text, token)
		},
	}
}

func (s *captchaServiceImpl) Generate() (string, string, string, error) {
	return s.generate()
}

func (s *captchaServiceImpl) Verify(text, token string) error {
	return s.verify(text, token)
}
