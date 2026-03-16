/**
 * ============================================
 * LiDex Analytics - Theme Management System
 * Version: 1.0
 * Last Updated: March 16, 2026
 * 
 * Usage: Include this script in any page that needs theme support
 * <script src="assets/js/theme.js"></script>
 * ============================================
 */

// Theme Manager Class
class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.toggleButton = null;
        this.storageKey = 'lidex-theme';
        this.init();
    }

    // Initialize theme system
    init() {
        this.loadSavedTheme();
        this.setupToggleButton();
        this.setupSystemPreferenceListener();
    }

    // Load saved theme from localStorage
    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        
        if (savedTheme) {
            // Use saved preference
            this.setTheme(savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
    }

    // Set theme (dark or light)
    setTheme(theme) {
        if (theme === 'dark') {
            this.html.classList.add('dark');
            this.html.classList.remove('light');
        } else {
            this.html.classList.remove('dark');
            this.html.classList.add('light');
        }
        
        // Save to localStorage
        localStorage.setItem(this.storageKey, theme);
        
        // Update all toggle buttons on page
        this.updateAllToggleIcons();
        
        // Update charts if they exist
        this.updateCharts();
        
        // Dispatch custom event for other scripts to listen
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    // Toggle between dark and light
    toggle() {
        const currentTheme = this.html.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    // Get current theme
    getCurrentTheme() {
        return this.html.classList.contains('dark') ? 'dark' : 'light';
    }

    // Setup toggle button(s)
    setupToggleButton() {
        // Find all theme toggle buttons on the page
        this.toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        
        this.toggleButtons.forEach(button => {
            button.addEventListener('click', () => this.toggle());
        });
        
        this.updateAllToggleIcons();
    }

    // Update icon on all toggle buttons
    updateAllToggleIcons() {
        const currentTheme = this.getCurrentTheme();
        
        this.toggleButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                const iconName = currentTheme === 'dark' ? 'sun' : 'moon';
                icon.setAttribute('data-lucide', iconName);
            }
        });
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Update charts for theme
    updateCharts() {
        const isDark = this.getCurrentTheme() === 'dark';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const tickColor = isDark ? '#94a3b8' : '#64748b';
        
        // Update all Chart.js instances
        if (typeof Chart !== 'undefined' && Chart.instances) {
            Object.values(Chart.instances).forEach(chart => {
                if (chart.options.scales) {
                    if (chart.options.scales.y) {
                        chart.options.scales.y.grid.color = gridColor;
                        chart.options.scales.y.ticks.color = tickColor;
                    }
                    if (chart.options.scales.x) {
                        chart.options.scales.x.ticks.color = tickColor;
                    }
                }
                chart.update('none'); // Update without animation
            });
        }
    }

    // Listen for system preference changes
    setupSystemPreferenceListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if no saved preference exists
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Also initialize immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    window.themeManager = new ThemeManager();
}
