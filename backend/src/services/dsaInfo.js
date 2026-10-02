// Static explanations used by the "About / DSA" tab. Kept next to the code so the
// complexity table always describes the real implementation in src/dsa.
module.exports = {
  project: {
    objective: 'Manage patient records, appointments, emergencies and medical history efficiently, while showing how Data Structures and Algorithms solve real hospital-workflow problems.',
    problem: 'Hospitals need instant patient lookup, fair appointment order, life-saving emergency prioritisation and an organised visit history. Doing these with plain lists and repeated database scans is slow and hard to reason about.',
    stack: ['React + Tailwind CSS + React Router', 'Node.js + Express (REST API)', 'PostgreSQL (permanent storage)', 'JWT + bcrypt (authentication)', 'Custom DSA layer in backend/src/dsa'],
    databaseVsDsa: 'PostgreSQL is the permanent storage. The DSA structures are application-level structures built from database rows for fast processing and demonstration. The database primary key and the Hash Map key are different things.',
  },
  concepts: [
    { name: 'Hash Map', file: 'dsa/HashMap.js', usedFor: 'Patient ID lookup, duplicate-ID check and ID search.', why: 'Direct bucket access gives fast average-case lookup without scanning every patient. Collisions are handled with separate chaining.', complexity: 'get / set / has / delete: average O(1), worst O(n)', space: 'O(n + buckets)' },
    { name: 'Queue', file: 'dsa/Queue.js', usedFor: "Today's normal appointments.", why: 'First In, First Out keeps the waiting line fair: the earliest booking is served first.', complexity: 'enqueue O(1), dequeue O(1), peek O(1)', space: 'O(n)' },
    { name: 'Priority Queue', file: 'dsa/PriorityQueue.js', usedFor: 'Emergency patients.', why: 'A critical patient must be served before a normal patient regardless of arrival order. Equal priorities are served in arrival order.', complexity: 'insert O(log n), extract O(log n), peek O(1)', space: 'O(n)' },
    { name: 'Heap', file: 'dsa/Heap.js', usedFor: 'The engine inside the Priority Queue (binary min-heap in an array).', why: 'Keeps the most urgent item at the root, so peek is O(1) and re-balancing after insert/extract is only O(log n).', complexity: 'insert O(log n), extractMin O(log n), peek O(1), heapify O(n)', space: 'O(n)' },
    { name: 'Linked List', file: 'dsa/LinkedList.js', usedFor: "A patient's medical history (one node per visit).", why: 'Visits are added one at a time and read in order. A linked list grows without resizing, and with a tail pointer appending is O(1).', complexity: 'append O(1), prepend O(1), insert sorted O(n), delete O(n), search O(n)', space: 'O(n)' },
    { name: 'Linear Search', file: 'dsa/Searching.js', usedFor: 'Partial name / phone / ID search on unsorted records.', why: 'Works on any data, no preparation needed.', complexity: 'O(n)', space: 'O(1)' },
    { name: 'Binary Search', file: 'dsa/Searching.js', usedFor: 'Exact search on records that are sorted by the search field.', why: 'Halves the search range each step, so it needs far fewer comparisons, but ONLY on sorted data.', complexity: 'O(log n) (plus O(n log n) if the data must be sorted first)', space: 'O(1)' },
    { name: 'Merge Sort', file: 'dsa/Sorting.js', usedFor: 'Sorting patients by ID, name, age, appointment date and priority; ordering visit history.', why: 'Guaranteed O(n log n) in every case and stable (equal items keep their order).', complexity: 'O(n log n)', space: 'O(n)' },
  ],
  complexityTable: [
    { structure: 'Hash Map', operation: 'Search / insert / delete', complexity: 'Average O(1) (worst O(n))' },
    { structure: 'Queue', operation: 'Enqueue', complexity: 'O(1)' },
    { structure: 'Queue', operation: 'Dequeue', complexity: 'O(1)' },
    { structure: 'Queue', operation: 'Peek', complexity: 'O(1)' },
    { structure: 'Priority Queue', operation: 'Insert', complexity: 'O(log n)' },
    { structure: 'Priority Queue', operation: 'Extract', complexity: 'O(log n)' },
    { structure: 'Heap', operation: 'Insert', complexity: 'O(log n)' },
    { structure: 'Heap', operation: 'Extract min', complexity: 'O(log n)' },
    { structure: 'Heap', operation: 'Peek', complexity: 'O(1)' },
    { structure: 'Heap', operation: 'Heapify (build)', complexity: 'O(n)' },
    { structure: 'Linked List', operation: 'Insert at end (tail pointer kept)', complexity: 'O(1)' },
    { structure: 'Linked List', operation: 'Delete / search', complexity: 'O(n)' },
    { structure: 'Linear Search', operation: 'Search', complexity: 'O(n)' },
    { structure: 'Binary Search', operation: 'Search (sorted data only)', complexity: 'O(log n)' },
    { structure: 'Merge Sort', operation: 'Sort', complexity: 'O(n log n)' },
  ],
};
