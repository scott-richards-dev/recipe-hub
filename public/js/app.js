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
      // For now, show an alert. In the future, this can navigate to a form page.
      alert('Create new recipe book functionality coming soon!');
      this.showActions = false;
    },
    
    createRecipe() {
      // For now, show an alert. In the future, this can navigate to a form page.
      alert('Create new recipe functionality coming soon!');
      this.showActions = false;
    }
  }));
});
