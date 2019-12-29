window.addEventListener('DOMContentLoaded', (event) => {
	const _canvas = document.querySelector(`.graph-canvas`);
    const _graph  = document.querySelector(`.graph`);
    const nodes   = document.querySelectorAll(`._node_`);
	
    graph = new Graph(_graph, `Snap`);

    graph.canvas    = _canvas;
    graph.grid_size = 20;

    document.addEventListener(`click`, (event) => {
        const classes = event.target.classList;

        if(classes.contains(`link`)) {
            graph.link();
        }
    });

    document.addEventListener(`__node_active__`, event => event.target.classList.add(`__node_active__`));
    document.addEventListener(`__node_deactive__`, event => event.target.classList.remove(`__node_active__`));
    
    nodes.forEach(node => {
        const init = {
            bubbles : true,
            detail  : {
                graph : graph,
                init  : function() {
                    const text      = node.innerText;
                    const element   = document.createElement(`div`);
                    const text_node = document.createTextNode(text);

                    const data = {
                        foo : `bar`,
                    };

                    element.appendChild(text_node);

                    element.width  = 50;
                    element.height = 50;

                    const obj = new Node(element);

                    Object.assign(obj, data);

                    return obj;
                }
            }
        };

        const event = new CustomEvent(`__node_init__`, init);

        node.dispatchEvent(event);
    });
});