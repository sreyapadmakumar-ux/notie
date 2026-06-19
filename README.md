# Notie - Notes Management System

A full-stack notes management application with a modern dark-mode UI, built with Node.js, Express, and MongoDB.

## Features

- **CRUD Operations** - Create, read, update, and delete notes
- **Pin Notes** - Pin important notes to the top
- **Search** - Search notes by title, content, or category
- **Categories/Tags** - Organize notes with custom categories
- **Font Styles** - Choose from Default, Serif, Monospace, or Cursive fonts
- **Note Colors** - Color-code your notes for visual organization
- **Dark/Light Mode** - Toggle between themes
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Toast Notifications** - Visual feedback for user actions
- **Empty State UI** - Friendly prompts when no notes exist

## Project Structure

```
notie/
├── frontend/
│   ├── index.html        # Main HTML page
│   ├── styles.css        # Dark-mode styled CSS
│   └── app.js            # Frontend JavaScript
├── backend/
│   ├── server.js         # Express server entry point
│   ├── package.json      # Backend dependencies
│   ├── .env              # Environment variables
│   ├── models/
│   │   └── Note.js       # Mongoose Note schema
│   └── routes/
│       └── notes.js      # REST API routes
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd notie
```

### 2. Setup Backend

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` folder (or edit the existing one):

```env
MONGODB_URI=mongodb://localhost:27017/notie
PORT=5000
NODE_ENV=development
```

For MongoDB Atlas, replace the URI with your connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/notie
```

### 4. Start MongoDB

Make sure MongoDB is running locally:

```bash
# Windows
net start MongoDB

# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 5. Start the Server

```bash
cd backend
npm start

# Or for development with auto-reload:
npm run dev
```

The server will start at `http://localhost:5000`

### 6. Open the App

Open `frontend/index.html` in your browser, or visit:
```
http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes (supports `?search=` and `?category=`) |
| GET | `/api/notes/:id` | Get a single note by ID |
| POST | `/api/notes` | Create a new note |
| PUT | `/api/notes/:id` | Update a note |
| PATCH | `/api/notes/:id/pin` | Toggle pin status |
| DELETE | `/api/notes/:id` | Delete a note |
| GET | `/api/notes/categories/list` | Get all unique categories |

### Example: Create a Note

```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is the note content.",
    "category": "Personal",
    "fontStyle": "default",
    "color": "#1e1e2e"
  }'
```

## Keyboard Shortcuts

- **Ctrl + N** - Create a new note
- **Escape** - Close modal or note view

## Screenshots / UI Description

### Sidebar
- App logo and toggle button
- "New Note" button with accent color
- Search bar with live search
- Category filter pills
- Dark/Light theme toggle
- Note count display

### Notes Grid
- Cards arranged in responsive grid
- Each card shows: category badge, title, content preview, date
- Hover reveals pin and delete buttons
- Pinned notes show a pin icon and appear first
- Color-coded left border on cards

### Note Detail View
- Full note content with chosen font style
- Back, Edit, Pin, and Delete buttons in header
- Category and timestamp display

### Create/Edit Modal
- Title input field
- Content textarea
- Category input
- Font style dropdown (Default, Serif, Monospace, Cursive)
- Color picker with 8 color options
- Save/Cancel buttons with loading spinner

### Toast Notifications
- Success (green), Error (red), Info (purple)
- Auto-dismiss after 3 seconds
- Slide-in animation from the right

## Technologies Used

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Styling:** Custom CSS with CSS variables for theming

## License

MIT
