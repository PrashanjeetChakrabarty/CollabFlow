import React, { useState } from 'react';
import type { FirebaseError } from 'firebase/app';
import { Mail, Lock, Loader2, Orbit } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { motion } from 'framer-motion';

export const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthErrorMessage = (err: FirebaseError) => {
        if (err.code === 'auth/invalid-credential') {
            return 'Invalid email or password.';
        }
        if (err.code === 'auth/email-already-in-use') {
            return 'An account with this email already exists.';
        }
        if (err.code === 'auth/weak-password') {
            return 'Password should be at least 6 characters.';
        }
        if (err.code === 'auth/configuration-not-found') {
            return 'Google Sign-In is not enabled in Firebase. Please enable it in the Firebase Console under Build > Authentication.';
        }
        if (err.code === 'auth/popup-closed-by-user') {
            return '';
        }
        return err.message || 'An error occurred during authentication.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            const authError = err as FirebaseError;
            console.error('Auth error:', err);
            setError(getAuthErrorMessage(authError));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            const authError = err as FirebaseError;
            console.error('Google Auth error:', err);
            const message = getAuthErrorMessage(authError);
            setError(message || null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen bg-obsidian flex items-center justify-center relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-electric-violet/10 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
            </div>

            {/* Left Side: 3D Tech Man */}
            <motion.div
                initial={{ x: '-100vw', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 60, duration: 1 }}
                className="absolute left-0 bottom-0 top-0 w-1/3 z-10 hidden xl:flex flex-col items-center justify-center pointer-events-none"
            >
                <div className="absolute top-20 left-20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-electric-violet/20 flex items-center justify-center border border-electric-violet/30 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                        <Orbit className="w-7 h-7 text-electric-violet animate-[spin_10s_linear_infinite]" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Collab<span className="text-electric-violet text-glow">Flow</span>
                    </h1>
                </div>

                <motion.div
                    className="relative w-64 h-64 mt-32 bg-electric-violet/5 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.2)] glass-panel overflow-hidden"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="p-6">
                        <div className="flex gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-2 bg-slate-700/50 rounded w-3/4"></div>
                            <div className="h-2 bg-slate-700/50 rounded w-full"></div>
                            <div className="h-2 bg-slate-700/50 rounded w-5/6"></div>
                            <div className="h-2 bg-electric-violet/50 rounded w-1/2 mt-8"></div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Center: Auth Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: "spring", bounce: 0.4 }}
                className="glass-panel w-full max-w-md p-8 relative overflow-hidden z-20 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-white/10 styling-3d-panel mx-4"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-electric-violet/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />

                {/* Mobile/Tablet Logo (hidden on XL where it's on the left) */}
                <div className="flex xl:hidden items-center gap-3 mb-8 justify-center">
                    <div className="w-10 h-10 rounded-xl bg-electric-violet/20 flex items-center justify-center border border-electric-violet/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Orbit className="w-6 h-6 text-electric-violet animate-[spin_10s_linear_infinite]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Collab<span className="text-electric-violet text-glow">Flow</span>
                    </h1>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 text-center xl:text-left">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-slate-400 text-sm mb-6 text-center xl:text-left">
                    {isLogin
                        ? 'Enter your credentials to access your workspace.'
                        : 'Sign up to start collaborating with your team.'}
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block ml-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-electric-violet/50 focus:border-electric-violet transition-all group-hover:border-slate-500"
                                placeholder="you@example.com"
                            />
                            <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-electric-violet transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block ml-1">
                            Password
                        </label>
                        <div className="relative group">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-electric-violet/50 focus:border-electric-violet transition-all group-hover:border-slate-500"
                                placeholder="••••••••"
                            />
                            <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-electric-violet transition-colors" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-8 bg-electric-violet hover:bg-purple-500 text-white font-semibold py-3 flex justify-center items-center gap-2 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all disabled:opacity-50 neon-pulse"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isLogin ? 'Sign In' : 'Sign Up'
                        )}
                    </button>

                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-slate-700/50"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-wider">Or continue with</span>
                        <div className="flex-grow border-t border-slate-700/50"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex justify-center items-center gap-3 py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-electric-violet hover:text-purple-400 font-semibold transition-colors underline decoration-transparent hover:decoration-electric-violet underline-offset-4"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </motion.div>

            {/* Right Side: 3D Laptop & Notifications */}
            <motion.div
                initial={{ x: '100vw', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 60, duration: 1.2, delay: 0.2 }}
                className="absolute right-0 bottom-0 top-0 w-1/3 z-10 hidden lg:flex items-center justify-center pointer-events-none"
            >
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                    {/* Floating Kanban Card 1 */}
                    <motion.div
                        className="glass-panel w-72 p-5 border-electric-violet/30 shadow-[0_15px_30px_rgba(139,92,246,0.15)] relative translate-x-12"
                        animate={{ y: [0, 20, 0] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">In Progress</span>
                            <div className="w-6 h-6 rounded-full bg-slate-700"></div>
                        </div>
                        <h4 className="font-medium text-white mb-2">Design Login Screen</h4>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-electric-violet w-2/3"></div>
                        </div>
                    </motion.div>

                    {/* Floating Kanban Card 2 */}
                    <motion.div
                        className="glass-panel w-72 p-5 border-emerald-500/30 shadow-[0_15px_30px_rgba(16,185,129,0.15)] relative -translate-x-8"
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-md">Done</span>
                            <div className="w-6 h-6 rounded-full bg-slate-700"></div>
                        </div>
                        <h4 className="font-medium text-white mb-2">Setup Firebase Auth</h4>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-full"></div>
                        </div>
                    </motion.div>

                    {/* Notification Bubble */}
                    <motion.div
                        className="absolute right-1/4 top-1/3 glass-panel px-4 py-2 flex items-center gap-3 border-amber-500/30 shadow-[0_10px_20px_rgba(245,158,11,0.15)]"
                        initial={{ opacity: 0, scale: 0, y: 50 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1, 0.9], y: [50, -20, -30, -50] }}
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "easeOut", delay: 1 }}
                    >
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                        <span className="text-sm font-medium text-amber-100">Task Assigned</span>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};
