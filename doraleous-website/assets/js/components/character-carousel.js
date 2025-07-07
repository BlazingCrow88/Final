// Character Carousel Component
// Interactive character showcase with Swiper.js integration

document.addEventListener('DOMContentLoaded', function() {
    initializeCharacterCarousel();
});

function initializeCharacterCarousel() {
    const characterSwiper = document.querySelector('.character-swiper');
    
    if (!characterSwiper) return;
    
    // Initialize Swiper carousel
    const swiper = new Swiper('.character-swiper', {
        // Basic settings
        loop: true,
        centeredSlides: true,
        grabCursor: true,
        
        // Responsive breakpoints
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
            }
        },
        
        // Navigation
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true
        },
        
        // Auto-play settings
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        
        // Effects
        effect: 'slide',
        speed: 800,
        
        // Accessibility
        a11y: {
            enabled: true,
            prevSlideMessage: 'Previous character',
            nextSlideMessage: 'Next character',
            firstSlideMessage: 'This is the first character',
            lastSlideMessage: 'This is the last character'
        },
        
        // Events
        on: {
            init: function() {
                console.log('Character carousel initialized');
                addCharacterCardInteractions();
            },
            
            slideChange: function() {
                const activeSlide = this.slides[this.activeIndex];
                const characterName = activeSlide.querySelector('.character-name')?.textContent;
                
                if (characterName) {
                    // Track character views
                    if (typeof AuthorWebsite !== 'undefined') {
                        AuthorWebsite.trackEvent('character_view', {
                            character_name: characterName,
                            carousel_position: this.activeIndex
                        });
                    }
                }
            }
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            swiper.slidePrev();
        } else if (e.key === 'ArrowRight') {
            swiper.slideNext();
        }
    });
    
    // Pause autoplay on focus (accessibility)
    characterSwiper.addEventListener('focus', function() {
        swiper.autoplay.stop();
    });
    
    characterSwiper.addEventListener('blur', function() {
        swiper.autoplay.start();
    });
    
    return swiper;
}

function addCharacterCardInteractions() {
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach((card, index) => {
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
        
        // Add click interactions
        card.addEventListener('click', function() {
            const characterName = this.querySelector('.character-name')?.textContent;
            const characterRole = this.querySelector('.character-role')?.textContent;
            
            if (characterName) {
                openCharacterModal(characterName, characterRole, index);
            }
        });
        
        // Add keyboard navigation
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Make cards focusable
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Learn more about ${card.querySelector('.character-name')?.textContent || 'character'}`);
    });
}

function openCharacterModal(characterName, characterRole, index) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('character-modal');
    
    if (!modal) {
        modal = createCharacterModal();
        document.body.appendChild(modal);
    }
    
    // Load character data
    const characterData = getCharacterData(characterName, index);
    
    if (characterData) {
        populateCharacterModal(modal, characterData);
        showModal(modal);
        
        // Track modal open
        if (typeof AuthorWebsite !== 'undefined') {
            AuthorWebsite.trackEvent('character_modal_open', {
                character_name: characterName,
                character_role: characterRole
            });
        }
    }
}

function createCharacterModal() {
    const modal = document.createElement('div');
    modal.id = 'character-modal';
    modal.className = 'character-modal';
    modal.innerHTML = `
        <div class="modal-overlay" id="modal-overlay"></div>
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button class="modal-close" id="modal-close" aria-label="Close character details">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="modal-header">
                <img src="" alt="" class="modal-character-image" id="modal-character-image">
                <div class="modal-character-info">
                    <h2 class="modal-character-name" id="modal-title"></h2>
                    <p class="modal-character-role" id="modal-character-role"></p>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-description" id="modal-description"></div>
                <div class="modal-stats" id="modal-stats"></div>
                <div class="modal-abilities" id="modal-abilities"></div>
            </div>
            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="modal-cta">Learn More</a>
                <button class="btn btn-secondary" id="modal-close-btn">Close</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const closeButtons = modal.querySelectorAll('#modal-close, #modal-close-btn, #modal-overlay');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            hideModal(modal);
        });
    });
    
    // Keyboard navigation
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideModal(modal);
        }
    });
    
    return modal;
}

function getCharacterData(characterName, index) {
    // Character data - in a real implementation, this would come from an API or database
    const characterDatabase = {
        'Doraleous': {
            name: 'Doraleous',
            role: 'The Leader',
            image: '../assets/images/characters/doraleous-portrait.jpg',
            description: 'Doraleous is a skilled warrior and natural leader whose tactical brilliance has saved his team countless times. Born into nobility but choosing the path of a mercenary, he carries the weight of leadership with honor and determination. His strategic mind and unwavering moral compass make him the perfect leader for a team of diverse and talented individuals.',
            stats: {
                'Leadership': 95,
                'Combat Skills': 88,
                'Tactical Thinking': 92,
                'Magic Resistance': 75
            },
            abilities: [
                'Master Swordsman',
                'Tactical Genius',
                'Inspiring Presence',
                'Ancient Lore Knowledge'
            ],
            learnMoreUrl: 'doraleous-associates/characters.html#doraleous'
        },
        'The Associates': {
            name: 'The Associates',
            role: 'The Team',
            image: '../assets/images/characters/mercenary-team.jpg',
            description: 'A diverse group of skilled mercenaries who have come together under Doraleous\' leadership. Each member brings unique abilities, backgrounds, and perspectives to their shared adventures. Together, they form an unstoppable force capable of taking on the most dangerous missions in the realm.',
            stats: {
                'Team Coordination': 90,
                'Combined Skills': 94,
                'Loyalty': 98,
                'Adaptability': 87
            },
            abilities: [
                'Diverse Skill Set',
                'Unbreakable Bond',
                'Complementary Abilities',
                'Shared Experience'
            ],
            learnMoreUrl: 'doraleous-associates/characters.html#team'
        },
        'The World': {
            name: 'The World',
            role: 'The Setting',
            image: '../assets/images/characters/character-lineup.jpg',
            description: 'A richly detailed fantasy realm where magic and technology coexist in delicate balance. Ancient prophecies shape the present, while forgotten civilizations leave their mark on the landscape. This world serves as more than just a backdrop—it\'s a living, breathing entity that influences every aspect of the characters\' journey.',
            stats: {
                'Magic Density': 85,
                'Political Complexity': 92,
                'Ancient Mysteries': 96,
                'Cultural Diversity': 89
            },
            abilities: [
                'Ancient Magic',
                'Diverse Kingdoms',
                'Mystical Creatures',
                'Hidden Secrets'
            ],
            learnMoreUrl: 'doraleous-associates/characters.html#world'
        }
    };
    
    return characterDatabase[characterName] || null;
}

function populateCharacterModal(modal, data) {
    // Update modal content
    modal.querySelector('#modal-title').textContent = data.name;
    modal.querySelector('#modal-character-role').textContent = data.role;
    modal.querySelector('#modal-character-image').src = data.image;
    modal.querySelector('#modal-character-image').alt = `${data.name} - ${data.role}`;
    modal.querySelector('#modal-description').textContent = data.description;
    modal.querySelector('#modal-cta').href = data.learnMoreUrl;
    
    // Update stats
    const statsContainer = modal.querySelector('#modal-stats');
    statsContainer.innerHTML = '<h3>Attributes</h3>';
    
    Object.entries(data.stats).forEach(([stat, value]) => {
        const statElement = document.createElement('div');
        statElement.className = 'stat-item';
        statElement.innerHTML = `
            <div class="stat-label">${stat}</div>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${value}%"></div>
            </div>
            <div class="stat-value">${value}</div>
        `;
        statsContainer.appendChild(statElement);
    });
    
    // Update abilities
    const abilitiesContainer = modal.querySelector('#modal-abilities');
    abilitiesContainer.innerHTML = '<h3>Special Abilities</h3>';
    
    const abilitiesList = document.createElement('ul');
    abilitiesList.className = 'abilities-list';
    
    data.abilities.forEach(ability => {
        const abilityItem = document.createElement('li');
        abilityItem.className = 'ability-item';
        abilityItem.textContent = ability;
        abilitiesList.appendChild(abilityItem);
    });
    
    abilitiesContainer.appendChild(abilitiesList);
}

function showModal(modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Focus management
    const firstFocusable = modal.querySelector('button, a, input, textarea, select');
    if (firstFocusable) {
        firstFocusable.focus();
    }
    
    // Trap focus within modal
    trapFocus(modal);
}

function hideModal(modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    // Return focus to trigger element
    const characterCards = document.querySelectorAll('.character-card');
    if (characterCards.length > 0) {
        characterCards[0].focus();
    }
}

function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Export for use in other components
window.CharacterCarousel = {
    initialize: initializeCharacterCarousel,
    openModal: openCharacterModal
};
