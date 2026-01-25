# Live Diff 🚀

**Live Diff** is a modern, real-time, and interactive code comparison tool built for developers who need to quickly identify changes between text snippets or code files. It provides a clean, responsive interface with high-granularity diffing and syntax highlighting for over 20+ languages.

## ✨ Features

- **⚡ Real-time Diffing**: See changes instantly as you type or paste content.
- **🌈 Syntax Highlighting**: Automatic or manual language selection for 20+ languages including JavaScript, TypeScript, Python, C++, TeX, and more.
- **🔍 High Granularity**: Support for word-level and character-level diffing to pinpoint even the smallest changes.
- **🌓 Dark & Light Modes**: Seamless switching between themes that are easy on the eyes.
- **📊 Content Statistics**: Live word count comparison and change metrics.
- **🛠️ Flexible Layout**:
  - **Split View**: Side-by-side comparison for clear alignment.
  - **Unified View**: Inline comparison for a more compact look.
  - **Resizable Editors**: Adjust the workspace to fit your needs.
  - **Fullscreen Preview**: Deep dive into the changes with a distraction-free mode.
- **💾 Persistent Settings**: Your preferences (theme, diff style, editor height) are automatically saved to your browser.
- **🔄 Productivity Utilities**: One-click swap between original/modified content and a quick clear button.

## 🛠️ Tech Stack

- **React 19**: Modern frontend framework.
- **TypeScript**: Type-safe development.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS**: Utility-first styling for a premium aesthetic.
- **@pierre/diffs**: Robust core diffing engine.
- **Highlight.js**: High-performance syntax highlighting and auto-detection.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yhzhu99/live-diff.git
   cd live-diff
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## 📖 Usage

1. **Paste Content**: Enter your original text in the left panel and the modified version in the right panel.
2. **Select Language**: Use the dropdown in the header to select a language for syntax highlighting (or leave it on **Auto**).
3. **Customize View**: Use the gear icon to open settings and adjust diff granularity, line numbers, or text wrapping.
4. **Compare**: View the results in the **Diff Preview** section at the bottom.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
