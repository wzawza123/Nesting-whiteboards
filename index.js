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

// Function to update navigation path
const updateNavigationPath = () => {
    const navBar = document.getElementById('navigation-bar');
    const pathElements = [];
    
    // Add root
    pathElements.push('<span class="nav-node">Root</span>');
    
    // Add intermediate nodes from stack
    graphStack.forEach((graph, index) => {
        const node = graph.nodes.find(n => n.id === graphStack[index + 1]?.parentNode);
        if (node) {
            pathElements.push('<span class="nav-separator">/</span>');
            pathElements.push(`<span class="nav-node">${node.label || 'Unnamed'}</span>`);
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

// Register custom text node
G6.registerNode('text-only', {
    draw(cfg, group) {
        // Add background rect for selection highlight and better interaction
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
            textShape.attr('text', cfg.label);
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
