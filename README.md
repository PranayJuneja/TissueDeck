# HistoHelp - Interactive Histology Slide Viewer

HistoHelp is a modern, interactive web application designed to assist medical and biology students in studying histology slides. It provides a zoomable microscope-like interface, detailed theory panels, and a categorized library of tissue samples sourced from educational repositories.

![HistoHelp Screenshot](public/screenshot_placeholder.png) *Note: detailed view of the application interface.*

## Features

- **Interactive Microscope View**: Smooth zooming and panning capabilities to examine tissue details, simulating a real microscope experience.
- **Smart Navigation**:
    - Categorized sidebar for easy browsing of tissues (e.g., Epithelium, Connective Tissue, etc.).
    - Real-time search functionality to quickly find specific slides.
    - Expandable/Collapsible categories.
- **Rich Annotations**:
    - **Toggleable Labels**: View markers highlighting specific structures on the slides.
    - **Theory Panel**: Detailed descriptions and educational context for each slide.
- **Automated Content Aggregation**: Custom scripts to ingest and normalize data from external sources like WikiLectures.
- **Modern UI**: Clean, dark-themed interface optimized for focus and readability.

## Tech Stack

### Frontend
- **React**: Component-based UI architecture.
- **Vite**: Fast build tool and development server.
- **CSS Modules**: Scoped styling for components.
- **Vanilla CSS**: Global styling and layout management.

### Data Engineering & Scripts
- **Node.js**: Runtime for scripting.
- **Puppeteer**: Headless browser automation for scraping dynamic content.
- **Cheerio**: HTML parsing for static scraping.
- **Axios**: HTTP client for data fetching.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/Histo.git
    cd Histo
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Usage

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Data Ingestion (Scrapers)

The project includes scripts to populate the local database (`data/tissues.json`) and download images.

**Run the generic scraper:**
```bash
node scripts/scraper.js
```

**Ingest from WikiLectures:**
```bash
node scripts/ingest_wikilectures.js
```

*Note: content scraping respects the `robots.txt` and terms of service of source websites. Ensure you have permission or are using public domain/creative commons resources.*

## Project Structure

```
Histo/
├── public/                 # Static assets
├── scripts/                # Data ingestion scripts
│   ├── scraper.js          # General scraper
│   └── ingest_wikilectures.js # WikiLectures specific ingestor
├── src/
│   ├── components/         # React components (SlideViewer, TheoryPanel, etc.)
│   ├── data/               # JSON data files (tissues.json)
│   ├── styles/             # Global CSS files
│   ├── App.jsx             # Main application layout
│   └── main.jsx            # Entry point
└── package.json            # Project dependencies and scripts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
