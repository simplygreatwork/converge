
const verbose = false
const log = console.log

export function make_order(events) {
	
	const queue = {}
	const array = []
	const order = {}
	return Object.assign(order, { add, extract, diff, rewind, flatten, to_string })
	
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
	
	function extract(agent, extent) {
		
		return array
		.slice(extent)
		.map(ids => ids.filter(id => id[0] === agent))
		.map((each, index) => each.length === 1 ? each[0][1] : -1)
		.filter(each => each > -1)
	}
	
	function diff(agent, extent, given, fn) {
		
		if (verbose) log(`diff ids of agent "${agent}" beginning with extent "${extent}" excluding given: "${given}".`)
		for (let clock = extent + 1; clock < array.length; clock++) {
			if (given.includes(clock)) continue
			if (array[clock] === undefined) array[clock] = []
			const ids = array[clock]
			ids.sort(comparator)
			ids.forEach(id => {
				if (id[0] === agent) fn(id)
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
			ids.sort(comparator)								// issue: ought to be able to presort when adding the id
			ids.reverse().forEach(id => {
				if (is_sequential(id)) queue_sequence(id)
				else if (flush_sequence(id, id => fn(id, index++, stop))) ;
				else fn(id, index++, stop)
			})
		}
		
		function is_sequential(id) {
			
			let result = false
			const [agent, clock] = id
			const ids = array[clock - 1]
			if (ids) ids.forEach(id => {
				if (id[0] === agent) result = true
			})
			return result
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
