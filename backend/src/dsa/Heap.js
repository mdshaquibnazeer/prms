/**
 * Heap.js - Binary Min-Heap stored in an array.
 *
 * Used in this project as the engine of the Priority Queue (emergency patients).
 *
 * Heap property: every parent is "smaller" than (or equal to) its children,
 * so the smallest element is always at index 0 (the root).
 *
 *   parent(i) = floor((i - 1) / 2)     left(i) = 2i + 1     right(i) = 2i + 2
 *
 * A comparator (a, b) => negative | 0 | positive decides which element is
 * "smaller". For numbers the default comparator is a - b.
 *
 * Complexity
 *  insert      O(log n)  - add at the end, then sift UP
 *  extractMin  O(log n)  - move last item to the root, then sift DOWN
 *  peek        O(1)
 *  heapify     O(n)      - bottom-up build from an unsorted array
 *  Space       O(n)
 */
class MinHeap {
  constructor(compare = (a, b) => a - b) {
    this.compare = compare;
    this.heap = [];
    this.lastSwaps = []; // [[i, j], ...] swaps done by the last operation (for the demo)
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length ? this.heap[0] : undefined;
  }

  /** Add a value. O(log n) */
  insert(value) {
    this.lastSwaps = [];
    this.heap.push(value);
    this._siftUp(this.heap.length - 1);
    return this.heap.length;
  }

  /** Remove and return the smallest value (undefined if empty). O(log n) */
  extractMin() {
    this.lastSwaps = [];
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._siftDown(0);
    }
    return min;
  }

  /**
   * Build a valid heap from an unsorted array in O(n).
   * Start at the last parent and sift every parent down.
   */
  heapify(array) {
    this.lastSwaps = [];
    this.heap = array.slice();
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this._siftDown(i);
    }
    return this;
  }

  _swap(i, j) {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
    this.lastSwaps.push([i, j]);
  }

  _siftUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.heap[i], this.heap[parent]) < 0) {
        this._swap(i, parent);
        i = parent;
      } else break;
    }
  }

  _siftDown(i) {
    const n = this.heap.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < n && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  toArray() {
    return this.heap.slice();
  }

  clone() {
    const copy = new MinHeap(this.compare);
    copy.heap = this.heap.slice();
    return copy;
  }
}

module.exports = MinHeap;
