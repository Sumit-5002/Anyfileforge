# Contributing to AnyFileForge

First off, thank you for considering contributing to AnyFileForge! It's people like you that make AnyFileForge such a great tool for engineers and researchers worldwide.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to contact@anyfileforge.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, code snippets)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (browser, OS, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any similar features** in other tools

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/anyfileforge.git
cd anyfileforge

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your Firebase credentials

# Start development server
npm run dev
```

## Coding Standards

### JavaScript/React
- Use functional components with hooks
- Follow existing code style (we use ES6+)
- Add comments for complex logic
- Keep components small and focused
- Use meaningful variable and function names

### CSS
- Use CSS custom properties (variables) defined in `index.css`
- Follow BEM naming convention when appropriate
- Keep styles modular (component-specific CSS files)
- Ensure responsive design (mobile-first approach)

### Commits
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Example:
```
Add PDF merge functionality

- Implement PDF merging using pdf-lib
- Add progress indicator for large files
- Update FileUploader component

Fixes #123
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── utils/          # Utility functions
├── services/       # API and Firebase services
├── firebase.js     # Firebase configuration
├── App.jsx         # Main app component
└── index.css       # Global styles
```

## Testing

(To be added - we need help setting up testing!)

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for functions
- Update inline comments for complex logic
- Create/update examples if needed

## Areas We Need Help

### High Priority
- [ ] Implement actual PDF processing (merge, split, compress)
- [ ] Add image conversion and compression
- [ ] Implement auto-delete functionality with Firebase
- [ ] Add file encryption/decryption

### Medium Priority
- [ ] Add unit and integration tests
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add more file format support
- [ ] Create API documentation

### Nice to Have
- [ ] Internationalization (i18n)
- [ ] Dark mode
- [ ] Offline support (Service Worker)
- [ ] Performance optimizations

## Questions?

Feel free to:
- Open an issue with the `question` label
- Email us at contact@anyfileforge.com
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AnyFileForge! 🎉**
