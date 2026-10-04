# 09: JavaScript Data Manipulation

> Master the language that powers the modern web

## Where We Are

You've built websites with HTML, CSS, and JavaScript. You've used Vue.js to create reactive apps. Now let's dive deeper into JavaScript itself - the language that makes everything interactive.

## Why JavaScript Data Structures Matter

**Everything in programming is data manipulation:**
- User clicks button → update data → change UI
- API returns JSON → process data → display results
- Form submission → validate data → send to server

**Master data handling = master programming**

## Core Data Types Revisited

### Arrays - Lists of Things

**Array Fundamentals:**
```javascript
// Create arrays
const fruits = ['apple', 'banana', 'orange'];
const numbers = [1, 2, 3, 4, 5];
const mixed = ['hello', 42, true, null];

// Access elements
console.log(fruits[0]);        // 'apple'
console.log(fruits.length);    // 3
```

**Essential Array Methods:**
```javascript
const tasks = ['email', 'code', 'meeting'];

// Add/remove items
tasks.push('lunch');           // Add to end
tasks.unshift('coffee');       // Add to beginning  
tasks.pop();                   // Remove from end
tasks.shift();                 // Remove from beginning

// Find items
tasks.includes('code');        // true
tasks.indexOf('email');        // 1
tasks.find(task => task.startsWith('m'));  // 'meeting'

// Transform arrays
const TASKS = tasks.map(task => task.toUpperCase());
const longTasks = tasks.filter(task => task.length > 4);
```

### Objects - Structured Data

**Object Fundamentals:**
```javascript
// Create objects
const user = {
    name: 'Frank',
    age: 30,
    email: 'frank@example.com',
    isActive: true
};

// Access properties
console.log(user.name);        // 'Frank'
console.log(user['email']);    // 'frank@example.com'

// Add/modify properties
user.city = 'Berlin';
user.age = 31;
delete user.isActive;
```

**Working with Object Data:**
```javascript
const product = {
    id: 1,
    name: 'Laptop',
    price: 999,
    category: 'Electronics',
    inStock: true
};

// Get object info
Object.keys(product);          // ['id', 'name', 'price', 'category', 'inStock']
Object.values(product);        // [1, 'Laptop', 999, 'Electronics', true]
Object.entries(product);       // [['id', 1], ['name', 'Laptop'], ...]

// Check for properties
product.hasOwnProperty('price');  // true
'name' in product;               // true
```

## Strings - Text Manipulation

**String Methods That Matter:**
```javascript
const message = 'Hello, World!';

// Basic operations
message.length;                     // 13
message.toUpperCase();              // 'HELLO, WORLD!'
message.toLowerCase();              // 'hello, world!'

// Searching
message.includes('World');          // true
message.startsWith('Hello');        // true
message.endsWith('!');              // true
message.indexOf('o');               // 4

// Extracting parts
message.slice(0, 5);                // 'Hello'
message.substring(7, 12);           // 'World'
message.split(', ');                // ['Hello', 'World!']

// Replacing
message.replace('World', 'JavaScript');  // 'Hello, JavaScript!'
```

**Template Literals - Modern String Building:**
```javascript
const name = 'Frank';
const age = 30;

// Old way (avoid)
const intro = 'Hi, I am ' + name + ' and I am ' + age + ' years old.';

// Modern way (prefer)
const intro = `Hi, I am ${name} and I am ${age} years old.`;

// Multi-line strings
const html = `
    <div>
        <h1>${name}</h1>
        <p>Age: ${age}</p>
    </div>
`;
```

## Functions - Reusable Logic

**Function Patterns:**
```javascript
// Function declaration
function calculateTotal(price, tax) {
    return price + (price * tax);
}

// Arrow function (modern)
const calculateTotal = (price, tax) => price + (price * tax);

// Function as variable
const multiply = function(a, b) {
    return a * b;
};

// Functions that return functions
function createMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

const double = createMultiplier(2);
console.log(double(5)); // 10
```

## Array Methods for Data Processing

**Map - Transform Every Item:**
```javascript
const prices = [10, 20, 30];

// Add tax to all prices
const pricesWithTax = prices.map(price => price * 1.2);
// [12, 24, 36]

// Convert to currency strings
const formatted = prices.map(price => `$${price}.00`);
// ['$10.00', '$20.00', '$30.00']
```

**Filter - Keep Only Some Items:**
```javascript
const products = [
    { name: 'Laptop', price: 999, inStock: true },
    { name: 'Mouse', price: 25, inStock: false },
    { name: 'Keyboard', price: 75, inStock: true }
];

// Only products in stock
const available = products.filter(product => product.inStock);

// Only expensive products
const expensive = products.filter(product => product.price > 50);
```

**Reduce - Combine All Items:**
```javascript
const numbers = [1, 2, 3, 4, 5];

// Sum all numbers
const sum = numbers.reduce((total, num) => total + num, 0);
// 15

// Find maximum
const max = numbers.reduce((highest, num) => 
    num > highest ? num : highest
, 0);
// 5

// Count occurrences
const votes = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const count = votes.reduce((tally, vote) => {
    tally[vote] = (tally[vote] || 0) + 1;
    return tally;
}, {});
// { apple: 3, banana: 2, orange: 1 }
```

**Find - Get Specific Items:**
```javascript
const users = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'user' }
];

// Find first admin
const admin = users.find(user => user.role === 'admin');

// Find user by ID
const user = users.find(user => user.id === 2);

// Check if any user is admin
const hasAdmin = users.some(user => user.role === 'admin');

// Check if all users have names
const allHaveNames = users.every(user => user.name);
```

## Working with API Data

**Common API Response Pattern:**
```javascript
// Typical API response
const apiResponse = {
    data: [
        { id: 1, title: 'Learn JavaScript', completed: false },
        { id: 2, title: 'Build a website', completed: true },
        { id: 3, title: 'Deploy to production', completed: false }
    ],
    status: 'success',
    total: 3
};

// Extract and process data
const todos = apiResponse.data;
const completedTodos = todos.filter(todo => todo.completed);
const todoTitles = todos.map(todo => todo.title);
const completionRate = completedTodos.length / todos.length;

console.log(`${completionRate * 100}% tasks completed`);
```

## Destructuring - Clean Data Extraction

**Array Destructuring:**
```javascript
const point = [10, 20];
const [x, y] = point;  // x = 10, y = 20

const colors = ['red', 'green', 'blue'];
const [primary, secondary, ...others] = colors;
// primary = 'red', secondary = 'green', others = ['blue']
```

**Object Destructuring:**
```javascript
const user = { name: 'Frank', age: 30, city: 'Berlin' };

// Extract properties
const { name, age } = user;  // name = 'Frank', age = 30

// Rename while extracting
const { name: userName, age: userAge } = user;

// With defaults
const { name, country = 'Germany' } = user;

// Function parameters
function greetUser({ name, age }) {
    return `Hello ${name}, you are ${age} years old`;
}

greetUser(user);  // 'Hello Frank, you are 30 years old'
```

## Import and Export

**Sharing code between files:**

**utils.js:**
```javascript
// Export individual functions
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Export object with multiple functions
export const mathUtils = {
    add: (a, b) => a + b,
    multiply: (a, b) => a * b,
    square: (n) => n * n
};

// Default export (one main thing)
export default function formatDate(date) {
    return date.toLocaleDateString();
}
```

**main.js:**
```javascript
// Import specific functions
import { capitalize, randomNumber } from './utils.js';
import { mathUtils } from './utils.js';

// Import default export
import formatDate from './utils.js';

// Import everything
import * as allUtils from './utils.js';

// Usage
console.log(capitalize("hello"));        // "Hello"
console.log(randomNumber(1, 10));        // Random number 1-10
console.log(mathUtils.square(5));        // 25
console.log(formatDate(new Date()));     // Today's date
```

## Practical Exercise

**Build a simple task manager step by step:**

### Step 1: Basic HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>Task Manager</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .task { padding: 10px; margin: 5px 0; background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>My Task Manager</h1>
    <input type="text" id="taskInput" placeholder="Enter a task...">
    <button onclick="addTask()">Add Task</button>
    <div id="taskList"></div>
</body>
</html>
```

### Step 2: Add JavaScript for Basic Functionality
```javascript
<script>
    // Start with a simple array
    let tasks = [];

    function addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (text) {
            // Add task as an object
            tasks.push({
                id: Date.now(), // Simple ID
                text: text,
                completed: false
            });
            input.value = '';
            displayTasks();
        }
    }

    function displayTasks() {
        const taskList = document.getElementById('taskList');
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<p>No tasks yet!</p>';
            return;
        }
        
        // Build HTML for each task
        const html = tasks.map(task => `
            <div class="task">
                <input type="checkbox" 
                       ${task.completed ? 'checked' : ''}
                       onchange="toggleTask(${task.id})">
                <span>${task.text}</span>
                <button onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `).join('');
        
        taskList.innerHTML = html;
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            displayTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        displayTasks();
    }

    // Show empty state on load
    displayTasks();
</script>
```

### Step 3: Enhance with Counts (Optional)
```javascript
// Add this to your HTML:
// <p>Total: <span id="total">0</span> | Completed: <span id="done">0</span></p>

function updateCounts() {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    
    document.getElementById('total').textContent = total;
    document.getElementById('done').textContent = done;
}

// Call updateCounts() at the end of displayTasks()
```

## Your Mission

**Practice these JavaScript fundamentals:**

1. **Arrays**: Work with lists of data
2. **Objects**: Store structured information
3. **Strings**: Manipulate text effectively
4. **Functions**: Create reusable code
5. **Import/Export**: Organize larger projects

**Think in JavaScript data structures:**
- Use arrays for lists of similar things
- Use objects for structured data with properties
- Combine them for complex data (array of objects)
- Write functions that transform data
- Organize code with imports/exports

## AI Practice

Ask ChatGPT/Claude:
- "Give me 10 array method examples with explanations"
- "How do I manipulate this object: [paste your object]"
- "Convert this string manipulation to use template literals"
- "Create a function that takes an array of objects and returns..."

## Data Structure Patterns

**Common real-world patterns:**
```javascript
// Array of objects (most common)
const users = [
    {id: 1, name: "Frank", email: "frank@email.com"},
    {id: 2, name: "Anna", email: "anna@email.com"}
];

// Object with arrays
const categories = {
    frontend: ["HTML", "CSS", "JavaScript"],
    backend: ["Node.js", "Python", "PHP"],
    database: ["MySQL", "MongoDB"]
};

// Nested objects
const config = {
    api: {
        baseUrl: "https://api.example.com",
        timeout: 5000
    },
    ui: {
        theme: "dark",
        language: "en"
    }
};
```

## Practice Projects

**Build these to master the concepts:**
1. **Contact Book** - Array of person objects with search/filter
2. **Shopping Cart** - Objects with quantities, totals calculation
3. **Word Counter** - String analysis with statistics
4. **Data Transformer** - Convert between different data formats

## Why This Matters

**JavaScript mastery unlocks:**
- Better Vue.js component logic
- API data manipulation
- Complex user interactions
- Server-side programming (Node.js)
- Any JavaScript framework or library

## Memory Test

**Can you work with JavaScript data structures from memory?**

Create a simple script that demonstrates data handling:
- Create an object with your personal info (name, age, city)
- Add a new property to the object
- Create an array with 3 favorite foods
- Add a new item to the array using push()
- Log everything to the console
- No looking at references!

**Success criteria:**
- ✅ Object created with multiple properties
- ✅ New property added successfully
- ✅ Array created and item added
- ✅ All data logged to console
- ✅ Written entirely from memory

*If you can manipulate objects and arrays confidently, you understand JavaScript data structures!*

## Next Up

10-nodejs-backend.md

---

*Goal achieved when you understand JavaScript data types and can use them to build interactive features*