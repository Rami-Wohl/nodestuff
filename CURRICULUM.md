# Curriculum

A bottom-up tour of the JavaScript/Node runtime for experienced application
developers. 15 modules, 158 lessons, 6 capstones.

This file is the map. Each lesson's own `README.md` (under `modules/`) is the
territory: mental model, prediction, experiment, explanation, demo.

## How to use it

1. Work through modules in order. Later modules assume the vocabulary and the
   experiments of earlier ones; the prerequisites below say which.
2. For every lesson: read the mental model, **write down your prediction**
   before running anything, run the experiment, then read the explanation.
   Record what surprised you in `PROGRESS.md`.
3. Do the "Modify the experiment" variations. They exist to find out whether the
   mental model survives contact with a change.
4. Each lesson has a short coworker demo. Rehearse it once; explaining a thing
   is the best test of understanding it.

The file-by-file order inside a lesson (which README sections to read before
and after running) is in the root `README.md` under "Order of a lesson". The
rules for *writing* lessons are in `LESSON_POLICY.md`.

## Suggested progression

```
01 JS execution ─▶ 02 async/event loop ─▶ 03 what Node is ─▶ 04 memory/GC
                                                                   │
        ┌──────────────────────────────────────────────────────────┘
        ▼
05 libuv/I/O ─▶ 06 concurrency/workers ─▶ 07 V8 ─▶ 08 streams ─▶ 09 networking
                                                                        │
        ┌───────────────────────────────────────────────────────────────┘
        ▼
10 modules ─▶ 11 TypeScript boundary ─▶ 12 observability ─▶ 13 profiling ─▶ 14 performance
                                                                                   │
                                                              15 frameworks ◀──────┘
                                                                   │
                                                              capstones
```

Modules 01–04 are the foundation and should be done strictly in order.
From 05 onward the order above is recommended but 10 and 11 can be pulled
forward if module/TypeScript questions come up in daily work.

Capstones are built when their prerequisite module is complete, not at the
very end; they are the "demo for coworkers" at module scale.

## Lesson format

Every lesson README has the same thirteen sections: why this matters · mental
model · terminology · what actually happens · prediction exercise · experiment ·
observation · explanation · modify the experiment · real-world relevance · demo
for coworkers · knowledge check · further exploration.

Lesson folders are `modules/<NN>-<module>/<NN>-<lesson>/` and contain
`README.md`, `notes.md`, and `examples/`, `exercises/`, `demo/`, `test/`
where useful.

## Modules

### Module 01 — JavaScript execution model

**Goal.** Develop a precise mental model of how JavaScript executes before adding Node-specific behavior.

**Prerequisites.** None. Start here.

| Lesson | Title | Covers |
| --- | --- | --- |
| 01.01 | Source code to execution | parsing; execution; statements and expressions; runtime versus host environment; ECMAScript versus implementation |
| 01.02 | Execution contexts and stack frames | function execution; stack frames; nested calls; recursion; stack overflow. Demo: visual call-stack growth |
| 01.03 | Lexical scope and environments | lexical environments; scope chains; bindings; block scope; function scope |
| 01.04 | Closures | captured environments; lifetime of captured values; practical closure behavior; memory implications. Demo: a closure retaining state after its creating function returned |
| 01.05 | Values, references and identity | primitives; object references; mutation; equality; copying; argument passing (without the misleading "pass by reference" phrase) |
| 01.06 | Objects and prototypes | property lookup; prototype chain; constructors; classes as syntax over prototype-based behavior |
| 01.07 | `this` | call-site behavior; method calls; plain functions; arrow functions; bind/call/apply |
| 01.08 | Errors and stack traces | Error objects; throwing; propagation; synchronous stack traces; limitations of stack traces |

Folder: `modules/01-javascript-execution/`

### Module 02 — Async JavaScript and the event loop

**Goal.** Understand asynchronous JavaScript precisely enough to predict execution order and diagnose event-loop problems.

**Prerequisites.** Module 01 (especially 01.02 stack frames and 01.04 closures).

| Lesson | Title | Covers |
| --- | --- | --- |
| 02.01 | Run-to-completion | why a running JavaScript function is never interrupted |
| 02.02 | Promises | promise states; handlers; resolution; chaining; error propagation |
| 02.03 | Microtasks | Promise callbacks; `queueMicrotask`; draining behavior. Demo: visual task/microtask execution order |
| 02.04 | async/await | async/await explained in terms of promises and continuations |
| 02.05 | Node's `process.nextTick` | comparison with normal microtasks; starvation |
| 02.06 | Timers | `setTimeout`; minimum delays; why timers do not guarantee exact execution time |
| 02.07 | `setImmediate` | when and why it differs from timers |
| 02.08 | Node event-loop phases | a progressively accurate event-loop model |
| 02.09 | Event-loop starvation | pathological examples |
| 02.10 | Measuring event-loop delay | visual demo of normal versus blocked event-loop behavior |

Folder: `modules/02-async-event-loop/`

### Module 03 — What Node.js actually is

**Goal.** Separate JavaScript, V8, Node, libuv and the operating system.

**Prerequisites.** Modules 01 and 02.

| Lesson | Title | Covers |
| --- | --- | --- |
| 03.01 | Node architecture | JavaScript → Node APIs → internal JS/C++ → V8/libuv → operating system |
| 03.02 | What V8 does | intro only; Module 07 goes deep |
| 03.03 | What libuv does | intro only; Module 05 goes deep |
| 03.04 | What belongs to Node | process; Buffer; filesystem; streams; worker_threads |
| 03.05 | What belongs to JavaScript | Promise; Map; Proxy; classes; generators |
| 03.06 | Web APIs in modern Node | fetch; Request; Response; Web Streams; AbortController; URL; Node/Web runtime convergence |
| 03.07 | Native bindings | conceptually how JS calls native functionality |

Folder: `modules/03-node-runtime/`

### Module 04 — Memory and garbage collection

**Goal.** Understand memory well enough to reason about leaks, allocation pressure and GC.

**Prerequisites.** Modules 01–03. 01.04 (closures) and 03.02 (what V8 does) matter most.

| Lesson | Title | Covers |
| --- | --- | --- |
| 04.01 | Stack versus heap | a useful conceptual model, not an absolute implementation rule |
| 04.02 | Allocation | observe object and buffer allocation |
| 04.03 | Reachability | GC roots and reachable object graphs |
| 04.04 | Garbage collection fundamentals | mark; sweep; compaction; stop-the-world concepts |
| 04.05 | Generational GC | young generation; old generation; survival; promotion; minor versus major GC |
| 04.06 | Memory leaks | growing Map; retained closures; event listeners; timers; accidental caches |
| 04.07 | Heap snapshots | take and inspect real snapshots |
| 04.08 | Allocation pressure | frequent short-lived allocation |
| 04.09 | Buffers and external memory | why process memory is not identical to JavaScript heap memory |
| 04.10 | GC and latency | how allocation patterns affect application latency |

Folder: `modules/04-memory-gc/`

### Module 05 — libuv and asynchronous I/O

**Goal.** Understand what happens underneath common asynchronous Node APIs.

**Prerequisites.** Modules 02 and 03.

| Lesson | Title | Covers |
| --- | --- | --- |
| 05.01 | Blocking versus non-blocking I/O | — |
| 05.02 | OS-level asynchronous I/O | conceptual introduction to epoll, kqueue and IOCP |
| 05.03 | The libuv thread pool | operations that may use it |
| 05.04 | Filesystem operations | trace conceptually what happens during `fs.readFile` |
| 05.05 | DNS | differences between DNS-related APIs |
| 05.06 | Crypto and worker-pool behavior | — |
| 05.07 | `UV_THREADPOOL_SIZE` | benchmark workloads under different settings; why increasing it is not automatically an optimization |
| 05.08 | I/O versus CPU-bound work | a strong visual comparison |

Folder: `modules/05-libuv-io/`

### Module 06 — Concurrency, parallelism and workers

**Goal.** Understand how Node scales work.

**Prerequisites.** Modules 02, 03 and 05.

| Lesson | Title | Covers |
| --- | --- | --- |
| 06.01 | Concurrency versus parallelism | — |
| 06.02 | Why Node can handle many concurrent requests | — |
| 06.03 | CPU-bound workloads | block an HTTP server intentionally |
| 06.04 | Worker Threads | move the same work to a worker |
| 06.05 | Worker communication | structured clone; message passing; transferables |
| 06.06 | SharedArrayBuffer and Atomics | introductory level |
| 06.07 | Child processes | — |
| 06.08 | Processes versus workers | — |
| 06.09 | Choosing the right concurrency model | a practical decision tree. Demo: HTTP service with adjustable CPU workload and worker count |

Folder: `modules/06-concurrency-workers/`

### Module 07 — V8 internals

**Goal.** Understand V8 deeply enough to reason about runtime behavior without turning the course into compiler engineering.

**Prerequisites.** Modules 01, 03 and 04.

| Lesson | Title | Covers |
| --- | --- | --- |
| 07.01 | V8 architecture | — |
| 07.02 | Parsing and ASTs | — |
| 07.03 | Bytecode and Ignition | — |
| 07.04 | JIT compilation | — |
| 07.05 | TurboFan | — |
| 07.06 | Hot code | — |
| 07.07 | Object shapes / hidden classes | — |
| 07.08 | Inline caches | — |
| 07.09 | Monomorphic and polymorphic operations | — |
| 07.10 | Deoptimization | — |
| 07.11 | Observing optimization behavior | Node/V8 diagnostic flags |
| 07.12 | Practical relevance | useful conceptual knowledge versus genuine optimization opportunity versus dangerous micro-optimization folklore |

Folder: `modules/07-v8/`

### Module 08 — Buffers, streams and backpressure

**Goal.** Understand one of Node's most important architectural abstractions.

**Prerequisites.** Modules 02, 04 and 05.

| Lesson | Title | Covers |
| --- | --- | --- |
| 08.01 | Buffers | — |
| 08.02 | Readable streams | — |
| 08.03 | Writable streams | — |
| 08.04 | Duplex streams | — |
| 08.05 | Transform streams | — |
| 08.06 | Buffering | — |
| 08.07 | Backpressure | a major lesson |
| 08.08 | `highWaterMark` | — |
| 08.09 | Pipelines | — |
| 08.10 | Streaming versus reading everything into memory | a clear visual demo |
| 08.11 | Node Streams versus Web Streams | — |
| 08.12 | Streams in real HTTP applications | — |

Folder: `modules/08-streams-buffers/`

### Module 09 — Networking and HTTP

**Goal.** Understand what exists underneath Express, NestJS and Next.js request handlers.

**Prerequisites.** Modules 05 and 08.

| Lesson | Title | Covers |
| --- | --- | --- |
| 09.01 | Sockets | — |
| 09.02 | TCP fundamentals for Node developers | — |
| 09.03 | Build a tiny TCP server | — |
| 09.04 | HTTP/1.1 fundamentals | — |
| 09.05 | Build a server using `node:http` | no frameworks |
| 09.06 | Connections and keep-alive | — |
| 09.07 | DNS | — |
| 09.08 | TLS | conceptual introduction plus observable Node APIs |
| 09.09 | Connection pooling | — |
| 09.10 | Fetch and Undici | — |
| 09.11 | HTTP/2 overview | — |
| 09.12 | Follow one request through the complete stack | client → TCP → HTTP → Node → framework → application → response |

Folder: `modules/09-networking-http/`

### Module 10 — Modules and loading

**Goal.** Understand the module system underneath modern tooling.

**Prerequisites.** Modules 01 and 03.

| Lesson | Title | Covers |
| --- | --- | --- |
| 10.01 | CommonJS | — |
| 10.02 | ES Modules | — |
| 10.03 | Module evaluation | — |
| 10.04 | Module caching | — |
| 10.05 | Circular dependencies | — |
| 10.06 | Node resolution | — |
| 10.07 | `package.json` exports | — |
| 10.08 | Conditional exports | — |
| 10.09 | Loaders | — |
| 10.10 | Dynamic imports | — |
| 10.11 | TypeScript module resolution versus Node resolution | — |
| 10.12 | Bundlers versus runtime loaders | relate to Vite and Next.js |

Folder: `modules/10-modules-loading/`

### Module 11 — TypeScript and the runtime boundary

**Goal.** Understand TypeScript as a static type system rather than "JavaScript with types."

**Prerequisites.** Modules 01 and 10.

| Lesson | Title | Covers |
| --- | --- | --- |
| 11.01 | What disappears at runtime | — |
| 11.02 | Structural typing | — |
| 11.03 | Assignability | — |
| 11.04 | Narrowing | — |
| 11.05 | Discriminated unions | — |
| 11.06 | Generics | — |
| 11.07 | Variance | — |
| 11.08 | Conditional types | — |
| 11.09 | Mapped types | — |
| 11.10 | `never` | — |
| 11.11 | `unknown` | — |
| 11.12 | Declaration files | — |
| 11.13 | Runtime validation | why `const value: User = JSON.parse(input)` does not validate anything; schema validation as the runtime mechanism |
| 11.14 | Type testing | dedicated testing of public type contracts |

Folder: `modules/11-typescript-runtime-boundary/`

### Module 12 — Observability

**Goal.** Understand observability from Node primitives upward.

**Prerequisites.** Modules 02, 03 and 09.

| Lesson | Title | Covers |
| --- | --- | --- |
| 12.01 | Logs, metrics, traces and profiles | their different purposes |
| 12.02 | Structured logging | — |
| 12.03 | Correlation IDs | — |
| 12.04 | AsyncLocalStorage | propagate request context |
| 12.05 | `diagnostics_channel` | — |
| 12.06 | `TracingChannel` | — |
| 12.07 | `performance_hooks` | — |
| 12.08 | Event-loop utilization | — |
| 12.09 | Event-loop delay | — |
| 12.10 | Error instrumentation | — |
| 12.11 | Async stack traces | — |
| 12.12 | OpenTelemetry concepts | — |
| 12.13 | Instrument a small Node API | request → service → DB/mock DB → external HTTP request; expose trace ID, timings, logs, errors |

Folder: `modules/12-observability/`

### Module 13 — Profiling and debugging

**Goal.** Be able to investigate why a Node process is unhealthy.

**Prerequisites.** Modules 04, 06 and 12.

| Lesson | Title | Covers |
| --- | --- | --- |
| 13.01 | Performance investigation methodology | start with a question, not a tool |
| 13.02 | CPU profiling | — |
| 13.03 | Flame graphs | — |
| 13.04 | Reading flame graphs | — |
| 13.05 | Heap snapshots | — |
| 13.06 | Allocation profiling | — |
| 13.07 | GC tracing | — |
| 13.08 | Event-loop diagnostics | — |
| 13.09 | Production-safe profiling concepts | — |
| 13.10 | Build intentionally broken applications | CPU saturation; memory leak; allocation churn; blocked event loop; slow external API; excessive concurrency — diagnose each without reading the source first |

Folder: `modules/13-profiling/`

### Module 14 — Performance engineering

**Goal.** Develop a measurement-based approach to Node performance.

**Prerequisites.** Modules 07, 08 and 13.

| Lesson | Title | Covers |
| --- | --- | --- |
| 14.01 | Benchmarking fundamentals | — |
| 14.02 | Throughput versus latency | — |
| 14.03 | p50, p95 and p99 latency | — |
| 14.04 | Benchmarking mistakes | — |
| 14.05 | Warmup and JIT effects | — |
| 14.06 | Allocation reduction | — |
| 14.07 | Synchronous fast paths | — |
| 14.08 | Batching | — |
| 14.09 | Caching | — |
| 14.10 | Serialization cost | — |
| 14.11 | Worker strategies | — |
| 14.12 | Streams and memory efficiency | — |
| 14.13 | Runtime flags | investigate flags experimentally; never a "free win" without measurement |
| 14.14 | Hardware and container considerations | CPU limits; memory limits; container awareness; modern hardware; Node's compatibility defaults |
| 14.15 | Performance playbook | a practical decision tree |

Folder: `modules/14-performance/`

### Module 15 — Applying the fundamentals to real frameworks

**Goal.** Reconnect the low-level knowledge to the application environment you work in. Only after the relevant fundamentals are complete.

**Prerequisites.** All previous modules (each lesson names the ones it leans on).

| Lesson | Title | Covers |
| --- | --- | --- |
| 15.01 | NestJS | HTTP request → Node HTTP → adapter → Nest pipeline → middleware → guards → interceptors → controller → service → response; logging, AsyncLocalStorage, diagnostics, request context, OpenTelemetry, performance |
| 15.02 | Next.js | Node versus alternative runtimes; route handlers; server actions; React server rendering; fetch; streaming; instrumentation hooks; OpenTelemetry; runtime boundaries |
| 15.03 | Vite | browser runtime versus Node dev server versus build process versus SSR; which Node fundamentals matter where |
| 15.04 | Real application profiling | apply the profiling methodology to a representative application |
| 15.05 | Real observability experiment | add tracing/context to a representative app |
| 15.06 | Real performance experiment | measure one concrete optimization |

Folder: `modules/15-framework-applications/`

## Capstones

Each capstone is a small, self-contained application that makes one family of
runtime behavior visible. They live under `capstones/` (created when reached)
and reuse the web demo shell under `web/` where a UI helps.

| # | Capstone | What it shows | Built after |
| --- | --- | --- | --- |
| 1 | Event loop visualizer | Interactive visualization of synchronous execution, microtasks, nextTick, timers, setImmediate and I/O. Predict the order, then run it. | Module 02 |
| 2 | Memory lab | Interactive Node app that triggers healthy allocation, retained objects, cache leaks, Buffer allocation and allocation churn, with memory metrics over time. | Module 04 |
| 3 | Blocking versus workers | HTTP server where you trigger CPU-heavy work, observe request latency, enable Worker Threads and compare. | Module 06 |
| 4 | Streams and backpressure | Process a large amount of data with full buffering, streams, and deliberately broken backpressure. Visualize memory and throughput. | Module 08 |
| 5 | Observability lab | browser → HTTP API → service → fake DB → downstream HTTP service, instrumented with structured logs, AsyncLocalStorage, diagnostics channels, tracing, timings and errors. | Module 12 |
| 6 | Diagnose the broken service | Several failure modes (CPU, memory, event-loop blocking, downstream latency, excessive allocation). Find the cause with the profiling tools. | Modules 13–14 |

## Definition of success

At the end you should be able to explain, to another experienced developer and
with an experiment to back it up:

- What actually happens when Node executes a JavaScript file?
- What is V8 responsible for? What is Node responsible for? What is libuv responsible for?
- What happens when I `await` something?
- Why can Node serve thousands of concurrent requests with one JavaScript thread?
- Why can CPU work freeze an entire Node service?
- What causes an object to remain in memory?
- How does generational garbage collection help?
- Why can excessive allocation damage latency?
- What is backpressure? Why is streaming usually more memory efficient?
- How does Node eventually reach the operating system when I perform I/O?
- What exactly does a Worker Thread provide?
- What is a flame graph actually showing?
- How do I distinguish CPU, memory, event-loop and downstream latency problems?
- What can `diagnostics_channel` provide? What role does AsyncLocalStorage play in observability?
- Which TypeScript guarantees disappear entirely at runtime?
- What does a framework such as NestJS or Next.js add on top of Node?
- How do I determine whether a Node optimization actually helped?

Most importantly: Node.js should no longer be a black box underneath your
application frameworks.
