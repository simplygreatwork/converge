
import { make_bus } from 'bus'
import { make_order } from 'order'

export function make_agent(name) {
	
	const verbose = false
	let agents = ['a', 'b', 'c', 'd']		// todo: have everyone announce themeselves
	let clock = 0
	let network
	const local = make_bus()
	const events = new Map()
	const order = make_order(events)
	const outbox = make_outbox()
	const inbox = make_inbox()
	const agent = {}
	return Object.assign(agent, { init, on, add, list, to_string, connect, disconnect }).init()
	
	function init() {
		
		events.set('root', { id: 'root', op: { type: null } })
		agent.name = () => name
		agent.events = () => events
		agent.order = () => order
		return agent
	}
	
	function on() {
		local.on(...arguments)
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
	
	function list() {
		console.log(`  ${to_string()}`)
	}
	
	function to_string() {
		return `agent "${name}": ${order.to_string()}`
	}
	
	function connect(bus) {
		
		network = bus
		local.emit('connected')
		return agent
	}
	
	async function disconnect() {
		
		return new Promise(resolve => {
			outbox.flush()
			network = null
			local.emit('disconnected')
			inbox.off()
			setTimeout(() => resolve(), 100)
		})
	}
	
	function make_outbox() {
		
		let timeout
		const high = []
		const low = []
		const outbox = {}
		return Object.assign(outbox, { init, push, flush }).init()
		
		function init() {
			
			local.on('connected', () => {
				console.log(`"${name}" has connected`)
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
				offs[0] = network.on('connected', name_ => {
					console.log(`"${name}" observes "${name_}" has connected.`)
				})
				offs[1] = network.on('event', (event, clock_) => {
					const id = event.id
					events.set(id, event)
					order.add(id)
					clock = Math.max(clock, clock_) + 1
					if (event.id[0] !== name) local.emit('merge', [event])
				})
				offs[2] = network.on('events-request', ({ to, given }) => {
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
			off.forEach(off => off())
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
