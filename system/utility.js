
export function show() {
	
	Array.from(arguments).forEach(list => {
		console.log(`  text "${list.name()}": ${JSON.stringify(list.to_array())}`)
	})
}

export function matches(a, b) {
	
	return a.to_string() === b.to_string()
}

export async function delay(period) {
	
	return new Promise(resolve => {
		setTimeout(() => resolve(), period)
	})
}
