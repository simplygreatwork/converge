
export const make_history = () => {
	
	let edits = [], index = -1, then, promoted
	const history = {}
	return Object.assign(history, { undo, redo, attach })
	
	function undo() {
		
		can_undo(edit => {
			edit.undo()
			if (index >= 0) index--
		})
	}
	
	function redo() {
		
		if (index < edits.length - 1) index++
		can_redo(edit => {
			edit.redo()
		})
	}
	
	function can_undo(fn) {
		
		if (index < 0 || index >= edits.length) return
		fn(edits[index])
		changed()
	}
	
	function can_redo(fn) {
		
		if (index < 0 || index >= edits.length) return
		if (! edits[index].redo) return
		fn(edits[index])
		changed()
	}
	
	function changed() {
		
		promoted = null
		if (history.on_change) history.on_change(edits, index)
	}
	
	function attach(textarea) {
		
		let keydown = false, input = false
		textarea.selectionStart = 0
		textarea.selectionEnd = 0
		promoted = capture(textarea)
		listen()
		
		function listen() {
			
			textarea.addEventListener('keydown', event => keydown = true)
			textarea.addEventListener('input', event => input = true)
			textarea.addEventListener('focus', focused)
			textarea.addEventListener('mousedown', event => {
				promoted = capture(textarea)
			})
			textarea.addEventListener('selectionchange', () => {
				then = capture(textarea)
				if (keydown && ! input) promoted = capture(textarea)
				keydown = input = false
			})
			textarea.addEventListener('input', event => {
				truncate()
				promote()
				edits[index].now = capture(textarea)
				changed()
			})
		}
		
		function truncate() {
			
			if (! (index < edits.length - 1)) return
			edits = edits.slice(0, index + 1)
			advance(then)
		}
		
		function promote() {
			
			if (! promoted) return
			if (! (edits.length === 0 || edits.at(index).now)) return
			advance(promoted)
		}
		
		function advance(props) {
			
			if (edits.at(-1)) edits.at(-1).condense()
			edits.push(make_edit(props))
			index++
		}
		
		function capture(textarea) {
			
			let { value, selectionStart, selectionEnd } = textarea
			return { textarea, value, selectionStart, selectionEnd }
		}
		
		function apply(props) {
			
			const { textarea, value, selectionStart, selectionEnd } = props
			textarea.removeEventListener('focus', focused)
			input = true
			textarea.focus()
			Object.assign(textarea, { value, selectionStart, selectionEnd })
			textarea.addEventListener('focus', focused)
		}
		
		function focused() {
			promoted = capture(textarea)
		}
		
		function make_edit(then, now) {
			
			const edit = {}
			return Object.assign(edit, {
				then,
				now,
				undo: () => apply_(edit.then),
				redo: () => apply_(edit.now),
				condense,
				to_string
			})
			
			function apply_(props) {
				
				const { textarea, selectionStart, selectionEnd, offset, deleted, inserted } = props
				let { value } = props
				if (offset !== undefined) {
					value = textarea.value
					const head = value.slice(0, offset)
					const tail = value.slice(offset + deleted.length, value.length)
					value = head + inserted + tail
				}
				apply({ textarea, value, selectionStart, selectionEnd })
			}
			
			function condense() {
				
				if (! edit.then || ! edit.now) return
				if (edit.then.offset && edit.now.offset) return
				const then = edit.then.value, now = edit.now.value
				edit.then = combine(edit.then, diff(now, then))
				edit.now = combine(edit.now, diff(then, now))
			}
			
			function combine(props, diff) {
				
				const { textarea, selectionStart, selectionEnd } = props
				return { textarea, selectionStart, selectionEnd, ...diff }
			}
			
			function diff(a, b) {
				
				const begin = find(a, b, 1)
				const end = find(a, b, -1)
				return {
					offset: begin,
					deleted: a.slice(begin, a.length + end + 1),
					inserted: b.slice(begin, b.length + end + 1)
				}
			}
			
			function find(a, b, direction) {
				
				let i = direction === 1 ? 0 : -1
				while (true) {
					if (a.at(i) === undefined) break
					if (b.at(i) === undefined) break
					if (a.at(i) !== b.at(i)) break
					direction === 1 ? i++ : i--
				}
				return i
			}
			
			function to_string(props) {
				
				if (props.offset !== undefined) return `@${props.offset}-${props.deleted}+${props.inserted}`
				else if (props.value !== undefined) return props.value
				else return ''
			}
		}
	}
}
