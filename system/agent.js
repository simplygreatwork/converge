
import { make_bus } from 'bus'
import { make_order } from 'order'

const verbose = false
const log = message => console.log(message)

export function make_agent(name, interleave = true) {
	
	let clock = 0
	let clock_system = null
	let network
	const local = make_bus()
	const agents = new Set()
	const events = new Map()
	const order = make_order(events)
	const extents = {}
	const outbox = make_outbox()
	const inbox = make_inbox()
	const agent = {}
	return Object.assign(agent, { init, add, promote, list, connect, disconnect, to_string, on }).init()
	
	function init() {
		
		events.set('root', { id: 'root', op: { type: null } })
		agent.name = () => name
		agent.events = () => events
		agent.order = () => order
		agent.agents = () => agents
		agents.add(name)
		watch()
		return agent
	}
	
	function add(op) {
		
		op = op || { type: null }
		const id = [name, clock++]
		if (verbose) log(`adding operation ${JSON.stringify(op)} with event id: ${id}`)
		const event = { id, op }
		events.set(id, event)
		order.add(id)
		outbox.push('event', { event })
		return event
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
			inbox.off()
			network = null
			local.emit('disconnected')
			setTimeout(() => resolve(result), 100)
		})
	}
	
	function list() {
		log(`  ${to_string()}`)
	}
	
	function to_string() {
		return order.to_string()
	}
	
	function on() {
		local.on(...arguments)
	}
	
	function promote() {
		
		if (interleave) return
		if (clock_system === null) clock_system = clock
		// if (clock_system !== null) return
		clock = Math.max(clock, clock_system) + 1
		clock_system = null
	}
	
	function make_outbox() {
		
		let timeout
		const high = []
		const low = []
		const outbox = {}
		return Object.assign(outbox, { init, push, push_later, flush }).init()
		
		function init() {
			
			local.on('connected', () => {
				if (verbose) log(`  "Agent ${name}" has connected with queue high "${JSON.stringify(high)}" and queue low "${JSON.stringify(low)}"`)
				push('connected', { name })
				request_members()
				request_events()
				run()
			})
			return outbox
		}
		
		function request_members() {
			network.emit('members-request')
		}
		
		function request_events() {
			
			Array.from(agents).forEach(agent => {
				if (agent === name) return
				const to = name
				const extent = extents[agent] || 0
				const given = order.extract(agent, extent)
				push('events-request', { to, extent, given })
			})
		}
		
		function run() {
			
			if (high[0]) emit(high.shift())
			else if (low[0]) emit(low.shift())
			if (network) timeout = setTimeout(() => run(), 10)
		}
		
		function push(key, value) {
			high.push({ key, value })
		}
		
		function push_later(key, value) {
			low.push({ key, value })
		}
		
		function emit({ key, value }) {
			
			if (! network) return
			value.clock = clock
			network.emit(key, value)
			local.emit(`${key}-sent`, value)
		}
		
		function flush() {
			
			clearTimeout(timeout)
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
				off()
				const on = (key, fn) => offs[offs.length] = network.on(key, fn)
				on('connected', connected)
				on('event', event)
				on('events-request', events_request)
				on('members', members)
				on('members-request', members_request)
			})
			
			return inbox
		}
		
		function off() {
			
			offs.forEach(off => off())
			offs.splice(0, offs.length)
		}
		
		function connected(value) {
			log(`  "${name}" observes "${value.name}" has connected.`)
		}
		
		function event({ event, requested, clock: clock_ }) {
			
			const { id } = event
			events.set(id, event)
			order.add(id)
			agents.add(id[0])
			extents[id[0]] = extents[id[0]] || 0
			extents[id[0]] = Math.max(extents[id[0]], id[1]) + 1
			if (interleave === false) clock_system = clock_
			// else, below, breaks data exchange after reconnects
			// else clock = Math.max(clock, clock_system_) + 1
			clock = Math.max(clock, clock_) + 1
			if (id[0] !== name) local.emit('merge', [event])
		}
		
		function events_request({ to, extent, given }) {
			
			const from = name
			if (to == from) return
			const ids = []
			order.diff(from, extent, given, id => {
				ids.push(id)
				const event = events.get(id)
				const requested = true
				outbox.push_later('event', { event, requested })
			})
		}
		
		function members(members) {
			local.emit(`members-received`)
		}
		
		function members_request(members) {
			local.emit(`members-request-received`)
		}
	}
	
	function watch() {
		
		const trace = window.trace || (() => {})
		local.on('event-sent', ({ event, requested }) => {
			if (requested) trace(`agent "${name}" emitted event ${JSON.stringify(event)} (per request)`)
			else trace(`agent "${name}" emitted event ${JSON.stringify(event)}`)
		})
		local.on('events-request-sent', ({ to, extent, given }) => trace(`agent "${name}" emitted events-request ${JSON.stringify({ to, extent, given })}`))
		if (false) local.on('members-request-received', members => trace(`members request received`))
		if (false) local.on('members-received', members => trace(`members received`))
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
