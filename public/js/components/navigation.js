class Navigation {
    constructor() {
        this.currentPage = 'dashboard';
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.initializeMobileMenu();
        this.isInitialized = true;
    }

    bindEvents() {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });

        const errorModal = document.getElementById('error-modal');
        const errorOkButton = document.getElementById('error-ok');
        const errorCloseButton = document.querySelector('#error-modal .modal-close');

        if (errorOkButton) {
            errorOkButton.addEventListener('click', () => {
                hideError();
            });
        }

        if (errorCloseButton) {
            errorCloseButton.addEventListener('click', () => {
                hideError();
            });
        }

        if (errorModal) {
            errorModal.addEventListener('click', (e) => {
                if (e.target === errorModal) {
                    hideError();
                }
            });
        }
    }

    initializeMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                this.updateMobileToggle(mobileToggle, navMenu.classList.contains('active'));
            });

            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    this.updateMobileToggle(mobileToggle, false);
                }
            });
        }
    }

    updateMobileToggle(toggle, isActive) {
        const spans = toggle.querySelectorAll('span');
        if (isActive) {
            toggle.classList.add('active');
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            toggle.classList.remove('active');
            spans.forEach(span => {
                span.style.transform = '';
                span.style.opacity = '';
            });
        }
    }

    navigateToPage(pageId) {
        if (this.currentPage === pageId) return;

        this.currentPage = pageId;
        this.updateActiveNavItem(pageId);
        this.showPage(pageId);
        
        this.hideMobileMenu();
        
        if (pageId === 'dashboard' && typeof dashboard !== 'undefined') {
            dashboard.refresh();
        }
    }

    updateActiveNavItem(activePageId) {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        navItems.forEach(item => {
            if (item.dataset.page === activePageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    showPage(pageId) {
        const pages = document.querySelectorAll('.page');
        
        pages.forEach(page => {
            if (page.id === `${pageId}-page`) {
                page.classList.add('active');
                page.classList.add('fade-in');
            } else {
                page.classList.remove('active');
                page.classList.remove('fade-in');
            }
        });
    }

    hideMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu) {
            navMenu.classList.remove('active');
        }
        
        if (mobileToggle) {
            this.updateMobileToggle(mobileToggle, false);
        }
    }

    getCurrentPage() {
        return this.currentPage;
    }

    setPage(pageId) {
        this.navigateToPage(pageId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}