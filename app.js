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
});
