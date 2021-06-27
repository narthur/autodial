// -----------------------------------------------------------------------------
// The following pair of functions -- searchHigh and searchLow -- take a sorted
// array and a distance function. A distance function is like an "is this the
// element we're searching for and if not, which way did it go?" function. It
// takes an element of a sorted array and returns a negative number if it's too
// small, a positive number if it's too big, and zero if it's just right. Like
// if you wanted to find the number 7 in an array of numbers you could use `x-7`
// as a distance function.                                     L     H
//   Sorted array:                                [-1,  3,  4, 7, 7, 7,  9,  9]
//   Output of distance function on each element: [-8, -4, -3, 0, 0, 0, +2, +2]
// So searchLow would return the index of the first 7 and searchHigh the last 7.
// Or in case of no exact matches...                        L   H
//   Sorted array:                                [-1,  3,  4,  9,  9]
//   Output of distance function on each element: [-8, -4, -3, +2, +2]
// In that case searchLow returns the (index of the) 4 and searchHigh the 9. In
// other words, searchLow errs low, returning the biggest element less than the
// target if the target isn't found. And searchHigh errs high, returning the
// smallest element greater than the target if the target isn't found.
// In the case that every element is too low...                     L   H
//   Sorted array:                                [-2, -2, -1,  4,  6]
//   Output of distance function on each element: [-9, -9, -8, -3, -1]
// As you'd expect, searchLow returns the last index (length minus one) and
// searchHigh returns one more than that (the actual array length).
// And if every element is too big...           L   H
//   Sorted array:                                [ 8,  8,  9, 12, 13]
//   Output of distance function on each element: [+1, +1, +2, +5, +6]
// Then it's the opposite, with searchHigh giving the first index, 0, and
// searchLow giving one less than that, -1.
// HISTORICAL NOTE:
// We'd found ourselves implementing and reimplementing ad hoc binary searches
// all over the Beebrain code. Sometimes they would inelegantly do O(n)
// scooching to find the left and right bounds in the case of multiple matches.
// So we made this nice general version.
// -----------------------------------------------------------------------------

// Take a sorted array (sa) and a distance function (df) and do a binary search,
// returning the index of an element with distance zero, erring low per above.
// Review of the cases:
// 1. There exist elements of sa for which df is 0: return index of first such
// 2. No such elements: return the price-is-right index (highest w/o going over)
// 3. Every element too small: return n-1 (the index of the last element)
// 4. Every element is too big: return -1 (one less than the first element)
// *This is like finding the infimum of the set of just-right elements.*
export function searchLow<T>(sa: T[], df: (e: T) => number): number {
  if (!sa || !sa.length) return -1; // empty/non-array => every element too big

  let li = -1; // initially left of the leftmost element of sa
  let ui = sa.length; // initially right of the rightmost element of sa
  let mi; // midpoint of the search range for binary search

  while (ui - li > 1) {
    mi = Math.floor((li + ui) / 2);
    if (df(sa[mi]) < 0) li = mi;
    else ui = mi;
  }
  return ui === sa.length || df(sa[ui]) !== 0 ? li : ui;
}

// Take a sorted array (sa) and a distance function (df) and do the same thing
// as searchLow but erring high. Cases:
// 1. There exist elements of sa for which df is 0: return index of last such
// 2. No such elements: return the least upper bound (lowest w/o going under)
// 3. Every element is too small: return n (one more than the last element)
// 4. Every element is too big: return 0 (the index of the first element)
// *This is like finding the supremum of the set of just-right elements.*
export function searchHigh<T>(sa: T[], df: (e: T) => number): number {
  if (!sa || !sa.length) return 0; // empty/non-array => every element too small

  let li = -1; // initially left of the leftmost element of sa
  let ui = sa.length; // initially right of the rightmost element of sa
  let mi; // midpoint of the search range for binary search

  while (ui - li > 1) {
    mi = Math.floor((li + ui) / 2);
    if (df(sa[mi]) <= 0) li = mi;
    else ui = mi;
  }
  return li === -1 || df(sa[li]) !== 0 ? ui : li;
}
