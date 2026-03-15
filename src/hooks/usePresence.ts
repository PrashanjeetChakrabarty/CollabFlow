import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { rtdb } from '../lib/firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

export function usePresence() {
    const { setOnlineUsers, userName } = useAppStore();

    useEffect(() => {
        // A unique ID for this session
        const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

        const userStatusDatabaseRef = ref(rtdb, '/status/' + sessionId);
        const connectedRef = ref(rtdb, '.info/connected');

        const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            }

            onDisconnect(userStatusDatabaseRef).remove().then(() => {
                set(userStatusDatabaseRef, {
                    state: 'online',
                    last_changed: serverTimestamp(),
                    name: userName,
                });
            });
        });

        const statusRef = ref(rtdb, '/status');
        const unsubscribeStatus = onValue(statusRef, (snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                const activeCount = Object.keys(users).length;
                setOnlineUsers(activeCount);
            } else {
                setOnlineUsers(0);
            }
        });

        return () => {
            unsubscribeConnected();
            unsubscribeStatus();
            set(userStatusDatabaseRef, null);
        };
    }, [userName, setOnlineUsers]);
}
