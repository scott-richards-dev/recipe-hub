// Compare page functionality using Alpine.js
const API_URL = '/api';

document.addEventListener('alpine:init', () => {
  Alpine.data('compareVersions', () => ({
    recipeId: null,
    bookId: null,
    bookName: 'Recipe Book',
    recipeName: 'Recipe',
    allVersions: [],
    selectedV1: '',
    selectedV2: '',
    version1Data: null,
    version2Data: null,
    stats: { additions: 0, deletions: 0, changes: 0 },
    versionInfoHTML: '',
    comparisonHTML: '',
    
    async init() {
      const urlParams = new URLSearchParams(window.location.search);
      this.recipeId = urlParams.get('recipeId');
      this.bookId = urlParams.get('bookId');
      const v1 = urlParams.get('v1');
      const v2 = urlParams.get('v2');
      
      // Fetch book name from backend if bookId is provided
      if (this.bookId) {
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
      }
      
      if (this.recipeId) {
        await this.loadVersions(v1, v2);
      }
    },
    
    async loadVersions(v1 = null, v2 = null) {
      try {
        const response = await fetch(`/api/versions/recipe/${this.recipeId}`);
        if (!response.ok) throw new Error('Failed to load versions');
        
        this.allVersions = await response.json();
        this.allVersions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (this.allVersions.length > 0) {
          this.recipeName = this.allVersions[0].data.name;
        }
        
        // Set initial selections if provided in URL
        if (v1 && v2) {
          this.selectedV1 = v1;
          this.selectedV2 = v2;
          await this.compareVersions();
        } else if (this.allVersions.length >= 2) {
          // Auto-select the two most recent versions
          this.selectedV1 = this.allVersions[1].id;
          this.selectedV2 = this.allVersions[0].id;
          await this.compareVersions();
        }
      } catch (error) {
        console.error('Error loading versions:', error);
      }
    },
    
    async compareVersions() {
      if (!this.selectedV1 || !this.selectedV2) return;
      
      this.version1Data = this.allVersions.find(v => v.id === this.selectedV1);
      this.version2Data = this.allVersions.find(v => v.id === this.selectedV2);
      
      if (this.version1Data && this.version2Data) {
        this.displayVersionInfo();
        this.displayComparison();
      }
    },
    
    displayVersionInfo() {
      this.versionInfoHTML = `
        <div class="version-info-card">
          <h3>v${this.version1Data.version}</h3>
          <div class="version-meta">
            <div><strong>Date:</strong> ${new Date(this.version1Data.timestamp).toLocaleString()}</div>
            ${this.version1Data.notes ? `<div class="version-notes">${this.version1Data.notes}</div>` : ''}
          </div>
        </div>
        <div class="comparison-arrow">
          <span>→</span>
        </div>
        <div class="version-info-card">
          <h3>v${this.version2Data.version}</h3>
          <div class="version-meta">
            <div><strong>Date:</strong> ${new Date(this.version2Data.timestamp).toLocaleString()}</div>
            ${this.version2Data.notes ? `<div class="version-notes">${this.version2Data.notes}</div>` : ''}
          </div>
        </div>
      `;
    },
    
    displayComparison() {
      this.stats = { additions: 0, deletions: 0, changes: 0 };
      
      let html = '';
      html += this.compareMetadata();
      html += this.compareArray('Ingredients', this.version1Data.data.ingredients, this.version2Data.data.ingredients);
      html += this.compareArray('Instructions', this.version1Data.data.instructions, this.version2Data.data.instructions);
      
      this.comparisonHTML = html;
    },
    
    compareMetadata() {
      const fields = [
        { label: 'Recipe Name', key: 'name' },
        { label: 'Description', key: 'description' },
        { label: 'Cook Time', key: 'cookTime' },
        { label: 'Servings', key: 'servings' },
        { label: 'View Count', key: 'viewCount' }
      ];
      
      let hasChanges = false;
      let leftContent = '';
      let rightContent = '';
      
      fields.forEach((field, index) => {
        const lineNumber = index + 1;
        const value1 = this.version1Data.data[field.key];
        const value2 = this.version2Data.data[field.key];
        const changed = value1 !== value2;
        
        if (changed) {
          hasChanges = true;
          this.stats.changes++;
          
          leftContent += `
            <div class="diff-line deletion">
              <div class="line-number">${lineNumber}</div>
              <div class="line-marker">-</div>
              <div class="line-content"><strong>${field.label}:</strong> ${this.escapeHtml(String(value1))}</div>
            </div>
          `;
          rightContent += `
            <div class="diff-line addition">
              <div class="line-number">${lineNumber}</div>
              <div class="line-marker">+</div>
              <div class="line-content"><strong>${field.label}:</strong> ${this.escapeHtml(String(value2))}</div>
            </div>
          `;
        } else {
          leftContent += `
            <div class="diff-line unchanged">
              <div class="line-number">${lineNumber}</div>
              <div class="line-marker"></div>
              <div class="line-content"><strong>${field.label}:</strong> ${this.escapeHtml(String(value1))}</div>
            </div>
          `;
          rightContent += `
            <div class="diff-line unchanged">
              <div class="line-number">${lineNumber}</div>
              <div class="line-marker"></div>
              <div class="line-content"><strong>${field.label}:</strong> ${this.escapeHtml(String(value1))}</div>
            </div>
          `;
        }
      });
      
      const status = hasChanges ? 'changed' : 'unchanged';
      const statusText = hasChanges ? 'Changed' : 'No changes';
      
      return `
        <div class="diff-section">
          <div class="diff-header">
            <h3>Details</h3>
            <span class="diff-status ${status}">${statusText}</span>
          </div>
          <div class="diff-content split-view">
            <div class="diff-headers">
              <div class="pane-header">v${this.version1Data.version}</div>
              <div class="pane-header">v${this.version2Data.version}</div>
            </div>
            ${this.createLinePairs(leftContent, rightContent)}
          </div>
        </div>
      `;
    },
    
    compareArray(label, array1, array2) {
      const maxLength = Math.max(array1.length, array2.length);
      const changes = [];
      let hasChanges = false;
      
      for (let i = 0; i < maxLength; i++) {
        const item1 = array1[i] || null;
        const item2 = array2[i] || null;
        
        const isIngredient = label === 'Ingredients';
        const stringItem1 = isIngredient && item1 ? this.formatIngredient(item1) : item1;
        const stringItem2 = isIngredient && item2 ? this.formatIngredient(item2) : item2;
        const areEqual = isIngredient ? this.compareIngredients(item1, item2) : (item1 === item2);
        
        if (item1 === null && item2 !== null) {
          changes.push({ type: 'addition', content: stringItem2, index: i + 1 });
          this.stats.additions++;
          hasChanges = true;
        } else if (item1 !== null && item2 === null) {
          changes.push({ type: 'deletion', content: stringItem1, index: i + 1 });
          this.stats.deletions++;
          hasChanges = true;
        } else if (!areEqual) {
          changes.push({ type: 'modification', content1: stringItem1, content2: stringItem2, index: i + 1 });
          this.stats.changes++;
          hasChanges = true;
        } else {
          changes.push({ type: 'unchanged', content: stringItem1, index: i + 1 });
        }
      }
      
      let leftLines = '';
      let rightLines = '';
      
      changes.forEach(change => {
        if (change.type === 'unchanged') {
          const lineHtml = `
            <div class="diff-line unchanged">
              <div class="line-number">${change.index}</div>
              <div class="line-marker"></div>
              <div class="line-content">${this.escapeHtml(change.content)}</div>
            </div>
          `;
          leftLines += lineHtml;
          rightLines += lineHtml;
        } else if (change.type === 'addition') {
          leftLines += `
            <div class="diff-line empty">
              <div class="line-number"></div>
              <div class="line-marker"></div>
              <div class="line-content"></div>
            </div>
          `;
          rightLines += `
            <div class="diff-line addition">
              <div class="line-number">${change.index}</div>
              <div class="line-marker">+</div>
              <div class="line-content">${this.escapeHtml(change.content)}</div>
            </div>
          `;
        } else if (change.type === 'deletion') {
          leftLines += `
            <div class="diff-line deletion">
              <div class="line-number">${change.index}</div>
              <div class="line-marker">-</div>
              <div class="line-content">${this.escapeHtml(change.content)}</div>
            </div>
          `;
          rightLines += `
            <div class="diff-line empty">
              <div class="line-number"></div>
              <div class="line-marker"></div>
              <div class="line-content"></div>
            </div>
          `;
        } else if (change.type === 'modification') {
          leftLines += `
            <div class="diff-line deletion">
              <div class="line-number">${change.index}</div>
              <div class="line-marker">-</div>
              <div class="line-content">${this.escapeHtml(change.content1)}</div>
            </div>
          `;
          rightLines += `
            <div class="diff-line addition">
              <div class="line-number">${change.index}</div>
              <div class="line-marker">+</div>
              <div class="line-content">${this.escapeHtml(change.content2)}</div>
            </div>
          `;
        }
      });
      
      const status = hasChanges ? 'changed' : 'unchanged';
      const statusText = hasChanges ? 'Changed' : 'No changes';
      
      return `
        <div class="diff-section">
          <div class="diff-header">
            <h3>${label}</h3>
            <span class="diff-status ${status}">${statusText}</span>
          </div>
          <div class="diff-content split-view">
            <div class="diff-headers">
              <div class="pane-header">v${this.version1Data.version}</div>
              <div class="pane-header">v${this.version2Data.version}</div>
            </div>
            ${this.createLinePairs(leftLines, rightLines)}
          </div>
        </div>
      `;
    },
    
    formatIngredient(ingredient) {
      if (typeof ingredient === 'string') return ingredient;
      if (!ingredient.amount) return ingredient.name;
      
      const metric = ingredient.metric ? ` ${ingredient.metric}` : '';
      return `${ingredient.amount}${metric} ${ingredient.name}`;
    },
    
    compareIngredients(ing1, ing2) {
      if (ing1 === null && ing2 === null) return true;
      if (ing1 === null || ing2 === null) return false;
      
      return ing1.amount === ing2.amount &&
             ing1.metric === ing2.metric &&
             ing1.name === ing2.name;
    },
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    createLinePairs(leftHtml, rightHtml) {
      const tempLeft = document.createElement('div');
      const tempRight = document.createElement('div');
      tempLeft.innerHTML = leftHtml;
      tempRight.innerHTML = rightHtml;
      
      const leftLines = Array.from(tempLeft.querySelectorAll('.diff-line'));
      const rightLines = Array.from(tempRight.querySelectorAll('.diff-line'));
      
      const maxLength = Math.max(leftLines.length, rightLines.length);
      let pairsHtml = '';
      
      for (let i = 0; i < maxLength; i++) {
        const leftLine = leftLines[i] ? leftLines[i].outerHTML : '';
        const rightLine = rightLines[i] ? rightLines[i].outerHTML : '';
        pairsHtml += `<div class="diff-line-pair">${leftLine}${rightLine}</div>`;
      }
      
      return pairsHtml;
    }
  }));
});
