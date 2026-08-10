# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **nested whiteboard application** (嵌套白板) built on AntV G6, supporting infinite-level graph nesting where every rectangular node can contain its own subgraph. The core feature is that users can double-click any rectangle node to enter a child graph and continue creating content at arbitrary depths.

**Tech Stack:**
- AntV G6 v4.8.24 - Graph visualization engine
- React 19.1.1 + Ant Design 5.27.4 - Used only for image preview component
- Vite 5.0.0 - Build tool
- Vanilla JavaScript ES6+ - Main development language

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (opens browser automatically)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

### Module Structure

The codebase is organized into highly modular, event-driven components:

```
src/
├── index.js              # Application entry point
├── config.js             # Global configuration (styles, colors, sizes)
├── nodes/                # Custom node type definitions
│   ├── rectangleNode.js  # Rectangle nodes (support subgraphs)
│   ├── textNode.js       # Text-only nodes
│   └── imageNode.js      # Image nodes with resize controls
├── events/               # Event handling system
│   ├── nodeEvents.js     # Node click, dblclick, contextmenu
│   ├── canvasEvents.js   # Canvas interactions, keyboard shortcuts
│   ├── edgeEvents.js     # Edge selection handling
│   ├── pasteEvents.js    # Clipboard image paste
│   ├── resizeEvents.js   # Window and node resize
│   └── utils.js          # updateSelection() utility
├── navigation/           # Subgraph navigation system
│   ├── navigation.js     # Navigation class with graphStack
│   └── backButton.js     # Back button UI component
├── toolbar/              # Toolbar system
├── contextMenu/          # Right-click menu and label editor
├── search/               # Node search functionality
│   ├── nodeSearch.js     # Search logic and cross-level navigation
│   └── searchEvents.js   # Ctrl+F keyboard binding
├── io/                   # File save/load system
└── components/           # React components
    └── ImagePreview.jsx  # Full-screen image preview
```

### Core Initialization Flow (src/index.js)

1. Create G6.Graph instance with config
2. Register custom node types: `image-node`, `text-only`, `rectangle-node`
3. Initialize modules in order: Navigation → ContextMenu → Toolbar → FileManager → NodeSearch
4. Bind event handlers: node events → edge events → canvas events → resize → paste → search
5. Render initial graph with `navigation.currentGraphData`

### State Management

All global state is stored on the `graph` instance using `graph.set()` and `graph.get()`:

- `currentMode`: Current tool mode (`'default'`, `'addNode'`, `'addText'`, `'addArrow'`)
- `selectedItem`: Currently selected node/edge
- `edgeStartNode`: First node when creating edges
- `mousePosition`: Current mouse position for paste operations
- `contextMenu`: Reference to ContextMenu instance

### The Navigation System

**Core Concept:** The navigation system maintains a stack of graph states (`graphStack`) to support entering/exiting subgraphs.

**Data Structure:**
```javascript
// Navigation maintains:
this.graphStack = [];  // Stack of parent graph states
this.currentGraphData = {
  id: 'root',
  nodes: [],
  edges: [],
  parentNode: null,  // ID of parent node when in subgraph
  label: 'Root'
};

// Each rectangle node can have:
node.subGraph = {
  id: 'subgraph-{nodeId}',
  nodes: [],
  edges: [],
  parentNode: '{nodeId}'
};
```

**Key Navigation Methods:**
- `enterSubgraph(node)`: Push current graph to stack, switch to node's subgraph
- `goBack()`: Pop from stack, restore parent graph
- `navigateToLevel(level)`: Jump directly to any level in the path
- `updateCurrentGraphData()`: Save current graph state using `graph.save()`

**Important:** Only rectangle nodes support subgraphs. Double-clicking text or image nodes triggers their specific behaviors (edit/preview).

### Event-Driven Communication

Modules communicate through G6's event system:

```javascript
// Emit custom events
graph.emit('saveGraph');
graph.emit('loadGraph', file);
graph.emit('enterSubgraph', node);

// Listen to events
graph.on('node:dblclick', (ev) => { /* enter subgraph or edit */ });
graph.on('canvas:click', (ev) => { /* add node or clear selection */ });
```

### Node Types and Behaviors

**Rectangle Node (`rectangle-node`):**
- Default node type
- Double-click: Enter subgraph
- Right-click: Edit label, font size, color
- Supports infinite nesting

**Text Node (`text-only`):**
- Text-only display, no background
- Double-click: Edit text inline
- Right-click: Edit label, font size, color

**Image Node (`image-node`):**
- Created via Ctrl+V paste from clipboard
- Double-click: Full-screen preview (React component)
- Resize: Four corner control points (`control-point-nw/ne/se/sw`)
- Auto-scales to `maxImageSize` (250px) on paste

### Search System (Ctrl+F)

The search system provides VSCode-style quick navigation across all graph levels:

**Architecture:**
- `NodeSearch` class manages search dialog and results
- `getAllNodes()` recursively collects nodes from all subgraphs with full paths
- `navigateToPath()` performs step-by-step navigation to target node
- `centerOnNode()` uses G6's `focusItem()` with animation

**Cross-Level Navigation:**
1. Navigate to root level
2. Step through path array, entering subgraphs sequentially
3. Use timeouts to allow graph render between steps
4. Center and select target node when reached

**Integration:** Requires both `graph` and `navigation` instances to function.

## Important Implementation Details

### Updating Selection State

Always use the `updateSelection(graph, item)` utility from `src/events/utils.js`:

```javascript
import { updateSelection } from './events/utils';

// Correct way to change selection
updateSelection(graph, node);  // Select node
updateSelection(graph, null);  // Clear selection
```

This ensures:
- Previous selection is properly cleared
- Node/edge states are correctly updated
- `graph.selectedItem` is synchronized

### Adding New Nodes

When creating nodes programmatically:

1. Generate unique ID using timestamp: `node-${Date.now()}`
2. Use mouse position from `graph.mousePosition` or event coordinates
3. Update graph data: add to array, call `graph.addItem()`
4. For rectangle nodes in subgraph mode, save to `navigation.currentGraphData.nodes`

### File Save/Load

The FileManager uses modern File System Access API when available:

- **Save:** Serializes entire graph hierarchy including all subgraphs
- **Load:** Reconstructs full navigation state and graph stack
- Integration requires `navigation` instance to access `currentGraphData`

### Configuration System (src/config.js)

All visual constants are centralized in `config.js`:

- `nodeStateStyles`: Selected state appearance
- `defaultNode`/`defaultEdge`: Default styles
- `colors`: Color palette (primary, success, warning, error, purple, black)
- `sizes`: Control point size, min node size, max image size, padding values
- `styleConfig`: Shadow, border radius, font sizes

**Important:** Always import from config instead of hardcoding values.

## Common Development Patterns

### Adding a New Event Handler

1. Create handler function in appropriate `src/events/*.js` file
2. Export it from `src/events/index.js`
3. Import and call in `src/index.js` during initialization
4. Ensure handler checks `graph.get('currentMode')` if mode-dependent

### Creating a New Node Type

1. Define custom node in `src/nodes/`
2. Implement `draw()` method returning group with shapes
3. Implement `setState()` for visual state changes
4. Register with `G6.registerNode('type-name', {...})`
5. Export registration function from `src/nodes/index.js`

### Working with Subgraphs

When modifying graph data in subgraph mode:

1. Always work with `navigation.currentGraphData`, not `graph.save()`
2. Call `navigation.updateCurrentGraphData()` before switching levels
3. When saving files, FileManager automatically collects all subgraph data
4. Only rectangle nodes have `.subGraph` property

### Debugging Navigation Issues

The search system includes extensive debug logging:

```javascript
console.log('🔍 [NodeSearch] Starting search:', query);
console.log('🔍 [NodeSearch] Navigation:', { targetPath, targetNodeId });
```

Look for these emoji-prefixed logs when debugging cross-level navigation issues.

## Key Constraints

- **No subgraphs on text/image nodes**: Only `rectangle-node` supports `subGraph` property
- **Minimum node size**: Enforced at 50px (defined in `sizes.minNodeSize`)
- **Image paste only**: Images must be added via Ctrl+V, not file upload
- **Single selection**: Only one node/edge can be selected at a time

## Browser Compatibility

- Chrome/Edge 86+: Full support (File System Access API)
- Firefox 82+: Basic support (fallback to download/upload)
- Safari 14+: Basic support (fallback to download/upload)

## Memory Bank

The `memory_bank/` directory contains comprehensive Chinese documentation covering:
1. Project architecture summary
2. Event handling mechanisms
3. Custom node implementations
4. Navigation and subgraph system
5. Toolbar and file management
6. Context menu system
7. Core configuration
8. Complete feature list
9. File structure details
10. Node search functionality

Refer to these documents for deep dives into specific subsystems.
