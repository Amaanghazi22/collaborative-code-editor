# CollabCode - Real-Time Collaborative Code Editor

A full-stack real-time collaborative code editor that allows multiple developers to write code together simultaneously. Built with React, Node.js, and powered by Yjs CRDT for conflict-free real-time synchronization.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-Express_5-green?logo=node.js)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-Sequelize-blue?logo=postgresql)
![Tech Stack](https://img.shields.io/badge/Socket.io-4.8-black?logo=socket.io)
![Tech Stack](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)

## Features

- **Real-Time Collaboration** - Multiple users can edit the same code simultaneously with automatic conflict resolution using Yjs (CRDT)
- **Monaco Editor** - VS Code's editor with syntax highlighting, IntelliSense, and support for 75+ languages
- **Room-Based Sessions** - Create or join coding rooms using unique 6-character room codes
- **Live Cursors** - See other users' cursor positions and selections in real time
- **Integrated Chat** - Built-in chat panel for communication during coding sessions
- **User Authentication** - Secure signup/login with JWT-based authentication
- **Dark/Light Theme** - Toggle between themes for comfortable coding
- **Active User Presence** - See who's currently in the room with unique color indicators

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Build tool & dev server
- **Tailwind CSS** + **shadcn/ui** - Styling & component library
- **Monaco Editor** (`@monaco-editor/react`) - Code editor
- **Yjs** + **y-monaco** - CRDT-based real-time sync
- **Socket.io Client** - WebSocket communication
- **React Router v7** - Client-side routing
- **TanStack React Query** - Server state management

### Backend
- **Node.js** with **Express 5**
- **PostgreSQL** with **Sequelize ORM**
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging

## Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** database

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/collaborative-code-editor.git
cd collaborative-code-editor
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see `.env.example` for reference):

```env
PORT=5001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=collab_editor
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5173
```

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE collab_editor;
```

Start the backend server:

```bash
npm run dev
```

The backend runs on `http://localhost:5001`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (see `.env.example` for reference):

```env
VITE_COLLAB_CODE_BACKEND_URL=http://localhost:5001/
VITE_COLLAB_CODE_SOCKET_URL=http://localhost:5001/
```

Start the frontend dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Project Structure

```
collaborative-code-editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/          # CodeEditor, ChatPanel, FileSidebar, etc.
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── contexts/            # AuthContext, SocketContext, SessionContext
│   │   ├── hooks/               # useCollaboration, useCursors
│   │   ├── pages/               # Landing, Auth, Rooms, Editor
│   │   ├── services/            # API & Socket clients
│   │   └── lib/                 # Utilities
│   ├── package.json
│   └── vite.config.ts
│
└── backend/
    ├── src/
    │   ├── config/              # Database configuration
    │   ├── controllers/         # Auth & Room controllers
    │   ├── middleware/           # JWT authentication middleware
    │   ├── models/              # User, Room, RoomParticipant, RoomDocument
    │   ├── routes/              # API routes
    │   ├── socket/              # WebSocket event handlers
    │   └── utils/               # JWT & validation helpers
    ├── package.json
    └── server.js
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login with credentials |

### Rooms (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms/create` | Create a new room |
| POST | `/api/rooms/join` | Join a room by code |
| GET | `/api/rooms/my-rooms` | Get user's rooms |
| GET | `/api/rooms/:roomId` | Get room details |

## How It Works

1. **Authentication** - Users sign up or log in to receive a JWT token
2. **Room Creation** - Authenticated users create a room and receive a unique 6-character code
3. **Joining** - Other users join using the room code
4. **Real-Time Sync** - Yjs CRDT handles document synchronization via Socket.io, ensuring all edits merge without conflicts
5. **Persistence** - Document state is periodically saved to PostgreSQL

## Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with Nodemon (auto-reload) |
| `npm start` | Start in production mode |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
