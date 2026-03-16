import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { rtdb } from '../../lib/firebase';
import { ref, push, onChildAdded, serverTimestamp, query, limitToLast } from 'firebase/database';

interface ChatMessage {
    id: string;
    text: string;
    userName: string;
    timestamp: number;
}

export default function LiveChatBubble() {
    const { isChatOpen, setIsChatOpen, userName, activeProject } = useAppStore();
    const [messagesByPath, setMessagesByPath] = useState<Record<string, ChatMessage[]>>({});
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatPath = activeProject ? `projects/${activeProject.id}/messages` : 'global_chat';
    const messages = useMemo(() => messagesByPath[chatPath] ?? [], [chatPath, messagesByPath]);

    useEffect(() => {
        // Listen to the last 50 messages
        const chatRef = query(ref(rtdb, chatPath), limitToLast(50));

        const unsubscribe = onChildAdded(chatRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setMessagesByPath((prev) => {
                    const nextMessage = { id: snapshot.key as string, ...data } as ChatMessage;
                    const existingMessages = prev[chatPath] ?? [];

                    if (existingMessages.some((message) => message.id === nextMessage.id)) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [chatPath]: [...existingMessages, nextMessage],
                    };
                });
            }
        });

        return () => unsubscribe();
    }, [chatPath]);

    useEffect(() => {
        // Auto scroll down
        if (isChatOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        push(ref(rtdb, chatPath), {
            text: newMessage,
            userName: userName,
            timestamp: serverTimestamp()
        });

        setNewMessage('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="glass-panel w-80 sm:w-96 mb-4 overflow-hidden border border-electric-violet/50 shadow-[0_0_30px_rgba(139,92,246,0.2)] flex flex-col"
                        style={{ height: '400px' }}
                    >
                        {/* Header */}
                        <div className="bg-black/40 p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                <h3 className="font-semibold text-white">Activity Feed</h3>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <p className="text-center text-slate-500 text-sm mt-4">No activity yet. Start a conversation!</p>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.userName === userName;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] text-slate-400 mb-1 px-1">{msg.userName}</span>
                                            <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${isMe
                                                ? 'bg-electric-violet text-white rounded-tr-sm'
                                                : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-sm'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Say something..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 rounded-full bg-electric-violet hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors neon-pulse"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="w-14 h-14 rounded-full bg-electric-violet flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-105 hover:bg-purple-500 transition-all z-50 neon-pulse"
            >
                <MessageSquare className="w-6 h-6" />
            </button>
        </div>
    );
}
