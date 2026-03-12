# GeoMarket — Batam Culinary Explorer

Geospatial API and interactive map for exploring **4,570+ culinary locations** across Batam, Indonesia. Built with **FastAPI** (backend) and **Next.js** + **Leaflet.js** (frontend).

## Project Structure

```
geomarket/
├── fastapi/                  # Backend API
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings (DB path, pagination)
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models/           # ORM models
│   │   ├── schemas/          # Pydantic response schemas
│   │   └── routers/          # API endpoint routers
│   ├── db/                   # SQLite database
│   └── requirements.txt
│
└── frontend/                 # Frontend App
    ├── app/                  # Next.js pages & layout
    ├── components/           # React components + shadcn/ui
    ├── lib/                  # API helpers & utilities
    └── package.json
```

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd geomarket
```

### 2. Backend (FastAPI)

```bash
cd fastapi

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload
```

The API will be available at **http://127.0.0.1:8000**

- Swagger docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### 3. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**

> **Note:** The backend API must be running for the frontend to fetch data.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/places` | List places (paginated, filterable by `category`, `min_rating`) |
| GET | `/api/v1/places/categories` | List all unique business categories |
| GET | `/api/v1/places/{id}` | Get a single place by ID |
| GET | `/api/v1/places/search?q=` | Search by name, category, or address |
| GET | `/api/v1/places/nearby?lat=&lng=&radius_km=` | Find nearby places (Haversine distance) |

## Frontend Features

- **Browse** — Paginated listing with category filter badges
- **Search** — Debounced full-text search across name, category, and address
- **Nearby** — GPS-based location detection + radius slider for proximity search
- **Interactive Map** — Leaflet.js with CARTO Voyager tiles and clickable markers
- **Popup Details** — Shows rating, services, full weekly open hours, and Google Maps link

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Database | SQLite |
| Frontend | Next.js 16, React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS v4, Lucide Icons |
| Map | Leaflet.js, react-leaflet, CARTO tiles |

## Data Source

The database (`Indonesia.Batam.Kuliner.202406162232.db`) contains **4,570 places** with:
- Name, coordinates (lat/lng), category, address
- Rating, review count, price level
- Services (e.g., Dine-in, Takeaway)
- Open hours (weekly schedule)
- Google Maps URL
