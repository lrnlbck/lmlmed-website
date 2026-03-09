document.addEventListener('DOMContentLoaded', () => {
    const layout = document.querySelector('.split-layout');
    const splitPodcast = document.getElementById('split-podcast');
    const splitDozent = document.getElementById('split-dozent');

    const contentPodcast = document.getElementById('content-podcast');
    const contentDozent = document.getElementById('content-dozent');

    const btnExplorePodcast = splitPodcast.querySelector('.btn-explore');
    const btnExploreDozent = splitDozent.querySelector('.btn-explore');

    const navLinkPodcast = document.getElementById('link-podcast');
    const navLinkDozent = document.getElementById('link-dozent');

    const backButtons = document.querySelectorAll('.btn-back');

    function openPodcast() {
        layout.classList.add('is-focused');
        splitPodcast.classList.add('focused');
        splitPodcast.classList.remove('minimized');

        splitDozent.classList.add('minimized');
        splitDozent.classList.remove('focused');

        // Delay showing content slightly for the slider animation
        setTimeout(() => {
            contentPodcast.classList.add('active');
            contentDozent.classList.remove('active');
        }, 400);
    }

    function openDozent() {
        layout.classList.add('is-focused');
        splitDozent.classList.add('focused');
        splitDozent.classList.remove('minimized');

        splitPodcast.classList.add('minimized');
        splitPodcast.classList.remove('focused');

        setTimeout(() => {
            contentDozent.classList.add('active');
            contentPodcast.classList.remove('active');
        }, 400);
    }

    function resetLayout() {
        // Hide content first
        contentPodcast.classList.remove('active');
        contentDozent.classList.remove('active');

        // Then reverse the slider
        setTimeout(() => {
            layout.classList.remove('is-focused');
            splitPodcast.classList.remove('focused', 'minimized');
            splitDozent.classList.remove('focused', 'minimized');
        }, 300); // Wait for content fade out
    }

    // Event Listeners
    btnExplorePodcast.addEventListener('click', openPodcast);
    btnExploreDozent.addEventListener('click', openDozent);

    navLinkPodcast.addEventListener('click', (e) => {
        e.preventDefault();
        openPodcast();
    });

    navLinkDozent.addEventListener('click', (e) => {
        e.preventDefault();
        openDozent();
    });

    backButtons.forEach(btn => {
        btn.addEventListener('click', resetLayout);
    });

    // Add subtle hover effects to mesh background tracking mouse
    const mesh = document.querySelector('.mesh-background');
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        mesh.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(5, 87, 227, 0.15) 0%, transparent 40%),
                                 radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(194, 97, 72, 0.1) 0%, transparent 40%)`;
    });

    // Cookie Banner Logic
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAcceptBtn = document.getElementById('cookie-accept');

    if (cookieBanner && cookieAcceptBtn) {
        // Check if cookie was already accepted
        if (!localStorage.getItem('cookie-accepted')) {
            // Wait a small moment, then slide it in
            setTimeout(() => {
                cookieBanner.classList.remove('hidden');
            }, 1000);
        }

        cookieAcceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookie-accepted', 'true');
            cookieBanner.classList.add('hidden');
        });
    }

    // Episode Cards Mouse-Tracking Glow Effect
    const episodeCards = document.querySelectorAll('.episode-card');
    episodeCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Email Security / Obfuscation
    const protectedEmails = document.querySelectorAll('.protected-email');
    protectedEmails.forEach(el => {
        const user = el.getAttribute('data-u');
        const domain = el.getAttribute('data-d');
        if (user && domain) {
            const email = `${user}@${domain}`;
            if (el.tagName.toLowerCase() === 'a') {
                el.href = `mailto:${email}`;
            }
            el.textContent = email;
            el.removeAttribute('data-u');
            el.removeAttribute('data-d');
        }
    });

    // Contact Modal Logic
    const contactModalOverlay = document.getElementById('contact-modal-overlay');
    const btnOpenContact = document.getElementById('open-contact-modal');
    const btnCloseContact = document.getElementById('close-contact-modal');
    const contactForm = document.getElementById('contact-form');
    const captchaText = document.getElementById('captcha-text');
    const captchaExpected = document.getElementById('captcha-expected');
    const captchaInput = document.getElementById('contact-captcha');
    const formFeedback = document.getElementById('form-feedback');

    // Generate Math Captcha
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        captchaText.textContent = `Was ist ${num1} + ${num2}?`;
        captchaExpected.value = num1 + num2;
        captchaInput.value = '';
    }

    if (btnOpenContact && contactModalOverlay) {
        btnOpenContact.addEventListener('click', (e) => {
            e.preventDefault();
            generateCaptcha();
            formFeedback.style.display = 'none';
            contactModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        // Close on X button
        btnCloseContact.addEventListener('click', (e) => {
            e.preventDefault();
            contactModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close on clicking outside the modal
        contactModalOverlay.addEventListener('click', (e) => {
            if (e.target === contactModalOverlay) {
                contactModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Form Submission
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check captcha first
            if (captchaInput.value !== captchaExpected.value) {
                showFeedback('Captcha ist inkorrekt. Bitte versuche es erneut.', 'error');
                generateCaptcha();
                return;
            }

            const btnSubmit = document.getElementById('contact-submit-btn');
            const originalBtnHtml = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Senden...';
            btnSubmit.disabled = true;

            const payload = {
                name: document.getElementById('contact-name').value,
                organization: document.getElementById('contact-org').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                message: document.getElementById('contact-message').value,
                captchaResult: captchaInput.value,
                captchaExpected: captchaExpected.value
            };

            try {
                // Determine if we're running locally with Node vs GitHub Pages
                // In a production setup with GitHub pages, this API endpoint would need to be 
                // hosted somewhere else (e.g. Vercel, Railway, Heroku) since GH Pages is static.
                // Assuming the user runs the Node server we created next to the files for now or deploys it.
                
                // Use relative path so it defaults to same domain:port
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    throw new Error('Der Server für die E-Mail Verarbeitung wurde noch nicht eingerichtet oder ist offline.');
                }

                if (response.ok && data.success) {
                    showFeedback('Deine Anfrage wurde erfolgreich versendet! Du erhältst in Kürze eine Bestätigung.', 'success');
                    contactForm.reset();
                    generateCaptcha();
                    
                    setTimeout(() => {
                        contactModalOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }, 4000);
                } else {
                    throw new Error(data?.message || 'Ein Fehler ist aufgetreten.');
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                // Also show success locally if API isn't running but we want to simulate for testing
                // Remove this in production if the server is properly hosted
                if(error.message.includes('Failed to fetch')) {
                   showFeedback('Fehler: Der E-Mail-Server ist aktuell nicht erreichbar. Bitte versuche es später noch einmal oder schreibe direkt eine E-Mail.', 'error');   
                } else {
                   showFeedback(error.message, 'error');
                }
            } finally {
                btnSubmit.innerHTML = originalBtnHtml;
                btnSubmit.disabled = false;
            }
        });
    }

    function showFeedback(msg, type) {
        formFeedback.style.display = ''; // Clear inline display:none
        formFeedback.textContent = msg;
        formFeedback.className = 'form-status ' + type;
    }
});

