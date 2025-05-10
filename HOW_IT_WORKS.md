
# WHAT THIS IS

- I like simple, tiny, lightweight implementations of software. I like to optimize for clarity then memory and performance.
- Just a few examples of tiny software I've come across are things like callbags, parser combinators, and tiny state managers.
- Here, I'm trying to create a tiny implementation for conflict-free peer-to-peer data convergence which is straightforward to understand, use, and enhance.
- This project allows each member of a system to work offline indefinitely, return to the system, then merge without conflicts.
- Interleaving is an issue which may occur in collaborative text editing systems.
- An example of interleaving is when two users type a word at the same time and the letters become interspersed when they merge.
- Interleaving is historically difficult to solve completely in a distributed collaborative system.
- My primary goal in this project is to create a tiny, straighforward system for conflict-free data exchange.
- I also hope to be able to eliminate the issue of interleaving. I, perhaps naively, believe that I am very close to a straighforward solution to prevent text interleaving.
- Read on below. No guarantees.

# HOW IT WORKS

- Each agent (peer) has an internal clock value, a counter.
- Each agent will synchonize these clock values any time they share operation event data from one agent to another.
- Agent "a" performs many operations and records these operations locally with contiguous ids, for example, ranging from [a,0] to [a,9]. These contiguous ids will form a single group.
- In collaborative text editing situations, when an agent accepts a new clock value upon data exchange, it will not immediately apply it locally.
- In these situations, the clock value is only applied locally after the user has moved the cursor via mouse or keyboard.
- Agent "a" receives old events from another agent which has been offline for days.
- In this situation, agent "a" needs to be able to rewind its event log and state to be able to replay the old event operation.
- In order to do this successfully, each agent uses a total order system to be able to rewind reliabily without corruption.
- When the total order system rewinds events, it always enforces that all contiguous event ids of each agent are emitted together as a group using queues - hopefully prohibiting interleaving.
- After a contiguous group of ids has been emitted from the agent's queue, it yields/cedes/defers to the next agent.

# STATUS

- The code in this repo does not yet exactly reflect the description above.
- I need to make a few tweaks to the total ordering system.
1. I need to revert the total ordering system to the previous implemention.
- No 'begin-group' flags.
- Emit agent ids based entirely on the contigiuous nature of ids - how it had orignally been done.
2. Create a text editing example. Apply any remotely updated clock value only after the user moves the cursor via mouse or keyboard.
-  Having said all of this, the most recent implementation is the "networked" version in the folder example-networked-list.
