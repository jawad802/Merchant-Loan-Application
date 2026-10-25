import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import API from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await API.post('/auth/login', { username, password });
            const result = data?.data || {};

            if (!result.accessToken) {
                setError('Login succeeded but no access token was returned.');
                return;
            }

            localStorage.setItem('accessToken', result.accessToken);
            localStorage.setItem('csrfToken', result.csrfToken || '');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const serverText =
                typeof err.response?.data === 'string'
                    ? err.response.data
                    : err.response?.data?.error || err.response?.data?.message;

            const message =
                serverText ||
                (err.response ? `Request failed (${err.response.status}).` : 'Cannot reach the server. Check your connection and VPN.');

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <Card className="w-full max-w-md shadow-md">
                <CardHeader className="space-y-1 text-center pb-6 border-b border-border">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm">
                        M
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Merchant Portal</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Sign in to manage merchants and loan applications
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleLogin} className="space-y-10">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2 cursor-pointer">
                            <label htmlFor='Email/Username' className="text-base font-medium text-foreground">Email / Username</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                                className="focus-visible:ring-blue-500 mt-3 rounded-md"
                            />
                        </div>

                        <div className="space-y-2 cursor-pointer">
                            <label htmlFor='Password' className="text-base font-medium text-foreground">Password</label>
                            <div className="relative mt-2">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="focus-visible:ring-blue-500 rounded-md mt-2 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 cursor-pointer right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 text-base font-medium cursor-pointer"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
