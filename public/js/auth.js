/**
 * Authentication Service
 * Manages user authentication state and token handling
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
    this.authStateListeners = [];
  }

  /**
   * Initialize auth state listener
   */
  async init() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        
        if (user) {
          // Get fresh ID token
          this.authToken = await user.getIdToken();
          
          // Store in sessionStorage for API calls
          sessionStorage.setItem('authToken', this.authToken);
          sessionStorage.setItem('userId', user.uid);
          sessionStorage.setItem('userEmail', user.email);
          sessionStorage.setItem('userName', user.displayName || user.email);
          
          // If we're on the auth page and user is authenticated, redirect
          if (window.location.pathname === '/auth.html') {
            this.redirectAfterLogin();
          }
        } else {
          // Clear auth data
          this.authToken = null;
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('userEmail');
          sessionStorage.removeItem('userName');
        }

        // Notify listeners
        this.authStateListeners.forEach(callback => callback(user));
        resolve(user);
      });
    });
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    // Immediately call with current user if already set
    if (this.currentUser !== null) {
      callback(this.currentUser);
    }
  }

  /**
   * Sign in with Google
   * Uses popup with mobile-friendly handling
   */
  async signInWithGoogle() {
    try {
      console.log('Starting Google sign-in...');
      
      // Try popup first - works better with local development
      const result = await auth.signInWithPopup(googleProvider);
      console.log('✅ Sign-in successful:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more helpful error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. Please contact the administrator.');
      }
      
      throw error;
    }
  }



  /**
   * Sign out
   */
  async signOut() {
    try {
      await auth.signOut();
      // Redirect to auth page after sign out
      window.location.href = '/auth.html';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get current auth token
   */
  async getAuthToken() {
    if (!this.currentUser) {
      return null;
    }
    
    // Get fresh token (will use cached if not expired)
    this.authToken = await this.currentUser.getIdToken();
    sessionStorage.setItem('authToken', this.authToken);
    return this.authToken;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Require authentication (redirect to login if not authenticated)
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      // Store the current path to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      window.location.href = '/auth.html';
      return false;
    }
    return true;
  }

  /**
   * Redirect after successful login
   */
  redirectAfterLogin() {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    
    if (redirectPath && redirectPath !== '/auth.html') {
      window.location.href = redirectPath;
    } else {
      window.location.href = '/';
    }
  }

  /**
   * Make authenticated API request with automatic retry on token expiration
   */
  async fetchWithAuth(url, options = {}, retryCount = 0) {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && retryCount === 0) {
        console.log('Token may be expired, refreshing and retrying...');
        
        // Force refresh the token
        if (this.currentUser) {
          try {
            this.authToken = await this.currentUser.getIdToken(true); // Force refresh
            sessionStorage.setItem('authToken', this.authToken);
            
            // Retry the request with the new token
            return this.fetchWithAuth(url, options, retryCount + 1);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.signOut();
            throw new Error('Authentication failed - please sign in again');
          }
        } else {
          console.error('Authentication failed, redirecting to login');
          this.signOut();
          throw new Error('Authentication failed');
        }
      }

      // If still 401 after retry, sign out
      if (response.status === 401) {
        console.error('Authentication failed after retry, redirecting to login');
        this.signOut();
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error:', error);
        throw new Error('Network connection lost. Please check your internet connection.');
      }
      throw error;
    }
  }
}

// Create global auth service instance
const authService = new AuthService();
