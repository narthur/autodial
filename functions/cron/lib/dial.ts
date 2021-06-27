import {now, parseDate} from "./time";

import stepify from "./stepify";
import aggregate from "./aggregate";
import {AKRASIA_HORIZON, SID, UNIT_SECONDS} from "./constants";

// Take list of datapoints and a window (in seconds), return average rate in
// that window.
function avgrate(data: Datapoint[], window: number) {
  if (!data || !data.length) return 0;

  // convert daystamps to unixtimes
  const unixData: UnixDatapoint[] = data.map((p) => {
    return [parseDate(p.daystamp), p.value];
  });

  // now we can stepify the data and get a data function, df, that maps any
  // unixtime to the most recent y-value as of that unixtime:
  const df = stepify(unixData); // df is the data function

  const preTime = now() - window - 1;

  const valNow = df(now());
  const valBefore = df(preTime);
  const vdelta = valNow - valBefore;

  return vdelta / window;
}

// Clip x to be at least a and at most b: min(b,max(a,x)). Swaps a & b if a > b.
function clip(x: number, a: number, b: number) {
  if (a > b) [a, b] = [b, a];
  return x < a ? a : x > b ? b : x;
}

function autoSum(data: Datapoint[]): Datapoint[] {
  return data.reduce((prev: Datapoint[], p) => {
    const last = prev[prev.length - 1];
    const sum = last ? last.value + p.value : p.value;
    return [...prev, {...p, value: sum}];
  }, []);
}

type Options = {
  min?: number,
  max?: number
}

// Takes a goal g which includes roadall and data, returns new roadall
export default function dial(g: Goal, opts: Options = {}): Roadall | false {
  const firstRow = g.roadall[0];

  if (!firstRow[0]) {
    throw new Error("Goal road has no initial daystamp!");
  }

  const t = now();
  const window = Math.min(30 * SID, t - firstRow[0]);
  const shouldDial = window >= 30 * SID;

  if (!shouldDial) return false;

  const {min = -Infinity, max = Infinity} = opts;
  const siru = UNIT_SECONDS[g.runits]; // seconds in rate units
  const lastRow = g.roadall[g.roadall.length - 1];
  const aggregatedPoints = aggregate(g.datapoints, g.aggday);
  const summed = g.kyoom ? autoSum(aggregatedPoints) : aggregatedPoints;
  const arps = avgrate(summed, window); // avg rate per second
  const newRate = shouldDial ? clip(arps * siru, min, max) : lastRow[2];
  const tail = g.roadall.slice(0, -1);
  const lastRowModified: Roadall[0] = [lastRow[0], lastRow[1], newRate];
  const fullTail = g.fullroad.slice(0, -1);
  const unixTimes = fullTail.map((r) => r[0]);
  const shouldAddBoundary = !unixTimes.some((ut) => ut >= t + AKRASIA_HORIZON);

  if (!shouldAddBoundary) {
    return [
      ...tail,
      lastRowModified,
    ];
  }

  return [
    ...tail,
    [t + AKRASIA_HORIZON, null, lastRow[2]],
    lastRowModified,
  ];
}
