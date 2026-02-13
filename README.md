<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<div align="center">

[![Deploy to GitHub Pages](https://github.com/ahmedmahere310-dev/Es-pro/actions/workflows/deploy.yml/badge.svg)](https://github.com/ahmedmahere310-dev/Es-pro/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

# AI Studio App

This is a React + TypeScript application built with Vite and deployed to GitHub Pages. Run your AI Studio app locally or view it online.

## 🚀 Quick Links

- **View Online:** [AI Studio App](https://ai.studio/apps/drive/1K1jLMu-nCzlLNw5_nkVyzUoxYCYirZvE)
- **GitHub Pages:** Deploy automatically on push to main branch
- **Live Demo:** Coming soon

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn

## 🏃 Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ahmedmahere310-dev/Es-pro.git
   cd Es-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:5173`

## 🔨 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📦 Project Structure

- `src/` - Source code (React components, TypeScript)
- `public/` - Static assets
- `dist/` - Built output (production)
- `.github/workflows/` - CI/CD configurations

## 🚀 Deployment

This project is automatically deployed to GitHub Pages when you push to the `main` branch. The deployment workflow:

1. Checks out the code
2. Installs dependencies
3. Builds the React app
4. Uploads artifacts to GitHub Pages
5. Deploys the app

Check the [Actions](https://github.com/ahmedmahere310-dev/Es-pro/actions) tab to monitor deployment status.

## 🔑 Environment Variables

Required secrets for GitHub Actions (set in repository settings):
- `VITE_API_URL` - API endpoint URL (if needed)

## 📄 License

This project is open source and available under the MIT License.