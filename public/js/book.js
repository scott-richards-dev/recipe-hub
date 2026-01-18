// Recipe book page - Load recipes for a specific book using Alpine.js
const API_URL = '/api';

document.addEventListener('alpine:init', () => {
  Alpine.data('recipeBook', () => ({
    bookId: null,
    recipes: [],
    bookName: 'Recipe Book',
    bookDescription: 'Delicious recipes',
    bookIcon: '📖',
    error: null,
    isLoading: true,
    
    async init() {
      // Check auth first
      await initAuthenticatedPage();
      
      const params = new URLSearchParams(window.location.search);
      this.bookId = params.get('id');
      
      if (!this.bookId) {
        window.location.href = '../index.html';
        return;
      }
      
      this.isLoading = true;
      try {
        // Fetch book metadata from backend
        const booksResponse = await authService.fetchWithAuth(`${API_URL}/books`);
        if (!booksResponse.ok) {
          throw new Error(`Failed to fetch books: ${booksResponse.status}`);
        }
        const books = await booksResponse.json();
        const book = books.find(b => b.id === this.bookId);
        
        if (!book) {
          // Book not found in user's book list, redirect to home
          console.error('Book not found in user\'s books');
          window.location.href = '../index.html';
          return;
        }
        
        this.bookName = book.name;
        this.bookDescription = book.description;
        this.bookIcon = book.image;
        document.title = `${book.name} - Recipe Hub`;
        
        // Fetch recipes for this book
        const response = await authService.fetchWithAuth(`${API_URL}/books/${this.bookId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch recipes: ${response.status}`);
        }
        
        const recipes = await response.json();
        this.recipes = Array.isArray(recipes) ? recipes : [];
        
        // Check for success message from add-book
        const successMessage = sessionStorage.getItem('successMessage');
        if (successMessage && typeof Toast !== 'undefined') {
          Toast.success(successMessage, 'Success', { duration: 4000 });
          sessionStorage.removeItem('successMessage');
        }
      } catch (error) {
        console.error('Error loading book data:', error);
        this.error = 'Error loading book data. Please try again later.';
        this.recipes = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    editBook() {
      window.location.href = `add-book.html?id=${this.bookId}`;
    },
    
    async deleteBook() {
      if (confirm(`Are you sure you want to delete "${this.bookName}"? This action cannot be undone.`)) {
        try {
          const response = await authService.fetchWithAuth(`${API_URL}/books/${this.bookId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete book');
          }
          
          const result = await response.json();
          sessionStorage.setItem('successMessage', result.message || 'Book deleted successfully!');
          
          // Redirect to home page
          window.location.href = '../index.html';
        } catch (error) {
          console.error('Error deleting book:', error);
          Toast.error('Failed to delete book. Please try again.', 'Error');
        }
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
      window.location.href = 'add-book.html';
      this.showActions = false;
    },
    
    createRecipe() {
      const params = new URLSearchParams(window.location.search);
      const bookId = params.get('id');
      
      if (bookId) {
        window.location.href = `add-recipe.html?book=${bookId}`;
      } else {
        window.location.href = 'add-recipe.html';
      }
      this.showActions = false;
    }
  }));
});
