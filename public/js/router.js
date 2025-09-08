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
        this.addRoute('/expenses', 'expenses');
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
        // Find matching route
        const route = this.findRoute(path);
        
        if (!route) {
            console.warn(`No route found for path: ${path}`);
            // Fallback to dashboard
            this.navigate('/', false);
            return;
        }

        // Extract parameters
        this.params = this.extractParams(path, route);
        this.currentRoute = route;

        // Handle the route
        if (route.handler) {
            // Custom handler
            route.handler(this.params);
        } else {
            // Default page navigation
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
        // Integrate with existing navigation system
        if (window.navigation) {
            if (pageId === 'event-detail' && params.id) {
                // Special handling for event detail page
                this.showEventDetail(params.id);
            } else {
                // Standard page navigation
                window.navigation.navigateToPage(pageId);
            }
        }
    }

    showEventDetail(eventId) {
        // Show event detail page with specific event
        if (window.eventDetailPage) {
            // First navigate to events page to ensure proper context
            if (window.navigation) {
                window.navigation.navigateToPage('events');
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
            case 'expenses':
                return '/expenses';
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
        router = new Router();
        window.router = router;
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}