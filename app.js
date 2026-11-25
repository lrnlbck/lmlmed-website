document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Navbar Scroll State & Progress Bar ──
    const navbar = document.getElementById('navbar');
    const scrollProgress = document.getElementById('scroll-progress');

    function updateScrollUI() {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, (scrollY / docHeight) * 100) : 0;

        if (scrollProgress) scrollProgress.style.width = `${pct}%`;
        if (navbar) navbar.classList.toggle('scrolled', scrollY > 24);
    }

    window.addEventListener('scroll', updateScrollUI, { passive: true });
    updateScrollUI();

    // ── 2. Mobile Drawer ──
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');

    if (mobileMenuBtn && mobileDrawer) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileDrawer.classList.toggle('open');
            mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
            mobileDrawer.setAttribute('aria-hidden', String(!isOpen));
            mobileMenuBtn.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });

        mobileDrawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileDrawer.classList.remove('open');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileDrawer.setAttribute('aria-hidden', 'true');
                mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }

    // ── 3. Ambient Mesh Mouse Tracking ──
    const mesh = document.querySelector('.mesh-background');
    if (mesh && window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            mesh.style.background = `
                radial-gradient(circle at ${x}% ${y}%, rgba(5, 87, 227, 0.16) 0%, transparent 44%),
                radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(194, 97, 72, 0.12) 0%, transparent 44%)
            `;
        }, { passive: true });
    }

    // ── 4. 3D Tilt Effect on Podcast Cover ──
    const coverTilt = document.getElementById('hero-cover-tilt');
    if (coverTilt && window.matchMedia('(pointer: fine)').matches) {
        coverTilt.addEventListener('mousemove', (e) => {
            const rect = coverTilt.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            const rotateY = (px - 0.5) * 16;
            const rotateX = (0.5 - py) * 16;

            coverTilt.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            coverTilt.style.setProperty('--mx', `${px * 100}%`);
            coverTilt.style.setProperty('--my', `${py * 100}%`);
        });

        coverTilt.addEventListener('mouseleave', () => {
            coverTilt.style.transform = '';
        });
    }

    // ── 5. Scroll Reveal Observer ──
    const revealEls = document.querySelectorAll('.reveal-up');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });

        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in-view'));
    }

    // ── 6. Episode Cards Glow, Search, Filter & View Toggle ──
    const episodeCards = Array.from(document.querySelectorAll('.episode-card'));
    const searchInput = document.getElementById('episode-search');
    const filterPills = document.querySelectorAll('.filter-pill');
    const viewBtns = document.querySelectorAll('.view-btn');
    const episodesGrid = document.getElementById('episodes-grid');
    const episodeCount = document.getElementById('episode-count');
    const episodesEmpty = document.getElementById('episodes-empty');

    let currentFilter = 'all';
    let currentQuery = '';

    episodeCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    function filterEpisodes() {
        let visible = 0;
        const q = currentQuery.trim().toLowerCase();

        episodeCards.forEach(card => {
            const cat = card.dataset.category || '';
            const title = (card.dataset.title || '').toLowerCase();
            const ep = (card.dataset.ep || '').toLowerCase();
            const text = card.textContent.toLowerCase();

            const matchesFilter = currentFilter === 'all' || cat === currentFilter;
            const matchesQuery = !q || title.includes(q) || ep.includes(q) || text.includes(q);

            const show = matchesFilter && matchesQuery;
            card.classList.toggle('hidden', !show);
            if (show) visible++;
        });

        if (episodeCount) episodeCount.textContent = `${visible} / ${episodeCards.length}`;
        if (episodesEmpty) episodesEmpty.classList.toggle('hidden', visible > 0);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentQuery = e.target.value;
            filterEpisodes();
        });
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter || 'all';
            filterEpisodes();
        });
    });

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (episodesGrid) {
                episodesGrid.classList.toggle('list-view', btn.dataset.view === 'list');
            }
        });
    });

    // ── 7. DSGVO-Friendly Spotify Embed Toggle ──
    const togglePlayerBtn = document.getElementById('toggle-spotify-embed');
    const embedBox = document.getElementById('spotify-embed-box');
    const closeEmbedBtn = document.getElementById('close-spotify-embed');
    const embedMount = document.getElementById('spotify-iframe-mount');

    function mountSpotifyPlayer() {
        if (!embedMount.hasChildNodes()) {
            const iframe = document.createElement('iframe');
            iframe.style.borderRadius = '12px';
            iframe.src = 'https://open.spotify.com/embed/show/2a0V5gKPb2GrG680q5iMPc?utm_source=generator&theme=0';
            iframe.width = '100%';
            iframe.height = '152';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.loading = 'lazy';
            iframe.title = 'NOTSAN-HELP Spotify Web-Player';
            embedMount.appendChild(iframe);
        }
    }

    if (togglePlayerBtn && embedBox) {
        togglePlayerBtn.addEventListener('click', () => {
            const willOpen = embedBox.classList.contains('hidden');
            if (willOpen) {
                mountSpotifyPlayer();
                embedBox.classList.remove('hidden');
                togglePlayerBtn.querySelector('span').textContent = 'Web-Player ausblenden';
            } else {
                embedBox.classList.add('hidden');
                togglePlayerBtn.querySelector('span').textContent = 'Web-Player einblenden';
            }
        });
    }

    if (closeEmbedBtn && embedBox && togglePlayerBtn) {
        closeEmbedBtn.addEventListener('click', () => {
            embedBox.classList.add('hidden');
            togglePlayerBtn.querySelector('span').textContent = 'Web-Player einblenden';
        });
    }

    // ── 8. Toast Notification & Clipboard Helpers ──
    const toastEl = document.getElementById('toast');
    let toastTimer = null;

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
    }

    async function copyToClipboard(text, successMsg) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(successMsg);
        } catch {
            showToast(`Link: ${text}`);
        }
    }

    document.querySelectorAll('.share-ep-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            const title = btn.dataset.title || 'Episode';
            if (url) copyToClipboard(url, `Link zu "${title}" kopiert!`);
        });
    });

    // ── 9. Email Obfuscation & Copy Email ──
    let resolvedEmail = '';
    document.querySelectorAll('.protected-email').forEach(el => {
        const user = el.getAttribute('data-u');
        const domain = el.getAttribute('data-d');
        if (user && domain) {
            resolvedEmail = `${user}@${domain}`;
            if (el.tagName.toLowerCase() === 'a') {
                el.href = `mailto:${resolvedEmail}`;
            }
            el.textContent = resolvedEmail;
            el.removeAttribute('data-u');
            el.removeAttribute('data-d');
        }
    });

    const copyEmailBtn = document.getElementById('copy-email-btn');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', () => {
            if (resolvedEmail) {
                copyToClipboard(resolvedEmail, `E-Mail "${resolvedEmail}" kopiert!`);
            }
        });
    }

    // ── 10. Command Palette (⌘K / Ctrl+K) ──
    const cmdOverlay = document.getElementById('cmd-overlay');
    const cmdTrigger = document.getElementById('cmd-trigger');
    const cmdClose = document.getElementById('cmd-close');
    const cmdInput = document.getElementById('cmd-input');
    const cmdResults = document.getElementById('cmd-results');

    const cmdItems = [
        { icon: 'fa-solid fa-microphone-lines', title: 'NOTSAN-HELP Podcast', desc: 'Zur Podcast-Übersicht springen', action: () => location.hash = '#podcast' },
        { icon: 'fa-solid fa-list-ul', title: 'Alle 11 Episoden', desc: 'Episodenliste durchsuchen & filtern', action: () => location.hash = '#episoden' },
        { icon: 'fa-solid fa-chalkboard-user', title: 'Dozent & Qualifikationen', desc: 'Fortbildungen, ERC ALS, ITLS & Feuerwehr', action: () => location.hash = '#dozent' },
        { icon: 'fa-solid fa-folder-open', title: 'Kursunterlagen (/docs)', desc: 'Geschützter Downloadbereich für Kursteilnehmer', action: () => window.location.href = '/docs' },
        { icon: 'fa-brands fa-spotify', title: 'Spotify öffnen', desc: 'NOTSAN-HELP auf Spotify anhören', action: () => window.open('https://open.spotify.com/show/2a0V5gKPb2GrG680q5iMPc', '_blank', 'noopener,noreferrer') },
        { icon: 'fa-solid fa-podcast', title: 'Apple Podcasts öffnen', desc: 'NOTSAN-HELP auf Apple Podcasts anhören', action: () => window.open('https://podcasts.apple.com/de/podcast/notsan-help/id1830853129', '_blank', 'noopener,noreferrer') },
        { icon: 'fa-regular fa-copy', title: 'Fortbildungs-E-Mail kopieren', desc: 'E-Mail-Adresse in die Zwischenablage kopieren', action: () => resolvedEmail && copyToClipboard(resolvedEmail, `E-Mail "${resolvedEmail}" kopiert!`) },
        { icon: 'fa-solid fa-shield-halved', title: 'Datenschutzerklärung', desc: 'DSGVO-Hinweise öffnen', action: () => window.location.href = 'datenschutz.html' },
        { icon: 'fa-solid fa-scale-balanced', title: 'Impressum', desc: 'Rechtliche Angaben öffnen', action: () => window.location.href = 'impressum.html' },
        ...episodeCards.map(card => ({
            icon: 'fa-solid fa-play',
            title: `Ep ${card.dataset.ep}: ${card.dataset.title}`,
            desc: 'Podcast-Folge auf Spotify öffnen',
            action: () => {
                const link = card.querySelector('.ep-platform-link.spotify');
                if (link) window.open(link.href, '_blank', 'noopener,noreferrer');
            }
        }))
    ];

    let selectedCmdIdx = 0;

    function renderCmdResults(query = '') {
        if (!cmdResults) return;
        const q = query.trim().toLowerCase();
        const filtered = cmdItems.filter(item =>
            !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
        ).slice(0, 8);

        selectedCmdIdx = 0;
        cmdResults.innerHTML = '';

        if (filtered.length === 0) {
            cmdResults.innerHTML = '<div style="padding:1.2rem;text-align:center;color:var(--clr-text-muted);">Keine Treffer gefunden</div>';
            return;
        }

        filtered.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `cmd-item${idx === 0 ? ' selected' : ''}`;
            div.innerHTML = `
                <i class="${item.icon}"></i>
                <div class="cmd-item-text">
                    <strong>${item.title}</strong>
                    <span>${item.desc}</span>
                </div>
            `;
            div.addEventListener('click', () => {
                item.action();
                closeCmdPalette();
            });
            cmdResults.appendChild(div);
        });
    }

    function openCmdPalette() {
        if (!cmdOverlay) return;
        cmdOverlay.classList.add('open');
        cmdOverlay.setAttribute('aria-hidden', 'false');
        if (cmdInput) {
            cmdInput.value = '';
            renderCmdResults('');
            setTimeout(() => cmdInput.focus(), 40);
        }
    }

    function closeCmdPalette() {
        if (!cmdOverlay) return;
        cmdOverlay.classList.remove('open');
        cmdOverlay.setAttribute('aria-hidden', 'true');
    }

    if (cmdTrigger) cmdTrigger.addEventListener('click', openCmdPalette);
    if (cmdClose) cmdClose.addEventListener('click', closeCmdPalette);
    if (cmdOverlay) {
        cmdOverlay.addEventListener('click', (e) => {
            if (e.target === cmdOverlay) closeCmdPalette();
        });
    }

    if (cmdInput) {
        cmdInput.addEventListener('input', (e) => renderCmdResults(e.target.value));
        cmdInput.addEventListener('keydown', (e) => {
            const items = cmdResults.querySelectorAll('.cmd-item');
            if (!items.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[selectedCmdIdx]?.classList.remove('selected');
                selectedCmdIdx = (selectedCmdIdx + 1) % items.length;
                items[selectedCmdIdx]?.classList.add('selected');
                items[selectedCmdIdx]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[selectedCmdIdx]?.classList.remove('selected');
                selectedCmdIdx = (selectedCmdIdx - 1 + items.length) % items.length;
                items[selectedCmdIdx]?.classList.add('selected');
                items[selectedCmdIdx]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                items[selectedCmdIdx]?.click();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (cmdOverlay?.classList.contains('open')) closeCmdPalette();
            else openCmdPalette();
        } else if (e.key === 'Escape') {
            closeCmdPalette();
        }
    });

    // ── 11. Cookie Banner Logic ──
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAcceptBtn = document.getElementById('cookie-accept');

    if (cookieBanner && cookieAcceptBtn) {
        if (!localStorage.getItem('cookie-accepted')) {
            setTimeout(() => cookieBanner.classList.remove('hidden'), 900);
        }
        cookieAcceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookie-accepted', 'true');
            cookieBanner.classList.add('hidden');
        });
    }
});
