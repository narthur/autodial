import {searchLow} from "./search";

// Utility function for stepify. Takes a list of datapoints sorted by x-value
// and a given x-value and finds the most recent y-value (the one with the
// greatest x-value in d that's less than or equal to the given x).
// It's like Mathematica's Interpolation[] with interpolation order 0.
// If the given x is strictly less than d[0][0], return d[0][1].
function stepFunc(d: UnixDatapoint[], x: number): number {
  const i = Math.max(0, searchLow(d, (p) => p[0] - x));
  return d[i][1];
}

// Take a list of datapoints sorted by x-value and return a pure function that
// interpolates a step function from the data, always mapping to the most
// recent y-value.
function stepify(d: UnixDatapoint[]): (unixDelta: number) => number {
  return !d || !d.length ? () => 0 : (x) => stepFunc(d, x);
}

export default stepify;
