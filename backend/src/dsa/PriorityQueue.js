/**
 * PriorityQueue.js - Priority Queue built on top of the Binary Min-Heap.
 *
 * Used in this project for: the emergency queue.
 *   priority 1 = Critical, 2 = Emergency, 3 = Normal
 *   LOWER number = HIGHER urgency, so the min-heap root is always the most urgent patient.
 *
 * Patients with the same priority are served in arrival order (FIFO). To make
 * that work every entry also gets an increasing sequence number `seq` that is
 * used as a tie-breaker.
 *
 * Complexity: enqueue O(log n), dequeue O(log n), peek O(1), isEmpty O(1), size O(1)
 *             fromArray (bulk build with heapify) O(n)
 */
const MinHeap = require('./Heap');

class PriorityQueue {
  constructor() {
    this.seq = 0;
    this.heap = new MinHeap((a, b) => a.priority - b.priority || a.seq - b.seq);
  }

  /** Add an item with a priority number. O(log n) */
  enqueue(item, priority) {
    this.heap.insert({ item, priority, seq: this.seq++ });
    return this.heap.size();
  }

  /** Remove and return the most urgent entry { item, priority, seq }. O(log n) */
  dequeue() {
    return this.heap.extractMin();
  }

  /** Most urgent entry without removing it. O(1) */
  peek() {
    return this.heap.peek();
  }

  isEmpty() {
    return this.heap.isEmpty();
  }

  size() {
    return this.heap.size();
  }

  /** Build a queue from many items at once using heapify - O(n). */
  static fromArray(items, getPriority) {
    const pq = new PriorityQueue();
    const entries = items.map((item) => ({ item, priority: getPriority(item), seq: pq.seq++ }));
    pq.heap.heapify(entries);
    return pq;
  }

  /** Non-destructive list in service order (clones the heap and extracts all: O(n log n)). */
  toSortedArray() {
    const copy = this.heap.clone();
    const out = [];
    while (!copy.isEmpty()) out.push(copy.extractMin());
    return out;
  }

  /** Raw heap array (array-form of the binary tree) for the demo page. */
  toHeapArray() {
    return this.heap.toArray();
  }
}

module.exports = PriorityQueue;
