class __Global__ {
	static graphs = new Map();

	static temp_node = null;
	static temp_drag = null;
	static temp_drop = null;
}

class __Graph__ {
	_element; _type;

	types = {
		FreeForm : FreeForm,
		Snap     : Snap,
	};

	nodes           = new Map();
	temp_link_nodes = [];

	constructor(element, _default = `FreeForm`) {				
		this.type    = _default;
		this.element = element;

		__Global__.graphs.set(element, this);
	}

	get element() {
		return this._element;
	}

	set element(value) {
		this._element = value;

		this.addGraphEvents(value);
	}

	get type() {
		return this._type;
	}

	set type(value) {
		const has = this.types[value];

		if(has) {
			this._type = value;
	
			this.types[value].call(this);
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

	plot(node) {
		this.element.appendChild(node.element);
		this.addNodeEvents(node.element);
		this.setNode(node);
	}

	setActiveNodeEvent(event, element) {
		const self  = this;
		const node  = self.getNode(element);
		const limit = self.temp_link_nodes.length > 1;

		function push() {
			self.temp_link_nodes.push(node);
		}

		function pop() {
			self.temp_link_nodes.pop();
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

	addGraphEvents() {
		this.element.addEventListener(`drop`, (event) => {
			__Global__.temp_drop = event;
	
			this.setNodeProperties();
			this.plot(__Global__.temp_node);
			this.drawNodes();
		});
	
		this.element.addEventListener(`dragover`, event => event.preventDefault());
		window.addEventListener('resize', event => this.canvas && this.drawNodes());
	}
	
	addNodeEvents(element) {
		const drag = element.getAttribute(`draggable`);
	
		if(!Boolean(drag)) {
			element.addEventListener(`dragstart`, (event) => {
				__Global__.temp_drag = event;
				__Global__.temp_node = this.getNode(element);
			});
	
			element.addEventListener(`click`, (event) => {
				this.setActiveNodeEvent(event, element);
			});
		}
	
		element.setAttribute(`draggable`, true);
	}

	setNodeProperties() {
		const rect  = this.element.getBoundingClientRect();
		const node  = __Global__.temp_node;
		const x     = __Global__.temp_drop.clientX - rect.left;
		const y     = __Global__.temp_drop.clientY - rect.top;

		node.element.style.cssText = null;
		node.graph                 = this;

		node.x = x;
		node.y = y;
	}

	register(data) {
		Object.assign(this.types, data);
	}
}

class __Node__ {
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

class Graph extends __Graph__ {}
class Node extends __Node__ {}

function FreeForm() {
	class FreeForm_Graph extends __Graph__ {
		get element() {
			return this._element;
		}
	
		set element(value) {
			value.classList.add(`__graph__`);
	
			this._element = value;
		}
	}

	class FreeForm_Node extends __Node__ {
		get x() {
			return this._x;
		}
	
		set x(value) {
			const offset_x = this.offset_x || 0;
	
			this._x = value + this.width / 2;
	
			this.element.style.left = value ? `${value - offset_x}px` : null;
		}

		get y() {
			return this._y;
		}
	
		set y(value) {
			const offset_y = this.offset_y || 0;
	
			this._y = value;
	
			this.element.style.top  = value ? `${value - offset_y}px` : null;
		}
	}

	Reflect.setPrototypeOf(Graph.prototype, FreeForm_Graph.prototype);
	Reflect.setPrototypeOf(Node.prototype, FreeForm_Node.prototype);
}

function Snap() {
	class Snap_Graph extends __Graph__ {
		get element() {
			return this._element;
		}
	
		set element(value) {
			value.classList.add(`__grid__`);
	
			super.element = value;
		}

		get canvas() {
			return this._canvas;
		}
	
		set canvas(value) {
			value.classList.add(`__canvas__`);
	
			value.width  = value.clientWidth;
			value.height = value.clientHeight;
	
			this._canvas = value;
		}

		get snap() {
			return this._snap;
		}
	
		set snap(value) {
			const method = value ? `add` : `remove`;
	
			this._snap = value;
	
			this.element.classList[method](`__grid__`);
		}

		get grid_size() {
			return this._grid_size;
		}
	
		set grid_size(value) {
			this._grid_size = value;
			this.gridLines(value);
		}

		gridLines(size) {
			const element = this.element;
			const canvas  = this.canvas;
			const context = canvas.getContext(`2d`);
			const width   = canvas.clientWidth;
			const height  = canvas.clientHeight;
	
			const columns = Math.round(element.clientWidth / size);
			const rows    = Math.round(element.clientHeight / size);
	
			context.strokeStyle = `rgba(105, 105, 105, 0.2)`;
			context.fillStyle   = `rgba(105, 105, 105, 0.2)`;
	
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

		draw(node) {
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

		link() {
			const self      = this;
			const from_node = self.temp_link_nodes.shift();
			const to_node   = self.temp_link_nodes.shift();
	
			from_node.child_nodes.add(to_node);
			to_node.parent_nodes.add(from_node);

			self.draw(from_node);
		}

		setNodeProperties() {
			__Global__.temp_node.grid_size = this.grid_size;
			__Graph__.prototype.setNodeProperties.call(this);
		}
	}

	class Snap_Node extends __Node__ {
		get x() {
			return this._x;
		}
	
		set x(value) {
			this._x = value;
	
			const grid_size = this.grid_size;
			const element   = this.element;
			const coord_x   = this.coord_x;
			const offset_x  = this.offset_x;
	
			this._x = grid_size * (coord_x - 1) - offset_x;
	
			element.style.left            = `${-offset_x}px`;
			element.style.gridColumnStart = coord_x;
		}

		get y() {
			return this._y;
		}

		set y(value) {
			this._y = value;

			const grid_size = this.grid_size;
			const element   = this.element;
			const coord_y   = this.coord_y;
			const offset_y  = this.offset_y;

			this._y = grid_size * (coord_y - 1) - offset_y;
	
			element.style.top          = `${-offset_y}px`;
			element.style.gridRowStart = coord_y;
		}

		get coord_x() {
			const x         = this.x;
			const grid_size = this.grid_size;
	
			return Math.round(x / grid_size) + 1;
		}

		get coord_y() {
			const y         = this.y;
			const grid_size = this.grid_size;
	
			return Math.round(y / grid_size) + 1;
		}
	}

	Reflect.setPrototypeOf(Graph.prototype, Snap_Graph.prototype);
	Reflect.setPrototypeOf(Node.prototype, Snap_Node.prototype);
}

window.addEventListener(`DOMContentLoaded`, (event) => {
	document.addEventListener(`__node_init__`, (event) => {
		const detail   = event.detail || {};
		const element  = event.target;
		const internal = document.createElement(`div`);
		
		element.addEventListener(`dragstart`, (event) => {
			const node = detail.init.call(element) || (new Node(internal));
			
			__Global__.temp_drag = event;
			__Global__.temp_node = node;
		});

		element.setAttribute(`draggable`, true);
	});
});