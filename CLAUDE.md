# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run svelte-kit sync and svelte-check
- `npm run check:watch` - Run svelte-kit sync and svelte-check in watch mode

## Code Style Guidelines

### Formatting
- Use 2-space indentation
- Use single quotes for strings
- Use semicolons at the end of statements

### Naming Conventions
- Component files: PascalCase.svelte
- Utility files: kebab-case.js
- Store files: camelCase.js
- Functions and variables: camelCase
- CSS classes: kebab-case

### Svelte Patterns
- Export props at the top of component scripts
- Group reactive declarations with $: syntax
- Use bind:value for form inputs
- Organize component files with script, markup, then style

### JavaScript Patterns
- Use ES6 features (arrow functions, destructuring, spread)
- Document functions with JSDoc comments
- Use early returns for error handling
- Always validate user input on the server

### Imports
- Use $lib aliases for internal imports
- Group imports by: framework, third-party, internal