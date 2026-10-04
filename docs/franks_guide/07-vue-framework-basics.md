# 07: Vue Framework Basics

> Solve the JavaScript state problem with reactive frameworks

## The Problem with Vanilla JavaScript

**What gets messy:**
```javascript
// Every time data changes, you manually update DOM
let count = 0;
const button = document.getElementById('button');
const display = document.getElementById('count');

button.addEventListener('click', () => {
    count++;
    display.textContent = count; // Manual DOM update
});
```

**As your app grows:** More `getElementById`, more manual updates, more bugs.

## What is State?

**State** = the data that can change in your application

**Examples of state:**
- User input in a form field (`name = "Frank"`)
- Items in a shopping cart (`cart = ["laptop", "mouse"]`)
- Whether a menu is open (`menuOpen = true`)
- Loading status of an API call (`loading = false`)

## The Key Insight About All Frameworks

**All modern frameworks solve one problem: automatically update the UI when state changes.**

**Vanilla JavaScript approach:**
```javascript
let count = 0  // This is state
const display = document.getElementById('count')

// You manually update the DOM when state changes
count++
display.textContent = count  // Manual DOM update
```

**Framework approach:**
```javascript
// Vue example - state in data()
data() {
    return {
        count: 0  // This is state
    }
}

// Template automatically updates when state changes
<p>{{ count }}</p>
<button @click="count++">Click me</button>
```

**The magic:** Change `count++` and the UI updates automatically. No manual DOM manipulation needed!

## The Official Vue Tutorial is Excellent!

**🎯 Start here first:** https://vuejs.org/tutorial/#step-1

**Important settings:**
- Select **HTML** (not SFC)
- Select **Options API** (not Composition API)

**Why this tutorial is perfect:**
- Covers the entire Vue framework systematically
- Interactive examples you can modify
- Builds from simple to complex concepts
- Official documentation team quality

**Complete the tutorial first**, then come back here to learn how to build the same things locally on your computer instead of in the web editor.

## Your Mission

**After completing the official tutorial:**
1. **Set up Vue locally** with import maps
2. **Recreate tutorial examples** as local files
3. **Understand the concepts** in your own development environment

## Build It Locally

The official tutorial uses a web editor, but let's build the same examples as local files on your computer.

### Basic Local Setup

**Create `index.html`:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Vue Local Example</title>
</head>
<body>
    <div id="app">
        {{ message }}
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        createApp({
            data() {
                return {
                    message: 'Hello Vue!'
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

**Test with HTTP serving:**
```bash
npx serve .
# Visit http://localhost:3000
```
→ You'll see "Hello Vue!" just like in the tutorial!

**Important:** Vue's import maps require HTTP serving, not file:// protocol.

## Tutorial Concepts as Local Files

### 1. Declarative Rendering (Tutorial Step 1)

**local-declarative.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Declarative Rendering</title>
</head>
<body>
    <div id="app">
        <h1>{{ message }}</h1>
        <p>{{ counter }}</p>
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        createApp({
            data() {
                return {
                    message: 'Hello Vue!',
                    counter: 0
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

### 2. Attribute Bindings (Tutorial Step 2)

**local-bindings.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Attribute Bindings</title>
</head>
<body>
    <div id="app">
        <span :title="message">
            Hover your mouse over me for a few seconds
        </span>
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        createApp({
            data() {
                return {
                    message: 'You loaded this page on ' + new Date().toLocaleString()
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

### 3. Event Listeners (Tutorial Step 3)

**local-events.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Event Listeners</title>
</head>
<body>
    <div id="app">
        <p>{{ message }}</p>
        <button @click="reverseMessage">Reverse Message</button>
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        createApp({
            data() {
                return {
                    message: 'Hello Vue!'  // Component state
                }
            },
            methods: {
                reverseMessage() {
                    // Change state → UI updates automatically!
                    this.message = this.message.split('').reverse().join('')
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

### 4. Form Bindings (Tutorial Step 4)

**local-forms.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Form Bindings</title>
</head>
<body>
    <div id="app">
        <p>{{ message }}</p>
        <input v-model="message" />
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        createApp({
            data() {
                return {
                    message: 'Hello Vue!'
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

### 5. Conditional Rendering (Tutorial Step 5)

**local-conditional.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Conditional Rendering</title>
</head>
<body>
    <div id="app">
        <button @click="toggle">Toggle</button>
        <h1 v-if="awesome">Vue is awesome!</h1>
        <h1 v-else>Oh no 😢</h1>
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        createApp({
            data() {
                return {
                    awesome: true  // Boolean state
                }
            },
            methods: {
                toggle() {
                    // Change state → conditional rendering updates!
                    this.awesome = !this.awesome
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

### 6. List Rendering (Tutorial Step 6)

**local-lists.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>List Rendering</title>
</head>
<body>
    <div id="app">
        <form @submit.prevent="addTodo">
            <input v-model="newTodo" required placeholder="new todo">
            <button>Add Todo</button>
        </form>
        <ul>
            <li v-for="todo in todos" :key="todo.id">
                <button @click="removeTodo(todo)">X</button>
                {{ todo.text }}
            </li>
        </ul>
    </div>

    <script type="importmap">
    {
        "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
        }
    }
    </script>

    <script type="module">
        import { createApp } from 'vue'

        let id = 0

        createApp({
            data() {
                return {
                    newTodo: '',           // Input state
                    todos: [               // Array state
                        { id: id++, text: 'Learn HTML' },
                        { id: id++, text: 'Learn JavaScript' },
                        { id: id++, text: 'Learn Vue' }
                    ]
                }
            },
            methods: {
                addTodo() {
                    // Change array state → list updates automatically!
                    this.todos.push({ id: id++, text: this.newTodo })
                    this.newTodo = ''
                },
                removeTodo(todo) {
                    // Change array state → list updates automatically!
                    this.todos = this.todos.filter((t) => t !== todo)
                }
            }
        }).mount('#app')
    </script>
</body>
</html>
```

## Key Vue Concepts (From Tutorial)

| Concept | Purpose | Example |
|---------|---------|---------|
| **{{ }}** | Display data | `{{ message }}` |
| **v-bind or :** | Bind attributes | `:title="message"` |
| **v-on or @** | Event handling | `@click="doSomething"` |
| **v-model** | Two-way binding | `<input v-model="text">` |
| **v-if/v-else** | Conditional rendering | `<div v-if="show">` |
| **v-for** | Loop through lists | `<li v-for="item in items">` |

## Why Vue Solves the State Problem

**Before Vue (vanilla JavaScript):**
```javascript
// You manage state AND DOM updates manually
let count = 5;
let message = "Hello";

// Every time state changes, manual DOM updates
document.getElementById('count').textContent = count;
document.getElementById('message').textContent = message;
// Gets complex fast!
```

**With Vue:**
```javascript
// You only manage state, Vue handles DOM updates
data() {
    return {
        count: 5,      // State
        message: "Hello"  // State
    }
}

// Change state → Vue automatically updates DOM
this.count = newCount;
this.message = newMessage;
```

**The Vue advantage:** Focus on your data (state), not DOM manipulation!

## The Framework Magic

**Reactivity**: When you change data in Vue, the HTML updates automatically. This is the core benefit of frameworks - you focus on data, not DOM manipulation.

**Components**: Break your app into reusable pieces (covered in next lesson).

## AI Practice

Ask ChatGPT/Claude:
- "Explain Vue.js reactivity in simple terms"
- "Give me 3 more examples of v-for usage"
- "How does v-model work internally?"
- "Create a Vue counter that goes up and down"

## Memory Test

**Can you build a Vue counter from memory?**

Recreate the counter example from the tutorial locally:
- Set up Vue with import maps in HTML
- Create reactive data with a counter starting at 0
- Add buttons that increment and decrement the counter
- Display the counter value in the template
- No looking at references!

**Success criteria:**
- ✅ Counter displays current number
- ✅ Buttons change the counter value
- ✅ Vue reactivity works correctly
- ✅ Built entirely from memory

*If you can build a reactive counter locally, you understand Vue fundamentals!*

## Next Up

08-global-state-and-vue-routing.md

---

*Goal achieved when you've completed the official Vue tutorial and can recreate the examples as local files*