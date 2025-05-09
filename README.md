
# Converge

After lots of general research and lots of trial and error, I began to [bake a remix](https://github.com/simplygreatwork/converge) and extension of Matt Wonlaw's excellent tiny [DAG substrate](https://github.com/vlcn-io/docs/blob/main/components/crdt-substrate/DAG.ts) examples which he describes in [his blog](https://vlcn.io/blog/crdt-substrate). My goal is to create a low-level developer toolkit with great clarity to merge distributed data.

I've been on a CRDT binge for the past few weeks with so many influences such as Evan Wallace's [algorithm articles](https://madebyevan.com/algos/crdt-tree-based-indexing/) and writings from [Seph Gentle](https://arxiv.org/abs/2409.14252).  I'm inspired by Seph's [event graph walker](https://github.com/josephg/egwalker-from-scratch) however my example is much thinner and perhaps naive. Right now, my main tree list [example](https://github.com/simplygreatwork/converge/tree/main/example-list) includes aspects of these and many other projects and articles online --- and may have a few rough edges.

I'm also attempting to illustrate other related concepts in [my GitHub project](https://github.com/simplygreatwork/converge) such as:

- a primer for associativity, commutativity & idempotency
- a tiny lamport clock example
- illustrate why inserting text before a letter might be prefered to inserting it after the letter
- I've also tweaked my event graph walk order to try to reduce potential for interleaving among concurrent edits

# Subprojects
- primer: shows the core concepts of conflict-free data replication
- clocks: shows how causal order of time (cause and effect) can function with concurrency in a distributed system
- prepend: shows one way to represent and print a tree of text nodes
- event-graph: shows how to use a causal event graph to be able to merge and synchronize operation events among peers
- tree-list-with-event-graph: a tree-based list which uses an event graph to merge operation events among peers

# Update on the newest implementation
- The newest implementation in in the directory example-network-list.
- I switched from using a directed acyclic graph and instead am using the Lamport clock timestamps as the basic for total ordering and reverse walk.
- That way everything is so much easier to optimize for performance.
- Also, this custom ordering system does not permit interleaving at all unless you expressly allow it.
- By default, every event of an agent is contiguous and you expressly add breaks for gaps between groups of an agents events/edits.

# Inspired by
- [Matt Wonlaw's "A Framework for Convergence"](https://vlcn.io/blog/crdt-substrate)
- [Matt Wonlaw's "CRDT Substrate / DAG.ts"](https://github.com/vlcn-io/docs/blob/main/components/crdt-substrate/DAG.ts)
- [Aaron Boodman's "You May Not Need a CRDT" @ Local First Web Meetup #4](https://www.youtube.com/watch?v=7Bb0KRLL8FI&t=1892s)
- [Evan Wallace's "CRDT: Tree-Based Indexing"](https://madebyevan.com/algos/crdt-tree-based-indexing/)
- [Seph Gentle's "Collaborative Text Editing with Eg-walker: Better, Faster, Smaller"](https://arxiv.org/abs/2409.14252)

# Nice read
- https://www.farley.ai/posts/causal
