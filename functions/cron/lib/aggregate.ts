import {sum} from "lodash";
import {parseDate} from "./time";

type DirtyData = (Datapoint | undefined)[]
type Reducer = (values: number[]) => number | undefined

function aggregateByDate(data: Datapoint[], reduce: Reducer): DirtyData {
  const dates: string[] = Array.from(new Set(data.map((p) => p.daystamp)));
  return dates.map((d: string) => {
    const points = data.filter((p) => p.daystamp === d);
    const reduced = reduce(points.map((p) => p.value));

    if (reduced === undefined) return;

    return {
      daystamp: d,
      timestamp: parseDate(d),
      value: reduced,
    };
  });
}

const uniqueMean = (vals: number[]) => {
  const unique = Array.from(new Set(vals));
  return sum(unique) / unique.length;
};

// https://stackoverflow.com/a/53660837/937377
function median(numbers: number[]) {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

const methodMap: Partial<{[k in Aggday]: Reducer}> = {
  "last": (vals) => vals.pop(),
  "first": (vals) => vals.shift(),
  "sum": (vals) => sum(vals),
  "min": (vals) => Math.min(...vals),
  "max": (vals) => Math.max(...vals),
  "count": (vals) => vals.length,
  "binary": (vals) => +!!vals.length,
  "nonzero": (vals) => +!!vals.filter((v) => v).length,
  "truemean": (vals) => sum(vals) / vals.length,
  "mean": uniqueMean,
  "uniqmean": uniqueMean,
  "median": median,
  "cap1": (vals) => Math.min(sum(vals), 1),
  "square": (vals) => Math.pow(sum(vals), 2),
  "triangle": (vals) => (sum(vals) * (sum(vals) + 1)) / 2,
};

function getDirtyAggregates(
    data: Datapoint[],
    method: Aggday
): DirtyData {
  const reducer = methodMap[method];

  if (!reducer) {
    throw new Error("Unsupported aggday method!");
  }

  return aggregateByDate(data, reducer);
}

export default function aggregate(
    data: Datapoint[],
    method: Aggday
): Datapoint[] {
  const aggregated = getDirtyAggregates(data, method);

  return aggregated.filter((p): p is Datapoint => p !== undefined);
}
