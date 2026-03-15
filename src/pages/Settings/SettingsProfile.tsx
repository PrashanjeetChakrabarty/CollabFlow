import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { rtdb, auth } from '../../lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { supabase } from '../../lib/supabase';
import { get, onValue, push, ref as dbRef, remove, set } from 'firebase/database';
import { Camera, Server, Activity, ArrowUpCircle, LogOut } from 'lucide-react';

export default function SettingsProfile() {
    const { userName, setUserName, userAvatar, setUserAvatar, currentUser } = useAppStore();

    // Local Form state
    const [nameInput, setNameInput] = useState(userName);
    const [isUploading, setIsUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    // System Health
    const [ping, setPing] = useState<number>(0);
    const [pingHistory, setPingHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
    const [isConnected, setIsConnected] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setNameInput(userName);
    }, [userName]);

    // Measure RTDB Ping Latency with a round trip write/read
    useEffect(() => {
        let cancelled = false;
        const connectionRef = dbRef(rtdb, '.info/connected');
        const cleanupPathRef = dbRef(rtdb, `healthchecks/${currentUser?.uid ?? 'guest'}`);

        const updatePingHistory = (value: number) => {
            setPing(value);
            setPingHistory((prev) => [...prev.slice(-7), value]);
        };

        const measurePing = async () => {
            const entryRef = push(cleanupPathRef);
            const start = performance.now();

            try {
                await set(entryRef, { clientTs: Date.now() });
                await get(entryRef);

                if (!cancelled) {
                    updatePingHistory(Math.round(performance.now() - start));
                }
            } catch (error) {
                console.error('Failed to measure realtime database latency:', error);
                if (!cancelled) {
                    updatePingHistory(0);
                }
            } finally {
                remove(entryRef).catch(() => undefined);
            }
        };

        const unsubscribe = onValue(connectionRef, (snapshot) => {
            const connected = snapshot.val() === true;
            setIsConnected(connected);

            if (connected) {
                void measurePing();
            } else {
                updatePingHistory(0);
            }
        });

        const interval = setInterval(() => {
            if (!cancelled && isConnected) {
                void measurePing();
            }
        }, 15000);

        return () => {
            cancelled = true;
            unsubscribe();
            clearInterval(interval);
        };
    }, [currentUser?.uid, isConnected]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            await updateProfile(currentUser, {
                displayName: nameInput.trim() || currentUser.displayName || 'Guest User',
                photoURL: userAvatar ?? currentUser.photoURL ?? null,
            });
            setUserName(nameInput.trim() || 'Guest User');
            setSaveStatus('Profile updated successfully!');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Failed to save profile:', error);
            setSaveStatus('Unable to save profile right now.');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `user_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setUserAvatar(publicUrlData.publicUrl);
            if (currentUser) {
                await updateProfile(currentUser, {
                    displayName: nameInput.trim() || currentUser.displayName || 'Guest User',
                    photoURL: publicUrlData.publicUrl,
                });
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload image. Check console for details.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex-1 w-full h-full p-4 md:p-8 flex flex-col md:flex-row gap-8 overflow-y-auto">

            {/* Left Column - Profile Settings */}
            <div className="flex-1 max-w-xl">
                <h1 className="text-3xl font-bold text-white text-glow mb-2">Settings</h1>
                <p className="text-slate-400 mb-8">Manage your personal profile and preferences.</p>

                <div className="glass-panel p-6 md:p-8 mb-8 border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Camera className="w-48 h-48" />
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-6 relative z-10">Profile Settings</h2>

                    <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="w-32 h-32 rounded-full border-2 border-dashed border-electric-violet/50 flex items-center justify-center bg-black/40 overflow-hidden relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {userAvatar ? (
                                    <>
                                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white mb-1" />
                                            <span className="text-xs text-white font-medium">Change</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Camera className="w-8 h-8 text-electric-violet mx-auto mb-2 opacity-50" />
                                        <span className="text-xs text-slate-400 text-center">Click to upload</span>
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-electric-violet border-t-transparent flex-shrink-0 animate-spin rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Profile Form */}
                        <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email (Read Only)</label>
                                <input
                                    type="email"
                                    value={currentUser?.email || "collaborator@orbitui.dev"}
                                    disabled
                                    className="w-full bg-black/30 border border-white/5 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-electric-violet hover:bg-violet-500 text-white font-medium rounded-lg transition-colors neon-pulse shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => signOut(auth)}
                                        className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 font-medium rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                                {saveStatus && (
                                    <span className="text-green-400 text-sm font-medium animate-pulse">{saveStatus}</span>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Column - System Health */}
            <div className="w-full md:w-80 flex-shrink-0">
                <div className="glass-panel p-6 border-white/10 sticky top-4">
                    <div className="flex items-center gap-3 mb-6">
                        <Server className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">System Health</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Ping Latency Card */}
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-medium text-slate-300">Database Latency</span>
                                </div>
                                <span className="text-xs text-slate-500">Firebase RTDB</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">{ping}</span>
                                <span className="text-sm text-slate-400 pb-1">ms</span>
                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                                {isConnected ? 'Measured with a live RTDB write/read round trip.' : 'Realtime database is currently disconnected.'}
                            </p>

                            <div className="h-10 mt-4 flex items-end gap-1">
                                {pingHistory.map((sample, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-t-sm ${i === pingHistory.length - 1 ? 'bg-electric-violet' : 'bg-electric-violet/30'} transition-all duration-300`}
                                        style={{ height: `${Math.max(10, Math.min(sample * 2, 100))}%` }}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Connection Status */}
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                            <div className="flex items-start gap-3">
                                <ArrowUpCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-1">
                                        {isConnected ? 'Realtime Connected' : 'Connection Interrupted'}
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {isConnected
                                            ? 'Your client is connected to Firebase Realtime Database and publishing live measurements.'
                                            : 'Realtime features will recover automatically when the database connection comes back.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
