
import { make_agent } from 'agent'
import { make_walker } from 'agent'

export function make_map(agent, emit = () => {}) {
	
	let content
	const ops = {}
	const map = {}
	return Object.assign(map, { init, set, remove, merge, to_string, length, to_map }).init()
	
	function init() {
		
		content = make_stack_map()
		define_ops()
		agent.on('merge', diffs => {
			const walker = make_walker(agent, diffs)
			walker.undo(event => apply(event, 'undo', () => {}))
			walker.redo(event => apply(event, 'redo', () => {}))
			emit('change', { type: 'merge', diffs, map })
		})
		map.name = () => agent.name()
		map.promote = () => agent.promote()
		return map
	}
	
	function define_ops() {
		
		ops[['set', 'redo']] = (content, { op }) => content.push(op.key, op.value)
		ops[['set', 'undo']] = (content, { op }) => content.pop(op.key)
		ops[['remove', 'redo']] = (content, { op }) => content.push(op.remove, undefined)
		ops[['remove', 'undo']] = (content, { op }) => {}
	}
	
	function set(key, value) {
		
		const event = agent.add({ type: 'set', key, value })
		return apply(event, 'redo', () => emit('set', { value, map }))
	}
	
	function remove(key) {
		
		const event = agent.add({ type: 'remove', remove: key })
		return apply(event, 'redo', () => emit('remove', { key, map }))
	}
	
	function apply(event, method, then) {
		
		const type = event.op.type
		const op = ops[[type, method]]
		op(content, event)
		if (then) then()
		return event.id
	}
	
	function merge(other) {
		
		const diffs = graph.diff(other.graph())
		graph = graph.merge(other.graph())
		const walker = make_walker(graph, diffs)
		walker.undo(event => apply(event, 'undo', () => {}))
		walker.redo(event => apply(event, 'redo', () => {}))
	}
	
	function to_map() {
		return content.to_map()
	}
	
	function to_string() {
		return Array.from(to_map()).toString()
	}
	
	function make_stack_map() {
		
		const map = new Map()
		const stack_map = {}
		return Object.assign(stack_map, { push, pop, peek, to_map })
		
		function push(key, value) {
			return ready(key) ? map.get(key).push(value) : map.set(key, [value])
		}
		
		function pop(key) {
			return ready(key) ? map.get(key).pop() : null
		}
		
		function peek(key) {
			return ready(key) ? map.get(key).at(-1) : null
		}
		
		function ready(key) {
			return map.get(key) && map.get(key).length > 0
		}
		
		function to_map() {
			
			const result = new Map()
			map.keys().forEach(key => {
				const value = peek(key)
				if (value === undefined) result.delete(key)
				else result.set(key, value)
			})
			return result
		}
	}
}
