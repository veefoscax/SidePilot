# 🤝 Contributing to SidePilot

First off, thank you for considering contributing to SidePilot! It's people like you who make SidePilot such a great tool for the AI and browser automation community.

---

## 🚀 How to Get Started

1.  **Fork the Repository**: Create your own copy of the project.
2.  **Clone Locally**: `git clone https://github.com/your-username/SidePilot.git`
3.  **Install Dependencies**: `npm install`
4.  **Create a Branch**: `git checkout -b feat/your-feature-name`
5.  **Make Changes**: Implement your feature or bug fix.
6.  **Run Tests**: `npm test`
7.  **Submit a PR**: Push your branch and open a Pull Request.

---

## 📜 Coding Standards

- **Conventional Commits**: Please use [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).
- **TypeScript**: All new code must be strictly typed. Avoid `any` where possible.
- **Components**: Use Tailwind CSS for styling and follow the existing ShadcnUI pattern.
- **Architecture**: Adhere to the `BaseProvider` and `ToolDefinition` abstractions when adding new LLMs or tools.

---

## 🧪 Testing

We use **Vitest** for unit testing and **Playwright** for E2E testing. 
Every new feature should include:
1.  Unit tests for business logic.
2.  Component tests for UI elements.
3.  E2E tests for full browser automation flows.

---

## 🐛 Bug Reports

When reporting a bug, please include:
- Extension version.
- Browser version (Chrome/Edge).
- Steps to reproduce.
- Expected vs. Actual behavior.
- (Optional) Relevant logs from the Console or Network tab.

---

## 🛡️ Code of Conduct

We follow a professional and inclusive code of conduct. Please be respectful to all maintainers and contributors.

---
*Happy coding!* 🚀
