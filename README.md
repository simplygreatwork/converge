
# Overview
- This is a basis, a substrate for collaborate editing in a distributed system.
- It logs operations as events which form the basis of data exchange for lists, text, maps, etc.
- Users can work offline, reconnect later, then merge, among all peers and all without a server.

# Project structure
- The directory "learn" contains examples to showcase some basic concepts.
- "learn-crdt-primer.html" shows the core concepts of conflict-free data replication.
- "learn-lamport-clocks.html" attempts to illustrate how clocks synchronize within a concurrent, distributed system.
- "learn-prepend-text.html" shows one way to represent and print a tree of text nodes
- The "system" directory contains the primary implementations of the core components: agent, order, list, map, bus.
- The "examples" directory contains the primary examples of list, text, and map.

# Usage
- For usage, refer to the examples in the examples directory.

# Status
- In development, alpha, reference implementation. Initially aiming for concise clarity and not necessarily optimized for memory or performance.
- An exception is that the total ordering system is already very efficient for insertion of event ids and presorts agents for efficient rewind.
- An exception is that each agent keeps records of known current event data so it won't need to request that subset again.
- The example "text.html" is still in development. The interleaving prevention is being refined and hardened within the selection listener.
  
# Highlights
- When an agent reconnects after a period offline, it's able to ask the other agents for missing data.
- With the property "interleave" set to false, concurrent textual edits among peers will never interleave.

# Highlights: Convergence
- Each agent (peer) is the single source of truth for all event data it creates.
- When any agent reconnects after a period offline, it asks each other agent for any missing data.
- Each agent will keep a record of known good update ranges it has for every other agent.
- For example: agent "a" keeps a record that it's up to date for agent "b" through id [b, 200] for example. (incomplete)
- Agent "a" would also maintain records of update activity of all other agents such as [[b,20], [c, 44], [d,111], ...] (incomplete)
- So agent "a" will send all ids it has of agent "b" beyond [b,200] to agent "b".
- Agent "b" will diff and respond to agent "a" with only the missing event data.
- Edges cases still need to be handled separately.
- For example, allowing other agents to act as surrogates if and when the source of truth agent is offline.

# Highlights: Interleaving
- With interleave set to false, concurrent textual edits among peers will never interleave, never intersperse.
- The only concession is when a text editing user moves the caret via keyboard or mouse.
- And then may text block interleaving occur.

# Roadmap, To Do, Ideas
- capture and escalate window.onError
- Agents should announce themselves on the network when they connect. This is one way the agents will could discover the availability of other agents.
- Still need to implement agent recordkeeping for current update activity.
- Edge case: discover and update missing data using surrogates when the source of truth agent for the missing data is offline.
- Known issue: in order.js, ids will not remain sorted by agent name. Why is this? Current have to resort on every iteration.
- Known issue: if you load the test examples in a background tab instead of in the foreground, the tests will likely fail.
- For basic list data, when interleave is true, be able to add multiple operations at once so this are a contiguous (id) batch.
- Add some form of persistence. These examples currently have no data persistence at all - not even basic local storage.
- Color code example tests background color for pass/fail (green/red) (done)
- Maybe agent.list/agent/to_string should actually be agent.ids() because it returns event ids
- Maybe move agent's walker out of agent.js and into its own file as walker.js?
- Or instead consider moving walker directly into agent exposing a member getter function on agent: walker() (?)
- In order.js, agent.js, maybe consider using syntax const [agent,] = id instead of const agent = id[0] 
- In order.js, agent.js, maybe consider using syntax const [,clock] = id instead of const clock = id[1] 
- For the example "text.html", implement offline edit mode checkboxes for connect and disconnect, to help test interleaving prevention.
- Agents currently support working with one list, one map, etc. only. Lists and maps need their own name beyond the name of the agent itself.
- Implement sets, counters, etc regardless of whether or not they really need this operation event system.
- Where possible, stop using await delay in test example code, and use on('change') instead. Review where and how this could be possible.
- in agent,js, allow clock handling and forwarding to be more robust. For example, with delayed system clock update, still forward the system clock to other agents even if not applied locally?
- Rewrite "How it works" to cover each source file and each example file.

# History
...
