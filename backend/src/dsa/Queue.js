/**
 * Queue.js - FIFO queue (First In, First Out).
 *
 * Used in this project for: the normal (priority 3) appointment flow.
 *
 * Implemented with a singly linked list that keeps BOTH head and tail pointers.
 * A plain array.shift() would be O(n) because every element moves one place;
 * with head/tail pointers both enqueue and dequeue are O(1).
 *
 *   front (head) -> [A] -> [B] -> [C] <- back (tail)
 *   dequeue removes A, enqueue adds after C.
 *
 * Complexity: enqueue O(1), dequeue O(1), peek O(1), isEmpty O(1), size O(1)
 * Space: O(n)
 */
class QueueNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class Queue {
  constructor() {
    this.head = null; // front of the queue
    this.tail = null; // back of the queue
    this._size = 0;
  }

  /** Add to the back. O(1) */
  enqueue(value) {
    const node = new QueueNode(value);
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this._size++;
    return this._size;
  }

  /** Remove and return the front item (undefined if empty). O(1) */
  dequeue() {
    if (!this.head) return undefined;
    const node = this.head;
    this.head = node.next;
    if (!this.head) this.tail = null;
    this._size--;
    return node.value;
  }

  /** Look at the front item without removing it. O(1) */
  peek() {
    return this.head ? this.head.value : undefined;
  }

  isEmpty() {
    return this._size === 0;
  }

  size() {
    return this._size;
  }

  clear() {
    this.head = this.tail = null;
    this._size = 0;
  }

  /** Front -> back snapshot (O(n)), used for display only. */
  toArray() {
    const out = [];
    for (let n = this.head; n; n = n.next) out.push(n.value);
    return out;
  }
}

module.exports = Queue;
