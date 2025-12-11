# Tissue Deck

**Tissue Deck** is a modern, interactive histology slide viewer designed to assist medical and biology students in studying tissue samples. It offers a virtual microscope experience with high-resolution, zoomable images, paired with comprehensive theory panels and a categorized library of slides.

## Features

- **Virtual Microscope Interface**:
  - powered by **OpenSeadragon** for smooth, high-resolution deep zooming and panning.
  - Simulates the experience of using a real microscope.
- **Smart Navigation System**:
  - Organized sidebar with collapsible categories (e.g., Epithelium, Connective Tissue, Muscle).
  - Real-time search to instantly locate specific tissues or structures.
- **Integrated Learning**:
  - **Theory Panel**: Context-aware educational content alongside each slide, detailing structure, function, and location.
  - **Interactive Labels**: Toggleable annotations that highlight key histological features on the slides.
- **Data Engineering Suit**:
  - Powerful scraping and ingestion scripts (`puppeteer`, `cheerio`) to aggregate content from educational sources like WikiLectures.
  - Automated data normalization and organization.
- **Modern & Responsive UI**: Built with React and Vite for a fast, fluid user experience.

## Tech Stack

### Frontend
- **React 19**: Robust component-based architecture.
- **Vite**: Next-generation frontend tooling for lightning-fast builds.
- **OpenSeadragon**: Advanced deep zoom image viewer.
- **Lucide React**: Beautiful, consistent iconography.
- **CSS Modules & Vanilla CSS**: Modular and global styling.

### Data & Scripting
- **Node.js**: Backend (scripting) environment.
- **Puppeteer**: Headless browser automation for complex data extraction.
- **Cheerio**: Fast, flexible implementation of core jQuery for server-side parsing.
- **Axios**: Promise-based HTTP client.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/PranayJuneja/TissueDeck.git
    cd TissueDeck
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Usage

### Development Server

Start the local development server:

```bash
npm run dev
```

The application will launch at `http://localhost:5173`.

### Data Ingestion

The project includes a suite of scripts in the `scripts/` directory to manage data collection:

-   **Generic Scraper**:
    ```bash
    node scripts/scraper.js
    ```
-   **WikiLectures Ingest**:
    ```bash
    node scripts/ingest_wikilectures.js
    ```
-   **Full Ingestion Pipeline**:
    ```bash
    node scripts/ingest_full.js
    ```

> **Note**: These scripts are intended for educational and local use. Please respect the `robots.txt` and Terms of Service of any websites you interact with.

## Project Structure

```
TissueDeck/
├── public/                 # Static assets
├── scripts/                # Data scraping and ingestion workflows
│   ├── ingest_full.js      # Orchestrator for full data update
│   ├── ingest_wikilectures.js
│   ├── scraper.js          # Base scraper logic
│   └── test_wiki.js        # Unit testing for wiki scraper
├── src/
│   ├── components/         # React UI components
│   │   ├── SlideViewer.jsx # OpenSeadragon integration
│   │   └── TheoryPanel.jsx # Educational side panel
│   ├── data/               # App data storage
│   │   ├── tissues.json    # Main dataset
│   │   └── scraped_tissues.json
│   ├── styles/             # Global styles
│   ├── App.jsx             # Main layout and routing logic
│   └── main.jsx            # Application entry point
├── package.json            # Dependencies and script definitions
└── vite.config.js          # Vite configuration
```

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please submit a Pull Request or open an Issue.

## License

[MIT](LICENSE)
