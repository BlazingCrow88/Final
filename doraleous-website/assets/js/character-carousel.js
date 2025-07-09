/* ===================================
   CHARACTER CAROUSEL FUNCTIONALITY
   File: assets/js/character-carousel.js
   =================================== */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        pagination: {
            clickable: true,
            dynamicBullets: true
        },
        navigation: {
            hideOnClick: false
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 20
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 30
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 40
            },
            1400: {
                slidesPerView: 4,
                spaceBetween: 50
            }
        },
        accessibility: {
            prevSlideMessage: 'Previous character',
            nextSlideMessage: 'Next character',
            paginationBulletMessage: 'Go to character {{index}}'
        }
    };

    // State variables
    let swiperInstance = null;
    let characterModal = null;
    let currentCharacterData = null;
    let isAutoplayPaused = false;

    // Character data (this would typically come from a CMS or API)
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
            quote: 'For glory and honor, we shall prevail!'
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
            quote: 'I never miss when it really counts!'
        },
        {
            id: 'simon',
            name: 'Simon',
            title: 'The Wise Mage',
            description: 'Master of arcane arts and ancient knowledge, Simon wields powerful magic to aid his companions in their quests.',
            image: 'assets/images/characters/simon-portrait.jpg',
            attributes: {
                strength: 5,
                magic: 10,
                wisdom: 9,
                agility: 6
            },
            skills: ['Spellcasting', 'Ancient Lore', 'Alchemy', 'Mentoring'],
            quote: 'Magic is not just power, but responsibility.'
        },
        {
            id: 'appsro',
            name: 'Appsro',
            title: 'The Fierce Warrior',
            description: 'A formidable fighter with unmatched strength and an unwavering dedication to protecting his friends.',
            image: 'assets/images/characters/appsro-portrait.jpg',
            attributes: {
                strength: 10,
                magic: 3,
                wisdom: 6,
                agility: 8
            },
            skills: ['Combat', 'Protection', 'Intimidation', 'Endurance'],
            quote: 'Stand behind me, I\'ll handle this!'
        },
        {
            id: 'drak',
            name: 'Drak',
            title: 'The Shadow Rogue',
            description: 'Master of stealth and subterfuge, Drak excels at gathering information and striking from the shadows.',
            image: 'assets/images/characters/drak-portrait.jpg',
            attributes: {
                strength: 7,
                magic: 5,
                wisdom: 8,
                agility: 10
            },
            skills: ['Stealth', 'Lockpicking', 'Investigation', 'Acrobatics'],
            quote: 'Information is the deadliest weapon.'
        }
    ];

    // Initialize character carousel
    function init() {
        setupCharacterCarousel();
        setupCharacterModal();
        setupCharacterInteractions();
        setupAccessibility();
        loadCharacterData();
    }

    // Setup main character carousel
    function setupCharacterCarousel() {
        const carouselContainer = document.querySelector('.character-carousel .swiper-container');
        
        if (!carouselContainer) {
            console.warn('Character carousel container not found');
            return;
        }

        // Initialize Swiper carousel
        swiperInstance = new Swiper(carouselContainer, {
            // Basic settings
            loop: true,
            centeredSlides: false,
            grabCursor: true,
            
            // Responsive breakpoints
            breakpoints: CONFIG.breakpoints,
            
            // Autoplay
            autoplay: CONFIG.autoplay,
            
            // Pagination
            pagination: {
                el: '.swiper-pagination',
                ...CONFIG.pagination
            },
            
            // Navigation
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
                ...CONFIG.navigation
            },
            
            // Accessibility
            a11y: CONFIG.accessibility,
            
            // Effects
            effect: 'slide',
            speed: 600,
            
            // Events
            on: {
                init: onCarouselInit,
                slideChange: onSlideChange,
                autoplayStart: onAutoplayStart,
                autoplayStop: onAutoplayStop
            }
        });

        // Setup pause on hover
        if (CONFIG.autoplay.pauseOnMouseEnter) {
            carouselContainer.addEventListener('mouseenter', pauseAutoplay);
            carouselContainer.addEventListener('mouseleave', resumeAutoplay);
        }
    }

    // Setup character modal functionality
    function setupCharacterModal() {
        // Create modal if it doesn't exist
        if (!document.querySelector('.character-modal')) {
            createCharacterModal();
        }

        characterModal = document.querySelector('.character-modal');
        
        if (characterModal) {
            const closeButton = characterModal.querySelector('.character-modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', closeCharacterModal);
            }

            // Close on overlay click
            characterModal.addEventListener('click', (e) => {
                if (e.target === characterModal) {
                    closeCharacterModal();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && characterModal.classList.contains('active')) {
                    closeCharacterModal();
                }
            });
        }
    }

    // Setup character interactions
    function setupCharacterInteractions() {
        // Add click handlers to character cards
        document.addEventListener('click', (e) => {
            const characterCard = e.target.closest('.character-card');
            if (characterCard) {
                const characterId = characterCard.dataset.characterId;
                if (characterId) {
                    openCharacterModal(characterId);
                }
            }
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.character-card')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const characterId = e.target.closest('.character-card').dataset.characterId;
                    if (characterId) {
                        openCharacterModal(characterId);
                    }
                }
            }
        });
    }

    // Setup accessibility features
    function setupAccessibility() {
        // Add ARIA labels and roles
        const characterCards = document.querySelectorAll('.character-card');
        characterCards.forEach((card, index) => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `View details for character ${index + 1}`);
        });

        // Add screen reader announcements
        if (swiperInstance) {
            swiperInstance.on('slideChange', () => {
                announceSlideChange();
            });
        }
    }

    // Load character data into carousel
    function loadCharacterData() {
        CHARACTERS.forEach((character, index) => {
            const slide = document.querySelector(`[data-character-id="${character.id}"]`);
            if (slide) {
                populateCharacterCard(slide, character);
            }
        });
    }

    // Populate character card with data
    function populateCharacterCard(card, character) {
        const nameElement = card.querySelector('.character-name');
        const titleElement = card.querySelector('.character-title');
        const descriptionElement = card.querySelector('.character-description');
        const imageElement = card.querySelector('.character-portrait img');
        const skillsContainer = card.querySelector('.character-skills');

        if (nameElement) nameElement.textContent = character.name;
        if (titleElement) titleElement.textContent = character.title;
        if (descriptionElement) descriptionElement.textContent = character.description;
        if (imageElement) {
            imageElement.src = character.image;
            imageElement.alt = `Portrait of ${character.name}`;
        }

        // Populate skills
        if (skillsContainer && character.skills) {
            skillsContainer.innerHTML = '';
            character.skills.forEach(skill => {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-tag';
                skillTag.textContent = skill;
                skillsContainer.appendChild(skillTag);
            });
        }

        // Populate attributes
        if (character.attributes) {
            Object.keys(character.attributes).forEach(attr => {
                const attrElement = card.querySelector(`[data-attribute="${attr}"] .attribute-value`);
                if (attrElement) {
                    attrElement.textContent = character.attributes[attr];
                }
            });
        }
    }

    // Create character modal HTML
    function createCharacterModal() {
        const modalHTML = `
            <div class="character-modal">
                <div class="character-modal-content">
                    <button class="character-modal-close" aria-label="Close character details">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="character-modal-body">
                        <!-- Content will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Open character modal
    function openCharacterModal(characterId) {
        const character = CHARACTERS.find(c => c.id === characterId);
        if (!character || !characterModal) return;

        currentCharacterData = character;
        populateModal(character);
        
        characterModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Pause carousel autoplay
        if (swiperInstance && swiperInstance.autoplay) {
            swiperInstance.autoplay.stop();
            isAutoplayPaused = true;
        }

        // Focus management
        setTimeout(() => {
            const closeButton = characterModal.querySelector('.character-modal-close');
            if (closeButton) {
                closeButton.focus();
            }
        }, 100);

        // Analytics/tracking
        trackCharacterView(character.id);
    }

    // Close character modal
    function closeCharacterModal() {
        if (!characterModal) return;

        characterModal.classList.remove('active');
        document.body.style.overflow = '';
        currentCharacterData = null;

        // Resume carousel autoplay
        if (swiperInstance && isAutoplayPaused && swiperInstance.autoplay) {
            swiperInstance.autoplay.start();
            isAutoplayPaused = false;
        }
    }

    // Populate modal with character data
    function populateModal(character) {
        const modalBody = characterModal.querySelector('.character-modal-body');
        if (!modalBody) return;

        const modalContent = `
            <div class="character-modal-header">
                <div class="character-modal-image">
                    <img src="${character.image}" alt="Portrait of ${character.name}" />
                </div>
                <div class="character-modal-info">
                    <h2 class="character-modal-name">${character.name}</h2>
                    <p class="character-modal-title">${character.title}</p>
                </div>
            </div>
            <div class="character-modal-description">
                <p>${character.description}</p>
            </div>
            <div class="character-modal-attributes">
                <h3>Attributes</h3>
                <div class="attributes-grid">
                    ${Object.keys(character.attributes).map(attr => `
                        <div class="attribute-item">
                            <span class="attribute-name">${attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                            <div class="attribute-bar">
                                <div class="attribute-fill" style="width: ${character.attributes[attr] * 10}%"></div>
                            </div>
                            <span class="attribute-score">${character.attributes[attr]}/10</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="character-modal-skills">
                <h3>Skills</h3>
                <div class="skills-list">
                    ${character.skills.map(skill => `
                        <span class="skill-tag">${skill}</span>
                    `).join('')}
                </div>
            </div>
            <div class="character-modal-quote">
                <blockquote>
                    <p>"${character.quote}"</p>
                    <cite>— ${character.name}</cite>
                </blockquote>
            </div>
        `;

        modalBody.innerHTML = modalContent;
    }

    // Carousel event handlers
    function onCarouselInit() {
        console.log('Character carousel initialized');
        announceSlideChange();
    }

    function onSlideChange() {
        const activeSlide = document.querySelector('.swiper-slide-active .character-card');
        if (activeSlide) {
            const characterName = activeSlide.querySelector('.character-name')?.textContent;
            console.log('Active character:', characterName);
        }
    }

    function onAutoplayStart() {
        console.log('Carousel autoplay started');
    }

    function onAutoplayStop() {
        console.log('Carousel autoplay stopped');
    }

    // Pause autoplay
    function pauseAutoplay() {
        if (swiperInstance && swiperInstance.autoplay && !isAutoplayPaused) {
            swiperInstance.autoplay.stop();
        }
    }

    // Resume autoplay
    function resumeAutoplay() {
        if (swiperInstance && swiperInstance.autoplay && !isAutoplayPaused) {
            swiperInstance.autoplay.start();
        }
    }

    // Announce slide change for screen readers
    function announceSlideChange() {
        const activeSlide = document.querySelector('.swiper-slide-active .character-card');
        if (activeSlide) {
            const characterName = activeSlide.querySelector('.character-name')?.textContent;
            const characterTitle = activeSlide.querySelector('.character-title')?.textContent;
            
            if (characterName) {
                const announcement = `Now viewing ${characterName}, ${characterTitle}`;
                announceToScreenReader(announcement);
            }
        }
    }

    // Announce to screen reader
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Track character view for analytics
    function trackCharacterView(characterId) {
        // Integrate with your analytics platform
        if (typeof gtag !== 'undefined') {
            gtag('event', 'character_view', {
                character_id: characterId,
                event_category: 'engagement'
            });
        }
        
        console.log('Character view tracked:', characterId);
    }

    // Public API
    window.CharacterCarousel = {
        init: init,
        goToCharacter: (characterId) => {
            const characterIndex = CHARACTERS.findIndex(c => c.id === characterId);
            if (swiperInstance && characterIndex !== -1) {
                swiperInstance.slideTo(characterIndex);
            }
        },
        openModal: openCharacterModal,
        closeModal: closeCharacterModal,
        pauseAutoplay: pauseAutoplay,
        resumeAutoplay: resumeAutoplay,
        getCharacterData: (characterId) => CHARACTERS.find(c => c.id === characterId)
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
