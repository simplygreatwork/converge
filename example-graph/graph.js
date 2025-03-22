
export function make_graph(agent, clock = 0, nodes = new Map(), childrens = new Map(), changes = []) {
	
	const graph = {}
	return Object.assign(graph, { init, add, diff, merge, order, flatten: order }).init()
	
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
	
	function order(node = 'root') {
		
		const result = []
		if (false) childrens = resolve_children()
		const children = node => childrens.get(node) || []
		const visited = new Set()
		visit(node)
		let i = 0
		while (node = next(node)) {
			visit(node)
			i++
			if (i === nodes.size - 1) break 
		}
		return result
		
		function visit(node) {
			
			if (! visited.has(node) && node !== 'root') result.push(nodes.get(node))
			visited.add(node)			
		}
		
		function resolve_children() {
			
			const map = new Map()
			nodes.keys().forEach(key => map.set(key, []))
			nodes.values().forEach(node => node.parents.forEach(parent => map.get(parent).push(node.id)))
			map.keys().forEach(key => map.get(key).sort(comparator))
			return map
		}
		
		function next(node) {
			
			if (is_empty_root(node)) return false
			if (is_diverging(node)) return is_diverging(node)
			if (is_sequential(node)) return is_sequential(node)
			if (is_branch_end(node)) {
				let branch = next_branch(node)
				if (branch) return branch
				else return converge(node)
			}
			
			function is_empty_root(node) {
				
				if (node == 'root' && children(node).length === 0) return true
				return false
			}
			
			function is_diverging(node) {
				
				if (children(node).length <= 1) return false
				return children(node)[0]
			}
			
			function is_sequential(node) {
				
				if (children(node).length !== 1) return false
				if (nodes.get(children(node)[0]).parents.length !== 1) return false
				return children(node)[0]
			}
			
			function is_branch_end(node) {
				
				if (children(node).length === 0) return true
				if (is_converging(node)) return true
				return false
			}
			
			function is_converging(node) {
				
				if (children(node).length !== 1) return false
				if (nodes.get(children(node)[0]).parents.length <= 1) return false
				return true
			}
			
			function converge(node) {
				
				return children(node)[0]
			}
			
			function next_branch(node) {
				
				let last = node
				while (! is_diverging(node)) {
					last = node
					node = nodes.get(node).parents[0]
				}
				const index = children(node).indexOf(last)
				if (index + 1 < children(node).length) return children(node)[index + 1]
				else return null
			}
		}
	}
}

export function make_walker(graph, news = []) {
	
	let i
	let events
	const walker = {}
	return Object.assign(walker, { init, undo, redo }).init()
	
	function init() {
		
		if (false && news.length > 0) console.log(`news[0]: ${news[0]}`)
		if (news.length > 0 && news[0]) {
			try {
				events = graph.order(news[0])						// can be defective
			} catch (error) {
				console.log(`  Error: ${error}`)
				events = graph.order()
			}
		} else events = graph.order()
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
