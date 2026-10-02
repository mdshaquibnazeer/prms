/**
 * LinkedList.js - Singly linked list built from real Node objects.
 *
 * Used in this project for: a patient's medical history. Every Node is one visit.
 *
 *   head -> [Visit 1] -> [Visit 2] -> [Visit 3] -> null
 *                                         ^ tail
 *
 * Why a linked list? A patient's history grows one visit at a time and is read
 * in order. A linked list grows without resizing/copying and appending at the
 * end is O(1) because we keep a tail pointer.
 *
 * Complexity
 *  append (tail kept)  O(1)      prepend  O(1)
 *  insertSorted        O(n)      delete   O(n)  (must find the node first)
 *  search              O(n)      display/toArray O(n)
 *  Space               O(n)
 */
class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  size() {
    return this._size;
  }

  isEmpty() {
    return this._size === 0;
  }

  /** Add at the end. O(1) because of the tail pointer. */
  append(data) {
    const node = new Node(data);
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this._size++;
    return node;
  }

  /** Add at the start. O(1) */
  prepend(data) {
    const node = new Node(data);
    node.next = this.head;
    this.head = node;
    if (!this.tail) this.tail = node;
    this._size++;
    return node;
  }

  /** Insert keeping the list ordered by compare(a, b). O(n) */
  insertSorted(data, compare) {
    if (!this.head || compare(data, this.head.data) < 0) return this.prepend(data);
    let current = this.head;
    while (current.next && compare(data, current.next.data) >= 0) current = current.next;
    const node = new Node(data);
    node.next = current.next;
    current.next = node;
    if (!node.next) this.tail = node;
    this._size++;
    return node;
  }

  /** Delete the first node whose data matches predicate. Returns the removed data or undefined. O(n) */
  delete(predicate) {
    let current = this.head;
    let prev = null;
    while (current) {
      if (predicate(current.data)) {
        if (prev) prev.next = current.next;
        else this.head = current.next;
        if (current === this.tail) this.tail = prev;
        this._size--;
        return current.data;
      }
      prev = current;
      current = current.next;
    }
    return undefined;
  }

  /** Find the first node whose data matches predicate. Returns { data, position, comparisons } or null. O(n) */
  search(predicate) {
    let current = this.head;
    let position = 0;
    while (current) {
      position++;
      if (predicate(current.data)) return { data: current.data, position, comparisons: position };
      current = current.next;
    }
    return null;
  }

  /** Walk the list head -> tail and return the data in order. O(n) */
  display() {
    return this.toArray();
  }

  toArray() {
    const out = [];
    for (let n = this.head; n; n = n.next) out.push(n.data);
    return out;
  }

  /** Describe the structure (head, each node and its next pointer) for the UI. */
  describe(getLabel = (d) => d) {
    const nodes = [];
    let position = 1;
    for (let n = this.head; n; n = n.next) {
      nodes.push({
        position,
        data: n.data,
        isHead: n === this.head,
        isTail: n === this.tail,
        nextPosition: n.next ? position + 1 : null,
        label: getLabel(n.data),
      });
      position++;
    }
    return { size: this._size, headPosition: this.head ? 1 : null, nodes };
  }
}

module.exports = { Node, LinkedList };
