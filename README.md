
# Converge

After lots of research and lots of trial and error, I began [baking a remix](https://github.com/simplygreatwork/converge) and extension of Matt Wonlaw's excellent tiny [DAG substrate](https://github.com/vlcn-io/docs/blob/main/components/crdt-substrate/DAG.ts) examples which he describes in [his blog](https://vlcn.io/blog/crdt-substrate). My goal is to create a low-level developer toolkit with great clarity to merge distributed data.

I've been on a CRDT binge for the past few weeks with so many influences such as Evan Wallace's [algorithm articles](https://madebyevan.com/algos/crdt-tree-based-indexing/) and writings from [Seph Gentle](https://arxiv.org/abs/2409.14252).  I'm inspired by Seph's [event graph walker](https://github.com/josephg/egwalker-from-scratch) however my example is much thinner and perhaps naive. Right now, my main tree list [example](https://github.com/simplygreatwork/converge/tree/main/tree-list-with-event-graph) includes aspects of these and many other projects and articles online ---and it's pretty rough.

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

# Inspired by
- https://vlcn.io/blog/crdt-substrate
- https://github.com/vlcn-io/docs/blob/main/components/crdt-substrate/DAG.ts
- https://madebyevan.com/algos/crdt-tree-based-indexing/
- https://github.com/josephg/egwalker-paper (in spirit)

# Nice read
- https://www.farley.ai/posts/causal
