// Initialize the graph
const graph = new G6.Graph({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
    // Enable various interaction modes
    modes: {
        default: [
            'drag-canvas',  // Enable canvas dragging
            'zoom-canvas',  // Enable zooming
            'drag-node',    // Enable node dragging
        ],
    },
    // Node types registration
    nodeStateStyles: {
        selected: {
            stroke: '#1890ff',
            lineWidth: 2,
            shadowColor: '#1890ff',
            shadowBlur: 10,
        },
    },

    // Default node style
    defaultNode: {
        type: 'rect',
        style: {
            fill: '#fff',
            stroke: '#333',
            radius: 4,
            lineWidth: 1,
        },
        labelCfg: {
            style: {
                fill: '#333',
                fontSize: 14,
            },
        },
    },
    // Default edge style
    defaultEdge: {
        type: 'line',
        style: {
            stroke: '#333',
            endArrow: true,
            lineWidth: 1,
        },
        // Add state styles for selection
        stateStyles: {
            selected: {
                stroke: '#1890ff',
                lineWidth: 2,
                shadowColor: '#1890ff',
                shadowBlur: 10,
            },
        },
    },
});

// Track the current mode and selected items
let currentMode = 'default';
let selectedItem = null;
let edgeStartNode = null;

// Initialize graph data
const data = {
    nodes: [],
    edges: [],
};

// Load initial data
graph.data(data);
graph.render();

// Handle window resize
window.addEventListener('resize', () => {
    graph.changeSize(window.innerWidth, window.innerHeight);
});

// Register custom text node
G6.registerNode('text-only', {
    draw(cfg, group) {
        const textShape = group.addShape('text', {
            attrs: {
                text: cfg.label || 'Text',
                x: 0,
                y: 0,
                textAlign: 'center',
                textBaseline: 'middle',
                fill: '#333',
                fontSize: 16,
                fontFamily: 'Arial',
                cursor: 'pointer',
            },
            name: 'text-shape',
        });
        
        // Add invisible background for better interaction
        const textBox = textShape.getBBox();
        group.addShape('rect', {
            attrs: {
                x: textBox.x - 10,
                y: textBox.y - 10,
                width: textBox.width + 20,
                height: textBox.height + 20,
                fill: 'transparent',
                stroke: 'transparent',
                cursor: 'pointer',
            },
            name: 'text-bg',
        });
        
        return textShape;
    },
    update(cfg, node) {
        const group = node.getContainer();
        const textShape = group.find(e => e.get('name') === 'text-shape');
        const textBg = group.find(e => e.get('name') === 'text-bg');
        
        textShape.attr('text', cfg.label);
        
        const textBox = textShape.getBBox();
        textBg.attr({
            x: textBox.x - 10,
            y: textBox.y - 10,
            width: textBox.width + 20,
            height: textBox.height + 20,
        });
    },
});

// Add event listeners for the toolbar buttons
document.getElementById('addRect').addEventListener('click', () => {
    currentMode = 'addNode';
});

document.getElementById('addText').addEventListener('click', () => {
    currentMode = 'addText';
});

document.getElementById('addEdge').addEventListener('click', () => {
    currentMode = 'addEdge';
});

document.getElementById('delete').addEventListener('click', () => {
    if (selectedItem) {
        graph.removeItem(selectedItem);
        selectedItem = null;
    }
});

// Handle canvas click events
graph.on('canvas:click', (ev) => {
    if (currentMode === 'addNode') {
        const point = graph.getPointByClient(ev.clientX, ev.clientY);
        const id = `node-${Date.now()}`;
        graph.addItem('node', {
            id,
            x: point.x,
            y: point.y,
            label: 'Right click to edit',
            size: [120, 60],
        });
        currentMode = 'default';
    } else if (currentMode === 'addText') {
        const point = graph.getPointByClient(ev.clientX, ev.clientY);
        const id = `text-${Date.now()}`;
        graph.addItem('node', {
            id,
            x: point.x,
            y: point.y,
            label: 'Right click to edit',
            type: 'text-only',
        });
        currentMode = 'default';
    }
});

// Function to update selection state
const updateSelection = (item) => {
    // Clear previous selection
    if (selectedItem) {
        graph.setItemState(selectedItem, 'selected', false);
    }
    // Set new selection
    if (item) {
        graph.setItemState(item, 'selected', true);
    }
    selectedItem = item;
};

// Handle node click events
graph.on('node:click', (ev) => {
    const node = ev.item;
    if (currentMode === 'addEdge') {
        if (!edgeStartNode) {
            edgeStartNode = node;
            graph.setItemState(node, 'selected', true);
        } else {
            // Check if the same node was clicked
            if (edgeStartNode.get('id') !== node.get('id')) {
                const id = `edge-${Date.now()}`;
                graph.addItem('edge', {
                    id,
                    source: edgeStartNode.get('id'),
                    target: node.get('id'),
                });
            }
            // Clear the start node selection
            graph.setItemState(edgeStartNode, 'selected', false);
            edgeStartNode = null;
            currentMode = 'default';
        }
    }
    updateSelection(node);
});

// Handle edge click events
graph.on('edge:click', (ev) => {
    updateSelection(ev.item);
});

// Handle node label editing through right-click
graph.on('node:contextmenu', (ev) => {
    ev.preventDefault(); // Prevent default context menu
    const { item, canvasX, canvasY } = ev;
    const model = item.getModel();
    const currentLabel = model.label || '';

    // Create input element
    const input = document.createElement('input');
    input.value = currentLabel;
    input.className = 'node-editor';
    input.style.position = 'absolute';
    input.style.left = `${canvasX}px`;
    input.style.top = `${canvasY}px`;
    input.style.width = '120px';
    input.style.padding = '4px';
    input.style.border = '1px solid #1890ff';
    input.style.borderRadius = '4px';
    input.style.zIndex = '1000';
    
    document.body.appendChild(input);
    input.focus();

    // Handle input submission
    const handleSubmit = () => {
        const newLabel = input.value.trim();
        if (newLabel) {
            graph.updateItem(item, { label: newLabel });
        }
        document.body.removeChild(input);
    };

    // Handle input events
    input.addEventListener('blur', handleSubmit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            document.body.removeChild(input);
        }
    });
});

// Clear selection when clicking on blank canvas
graph.on('canvas:click', () => {
    updateSelection(null);
    if (edgeStartNode) {
        graph.setItemState(edgeStartNode, 'selected', false);
        edgeStartNode = null;
        currentMode = 'default';
    }
});
