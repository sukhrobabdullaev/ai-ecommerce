'use client';

import { useState } from 'react';
import { LoginForm } from '../../components/auth/login-form';
import { RegisterForm } from '../../components/auth/register-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {mode === 'login'
                            ? 'Welcome back! Please sign in to continue.'
                            : 'Join us today! Create your account to get started.'
                        }
                    </p>
                </div>

                <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'register')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="register">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <LoginForm onSuccess={() => window.location.href = '/'} />
                    </TabsContent>

                    <TabsContent value="register">
                        <RegisterForm onSuccess={() => window.location.href = '/'} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
