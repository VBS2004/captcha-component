import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Captcha } from '../components/Captcha';
import { captchaHandlers } from './captchaHandlers';

// ---------------------------------------------------------------------------
// MSW server — intercepts fetch at the network level, no component changes needed
// ---------------------------------------------------------------------------
const server = setupServer(...captchaHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers()); // reset overrides between tests
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Loading & initial state
// ---------------------------------------------------------------------------

describe('CaptchaComponent — initial load', () => {
    it('shows loading state then renders captcha image', async () => {
        render(<Captcha onSuccess={() => { }} />);

        // Loader shown while fetch is in-flight
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // After MSW responds, image appears
        await waitFor(() =>
            expect(screen.getByAltText('captcha')).toBeInTheDocument()
        );
    });

    it('shows error state when generate endpoint fails', async () => {
        // Override the default handler with a network error
        server.use(
            http.get('http://localhost:8080/api/captcha/generate', () => {
                return HttpResponse.error();
            })
        );

        render(<Captcha onSuccess={() => { }} />);

        await waitFor(() =>
            expect(screen.getByText('Failed to load')).toBeInTheDocument()
        );
    });
});

// ---------------------------------------------------------------------------
// Refresh behaviour
// ---------------------------------------------------------------------------

describe('CaptchaComponent — refresh', () => {
    it('clicking the refresh button fetches a new captcha', async () => {
        const user = userEvent.setup();
        render(<Captcha onSuccess={() => { }} />);

        await waitFor(() => screen.getByAltText('captcha'));

        // Click the refresh button — MSW intercepts the second fetch
        await user.click(screen.getByTitle('Refresh Captcha'));

        // Image should still be present after refresh
        await waitFor(() =>
            expect(screen.getByAltText('captcha')).toBeInTheDocument()
        );
    });

    it('clicking the captcha image also refreshes', async () => {
        const user = userEvent.setup();
        render(<Captcha onSuccess={() => { }} />);

        await waitFor(() => screen.getByAltText('captcha'));
        await user.click(screen.getByAltText('captcha'));

        await waitFor(() =>
            expect(screen.getByAltText('captcha')).toBeInTheDocument()
        );
    });
});

// ---------------------------------------------------------------------------
// Verify — success
// ---------------------------------------------------------------------------

describe('CaptchaComponent — successful verification', () => {
    it('calls onSuccess and shows the verified state', async () => {
        const user = userEvent.setup();
        const onSuccess = vi.fn();

        render(<Captcha onSuccess={onSuccess} />);
        await waitFor(() => screen.getByAltText('captcha'));

        await user.type(screen.getByPlaceholderText('Enter the code'), 'AB12');
        await user.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledOnce();
            expect(screen.getByText('Captcha Verified Successfully')).toBeInTheDocument();
        });
    });
});

// ---------------------------------------------------------------------------
// Verify — failure cases
// ---------------------------------------------------------------------------

describe('CaptchaComponent — failed verification', () => {
    it('shows error message when captcha text is wrong', async () => {
        const user = userEvent.setup();

        // Override verify to return 401
        server.use(
            http.post('http://localhost:8080/api/captcha/verify', () => {
                return HttpResponse.json(
                    { success: false, message: 'Invalid captcha' },
                    { status: 401 }
                );
            })
        );

        render(<Captcha onSuccess={() => { }} />);
        await waitFor(() => screen.getByAltText('captcha'));

        await user.type(screen.getByPlaceholderText('Enter the code'), 'WRONG');
        await user.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() =>
            expect(screen.getByText('Invalid captcha')).toBeInTheDocument()
        );
    });

    it('shows network error message when verify fetch fails', async () => {
        const user = userEvent.setup();

        server.use(
            http.post('http://localhost:8080/api/captcha/verify', () => {
                return HttpResponse.error();
            })
        );

        render(<Captcha onSuccess={() => { }} />);
        await waitFor(() => screen.getByAltText('captcha'));

        await user.type(screen.getByPlaceholderText('Enter the code'), 'ABC');
        await user.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() =>
            expect(screen.getByText('Network error during verification.')).toBeInTheDocument()
        );
    });
});

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------

describe('CaptchaComponent — UI state', () => {
    it('Verify button is disabled when input is empty', async () => {
        render(<Captcha onSuccess={() => { }} />);
        await waitFor(() => screen.getByAltText('captcha'));

        expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
    });

    it('respects custom apiBaseUrl prop', async () => {
        const customBase = 'http://my-monolith.internal';

        server.use(
            http.get(`${customBase}/api/captcha/generate`, () => {
                return HttpResponse.json({
                    image: 'data:image/png;base64,custom',
                    token: 'custom-token',
                });
            })
        );

        render(<Captcha onSuccess={() => { }} apiBaseUrl={customBase} />);

        await waitFor(() =>
            expect(screen.getByAltText('captcha')).toBeInTheDocument()
        );
    });
});
