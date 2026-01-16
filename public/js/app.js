// Main page - Load recipe books using Alpine.js
const API_URL = '/api';

document.addEventListener('alpine:init', () => {
  Alpine.data('recipeBooks', () => ({
    books: [],
    error: null,
    
    async init() {
      try {
        const response = await fetch(`${API_URL}/books`);
        this.books = await response.json();
        
        // Check for success message from add-book or add-recipe
        const successMessage = sessionStorage.getItem('successMessage');
        if (successMessage) {
          Toast.success(successMessage, 'Success', { duration: 4000 });
          sessionStorage.removeItem('successMessage');
        }
      } catch (error) {
        console.error('Error loading recipe books:', error);
        this.error = 'Error loading recipe books. Please try again later.';
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
