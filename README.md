<div align="center">
  <img src="public/logo.svg" width="120" height="120" alt="Live Diff Logo" />
  <h1>Live Diff</h1>
  <p><b>Modern, real-time, and high-granularity code comparison tool.</b></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
</div>

---

**Live Diff** is a sophisticated, real-time, and interactive web tool built for developers and AI enthusiasts who need to pinpoint differences between text or code instantly. Featuring high-granularity diffing and support for 20+ languages, it offers a premium experience for comparing AI outputs, code snippets, or any text content.

## 🚀 Key Features

- **⚡ Real-time Diffing**: Instant feedback as you type or paste—no lag, no waiting.
- **🌈 Smart Syntax Highlighting**: Auto-detection or manual selection for 20+ languages including JS, TS, Python, TeX, and more.
- **🌓 Adaptive Themes**: Beautifully crafted Light and Dark modes that respect your eyes and OS preferences.
- **📊 Live Insights**: Word and character counts updated in real-time.
- **🛠️ Professional Layout**:
  - **Split & Unified Views**: Choose the best way to visualize changes.
  - **Resizable Workspace**: Adjust the editor and diff preview heights to fit your flow.
  - **Fullscreen Diff**: Focus entirely on the changes with a distraction-free mode.
- **💾 Persistent Workspace**: Your settings (themes, heights, preferences) are automatically saved via LocalStorage.

## 🛠️ Built With

| Tech | Description |
| :--- | :--- |
| **React 19** | The foundation for a reactive and performant UI. |
| **TypeScript** | Ensuring rock-solid type safety throughout the app. |
| **Vite** | Ultra-fast build and development experience. |
| **Tailwind CSS** | Modern styling for a sleek, responsive interface. |
| **Monaco Editor** | The power of VS Code's editor right in your browser. |

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yhzhu99/live-diff.git
   cd live-diff
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Launch the development server**
   ```bash
   npm run dev
   ```

4. **Enjoy**
   Open your browser to [http://localhost:3000](http://localhost:3000) and start comparing!

## 📖 How to Use

1. **Input**: Paste your *original* content on the left and *modified* content on the right.
2. **Configure**: Use the **Language** selector for specialized syntax highlighting.
3. **Compare**: Scroll through the **Diff Preview** at the bottom to see highlighted changes.

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">
  Built with ❤️ by the Live Diff team.
</div>
