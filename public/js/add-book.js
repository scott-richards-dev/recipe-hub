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
    loading: false,
    
    async init() {
      const params = new URLSearchParams(window.location.search);
      this.bookId = params.get('id');
      
      // Set loading state immediately if in edit mode to show skeleton first
      if (this.bookId) {
        this.isEditMode = true;
        this.loading = true;
      }
      
      // Check auth first
      await initAuthenticatedPage();
      
      if (this.bookId) {
        await this.loadBookData();
      }
    },
    
    async loadBookData() {
      try {
        const response = await authService.fetchWithAuth(`${API_URL}/books`);
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
      } finally {
        this.loading = false;
      }
    },
    
    async submitForm() {
      this.submitting = true;
      
      try {
        const url = this.isEditMode ? `${API_URL}/books/${this.bookId}` : `${API_URL}/books`;
        const method = this.isEditMode ? 'PUT' : 'POST';
        
        const response = await authService.fetchWithAuth(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          const successMsg = this.isEditMode 
            ? data.message || `"${this.formData.name}" has been updated successfully!`
            : data.message || `"${this.formData.name}" has been added successfully!`;
          sessionStorage.setItem('successMessage', successMsg);
          
          const redirectId = this.isEditMode ? this.bookId : data.id;
          if (redirectId) {
            window.location.href = `book.html?id=${redirectId}`;
          } else {
            window.location.href = '../index.html';
          }
        } else {
          const errorMsg = this.isEditMode 
            ? 'Failed to update book. Please try again.'
            : 'Failed to add book. Please try again.';
          Toast.error(data.error || errorMsg, 'Error', { duration: 5000 });
        }
      } catch (error) {
        console.error('Error saving book:', error);
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
        window.location.href = `book.html?id=${this.bookId}`;
      } else {
        window.location.href = '../index.html';
      }
    }
  }));
});
