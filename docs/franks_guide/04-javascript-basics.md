# 04: JavaScript Basics

> Add interactivity to your HTML pages

## What JavaScript Is

JavaScript = **Programming Language for the Web**
- Purpose: Make web pages interactive
- Lives inside `<script>` tags
- Executes line by line, top to bottom

## The Three Layers

| Layer | Lives In | Purpose |
|-------|----------|---------|
| HTML | `<html>` | Content structure |
| CSS | `<style>` | Visual styling |
| JavaScript | `<script>` | Interactivity |

## JavaScript Basics

### Variables
Store information:
```javascript
let name = 'Frank';
let age = 25;
console.log(name); // Check console in DevTools
```

### Getting Elements
Grab HTML elements:
```javascript
let myDiv = document.getElementById('container');
console.log(myDiv); // See the element
```

### Adding Content
Insert HTML into elements:
```javascript
myDiv.innerHTML = '<h1>Hello World!</h1>';
```

## Your Mission

Build this interactive page:

1. Create a div with an ID
2. Use JavaScript to grab the div
3. Add content to it
4. Make a for loop
5. Add a click event

## Example to Build

```html
<!DOCTYPE html>
<html>
<head>
    <title>JavaScript Fun</title>
    <style>
        #container {
            background-color: lightblue;
            padding: 20px;
        }
        
        button {
            background-color: green;
            color: white;
            padding: 10px;
        }
    </style>
</head>
<body>
    <h1>My Interactive Page</h1>
    
    <div id="container">
        <!-- JavaScript will add content here -->
    </div>
    
    <button id="myButton">Click Me!</button>
    
    <script>
        // Variables
        let name = 'Frank';
        let container = document.getElementById('container');
        
        console.log('Hello from JavaScript!');
        console.log(name);
        
        // Add content
        container.innerHTML = '<p>Hello ' + name + '!</p>';
        
        // For loop - add 5 items
        for (let i = 1; i <= 5; i++) {
            container.innerHTML += '<p>Item ' + i + '</p>';
        }
        
        // Click event
        let button = document.getElementById('myButton');
        button.addEventListener('click', function() {
            container.innerHTML += '<p>Button clicked!</p>';
        });
    </script>
</body>
</html>
```

## CRUD Operations

**Create, Read, Update, Delete** - the basics of programming:

| Operation | JavaScript Example |
|-----------|-------------------|
| **Create** | `container.innerHTML = '<p>New content</p>'` |
| **Read** | `let element = document.getElementById('myDiv')` |
| **Update** | `element.innerHTML = 'Updated content'` |
| **Delete** | `element.innerHTML = ''` |

## Console is Your Friend

1. Open DevTools (F12)
2. Go to Console tab
3. See your `console.log()` messages
4. Try typing JavaScript directly!

**Expected console output:**
```
Hello from JavaScript!
Frank
```

## Test It

1. Save your HTML with JavaScript
2. Open in browser
3. Open Console (F12 → Console)
4. Click the button
5. Watch content appear!

**What you should see:**
- Initial page shows "Hello Frank!" and 5 items
- Each button click adds "Button clicked!" to the page
- Console shows your log messages

## The Goal

**Understand these core concepts:**

- Variables store data
- `document.getElementById()` grabs elements
- `.innerHTML` changes content
- For loops repeat code
- Event listeners respond to clicks
- Code runs line by line

## Advanced Challenge

**Make a simple counter:**
```javascript
let count = 0;
button.addEventListener('click', function() {
    count++;
    container.innerHTML = '<h2>Count: ' + count + '</h2>';
});
```

## Common Errors & Solutions

**Nothing happens when clicking:**
- Check if button ID matches: `getElementById('myButton')`
- Ensure script is after the HTML elements
- Check console for error messages

**Uncaught TypeError:**
```javascript
// Wrong - element doesn't exist yet
<script>
let button = document.getElementById('myButton');
</script>
<button id="myButton">Click</button>

// Right - script after HTML
<button id="myButton">Click</button>
<script>
let button = document.getElementById('myButton');
</script>
```

## AI Practice

Ask ChatGPT/Claude:
- "Give me 3 simple JavaScript projects for beginners"
- "How do I make a to-do list with JavaScript?"
- "What's the difference between let and var?"
- "Create a simple form validation example"

## Key Insights

- **HTML** = Structure (the skeleton)
- **CSS** = Style (the appearance)  
- **JavaScript** = Behavior (the interactivity)
- **Console** = Your debugging tool
- **CRUD** = Foundation of all programming

## Memory Test

**Can you add interactivity from memory?**

Add JavaScript to your `test.html` file:
- Write `console.log('Hello from JavaScript!')` in a script tag
- Update the innerHTML of the h1 element to show 'Hello JavaScript!'
- Create a button that shows an alert when clicked
- No looking at references!

**Success criteria:**
- ✅ Console message appears in browser dev tools
- ✅ h1 text changes when page loads
- ✅ Button click triggers alert
- ✅ Written entirely from memory

*If you can make elements interactive, you understand JavaScript basics!*

## Next Up

05-terminal-and-tools.md

---

*Goal achieved when you understand how JavaScript adds interactivity through variables, DOM manipulation, and events*