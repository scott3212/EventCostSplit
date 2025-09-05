class App {
    constructor() {
        this.isInitialized = false;
        this.version = '1.0.0';
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log(`🏸 Badminton Cost Splitter v${this.version} - Starting...`);
        
        this.showLoadingScreen();
        
        try {
            await this.initializeApp();
            this.hideLoadingScreen();
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitializationError(error);
        }
        
        this.isInitialized = true;
    }

    async initializeApp() {
        await this.delay(1000);
        
        await this.checkApiConnection();
        
        this.bindGlobalEvents();
        
        if (window.dashboard) {
            window.dashboard.startAutoRefresh();
        }
        
        await this.delay(500);
    }

    async checkApiConnection() {
        try {
            const isHealthy = await api.checkHealth();
            console.log(isHealthy ? '✅ API connection established' : '⚠️ API connection failed - running offline');
            return isHealthy;
        } catch (error) {
            console.warn('⚠️ API health check failed:', error.message);
            return false;
        }
    }

    bindGlobalEvents() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        window.addEventListener('online', () => {
            console.log('📶 Connection restored');
            if (window.dashboard && window.navigation && window.navigation.getCurrentPage() === 'dashboard') {
                window.dashboard.refresh();
            }
        });

        window.addEventListener('offline', () => {
            console.log('📵 Connection lost - working offline');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideError();
            }
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
        
        if (app) {
            app.style.display = 'none';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
        
        if (app) {
            app.style.display = 'flex';
            setTimeout(() => {
                app.classList.add('fade-in');
            }, 100);
        }
    }

    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner" style="color: #ef4444;">⚠️</div>
                    <p style="color: #ef4444;">Failed to initialize app</p>
                    <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">
                        ${error.message || 'Unknown error occurred'}
                    </p>
                    <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    handleGlobalError(error) {
        if (error && error.message && !error.message.includes('Script error')) {
            showError(`Unexpected error: ${error.message}`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getVersion() {
        return this.version;
    }

    restart() {
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}