
import { make_graph } from 'graph'
import { make_walker } from 'graph'

export function make_list(name) {
	
	let graph
	let content
	const ops = {}
	const list = {}
	return Object.assign(list, { init, insert, remove, to_string, length, to_array, merge }).init()
	
	function init() {
		
		list.name = () => name
		list.graph = () => graph
		graph = make_graph(name)
		content = new Map()
		content.set('root', make_node('root', ``))
		return list
	}
	
	function insert(value, parent) {
		return write({ type: 'insert', value, parent })
	}
	
	function remove(id) {
		return write({ type: 'remove', remove: id })
	}
	
	function write(op) {
		
		const event = graph.add(make_op(op))
		event.op.redo(content, event.id)
		return event.id
	}
	
	function merge(other) {
		
		const diffs = graph.diff(other.graph())
		graph = graph.merge(other.graph())
		const walker = make_walker(graph, diffs)
		walker.undo(event => event.op.undo(content, event.id))
		walker.redo(event => event.op.redo(content, event.id))
	}
	
	function visit(node, fn, level = 0, parent = null) {
		
		content.get(node).children.forEach(child => {
			visit(child, fn, level + 1, node)
		})
		fn(node, parent, level)
	}
	
	function iterate(fn) {
		
		visit('root', (child, parent, level) => {
			if (level === 0) return
			if (content.get(child).active === false) return 
			fn(content.get(child).value)
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
		iterate(value => array.push(value))
		return array
	}
	
	function make_node(id, value) {
		return { id, value, children: [] }
	}
	
	function make_op(op_) {
		
		const op = {}
		return Object.assign(op, { init, undo, redo }).init()
		
		function init() {
			
			make_ops()
			return Object.assign(op, op_)
		}
		
		function redo(content, id) {
			ops[`${op.type}:redo`](content, id, op)
		}
		
		function undo(content, id) {
			ops[`${op.type}:undo`](content, id, op)
		}
	}
	
	function make_ops() {
		
		ops['insert:undo'] = (content, id, op) => content.get(op.parent).children.pop()
		ops['remove:undo'] = (content, id, op) => delete content.get(op.remove).active
		ops['insert:redo'] = (content, id, op) => { content.set(id, make_node(id, op.value)); content.get(op.parent).children.push(id) }
		ops['remove:redo'] = (content, id, op) => content.get(op.remove).active = false		
	}
}
