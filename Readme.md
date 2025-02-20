# Headache - File Management System

This project I made up to ramp and get familiar  with FastApi and SQLModel.
<br>
**NB: Sorry for the wired repo name, It was empty when I created it, and thought why leave it empty.**


## Project Structure

```
headache/
├── app/                    # Backend (FastAPI)
│   ├── models/            # Database and public models
│   ├── routers/           # API routes
│   ├── internals/         # Internal utilities
│   ├── db.py             # Database configuration
│   └── main.py           # Main application entry
└── frontend/              # Frontend (Next.js)
```

## Running with Virtual Environment

### Backend Setup

Create and activate a virtual environment:

```bash
cd app
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

Install dependencies:
```bash
cd frontend
npm install
```

Run the development server:
```bash
npm run dev
```

The frontend will be available at [`http://localhost:3000`](http://localhost:3000) and the backend at [`http://localhost:8000`](http://localhost:8000).

## Running with Docker

To run the entire application using Docker:

```bash
docker-compose up --build
```

This will start both the backend (at port 8000) and frontend (at port 3000) services. The application will be accessible at:
- Frontend: [`http://localhost:3000`](http://localhost:3000)
- Backend: [`http://localhost:8000`](http://localhost:8000)