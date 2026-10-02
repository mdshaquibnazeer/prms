// Single entry point for all DSA classes/functions.
const HashMap = require('./HashMap');
const Queue = require('./Queue');
const MinHeap = require('./Heap');
const PriorityQueue = require('./PriorityQueue');
const { Node, LinkedList } = require('./LinkedList');
const { mergeSort, isSorted, defaultCompare } = require('./Sorting');
const { linearSearch, linearSearchAll, binarySearch, binarySearchAll } = require('./Searching');

module.exports = {
  HashMap, Queue, MinHeap, PriorityQueue, Node, LinkedList,
  mergeSort, isSorted, defaultCompare,
  linearSearch, linearSearchAll, binarySearch, binarySearchAll,
};
