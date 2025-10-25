'use client';

import { useState } from 'react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'login' | 'register';
}

export const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) => {
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

    const handleSuccess = () => {
        onClose();
    };

    const switchToRegister = () => {
        setMode('register');
    };

    const switchToLogin = () => {
        setMode('login');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </DialogTitle>
                </DialogHeader>

                {mode === 'login' ? (
                    <LoginForm
                        onSuccess={handleSuccess}
                        onSwitchToRegister={switchToRegister}
                    />
                ) : (
                    <RegisterForm
                        onSuccess={handleSuccess}
                        onSwitchToLogin={switchToLogin}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
