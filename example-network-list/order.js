
export function make_order(events = () => {}) {
	
	const verbose = false
	const order = {}
	const queue = {}
	const array = []
	return Object.assign(order, { init, add, extract, diff, rewind, flatten, to_string }).init()
	
	function init() {
		return order
	}
	
	function add(id) {
		
		const [agent, clock] = id
		if (array[clock] === undefined) array[clock] = []
		const ids = array[clock]
		if (ids === undefined) return
		if (ids.includes(id)) return
		ids.push(id)
		ids.sort(comparator)
	}
	
	function comparator(a, b) {
		
		const [agent_a, clock_a] = a
		const [agent_b, clock_b] = b
		if (clock_a === clock_b) return agent_a < agent_b ? -1 : 1
		return clock_a - clock_b
	}
	
	function extract(agent) {
		
		return array
		.map(ids => ids.filter(id => id[0] === agent))
		.map((each, index) => each.length === 1 ? index : -1)
		.filter(each => each > -1)
	}
	
	function diff({ from, to, given }, fn) {
		
		if (verbose) console.log(`walk from "${from}" to "${to}" excluding ${exclude}`)
		for (let clock = 0; clock < array.length; clock++) {
			if (given.includes(clock)) continue
			if (array[clock] === undefined) array[clock] = []
			const ids = array[clock]
			ids.sort(comparator)
			ids.forEach(id => {
				if (id[0] === from) fn(id)
			})
		}
	}
	
	function rewind(fn) {
		
		let index = 0
		let stopped = false
		const stop = () => stopped = true
		for (let clock = array.length - 1; clock >= 0; clock--) {
			if (stopped) break
			const ids = array[clock]
			if (ids === undefined) continue
			if (ids === null) continue
			ids.sort(comparator)
			ids.reverse().forEach(id => {
				if (is_sequential(id)) queue_sequence(id)
				else if (flush_sequence(id, id => fn(id, index++, stop))) ;
				else fn(id, index++, stop)
			})
		}
		
		function is_sequential(id) {
			
			let next_id = look_ahead(id)
			if (! next_id) return false
			const event = events(next_id)
			if (event.grouped) return false
			return true
			
			function look_ahead(id) {
				
				let result = null
				const start = id[1] - 1
				if (start >= array.length) return null
				for (let clock = start; clock >= 0; clock--) {
					const ids = array[clock]
					if (ids === undefined) continue
					if (ids === null) continue
					ids.sort(comparator)
					ids.reverse().forEach(id_ => {
						if (id_[0] === id[0]) result = id_
					})
				}
				return result
			}
		}
		
		function queue_sequence(id) {
			
			const agent = id[0]
			if (! queue[agent]) queue[agent] = new Set()
			queue[agent].add(id)
		}
		
		function flush_sequence(id, fn) {
			
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
	
	function flatten(events) {
		
		const result = []
		order.rewind((id, index, stop) => {
			const event = events.get(id)
			result.unshift(event)
		})
		return result
	}
	
	function to_string() {
		return JSON.stringify(array.filter(each => each).filter(each => each.length > 0))
	}
}
