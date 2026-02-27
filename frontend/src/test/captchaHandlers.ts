import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8080';

/**
 * MSW handlers that intercept real fetch calls at the network level.
 * These are the "happy path" defaults — individual tests can override
 * them to simulate error states.
 */
export const captchaHandlers = [
    // GET /api/captcha/generate — returns a fake base64 image + token
    http.get(`${BASE}/api/captcha/generate`, () => {
        return HttpResponse.json({
            image: 'data:image/png;base64,fakeImageData',
            token: 'test-captcha-token',
        });
    }),

    // POST /api/captcha/verify — succeeds for any input by default
    http.post(`${BASE}/api/captcha/verify`, () => {
        return HttpResponse.json(
            { success: true, message: 'Captcha verified successfully' },
            { status: 200 }
        );
    }),
];
