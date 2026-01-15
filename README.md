# Recipe Hub

A recipe versioning site with history tracking that allows users to browse recipes, compare different versions, and organize them by cookbook.

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **CORS** - Cross-origin resource sharing middleware

### Frontend
- **HTML5** - Structure
- **CSS** - Styling (modular CSS files)
- **Alpine.js** - Reactive JavaScript framework
- **JavaScript** - Client-side functionality

## Project Structure

```
recipe-hub/
├── public/              # Frontend assets
│   ├── index.html       # Main page
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   └── pages/           # Additional HTML pages
├── server/              # Backend application
│   ├── index.js         # Express server entry point
│   └── routes/          # API route handlers
└── package.json         # Project dependencies and scripts
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- npm (comes with Node.js)

## Installation

### Install dependencies:
```bash
npm install
```

## Running the Application

### Production Mode
```bash
npm start
```

### Development Mode (with auto-restart)
```bash
npm run dev
```

The application will start on `http://localhost:3000` by default.

