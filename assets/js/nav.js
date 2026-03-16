/**
 * ============================================
 * LiDex Analytics - Navigation Handler
 * Version: 1.0
 * Last Updated: March 16, 2026
 * 
 * Usage: Include this script in any page for active link highlighting
 * <script src="assets/js/nav.js"></script>
 * ============================================
 */

class NavigationManager {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.init();
    }

    init() {
        this.highlightActiveLink();
        this.setupMobileMenu();
    }

    // Highlight current page in navigation
    highlightActiveLink() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === this.currentPage || 
                (this.currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Setup mobile menu toggle
    setupMobileMenu() {
        const mobileMenuButton = document.querySelector('[data-mobile-menu]');
        const mobileMenu = document.querySelector('[data-mobile-menu-content]');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    // Get current page name
    getCurrentPage() {
        return this.currentPage;
    }
}

// Initialize navigation manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.navManager = new NavigationManager();
});

// Also initialize immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    window.navManager = new NavigationManager();
}
