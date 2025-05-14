
export function make_bus() {
	
	const keys = {}
	const bus = {}
	return Object.assign(bus, { on, once, emit })
	
	function on(key, fn) {
		
		keys[key] = keys[key] || []
		keys[key].push(fn)
		return () => keys[key].splice(keys[key].indexOf(fn), 1)
	}
	
	function once(key, fn) {
		const off = on(key, () => off(fn(...arguments)))
	}
	
	function emit(key) {
		
		const arguments__ = Array.from(arguments)
		if (keys['*']) keys['*'].forEach((fn) => fn.apply(this, arguments__))
		const arguments_ = Array.from(arguments).slice(1)
		if (! keys[key]) return
		keys[key].forEach((fn) => fn.apply(this, arguments_))
	}
}
