// Recipe detail page - Load specific recipe using Alpine.js
const API_URL = '/api';

// Unit conversion utility
const UnitConverter = {
  conversions: {
    'g': { type: 'weight', toBase: 1, system: 'metric' },
    'kg': { type: 'weight', toBase: 1000, system: 'metric' },
    'oz': { type: 'weight', toBase: 28.3495, system: 'imperial' },
    'lb': { type: 'weight', toBase: 453.592, system: 'imperial' },
    'ml': { type: 'volume', toBase: 1, system: 'metric' },
    'l': { type: 'volume', toBase: 1000, system: 'metric' },
    'L': { type: 'volume', toBase: 1000, system: 'metric' },
    'cup': { type: 'volume', toBase: 236.588, system: 'imperial' },
    'cups': { type: 'volume', toBase: 236.588, system: 'imperial' },
    'tbsp': { type: 'volume', toBase: 14.7868, system: 'imperial' },
    'tsp': { type: 'volume', toBase: 4.92892, system: 'imperial' },
    'fl oz': { type: 'volume', toBase: 29.5735, system: 'imperial' },
    'pint': { type: 'volume', toBase: 473.176, system: 'imperial' },
    'quart': { type: 'volume', toBase: 946.353, system: 'imperial' },
    'gallon': { type: 'volume', toBase: 3785.41, system: 'imperial' }
  },
  
  preferredUnits: {
    metric: {
      weight: ['g', 'kg'],
      volume: ['ml', 'L']
    },
    imperial: {
      weight: ['oz', 'lb'],
      volume: ['tsp', 'tbsp', 'cup', 'fl oz']
    }
  },
  
  convert(amount, fromUnit, toSystem) {
    if (!fromUnit || !this.conversions[fromUnit]) {
      return { amount, unit: fromUnit };
    }
    
    const fromConversion = this.conversions[fromUnit];
    const fromSystem = fromConversion.system;
    
    if (fromSystem === toSystem) {
      return { amount, unit: fromUnit };
    }
    
    const baseAmount = amount * fromConversion.toBase;
    const measurementType = fromConversion.type;
    const targetUnits = this.preferredUnits[toSystem][measurementType];
    
    if (!targetUnits) {
      return { amount, unit: fromUnit };
    }
    
    let bestUnit = targetUnits[0];
    let bestAmount = baseAmount / this.conversions[bestUnit].toBase;
    
    for (const targetUnit of targetUnits) {
      const converted = baseAmount / this.conversions[targetUnit].toBase;
      if (converted >= 0.25 && converted < 1000) {
        if (bestAmount < 0.25 || bestAmount >= 1000 || (converted >= 1 && converted < bestAmount)) {
          bestUnit = targetUnit;
          bestAmount = converted;
        }
      }
    }
    
    bestAmount = this.roundByUnit(bestAmount, bestUnit);
    return { amount: bestAmount, unit: bestUnit };
  },
  
  roundByUnit(amount, unit) {
    if (unit === 'tsp' || unit === 'tbsp') {
      if (amount < 5) return Math.round(amount * 4) / 4;
      return Math.round(amount * 2) / 2;
    }
    if (unit === 'cup' || unit === 'cups') {
      if (amount < 2) return Math.round(amount * 8) / 8;
      return Math.round(amount * 4) / 4;
    }
    if (unit === 'fl oz') {
      if (amount < 10) return Math.round(amount * 2) / 2;
      return Math.round(amount);
    }
    if (unit === 'oz') {
      if (amount < 10) return Math.round(amount * 2) / 2;
      return Math.round(amount);
    }
    if (unit === 'lb') {
      if (amount < 2) return Math.round(amount * 4) / 4;
      return Math.round(amount * 2) / 2;
    }
    if (unit === 'g') {
      if (amount < 50) return Math.round(amount / 5) * 5;
      if (amount < 500) return Math.round(amount / 10) * 10;
      return Math.round(amount / 25) * 25;
    }
    if (unit === 'kg') {
      if (amount < 5) return Math.round(amount * 10) / 10;
      return Math.round(amount * 4) / 4;
    }
    if (unit === 'ml') {
      if (amount < 50) return Math.round(amount / 5) * 5;
      if (amount < 250) return Math.round(amount / 10) * 10;
      return Math.round(amount / 25) * 25;
    }
    if (unit === 'l' || unit === 'L') {
      if (amount < 5) return Math.round(amount * 10) / 10;
      return Math.round(amount * 4) / 4;
    }
    if (unit === 'pint' || unit === 'quart' || unit === 'gallon') {
      if (amount < 2) return Math.round(amount * 4) / 4;
      return Math.round(amount * 2) / 2;
    }
    return Math.round(amount * 100) / 100;
  },
  
  formatAmount(amount) {
    if (amount % 1 === 0) {
      return amount.toString();
    } else if (amount < 1) {
      return this.formatAsFraction(amount);
    } else {
      const whole = Math.floor(amount);
      const decimal = amount - whole;
      
      if (decimal < 0.05) return whole.toString();
      
      const fractionStr = this.formatAsFraction(decimal);
      if (fractionStr.includes('/') || fractionStr.match(/[¼½¾⅓⅔]/)) {
        return whole > 0 ? `${whole} ${fractionStr}` : fractionStr;
      }
      
      return (Math.round(amount * 10) / 10).toString();
    }
  },
  
  formatAsFraction(decimal) {
    const fractions = [
      { value: 0.125, symbol: '⅛' },
      { value: 0.25, symbol: '¼' },
      { value: 0.33, symbol: '⅓' },
      { value: 0.5, symbol: '½' },
      { value: 0.67, symbol: '⅔' },
      { value: 0.75, symbol: '¾' }
    ];
    
    for (const fraction of fractions) {
      if (Math.abs(decimal - fraction.value) < 0.05) {
        return fraction.symbol;
      }
    }
    
    return (Math.round(decimal * 10) / 10).toString();
  }
};

document.addEventListener('alpine:init', () => {
  Alpine.data('recipeDetail', () => ({
    recipeId: null,
    bookId: null,
    bookName: 'Recipe Book',
    recipe: {
      name: '',
      description: '',
      cookTime: '',
      servings: '',
      viewCount: 0,
      ingredients: [],
      instructions: []
    },
    multiplier: 1,
    checkedIngredients: {},
    checkedInstructions: {},
    ingredientUnitStates: {},
    viewCount: 0,
    hasRevisions: false,
    
    // Check if ingredients are in sectioned format
    hasIngredientSections() {
      return this.recipe.ingredients && 
             this.recipe.ingredients.length > 0 && 
             this.recipe.ingredients[0].section !== undefined;
    },
    
    // Check if instructions are in sectioned format
    hasInstructionSections() {
      return this.recipe.instructions && 
             this.recipe.instructions.length > 0 && 
             this.recipe.instructions[0].section !== undefined;
    },
    
    // Get the step number for sectioned instructions
    getStepNumber(sectionIndex, index) {
      let stepCount = 0;
      for (let i = 0; i < sectionIndex; i++) {
        stepCount += this.recipe.instructions[i].items.length;
      }
      return stepCount + index + 1;
    },
    
    async init() {
      const params = new URLSearchParams(window.location.search);
      this.recipeId = params.get('id');
      this.bookId = params.get('book');
      
      if (!this.recipeId) {
        window.location.href = '../index.html';
        return;
      }
      
      try {
        if (this.bookId) {
          await this.loadBookName();
        }
        
        const response = await fetch(`${API_URL}/recipes/${this.recipeId}`);
        this.recipe = await response.json();
        document.title = `${this.recipe.name} - Recipe Hub`;
        
        this.viewCount = this.recipe.viewCount || Math.floor(Math.random() * 5000) + 100;
        
        await this.checkVersions();
      } catch (error) {
        console.error('Error loading recipe:', error);
      }
      
      const successMessage = sessionStorage.getItem('successMessage');
      if (successMessage) {
        Toast.success(successMessage, 'Success', { duration: 4000 });
        sessionStorage.removeItem('successMessage');
      }
    },
    
    async loadBookName() {
      try {
        const booksResponse = await fetch(`${API_URL}/books`);
        const books = await booksResponse.json();
        const book = books.find(b => b.id === this.bookId);
        if (book) {
          this.bookName = book.name;
        }
      } catch (error) {
        console.error('Error loading book name:', error);
      }
    },
    
    async checkVersions() {
      try {
        const response = await fetch(`${API_URL}/versions/recipe/${this.recipeId}`);
        if (response.ok) {
          const versions = await response.json();
          this.hasRevisions = versions && versions.length >= 2;
        }
      } catch (error) {
        console.log('No versions available');
      }
    },
    
    goToRevisions() {
      window.location.href = `compare.html?recipeId=${this.recipeId}&bookId=${this.bookId}`;
    },
    
    editRecipe() {
      window.location.href = `add-recipe.html?id=${this.recipeId}&book=${this.bookId}`;
    },
    
    setMultiplier(value) {
      this.multiplier = value;
    },
    
    isConvertible(unit) {
      return unit && UnitConverter.conversions[unit] !== undefined;
    },
    
    toggleUnit(index) {
      const currentState = this.ingredientUnitStates[index] || 'original';
      this.ingredientUnitStates[index] = currentState === 'original' ? 'converted' : 'original';
    },
    
    formatIngredient(ingredient, index) {
      if (!ingredient.amount) {
        return ingredient.name;
      }
      
      let amount = ingredient.amount * this.multiplier;
      let metric = ingredient.metric || '';
      
      // Apply unit conversion if toggled
      if (metric && this.ingredientUnitStates[index] === 'converted' && this.isConvertible(metric)) {
        const conversion = UnitConverter.conversions[metric];
        const currentSystem = conversion.system;
        const targetSystem = currentSystem === 'metric' ? 'imperial' : 'metric';
        const converted = UnitConverter.convert(amount, metric, targetSystem);
        amount = converted.amount;
        metric = converted.unit;
      }
      
      const formattedAmount = UnitConverter.formatAmount(amount);
      const metricDisplay = metric ? ` ${metric}` : '';
      return `<span class="ingredient-measurement">${formattedAmount}${metricDisplay}</span> ${ingredient.name}`;
    },
    
    handleIngredientClick(event, index) {
      // Let checkbox and button handle their own clicks
      if (event.target.type === 'checkbox') return;
      if (event.target.classList.contains('unit-convert-btn')) return;
      if (event.target.tagName === 'LABEL' || event.target.closest('label')) return;
      
      // For other areas, manually toggle
      this.checkedIngredients[index] = !this.checkedIngredients[index];
    },
    
    toggleInstructionStep(index) {
      this.checkedInstructions[index] = !this.checkedInstructions[index];
    },
    
    deleteRecipe() {
      if (confirm(`Are you sure you want to delete "${this.recipe.name}"? This action cannot be undone.`)) {
        Toast.info('Delete functionality coming soon!', 'Not Implemented');
      }
    }
  }));
});

