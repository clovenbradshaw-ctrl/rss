# Stack Feature Design Document

## Overview

**Stacks** are user-curated collections of content from any source type (articles, podcasts) that function like "read/listen later" playlists with completion tracking. Users can organize content into named stacks, check off items as they consume them, and track their progress through curated collections.

---

## Core Concepts

### What is a Stack?

A **Stack** is like a playlist for content consumption:
- 📚 **Named Collections** - "Weekend Reads", "Tech Deep Dives", "Morning Commute"
- 🔀 **Mixed Content** - Articles AND podcast episodes in the same stack
- ✅ **Completion Tracking** - Checkbox items as you consume them
- 📊 **Progress Visibility** - See how far you are through each stack
- 🔄 **Reorderable** - Drag to prioritize what to consume next

### Use Cases

1. **Reading Lists** - Save articles for weekend reading
2. **Research Projects** - Collect sources for a topic you're researching
3. **Commute Queue** - Mix podcasts and articles for travel time
4. **Learning Tracks** - Curate educational content series
5. **Shared Interests** - Build topic-based collections (AI news, cooking, etc.)
6. **Daily Digest** - Quick stack of today's must-reads

---

## Data Model

### Stack Object

```javascript
{
  id: string,              // Unique identifier (uuid or timestamp-based)
  name: string,            // "Weekend Reads", "Tech Stack", etc.
  description: string,     // Optional description
  emoji: string,           // Optional emoji icon (default: 📚)
  color: string,           // Optional accent color (default: brand color)
  items: [
    {
      id: string,          // Unique item ID within stack
      contentId: number,   // Original article.id or episode.id
      contentType: 'article' | 'episode',
      addedAt: timestamp,
      completed: boolean,
      completedAt: timestamp | null,
      notes: string,       // Optional user notes
      order: number        // For manual sorting
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp,
  archived: boolean,       // Soft delete / hide completed stacks
  settings: {
    autoRemoveCompleted: boolean,  // Remove items after completion
    sortBy: 'manual' | 'dateAdded' | 'pubDate',
    showCompleted: boolean
  }
}
```

### State Extension

```javascript
// Add to existing state object
state.stacks = {};              // { stackId: Stack }
state.currentStack = null;      // Currently viewing stack ID
state.stackView = 'grid';       // 'grid' | 'list' for stack browser
```

### Storage

```javascript
// Extend localStorage 'feedr2' save:
const save = () => {
  localStorage.setItem('feedr2', JSON.stringify({
    feeds, articles, podcasts, progress, view, viewPrefs, bookmarks,
    stacks: state.stacks  // NEW
  }))
}
```

---

## UI/UX Design

### 1. Navigation Integration

Add "Stacks" to the main view toggle:

```
┌─────────────────────────────────────────────────────┐
│  🔥 BRSST    [News] [Podcasts] [All] [Stacks]  🔍  │
└─────────────────────────────────────────────────────┘
```

### 2. Stacks View Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ STACKS                                          [+ New Stack]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 📚           │  │ 🎧           │  │ 🔬           │          │
│  │ Weekend      │  │ Commute      │  │ Research     │          │
│  │ Reads        │  │ Queue        │  │ Project      │          │
│  │              │  │              │  │              │          │
│  │ 3/12 ████░░  │  │ 0/5  ░░░░░░  │  │ 7/7  ██████  │          │
│  │ 4 articles   │  │ 3 podcasts   │  │ mixed        │          │
│  │ 8 podcasts   │  │ 2 articles   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ 🌅           │  │ ＋           │                            │
│  │ Morning      │  │              │                            │
│  │ Routine      │  │ Create New   │                            │
│  │              │  │ Stack        │                            │
│  │ 1/3  ██░░░░  │  │              │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Stack Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Stacks                                                │
├─────────────────────────────────────────────────────────────────┤
│ 📚 Weekend Reads                              [Edit] [⋮ More]   │
│ Articles and podcasts for relaxed weekend consumption           │
│ ████████░░░░░░░░ 5/12 completed                                │
├─────────────────────────────────────────────────────────────────┤
│ [Show: All ▾]  [Sort: Manual ▾]           [▤ List] [▦ Cards]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☐  📰 The Future of AI Reasoning              TechCrunch      │
│      Added 2 days ago                          [≡] [✕]          │
│                                                                 │
│  ☐  🎙 Deep Dive: React Server Components      Syntax.fm       │
│      Added 3 days ago • 45 min                 [≡] [✕]          │
│                                                                 │
│  ☑  📰 Understanding Vector Databases         Dev.to          │
│      ✓ Completed yesterday                     [≡] [✕]          │
│                                                                 │
│  ☐  🎙 The State of JavaScript 2024           JS Party        │
│      Added 1 week ago • 1hr 12min              [≡] [✕]          │
│                                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│  ☑  📰 CSS Container Queries Guide    (completed)              │
│  ☑  🎙 Rust for JavaScript Devs       (completed)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. "Add to Stack" UI

When viewing any article or episode, add a stack button:

**Option A: Quick Action Button**
```
┌─────────────────────────────────────────────────┐
│ Article Title Here                              │
│ Source • 5 min read                             │
│                                          [📚+]  │  ← Add to Stack
└─────────────────────────────────────────────────┘
```

**Option B: Action Menu Integration**
```
Article/Episode Context Menu:
┌──────────────────┐
│ ▶ Play / Read    │
│ ─────────────────│
│ 📚 Add to Stack  │ → ┌──────────────────┐
│ 🔖 Bookmark      │   │ Weekend Reads    │
│ 📤 Share         │   │ Commute Queue    │
│ ✕ Hide           │   │ Research Project │
└──────────────────┘   │ ──────────────── │
                       │ + Create New...  │
                       └──────────────────┘
```

### 5. Create/Edit Stack Modal

```
┌───────────────────────────────────────────────────┐
│ Create New Stack                              ✕   │
├───────────────────────────────────────────────────┤
│                                                   │
│  Icon:  [📚 ▾]    Color: [● ▾]                   │
│                                                   │
│  Name:                                            │
│  ┌─────────────────────────────────────────────┐ │
│  │ Weekend Reads                               │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Description (optional):                          │
│  ┌─────────────────────────────────────────────┐ │
│  │ Articles and podcasts for relaxed           │ │
│  │ weekend consumption                         │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Settings:                                        │
│  ☐ Auto-remove items after completion            │
│  ☑ Show completed items at bottom                │
│                                                   │
│              [Cancel]  [Create Stack]             │
└───────────────────────────────────────────────────┘
```

### 6. Empty States

**No Stacks Yet:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                       📚                            │
│                                                     │
│              Create Your First Stack                │
│                                                     │
│    Stacks help you organize content from any       │
│    source into curated collections. Save articles  │
│    and podcasts to consume later.                  │
│                                                     │
│              [+ Create Stack]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Empty Stack:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                       📭                            │
│                                                     │
│              This Stack is Empty                    │
│                                                     │
│    Add articles or podcasts from your feeds        │
│    using the 📚+ button on any item.               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## User Workflows

### Workflow 1: Create a Stack

1. Click "Stacks" in main nav
2. Click "+ New Stack" button
3. Enter name, optional emoji/color/description
4. Click "Create Stack"
5. Redirected to empty stack view

### Workflow 2: Add Item to Stack

**From Content View:**
1. Browse News/Podcasts/All
2. Hover over item → Click 📚+ button
3. Select stack from dropdown OR create new
4. Toast notification: "Added to Weekend Reads"

**From Detail View:**
1. Open article/episode
2. Click "Add to Stack" in toolbar
3. Select stack
4. Continue consuming or go to stack

### Workflow 3: Consume Stack Content

1. Open Stacks view
2. Click on a stack
3. Click on first uncompleted item
4. For articles: Opens in reader/new tab
5. For podcasts: Starts playback
6. Return to stack → Checkbox is auto-checked (or manually check)

### Workflow 4: Complete & Track Progress

1. In stack detail view
2. Click checkbox to mark complete
3. Progress bar updates
4. Item moves to "completed" section (if setting enabled)
5. Continue to next item

### Workflow 5: Manage Stack

**Reorder Items:**
- Drag handle (≡) to reorder
- Or use sort dropdown (manual, date added, pub date)

**Remove Items:**
- Click (✕) button on item
- Or swipe left on mobile

**Edit Stack:**
- Click "Edit" to change name/emoji/color
- Click "⋮" for more options (archive, delete, duplicate)

---

## Technical Implementation

### New Functions

```javascript
// Stack CRUD
function createStack(name, options = {}) { ... }
function updateStack(stackId, updates) { ... }
function deleteStack(stackId) { ... }
function archiveStack(stackId) { ... }

// Stack Items
function addToStack(stackId, contentId, contentType) { ... }
function removeFromStack(stackId, itemId) { ... }
function toggleStackItemComplete(stackId, itemId) { ... }
function reorderStackItems(stackId, itemIds) { ... }

// Queries
function getStackProgress(stackId) { ... }  // returns { completed, total, percent }
function getStackContent(stackId) { ... }   // returns full content objects
function findItemInStacks(contentId, contentType) { ... }  // which stacks contain this?

// Rendering
function renderStacksView() { ... }
function renderStackCard(stack) { ... }
function renderStackDetail(stack) { ... }
function renderStackItem(item, content) { ... }
function renderAddToStackMenu(contentId, contentType) { ... }
```

### Event Handlers

```javascript
// Navigation
onclick: showStacks()
onclick: showStackDetail(stackId)
onclick: backToStacks()

// Stack Management
onclick: openCreateStackModal()
onclick: openEditStackModal(stackId)
onclick: confirmDeleteStack(stackId)

// Item Actions
onclick: addToStack(stackId, contentId, contentType)
onclick: removeFromStack(stackId, itemId)
onclick: toggleComplete(stackId, itemId)
ondragend: reorderStackItems(stackId, newOrder)

// Quick Actions (from content views)
onclick: openAddToStackMenu(contentId, contentType)
```

### CSS Classes

```css
/* Stack Grid */
.stacks-view { }
.stacks-grid { }
.stack-card { }
.stack-card-icon { }
.stack-card-progress { }
.stack-card-stats { }

/* Stack Detail */
.stack-detail { }
.stack-header { }
.stack-progress-bar { }
.stack-items { }
.stack-item { }
.stack-item.completed { }
.stack-item-checkbox { }
.stack-item-drag-handle { }
.stack-item-remove { }

/* Add to Stack Menu */
.add-to-stack-btn { }
.add-to-stack-menu { }
.add-to-stack-option { }
.add-to-stack-create { }

/* Modals */
.stack-modal { }
.stack-form { }
.emoji-picker { }
.color-picker { }
```

---

## Advanced Features (Future)

### Phase 2 Enhancements

1. **Smart Stacks** - Auto-populate based on rules (e.g., "All AI articles from TechCrunch")
2. **Stack Templates** - Pre-made stacks for common use cases
3. **Stack Sharing** - Export/import stack definitions
4. **Stack Statistics** - Time spent, completion rates, streaks
5. **Keyboard Shortcuts** - `S` to add to stack, `C` to complete
6. **Bulk Actions** - Multi-select items for batch operations

### Integration Points

1. **Podcast Player** - Show "Up next in Stack" after episode ends
2. **Article Reader** - "Mark Complete" button in reading view
3. **Search** - Include stack contents in global search
4. **Notifications** - "You have 5 items in your Commute Queue"

---

## Component Breakdown

### Required New Elements

| Element ID | Purpose |
|------------|---------|
| `el.stacksView` | Main stacks view container |
| `el.stacksGrid` | Grid of stack cards |
| `el.stackDetail` | Single stack detail view |
| `el.stackItems` | List of items in stack |
| `el.stackModal` | Create/edit stack modal |
| `el.addToStackMenu` | Dropdown for adding to stack |

### Modified Existing Elements

| Element | Change |
|---------|--------|
| Header nav | Add "Stacks" button |
| Article render | Add "Add to Stack" button |
| Episode render | Add "Add to Stack" button |
| Mobile drawer | Add "Stacks" menu item |

---

## Summary

The **Stack** feature transforms BRSST from a feed reader into a personal content curation system. Key benefits:

- ✅ **Cross-source organization** - Mix articles and podcasts
- ✅ **Progress tracking** - Visual completion indicators
- ✅ **Flexible workflow** - Works with any consumption style
- ✅ **Minimal friction** - One-click add from anywhere
- ✅ **Native integration** - Uses existing render patterns

The implementation follows BRSST's existing architecture: vanilla JS, localStorage persistence, template literals for rendering, and direct DOM manipulation. No new dependencies required.
