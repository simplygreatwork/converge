
export function make_graph(agent, clock = 0, nodes = new Map(), childrens = new Map(), changes = [], order = []) {
	
	const queue = {}
	const graph = {}
	return Object.assign(graph, { init, add, diff, merge, flatten }).init()
	
	function init() {
		
		nodes.set('root', { id: 'root', op: { type: null }, parents: [] })
		graph.nodes = () => nodes
		graph.clock = () => clock
		update_order(changes)
		return graph
	}
	
	function add(op) {
		
		op = op || { type: null }
		const id = [agent, clock++]
		const event = { id, op, parents: find_leaves() }
		nodes.set(id, event)
		update_order([event.id])
		return event
	}
	
	function update_order(changes) {
		
		changes.forEach(id => {
			const [agent, clock] = id
			if (! order[clock]) order[clock] = []
			order[clock].push(id)
			order[clock].sort(comparator)
		})
	}
	
	function find_leaves() {
		
		const leaves = new Set([...nodes.keys()])
		nodes.values().forEach(node => node.parents.forEach(parent => leaves.delete(parent)))
		return Array.from(leaves).sort(comparator)
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
		return make_graph(agent, clock_, nodes_, childrens_, diffs, order)
	}
	
	function flatten(fn) {
		
		const order = prepare_order()
		let terminate = false
		const terminate_fn = () => terminate = true
		for (let clock = order.length - 1; clock >= 0; clock--) {
			if (terminate) break
			const ids = order[clock]
			if (ids) ids.reverse().forEach(id => {
				if (is_sequential(id)) enqueue(id)
				else if (flush_queue(id, id => fn(id, terminate_fn))) ;
				else fn(id, terminate_fn)
			})
		}
		
 		function prepare_order() {
 			
 			const order = []
 			nodes.keys().forEach(id => {
 				const [agent, clock] = id
 				if (! order[clock]) order[clock] = []
 				order[clock].push(id)
 				order[clock].sort(comparator)
 			})
 			return order
 		}
		
		function is_sequential(id) {
			
			let result = false
			const [agent, clock] = id
			const ids = order[clock - 1]
			if (ids) ids.forEach(id => {
				if (id[0] === agent) result = true
			})
			return result
		}
		
		function enqueue(id) {
			
			const agent = id[0]
			if (! queue[agent]) queue[agent] = new Set()
			queue[agent].add(id)
		}
		
		function flush_queue(id, fn) {
			
			const agent = id[0]
			if (queue[agent] && queue[agent].size > 0) {
				queue[agent].forEach(fn)
				fn(id)
				queue[agent].clear()
				return true
			}
			return false
		}
	}
}

export function make_walker(graph, news = []) {
	
	const events = []
	const walker = {}
	return Object.assign(walker, { undo, redo })
	
	function undo(fn) {
		
		let i = 0
		let counter = 0
		graph.flatten((id, terminate) => {
			const event = graph.nodes().get(id)
			events.unshift(event)
			const new_ = news.includes(event.id)
			if (new_) counter++
			if (! new_) fn(event, i++, new_)
			if (counter === news.length) terminate()
		})
	}
	
	function redo(fn) {
		
		events.forEach((event, i) => {
			const new_ = news.includes(event.id)
			fn(event, i, new_)
		})
	}
}
