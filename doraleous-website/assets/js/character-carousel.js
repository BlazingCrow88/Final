/* ===================================
   SIMPLIFIED CHARACTER CAROUSEL FOR DORALEOUS
   File: assets/js/character-carousel.js
   =================================== */

(function() {
    'use strict';

    // Doraleous character data
    const CHARACTERS = [
        {
            id: 'doraleous',
            name: 'Doraleous',
            title: 'The Fearless Leader',
            description: 'A brave and determined warrior who leads his band of mercenaries with unwavering courage and tactical brilliance.',
            image: 'assets/images/characters/doraleous-portrait.jpg',
            attributes: {
                strength: 9,
                magic: 6,
                wisdom: 8,
                agility: 7
            },
            skills: ['Leadership', 'Swordsmanship', 'Strategy', 'Courage'],
            quote: 'For glory and honor, we shall prevail!',
            background: 'Once a simple blacksmith\'s son, Doraleous discovered his destiny when ancient evil threatened his homeland.'
        },
        {
            id: 'neebs',
            name: 'Neebs',
            title: 'The Loyal Archer',
            description: 'A skilled marksman with a heart of gold, Neebs provides both comic relief and deadly accuracy when needed.',
            image: 'assets/images/characters/neebs-portrait.jpg',
            attributes: {
                strength: 6,
                magic: 4,
                wisdom: 7,
                agility: 9
            },
            skills: ['Archery', 'Tracking', 'Humor', 'Loyalty'],
            quote: 'I never miss when it really counts!',
            background: 'A former village hunter who joined Doraleous after his town was saved from bandits.'
        },
        {
            id: 'simon',
            name: 'Simon',
            title: 'The Wise Mage',
            description: 'Master of arcane arts and ancient knowledge, Simon wields powerful magic to aid his companions.',
            image: 'assets/images/characters/simon-portrait.jpg',
            attributes: {
                strength: 5,
                magic: 10,
                wisdom: 9,
                agility: 6
            },
            skills: ['Spellcasting', 'Ancient Lore', 'Alchemy', 'Mentoring'],
            quote: 'Magic is not just power, but responsibility.',
            background: 'A former scholar of the Crystal Academy who left to seek practical application of magical knowledge.'
        },
        {
            id: 'appsro',
            name: 'Appsro',
            title: 'The Fierce Warrior',
            description: 'A formidable fighter with unmatched strength and dedication to protecting his friends.',
            image: 'assets/images/characters/appsro-portrait.jpg',
            attributes: {
                strength: 10,
                magic: 3,
                wisdom: 6,
                agility: 8
            },
            skills: ['Combat', 'Protection', 'Intimidation', 'Endurance'],
            quote: 'Stand behind me, I\'ll handle this!',
            background: 'A veteran gladiator who earned his freedom and now fights for a cause greater than glory.'
        }
    ];

    let currentIndex = 0;
    let isAutoPlaying = true;
    let autoPlayInterval = null;
    let currentModal = null;

    // Initialize character carousel
    function init() {
        createCharacterCarousel();
        setupNavigation();
        setupCharacterModal();
        startAutoPlay();
        setupKeyboardNavigation();
    }

    // Create the character carousel HTML
    function createCharacterCarousel() {
        const container = document.querySelector('.character-showcase') || document.querySelector('#character-showcase');
        if (!container) return;

        const carouselHTML = `
            <div class="character-carousel-container">
                <div class="character-carousel-header">
                    <h2>Meet the Associates</h2>
                    <p>Discover the heroes who stand beside Doraleous in his epic adventures</p>
                </div>
                
                <div class="character-carousel-wrapper">
                    <button class="carousel-nav prev" id="prevChar" aria-label="Previous character">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <div class="character-carousel-track" id="characterTrack">
                        ${CHARACTERS.map((character, index) => createCharacterCard(character, index)).join('')}
                    </div>
                    
                    <button class="carousel-nav next" id="nextChar" aria-label="Next character">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="character-carousel-indicators">
                    ${CHARACTERS.map((_, index) => 
                        `<button class="indicator ${index === 0 ? 'active' : ''}" 
                                data-index="${index}" 
                                aria-label="Go to character ${index + 1}"></button>`
                    ).join('')}
                </div>
                
                <div class="carousel-controls">
                    <button class="control-btn" id="playPauseBtn" aria-label="Pause autoplay">
                        <i class="fas fa-pause"></i>
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = carouselHTML;
        updateCarouselPosition();
    }

    // Create individual character card
    function createCharacterCard(character, index) {
        return `
            <div class="character-card ${index === 0 ? 'active' : ''}" 
                 data-character-id="${character.id}" 
                 data-index="${index}"
                 role="button" 
                 tabindex="0"
                 aria-label="View details for ${character.name}">
                
                <div class="character-image">
                    <img src="${character.image}" alt="Portrait of ${character.name}" loading="lazy">
                    <div class="character-overlay">
                        <span class="view-details">View Details</span>
                    </div>
                </div>
                
                <div class="character-info">
                    <h3 class="character-name">${character.name}</h3>
                    <p class="character-title">${character.title}</p>
                    <p class="character-description">${character.description}</p>
                    
                    <div class="character-skills">
                        ${character.skills.slice(0, 2).map(skill => 
                            `<span class="skill-tag">${skill}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Setup navigation controls
    function setupNavigation() {
        const prevBtn = document.getElementById('prevChar');
        const nextBtn = document.getElementById('nextChar');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const indicators = document.querySelectorAll('.indicator');

        if (prevBtn) prevBtn.addEventListener('click', () => changeCharacter(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => changeCharacter(1));
        if (playPauseBtn) playPauseBtn.addEventListener('click', toggleAutoPlay);

        // Indicator navigation
        indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const index = parseInt(indicator.dataset.index);
                goToCharacter(index);
            });
        });

        // Character card clicks
        document.addEventListener('click', (e) => {
            const characterCard = e.target.closest('.character-card');
            if (characterCard) {
                const characterId = characterCard.dataset.characterId;
                openCharacterModal(characterId);
            }
        });

        // Pause on hover
        const carousel = document.querySelector('.character-carousel-wrapper');
        if (carousel) {
            carousel.addEventListener('mouseenter', pauseAutoPlay);
            carousel.addEventListener('mouseleave', resumeAutoPlay);
        }
    }

    // Setup keyboard navigation
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Character card keyboard interaction
            if (e.target.closest('.character-card')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const characterId = e.target.closest('.character-card').dataset.characterId;
                    openCharacterModal(characterId);
                }
            }

            // Global carousel navigation
            if (e.key === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                changeCharacter(-1);
            }
            if (e.key === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                changeCharacter(1);
            }
        });
    }

    // Change character (next/previous)
    function changeCharacter(direction) {
        currentIndex += direction;
        
        if (currentIndex >= CHARACTERS.length) {
            currentIndex = 0;
        } else if (currentIndex < 0) {
            currentIndex = CHARACTERS.length - 1;
        }
        
        updateCarouselPosition();
        updateActiveIndicator();
    }

    // Go to specific character
    function goToCharacter(index) {
        currentIndex = index;
        updateCarouselPosition();
        updateActiveIndicator();
    }

    // Update carousel position
    function updateCarouselPosition() {
        const track = document.getElementById('characterTrack');
        const cards = document.querySelectorAll('.character-card');
        
        if (!track || !cards.length) return;

        // Update transform
        const translateX = -currentIndex * 100;
        track.style.transform = `translateX(${translateX}%)`;

        // Update active states
        cards.forEach((card, index) => {
            card.classList.toggle('active', index === currentIndex);
        });
    }

    // Update active indicator
    function updateActiveIndicator() {
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    // Auto-play functionality
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        
        autoPlayInterval = setInterval(() => {
            if (isAutoPlaying) {
                changeCharacter(1);
            }
        }, 4000);
    }

    function pauseAutoPlay() {
        isAutoPlaying = false;
    }

    function resumeAutoPlay() {
        isAutoPlaying = true;
    }

    function toggleAutoPlay() {
        isAutoPlaying = !isAutoPlaying;
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn?.querySelector('i');
        
        if (icon) {
            icon.className = isAutoPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
        
        if (playPauseBtn) {
            playPauseBtn.setAttribute('aria-label', isAutoPlaying ? 'Pause autoplay' : 'Resume autoplay');
        }
    }

    // Character modal functionality
    function setupCharacterModal() {
        createModalHTML();
        
        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('character-modal')) {
                closeCharacterModal();
            }
            if (e.target.classList.contains('modal-close')) {
                closeCharacterModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && currentModal) {
                closeCharacterModal();
            }
        });
    }

    function createModalHTML() {
        const modalHTML = `
            <div class="character-modal" id="characterModal">
                <div class="character-modal-content">
                    <button class="modal-close" aria-label="Close character details">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-body" id="modalBody">
                        <!-- Content populated dynamically -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function openCharacterModal(characterId) {
        const character = CHARACTERS.find(c => c.id === characterId);
        if (!character) return;

        const modal = document.getElementById('characterModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        // Populate modal content
        modalBody.innerHTML = createModalContent(character);
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentModal = modal;

        // Pause autoplay
        pauseAutoPlay();

        // Focus management
        setTimeout(() => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) closeBtn.focus();
        }, 100);

        // Track character view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'character_view', {
                character_name: character.name,
                event_category: 'engagement'
            });
        }
    }

    function closeCharacterModal() {
        const modal = document.getElementById('characterModal');
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentModal = null;

        // Resume autoplay
        resumeAutoPlay();
    }

    function createModalContent(character) {
        return `
            <div class="modal-character-header">
                <div class="modal-character-image">
                    <img src="${character.image}" alt="Portrait of ${character.name}">
                </div>
                <div class="modal-character-info">
                    <h2>${character.name}</h2>
                    <p class="character-title">${character.title}</p>
                    <blockquote class="character-quote">
                        "${character.quote}"
                    </blockquote>
                </div>
            </div>

            <div class="modal-character-description">
                <h3>Background</h3>
                <p>${character.background}</p>
            </div>

            <div class="modal-character-attributes">
                <h3>Attributes</h3>
                <div class="attributes-grid">
                    ${Object.entries(character.attributes).map(([attr, value]) => `
                        <div class="attribute-item">
                            <span class="attribute-name">${attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                            <div class="attribute-bar">
                                <div class="attribute-fill" style="width: ${value * 10}%"></div>
                            </div>
                            <span class="attribute-value">${value}/10</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="modal-character-skills">
                <h3>Skills & Abilities</h3>
                <div class="skills-grid">
                    ${character.skills.map(skill => `
                        <span class="skill-badge">${skill}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Public API
    window.CharacterCarousel = {
        init: init,
        goToCharacter: goToCharacter,
        openModal: openCharacterModal,
        closeModal: closeCharacterModal,
        getCharacter: (id) => CHARACTERS.find(c => c.id === id)
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
