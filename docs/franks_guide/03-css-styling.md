# 03: CSS Styling

> Make your HTML look good with styles

## What CSS Is

CSS = **Cascading Style Sheets**
- Purpose: Style your HTML content
- Lives inside `<style>` tags
- Everything is rectangles

## The Basic Setup

Add CSS to your HTML inside the `<head>`:

```html
<head>
    <title>My Page</title>
    <style>
        /* All your CSS goes here */
    </style>
</head>
```

## Essential Selectors

| Selector | Targets | Example |
|----------|---------|---------|
| `h1` | All h1 tags | `h1 { color: red; }` |
| `p` | All p tags | `p { color: blue; }` |
| `body` | The body tag | `body { background-color: gray; }` |
| `.card` | Class="card" | `.card { background: white; }` |

## Basic Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `color` | Text color | `color: blue;` |
| `background-color` | Background color | `background-color: yellow;` |
| `width` | Element width | `width: 200px;` |
| `height` | Element height | `height: 100px;` |

## Your Mission

Add styles to your `index.html`:

1. Make h1 red
2. Make h2 blue  
3. Make paragraphs green
4. Change body background color
5. Create a card class

## Example to Build

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Styled Page</title>
    <style>
        body {
            background-color: lightgray;
        }
        
        h1 {
            color: red;
        }
        
        h2 {
            color: blue;
        }
        
        p {
            color: green;
        }
        
        .card {
            background-color: white;
            width: 300px;
            height: 200px;
        }
    </style>
</head>
<body>
    <h1>Welcome to My Blog</h1>
    
    <div class="card">
        <h2>My First Card</h2>
        <p>This is inside a card!</p>
    </div>
    
    <h2>Regular Heading</h2>
    <p>This is regular text.</p>
</body>
</html>
```

## Understanding Classes

**Why classes?** Group similar elements together.

```html
<!-- HTML -->
<div class="card">Card 1</div>
<div class="card">Card 2</div>

<!-- CSS -->
<style>
.card {
    background-color: white;
    width: 200px;
    height: 100px;
}
</style>
```

Both divs get the same styling!

## Developer Tools Discovery

**Everything is rectangles:**

1. Right-click any element → "Inspect"
2. Hover over HTML in DevTools
3. See the rectangle highlights
4. Click elements to see their CSS

**Key insight:** Web pages = rectangles inside rectangles.

## Test It

1. Save your styled HTML
2. Open in browser
3. Right-click → Inspect Element
4. Hover over different HTML tags
5. See the rectangle boxes!

## The Goal

**Style HTML pages with confidence.**

Master these basics:
- `<style>` tag placement
- Tag selectors (h1, p, body)
- Class selectors (.card)
- Color and background properties
- Using DevTools to inspect

## CSS Rules

1. **Everything goes in `<style>`**
2. **Everything is global** - styles apply everywhere
3. **Classes group things** - use `.className`
4. **Everything is rectangles** - use DevTools to see them

## AI Practice

Ask ChatGPT/Claude:
- "Give me 5 CSS color combinations that look good"
- "How do I make a simple button with CSS?"
- "What CSS properties should I learn next?"
- "Check my CSS - is this correct?"

## Memory Test

**Can you style an HTML page from memory?**

Take your `test.html` from the previous lesson and add CSS styling:
- Change the text color of the h1 to blue
- Change the text color of the p to gray
- No looking at references!

**Success criteria:**
- ✅ h1 appears in blue
- ✅ Paragraph appears in gray
- ✅ Written entirely from memory

*If you can style elements confidently, you understand CSS basics!*

## Next Up

04-javascript-basics.md

---

*Goal achieved when you can style HTML pages with basic CSS, understanding how selectors and properties work*
