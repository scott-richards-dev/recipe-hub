# Firestore Schema

## Structure

```
users/{userId}/
  ├── books/{bookId}
  └── recipes/{recipeId}/
      └── versions/{versionId}
```

## Collections

### User
**Path:** `users/{userId}`
```javascript
{
  userId: string,
  email: string,
  displayName: string,
  recipeCount: number,
  bookCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Book
**Path:** `users/{userId}/books/{bookId}`
```javascript
{
  id: string,
  userId: string,
  name: string,
  description: string,
  image: string,
  recipeIds: array,
  recipeCount: number,
  isPublic: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Recipe
**Path:** `users/{userId}/recipes/{recipeId}`
```javascript
{
  id: string,
  userId: string,
  name: string,
  description: string,
  cookTime: string,
  servings: number,
  ingredients: array,      // Simple: [{amount?, metric?, name}] OR Sectioned: [{section, items: [{amount?, metric?, name}]}]
  instructions: array,     // Simple: [string] OR Sectioned: [{section, items: [string]}]
  bookId: string,
  originalSource: string,  // Optional: Source of the recipe (e.g., cookbook, website, person)
  viewCount: number,
  currentVersion: number,
  tags: array,
  isPublic: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Version
**Path:** `users/{userId}/recipes/{recipeId}/versions/{versionId}`
```javascript
{
  id: string,
  recipeId: string,
  userId: string,
  version: number,
  timestamp: timestamp,
  author: string,
  notes: string,
  data: object             // Complete recipe snapshot
}
```
