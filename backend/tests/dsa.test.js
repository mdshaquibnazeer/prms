// Run with:  npm test      (uses Node's built-in test runner, no extra packages)
const test = require('node:test');
const assert = require('node:assert');
const {
  HashMap, Queue, MinHeap, PriorityQueue, LinkedList,
  mergeSort, isSorted, linearSearch, linearSearchAll, binarySearch, binarySearchAll,
} = require('../src/dsa');

test('HashMap: set / get / has / delete', () => {
  const m = new HashMap(8);
  assert.strictEqual(m.set('P1001', 'Rahul'), true);
  assert.strictEqual(m.set('P1001', 'Rahul S'), false); // update, not new
  assert.strictEqual(m.get('P1001'), 'Rahul S');
  assert.strictEqual(m.has('P1001'), true);
  assert.strictEqual(m.has('P9999'), false);
  assert.strictEqual(m.delete('P1001'), true);
  assert.strictEqual(m.delete('P1001'), false);
  assert.strictEqual(m.size, 0);
});

test('HashMap: collisions are handled with separate chaining', () => {
  const m = new HashMap(1, { autoResize: false }); // 1 bucket -> everything collides
  ['A', 'B', 'C', 'D'].forEach((k, i) => m.set(k, i));
  assert.strictEqual(m.size, 4);
  assert.strictEqual(m.getStats().longestChain, 4);
  assert.strictEqual(m.get('C'), 2);
  assert.strictEqual(m.delete('B'), true);          // delete from the middle of a chain
  assert.strictEqual(m.get('C'), 2);
  assert.strictEqual(m.get('B'), undefined);
  assert.strictEqual(m.size, 3);
});

test('HashMap: resizes and keeps every entry', () => {
  const m = new HashMap(2);
  for (let i = 0; i < 100; i++) m.set('P' + i, i);
  assert.ok(m.capacity > 2);
  for (let i = 0; i < 100; i++) assert.strictEqual(m.get('P' + i), i);
  assert.strictEqual(m.size, 100);
});

test('Queue: FIFO order, peek, isEmpty, size', () => {
  const q = new Queue();
  assert.ok(q.isEmpty());
  q.enqueue('A'); q.enqueue('B'); q.enqueue('C');
  assert.strictEqual(q.size(), 3);
  assert.strictEqual(q.peek(), 'A');
  assert.strictEqual(q.dequeue(), 'A');
  assert.strictEqual(q.dequeue(), 'B');
  q.enqueue('D');
  assert.deepStrictEqual(q.toArray(), ['C', 'D']);
  assert.strictEqual(q.dequeue(), 'C');
  assert.strictEqual(q.dequeue(), 'D');
  assert.strictEqual(q.dequeue(), undefined);
  assert.ok(q.isEmpty());
});

test('MinHeap: extracts in ascending order and heapify works', () => {
  const h = new MinHeap();
  [5, 3, 8, 1, 9, 2, 7].forEach((x) => h.insert(x));
  assert.strictEqual(h.peek(), 1);
  const out = [];
  while (!h.isEmpty()) out.push(h.extractMin());
  assert.deepStrictEqual(out, [1, 2, 3, 5, 7, 8, 9]);

  const h2 = new MinHeap().heapify([9, 4, 7, 1, 8, 2]);
  assert.strictEqual(h2.peek(), 1);
  const arr = h2.toArray();
  for (let i = 1; i < arr.length; i++) assert.ok(arr[Math.floor((i - 1) / 2)] <= arr[i]); // heap property
});

test('PriorityQueue: critical first, FIFO for equal priority', () => {
  const pq = new PriorityQueue();
  pq.enqueue('Sara', 3);
  pq.enqueue('Aman', 2);
  pq.enqueue('Rahul', 1);
  pq.enqueue('Priya', 2);
  assert.strictEqual(pq.peek().item, 'Rahul');
  assert.deepStrictEqual(pq.toSortedArray().map((e) => e.item), ['Rahul', 'Aman', 'Priya', 'Sara']);
  assert.strictEqual(pq.dequeue().item, 'Rahul');
  assert.strictEqual(pq.dequeue().item, 'Aman');   // Aman arrived before Priya
  assert.strictEqual(pq.dequeue().item, 'Priya');
  assert.strictEqual(pq.dequeue().item, 'Sara');
  assert.ok(pq.isEmpty());
});

test('PriorityQueue.fromArray builds with heapify', () => {
  const pq = PriorityQueue.fromArray([{ n: 'x', p: 3 }, { n: 'y', p: 1 }, { n: 'z', p: 2 }], (o) => o.p);
  assert.strictEqual(pq.dequeue().item.n, 'y');
});

test('LinkedList: append, prepend, insertSorted, search, delete, display', () => {
  const l = new LinkedList();
  l.append(2); l.append(4); l.prepend(1); l.insertSorted(3, (a, b) => a - b); l.insertSorted(9, (a, b) => a - b);
  assert.deepStrictEqual(l.display(), [1, 2, 3, 4, 9]);
  assert.strictEqual(l.tail.data, 9);
  assert.strictEqual(l.search((x) => x === 4).position, 4);
  assert.strictEqual(l.search((x) => x === 42), null);
  assert.strictEqual(l.delete((x) => x === 9), 9);   // delete tail
  assert.strictEqual(l.tail.data, 4);
  assert.strictEqual(l.delete((x) => x === 1), 1);   // delete head
  assert.strictEqual(l.head.data, 2);
  assert.strictEqual(l.delete((x) => x === 77), undefined);
  assert.deepStrictEqual(l.display(), [2, 3, 4]);
  assert.strictEqual(l.size(), 3);
  assert.strictEqual(l.head.next.data, 3); // real node links
});

test('mergeSort: correct, stable, does not mutate input', () => {
  const input = [5, 2, 9, 1, 5, 6, -3, 0];
  const copy = input.slice();
  const stats = { comparisons: 0 };
  assert.deepStrictEqual(mergeSort(input, undefined, stats), [-3, 0, 1, 2, 5, 5, 6, 9]);
  assert.deepStrictEqual(input, copy);
  assert.ok(stats.comparisons > 0);
  const people = [{ n: 'a', age: 30 }, { n: 'b', age: 20 }, { n: 'c', age: 30 }, { n: 'd', age: 20 }];
  const sorted = mergeSort(people, (x, y) => x.age - y.age);
  assert.deepStrictEqual(sorted.map((p) => p.n), ['b', 'd', 'a', 'c']); // stable
  assert.deepStrictEqual(mergeSort([]), []);
  assert.ok(isSorted(sorted, (x, y) => x.age - y.age));
});

test('Linear and Binary search', () => {
  const unsorted = [40, 10, 30, 20];
  assert.strictEqual(linearSearch(unsorted, 30).index, 2);
  assert.strictEqual(linearSearch(unsorted, 99).found, false);
  assert.strictEqual(linearSearchAll(['aman', 'sara', 'amar'], (s) => s.startsWith('ama')).indexes.length, 2);

  const sorted = mergeSort([40, 10, 30, 20, 50, 60, 70, 80]);
  const r = binarySearch(sorted, 70);
  assert.strictEqual(sorted[r.index], 70);
  assert.ok(r.comparisons <= 4); // log2(8) + 1
  assert.strictEqual(binarySearch(sorted, 35).found, false);
  const dup = [1, 2, 2, 2, 3];
  assert.deepStrictEqual(binarySearchAll(dup, 2).indexes, [1, 2, 3]);
});
