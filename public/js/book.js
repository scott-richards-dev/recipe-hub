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
    
    async init() {
      const params = new URLSearchParams(window.location.search);
      this.bookId = params.get('id');
      
      if (!this.bookId) {
        window.location.href = '../index.html';
        return;
      }
      
      try {
        // Fetch book metadata from backend
        const booksResponse = await fetch(`${API_URL}/books`);
        const books = await booksResponse.json();
        const book = books.find(b => b.id === this.bookId);
        
        if (book) {
          this.bookName = book.name;
          this.bookDescription = book.description;
          this.bookIcon = book.image;
          document.title = `${book.name} - Recipe Hub`;
        }
        
        // Fetch recipes for this book
        const response = await fetch(`${API_URL}/books/${this.bookId}`);
        this.recipes = await response.json();
        
        // Check for success message from add-book
        const successMessage = sessionStorage.getItem('successMessage');
        if (successMessage) {
          Toast.success(successMessage, 'Success', { duration: 4000 });
          sessionStorage.removeItem('successMessage');
        }
      } catch (error) {
        console.error('Error loading book data:', error);
        this.error = 'Error loading book data. Please try again later.';
      }
    },
    
    editBook() {
      window.location.href = `add-book.html?id=${this.bookId}`;
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
      window.location.href = 'add-recipe.html';
      this.showActions = false;
    }
  }));
});
