# 08: Global State & Vue Routing

> Learn to share data between components and build multi-page applications

## Two Key Challenges for Larger Apps

In the previous lesson, you learned about **state** - data that changes in your Vue components. Now let's solve two bigger challenges:

Your single-component Vue app works great, but real applications need:

**1. Sharing State Between Components**
- User login status across all pages
- Shopping cart data accessible everywhere  
- App settings that affect multiple components

**2. Multiple Pages/Views**
- Different URLs for different content
- Browser back/forward button support
- Bookmarkable links to specific pages

**This lesson covers both:** Global state management + client-side routing

---

# Part 1: Global State

## Component State vs Global State

In the previous lesson, you learned about **component state** - data that lives inside one component:

```javascript
// Component state - only available in this component
data() {
    return {
        count: 0,           // Local to this component
        message: "Hello"    // Local to this component  
    }
}
```

But what if multiple components need the same data?

## The Global State Problem

**Scenario:** You're building a shopping app with these components:
- **Header**: Shows user name and cart count
- **ProductList**: Displays products, has "Add to Cart" buttons  
- **Cart**: Shows cart items and total
- **Profile**: Shows user details

**The problem:** How do you share user data and cart data between all these components?

**Bad solutions:**
- Copy the same data in each component (gets out of sync)
- Pass data through many component levels (prop drilling nightmare)
- Use browser localStorage (not reactive)

**Good solution:** Global state that all components can access

## What is Global State?

**Global State** = data that's shared across multiple components throughout your application

**Examples of global state:**
- User authentication (login status, user info)
- Shopping cart contents
- App theme (dark mode/light mode)
- API data used by multiple components

## Global State with Vue Composables

**Solution:** Vue composables - functions that provide reactive global state

**The pattern:**
1. Create a composable with `reactive()` data
2. Export functions to access/modify the data  
3. Import the composable in any component that needs it
4. All components share the same state automatically!

### Example: Global User State

**src/composables/useUser.js:**
```javascript
import { reactive } from 'vue'

// Global shared state - one source of truth
const state = reactive({
    user: null,
    loading: false
})

export function useUser() {
    const login = async (email, password) => {
        state.loading = true
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            state.user = { 
                name: 'Frank', 
                email: email,
                id: 1 
            }
        } catch (error) {
            console.error('Login failed:', error)
        } finally {
            state.loading = false
        }
    }

    const logout = () => {
        state.user = null
    }

    return {
        // State (reactive) - changes automatically update UI
        user: state.user,
        loading: state.loading,
        
        // Actions to modify state
        login,
        logout
    }
}
```

### Using Global State in Components

**Any component can now access user state:**
```javascript
import { useUser } from './composables/useUser.js'

const Header = {
    data() {
        const { user, loading, logout } = useUser()
        return { user, loading, logout }
    },
    template: `
        <div>
            <div v-if="user">
                Welcome, {{ user.name }}! 
                <button @click="logout">Logout</button>
            </div>
            <div v-else>Please log in</div>
        </div>
    `
}
```

**The magic:** Change user state anywhere → all components update automatically!

### Why Composables Work Great

- **Simple**: Just JavaScript functions with reactive data
- **Flexible**: Create composables for any shared data
- **Scalable**: Works for small and large applications  
- **Testable**: Easy to test the logic separately
- **No dependencies**: Built into Vue, no external libraries

---

# Part 2: Vue Routing

## What is Client-Side Routing?

**Traditional websites:** Each page = new HTML file from server
**Client-side routing:** JavaScript switches between different views/pages

**Examples:**
- `/` → Home page
- `/about` → About page  
- `/posts` → Post generator
- `/posts/123` → Specific post

**Benefits:**
- No page reloads (faster navigation)
- Browser back/forward buttons work
- URLs are bookmarkable
- Better user experience

## Vue Router Setup

**Install via import maps:**
```html
<script type="importmap">
{
    "imports": {
        "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js",
        "vue-router": "https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js",
        "@vue/devtools-api": "https://unpkg.com/@vue/devtools-api@6/lib/esm/index.js"
    }
}
</script>
```

**Note:** The `@vue/devtools-api` import is required when using Vue Router to prevent console warnings. This is a common quirk you'll encounter in Vue Router setups.

## Basic Router Example (Options API)

**js/app.js:**
```javascript
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

// Define page components
const Home = {
    template: `
        <div>
            <h2>Home Page</h2>
            <p>Welcome to our app!</p>
        </div>
    `
}

const About = {
    template: `
        <div>
            <h2>About Page</h2>
            <p>This app demonstrates Vue routing.</p>
        </div>
    `
}

const Posts = {
    data() {
        return {
            title: '',
            body: '',
            loading: false
        }
    },
    methods: {
        async fetchPost() {
            this.loading = true
            try {
                const randomId = Math.floor(Math.random() * 100) + 1
                const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${randomId}`)
                const data = await response.json()
                this.title = data.title
                this.body = data.body
            } catch (error) {
                console.error('Error:', error)
            } finally {
                this.loading = false
            }
        }
    },
    mounted() {
        this.fetchPost()
    },
    template: `
        <div>
            <h2>Random Post</h2>
            <div v-if="loading">Loading...</div>
            <div v-else>
                <div style="background: #f9f9f9; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
                    <h3>{{ title }}</h3>
                    <p>{{ body }}</p>
                </div>
            </div>
            <button @click="fetchPost">New Post</button>
        </div>
    `
}

// Define routes
const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/posts', component: Posts }
]

// Create router
const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// Main app
const app = createApp({
    template: `
        <div class="container">
            <nav>
                <router-link to="/">Home</router-link>
                <router-link to="/about">About</router-link>
                <router-link to="/posts">Posts</router-link>
            </nav>
            
            <main>
                <router-view></router-view>
            </main>
        </div>
    `
})

app.use(router)
app.mount('#app')
```

## Test Your Vue Router App

**Important:** Use HTTP serving for Vue Router to work properly

```bash
npx serve .
# Visit http://localhost:3000
```

**Test the routing:**
- Click navigation links - URLs should change
- Use browser back/forward buttons - should work
- Refresh page - should stay on same route

**Vue Router requires HTTP serving** because:
- Import maps need HTTP protocol
- Hash routing works better with proper server
- Prevents common development issues

## Combining Global State with Routing

**Powerful combination:** Now that you understand both global state (Part 1) and routing (above), you can build apps where:
- User login state persists across all pages
- Shopping cart data stays available on every route
- Components on different pages share the same reactive data

**Simple example:** The `useUser()` composable from Part 1 works on every route automatically!

## Vue's Two API Styles

**Quick note:** Vue has two ways to write the same code:
- **Options API** (what we use in this guide) - beginner-friendly
- **Composition API** - more advanced syntax

Both create identical applications. Master Options API first, then explore Composition API when comfortable.

## Vue Router Development Tips

**Important:** When using Vue Router with import maps, always include the devtools API:
```javascript
"@vue/devtools-api": "https://unpkg.com/@vue/devtools-api@6/lib/esm/index.js"
```

**Why this matters:**
- Prevents console warnings about missing devtools
- Required for Vue Router to work cleanly in development
- Standard practice in modern Vue applications
- Without it, you'll see browser console errors


## Global State with Composables

**Why composables are great for state:**
- Simpler than libraries like Pinia
- Perfect for small to medium apps
- Easy to understand and debug
- Works with both APIs

**Advanced state management:** For complex apps, consider **Pinia** - but composables handle 90% of use cases perfectly.

## Production-Ready File Structure

The example above works great for learning, but real Vue projects use a more organized structure. Here's the industry-standard approach:

### **Professional Structure:**
```
vue-app/
├── index.html
├── main.css                    # CSS next to index.html
├── src/                        # All source code here
│   ├── index.js               # Entry point (Vue setup)
│   ├── App.js                 # Main app component
│   ├── routes/
│   │   └── index.js           # Router configuration
│   ├── components/
│   │   ├── Home.js            # Page components
│   │   ├── About.js
│   │   └── Posts.js
│   └── composables/
│       └── useUser.js         # Shared logic
└── README.md
```

### **Why This Structure is Better:**

**1. Industry Standard:**
- `src/` folder is universal (Vue CLI, Vite, React, etc.)
- Any developer can navigate this immediately
- Matches what you'll see in real companies

**2. Separation of Concerns:**
- `src/index.js` - Vue app setup and mounting
- `src/App.js` - Main app component (layout/navigation)
- `src/routes/` - Router configuration separate from components
- `src/components/` - All page components organized

**3. Scalability:**
- Easy to add sub-folders later (components/ui/, components/forms/)
- Routes folder can hold multiple router files
- Clear import paths that make sense

### **File Breakdown:**

**src/index.js** (Entry Point):
```javascript
import { createApp } from 'vue'
import App from './App.js'
import router from './routes/index.js'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

**src/App.js** (Main Component):
```javascript
export default {
    template: `
        <div class="container">
            <nav>
                <router-link to="/">Home</router-link>
                <router-link to="/about">About</router-link>
                <router-link to="/posts">Posts</router-link>
            </nav>
            
            <main>
                <router-view></router-view>
            </main>
        </div>
    `
}
```

**src/routes/index.js** (Router Config):
```javascript
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.js'
import About from '../components/About.js'
import Posts from '../components/Posts.js'

const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/posts', component: Posts }
]

export default createRouter({
    history: createWebHashHistory(),
    routes
})
```

**src/components/Home.js** (Individual Component):
```javascript
export default {
    template: `
        <div>
            <h2>Home Page</h2>
            <p>Welcome to our app!</p>
        </div>
    `
}
```

### **Common Patterns = Developer Productivity**

**Why standardized structure matters:**
- **Team Onboarding**: New developers know where to find things
- **Maintenance**: Clear organization prevents "spaghetti code"
- **Growth**: Structure supports adding features without refactoring
- **Tools**: IDEs and build tools expect these conventions

**This structure scales from:**
- 👶 Learning projects (3 components)
- 🏢 Production apps (100+ components)
- 🚀 Enterprise systems (1000+ files)

**Next time you see a Vue project, it will likely follow this pattern!**

## Your Mission

**Master these Vue concepts:**
- Client-side routing with Vue Router
- Global state management with composables
- Understand Options vs Composition API
- Convert between the two API styles
- Build multi-page SPAs that feel like websites

## Practice Exercise

**Build a multi-page todo app:**
1. **Routes:** Home, Todos, About
2. **Global state:** Todo list using composables
3. **Features:** Add, delete, mark complete todos
4. **Deploy:** Use Surge to make it live

## AI Practice

Ask ChatGPT/Claude:
- "How do I share state between components without Pinia?"
- "Create a composable for managing a shopping cart"
- "What are Vue Router best practices for larger applications?"
- "Help me organize my Vue components in a scalable way"


## Memory Test

**Can you create a simple Vue Router app from memory?**

Build a basic multi-page Vue app:
- Set up Vue Router with 2 routes (Home, About)
- Add navigation links between pages
- No looking at references!

**Success criteria:**
- ✅ Pages switch when clicking navigation
- ✅ Built entirely from memory

*If you can build basic routing from memory, you understand Vue navigation!*

## Next Up

09-javascript-data-manipulation.md

---

*Goal achieved when you understand routing basics, can share state between components, and know the difference between Vue's two APIs*