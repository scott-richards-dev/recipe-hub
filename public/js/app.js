// Main page - Load recipe books using Alpine.js
const API_URL = '/api';

// Global authentication state for Alpine
let globalAuthState = {
  isAuthenticated: false,
  user: null
};

document.addEventListener('alpine:init', () => {
  // User menu component
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

  // Recipe books component
  Alpine.data('recipeBooks', () => ({
    books: [],
    error: null,
    isAuthenticated: false,
    isLoading: true,
    
    async init() {
      // Subscribe to auth state changes
      authService.onAuthStateChanged(async (user) => {
        this.isAuthenticated = !!user;
        if (user) {
          await this.loadBooks();
        } else {
          // Redirect to auth page if not authenticated
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/auth.html';
        }
      });

      // Check for success message from add-book or add-recipe
      const successMessage = sessionStorage.getItem('successMessage');
      if (successMessage) {
        Toast.success(successMessage, 'Success');
        sessionStorage.removeItem('successMessage');
      }
    },

    async loadBooks() {
      this.isLoading = true;
      try {
        const response = await authService.fetchWithAuth(`${API_URL}/books`);
        if (response.ok) {
          this.books = await response.json();
        } else {
          throw new Error('Failed to load books');
        }
      } catch (error) {
        console.error('Error loading recipe books:', error);
        this.error = 'Error loading recipe books. Please try again later.';
      } finally {
        this.isLoading = false;
      }
    }
  }));

  // Add button functionality
  Alpine.data('addButton', () => ({
    showActions: false,
    
    toggleActions() {
      this.showActions = !this.showActions;
    },
    
    closeActions() {
      this.showActions = false;
    },
    
    createBook() {
      window.location.href = 'pages/add-book.html';
      this.showActions = false;
    },
    
    createRecipe() {
      window.location.href = 'pages/add-recipe.html';
      this.showActions = false;
    }
  }));
});

// Initialize auth service when page loads
authService.init();
