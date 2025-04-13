
export const make_network = () => {
	
	const peers = []
	const views = []
	const network = {}
	return Object.assign(network, { init, add, reflect }).init()
	
	function init() {
		
		network.peers = peers
		return network
	}
	
	function add(peer) {
		
		peers.push(peer)
		const view = make_view(peer)
		peer.network = view
		views.push(view)
	}
	
	function reflect() {
		
		peers.forEach(a => {
			peers.forEach(b => {
				if (true) a.merge(b)
				else if (a != b) a.merge(b)
			})
		})
	}
	
	function make_view(peer) {
		
		const view = {}
		return Object.assign(view, {
			init,
			apply,
			send,
			receive
		}).init()
		
		function init() {
			
			view.connected = false
			view.peer = peer
			return view
		}
		
		function apply(op) {
			
			const local = view
			views
			.filter(view => view.peer !== local.peer)
			.filter(view => view.connected)
			.forEach(view => view.peer.apply(op, true))
		}
		
		function send(op) {
			return
		}
		
		function receive(fn) {
			fn()
		}
	}
}
