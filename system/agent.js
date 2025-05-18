
import { make_bus } from 'bus'
import { make_order } from 'order'

export function make_agent(name, interleave = true) {
	
	const verbose = false
	let agents = ['a', 'b', 'c', 'd']		// todo: have all agents announce/introduce themselves
	let clock = 0
	let clock_system = null
	let network
	const local = make_bus()
	const events = new Map()
	const order = make_order(events)
	const outbox = make_outbox()
	const inbox = make_inbox()
	const agent = {}
	return Object.assign(agent, { init, add, promote, list, connect, disconnect, to_string, on }).init()
	
	function init() {
		
		events.set('root', { id: 'root', op: { type: null } })
		agent.name = () => name
		agent.events = () => events
		agent.order = () => order
		agent.connected = () => network !== null
		return agent
	}
	
	function add(op, grouped) {
		
		op = op || { type: null }
		const id = [name, clock++]
		const event = { id, op }
		if (grouped) event.grouped = grouped
		events.set(id, event)
		outbox.push('event', event, 'high')
		order.add(id)
		return event
	}
	
	function promote() {
		
		if (interleave) return
		if (clock_system === null) clock_system = clock 		
		// if (clock_system !== null) return
		clock = Math.max(clock, clock_system) + 1
		clock_system = null
	}
	
	function connect(bus) {
		
		network = bus
		local.emit('connected')
		return agent
	}
	
	async function disconnect() {
		
		const result = network
		return new Promise(resolve => {
			outbox.flush()
			network = null
			local.emit('disconnected')
			inbox.off()
			setTimeout(() => resolve(result), 100)
		})
	}
	
	function list() {
		console.log(`  ${to_string()}`)
	}
	
	function to_string() {
		return `agent "${name}": ${order.to_string()}`
	}
	
	function on() {
		local.on(...arguments)
	}
	
	function make_outbox() {
		
		let timeout
		const high = []
		const low = []
		const outbox = {}
		return Object.assign(outbox, { init, push, flush }).init()
		
		function init() {
			
			local.on('connected', () => {
				console.log(`  "${name}" has connected`)
				push('connected', name, 'high')
				request_updates()
				run()
			})
			return outbox
		}
		
		function request_updates() {
			
			agents.forEach(agent => {
				if (agent === name) return
				push('events-request', { to: name, given: order.extract(agent) }, 'high')
			})
		}
		
		function run() {
			
			const emit = ({ key, value }) => network && network.emit(key, value, clock)
			if (high[0]) emit(high.shift())
			if (low[0]) emit(low.shift())
			if (network) timeout = setTimeout(() => run(), 10)
		}
		
		function push(key, value, priority = 'high') {
			
			if (priority === 'high') high.push({ key, value })
			else if (priority === 'low') low.push({ key, value })
		}
		
		function flush() {
			
			clearTimeout(timeout)
			const emit = ({ key, value }) => network && network.emit(key, value, clock)
			while (high[0] || low[0]) {
				if (high[0]) emit(high.shift())
				if (low[0]) emit(low.shift())
			}
		}
	}
	
	function make_inbox() {
		
		const offs = []
		const inbox = {}
		return Object.assign(inbox, { init, off }).init()
		
		function init() {
			
			local.on('connected', () => {
				const on = network.on
				network.on = (...arguments_) => offs.push(on(...arguments_))
				network.on('connected', name_ => {
					console.log(`  "${name}" observes "${name_}" has connected.`)
				})
				network.on('event', (event, clock_system_) => {
					const id = event.id
					events.set(id, event)
					order.add(id)
					if (interleave === false) clock_system = clock_system_
					else clock = Math.max(clock, clock_system_) + 1
					if (event.id[0] !== name) local.emit('merge', [event])
				})
				network.on('events-request', ({ to, given }) => {
					const from = name
					if (to == from) return
					const ids = []
					order.diff({ from, to, given }, id => {
						ids.push(id)
						outbox.push('event', events.get(id), 'low')
					})
					if (verbose && ids.length > 0) console.log(`    updated from "${name}" to "${to}": ${ids}`)
				})
			})
			return inbox
		}
		
		function off() {
			offs.forEach(off => off())
		}
	}
}

export function make_walker(agent, news = []) {
	
	const events = []
	const walker = {}
	return Object.assign(walker, { undo, redo })
	
	function undo(fn) {
		
		let counter = 0
		agent.order().rewind((id, index, stop) => {
			const event = agent.events().get(id)
			events.unshift(event)
			const new_ = news.includes(event.id)
			if (new_) counter++
			if (! new_) fn(event, index, new_)
			if (counter === news.length) stop()
		})
	}
	
	function redo(fn) {
		
		events.forEach((event, i) => {
			const new_ = news.includes(event.id)
			fn(event, i, new_)
		})
	}
}
