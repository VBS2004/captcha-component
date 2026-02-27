# Captcha Component — Frontend

A React + TypeScript captcha widget built with Vite. Talks to the Go backend to generate and verify image-based CAPTCHAs. Designed to be dropped into any module (e.g. a signup form) via a single component and an `onSuccess` callback.

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Captcha.tsx       # The captcha widget component
│   ├── test/
│   │   ├── setup.ts          # Vitest setup (jest-dom matchers)
│   │   ├── captchaHandlers.ts # MSW network interceptors
│   │   └── Captcha.test.tsx  # Component tests (9 tests)
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts            # Vite + Vitest config
├── tsconfig.app.json
└── package.json
```

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Go backend running at `http://localhost:8080` (see `../backend/README.md`)

---

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Using the `<Captcha />` Component

```tsx
import { Captcha } from './components/Captcha';

function SignupForm() {
  const [captchaVerified, setCaptchaVerified] = useState(false);

  return (
    <form>
      {/* ... other fields ... */}
      <Captcha
        onSuccess={() => setCaptchaVerified(true)}
        apiBaseUrl="http://localhost:8080"  // optional, this is the default
      />
      <button disabled={!captchaVerified}>Submit</button>
    </form>
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `onSuccess` | `() => void` | ✅ | — | Called when captcha is verified successfully |
| `apiBaseUrl` | `string` | ❌ | `http://localhost:8080` | Backend base URL |
| `className` | `string` | ❌ | `''` | Extra CSS class on the wrapper |

---

## Running Tests

```bash
npm run test:run   # run once (CI)
npm run test       # watch mode (development)
```

### Test Stack

| Tool | Role |
|---|---|
| [Vitest](https://vitest.dev/) | Test runner (Vite-native, no Jest config needed) |
| [Testing Library](https://testing-library.com/) | Render and query the component |
| [MSW](https://mswjs.io/) | Intercept `fetch` at the network level |

### What's tested

```
✓ initial load — shows loading spinner, then captcha image
✓ initial load — shows error state when backend is down
✓ refresh — clicking refresh button fetches a new captcha
✓ refresh — clicking the image also refreshes
✓ verify success — calls onSuccess, shows confirmed state
✓ verify failure — shows error message on wrong input
✓ verify failure — shows network error on fetch failure
✓ UI state — Verify button disabled when input is empty
✓ props — respects custom apiBaseUrl
```

### Adding a test for a new scenario

Override the default MSW handler inside any test:

```ts
server.use(
  http.post('http://localhost:8080/api/captcha/verify', () => {
    return HttpResponse.json({ success: false, message: 'Expired' }, { status: 401 });
  })
);
// server.resetHandlers() runs automatically after each test
```

---

## Integration in a Modular Monolith

The component accepts an `apiBaseUrl` prop, so each module can point it at its own route group:

```tsx
// Signup module — captcha routes mounted under /signup/captcha
<Captcha
  onSuccess={handleCaptchaVerified}
  apiBaseUrl="http://localhost:8080/signup"
/>
```

The backend's `RegisterRoutes(routerGroup)` mounts to whatever group the signup module passes in.
