# DSA Explanation

All code is in `backend/src/dsa/`. None of it uses `Map`, `Set` or `Array.prototype.sort`.

## Why Hash Map?  (`HashMap.js`)
**Used for:** Patient ID -> patient record. The patient service builds the index from PostgreSQL at start-up and after every write. It powers patient lookup (`GET /api/patients/:id`), the duplicate-ID check, ID search, and existence checks used when booking appointments.

**Why:** Without it, finding one patient means scanning every patient (O(n)). A hash function maps the key to a bucket, so the average lookup is O(1).

**How it works:** `hash(key)` uses a djb2-style string hash `h = h*33 + char` and `% capacity`. **Collisions** (two keys in one bucket) are handled by **separate chaining** - each bucket is a linked chain of nodes. When the load factor passes 0.75 the table doubles and re-hashes everything.

| Operation | Complexity |
|---|---|
| set / get / has / delete | average O(1), worst O(n) |
| resize | O(n), amortised O(1) per insert |
| Space | O(n + buckets) |

## Why Queue?  (`Queue.js`)
**Used for:** today's *normal* appointments (`GET /api/appointments/queue`, "Serve next patient").
**Why:** fairness - First In, First Out. The earliest booking is served first.
**How:** a linked list with `head` and `tail` pointers, so enqueue (at tail) and dequeue (at head) are both O(1). Using `array.shift()` would be O(n).
Complexity: enqueue O(1), dequeue O(1), peek O(1), isEmpty O(1), size O(1). Space O(n).

## Why Priority Queue?  (`PriorityQueue.js`)
**Used for:** the emergency queue. Priority 1 = Critical, 2 = Emergency, 3 = Normal. Lower number = higher urgency.
**Why:** a critical patient must be treated before a normal patient even if they arrived later. A plain queue cannot do that.
**How:** a wrapper around the min-heap. Entries are compared by `priority`, then by an arrival sequence number, so patients with equal priority are served in arrival order (stable behaviour).
Complexity: enqueue O(log n), dequeue O(log n), peek O(1). Building from n items with `heapify` is O(n).

## Why Heap?  (`Heap.js`)
**Used for:** the engine of the priority queue.
**Why:** it keeps the most urgent item at index 0 and repairs itself in O(log n) after every change, which is cheaper than re-sorting (O(n log n)) after each arrival.
**How:** a complete binary tree stored in an array: parent(i) = floor((i-1)/2), left(i) = 2i+1, right(i) = 2i+2. *Insert* adds at the end and sifts **up**. *Extract-min* moves the last element to the root and sifts **down**. *Heapify* builds a heap from an unsorted array bottom-up in O(n).

| Operation | Complexity |
|---|---|
| insert | O(log n) |
| extractMin | O(log n) |
| peek | O(1) |
| heapify | O(n) |

## Why Linked List?  (`LinkedList.js`)
**Used for:** a patient's medical history. Every `Node` is one visit with `data` and a `next` pointer; the list keeps `head` and `tail`.
**Why:** visits are added one at a time and read in order. A linked list grows without resizing or copying, and with a tail pointer an append is O(1).
Complexity: append O(1), prepend O(1), insertSorted O(n), delete O(n), search O(n), display O(n). Space O(n).

## Why Searching?  (`Searching.js`)
- **Linear Search** - O(n). Works on any data. Used for partial name/phone search.
- **Binary Search** - O(log n). Needs **sorted** data. The patient service first merge-sorts the records by the search field, then binary searches. The DSA demo refuses to run it on unsorted data and shows why.
- **Hash Map lookup** - average O(1), for exact Patient ID.
The result of every search includes the number of comparisons so the difference is visible.

## Why Sorting?  (`Sorting.js`)
**Merge Sort** is used for the patient list (ID, name, age, next appointment date, priority), for ordering history by visit date, and as the preparation step for Binary Search.
**Why Merge Sort:** O(n log n) in best, average and worst case; **stable** (equal items keep their order, so sorting by age keeps the earlier ID order among equal ages); simple to explain.
Space: O(n) for the temporary arrays.

## Summary table
| Structure / Algorithm | Operation | Complexity |
|---|---|---|
| Hash Map | Search | Average O(1) |
| Queue | Enqueue / Dequeue / Peek | O(1) |
| Priority Queue | Insert / Extract | O(log n) |
| Heap | Peek | O(1) |
| Linked List | Insert at end (tail kept) | O(1) |
| Linear Search | Search | O(n) |
| Binary Search | Search (sorted) | O(log n) |
| Merge Sort | Sort | O(n log n) |
