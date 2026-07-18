# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always DO
- Read SPEC.md before planning
- Update SPEC.md for major architectural and technical changes

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