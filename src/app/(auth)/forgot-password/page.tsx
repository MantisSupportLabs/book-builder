'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
                    We&apos;ve sent a password reset link to <span className="text-foreground">{email}</span>.
                    Click the link to reset your password.
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
            {/* Back link */}
            <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
            </Link>

            {/* Logo / Brand */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-primary mb-6">
                    <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
                <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive text-sm font-mono animate-slide-up">
                    [ERROR] {error}
                </div>
            )}

            {/* Reset form */}
            <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-14 text-center"
                />

                <Button type="submit" isLoading={isLoading} className="w-full h-14">
                    Send Reset Link
                </Button>
            </form>
        </div>
    );
}
