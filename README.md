# 🔬 Tissue Deck

**Tissue Deck** is a free, open-source histology learning platform built for 1st-year MBBS students. Experience histology like never before — explore high-resolution zoomable slides with a virtual microscope, access structured theory for every tissue, and get instant AI-powered explanations tailored to your exams. Clean, modern, and designed to make slide identification effortless.

[![Apache License 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## ✨ Features

### 🔬 Virtual Microscope
- **Deep Zoom Imaging** — Smooth, high-resolution zooming and panning powered by OpenSeadragon
- **Linear Slide Navigation** — Browse through multiple magnification levels (1/n interface)
- **Touch Gesture Support** — Pinch-to-zoom and drag-to-pan on mobile devices
- **Mouse Wheel Zoom** — Desktop-friendly zoom controls with scroll wheel

### 🤖 Meded AI Assistant
- **Context-Aware AI** — The chatbot knows exactly which tissue you're viewing
- **Streaming Responses** — Watch the AI type answers in real-time
- **Exam-Focused** — Get instant, exam-relevant explanations and identification tips
- **Secure Authentication** — Google sign-in via Firebase Auth
- **Rate Limited** — 100 messages per user per month

### 📚 Comprehensive Theory Integration
Every slide includes:
- 📝 **Description** — Concise overview of the tissue
- 🔬 **Key Identification Features** — 4-5 diagnostic features for spotting exams
- 📍 **Anatomical Location** — Where to find it in the body
- ⚙️ **Function** — Physiological role
- 💡 **Exam Tips** — High-yield points from an examiner's perspective

### 📊 Content Coverage

| System | Slides |
|--------|--------|
| Cardiovascular System | 12 |
| Central Nervous System | 32+ |
| Gastrointestinal Tract | 14 |
| Hepatobiliary & Pancreas | 8 |
| Eye | 8 |
| Musculoskeletal System | 7 |
| Urogenital & Reproductive | 10 |
| Haematolymphoid System | 4 |
| Skin, Thyroid, & More | 8+ |

**100+ slides** across **13 organ systems** with full theory data.

### 📱 Progressive Web App (PWA)
- **Installable** — Add to home screen on Android & iOS
- **Standalone Mode** — Runs without browser UI for a native app feel
- **Responsive Design** — Optimized for desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — Component-based architecture
- **Vite** — Lightning-fast development builds
- **OpenSeadragon** — Advanced deep zoom viewer
- **Lucide React** — Beautiful iconography
- **CSS Modules** — Modular, scoped styling

### Backend & AI
- **Vercel Serverless Functions** — API routes for AI chat
- **Vercel AI Gateway** — Unified API for AI model access
- **Firebase Auth** — Secure Google authentication
- **Firestore** — Chat logging and rate limiting

### Data & Scripting
- **Node.js** — Scripting environment
- **Puppeteer** — Headless browser automation
- **Cheerio** — Server-side HTML parsing
- **Axios** — HTTP client

---

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PranayJuneja/TissueDeck.git
   cd TissueDeck
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your Firebase and Vercel AI Gateway credentials

4. **Start development server**:
   ```bash
   npm run dev
   ```
   The app will launch at `http://localhost:5173`.

---

## 📁 Project Structure

```
TissueDeck/
├── api/                    # Vercel serverless functions
│   └── chat.js             # AI chat endpoint
├── public/                 # Static assets & slides
│   ├── slides/             # Organized slide images
│   ├── favicon.png         # Custom microscope icon
│   └── manifest.json       # PWA manifest
├── scripts/                # Data ingestion utilities
│   ├── scanSlides.js       # Slide folder scanner
│   ├── scraper.js          # Base scraper logic
│   └── ingest_*.js         # Content ingestion scripts
├── src/
│   ├── components/         # React UI components
│   │   ├── SlideViewer.jsx # OpenSeadragon viewer
│   │   ├── TheoryPanel.jsx # Educational side panel
│   │   └── ChatBot.jsx     # AI chatbot interface
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx # Firebase auth provider
│   ├── data/slides/        # Category-specific JSON files
│   │   └── index.js        # Data aggregator
│   ├── firebase.js         # Firebase initialization
│   ├── App.jsx             # Main layout
│   └── main.jsx            # Entry point
├── .env.example            # Environment template
├── vercel.json             # Serverless config
├── package.json            # Dependencies
└── vite.config.js          # Vite configuration
```

---

## 🎯 Perfect For

- ✅ Histology practical exams
- ✅ Spotting tests
- ✅ Viva voce preparation
- ✅ Quick revision before exams
- ✅ Understanding slide identification

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

---

## 💖 Credits

Made with ❤️ by [Pranay Juneja](https://github.com/PranayJuneja)

> *"To err is human, to forgive is design."*
