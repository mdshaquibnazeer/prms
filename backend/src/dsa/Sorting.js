/**
 * Sorting.js - Merge Sort written by hand (no Array.prototype.sort anywhere).
 *
 * Merge Sort is "divide and conquer":
 *   1. split the array into two halves
 *   2. sort each half recursively
 *   3. merge the two sorted halves into one sorted array
 *
 * It is STABLE (equal items keep their original order) because when two
 * items compare equal we always take the one from the LEFT half first.
 *
 * Complexity: O(n log n) in best, average and worst case.
 * Space: O(n) for the temporary arrays used while merging.
 */

/** Default comparator for numbers and strings. */
function defaultCompare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Merge two already sorted arrays. O(left + right) */
function merge(left, right, compare, stats) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    stats.comparisons++;
    if (compare(left[i], right[j]) <= 0) result.push(left[i++]); // <= keeps the sort stable
    else result.push(right[j++]);
  }
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}

/**
 * Return a NEW sorted array (the input is not modified).
 * @param {Array}    array
 * @param {Function} compare  (a, b) => negative | 0 | positive
 * @param {object}   stats    optional { comparisons } object that will be filled in
 */
function mergeSort(array, compare = defaultCompare, stats = { comparisons: 0 }) {
  if (stats.comparisons === undefined) stats.comparisons = 0;
  if (array.length <= 1) return array.slice();
  const middle = Math.floor(array.length / 2);
  const left = mergeSort(array.slice(0, middle), compare, stats);
  const right = mergeSort(array.slice(middle), compare, stats);
  return merge(left, right, compare, stats);
}

/** True if the array is already in order according to compare. O(n) */
function isSorted(array, compare = defaultCompare) {
  for (let i = 1; i < array.length; i++) {
    if (compare(array[i - 1], array[i]) > 0) return false;
  }
  return true;
}

module.exports = { mergeSort, isSorted, defaultCompare };
