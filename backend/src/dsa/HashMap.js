/**
 * HashMap.js - a hand-written Hash Map (NOT the built-in JavaScript Map).
 *
 * Used in this project for: Patient ID -> Patient record lookup.
 *
 * How it works
 *  1. hash(key) turns the key (e.g. "P1001") into a number, then `% capacity`
 *     gives a bucket index.
 *  2. Each bucket holds a singly linked chain of nodes. If two keys land in
 *     the same bucket (a COLLISION) they are chained together.
 *     This technique is called SEPARATE CHAINING.
 *  3. When the load factor (size / capacity) passes 0.75 the table doubles
 *     its capacity and every entry is re-hashed (resize / rehash).
 *
 * Complexity (n = entries, load factor kept <= 0.75)
 *  set / get / has / delete : average O(1), worst case O(n) if every key collides
 *  resize                   : O(n), but it happens rarely -> amortised O(1) per set
 *  Space                    : O(n + capacity)
 */

class HashNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.next = null; // next node in the same bucket (collision chain)
  }
}

class HashMap {
  /**
   * @param {number} size    initial number of buckets
   * @param {object} options { autoResize: boolean, maxLoadFactor: number }
   */
  constructor(size = 16, options = {}) {
    this.capacity = Math.max(1, Math.floor(size));
    this.autoResize = options.autoResize !== false;
    this.maxLoadFactor = options.maxLoadFactor || 0.75;
    this.buckets = new Array(this.capacity).fill(null);
    this._count = 0;
  }

  /** Polynomial string hash (djb2 style): h = h * 33 + charCode, kept in 32 bits. */
  hash(key) {
    const str = String(key);
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(h, 33) + str.charCodeAt(i)) >>> 0;
    }
    return h % this.capacity;
  }

  get size() {
    return this._count;
  }

  /** Insert or update. Returns true if a NEW key was added, false if it updated. */
  set(key, value) {
    const index = this.hash(key);
    let node = this.buckets[index];
    let last = null;
    while (node) {
      if (node.key === key) {
        node.value = value; // key exists -> update
        return false;
      }
      last = node;
      node = node.next;
    }
    const fresh = new HashNode(key, value);
    if (last) last.next = fresh; // collision: append to the chain
    else this.buckets[index] = fresh;
    this._count++;

    if (this.autoResize && this._count / this.capacity > this.maxLoadFactor) {
      this._resize(this.capacity * 2);
    }
    return true;
  }

  /**
   * Look a key up and report what happened (bucket index, chain length, comparisons).
   * get() is built on top of this so the demo and the real code share one path.
   */
  lookup(key) {
    const index = this.hash(key);
    let node = this.buckets[index];
    let comparisons = 0;
    while (node) {
      comparisons++;
      if (node.key === key) {
        return { found: true, value: node.value, bucketIndex: index, comparisons };
      }
      node = node.next;
    }
    return { found: false, value: undefined, bucketIndex: index, comparisons };
  }

  get(key) {
    return this.lookup(key).value;
  }

  has(key) {
    return this.lookup(key).found;
  }

  /** Remove a key. Returns true if something was removed. */
  delete(key) {
    const index = this.hash(key);
    let node = this.buckets[index];
    let prev = null;
    while (node) {
      if (node.key === key) {
        if (prev) prev.next = node.next;
        else this.buckets[index] = node.next;
        this._count--;
        return true;
      }
      prev = node;
      node = node.next;
    }
    return false;
  }

  clear() {
    this.buckets = new Array(this.capacity).fill(null);
    this._count = 0;
  }

  /** Double (or change) the number of buckets and re-hash every entry. O(n). */
  _resize(newCapacity) {
    const old = this.buckets;
    this.capacity = newCapacity;
    this.buckets = new Array(newCapacity).fill(null);
    this._count = 0;
    for (const head of old) {
      let node = head;
      while (node) {
        const next = node.next;
        this._insertNode(node);
        node = next;
      }
    }
  }

  _insertNode(node) {
    node.next = null;
    const index = this.hash(node.key);
    if (!this.buckets[index]) {
      this.buckets[index] = node;
    } else {
      let tail = this.buckets[index];
      while (tail.next) tail = tail.next;
      tail.next = node;
    }
    this._count++;
  }

  entries() {
    const out = [];
    for (const head of this.buckets) {
      for (let node = head; node; node = node.next) out.push([node.key, node.value]);
    }
    return out;
  }

  keys() {
    return this.entries().map(([k]) => k);
  }

  values() {
    return this.entries().map(([, v]) => v);
  }

  /** Bucket-by-bucket view used by the DSA demonstration page. */
  getBuckets() {
    return this.buckets.map((head, index) => {
      const chain = [];
      for (let node = head; node; node = node.next) chain.push({ key: node.key, value: node.value });
      return { index, chain };
    });
  }

  getStats() {
    let used = 0;
    let longest = 0;
    for (const head of this.buckets) {
      if (!head) continue;
      used++;
      let len = 0;
      for (let node = head; node; node = node.next) len++;
      if (len > longest) longest = len;
    }
    return {
      capacity: this.capacity,
      size: this._count,
      usedBuckets: used,
      loadFactor: Number((this._count / this.capacity).toFixed(2)),
      longestChain: longest,
      collidingEntries: this._count - used, // entries that share a bucket with another key
    };
  }
}

module.exports = HashMap;
