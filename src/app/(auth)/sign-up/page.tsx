'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

export default function SignUpPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="animate-scale-in text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-success mb-6">
                    <BookOpen className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Check Your Email</h1>
                <p className="text-muted-foreground mt-4 max-w-sm mx-auto">
                    We&apos;ve sent a confirmation link to <span className="text-foreground">{email}</span>.
                    Click the link to activate your account.
                </p>
                <Link href="/sign-in">
                    <Button variant="secondary" className="mt-8">
                        Back to Sign In
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-scale-in">
            {/* Logo / Brand */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-primary mb-6">
                    <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
                <p className="text-muted-foreground mt-2">Start your writing journey</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive text-sm font-mono animate-slide-up">
                    [ERROR] {error}
                </div>
            )}

            {/* Sign up form */}
            <form onSubmit={handleSignUp} className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-14 text-center"
                        />
                    </div>
                    <Link href="/sign-in">
                        <Button type="button" variant="secondary" className="h-14 px-6">
                            Sign In
                        </Button>
                    </Link>
                </div>

                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-14 text-center pr-12"
                        style={{
                            letterSpacing: showPassword ? 'normal' : '0.3em',
                            fontSize: showPassword ? '1rem' : '1.25rem',
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-14 text-center"
                    style={{
                        letterSpacing: showPassword ? 'normal' : '0.3em',
                        fontSize: showPassword ? '1rem' : '1.25rem',
                    }}
                />

                <Button type="submit" isLoading={isLoading} className="w-full h-14">
                    Create Account
                </Button>
            </form>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}
