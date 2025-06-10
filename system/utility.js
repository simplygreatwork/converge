
export function show() {
	
	Array.from(arguments).forEach(each => {
		console.log(`  ${each.name()}: ${each.to_string()}`)
	})
}

export async function delay(period) {
	
	return new Promise(resolve => {
		setTimeout(() => resolve(), period)
	})
}

export function settles(array, string, fn, index = 0) {
	
	const max = 2000, delay = 100
	const attempts = max / delay
	if (array.every(value => value.to_string() === string)) return fn(true)
	setTimeout(() => {
		if (index === attempts) fn(false)
		else settles(array, string, fn, ++index)
	}, delay)
}
