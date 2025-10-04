'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface AuthFormProps {
    mode?: 'login' | 'register';
    onModeChange?: (mode: 'login' | 'register') => void;
    onSuccess?: () => void;
}

export function AuthForm({ mode = 'login', onModeChange, onSuccess }: AuthFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const { login, register, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (mode === 'register' && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
                toast.success('Welcome back!');
            } else {
                await register(formData.email, formData.password, formData.name);
                toast.success('Account created successfully!');
            }
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Authentication failed');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            toast.success('Welcome!');
            onSuccess?.();
        } catch {
            toast.error('Google login failed');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </CardTitle>
                <p className="text-muted-foreground">
                    {mode === 'login'
                        ? 'Sign in to continue your AI shopping experience'
                        : 'Join us to start exploring with AI assistance'
                    }
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Google Login */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>

                <div className="relative">
                    <Separator />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-muted-foreground">
                        or
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name field for register */}
                    {mode === 'register' && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="pl-10"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required={mode === 'register'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Email field */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className="pl-10 pr-10"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 p-0"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Confirm Password for register */}
                    {mode === 'register' && (
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    className="pl-10"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    required={mode === 'register'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </Button>
                </form>

                {/* Demo Account */}
                {mode === 'login' && (
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                        <p className="font-medium">Demo Account:</p>
                        <p>Email: demo@example.com</p>
                        <p>Password: password</p>
                    </div>
                )}

                {/* Mode Switch */}
                <div className="text-center text-sm">
                    {mode === 'login' ? (
                        <p>
                            Don&apos;t have an account?{' '}
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => onModeChange?.('register')}
                            >
                                Sign up
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => onModeChange?.('login')}
                            >
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}