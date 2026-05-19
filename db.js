// --- ГЛОБАЛЬНАЯ КАСТОМИЗАЦИЯ УВЕДОМЛЕНИЙ (БЕЗ ЭМОДЗИ, SVG-ONLY) ---
(function initCustomModals() {
    // Создаем контейнер для кастомных окон, если его еще нет
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('customModalOverlay')) {
            const container = document.createElement('div');
            container.id = 'customModalOverlay';
            container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000; opacity: 0; pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            container.innerHTML = `
                <div id="customModalWindow" style="
                    background: #111827; border: 1px solid #334155;
                    border-radius: 12px; padding: 30px; max-width: 450px;
                    width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    transform: scale(0.9); transition: transform 0.3s ease;
                ">
                    <div id="customModalIcon" style="margin-bottom: 20px; display: flex; justify-content: center;"></div>
                    <h3 id="customModalTitle" style="font-size: 1.4rem; color: #f8fafc; margin-bottom: 12px; font-family: system-ui, sans-serif;"></h3>
                    <p id="customModalMessage" style="color: #94a3b8; font-size: 1rem; margin-bottom: 25px; line-height: 1.5; font-family: system-ui, sans-serif;"></p>
                    <div id="customModalButtons" style="display: flex; justify-content: center; gap: 15px;"></div>
                </div>
            `;
            document.body.appendChild(container);
        }
    });

    // Набор SVG-иконок для разных типов уведомлений
    const svgIcons = {
        success: `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        error: `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#fc8181" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#f6ad55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        info: `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    // Функция вызова кастомного окна (возвращает Promise)
    window.showCustomPopup = function (title, message, type = 'info', isConfirm = false) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('customModalOverlay');
            const win = document.getElementById('customModalWindow');
            const iconContainer = document.getElementById('customModalIcon');
            const titleEl = document.getElementById('customModalTitle');
            const msgEl = document.getElementById('customModalMessage');
            const btnContainer = document.getElementById('customModalButtons');

            if (!overlay || !win) {
                // Фолбэк на случай, если DOM не готов
                if (isConfirm) resolve(confirm(message));
                else { alert(message); resolve(true); }
                return;
            }

            iconContainer.innerHTML = svgIcons[type] || svgIcons.info;
            titleEl.textContent = title;
            msgEl.textContent = message;
            btnContainer.innerHTML = '';

            document.body.classList.add('modal-open');
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            win.style.transform = 'scale(1)';

            const closePopup = (result) => {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                win.style.transform = 'scale(0.9)';
                document.body.classList.remove('modal-open');
                resolve(result);
            };

            if (isConfirm) {
                const btnCancel = document.createElement('button');
                btnCancel.textContent = 'Отмена';
                btnCancel.style.cssText = `
                    background: transparent; border: 1px solid #334155; color: #f8fafc;
                    padding: 10px 22px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;
                `;
                btnCancel.onclick = () => closePopup(false);

                const btnConfirm = document.createElement('button');
                btnConfirm.textContent = 'Подтвердить';
                btnConfirm.style.cssText = `
                    background: #fc8181; border: none; color: #0f172a;
                    padding: 10px 22px; border-radius: 6px; cursor: pointer; font-weight: 700; transition: all 0.2s;
                `;
                btnConfirm.onclick = () => closePopup(true);

                btnContainer.appendChild(btnCancel);
                btnContainer.appendChild(btnConfirm);
            } else {
                const btnOk = document.createElement('button');
                btnOk.textContent = 'ОК';
                btnOk.style.cssText = `
                    background: #38bdf8; border: none; color: #0f172a;
                    padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: 700; transition: all 0.2s;
                    min-width: 100px;
                `;
                btnOk.onclick = () => closePopup(true);
                btnContainer.appendChild(btnOk);
            }
        });
    };

    // Переопределяем стандартный alert
    window.alert = function (message) {
        window.showCustomPopup('Уведомление', message, 'info', false);
    };

    // Переопределяем старый showNotification, заменяя эмодзи на автоматический выбор SVG
    window.showNotification = function (title, message, emojiIgnored, type = 'success') {
        window.showCustomPopup(title, message, type, false);
    };
})();

// --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ В LOCALSTORAGE ---
(function initDatabase() {
    if (!localStorage.getItem('users_db')) {
        const initialUsers = {
            "admin": {
                login: "admin",
                password: "admin",
                name: "Админ Техникума",
                group: "Администрация",
                role: "admin",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
                bio: "Главный администратор портала кружков техникума.",
                myClubs: []
            }
        };
        localStorage.setItem('users_db', JSON.stringify(initialUsers));
    }

    if (!localStorage.getItem('applications_db')) {
        localStorage.setItem('applications_db', JSON.stringify([]));
    }
})();

// --- ОБЪЕКТ ДЛЯ РАБОТЫ С БАЗОЙ ДАННЫХ (API) ---
const DB = {
    getUsers() {
        return JSON.parse(localStorage.getItem('users_db')) || {};
    },

    saveUsers(users) {
        localStorage.setItem('users_db', JSON.stringify(users));
    },

    getApplications() {
        return JSON.parse(localStorage.getItem('applications_db')) || [];
    },

    saveApplications(apps) {
        localStorage.setItem('applications_db', JSON.stringify(apps));
    },

    login(login, password) {
        const users = this.getUsers();
        const user = users[login.trim()];

        if (user && user.password === password) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user: user };
        }
        return { success: false, message: "Неверный логин или пароль!" };
    },

    register(name, login, group, password) {
        const users = this.getUsers();
        const cleanLogin = login.trim();

        if (users[cleanLogin]) {
            return { success: false, message: "Пользователь с таким логином уже существует!" };
        }

        const newStudent = {
            login: cleanLogin,
            password: password,
            name: name,
            group: group,
            role: "student",
            avatar: "images/user.jfif",
            bio: "Новый студент техникума «Бизнес и Право».",
            myClubs: []
        };
        users[cleanLogin] = newStudent;
        this.saveUsers(users);

        localStorage.setItem('currentUser', JSON.stringify(newStudent));
        return { success: true, user: newStudent };
    },

    logout() {
        localStorage.removeItem('currentUser');
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser')) || null;
    },

    sendApplication(clubName) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: "Вы должны быть авторизованы." };

        const apps = this.getApplications();

        const isExist = apps.some(a => a.userLogin === currentUser.login && a.clubName === clubName && a.status === 'pending');
        if (isExist) {
            return { success: false, message: "Вы уже подали заявку на этот кружок. Ожидайте решения модератора." };
        }

        const newApp = {
            id: 'app_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            userLogin: currentUser.login,
            userName: currentUser.name,
            userGroup: currentUser.group,
            clubName: clubName,
            status: 'pending',
            date: new Date().toLocaleDateString('ru-RU')
        };

        apps.push(newApp);
        this.saveApplications(apps);
        return { success: true, message: `Ваша заявка на кружок "${clubName}" успешно отправлена на рассмотрение.` };
    },

    approveApplication(appId) {
        const apps = this.getApplications();
        const appIndex = apps.findIndex(a => a.id === appId);
        if (appIndex === -1) return false;

        const app = apps[appIndex];
        app.status = 'approved';

        const users = this.getUsers();
        if (users[app.userLogin]) {
            if (!users[app.userLogin].myClubs.includes(app.clubName)) {
                users[app.userLogin].myClubs.push(app.clubName);
            }
            this.saveUsers(users);
        }

        this.saveApplications(apps);
        return true;
    },

    rejectApplication(appId) {
        const apps = this.getApplications();
        const appIndex = apps.findIndex(a => a.id === appId);
        if (appIndex === -1) return false;

        apps[appIndex].status = 'rejected';
        this.saveApplications(apps);
        return true;
    },

    deleteUser(login) {
        const users = this.getUsers();
        if (users[login]) {
            delete users[login];
            this.saveUsers(users);

            let apps = this.getApplications();
            apps = apps.filter(a => a.userLogin !== login);
            this.saveApplications(apps);
            return true;
        }
        return false;
    },

    assignAdmin(login) {
        const users = this.getUsers();
        if (users[login]) {
            users[login].role = 'admin';
            users[login].group = 'Администрация';
            this.saveUsers(users);
            return true;
        }
        return false;
    },

    removeAdmin(login) {
        const users = this.getUsers();
        if (users[login]) {
            users[login].role = 'student';
            users[login].group = 'Д1А';
            this.saveUsers(users);
            return true;
        }
        return false;
    },

    updateUserByAdmin(login, newName, newGroup, clubsArray) {
        const users = this.getUsers();
        if (users[login]) {
            users[login].name = newName;
            users[login].group = newGroup;
            users[login].myClubs = clubsArray;
            this.saveUsers(users);

            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.login === login) {
                currentUser.name = newName;
                currentUser.group = newGroup;
                currentUser.myClubs = clubsArray;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            return true;
        }
        return false;
    },

    updateProfile(bio, avatarUrl) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const users = this.getUsers();
        if (users[currentUser.login]) {
            users[currentUser.login].bio = bio;
            users[currentUser.login].avatar = avatarUrl;
            this.saveUsers(users);

            currentUser.bio = bio;
            currentUser.avatar = avatarUrl;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            return true;
        }
        return false;
    }
};