// --- ИНИЦИАЛИЗАЦИЯ И РАСШИРЕНИЕ ОБЪЕКТА СИСТЕМНОЙ БД (ЧАТ) ---
DB.getMessages = function () {
    return JSON.parse(localStorage.getItem('sys_chats') || '[]');
};
DB.saveMessages = function (msgs) {
    localStorage.setItem('sys_chats', JSON.stringify(msgs));
};
DB.sendMessage = function (toLogin, text) {
    const current = this.getCurrentUser();
    if (!current) return;
    const msgs = this.getMessages();
    msgs.push({
        id: 'msg_' + Date.now(),
        from: current.login,
        to: toLogin,
        text: text,
        timestamp: Date.now(),
        read: false
    });
    this.saveMessages(msgs);
};
DB.markAsRead = function (fromLogin) {
    const current = this.getCurrentUser();
    if (!current) return;
    const msgs = this.getMessages();
    msgs.forEach(m => {
        if (m.from === fromLogin && m.to === current.login) {
            m.read = true;
        }
    });
    this.saveMessages(msgs);
};

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = DB.getCurrentUser();
    let currentChatTarget = null;
    let chatInterval = null;

    const availableGroups = [
        "Администрация", "Д1А", "Д1Б", "Д2", "Д3", "Д4", "ИП1", "ИП2", "ИП3", "ИП4А", "ИП4Б",
        "ИС1А", "ИС1Б", "ИС2", "ИС3", "ИС4", "Л1", "Н1А", "Н1Б", "Н1В", "Н2А", "Н2Б", "Н3А", "Н3Б",
        "Н4А", "Н4Б", "ОЗФО 1А", "ОЗФО 1Б", "ОЗФО 1В", "ОЗФО 1Г", "ОЗФО 2А", "ОЗФО 2Б", "ОЗФО 2В",
        "ОЗФО 2Г", "ОЗФО 2Д", "ОЗФО 2Е", "ОЗФО 2Ж", "ОЗФО 2Л", "ОЗФО 3А", "ОЗФО 3Б", "ОЗФО 3В",
        "ОЗФО 3Г", "ОЗФО 3Д", "ОЗФО 3Е", "ОЗФО 3Ж", "ОЗФО 33", "ОЗФО 3И", "ОЗФО 3К", "ПД1А",
        "ПД1Б", "ПД1В", "ПД1Г", "ПД1Д", "ПД1Е", "ПД1Ж", "ПД2А", "ПД2Б", "ПД2В", "ПД2Г", "ПД3А",
        "ПД3Б", "ПД3В", "ПД3Г", "ПД4А", "ПД4Б", "ПД4В", "ПД4Г", "ПД4Д", "Ф1", "Ф2", "Ф3", "Ф4"
    ];

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Подключение интерфейса уведомлений для студентов
    if (currentUser.role !== 'admin') {
        document.getElementById('bellWrapper').style.display = 'block';
        updateBellBadge();
        setInterval(updateBellBadge, 3000);
    }

    const profileModal = document.getElementById('userProfileModal');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const startChatBtn = document.getElementById('startChatBtn');
    const backToProfileBtn = document.getElementById('backToProfileBtn');
    const modalProfileView = document.getElementById('modalProfileView');
    const modalChatView = document.getElementById('modalChatView');

    function openUserProfile(user, openChatImmediately = false) {
        currentChatTarget = user;

        document.getElementById('mAvatar').src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
        document.getElementById('mName').textContent = user.name;
        document.getElementById('mGroup').textContent = `Учебная группа: ${user.group}`;
        document.getElementById('mBio').textContent = user.bio || 'Пользователь еще ничего не рассказал о себе.';
        document.getElementById('mClubs').textContent = (user.myClubs && user.myClubs.length > 0) ? user.myClubs.join(', ') : 'Еще не записан в кружки.';

        document.getElementById('chatTargetName').textContent = user.name;
        document.getElementById('chatTargetGroup').textContent = `Группа ${user.group}`;

        if (openChatImmediately) {
            modalProfileView.style.display = 'none';
            modalChatView.style.display = 'block';
            startLiveChat();
        } else {
            modalProfileView.style.display = 'block';
            modalChatView.style.display = 'none';
        }

        profileModal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    startChatBtn.addEventListener('click', () => {
        modalProfileView.style.display = 'none';
        modalChatView.style.display = 'block';
        startLiveChat();
    });

    backToProfileBtn.addEventListener('click', () => {
        stopLiveChat();
        modalChatView.style.display = 'none';
        modalProfileView.style.display = 'block';
    });

    function closeEveryModal() {
        profileModal.classList.remove('active');
        document.body.classList.remove('modal-open');
        stopLiveChat();
    }

    closeProfileModalBtn.addEventListener('click', closeEveryModal);
    profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeEveryModal(); });

    document.getElementById('chatSubmitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInputMessage');
        const text = input.value.trim();
        if (!text || !currentChatTarget) return;

        DB.sendMessage(currentChatTarget.login, text);
        input.value = '';
        renderChatHistory();
    });

    function getGroupDateLabel(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Сегодня';
        if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }

    function startLiveChat() {
        DB.markAsRead(currentChatTarget.login);
        renderChatHistory();
        updateBellBadge();
        chatInterval = setInterval(() => {
            DB.markAsRead(currentChatTarget.login);
            renderChatHistory();
        }, 2000);
    }

    function stopLiveChat() {
        if (chatInterval) clearInterval(chatInterval);
        currentChatTarget = null;
        updateBellBadge();
    }

    function renderChatHistory() {
        const box = document.getElementById('chatMessagesBox');
        if (!currentChatTarget || !box) return;

        const allMsgs = DB.getMessages();
        const conversation = allMsgs.filter(m =>
            (m.from === currentUser.login && m.to === currentChatTarget.login) ||
            (m.from === currentChatTarget.login && m.to === currentUser.login)
        );

        const isAtBottom = box.scrollHeight - box.clientHeight <= box.scrollTop + 40;
        box.innerHTML = '';
        let lastDateLabel = '';

        conversation.forEach(msg => {
            const dateLabel = getGroupDateLabel(msg.timestamp);
            if (dateLabel !== lastDateLabel) {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'chat-date-group';
                dateDiv.textContent = dateLabel;
                box.appendChild(dateDiv);
                lastDateLabel = dateLabel;
            }

            const isMe = msg.from === currentUser.login;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const statusTicks = msg.read ? '✓✓' : '✓';

            const bubble = document.createElement('div');
            bubble.className = `message-bubble ${isMe ? 'sent' : 'received'}`;
            bubble.innerHTML = `
                <div>${msg.text}</div>
                <div class="message-meta">
                    <span>${timeStr}</span>
                    ${isMe ? `<span class="message-status">${statusTicks}</span>` : ''}
                </div>
            `;
            box.appendChild(bubble);
        });

        if (isAtBottom || box.scrollTop === 0) {
            box.scrollTop = box.scrollHeight;
        }
    }

    function updateBellBadge() {
        const msgs = DB.getMessages();
        const unread = msgs.filter(m => m.to === currentUser.login && !m.read);
        const badge = document.getElementById('bellBadge');
        if (unread.length > 0) {
            badge.textContent = unread.length;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    document.getElementById('bellBtn').addEventListener('click', () => {
        const msgs = DB.getMessages();
        const unread = msgs.filter(m => m.to === currentUser.login && !m.read);
        if (unread.length > 0) {
            const lastSenderLogin = unread[unread.length - 1].from;
            const targetUser = DB.getUsers()[lastSenderLogin];
            if (targetUser) openUserProfile(targetUser, true);
        } else {
            alert("Новых сообщений нет.");
        }
    });

    const renderProfileCard = () => {
        const userDb = DB.getUsers()[currentUser.login];
        document.getElementById('userAvatar').src = userDb.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
        document.getElementById('userName').textContent = userDb.name;
        document.getElementById('userGroup').textContent = userDb.group === 'Администрация' ? 'Служебный аккаунт' : `Группа: ${userDb.group}`;
        document.getElementById('userRoleBadge').textContent = userDb.role === 'admin' ? 'Администратор портала' : 'Студент';
        document.getElementById('avatarUrlInput').value = userDb.avatar || '';
    };

    renderProfileCard();

    document.getElementById('avatarForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const url = document.getElementById('avatarUrlInput').value.trim();
        const bio = document.getElementById('bioInput') ? document.getElementById('bioInput').value : (DB.getUsers()[currentUser.login].bio || '');
        if (DB.updateProfile(bio, url)) {
            renderProfileCard();
            if (currentUser.role !== 'admin') {
                renderClassmates();
                renderClubmates();
            }
        }
    });

    // Распределение интерфейсов в зависимости от роли
    if (currentUser.role === 'admin') {
        document.getElementById('adminInterface').style.display = 'block';
        renderAdminNotifications();
        renderUsersManagement();
    } else {
        document.getElementById('studentInterface').style.display = 'block';
        const dbUser = DB.getUsers()[currentUser.login];
        if (document.getElementById('bioInput')) {
            document.getElementById('bioInput').value = dbUser.bio || '';
        }

        document.getElementById('bioForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const bioText = document.getElementById('bioInput').value.trim();
            const avatarUrl = DB.getUsers()[currentUser.login].avatar || '';
            DB.updateProfile(bioText, avatarUrl);
            alert('Изменения профиля сохранены');
        });

        renderStudentClubs();
        renderClassmates();
        renderClubmates();
    }

    function renderStudentClubs() {
        const container = document.getElementById('studentClubsContainer');
        container.innerHTML = '';
        const myClubs = DB.getUsers()[currentUser.login].myClubs || [];

        if (myClubs.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">Вы пока не зачислены ни в один кружок.</p>`;
            return;
        }

        myClubs.forEach(club => {
            const el = document.createElement('div');
            el.className = 'club-item-approved';
            el.style.cssText = 'background: var(--bg-card); padding: 12px 20px; border-radius: 6px; border-left: 4px solid var(--accent-blue); margin-bottom: 10px; font-weight: 600;';
            el.textContent = club;
            container.appendChild(el);
        });
    }

    function renderClassmates() {
        const container = document.getElementById('classmatesContainer');
        container.innerHTML = '';
        const allUsers = DB.getUsers();
        const myDbAccount = allUsers[currentUser.login];
        const classmates = Object.values(allUsers).filter(u => u.group === myDbAccount.group && u.login !== myDbAccount.login);

        if (classmates.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">В вашей группе пока нет других студентов.</p>`;
            return;
        }

        classmates.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-mini-card';
            card.innerHTML = `
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}" class="user-mini-avatar" alt="">
                <div class="user-mini-info">
                    <h4>${user.name}</h4>
                    <p>${user.bio || 'Студент'}</p>
                </div>
            `;
            card.addEventListener('click', () => openUserProfile(user));
            container.appendChild(card);
        });
    }

    function renderClubmates() {
        const container = document.getElementById('clubmatesContainer');
        container.innerHTML = '';
        const allUsers = DB.getUsers();
        const myDbAccount = allUsers[currentUser.login];
        const myClubs = myDbAccount.myClubs || [];

        if (myClubs.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">Запишитесь в кружки, чтобы увидеть единомышленников.</p>`;
            return;
        }

        const clubmates = Object.values(allUsers).filter(u => {
            if (u.login === myDbAccount.login) return false;
            return (u.myClubs || []).some(club => myClubs.includes(club));
        });

        if (clubmates.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-style:italic;">В ваших кружках пока нет других участников.</p>`;
            return;
        }

        clubmates.forEach(user => {
            const common = user.myClubs.filter(c => myClubs.includes(c)).join(', ');
            const card = document.createElement('div');
            card.className = 'user-mini-card';
            card.innerHTML = `
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}" class="user-mini-avatar" alt="">
                <div class="user-mini-info">
                    <h4>${user.name} (${user.group})</h4>
                    <p style="color:var(--accent-blue); font-weight:500; font-size:0.75rem;">Общие: ${common}</p>
                </div>
            `;
            card.addEventListener('click', () => openUserProfile(user));
            container.appendChild(card);
        });
    }

    // --- ФУНКЦИИ УПРАВЛЕНИЯ АДМИНИСТРАТОРА (ВОССТАНОВЛЕНЫ) ---
    function renderAdminNotifications() {
        const container = document.getElementById('adminNotificationsContainer');
        if (!container) return;
        container.innerHTML = '';
        const apps = DB.getApplications().filter(a => a.status === 'pending');

        if (apps.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-style:italic; background: var(--bg-card); padding: 20px; border-radius:8px; border:1px dashed var(--border-color);">Новых заявок на вступление нет.</p>`;
            return;
        }

        apps.forEach(app => {
            const card = document.createElement('div');
            card.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); padding: 15px 20px; border-radius: 8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;';
            card.innerHTML = `
                <div>
                    <strong style="color: var(--text-white); font-size:1.1rem;">${app.userName} (@${app.userLogin})</strong>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top:4px;">Группа: ${app.userGroup} | Кружок: <span style="color:var(--accent-blue); font-weight:600;">${app.clubName}</span></p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-approve" data-id="${app.id}" style="background:#38bdf8; color:#0f172a; border:none; padding:8px 15px; font-weight:700; border-radius:4px; cursor:pointer;">Одобрить</button>
                    <button class="btn-reject" data-id="${app.id}" style="background:transparent; color:#fc8181; border:1px solid #fc8181; padding:8px 15px; font-weight:600; border-radius:4px; cursor:pointer;">Отклонить</button>
                </div>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                DB.approveApplication(btn.getAttribute('data-id'));
                renderAdminNotifications();
                renderUsersManagement();
            });
        });

        container.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => {
                DB.rejectApplication(btn.getAttribute('data-id'));
                renderAdminNotifications();
            });
        });
    }

    function renderUsersManagement() {
        const container = document.getElementById('adminUsersManagementList');
        if (!container) return;
        container.innerHTML = '';
        const users = DB.getUsers();

        Object.keys(users).forEach(login => {
            const u = users[login];
            const userCard = document.createElement('div');
            userCard.style.cssText = 'background: #111827; border: 1px solid #334155; padding: 20px; border-radius: 8px;';

            let groupOptions = '';
            availableGroups.forEach(g => {
                groupOptions += `<option value="${g}" ${u.group === g ? 'selected' : ''}>${g}</option>`;
            });

            userCard.innerHTML = `
                <form class="user-edit-form" data-login="${u.login}">
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom: 15px;">
                        <div class="form-group" style="margin:0;">
                            <label style="font-size:0.8rem; color:var(--text-muted);">ФИО Пользователя</label>
                            <input type="text" class="edit-name" value="${u.name}" required style="padding:8px;">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label style="font-size:0.8rem; color:var(--text-muted);">Учебная Группа</label>
                            <select class="edit-group" style="padding:8px; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; height:39px;">
                                ${groupOptions}
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label style="font-size:0.8rem; color:var(--text-muted);">Логин</label>
                            <input type="text" value="@${u.login}" disabled style="padding:8px; opacity:0.6; background:#1e293b;">
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:15px;">
                        <label style="font-size:0.8rem; color:var(--text-muted);">Кружки (Через запятую)</label>
                        <input type="text" class="edit-clubs" value="${u.myClubs ? u.myClubs.join(', ') : ''}" style="padding:8px;">
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <button type="submit" class="btn-submit" style="padding:8px 15px; font-size:0.85rem; max-width:180px; margin:0;">Сохранить параметры</button>
                        <div style="display:flex; gap:10px;">
                            ${u.role !== 'admin' ? `<button type="button" class="set-admin-btn" data-login="${u.login}" style="background:rgba(56,189,248,0.1); border:1px dashed #38bdf8; color:#38bdf8; padding:8px 12px; border-radius:4px; cursor:pointer;">Назначить админом</button>` : ''}
                            ${u.login !== 'admin' && u.login !== currentUser.login ? `<button type="button" class="fire-user-btn" data-login="${u.login}" style="background:transparent; border:1px solid #fc8181; color:#fc8181; padding:8px 12px; border-radius:4px; cursor:pointer;">Удалить</button>` : ''}
                        </div>
                    </div>
                </form>
            `;
            container.appendChild(userCard);
        });

        container.querySelectorAll('.user-edit-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const login = form.getAttribute('data-login');
                const name = form.querySelector('.edit-name').value.trim();
                const group = form.querySelector('.edit-group').value;
                const clubsArr = form.querySelector('.edit-clubs').value.split(',').map(c => c.trim()).filter(c => c.length > 0);

                DB.updateUserByAdmin(login, name, group, clubsArr);
                alert('Данные пользователя изменены администратором');
                renderUsersManagement();
            });
        });

        container.querySelectorAll('.fire-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const login = btn.getAttribute('data-login');
                if (confirm(`Удалить аккаунт ${login}?`)) {
                    DB.deleteUser(login);
                    renderUsersManagement();
                }
            });
        });
    }

    const logoutAction = () => {
        DB.logout();
        window.location.href = 'index.html';
    };
    document.getElementById('logoutBtn').addEventListener('click', logoutAction);
    document.getElementById('logoutBtnTop').addEventListener('click', logoutAction);
});