# Captcha Component — Backend

A lightweight Go service that generates and verifies image-based CAPTCHAs. Built with [Gin](https://github.com/gin-gonic/gin) and [go-captcha](https://github.com/kal72/go-captcha), designed to be plugged into any modular monolith (e.g. a signup module) as a standalone service.

---

## Project Structure

```
backend/
├── captcha/
│   ├── service.go        # CaptchaService interface + captchaServiceImpl
│   ├── handler.go        # CaptchaHandler — HTTP handlers wired to CaptchaService
│   └── handler_test.go   # Unit tests using MockCaptchaService
├── cmd/
│   └── main.go           # Entry point — wires dependencies and starts server
├── .mockery.yaml         # Mockery config for auto-generating mocks
├── go.mod
└── go.sum
```

---

## Prerequisites

- [Go 1.21+](https://go.dev/dl/)

---

## Running the Server

```bash
cd backend
go run ./cmd/main.go
```

Server starts at `http://localhost:8080`.

---

## API Reference

### `GET /api/captcha/generate`

Generates a new CAPTCHA image and returns a token tied to the answer.

**Response**
```json
{
  "image": "data:image/png;base64,<base64-encoded-png>",
  "token": "<signed-jwt-token>"
}
```

---

### `POST /api/captcha/verify`

Verifies the user's answer against the token.

**Request Body**
```json
{
  "token": "<token from /generate>",
  "text":  "<user's answer>"
}
```

**Success — 200**
```json
{ "success": true, "message": "Captcha verified successfully" }
```

**Wrong answer — 401**
```json
{ "success": false, "message": "Invalid captcha" }
```

**Missing fields — 400**
```json
{ "error": "<validation message>" }
```

---

## Running Tests

```bash
go test ./captcha/... -v
```

All tests use `MockCaptchaService` — no real CAPTCHA image is generated during testing.

---

## Integrating into a Signup Module

The `captcha` package is designed to be imported as a service:

```go
import "backend/captcha"

// In your signup module's dependency wiring:
captchaSvc     := captcha.NewCaptchaService("your-secret-key")
captchaHandler := captcha.NewCaptchaHandler(captchaSvc)

captchaGroup := signupRouter.Group("/captcha")
captchaHandler.RegisterRoutes(captchaGroup)
```

For testing your signup module, mock `captcha.CaptchaService` instead of wiring the real implementation.

---

## Architecture

```
┌─────────────────────────────────────────┐
│              cmd/main.go                │
│  (wires CaptchaService → CaptchaHandler)│
└──────────────────┬──────────────────────┘
                   │ injects
          ┌────────▼────────┐
          │  CaptchaHandler │  ← HTTP layer (handler.go)
          └────────┬────────┘
                   │ depends on interface
          ┌────────▼────────────┐
          │   CaptchaService    │  ← interface (service.go)
          └────────┬────────────┘
                   │ implemented by
          ┌────────▼──────────────┐
          │ captchaServiceImpl    │  ← wraps go-captcha lib
          └───────────────────────┘
```

Dependencies only flow downward through the interface — the handler never imports `go-captcha` directly.
