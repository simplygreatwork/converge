
export function make_graph(agent, clock = 0, nodes = new Map(), childrens = new Map(), changes = []) {
	
	const graph = {}
	return Object.assign(graph, { init, add, diff, merge, flatten }).init()
	
	function init() {
		
		nodes.set('root', { id: 'root', op: { type: null }, parents: [] })
		graph.nodes = () => nodes
		graph.clock = () => clock
		update(childrens, changes)
		return graph
	}
	
	function add(op) {
		
		op = op || { type: null }
		const id = [agent, clock++]
		const event = { id, op, parents: find_leaves() }
		nodes.set(id, event)
		update(childrens, [event.id])
		return event
	}
	
	function update(childrens, changes) {
		
		changes.forEach(id => {
			nodes.get(id).parents.forEach(parent => {
				if (childrens.get(parent) === undefined) childrens.set(parent, [])
				childrens.get(parent).push(id)
				childrens.get(parent).sort(comparator)
			})
		})
	}
	
	function find_leaves() {
		
		const leaves = new Set([...nodes.keys()])
		nodes.values().forEach(node => node.parents.forEach(parent => leaves.delete(parent)))
		return Array.from(leaves)
	}
	
	function find_leaves_alternative() {
		
		const a = new Set([...nodes.keys()])
		const b = new Set([...childrens.keys()])
		return Array.from(a.difference(b))
	}
	
	function diff(other) {
		
		const a = new Set(nodes.keys())
		const b = new Set(other.nodes().keys())
		return Array.from(b.difference(a)).sort(comparator)
	}
	
	function comparator(a, b) {
		
		const [agent_a, clock_a] = a
		const [agent_b, clock_b] = b
		if (clock_a === clock_b) return agent_a < agent_b ? -1 : 1
		return clock_a - clock_b
	}
	
	function merge(other) {
		
		const nodes_ = new Map([...nodes])
		const childrens_ = new Map([...childrens])
		const clock_ = Math.max(clock, other.clock()) + 1
		const diffs = diff(other)
		diffs.forEach(key => nodes_.set(key, other.nodes().get(key)))
		return make_graph(agent, clock_, nodes_, childrens_, diffs)
	}
	
	function flatten(node = 'root') {
		
		const get_children = node => childrens.get(node) || []
		const events = new Set(), did_visit = new Set(), will_visit = [nodes.get(node)]
		for (const node of will_visit) {
			events.add(node)
			if (did_visit.has(node)) continue
			did_visit.add(node)
			for (const child of get_children(node.id)) {
				sequence(child)
				will_visit.push(nodes.get(child))
			}
		}
		events.delete(nodes.get('root'))
		return Array.from(events)
		
		function sequence(child) {
			
			events.add(nodes.get(child))
			let children = get_children(child)
			while (children.length === 1 && nodes.get(children[0]).parents.length === 1) {
				child = nodes.get(children[0])
				children = get_children(child.id)
				events.add(child)
			}			
		}
		
		function resolve_children() {
			
			const map = new Map()
			nodes.keys().forEach(key => map.set(key, []))
			nodes.values().forEach(node => node.parents.forEach(parent => map.get(parent).push(node.id)))
			map.keys().forEach(key => map.get(key).sort(comparator))
			return map
		}
	}
}

export function make_walker(graph, news = []) {
	
	let i
	let events
	const walker = {}
	return Object.assign(walker, { init, undo, redo }).init()
	
	function init() {
		
		events = graph.flatten()
		return walker
	}
	
	function undo(fn) {
		
		let counter = 0
		for (i = events.length - 1; i >= 0; i--) {
			const event = events[i]
			const new_ = news.includes(event.id)
			if (new_) counter++
			if (! new_) fn(event, i, new_)
			if (counter === news.length) return i
		}
	}
	
	function redo(fn) {
		
		for (; i < events.length; i++) {
			const event = events[i]
			const new_ = news.includes(event.id)
			fn(event, i, new_)
		}
	}
}
