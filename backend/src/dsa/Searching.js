/**
 * Searching.js - Linear Search and Binary Search.
 *
 * Linear search  : check items one by one.          O(n)
 * Binary search  : repeatedly halve the search range. O(log n)
 *                  !! ONLY valid when the array is SORTED by the same key !!
 *
 * Every function also returns how many comparisons it made so the demo page
 * can show the difference between O(n) and O(log n).
 */
const { defaultCompare } = require('./Sorting');

/** Find the first item whose key equals target. O(n) */
function linearSearch(array, target, getKey = (x) => x) {
  let comparisons = 0;
  for (let i = 0; i < array.length; i++) {
    comparisons++;
    if (getKey(array[i]) === target) return { found: true, index: i, comparisons };
  }
  return { found: false, index: -1, comparisons };
}

/** Find ALL items matching predicate (used for partial text search). O(n) */
function linearSearchAll(array, predicate) {
  const indexes = [];
  let comparisons = 0;
  for (let i = 0; i < array.length; i++) {
    comparisons++;
    if (predicate(array[i])) indexes.push(i);
  }
  return { found: indexes.length > 0, indexes, comparisons };
}

/**
 * Binary search on a SORTED array. O(log n)
 * Returns the index of one match, plus the low/mid/high steps taken.
 */
function binarySearch(sortedArray, target, getKey = (x) => x, compare = defaultCompare) {
  let low = 0;
  let high = sortedArray.length - 1;
  let comparisons = 0;
  const steps = [];
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    const order = compare(getKey(sortedArray[mid]), target);
    steps.push({ low, mid, high });
    if (order === 0) return { found: true, index: mid, comparisons, steps };
    if (order < 0) low = mid + 1; // middle is smaller than target -> look right
    else high = mid - 1; // middle is bigger than target -> look left
  }
  return { found: false, index: -1, comparisons, steps };
}

/**
 * Binary search that returns every duplicate of the key (e.g. two patients with the same age).
 * Finds one match in O(log n) and then walks left/right while keys are equal.
 */
function binarySearchAll(sortedArray, target, getKey = (x) => x, compare = defaultCompare) {
  const first = binarySearch(sortedArray, target, getKey, compare);
  if (!first.found) return { found: false, indexes: [], comparisons: first.comparisons, steps: first.steps };
  let comparisons = first.comparisons;
  let start = first.index;
  let end = first.index;
  while (start > 0) {
    comparisons++;
    if (compare(getKey(sortedArray[start - 1]), target) !== 0) break;
    start--;
  }
  while (end < sortedArray.length - 1) {
    comparisons++;
    if (compare(getKey(sortedArray[end + 1]), target) !== 0) break;
    end++;
  }
  const indexes = [];
  for (let i = start; i <= end; i++) indexes.push(i);
  return { found: true, indexes, comparisons, steps: first.steps };
}

module.exports = { linearSearch, linearSearchAll, binarySearch, binarySearchAll };
