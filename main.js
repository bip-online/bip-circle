document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ФИЛЬТРАЦИЯ КРУЖКОВ ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clubCards = document.querySelectorAll('.club-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            clubCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.classList.remove('hide');
                } else {
                    card.classList.add('hide');
                }
            });
        });
    });

    // --- 2. МОДАЛЬНОЕ ОКНО ЗАПИСИ НА КРУЖКИ ---
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const openModalButtons = document.querySelectorAll('.open-modal-btn');
    const clubSelect = document.getElementById('club');

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.club-card');
            if (card && clubSelect) {
                const clubTitle = card.querySelector('h3').textContent.trim();
                for (let i = 0; i < clubSelect.options.length; i++) {
                    if (clubSelect.options[i].text === clubTitle) {
                        clubSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            if (modalOverlay) {
                modalOverlay.classList.add('active');
                document.body.classList.add('modal-open');
            }
        });
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modalOverlay) modalOverlay.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    }

    // --- 3. ОБРАБОТКА ФОРМЫ ЗАЯВКИ (ИСПРАВЛЕНО) ---
    const joinForm = document.getElementById('joinForm');
    if (joinForm) {
        joinForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const groupSelect = document.getElementById('group');
            const clubSelectEl = document.getElementById('club');

            const name = nameInput ? nameInput.value.trim() : '';
            const group = groupSelect ? groupSelect.value : '';
            const clubId = clubSelectEl ? clubSelectEl.value : '';
            const clubName = clubSelectEl && clubSelectEl.selectedIndex >= 0 ? clubSelectEl.options[clubSelectEl.selectedIndex].text : '';

            if (!name || !group || !clubId) {
                showNotification('Ошибка', 'Пожалуйста, заполните все поля формы заявки (Имя, Группа и Кружок).', '❌', 'error');
                return;
            }

            // Проверяем авторизацию
            const currentUser = DB.getCurrentUser();
            if (!currentUser) {
                showNotification('Требуется авторизация', 'Пожалуйста, войдите в систему перед отправкой заявки.', '🔐', 'warning');
                return;
            }

            // Отправляем заявку через DB
            const result = DB.sendApplication(clubName);

            if (result.success) {
                if (modalOverlay) modalOverlay.classList.remove('active');
                joinForm.reset();
                showNotification('Заявка отправлена!', result.message, '✓', 'success');
            } else {
                showNotification('Внимание', result.message, '⚠️', 'warning');
            }
        });
    }

    // --- 4. МОДАЛЬНОЕ ОКНО АВТОРИЗАЦИИ / ВХОДА ---
    const authOverlay = document.getElementById('authOverlay');
    const openAuthBtn = document.querySelector('.open-auth-btn');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const toRegisterBtn = document.getElementById('toRegisterBtn');
    const toLoginBtn = document.getElementById('toLoginBtn');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');

    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => {
            if (authOverlay) {
                authOverlay.classList.add('active');
                document.body.classList.add('modal-open');
                if (loginSection) loginSection.classList.add('active');
                if (registerSection) registerSection.classList.remove('active');
            }
        });
    }

    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', () => {
            if (authOverlay) authOverlay.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    }

    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) {
                authOverlay.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    }

    if (toRegisterBtn) {
        toRegisterBtn.addEventListener('click', () => {
            if (loginSection) loginSection.classList.remove('active');
            if (registerSection) registerSection.classList.add('active');
        });
    }

    if (toLoginBtn) {
        toLoginBtn.addEventListener('click', () => {
            if (registerSection) registerSection.classList.remove('active');
            if (loginSection) loginSection.classList.add('active');
        });
    }

    // --- 5. ВХОД И РЕГИСТРАЦИЯ В БАЗУ ДАННЫХ (ИЗМЕНЕНО: убран автопереход) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const loginUser = document.getElementById('loginUser').value.trim();
            const loginPassword = document.getElementById('loginPassword').value.trim();

            const result = DB.login(loginUser, loginPassword);
            if (result.success) {
                if (authOverlay) authOverlay.classList.remove('active');
                loginForm.reset();
                updateHeaderAuth(); // Обновляем шапку (появится аватарка)
                showNotification('Добро пожаловать!', `Вы вошли как ${result.user.name}`, '👋', 'success');

                // Автоматический редирект на profiles.html удален, чтобы пользователь остался на главной
            } else {
                showNotification('Ошибка входа', result.message, '❌', 'error');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const regName = document.getElementById('regName').value.trim();
            const regLogin = document.getElementById('regLogin').value.trim();
            const regGroup = document.getElementById('regGroup').value;
            const regPassword = document.getElementById('regPassword').value.trim();

            if (!regName || !regLogin || !regGroup || !regPassword) {
                showNotification('Ошибка регистрации', 'Пожалуйста, заполните абсолютно все поля формы!', '❌', 'error');
                return;
            }

            const result = DB.register(regName, regLogin, regGroup, regPassword);
            if (result.success) {
                if (authOverlay) authOverlay.classList.remove('active');
                registerForm.reset();
                updateHeaderAuth(); // Обновляем шапку (появится аватарка)
                showNotification('Успешная регистрация', 'Профиль успешно создан!', '✓', 'success');

                // Автоматический редирект на profiles.html удален, чтобы пользователь остался на главной
            } else {
                showNotification('Логин занят', result.message, '⚠️', 'warning');
            }
        });
    }

    // --- 6. ОБНОВЛЕНИЕ ШАПКИ (ИЗМЕНЕНО: теперь выводится аватарка пользователя) ---
    function updateHeaderAuth() {
        const authBlock = document.getElementById('authBlock');
        const currentUser = DB.getCurrentUser();

        if (currentUser && authBlock) {
            // Проверяем наличие аватарки у пользователя, иначе используем стандартный SVG
            const avatarHtml = currentUser.avatar
                ? `<img src="${currentUser.avatar}" alt="${currentUser.name}" class="profile-avatar-img" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-blue);">`
                : `<svg class="profile-svg-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                   </svg>`;

            authBlock.innerHTML = `
                <a href="profiles.html" class="profile-avatar-link" title="Личный кабинет">
                    ${avatarHtml}
                </a>
            `;
        } else if (authBlock) {
            authBlock.innerHTML = `<button class="nav-login-btn open-auth-btn" id="headerAuthBtn">Войти</button>`;
            const newBtn = authBlock.querySelector('.open-auth-btn');
            if (newBtn) {
                newBtn.addEventListener('click', () => {
                    if (authOverlay) {
                        authOverlay.classList.add('active');
                        document.body.classList.add('modal-open');
                        if (loginSection) loginSection.classList.add('active');
                        if (registerSection) registerSection.classList.remove('active');
                    }
                });
            }
        }
    }

    // --- 7. УВЕДОМЛЕНИЯ (ТОЛЬКО РУЧНОЕ ЗАКРЫТИЕ) ---
    const notificationModal = document.getElementById('notificationModal');
    const closeNotificationBtn = document.getElementById('closeNotificationBtn');
    const okNotificationBtn = document.getElementById('okNotificationBtn');

    window.showNotification = function (title, message, icon = '✓', type = 'success') {
        const nIcon = document.getElementById('notificationIcon');
        const nTitle = document.getElementById('notificationTitle');
        const nMessage = document.getElementById('notificationMessage');

        if (nIcon) {
            nIcon.textContent = icon;
            if (type === 'error') {
                nIcon.style.color = '#ef4444';
            } else if (type === 'warning') {
                nIcon.style.color = '#f59e0b';
            } else {
                nIcon.style.color = 'var(--accent-blue)';
            }
        }

        if (nTitle) nTitle.textContent = title;
        if (nMessage) nMessage.textContent = message;

        if (notificationModal) {
            notificationModal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    };

    function hideNotification() {
        if (notificationModal) {
            notificationModal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    if (closeNotificationBtn) closeNotificationBtn.addEventListener('click', hideNotification);
    if (okNotificationBtn) okNotificationBtn.addEventListener('click', hideNotification);
    if (notificationModal) {
        notificationModal.addEventListener('click', (e) => {
            if (e.target === notificationModal) hideNotification();
        });
    }

    // --- 8. ГАЛЕРЕЯ / СЛАЙДЕР С ЛАЙТБОКСОМ ---
    const slideItems = document.querySelectorAll('.slide-item');
    const sliderTrack = document.querySelector('.slider-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const galleryPreviews = document.getElementById('galleryPreviews');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');

    let currentGalleryIndex = 0;
    const sliderImages = document.querySelectorAll('.gallery-img');

    if (galleryPreviews && sliderImages.length > 0) {
        galleryPreviews.innerHTML = "";
        sliderImages.forEach((img, idx) => {
            const card = document.createElement('div');
            card.className = `preview-card ${idx === 0 ? 'active' : ''}`;
            card.innerHTML = `<img src="${img.src}" alt="Превью">`;
            card.addEventListener('click', () => {
                currentGalleryIndex = idx;
                updateGallerySlider();
            });
            galleryPreviews.appendChild(card);
        });
    }

    function updateGallerySlider() {
        if (!sliderTrack || slideItems.length === 0) return;
        const width = slideItems[0].clientWidth;
        sliderTrack.style.transform = `translateX(-${currentGalleryIndex * width}px)`;

        const previews = document.querySelectorAll('.preview-card');
        previews.forEach((p, idx) => {
            if (idx === currentGalleryIndex) p.classList.add('active');
            else p.classList.remove('active');
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (slideItems.length === 0) return;
            currentGalleryIndex = (currentGalleryIndex + 1) % slideItems.length;
            updateGallerySlider();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (slideItems.length === 0) return;
            currentGalleryIndex = (currentGalleryIndex - 1 + slideItems.length) % slideItems.length;
            updateGallerySlider();
        });
    }

    sliderImages.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            currentGalleryIndex = index;
            updateGallerySlider();

            if (!lightbox || !lightboxImg) return;
            lightboxImg.src = item.src;
            lightbox.classList.add('active');
            document.body.classList.add('modal-open');
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            if (lightbox) lightbox.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    }

    // Инициализация
    updateHeaderAuth();

    // Слайдер героя
    let currentSlide = 0;
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 1) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
    }
})

;