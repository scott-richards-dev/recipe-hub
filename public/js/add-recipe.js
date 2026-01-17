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
      ingredients: [{ amount: '', metric: '', name: '' }],
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
    bookName: '',
    advancedIngredientMode: true,
    ingredientSections: [{ section: '', items: [{ amount: '', metric: '', name: '' }] }],
    instructionSections: [{ section: '', items: [''] }],
    
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
      } else if (this.returnBookId) {
        // Pre-select the book if coming from a book page
        this.formData.bookIds.push(this.returnBookId);
        
        // Load book name for display
        const book = this.books.find(b => b.id === this.returnBookId);
        if (book) {
          this.bookName = `${book.image} ${book.name}`;
        }
      }
    },
    
    // Check if recipe has advanced mode data (amount, unit, name structure)
    hasAdvancedData(ingredients) {
      if (!ingredients || ingredients.length === 0) return false;
      return ingredients.some(ing => 
        typeof ing === 'object' && (ing.amount !== undefined || ing.metric !== undefined)
      );
    },
    
    // Convert ingredient object to a string for simple mode
    ingredientToString(ingredient) {
      if (typeof ingredient === 'string') {
        return ingredient;
      }
      
      let str = '';
      if (ingredient.amount) {
        str += ingredient.amount;
        if (ingredient.metric) {
          str += ' ' + ingredient.metric;
        }
        str += ' ';
      } else if (ingredient.metric) {
        str += ingredient.metric + ' ';
      }
      str += ingredient.name || '';
      return str.trim();
    },
    
    // Convert string ingredient to object for advanced mode
    stringToIngredient(str) {
      if (typeof str === 'object') {
        return str;
      }
      return {
        amount: '',
        metric: '',
        name: str
      };
    },
    
    // Toggle between simple and advanced mode
    toggleIngredientMode() {
      // Check if switching to simple mode and if there's at least 1 ingredient
      if (this.advancedIngredientMode) {
        // Check if there's at least 1 ingredient with any data
        const hasIngredients = this.ingredientSections.some(section => 
          section.items.some(ing => 
            ing.amount || ing.metric || ing.name
          )
        );
        
        // Show warning only if there's at least 1 ingredient
        if (hasIngredients) {
          const confirmed = confirm('Switching to simple mode will condense the ingredients. Continue?');
          if (!confirmed) {
            return; // User canceled, don't switch modes
          }
        }
        
        // Switching to simple mode
        this.ingredientSections = this.ingredientSections.map(section => ({
          section: section.section,
          items: section.items.map(ing => this.ingredientToString(ing))
        }));
      } else {
        // Switching to advanced mode
        this.ingredientSections = this.ingredientSections.map(section => ({
          section: section.section,
          items: section.items.map(ing => this.stringToIngredient(ing))
        }));
      }
      this.advancedIngredientMode = !this.advancedIngredientMode;
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
          
          // Check if recipe uses sections
          const hasIngredientSections = recipe.ingredients?.length > 0 && recipe.ingredients[0]?.section !== undefined;
          const hasInstructionSections = recipe.instructions?.length > 0 && recipe.instructions[0]?.section !== undefined;
          
          // Load ingredients
          if (hasIngredientSections) {
            // Check if any section has simple mode items (strings)
            const isSimpleMode = recipe.ingredients.some(section => 
              section.items?.some(item => typeof item === 'string')
            );
            
            if (isSimpleMode) {
              this.advancedIngredientMode = false;
              this.ingredientSections = recipe.ingredients.map(section => ({
                section: section.section || '',
                items: section.items?.length > 0 ? section.items : ['']
              }));
            } else {
              this.advancedIngredientMode = true;
              this.ingredientSections = recipe.ingredients.map(section => ({
                section: section.section || '',
                items: section.items?.length > 0 
                  ? section.items.map(item => ({
                      amount: item.amount || '',
                      metric: item.metric || '',
                      name: item.name || ''
                    }))
                  : [{ amount: '', metric: '', name: '' }]
              }));
            }
          } else {
            // Convert flat to single section
            const isSimpleMode = recipe.ingredients?.some(ing => typeof ing === 'string');
            
            if (isSimpleMode) {
              this.advancedIngredientMode = false;
              const items = recipe.ingredients?.length > 0 
                ? recipe.ingredients
                : [''];
              this.ingredientSections = [{ section: '', items }];
            } else {
              this.advancedIngredientMode = true;
              const items = recipe.ingredients?.length > 0 
                ? recipe.ingredients.map(ing => ({
                    amount: ing.amount || '',
                    metric: ing.metric || '',
                    name: ing.name || ''
                  }))
                : [{ amount: '', metric: '', name: '' }];
              this.ingredientSections = [{ section: '', items }];
            }
          }
          
          // Load instructions
          if (hasInstructionSections) {
            this.instructionSections = recipe.instructions.map(section => ({
              section: section.section || '',
              items: section.items?.length > 0 ? section.items : ['']
            }));
          } else {
            // Convert flat to single section
            const items = recipe.instructions?.length > 0 ? recipe.instructions : [''];
            this.instructionSections = [{ section: '', items }];
          }
          
          // Load book name for breadcrumb
          const bookIdToShow = this.returnBookId || (this.formData.bookIds.length > 0 ? this.formData.bookIds[0] : null);
          if (bookIdToShow) {
            const book = this.books.find(b => b.id === bookIdToShow);
            if (book) {
              this.bookName = `${book.image} ${book.name}`;
            }
          }
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
      // Add to first section
      if (this.advancedIngredientMode) {
        this.ingredientSections[0].items.push({ amount: '', metric: '', name: '' });
      } else {
        this.ingredientSections[0].items.push('');
      }
    },
    
    removeIngredient(index) {
      this.ingredientSections[0].items.splice(index, 1);
      // If no items left, add an empty one
      if (this.ingredientSections[0].items.length === 0) {
        if (this.advancedIngredientMode) {
          this.ingredientSections[0].items.push({ amount: '', metric: '', name: '' });
        } else {
          this.ingredientSections[0].items.push('');
        }
      }
    },
    
    addInstruction() {
      // Add to first section
      this.instructionSections[0].items.push('');
    },
    
    removeInstruction(index) {
      if (this.instructionSections[0].items.length > 1) {
        this.instructionSections[0].items.splice(index, 1);
      }
    },
    
    // Helper methods for section detection
    hasMultipleIngredientSections() {
      return this.ingredientSections.length > 1;
    },
    
    hasMultipleInstructionSections() {
      return this.instructionSections.length > 1;
    },
    
    // Section management methods
    
    addIngredientSection() {
      if (this.advancedIngredientMode) {
        this.ingredientSections.push({
          section: '',
          items: [{ amount: '', metric: '', name: '' }]
        });
      } else {
        this.ingredientSections.push({
          section: '',
          items: ['']
        });
      }
    },
    
    removeIngredientSection(sectionIndex) {
      if (this.ingredientSections.length > 1) {
        const section = this.ingredientSections[sectionIndex];
        
        // Check if section has any data
        const hasData = section.section || section.items.some(item => {
          if (this.advancedIngredientMode) {
            return item.amount || item.metric || item.name;
          } else {
            return item && item.trim() !== '';
          }
        });
        
        if (hasData) {
          const confirmed = confirm('This section contains data. Are you sure you want to delete it?');
          if (!confirmed) {
            return; // User canceled, don't delete
          }
        }
        
        this.ingredientSections.splice(sectionIndex, 1);
      }
    },
    
    addIngredientToSection(sectionIndex) {
      if (this.advancedIngredientMode) {
        this.ingredientSections[sectionIndex].items.push({ amount: '', metric: '', name: '' });
      } else {
        this.ingredientSections[sectionIndex].items.push('');
      }
    },
    
    removeIngredientFromSection(sectionIndex, itemIndex) {
      this.ingredientSections[sectionIndex].items.splice(itemIndex, 1);
      // If no items left, add an empty one
      if (this.ingredientSections[sectionIndex].items.length === 0) {
        if (this.advancedIngredientMode) {
          this.ingredientSections[sectionIndex].items.push({ amount: '', metric: '', name: '' });
        } else {
          this.ingredientSections[sectionIndex].items.push('');
        }
      }
    },
    
    addInstructionSection() {
      this.instructionSections.push({
        section: '',
        items: ['']
      });
    },
    
    removeInstructionSection(sectionIndex) {
      if (this.instructionSections.length > 1) {
        const section = this.instructionSections[sectionIndex];
        
        // Check if section has any data
        const hasData = section.section || section.items.some(item => item && item.trim() !== '');
        
        if (hasData) {
          const confirmed = confirm('This section contains data. Are you sure you want to delete it?');
          if (!confirmed) {
            return; // User canceled, don't delete
          }
        }
        
        this.instructionSections.splice(sectionIndex, 1);
      }
    },
    
    addInstructionToSection(sectionIndex) {
      this.instructionSections[sectionIndex].items.push('');
    },
    
    removeInstructionFromSection(sectionIndex, itemIndex) {
      if (this.instructionSections[sectionIndex].items.length > 1) {
        this.instructionSections[sectionIndex].items.splice(itemIndex, 1);
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
        const draggedItem = this.ingredientSections[0].items[this.draggedIngredientIndex];
        this.ingredientSections[0].items.splice(this.draggedIngredientIndex, 1);
        this.ingredientSections[0].items.splice(targetIndex, 0, draggedItem);
        // Force reactivity update
        this.ingredientSections[0].items = [...this.ingredientSections[0].items];
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
        const draggedItem = this.instructionSections[0].items[this.draggedInstructionIndex];
        this.instructionSections[0].items.splice(this.draggedInstructionIndex, 1);
        this.instructionSections[0].items.splice(targetIndex, 0, draggedItem);
        // Force reactivity update
        this.instructionSections[0].items = [...this.instructionSections[0].items];
      }
      this.draggedInstructionIndex = null;
      this.dragOverInstructionIndex = null;
    },
    
    async submitForm() {
      this.submitting = true;
      
      // Filter out empty ingredients and instructions
      let cleanedIngredients, cleanedInstructions;
      
      // Clean ingredient sections
      const cleanedIngredientSections = this.ingredientSections
        .map(section => ({
          section: section.section,
          items: this.advancedIngredientMode
            ? section.items.filter(item => item.name && item.name.trim() !== '')
            : section.items.filter(item => typeof item === 'string' ? item.trim() !== '' : item.name && item.name.trim() !== '')
        }))
        .filter(section => section.items.length > 0);
      
      // If only one section with no name, flatten to array
      if (cleanedIngredientSections.length === 1 && !cleanedIngredientSections[0].section) {
        cleanedIngredients = cleanedIngredientSections[0].items;
      } else {
        cleanedIngredients = cleanedIngredientSections;
      }
      
      // Clean instruction sections
      const cleanedInstructionSections = this.instructionSections
        .map(section => ({
          section: section.section,
          items: section.items.filter(item => item.trim() !== '')
        }))
        .filter(section => section.items.length > 0);
      
      // If only one section with no name, flatten to array
      if (cleanedInstructionSections.length === 1 && !cleanedInstructionSections[0].section) {
        cleanedInstructions = cleanedInstructionSections[0].items;
      } else {
        cleanedInstructions = cleanedInstructionSections;
      }
      
      const cleanedData = {
        ...this.formData,
        servings: this.formData.servings ? parseInt(this.formData.servings) : undefined,
        ingredients: cleanedIngredients,
        instructions: cleanedInstructions
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
      
      // Validate section names when there are multiple sections
      if (cleanedIngredientSections.length > 1) {
        const hasEmptySectionName = cleanedIngredientSections.some(section => !section.section || section.section.trim() === '');
        if (hasEmptySectionName) {
          Toast.error('Please provide names for all ingredient sections when using multiple sections.', 'Validation Error', { duration: 5000 });
          this.submitting = false;
          return;
        }
      }
      
      if (cleanedInstructionSections.length > 1) {
        const hasEmptySectionName = cleanedInstructionSections.some(section => !section.section || section.section.trim() === '');
        if (hasEmptySectionName) {
          Toast.error('Please provide names for all instruction sections when using multiple sections.', 'Validation Error', { duration: 5000 });
          this.submitting = false;
          return;
        }
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
      if (this.isEditMode && this.recipeId) {
        // Redirect back to recipe page
        const bookId = this.returnBookId || (this.formData.bookIds.length > 0 ? this.formData.bookIds[0] : '');
        window.location.href = bookId 
          ? `recipe.html?id=${this.recipeId}&book=${bookId}`
          : `recipe.html?id=${this.recipeId}`;
      } else {
        window.location.href = '../index.html';
      }
    }
  }));
});
