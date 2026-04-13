# Chemsroot Meta Ad Automation

A powerful, full-stack platform designed for Chemsroot Pharmaceutical to automate and optimize Meta ad campaigns. It features a modern, dark-themed dashboard with AI-driven creative generation and self-healing targeting logic.

## 🚀 Key Features

- **Automated Ad Publication**: Support for both **Single Image** and **Multi-Template Carousel** ads directly to the Meta Marketing API.
- **🛡️ Self-Healing Targeting**: Intelligent error handling that automatically detects deprecated Meta targeting interests and swaps them with recommended alternatives during publication.
- **🤖 AI Ad Copy**: Integrated with OpenRouter (OpenAI) to generate compelling ad headlines, descriptions, and body text.
- **📸 Smart Image Processing**: Automated logo watermarking and image optimization using `Sharp` before uploading to Meta.
- **📊 Real-time Analytics**: Interactive charts (powered by Recharts) fetching live Spend, Reach, and Click performance data from Meta Insights.
- **🛠️ Draft Workflow**: Seamlessly create, edit, and manage campaign drafts before they go live on Meta.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (Custom), Lucide Icons, Recharts.
- **Backend**: Node.js, Express, SQLite3.
- **APIs**: Meta Marketing API, OpenRouter/OpenAI.
- **Tools**: Sharp (Image processing), Multer (File uploads), Axios.

## 📥 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Meta Developer Account (App ID, Secret, and Access Token)
- OpenRouter API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arpitsehal/Meta-Ad-Automation.git
   cd Meta-Ad-Automation
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   # Create a .env file based on settings required in the app
   node server.js
   ```

3. **Setup Frontend:**
   ```bash
   cd ..
   npm install
   npm run dev
   ```

## 🏗️ Project Structure

- `/src`: React frontend components and pages.
- `/server`: Express backend server, database logic, and Meta API integration.
- `/server/assets/uploads`: Local storage for ad creatives.
- `chemsroot.db`: SQLite database for campaigns and settings.

## 📝 License

ISC License

---

*Built with ❤️ for Chemsroot Pharmaceutical.*

