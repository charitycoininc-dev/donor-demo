# 11: Express APIs

> Create your own backend and connect it to a frontend

## What is an API?

API = **Application Programming Interface**
- Backend serves data (JSON)
- Frontend requests data (fetch)
- Like a waiter between kitchen and customer

**The flow:** Frontend → API Request → Backend → API Response → Frontend

## Project Structure

```
my-fullstack-app/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── index.html
    └── script.js
```

## Setting Up the Backend

```bash
mkdir my-fullstack-app
cd my-fullstack-app
mkdir backend frontend

cd backend
npm init -y
npm install express cors
```

## Basic Express Server

**backend/server.js:**
```javascript
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data (in real apps, use database)
let tasks = [
    { id: 1, text: "Learn Express", completed: false },
    { id: 2, text: "Build an API", completed: true }
];
let nextId = 3;

// API Routes
app.get('/api/tasks', (req, res) => {
    res.json({ success: true, data: tasks });
});

app.post('/api/tasks', (req, res) => {
    const newTask = {
        id: nextId++,
        text: req.body.text,
        completed: false
    };
    tasks.push(newTask);
    res.json({ success: true, data: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (task) {
        task.completed = req.body.completed;
        res.json({ success: true, data: task });
    } else {
        res.status(404).json({ success: false, message: 'Task not found' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
});
```

**backend/package.json:**
```json
{
  "type": "module",
  "scripts": {
    "start": "node server.js"
  }
}
```

## Test Your API with curl

**Start the server:**
```bash
cd backend
npm start
```

**Test endpoints:**
```bash
# Get all tasks
curl http://localhost:3000/api/tasks

# Create new task
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"text":"New task from curl"}'

# Mark task complete
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

# Delete task
curl -X DELETE http://localhost:3000/api/tasks/1
```

## Understanding the Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/tasks` | Get all tasks |
| `POST` | `/api/tasks` | Create new task |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |

## Simple Frontend

**frontend/index.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>API Frontend</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { padding: 10px; margin: 5px; }
        .task { padding: 10px; border: 1px solid #ccc; margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Task App</h1>
    
    <input type="text" id="taskInput" placeholder="New task...">
    <button onclick="addTask()">Add</button>
    
    <div id="tasks"></div>
    
    <script src="script.js"></script>
</body>
</html>
```

**frontend/script.js:**
```javascript
const API = 'http://localhost:3000/api';

async function loadTasks() {
    const response = await fetch(`${API}/tasks`);
    const data = await response.json();
    
    const tasksDiv = document.getElementById('tasks');
    tasksDiv.innerHTML = data.data.map(task => `
        <div class="task">
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id}, this.checked)">
            ${task.text}
            <button onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `).join('');
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (text) {
        await fetch(`${API}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        input.value = '';
        loadTasks();
    }
}

async function toggleTask(id, completed) {
    await fetch(`${API}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
    });
    loadTasks();
}

async function deleteTask(id) {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
}

// Load tasks on page load
loadTasks();
```

## Running the Full-Stack App

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npx serve .
# Visit http://localhost:3000
```

**To deploy frontend later:**
```bash
cd frontend
npx surge .
```

## The Goal

**Understand the basics:**
- APIs serve JSON data
- Frontend calls API with fetch
- Backend handles requests with Express
- curl can test APIs from terminal
- Frontend and backend are separate applications

## Key Concepts

**Backend (Express):**
- Routes handle different URLs
- Middleware processes requests
- JSON responses for data exchange

**Frontend:**
- Fetch API calls the backend
- JavaScript updates the DOM
- User interactions trigger API calls

## AI Practice

Ask ChatGPT/Claude:
- "Add user authentication to this Express API"
- "How do I connect this to a database?"
- "Create an API endpoint for [your feature]"
- "Add error handling to these routes"

## Next Steps

**Real-world improvements:**
- Replace in-memory data with database
- Add input validation
- Use environment variables
- Deploy to production
- Add authentication

## curl Cheat Sheet

```bash
# GET request
curl http://localhost:3000/api/tasks

# POST with JSON
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"text":"My task"}'

# PUT request
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

# DELETE request
curl -X DELETE http://localhost:3000/api/tasks/1
```

## AI Practice

Ask ChatGPT/Claude:
- "Create an Express API with user authentication endpoints"
- "How do I handle errors properly in Express.js routes?"
- "Build a REST API for a blog with posts and comments"
- "Explain middleware in Express and give me 3 examples"

## Memory Test

**Can you build a simple API from memory?**

Create a basic Express API:
- Set up Express with one GET route
- Route should return JSON data (like `{message: "Hello API"}`)
- Start the server on port 3000
- Test the API endpoint in your browser
- No looking at references!

**Success criteria:**
- ✅ Express server starts successfully
- ✅ API returns JSON data when accessed
- ✅ Can access endpoint in browser
- ✅ Built entirely from memory

*If you can build and test an API, you understand backend development basics!*

## Next Up

12-sqlite-database.md

---

*Goal achieved when you understand how to build basic APIs with Express and connect them to a frontend*
