// Add book page - Handle form submission using Alpine.js
const API_URL = '/api';

document.addEventListener('alpine:init', () => {
  Alpine.data('addBookForm', () => ({
    formData: {
      name: '',
      description: '',
      image: ''
    },
    availableEmojis: [
      '🍝', '🍕', '🍰', '🎂', '🍪', '🥐',
      '🥘', '🍲', '🍜', '🍛', '🍳', '🥗',
      '🍔', '🌮', '🌯', '🥙', '🥪', '🍱',
      '🍣', '🍤', '🦞', '🦀', '🐟', '🍖',
      '🥩', '🍗', '🍟', '🍿', '🧀', '🥓',
      '🥚', '🍞', '🥖', '🥨', '🥯', '🧇',
      '🥞', '🍩', '🍮', '🍯', '🥛', '☕'
    ],
    submitting: false,
    isEditMode: false,
    bookId: null,
    
    async init() {
      // Check if we're in edit mode
      const params = new URLSearchParams(window.location.search);
      this.bookId = params.get('id');
      
      if (this.bookId) {
        this.isEditMode = true;
        await this.loadBookData();
      }
    },
    
    async loadBookData() {
      try {
        const response = await fetch(`${API_URL}/books`);
        const books = await response.json();
        const book = books.find(b => b.id === this.bookId);
        
        if (book) {
          this.formData.name = book.name;
          this.formData.description = book.description;
          this.formData.image = book.image;
        } else {
          Toast.error('Book not found', 'Error', { duration: 3000 });
          setTimeout(() => window.location.href = '../index.html', 1500);
        }
      } catch (error) {
        console.error('Error loading book data:', error);
        Toast.error('Failed to load book data', 'Error', { duration: 3000 });
      }
    },
    
    async submitForm() {
      this.submitting = true;
      
      try {
        const url = this.isEditMode ? `${API_URL}/books/${this.bookId}` : `${API_URL}/books`;
        const method = this.isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store success message in sessionStorage
          const successMsg = this.isEditMode 
            ? data.message || `"${this.formData.name}" has been updated successfully!`
            : data.message || `"${this.formData.name}" has been added successfully!`;
          sessionStorage.setItem('successMessage', successMsg);
          
          // Redirect to the book page
          const redirectId = this.isEditMode ? this.bookId : data.id;
          if (redirectId) {
            window.location.href = `book.html?id=${redirectId}`;
          } else {
            window.location.href = '../index.html';
          }
        } else {
          // Show error toast
          const errorMsg = this.isEditMode 
            ? 'Failed to update book. Please try again.'
            : 'Failed to add book. Please try again.';
          Toast.error(
            data.error || errorMsg,
            'Error',
            { duration: 5000 }
          );
        }
      } catch (error) {
        console.error('Error saving book:', error);
        // Show error toast
        Toast.error(
          'Failed to save book. Please check your connection and try again.',
          'Connection Error',
          { duration: 5000 }
        );
      } finally {
        this.submitting = false;
      }
    },
    
    selectEmoji(emoji) {
      this.formData.image = emoji;
    },
    
    cancel() {
      if (this.isEditMode && this.bookId) {
        // Redirect back to book page
        window.location.href = `book.html?id=${this.bookId}`;
      } else {
        window.location.href = '../index.html';
      }
    }
  }));
});
