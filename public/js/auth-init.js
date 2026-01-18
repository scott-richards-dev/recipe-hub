/**
 * Common initialization for all authenticated pages
 * Include this after firebase-config.js and auth.js
 */

// Initialize auth and check if user is authenticated
async function initAuthenticatedPage() {
  await authService.init();
  
  // Redirect to auth page if not authenticated
  if (!authService.isAuthenticated()) {
    // Store current page to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    window.location.href = '/auth.html';
    return false;
  }
  
  return true;
}

// Add user menu to Alpine if not on index page
document.addEventListener('alpine:init', () => {
  Alpine.data('userMenu', () => ({
    showDropdown: false,
    isAuthenticated: false,
    userName: '',
    userEmail: '',

    get userInitials() {
      if (!this.userName) return '?';
      const names = this.userName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
      }
      return this.userName.charAt(0).toUpperCase();
    },

    init() {
      // Immediately load cached user data to prevent flicker
      const cachedUserName = sessionStorage.getItem('userName');
      const cachedUserEmail = sessionStorage.getItem('userEmail');
      
      if (cachedUserName && cachedUserEmail) {
        this.isAuthenticated = true;
        this.userName = cachedUserName;
        this.userEmail = cachedUserEmail;
      }

      // Then update with real Firebase auth state
      authService.onAuthStateChanged((user) => {
        this.isAuthenticated = !!user;
        if (user) {
          this.userName = user.displayName || user.email.split('@')[0];
          this.userEmail = user.email;
        } else {
          // Clear if signed out
          this.userName = '';
          this.userEmail = '';
        }
      });
    },

    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    closeDropdown() {
      this.showDropdown = false;
    },

    getUserInitials() {
      if (!this.userName) return '?';
      return this.userName.charAt(0).toUpperCase();
    },

    async signOut() {
      try {
        await authService.signOut();
      } catch (error) {
        console.error('Sign out error:', error);
        Toast.error('Failed to sign out', 'Error');
      }
    }
  }));
});

