import api from '@/services/api';

// POST /auth/refreshToken: returns a new accessToken only.
// The refresh token itself is not rotated, so keep the one you have.
export async function refreshAccessToken(refreshToken) {
    const res = await api.post('/auth/refreshToken', { refreshToken });
    return res.data.data.accessToken;
}

// POST /auth/recoverPassword: always returns the same message,
// so the UI never reveals whether an email exists.
export async function recoverPassword(email) {
    const res = await api.post('/auth/recoverPassword', { email });
    return res.data.message;
}

// POST /auth/resetPassword/:resetToken
// Currently returns "Authentication required". See the notes in the reply.
export async function resetPassword(resetToken, { password, confirmPassword }) {
    const res = await api.post(`/auth/resetPassword/${resetToken}`, {
        password,
        confirmPassword,
    });
    return res.data.message;
}

// POST /auth/register
// Currently returns "Authentication required", so do not build a public sign-up page yet.
export async function registerUser(payload) {
    const res = await api.post('/auth/register', payload);
    return res.data;
}
