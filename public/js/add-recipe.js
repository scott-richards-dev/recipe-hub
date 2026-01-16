// Add recipe page - Handle form submission using Alpine.js
const API_URL = '/api';

document.addEventListener('alpine:init', () => {
  Alpine.data('addRecipeForm', () => ({
    formData: {
      name: '',
      description: '',
      cookTime: '',
      servings: '',
      bookIds: [],
      ingredients: [''],
      instructions: ['']
    },
    books: [],
    submitting: false,
    selectedBookId: '',
    draggedIngredientIndex: null,
    dragOverIngredientIndex: null,
    draggedInstructionIndex: null,
    dragOverInstructionIndex: null,
    isEditMode: false,
    recipeId: null,
    returnBookId: null,
    
    async init() {
      // Check if we're in edit mode
      const params = new URLSearchParams(window.location.search);
      this.recipeId = params.get('id');
      this.returnBookId = params.get('book');
      
      // Fetch available books
      try {
        const response = await fetch(`${API_URL}/books`);
        this.books = await response.json();
      } catch (error) {
        console.error('Error loading books:', error);
      }
      
      // If we have a recipe ID, load the recipe data
      if (this.recipeId) {
        this.isEditMode = true;
        await this.loadRecipeData();
      }
    },
    
    ingredientToString(ingredient) {
      // Convert ingredient object to a readable string
      if (typeof ingredient === 'string') {
        return ingredient;
      }
      
      let str = '';
      if (ingredient.amount) {
        str += ingredient.amount;
        if (ingredient.metric) {
          str += ingredient.metric;
        }
        str += ' ';
      }
      str += ingredient.name || '';
      return str.trim();
    },
    
    async loadRecipeData() {
      try {
        const response = await fetch(`${API_URL}/recipes/${this.recipeId}`);
        if (response.ok) {
          const recipe = await response.json();
          this.formData.name = recipe.name;
          this.formData.description = recipe.description;
          this.formData.cookTime = recipe.cookTime;
          this.formData.servings = recipe.servings?.toString() || '';
          this.formData.bookIds = recipe.bookIds || [];
          // Convert ingredient objects to strings for editing
          this.formData.ingredients = recipe.ingredients?.length > 0 
            ? recipe.ingredients.map(ing => this.ingredientToString(ing))
            : [''];
          this.formData.instructions = recipe.instructions?.length > 0 ? recipe.instructions : [''];
        } else {
          Toast.error('Recipe not found', 'Error', { duration: 3000 });
          setTimeout(() => window.location.href = '../index.html', 1500);
        }
      } catch (error) {
        console.error('Error loading recipe data:', error);
        Toast.error('Failed to load recipe data', 'Error', { duration: 3000 });
      }
    },
    
    addIngredient() {
      this.formData.ingredients.push('');
    },
    
    removeIngredient(index) {
      if (this.formData.ingredients.length > 1) {
        this.formData.ingredients.splice(index, 1);
      }
    },
    
    addInstruction() {
      this.formData.instructions.push('');
    },
    
    removeInstruction(index) {
      if (this.formData.instructions.length > 1) {
        this.formData.instructions.splice(index, 1);
      }
    },
    
    // Book selection methods
    toggleBookSelection() {
      if (this.selectedBookId && !this.formData.bookIds.includes(this.selectedBookId)) {
        this.formData.bookIds.push(this.selectedBookId);
      }
      this.selectedBookId = '';
    },
    
    removeBook(bookId) {
      const index = this.formData.bookIds.indexOf(bookId);
      if (index > -1) {
        this.formData.bookIds.splice(index, 1);
      }
    },
    
    getBookName(bookId) {
      const book = this.books.find(b => b.id === bookId);
      return book ? `${book.image} ${book.name}` : '';
    },
    
    // Drag and drop for ingredients
    startDragIngredient(event, index) {
      this.draggedIngredientIndex = index;
      event.dataTransfer.effectAllowed = 'move';
    },
    
    endDragIngredient() {
      this.draggedIngredientIndex = null;
      this.dragOverIngredientIndex = null;
    },
    
    dragOverIngredient(index) {
      this.dragOverIngredientIndex = index;
    },
    
    dropIngredient(targetIndex) {
      if (this.draggedIngredientIndex !== null && this.draggedIngredientIndex !== targetIndex) {
        const draggedItem = this.formData.ingredients[this.draggedIngredientIndex];
        this.formData.ingredients.splice(this.draggedIngredientIndex, 1);
        this.formData.ingredients.splice(targetIndex, 0, draggedItem);
        // Force reactivity update
        this.formData.ingredients = [...this.formData.ingredients];
      }
      this.draggedIngredientIndex = null;
      this.dragOverIngredientIndex = null;
    },
    
    // Drag and drop for instructions
    startDragInstruction(event, index) {
      this.draggedInstructionIndex = index;
      event.dataTransfer.effectAllowed = 'move';
    },
    
    endDragInstruction() {
      this.draggedInstructionIndex = null;
      this.dragOverInstructionIndex = null;
    },
    
    dragOverInstruction(index) {
      this.dragOverInstructionIndex = index;
    },
    
    dropInstruction(targetIndex) {
      if (this.draggedInstructionIndex !== null && this.draggedInstructionIndex !== targetIndex) {
        const draggedItem = this.formData.instructions[this.draggedInstructionIndex];
        this.formData.instructions.splice(this.draggedInstructionIndex, 1);
        this.formData.instructions.splice(targetIndex, 0, draggedItem);
        // Force reactivity update
        this.formData.instructions = [...this.formData.instructions];
      }
      this.draggedInstructionIndex = null;
      this.dragOverInstructionIndex = null;
    },
    
    async submitForm() {
      this.submitting = true;
      
      // Filter out empty ingredients and instructions
      const cleanedData = {
        ...this.formData,
        servings: parseInt(this.formData.servings),
        ingredients: this.formData.ingredients.filter(i => i.trim() !== ''),
        instructions: this.formData.instructions.filter(i => i.trim() !== '')
      };
      
      // Validate that we have at least one ingredient and instruction
      if (cleanedData.ingredients.length === 0) {
        Toast.error('Please add at least one ingredient.', 'Validation Error', { duration: 5000 });
        this.submitting = false;
        return;
      }
      
      if (cleanedData.instructions.length === 0) {
        Toast.error('Please add at least one instruction.', 'Validation Error', { duration: 5000 });
        this.submitting = false;
        return;
      }
      
      try {
        const url = this.isEditMode ? `${API_URL}/recipes/${this.recipeId}` : `${API_URL}/recipes`;
        const method = this.isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store success message in sessionStorage
          const successMsg = this.isEditMode
            ? data.message || `"${this.formData.name}" has been updated successfully!`
            : data.message || `"${this.formData.name}" has been added successfully!`;
          sessionStorage.setItem('successMessage', successMsg);
          
          // Redirect to the recipe page
          const redirectId = this.isEditMode ? this.recipeId : data.id;
          if (redirectId) {
            // Use return book ID if available, otherwise first book from form data
            const bookId = this.returnBookId || (this.formData.bookIds.length > 0 ? this.formData.bookIds[0] : '');
            window.location.href = bookId 
              ? `recipe.html?id=${redirectId}&book=${bookId}`
              : `recipe.html?id=${redirectId}`;
          } else {
            window.location.href = '../index.html';
          }
        } else {
          // Show error toast
          const errorMsg = this.isEditMode
            ? 'Failed to update recipe. Please try again.'
            : 'Failed to add recipe. Please try again.';
          Toast.error(
            data.error || errorMsg,
            'Error',
            { duration: 5000 }
          );
        }
      } catch (error) {
        console.error('Error saving recipe:', error);
        // Show error toast
        Toast.error(
          'Failed to save recipe. Please check your connection and try again.',
          'Connection Error',
          { duration: 5000 }
        );
      } finally {
        this.submitting = false;
      }
    },
    
    cancel() {
      window.location.href = '../index.html';
    }
  }));
});
