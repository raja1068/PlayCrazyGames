// ========================================
// PLAYCRAZYGAMES - MAIN HUB JAVASCRIPT
// Version: 2.0 (9 Games)
// ========================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // 1. GAME NAVIGATION (REQUIRED)
    // ========================================
    const gameUrls = {
        snake: 'snake-game/index.html',
        tictactoe: 'tic-tac-toe/index.html',
        memory: 'memory-match/index.html',
        chess: 'chess-game/index.html',
        snakesladders: 'snakes-ladders/index.html',
        carrom: 'carrom-game/index.html',
        gunshooting: 'gun-shooting/index.html',
        ludo: 'ludo-game/index.html',
        checkers: 'checkers-game/index.html'
    };
    
    // Add click handlers to all play buttons
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = e.target.closest('.game-card');
            if (card && card.dataset.game) {
                const gameUrl = gameUrls[card.dataset.game];
                if (gameUrl) {
                    window.location.href = gameUrl;
                }
            }
        });
    });
    
    // Also make entire card clickable (optional)
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on button (already handled)
            if (!e.target.classList.contains('play-btn')) {
                const game = card.dataset.game;
                const gameUrl = gameUrls[game];
                if (gameUrl) {
                    window.location.href = gameUrl;
                }
            }
        });
    });
    
    // ========================================
    // 2. SEARCH FUNCTIONALITY (RECOMMENDED)
    // ========================================
    const searchInput = document.getElementById('gameSearch');
    const gameCounter = document.querySelector('.game-counter');
    let visibleGames = 9;
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.game-card');
            visibleGames = 0;
            
            cards.forEach(card => {
                const gameName = card.dataset.name;
                const gameDescription = card.querySelector('p')?.innerText.toLowerCase() || '';
                
                if (searchTerm === '' || gameName.includes(searchTerm) || gameDescription.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.4s ease';
                    visibleGames++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Update game counter
            if (gameCounter) {
                if (searchTerm === '') {
                    gameCounter.innerHTML = '🎮 9 Classic Games Available';
                } else {
                    gameCounter.innerHTML = `🔍 Found ${visibleGames} game${visibleGames !== 1 ? 's' : ''} matching "${searchTerm}"`;
                }
            }
        });
        
        // Clear search on Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.blur();
            }
        });
    }
    
    // ========================================
    // 3. DARK MODE TOGGLE (OPTIONAL)
    // ========================================
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check for saved preference
        const darkMode = localStorage.getItem('darkMode') === 'enabled';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }
        
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
            darkModeToggle.textContent = isDark ? '☀️' : '🌙';
        });
    }
    
    // ========================================
    // 4. ANIMATIONS & SCROLL EFFECTS (OPTIONAL)
    // ========================================
    // Reveal games on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // ========================================
    // 5. STATS COUNTER (OPTIONAL)
    // ========================================
    function animateCounter(element, target, duration = 2000) {
        if (!element) return;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString() + '+';
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString() + '+';
            }
        }, 16);
    }
    
    // Animate stats when they come into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElements = {
                    players: document.getElementById('statPlayers'),
                    games: document.getElementById('statGames'),
                    rating: document.getElementById('statRating')
                };
                
                if (statElements.players) animateCounter(statElements.players, 10000);
                if (statElements.games) animateCounter(statElements.games, 500000);
                if (statElements.rating) statElements.rating.textContent = '4.8/5';
                
                statsObserver.unobserve(entry.target);
            }
        });
    });
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) statsObserver.observe(statsSection);
    
    // ========================================
    // 6. MOBILE MENU (IF APPLICABLE)
    // ========================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            mobileMenuBtn.textContent = navLinks.classList.contains('show') ? '✕' : '☰';
        });
    }
    
    // ========================================
    // 7. LOADING & PERFORMANCE
    // ========================================
    // Show loading state for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
    });
    
    // Lazy load game cards if many
    if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
            img.loading = 'lazy';
        });
    }
    
    // ========================================
    // 8. ERROR HANDLING
    // ========================================
    window.addEventListener('error', (e) => {
        console.error('PlayCrazyGames Error:', e.error);
        // Optional: send to analytics
    });
    
    // ========================================
    // 9. PWA INSTALL PROMPT (OPTIONAL)
    // ========================================
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'block';
    });
    
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('PWA installed');
                }
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });
    }
    
    // ========================================
    // 10. ANALYTICS (OPTIONAL)
    // ========================================
    function trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
        console.log(`Analytics: ${category} - ${action} - ${label}`);
    }
    
    // Track game clicks
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.game-card');
            if (card) {
                trackEvent('Game', 'Play', card.dataset.game);
            }
        });
    });
    
    // Track search usage
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            trackEvent('Search', 'Query', searchInput.value);
        });
    }
    
    // Console log for developers
    console.log('🎮 PlayCrazyGames Loaded Successfully!');
    console.log('📱 9 Games Ready | PWA Enabled | Offline Support');
    
}); // End DOMContentLoaded
