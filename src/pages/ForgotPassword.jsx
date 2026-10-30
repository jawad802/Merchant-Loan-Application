import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { recoverPassword } from '@/services/authService';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
            setMessage(await recoverPassword(email.trim()));
        } catch (err) {
            setError(err?.response?.data?.error || 'Could not send the reset email. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader>
                    <CardTitle>Forgot password</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Enter your email and we'll send you a reset link.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message ? (
                        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                            {message}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block text-sm font-medium">
                                Email
                                <Input
                                    className="mt-1"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </label>
                            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                            <Button
                                type="submit"
                                disabled={busy || !email.trim()}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {busy ? 'Sending…' : 'Send reset link'}
                            </Button>
                        </form>
                    )}
                    <Link to="/login" className="block text-center text-sm text-blue-600 hover:underline dark:text-blue-400">
                        Back to sign in
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

