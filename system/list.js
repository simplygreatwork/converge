
import { make_agent } from 'agent'
import { make_walker } from 'agent'

export function make_list(agent, emit = () => {}) {
	
	let content
	const ops = {}
	const list = {}
	return Object.assign(list, { init, insert, remove, to_string, length, to_array, node_at, char_at }).init()
	
	function init() {
		
		content = new Map()
		content.set('root', make_node('root'))
		define_ops()
		agent.on('merge', diffs => {
			const walker = make_walker(agent, diffs)
			walker.undo(event => apply(event, 'undo', () => {}))
			walker.redo(event => apply(event, 'redo', () => {}))
			emit('change', { type: 'merge', diffs, list })
		})
		list.name = () => agent.name()
		list.agent = () => agent
		list.promote = () => agent.promote()
		return list
	}
	
	function define_ops() {
		
		ops[['insert', 'redo']] = (content, { op, id }) => { content.set(id, make_node(id, op.value)); content.get(op.parent).children.push(id) }
		ops[['insert', 'undo']] = (content, { op }) => content.get(op.parent).children.pop()
		ops[['remove', 'redo']] = (content, { op }) => content.get(op.remove).active = false
		ops[['remove', 'undo']] = (content, { op }) => delete content.get(op.remove).active
	}
	
	function insert(value, parent = 'root', grouped) {
		
		const event = agent.add({ type: 'insert', value, parent }, grouped)
		return apply(event, 'redo', () => emit('change', { type: 'insert', value, parent, list }))
	}
	
	function remove(id) {
		
		const event = agent.add({ type: 'remove', remove: id })
		return apply(event, 'redo', () => emit('change', { type: 'remove', remove: id, list }))
	}
	
	function apply(event, method, then) {
		
		const type = event.op.type
		const op = ops[[type, method]]
		op(content, event)
		if (then) then()
		return event.id
	}
	
	function visit(node, fn, level = 0, parent = null) {
		
		content.get(node).children.forEach(child => {
			visit(child, fn, level + 1, node)
		})
		fn(node, parent, level)
	}
	
	function iterate(fn) {
		
		let index = 0
		visit('root', (child, parent, level) => {
			if (level === 0) return
			if (content.get(child).active === false) return
			index++
			fn(content.get(child), index)
		})
	}
	
	function to_string(separator = '') {
		return to_array().join(separator)
	}
	
	function length() {
		return to_array().length
	}
	
	function to_array() {
		
		const array = []
		iterate(node => array.push(node.value))
		return array
	}
	
	function node_at(index) {
		
		let result = null
		iterate((node, index_) => {
			if (index_ - 1 === index) result = node
		})
		return result
	}
	
	function char_at(index) {
		return node_at(index).value
	}
	
	function make_node(id, value = '') {
		return { id, value, children: [] }
	}
}
