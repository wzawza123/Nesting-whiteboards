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
            radius: 6,
            lineWidth: 1.5,
        },
        labelCfg: {
            style: {
                fill: '#333',
                fontSize: 16,
                fontFamily: 'Arial',
            },
        },
        // Set default size larger
        size: [160, 80],
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

// Graph state management
let graphStack = [];
let currentGraphData = {
    id: 'root',
    nodes: [],
    edges: [],
    parentNode: null,
    label: 'Root'
};

// Track mouse position and resize state
let mousePosition = { x: 0, y: 0 };
let isResizing = false;
let resizeNode = null;
let resizeStartSize = null;
let resizeStartPoint = null;
let resizeHandle = null;

document.getElementById('container').addEventListener('mousemove', (ev) => {
    const containerRect = graph.get('container').getBoundingClientRect();
    const point = {
        x: ev.clientX - containerRect.left,
        y: ev.clientY - containerRect.top
    };
    mousePosition = graph.getPointByClient(point.x, point.y);

    // Handle resizing
    if (isResizing && resizeNode) {
        const dx = mousePosition.x - resizeStartPoint.x;
        const dy = mousePosition.y - resizeStartPoint.y;
        let newWidth = resizeStartSize[0];
        let newHeight = resizeStartSize[1];

        // Calculate new size based on resize handle
        switch (resizeHandle) {
            case 'nw':
                newWidth = resizeStartSize[0] - dx * 2;
                newHeight = resizeStartSize[1] - dy * 2;
                break;
            case 'ne':
                newWidth = resizeStartSize[0] + dx * 2;
                newHeight = resizeStartSize[1] - dy * 2;
                break;
            case 'se':
                newWidth = resizeStartSize[0] + dx * 2;
                newHeight = resizeStartSize[1] + dy * 2;
                break;
            case 'sw':
                newWidth = resizeStartSize[0] - dx * 2;
                newHeight = resizeStartSize[1] + dy * 2;
                break;
        }

        // Ensure minimum size
        newWidth = Math.max(30, newWidth);
        newHeight = Math.max(30, newHeight);

        // Update node size
        graph.updateItem(resizeNode, {
            size: [newWidth, newHeight]
        });
    }
});

// Add mouse down handler for resize controls
graph.on('node:mousedown', (ev) => {
    const { item, target } = ev;
    const name = target.get('name');
    
    if (name && name.startsWith('control-point-')) {
        isResizing = true;
        resizeNode = item;
        resizeStartSize = item.getModel().size || [100, 100];
        resizeStartPoint = { ...mousePosition };
        resizeHandle = name.split('-')[2]; // Get handle position (nw, ne, se, sw)
        ev.preventDefault();
    }
});

// Add mouse up handler
document.addEventListener('mouseup', () => {
    isResizing = false;
    resizeNode = null;
    resizeStartSize = null;
    resizeStartPoint = null;
    resizeHandle = null;
});

// Handle image paste
document.addEventListener('paste', (ev) => {
    const items = ev.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // Create a temporary image to get dimensions
                const img = new Image();
                img.onload = () => {
                    // Calculate size maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 200;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    // Use current mouse position for placement
                    const point = mousePosition;
                    
                    // Add image node
                    const id = `image-${Date.now()}`;
                    graph.addItem('node', {
                        id,
                        x: point.x,
                        y: point.y,
                        type: 'image-node',
                        img: e.target.result,
                        size: [width, height],
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            break;
        }
    }
});

// Function to navigate to specific level
const navigateToLevel = (level) => {
    if (level < 0 || level > graphStack.length) return;
    
    // Save current state
    updateCurrentGraphData();
    
    if (level === 0) {
        // Navigate to root
        while (graphStack.length > 0) {
            const currentState = graphStack.pop();
            const parentNode = currentState.nodes.find(
                node => node.id === currentGraphData.parentNode
            );
            if (parentNode) {
                parentNode.subGraph = {...currentGraphData};
            }
            currentGraphData = currentState;
        }
    } else {
        // Navigate to specific level
        while (graphStack.length > level) {
            const currentState = graphStack.pop();
            const parentNode = currentState.nodes.find(
                node => node.id === currentGraphData.parentNode
            );
            if (parentNode) {
                parentNode.subGraph = {...currentGraphData};
            }
            currentGraphData = currentState;
        }
    }
    
    // Update graph and UI
    graph.data(currentGraphData);
    graph.render();
    updateNavigationPath();
    updateBackButton();
};

// Function to update navigation path with click handlers
const updateNavigationPath = () => {
    const navBar = document.getElementById('navigation-bar');
    const pathElements = [];
    
    // Add root with click handler
    pathElements.push(`<span class="nav-node" onclick="window._navigateToLevel(0)">Root</span>`);
    
    // Add intermediate nodes from stack with click handlers
    graphStack.forEach((graph, index) => {
        const node = graph.nodes.find(n => n.id === graphStack[index + 1]?.parentNode);
        if (node) {
            pathElements.push('<span class="nav-separator">/</span>');
            pathElements.push(
                `<span class="nav-node" onclick="window._navigateToLevel(${index + 1})">${node.label || 'Unnamed'}</span>`
            );
        }
    });
    
    // Add current node if in a subgraph
    if (currentGraphData.parentNode) {
        const parentGraph = graphStack[graphStack.length - 1];
        const parentNode = parentGraph.nodes.find(n => n.id === currentGraphData.parentNode);
        if (parentNode) {
            pathElements.push('<span class="nav-separator">/</span>');
            pathElements.push(`<span class="nav-current">${parentNode.label || 'Unnamed'}</span>`);
        }
    }
    
    navBar.querySelector('.nav-path').innerHTML = pathElements.join('');
};

// Expose navigation function to window for onclick handlers
window._navigateToLevel = navigateToLevel;

// Function to save current graph state
const saveGraphState = () => {
    return {
        nodes: graph.save().nodes.map(node => ({...node})),
        edges: graph.save().edges.map(edge => ({...edge}))
    };
};

// Function to update current graph data
const updateCurrentGraphData = () => {
    const savedState = saveGraphState();
    currentGraphData.nodes = savedState.nodes;
    currentGraphData.edges = savedState.edges;
};

// Load initial data
graph.data(currentGraphData);
graph.render();

// Add back button container
const backButton = document.createElement('button');
backButton.id = 'backButton';
backButton.innerText = '← Back to Parent';
backButton.style.position = 'fixed';
backButton.style.top = '10px';
backButton.style.right = '10px';
backButton.style.display = 'none';
backButton.style.padding = '8px 16px';
backButton.style.backgroundColor = '#1890ff';
backButton.style.color = 'white';
backButton.style.border = 'none';
backButton.style.borderRadius = '4px';
backButton.style.cursor = 'pointer';
backButton.style.zIndex = '1000';
backButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
document.body.appendChild(backButton);

// Back button hover effect
backButton.addEventListener('mouseover', () => {
    backButton.style.backgroundColor = '#40a9ff';
});
backButton.addEventListener('mouseout', () => {
    backButton.style.backgroundColor = '#1890ff';
});

// Handle window resize
window.addEventListener('resize', () => {
    graph.changeSize(window.innerWidth, window.innerHeight);
});

// Register image node
G6.registerNode('image-node', {
    draw(cfg, group) {
        const size = cfg.size || [100, 100];
        const width = size[0];
        const height = size[1];
        
        // Add image shape
        const imageShape = group.addShape('image', {
            attrs: {
                x: -width/2,
                y: -height/2,
                width: width,
                height: height,
                img: cfg.img,
                cursor: 'move',
            },
            name: 'image-shape',
        });

        // Add selection border (initially invisible)
        const borderShape = group.addShape('rect', {
            attrs: {
                x: -width/2,
                y: -height/2,
                width: width,
                height: height,
                stroke: 'transparent',
                lineWidth: 2,
                cursor: 'move',
            },
            name: 'image-border',
        });

        // Add resize controls (initially invisible)
        const controlSize = 8;
        const controlPoints = [
            { x: -width/2, y: -height/2, cursor: 'nw-resize', name: 'nw' },
            { x: width/2, y: -height/2, cursor: 'ne-resize', name: 'ne' },
            { x: width/2, y: height/2, cursor: 'se-resize', name: 'se' },
            { x: -width/2, y: height/2, cursor: 'sw-resize', name: 'sw' }
        ];

        controlPoints.forEach(point => {
            group.addShape('rect', {
                attrs: {
                    x: point.x - controlSize/2,
                    y: point.y - controlSize/2,
                    width: controlSize,
                    height: controlSize,
                    fill: '#fff',
                    stroke: '#1890ff',
                    cursor: point.cursor,
                    opacity: 0,
                },
                name: `control-point-${point.name}`,
            });
        });

        return imageShape;
    },
    update(cfg, node) {
        const group = node.getContainer();
        const imageShape = group.find(e => e.get('name') === 'image-shape');
        const borderShape = group.find(e => e.get('name') === 'image-border');
        
        if (imageShape) {
            const size = cfg.size || [100, 100];
            const width = size[0];
            const height = size[1];
            const controlSize = 8;
            
            imageShape.attr({
                x: -width/2,
                y: -height/2,
                width: width,
                height: height,
                img: cfg.img,
            });
            
            borderShape.attr({
                x: -width/2,
                y: -height/2,
                width: width,
                height: height,
            });

            // Update control points positions
            const controlPoints = [
                { x: -width/2, y: -height/2, name: 'nw' },
                { x: width/2, y: -height/2, name: 'ne' },
                { x: width/2, y: height/2, name: 'se' },
                { x: -width/2, y: height/2, name: 'sw' }
            ];

            controlPoints.forEach(point => {
                const control = group.find(e => e.get('name') === `control-point-${point.name}`);
                if (control) {
                    control.attr({
                        x: point.x - controlSize/2,
                        y: point.y - controlSize/2,
                    });
                }
            });
        }
    },
    setState(name, value, node) {
        const group = node.getContainer();
        const borderShape = group.find(e => e.get('name') === 'image-border');
        
        if (name === 'selected') {
            borderShape.attr('stroke', value ? '#1890ff' : 'transparent');
            
            // Show/hide control points
            ['nw', 'ne', 'se', 'sw'].forEach(pos => {
                const control = group.find(e => e.get('name') === `control-point-${pos}`);
                if (control) {
                    control.attr('opacity', value ? 1 : 0);
                }
            });
        }
    },
});

// Register custom text node
G6.registerNode('text-only', {
    draw(cfg, group) {
        // Get style configurations
        const style = cfg.labelCfg?.style || {};
        
        // Add background rect for selection highlight and better interaction
        const textShape = group.addShape('text', {
            attrs: {
                text: cfg.label || 'Text',
                x: 0,
                y: 0,
                textAlign: 'center',
                textBaseline: 'middle',
                fill: style.fill || '#333',
                fontSize: style.fontSize || 16,
                fontFamily: 'Arial',
                cursor: 'move', // Change cursor to indicate draggable
            },
            name: 'text-shape',
        });
        
        const textBox = textShape.getBBox();
        const padding = 8;
        
        // Add background rect that will show when selected
        const backgroundRect = group.addShape('rect', {
            attrs: {
                x: textBox.x - padding,
                y: textBox.y - padding,
                width: textBox.width + (padding * 2),
                height: textBox.height + (padding * 2),
                fill: 'transparent',
                stroke: 'transparent',
                lineWidth: 2,
                radius: 4,
                cursor: 'move',
            },
            name: 'text-bg',
        });
        
        // Put the background behind the text
        backgroundRect.toBack();
        
        return textShape;
    },
    update(cfg, node) {
        const group = node.getContainer();
        const textShape = group.find(e => e.get('name') === 'text-shape');
        const backgroundRect = group.find(e => e.get('name') === 'text-bg');
        
        if (textShape) {
            const style = cfg.labelCfg?.style || {};
            textShape.attr({
                text: cfg.label,
                fill: style.fill || '#333',
                fontSize: style.fontSize || 16
            });
        }
        
        if (backgroundRect) {
            const textBox = textShape.getBBox();
            const padding = 8;
            backgroundRect.attr({
                x: textBox.x - padding,
                y: textBox.y - padding,
                width: textBox.width + (padding * 2),
                height: textBox.height + (padding * 2),
            });
        }
    },
    setState(name, value, node) {
        const group = node.getContainer();
        const backgroundRect = group.find(e => e.get('name') === 'text-bg');
        
        if (name === 'selected') {
            if (value) {
                // When selected
                backgroundRect.attr({
                    stroke: '#1890ff',
                    shadowColor: '#1890ff',
                    shadowBlur: 10,
                });
            } else {
                // When deselected
                backgroundRect.attr({
                    stroke: 'transparent',
                    shadowColor: null,
                    shadowBlur: 0,
                });
            }
        }
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

// Function to start editing node label
const startEditingLabel = (item) => {
    const model = item.getModel();
    const currentLabel = model.label || '';
    
    // Get node position and size
    const nodeBox = item.getBBox();
    const { x, y, width, height } = nodeBox;
    const point = graph.getCanvasByPoint(x, y);
    
    // Create input element
    const input = document.createElement('input');
    input.value = currentLabel;
    input.className = 'node-editor';
    input.style.position = 'absolute';
    input.style.width = `${Math.max(120, width)}px`;
    input.style.padding = '4px 8px';
    input.style.border = '2px solid #1890ff';
    input.style.borderRadius = '4px';
    input.style.zIndex = '1000';
    input.style.fontSize = '16px';
    input.style.backgroundColor = 'white';
    input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    
    // Position the input at the center of the node
    input.style.left = `${point.x - width/2}px`;
    input.style.top = `${point.y - height/2}px`;
    
    document.body.appendChild(input);
    input.focus();
    input.select(); // Select all text for easy editing

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
};

// Function to show context menu
const showContextMenu = (x, y, node) => {
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    // Store current node reference
    menu.dataset.nodeId = node.get('id');
    
    // Get the current styles from the node's model
    const model = node.getModel();
    const currentFontSize = model.labelCfg?.style?.fontSize || 16;
    const currentColor = model.labelCfg?.style?.fill || '#333333';
    
    // Update font size items to show current size
    menu.querySelectorAll('.submenu .menu-item[data-size]').forEach(item => {
        const size = parseInt(item.dataset.size);
        if (size === currentFontSize) {
            item.style.fontWeight = 'bold';
            item.style.color = '#1890ff';
        } else {
            item.style.fontWeight = 'normal';
            item.style.color = '#333';
        }
    });

    // Update color items to show current color
    menu.querySelectorAll('.color-item').forEach(item => {
        const color = item.dataset.color;
        if (color === currentColor) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

// Function to hide context menu
const hideContextMenu = () => {
    const menu = document.getElementById('context-menu');
    menu.style.display = 'none';
};

// Handle node right-click
graph.on('node:contextmenu', (ev) => {
    ev.preventDefault();
    const { item, clientX, clientY } = ev;
    showContextMenu(clientX, clientY, item);
});

// Handle context menu item clicks
document.getElementById('context-menu').addEventListener('click', (ev) => {
    const target = ev.target.closest('.menu-item');
    if (!target) return;
    
    const menu = document.getElementById('context-menu');
    const nodeId = menu.dataset.nodeId;
    const node = graph.findById(nodeId);
    
    if (!node) return;
    
    if (target.dataset.action === 'edit') {
        startEditingLabel(node);
    } else if (target.dataset.size) {
        // Update font size
        const fontSize = parseInt(target.dataset.size);
        graph.updateItem(node, {
            labelCfg: {
                style: {
                    ...node.get('labelCfg')?.style,
                    fontSize
                }
            }
        });
    } else if (target.dataset.color) {
        // Update text color
        const color = target.dataset.color;
        graph.updateItem(node, {
            labelCfg: {
                style: {
                    ...node.get('labelCfg')?.style,
                    fill: color
                }
            }
        });
    }
    
    hideContextMenu();
});

// Hide context menu when clicking outside
document.addEventListener('click', (ev) => {
    if (!ev.target.closest('.context-menu')) {
        hideContextMenu();
    }
});

// Hide context menu when scrolling or dragging
graph.on('viewportchange', hideContextMenu);
graph.on('dragstart', hideContextMenu);

// Add keyboard shortcut for editing
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && selectedItem && selectedItem.getModel().type !== 'text-only') {
        e.preventDefault(); // Prevent default enter behavior
        startEditingLabel(selectedItem);
    }
});

// Function to update back button text
const updateBackButton = () => {
    if (graphStack.length > 0) {
        const parentGraph = graphStack[graphStack.length - 1];
        const parentNode = parentGraph.nodes.find(
            node => node.id === currentGraphData.parentNode
        );
        backButton.innerHTML = `← Back to ${parentNode ? parentNode.label || 'Unnamed' : 'Parent'}`;
        backButton.style.display = 'block';
    } else {
        backButton.style.display = 'none';
    }
};

// Handle double click to enter subgraph
graph.on('node:dblclick', (ev) => {
    const node = ev.item;
    const model = node.getModel();
    
    // Only handle rectangle nodes
    if (model.type === 'text-only') return;
    
    // Save current graph state
    updateCurrentGraphData();
    
    // Push current state to stack
    graphStack.push({...currentGraphData});
    
    // Initialize subgraph if it doesn't exist
    if (!model.subGraph) {
        model.subGraph = {
            id: `subgraph-${model.id}`,
            nodes: [],
            edges: [],
            parentNode: model.id
        };
    }
    
    // Switch to subgraph
    currentGraphData = model.subGraph;
    graph.data(currentGraphData);
    graph.render();
    
    // Update navigation
    updateNavigationPath();
    updateBackButton();
});

// Handle back button click
backButton.addEventListener('click', () => {
    if (graphStack.length > 0) {
        // Save current subgraph state
        updateCurrentGraphData();
        
        // Update parent node's subgraph data
        const parentGraph = graphStack[graphStack.length - 1];
        const parentNode = parentGraph.nodes.find(
            node => node.id === currentGraphData.parentNode
        );
        if (parentNode) {
            parentNode.subGraph = {...currentGraphData};
        }
        
        // Restore parent graph
        currentGraphData = graphStack.pop();
        graph.data(currentGraphData);
        graph.render();
        
        // Update navigation
        updateNavigationPath();
        updateBackButton();
    }
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

// Function to get complete graph data including subgraphs
const getCompleteGraphData = (graphData) => {
    const nodes = graphData.nodes.map(node => {
        const newNode = { ...node };
        if (newNode.subGraph) {
            newNode.subGraph = getCompleteGraphData(newNode.subGraph);
        }
        return newNode;
    });
    
    return {
        ...graphData,
        nodes,
        edges: graphData.edges.map(edge => ({ ...edge }))
    };
};

// Function to restore graph data including subgraphs
const restoreGraphData = (data) => {
    // Restore nodes with their subgraphs
    const nodes = data.nodes.map(node => {
        const newNode = { ...node };
        if (newNode.subGraph) {
            newNode.subGraph = restoreGraphData(newNode.subGraph);
        }
        return newNode;
    });

    return {
        ...data,
        nodes,
        edges: data.edges.map(edge => ({ ...edge }))
    };
};

// Save graph data
document.getElementById('saveGraph').addEventListener('click', () => {
    // Update current graph state before saving
    updateCurrentGraphData();
    
    // Get complete data including all subgraphs
    const completeData = {
        currentGraph: getCompleteGraphData(currentGraphData),
        graphStack: graphStack.map(graph => getCompleteGraphData(graph))
    };
    
    // Convert to JSON and create blob
    const jsonString = JSON.stringify(completeData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// Load graph data
document.getElementById('loadGraph').addEventListener('click', () => {
    document.getElementById('loadFile').click();
});

document.getElementById('loadFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                
                // Restore complete data structure
                currentGraphData = restoreGraphData(loadedData.currentGraph);
                graphStack = loadedData.graphStack.map(graph => restoreGraphData(graph));
                
                // Update graph display
                graph.data(currentGraphData);
                graph.render();
                
                // Update navigation
                updateNavigationPath();
                updateBackButton();
                
                // Clear file input
                event.target.value = '';
            } catch (error) {
                console.error('Error loading graph data:', error);
                alert('Error loading graph data. Please check if the file is valid.');
            }
        };
        reader.readAsText(file);
    }
});
