/**
 * SPA Router for Badminton Cost Splitter
 * Handles URL routing, browser history, and navigation
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.params = {};
        
        // Define route patterns
        this.defineRoutes();
        
        // Initialize router
        this.init();
    }

    defineRoutes() {
        // Static routes
        this.addRoute('/', 'dashboard');
        this.addRoute('/users', 'users');
        this.addRoute('/events', 'events');
        this.addRoute('/payments', 'payments');
        
        // Dynamic routes with parameters
        this.addRoute('/events/:id', 'event-detail');
    }

    addRoute(pattern, pageId, handler = null) {
        const route = {
            pattern: pattern,
            pageId: pageId,
            handler: handler,
            regex: this.patternToRegex(pattern),
            params: this.extractParamNames(pattern)
        };
        
        this.routes.set(pattern, route);
    }

    patternToRegex(pattern) {
        // Convert route pattern to regex
        // Example: '/events/:id' becomes /^\/events\/([^\/]+)$/
        const regex = pattern
            .replace(/\//g, '\\/')
            .replace(/:([^\/]+)/g, '([^\/]+)');
        return new RegExp(`^${regex}$`);
    }

    extractParamNames(pattern) {
        // Extract parameter names from pattern
        // Example: '/events/:id' returns ['id']
        const matches = pattern.match(/:([^\/]+)/g);
        return matches ? matches.map(match => match.slice(1)) : [];
    }

    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handleRoute(window.location.pathname, false);
        });

        // Handle initial page load
        this.handleRoute(window.location.pathname, false);
    }

    navigate(url, pushState = true) {
        // Navigate to a new URL
        if (pushState) {
            window.history.pushState({}, '', url);
        }
        
        this.handleRoute(url, false);
    }

    handleRoute(path, pushState = true) {
        console.log('Router: Handling route:', path);
        
        // Find matching route
        const route = this.findRoute(path);
        console.log('Router: Found route:', route ? route.pageId : 'none');
        
        if (!route) {
            console.warn(`No route found for path: ${path}`);
            // Fallback to dashboard
            this.navigate('/', false);
            return;
        }

        // Extract parameters
        this.params = this.extractParams(path, route);
        this.currentRoute = route;
        console.log('Router: Extracted params:', this.params);

        // Handle the route
        if (route.handler) {
            // Custom handler
            console.log('Router: Using custom handler for:', route.pageId);
            route.handler(this.params);
        } else {
            // Default page navigation
            console.log('Router: Using default navigation for:', route.pageId);
            this.navigateToPage(route.pageId, this.params);
        }
    }

    findRoute(path) {
        for (const [pattern, route] of this.routes) {
            if (route.regex.test(path)) {
                return route;
            }
        }
        return null;
    }

    extractParams(path, route) {
        const matches = path.match(route.regex);
        const params = {};
        
        if (matches && route.params) {
            route.params.forEach((paramName, index) => {
                params[paramName] = matches[index + 1];
            });
        }
        
        return params;
    }

    navigateToPage(pageId, params = {}) {
        console.log('Router: navigateToPage called with:', pageId, params);
        
        // Integrate with existing navigation system
        if (window.navigation && typeof window.navigation.navigateToPage === 'function') {
            console.log('Router: Navigation system available, calling navigation.navigateToPage');
            if (pageId === 'event-detail' && params.id) {
                // Special handling for event detail page
                console.log('Router: Special handling for event-detail page with ID:', params.id);
                this.showEventDetail(params.id);
            } else {
                // Standard page navigation
                console.log('Router: Standard page navigation for:', pageId);
                window.navigation.navigateToPage(pageId);
            }
        } else {
            // Fallback: wait for navigation to be ready or handle directly
            console.warn('Navigation system not ready, retrying...');
            setTimeout(() => {
                if (window.navigation && typeof window.navigation.navigateToPage === 'function') {
                    this.navigateToPage(pageId, params);
                } else {
                    // Direct DOM manipulation as last resort
                    this.directPageNavigation(pageId);
                }
            }, 100);
        }
    }

    directPageNavigation(pageId) {
        // Direct DOM manipulation fallback when navigation system isn't ready
        const pages = document.querySelectorAll('.page');
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        // Hide all pages
        pages.forEach(page => {
            page.classList.remove('active');
            page.classList.remove('fade-in');
            page.style.display = 'none';
        });
        
        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.classList.add('fade-in');
            targetPage.style.display = '';
        }
        
        // Update navigation
        navItems.forEach(item => {
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    showEventDetail(eventId) {
        // Show event detail page with specific event
        if (window.eventDetailPage) {
            // First navigate to events page to ensure proper context
            if (window.navigation && typeof window.navigation.navigateToPage === 'function') {
                window.navigation.navigateToPage('events');
            } else {
                this.directPageNavigation('events');
            }
            
            // Then show the specific event detail
            setTimeout(() => {
                window.eventDetailPage.showEvent(eventId);
            }, 100); // Small delay to ensure events page is ready
        }
    }

    // Utility methods for generating URLs
    url(pageId, params = {}) {
        switch (pageId) {
            case 'dashboard':
                return '/';
            case 'users':
                return '/users';
            case 'events':
                return '/events';
            case 'event-detail':
                return `/events/${params.id}`;
            case 'payments':
                return '/payments';
            default:
                return '/';
        }
    }

    getCurrentUrl() {
        return window.location.pathname;
    }

    getCurrentParams() {
        return { ...this.params };
    }

    getCurrentPageId() {
        return this.currentRoute ? this.currentRoute.pageId : null;
    }

    // Method to update URL without triggering navigation
    updateUrl(url) {
        window.history.replaceState({}, '', url);
    }
}

// Initialize router when DOM is loaded
let router = null;

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit to ensure navigation system is initialized
        setTimeout(() => {
            router = new Router();
            window.router = router;
            console.log('Router initialized:', router);
        }, 50); // Small delay to ensure navigation.js has initialized
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}