'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

export default function SignInPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-scale-in">
            {/* Logo / Brand */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-primary mb-6">
                    <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
                <p className="text-muted-foreground mt-2">Sign in to continue writing</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive text-sm font-mono animate-slide-up">
                    [ERROR] {error}
                </div>
            )}

            {/* Sign in form */}
            <form onSubmit={handleSignIn} className="space-y-4">
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
                    <Link href="/sign-up">
                        <Button type="button" variant="secondary" className="h-14 px-6">
                            Sign Up
                        </Button>
                    </Link>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
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
                    <Button type="submit" isLoading={isLoading} className="h-14 px-8">
                        Sign In
                    </Button>
                </div>
            </form>

            {/* Forgot password link */}
            <div className="mt-6 text-center">
                <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    Forgot your password?
                </Link>
            </div>
        </div>
    );
}
