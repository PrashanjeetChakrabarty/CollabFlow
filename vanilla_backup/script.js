import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase, ref as dbRef, onValue, set as dbSet, onDisconnect, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
    databaseURL: "YOUR_DATABASE_URL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

console.log("CollabFlow is connected to Firebase! 🚀");

export { db, rtdb, storage };

document.addEventListener('DOMContentLoaded', () => {
    // --- APP STATE & CONFIG ---
    let useMotionBlur = true;

    // --- 1. SPA Navigation ---
    const navLinks = document.querySelectorAll('.nav-links li, .settings-btn');
    const views = document.querySelectorAll('.view');
    const activityFeed = document.getElementById('activityFeed');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');

            const targetViewId = link.getAttribute('data-view');
            views.forEach(view => view.classList.remove('active-view'));
            document.getElementById(targetViewId).classList.add('active-view');

            if (targetViewId !== 'boardView') {
                activityFeed.style.transform = 'translateX(120%)';
            }
        });
    });

    // Chat Toggle Logic
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            const currentTransform = activityFeed.style.transform;
            if (currentTransform === 'translateX(0px)' || currentTransform === 'translateX(0)') {
                activityFeed.style.transform = 'translateX(120%)';
            } else {
                activityFeed.style.transform = 'translateX(0)';
            }
        });
    }


    // --- 2. Interactive Kanban Physics & Drag-Drop ---
    const kanbanContainer = document.getElementById('kanbanContainer');
    let draggedCard = null;

    // 3D Parallax Depth-of-Field Effect on Board Only
    kanbanContainer.addEventListener('mousemove', (e) => {
        if (draggedCard) return;
        const rect = kanbanContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xAxis = (rect.width / 2 - x) / 60;
        const yAxis = (rect.height / 2 - y) / 60;

        document.querySelectorAll('#boardView .card').forEach(card => {
            if (!card.matches(':hover') && !card.classList.contains('dragging')) {
                card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg) translateZ(-5px)`;
                card.style.transition = 'none';
            }
        });
    });

    kanbanContainer.addEventListener('mouseleave', () => {
        document.querySelectorAll('#boardView .card').forEach(card => {
            if (!card.matches(':hover') && !card.classList.contains('dragging')) {
                card.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                card.style.transform = 'translateZ(0)';
            }
        });
    });

    // Attach drag events to all cards (even dynamically generated ones)
    function attachCardEvents(card) {
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            setTimeout(() => card.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', async () => {
            draggedCard.classList.remove('dragging');
            draggedCard.style.transform = 'translateZ(0)';

            // Firebase update
            const newColId = draggedCard.parentElement.id;
            const taskId = draggedCard.getAttribute('data-id');
            if (taskId) {
                try {
                    await setDoc(doc(db, 'tasks', taskId), { status: newColId }, { merge: true });
                } catch (e) {
                    console.error("Error updating task status:", e);
                }
            }
            draggedCard = null;
        });

        card.addEventListener('click', () => openDrawer(card));
    }

    // Initialize existing cards
    document.querySelectorAll('.interactive-card').forEach(card => attachCardEvents(card));

    const columns = document.querySelectorAll('.cards-list');
    columns.forEach(col => {
        col.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(col, e.clientY);
            const currentDraggable = document.querySelector('.dragging');
            if (currentDraggable) {
                if (afterElement == null) {
                    col.appendChild(currentDraggable);
                } else {
                    col.insertBefore(currentDraggable, afterElement);
                }
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child }
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }


    // --- 3. Inline Task Generator (Firebase Integration) ---
    const addCardInputs = document.querySelectorAll('.card-input');

    addCardInputs.forEach(input => {
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const text = input.value.trim();
                if (!text) return;

                const colId = input.getAttribute('data-col');
                input.value = ''; // Reset input immediately

                try {
                    await addDoc(collection(db, 'tasks'), {
                        title: text,
                        status: colId,
                        timestamp: serverTimestamp(),
                        assigneeSeed: Math.random().toString(36).substring(7)
                    });
                } catch (error) {
                    console.error("Error adding task: ", error);
                }
            }
        });
    });

    // --- 3.5 Firebase Real-Time Listener for Tasks ---
    const tasksQuery = query(collection(db, 'tasks'), orderBy('timestamp', 'asc'));
    onSnapshot(tasksQuery, (snapshot) => {
        const backlogCol = document.getElementById('col-backlog');
        const todoCol = document.getElementById('col-todo');
        const inProgressCol = document.getElementById('col-inprogress');

        if (!backlogCol || !todoCol || !inProgressCol) return;

        backlogCol.innerHTML = '';
        todoCol.innerHTML = '';
        inProgressCol.innerHTML = '';

        let counts = { 'col-backlog': 0, 'col-todo': 0, 'col-inprogress': 0 };

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const taskId = docSnap.id;
            const status = data.status || 'col-backlog';

            counts[status] = (counts[status] || 0) + 1;

            const targetColumn = document.getElementById(status);
            if (!targetColumn) return;

            const themeClass = status === 'col-backlog' ? 'neon-violet'
                : status === 'col-todo' ? 'neon-cyan'
                    : 'neon-slate';

            const newCard = document.createElement('div');
            newCard.className = `card glass-card ${themeClass} interactive-card animate-in`;
            newCard.draggable = true;
            newCard.setAttribute('data-id', taskId);

            newCard.innerHTML = `
                <h3>${data.title}</h3>
                <p>Synced via Firebase Real-Time Firestore</p>
                <div class="card-footer">
                    <span class="tag ${themeClass.split('-')[1]}-tag">Task</span>
                    <div class="avatar-sm"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=${data.assigneeSeed || 'Sync'}" alt="User"/></div>
                </div>
            `;

            targetColumn.appendChild(newCard);
            attachCardEvents(newCard);
        });

        // Update counts
        const allColumns = document.querySelectorAll('.kanban-column');
        allColumns.forEach(col => {
            const listId = col.querySelector('.cards-list').id;
            const countSpan = col.querySelector('.count');
            if (countSpan) countSpan.textContent = counts[listId] || 0;
        });
    });


    // --- 4. Task Detail Drawer ---
    const taskDrawer = document.getElementById('taskDrawer');
    const closeDrawerBtn = document.getElementById('closeDrawer');
    const drawerTitle = document.getElementById('drawerTitle');

    function openDrawer(cardNode) {
        if (!cardNode.querySelector('h3')) return;
        const title = cardNode.querySelector('h3').innerText;
        drawerTitle.innerText = title;
        taskDrawer.classList.add('open');
    }

    closeDrawerBtn.addEventListener('click', () => taskDrawer.classList.remove('open'));

    document.addEventListener('mousedown', (e) => {
        if (taskDrawer.classList.contains('open') && !taskDrawer.contains(e.target) && !e.target.closest('.card')) {
            taskDrawer.classList.remove('open');
        }
    });

    // --- 5. Real-Time Chat System ---
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const feedList = document.getElementById('feedList');

    async function submitChat() {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';

        try {
            await addDoc(collection(db, 'messages'), {
                text: text,
                user: 'You',
                timestamp: serverTimestamp(),
                avatarSeed: 'Prashanjeet'
            });
        } catch (e) {
            console.error("Error sending message:", e);
        }
    }

    sendBtn.addEventListener('click', submitChat);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitChat(); });

    // Global Chat Listener
    const chatMsgQuery = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    onSnapshot(chatMsgQuery, (snapshot) => {
        feedList.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const timeString = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

            const newFeedItem = document.createElement('div');
            newFeedItem.className = 'feed-item new-log';
            if (!useMotionBlur) {
                newFeedItem.style.animation = 'none';
                newFeedItem.style.opacity = '1';
                newFeedItem.style.filter = 'none';
                newFeedItem.style.transform = 'translateY(0)';
            }

            newFeedItem.innerHTML = `
                <div class="avatar-xs"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=${data.avatarSeed || 'Default'}" alt="User"/></div>
                <div class="feed-content">
                    <p><strong>${data.user || 'Anonymous'}</strong>: ${data.text}</p>
                    <span class="time">${timeString}</span>
                </div>
            `;
            feedList.appendChild(newFeedItem);
        });
        feedList.scrollTop = feedList.scrollHeight; // Auto-scroll
    });


    // --- 6. Aesthetic Settings Controls ---
    const glowSlider = document.getElementById('glowSlider');
    const blurSlider = document.getElementById('blurSlider');
    const rootStyles = document.documentElement;

    glowSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        rootStyles.style.setProperty('--glow-intensity', (val * 2).toString());
    });

    blurSlider.addEventListener('input', (e) => {
        rootStyles.style.setProperty('--blur-intensity', e.target.value + 'px');
    });

    const motionBlurToggle = document.getElementById('motionBlurToggle');
    motionBlurToggle.addEventListener('change', (e) => {
        useMotionBlur = e.target.checked;
    });

    const themeSelect = document.getElementById('themeSelect');
    themeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'cyberpunk') {
            rootStyles.style.setProperty('--electric-violet', '#ff00ff');
            rootStyles.style.setProperty('--cyber-cyan', '#00ffcc');
            rootStyles.style.setProperty('--bg-dark', '#050014');
        } else if (e.target.value === 'minimal') {
            rootStyles.style.setProperty('--electric-violet', '#475569');
            rootStyles.style.setProperty('--cyber-cyan', '#64748b');
            rootStyles.style.setProperty('--bg-dark', '#0f172a');
        } else {
            // default antigravity
            rootStyles.style.setProperty('--electric-violet', '#8A2BE2');
            rootStyles.style.setProperty('--cyber-cyan', '#00FFFF');
            rootStyles.style.setProperty('--bg-dark', '#0a0a0f');
        }
    });

    // --- 7. Projects View Modal & Logic ---
    const newProjectBtn = document.getElementById('newProjectBtn');
    const newProjectModal = document.getElementById('newProjectModal');
    const cancelProjBtn = document.getElementById('cancelProjBtn');
    const createProjBtn = document.getElementById('createProjBtn');
    const projectsGrid = document.getElementById('projectsGrid');

    function openModal() {
        newProjectModal.classList.add('active');
    }

    function closeModal() {
        newProjectModal.classList.remove('active');
        document.getElementById('newProjName').value = '';
        document.getElementById('newProjDesc').value = '';
    }

    newProjectBtn.addEventListener('click', openModal);
    cancelProjBtn.addEventListener('click', closeModal);

    createProjBtn.addEventListener('click', () => {
        const name = document.getElementById('newProjName').value.trim() || 'Untitled Project';
        const desc = document.getElementById('newProjDesc').value.trim() || 'A new workspace tile in antigravity.';
        const color = document.getElementById('newProjColor').value;

        const card = document.createElement('div');
        // using animate-in for smooth creation in grid too
        card.className = `project-card glass-panel interactive-card neon-${color} floating-delay-${Math.floor(Math.random() * 3) + 1} animate-in`;

        card.innerHTML = `
            <div class="project-icon bg-${color}"></div>
            <h3>${name}</h3>
            <p>${desc}</p>
            <div class="project-stats">
                <span>1 Active</span>
                <span>0% Complete</span>
            </div>
            <div class="avatars-group mini-avatars">
                <div class="avatar"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Prashanjeet" alt="Me"/></div>
            </div>
        `;

        projectsGrid.insertBefore(card, projectsGrid.firstChild);
        closeModal();
    });

});
