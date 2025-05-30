
export function show() {
	
	Array.from(arguments).forEach(list => {
		console.log(`  text "${list.name()}": ${JSON.stringify(list.to_array())}`)
	})
}

export async function delay(period) {
	
	return new Promise(resolve => {
		setTimeout(() => resolve(), period)
	})
}
	
export function settles(lists, string, fn, index = 0) {
	
	const max = 2000, delay = 100
	const attempts = max / delay
	if (lists.every(value => value.to_string() === string)) return fn(true)
	setTimeout(() => {
		if (index === attempts) fn(false)
		else settles(lists, string, fn, ++index)
	}, delay)
}
