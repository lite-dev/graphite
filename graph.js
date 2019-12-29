class Graph {
	_element; _type;

	types = {
		FreeForm : FreeForm,
		Snap     : Snap,
	};

	nodes          = new Map();
	tmp_link_nodes = [];
	temp_node      = {
		node    : null,
		offsetX : null,
		offsetY : null,
	};

	constructor(element, _default = `FreeForm`) {				
		this.type    = _default;
		this.element = element;

		window.addEventListener('resize', event => this.canvas && this.drawNodes());
	}

	get type() {
		return this._type;
	}

	set type(value) {
		const has = this.types[value];

		if(has) {
			this._type = value;
	
			this.types[value]();
		}
	}

	getNode(element) {
		return this.nodes.get(element);
	}

	setNode(node) {
		if(!this.nodes.has(node)) {
			this.nodes.set(node.element, node);
		}
	}

	drawNodes() {
		const element   = this.element;
		const canvas    = this.canvas;
		const nodes     = this.nodes.values();
		const context   = canvas.getContext(`2d`);
		const grid_size = this.grid_size;

		canvas.width  = element.clientWidth;
		canvas.height = element.clientHeight;

		context.clearRect(0, 0, canvas.width, canvas.height);
		this.gridLines(grid_size);

		for(const node of nodes) {
			this.draw && this.draw(node);
		}
	}

	addNodeEvents(element) {
		const drag = element.getAttribute(`draggable`);

		if(!Boolean(drag)) {
			element.addEventListener(`dragstart`, (event) => {
				this.getNodeEvent(event, element);
			});

			element.addEventListener(`click`, (event) => {
				this.setActiveNodeEvent(event, element);
			});
		}

		element.setAttribute(`draggable`, true);
	}

	addGraphEvents(element) {
		element.addEventListener(`drop`, (event) => {
			this.setNodeEvent(event);
		});

		element.addEventListener(`dragover`, (event) => event.preventDefault());
	}

	setNodeEvent(event) {
		const node      = this.temp_node.node;
		const rect      = this.element.getBoundingClientRect();
		const x         = event.clientX - rect.left;
		const y         = event.clientY - rect.top;

		this.plot(node, x, y);
		this.drawNodes();
	}

	setActiveNodeEvent(event, element) {
		const self  = this;
		const node  = self.getNode(element);
		const limit = self.tmp_link_nodes.length > 1;

		function push() {
			self.tmp_link_nodes.push(node);
		}

		function pop() {
			self.tmp_link_nodes.pop();
		}

		if(node.active) {
			pop();
		}

		else if(limit) {
			pop();
			push();
		}

		else {
			push();
		}

		node.active = node.active ? false : true;
	}

	register(data) {
		Object.assign(this.types, data);
	}
}

class Node {
	_element; _x; _y; _offset_x; _offset_y; _active; _grid_size;

	parent_nodes = new Set();
	child_nodes  = new Set();

	static counter = 0;

	constructor(element, x, y) {
		this.id      = --Node.counter;
		this.element = element || document.createElement(`div`);
		this.x       = x;
		this.y       = y;
	}

	get topX() {
		return this.x + this.element.clientWidth / 2;
	}

	get topY() {
		return this.y;
	}

	get bottomX() {
		return this.topX;
	}

	get bottomY() {
		return this.y + this.element.clientHeight;
	}

	get leftX() {
		return this.x;
	}

	get leftY() {
		return this.y + this.element.clientHeight / 2;
	}

	get rightX() {
		return this.x + this.element.clientWidth;
	}

	get rightY() {
		return this.leftY;
	}

	get element() {
		return this._element;
	}

	get offset_x() {
		return this._offset_x ? this._offset_x : this.element.clientWidth / 2;
	}

	set offset_x(value) {
		this._offset_x = value;
	}

	get offset_y() {
		return this._offset_y ? this._offset_y : this.element.clientHeight / 2;
	}

	set offset_y(value) {
		this._offset_y = value;
	}

	get active() {
		return this._active;
	}

	set active(value) {
		const name = value ? `active` : `deactive`;

		this._active = value;

		const init = {
			bubbles : true,
			detail  : {
				node : this,
			}
		};

		const event = new CustomEvent(`__node_${name}__`, init);

		this.element.dispatchEvent(event);
	}

	set element(value) {
		value.classList.add(`__node__`);

		this._element = value;
	}
}

function FreeForm() {
	const element = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._element;
		},
	
		set(value) {
			value.classList.add(`__graph__`);
	
			this.addGraphEvents(value);
			this._element = value;
		}
	};

	const x = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._x;
		},

		set(value) {
			const offset_x = this.offset_x || 0;
	
			this._x = value + this.width / 2;
	
			this.element.style.left = value ? `${value - offset_x}px` : null;
		}
	};

	const y = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._y;
		},

		set(value) {
			const offset_y = this.offset_y || 0;

			this._y = value;
	
			this.element.style.top  = value ? `${value - offset_y}px` : null;
		}
	};

	const plot = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function plot(node, x, y) {
			node.element.style.cssText = null;
	
			node.x = x;
			node.y = y;
	
			this.element.appendChild(node.element);
			this.addNodeEvents(node.element);
			this.setNode(node);
		},
	};

	const get_node_event = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function getNodeEvent(event, element, node = {}) {
			node = this.getNode(element) || node;
	
			this.temp_node.node = node;
	
			node.offset_x = event.offsetX;
			node.offset_y = event.offsetY;
		},
	};

	Object.defineProperty(Graph.prototype, `element`, element);
	Object.defineProperty(Graph.prototype, `plot`, plot);
	Object.defineProperty(Graph.prototype, `getNodeEvent`, get_node_event);

	Object.defineProperty(Node.prototype, `x`, x);
	Object.defineProperty(Node.prototype, `y`, y);
}

function Snap() {
	const element = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._element;
		},
	
		set(value) {
			value.classList.add(`__grid__`);
	
			this.addGraphEvents(value);
			this._element = value;
		}
	};

	const x = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._x;
		},

		set(value) {
			this._x = value;

			const grid_size = this.grid_size;
			const element   = this.element;
			const coord_x   = this.coord_x;
			const offset_x  = this.offset_x;

			this._x = grid_size * (coord_x - 1) - offset_x;
	
			element.style.left            = `${-offset_x}px`;
			element.style.gridColumnStart = coord_x;
		}
	};

	const y = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._y;
		},

		set(value) {
			this._y = value;

			const grid_size = this.grid_size;
			const element   = this.element;
			const coord_y   = this.coord_y;
			const offset_y  = this.offset_y;

			this._y = grid_size * (coord_y - 1) - offset_y;
	
			element.style.top          = `${-offset_y}px`;
			element.style.gridRowStart = coord_y;
		}
	};

	const coord_x = {
		configurable : true,
		enumerable   : true,

		get() {
			const x         = this.x;
			const grid_size = this.grid_size;
	
			return Math.round(x / grid_size) + 1;
		}
	};

	const coord_y = {
		configurable : true,
		enumerable   : true,

		get() {
			const y         = this.y;
			const grid_size = this.grid_size;
	
			return Math.round(y / grid_size) + 1;
		}
	};

	const canvas = {
		configurable : true,
		enumerable   : true,
	
		get() {
			return this._canvas;
		},
	
		set(value) {
			value.classList.add(`__canvas__`);
	
			value.width  = value.clientWidth;
			value.height = value.clientHeight;
	
			this._canvas = value;
		}
	};

	const snap = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._snap;
		},
	
		set(value) {
			const method = value ? `add` : `remove`;
	
			this._snap = value;
	
			this.element.classList[method](`__grid__`);
		}
	};

	const grid_size = {
		configurable : true,
		enumerable   : true,

		get() {
			return this._grid_size;
		},
	
		set(value) {
			this._grid_size = value;
			this.gridLines(value);
		}
	};

	const grid_lines = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function gridLines(size) {
			const element = this.element;
			const canvas  = this.canvas;
			const context = canvas.getContext(`2d`);
			const width   = canvas.clientWidth;
			const height  = canvas.clientHeight;
	
			const columns = Math.round(element.clientWidth / size);
			const rows    = Math.round(element.clientHeight / size);
	
			context.strokeStyle = `rgba(122, 121, 119, 0.15)`;
			context.fillStyle   = `rgba(122, 121, 119, 0.15)`;
	
			for(let i = 0; i <= height; i += size) {
				context.beginPath();
				context.moveTo(0, i);
				context.lineTo(width, i);
				context.stroke();
			}
	
			for(let i = 0; i <= width; i += size) {
				context.beginPath();
				context.moveTo(i, 0);
				context.lineTo(i, height);
				context.stroke();
			}
	
			element.style.gridTemplateColumns = `repeat(${columns}, ${size}px) auto`;
			element.style.gridTemplateRows    = `repeat(${rows}, ${size}px) auto`;
		},
	};

	const get_node_event = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function getNodeEvent(event, element, node = {}) {
			node = this.getNode(element) || node;
	
			this.temp_node.node = node;
	
			node.offset_x = element.width / 2;
			node.offset_y = element.height / 2;
		},
	};

	const plot = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function plot(node, x, y) {
			const grid_size = this.grid_size;
	
			node.element.style.cssText = null;
	
			node.grid_size = grid_size;
			node.x         = x;
			node.y         = y;
	
			this.element.appendChild(node.element);
			this.addNodeEvents(node.element);
			this.setNode(node);
		},
	};

	const draw = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function draw(node) {
			const main     = node;
			const canvas   = this.canvas;
			const children = Array.from(main.child_nodes.values());
			const context  = canvas.getContext(`2d`);
	
			children.forEach(child => {
				let start_x, start_y, end_x, end_y, temp_distance;

				const main_coords = [
					[main.topX, main.topY],
					[main.rightX, main.rightY],
					[main.bottomX, main.bottomY],
					[main.leftX, main.leftY],
				];

				const child_cords = [
					[child.topX, child.topY],
					[child.rightX, child.rightY],
					[child.bottomX, child.bottomY],
					[child.leftX, child.leftY],
				];

				main_coords.forEach(main_current => {
					let [temp_start_x, temp_start_y] = main_current;

					child_cords.forEach(child_current => {
						let [temp_end_x, temp_end_y] = child_current;
						let x = Math.pow(temp_start_x - temp_end_x, 2);
						let y = Math.pow(temp_start_y - temp_end_y, 2);

						let distance = Math.sqrt(x + y);

						if(!temp_distance || temp_distance > distance) {
							start_x = temp_start_x;
							start_y = temp_start_y;
							end_x   = temp_end_x;
							end_y   = temp_end_y;

							temp_distance = distance;
						}
					})
				})
		
				child.active  = false;

				context.strokeStyle = `#777777`;
		
				context.beginPath();
				context.moveTo(start_x, start_y);
				context.lineTo(end_x, end_y);
				context.stroke();
			});

			main.active = false;
		}
	}

	const link = {
		configurable : true,
		enumerable   : true,
		writable     : true,
		value        : function link() {
			const self      = this;
			const from_node = self.tmp_link_nodes.shift();
			const to_node   = self.tmp_link_nodes.shift();
	
			from_node.child_nodes.add(to_node);
			to_node.parent_nodes.add(from_node);

			self.draw(from_node);
		},
	};

	Object.defineProperty(Graph.prototype, `element`, element);
	Object.defineProperty(Graph.prototype, `canvas`, canvas);
	Object.defineProperty(Graph.prototype, `snap`, snap);
	Object.defineProperty(Graph.prototype, `grid_size`, grid_size);
	Object.defineProperty(Graph.prototype, `gridLines`, grid_lines);
	Object.defineProperty(Graph.prototype, `getNodeEvent`, get_node_event);
	Object.defineProperty(Graph.prototype, `plot`, plot);
	Object.defineProperty(Graph.prototype, `link`, link);
	Object.defineProperty(Graph.prototype, `draw`, draw);

	Object.defineProperty(Node.prototype, `coord_x`, coord_x);
	Object.defineProperty(Node.prototype, `coord_y`, coord_y);
	Object.defineProperty(Node.prototype, `x`, x);
	Object.defineProperty(Node.prototype, `y`, y);
}

window.addEventListener(`DOMContentLoaded`, (event) => {
	document.addEventListener(`__node_init__`, (event) => {
		const detail   = event.detail || {};
		const graph    = detail.graph;
		const element  = event.target;
		const internal = document.createElement(`div`);
		
		element.addEventListener(`dragstart`, (event) => {
			const node = detail.init.call(element) || (new Node(internal));

			graph.getNodeEvent(event, node.element, node);
		});

		element.setAttribute(`draggable`, true);
	});
});