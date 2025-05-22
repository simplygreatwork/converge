
export const make_test = (name, options) => {
	
	let test
	return test = {
		name,
		suite: fn => suite(test, fn),
		run: fn => run(test, fn),
		items : []
	}
	
	function suite(test, fn) {
		
		const it = (label, fn) => test.items.push({ label, fn })
		const wait = (label, fn) => test.items.push({ label, fn, wait: true})
		fn(it, wait)
		return test
	}
	
	function run(test, fn) {
		
		const pass = true
		const bus = make_bus()
		fn ? fn(bus) : install(bus)
		bus.emit('begin-suite', test.name || "")
		run_each(test, fn, bus, pass)
	}
	
	function run_each(test, fn, bus, pass) {
		
		if (test.items.length === 0) return bus.emit('end-suite', pass)
		const item = test.items.shift()
		bus.emit('begin-test', item.label)
		if (item.wait) item.fn(result => run_each_result(test, fn, bus, pass, item, result))
		else run_each_result(test, fn, bus, pass, item, item.fn())
	}
	
	function run_each_result(test, fn, bus, pass, item, result) {
		
		item.result = result
		if (item.result === false) pass = false
		bus.emit('end-test', item.result, item.label)
		run_each(test, fn, bus, pass)
	}
	
	function install(bus) {
		
		bus.on('begin-suite', name => console.log(`Running suite "${name}".`))
		bus.on('begin-test', name => console.log(`\nRunning test "${name}".`))
		bus.on('end-test', (pass, name) => console.log(`${ pass ? 'Passed' : 'Failed'}.`))
		bus.on('end-suite', pass => {
			if (pass) console.log(`\nAll tests passed.`)
			else console.log(`\nSome tests failed.`)
			if (pass) document.querySelector('body').style.backgroundColor = 'hsl(120, 80%, 80%)'
			else document.querySelector('body').style.backgroundColor = 'hsl(0, 80%, 80%)'
		})
	}
}

export const Test = make_test

export const make_console = selector => {
	
	let console_log = console.log
	return console.log = function(message) {
		console_log_terminal(console, message)
		console_log_browser(console, message)
	}
	
	function console_log_terminal(console, string) {
		
		string = dedent(string)
		string = string.replaceAll('\t', '  ')
		console_log(string)
	}
	
	function console_log_browser(console, string) {
		
		if (! window.document) return 
		string = dedent(string)		
		string = string.replaceAll(' ', '&nbsp;')
		string = string.replaceAll('\n', '<br>')
		string = string.replaceAll('\t', '&nbsp;&nbsp;')
		let div
		div = document.createElement('div')
		div.style.cssText = 'font-family:mono;font-size:75%'
		div.innerHTML = string
		console.selector = 'body'
		document.querySelector(selector).appendChild(div)
	}
	
	function dedent(string) {
		
		let array = string.split('\n')
		if (array.length < 2) return string
		let delta = array[1].length - array[1].trimLeft().length
		return array.map(function(each) {
			return each.slice(delta)
		}).join('\n')
	}	
}

function make_bus() {
	
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

export function watch_errors() {
	
	window.addEventListener('error', event => {
		const { message, source, lineno, colno, error } = event
		if (true) document.querySelector('body').style.backgroundColor = 'hsl(0, 80%, 80%)'
		if (false) window.alert(`event.message: ${message}`)
		if (true) console.log(message)
	})
}
