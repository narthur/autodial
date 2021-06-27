import dial from "./dial";
import * as time from "./time";
import {describe, it} from "@jest/globals";
import {e, makeGoal} from "./test/helpers";
import {parseDate} from "./time";

const setNow = (yyyy: number, m: number, d: number): number => {
  const value: number = Date.UTC(yyyy, m - 1, d, 12) / 1000;
  jest.spyOn(time, "now").mockReturnValue(value);
  return value;
};

const expectEndRate = (roadall: Roadall | false, expected: number) => {
  if (!roadall) {
    throw new Error("Rate not adjusted");
  }

  const end = roadall[roadall.length - 1];

  e(end[2]).toEqual(expected);
};

const expectFuzzyEndRate = (roadall: Roadall | false, expected: number) => {
  if (!roadall) {
    throw new Error("Rate not adjusted");
  }

  const end = roadall[roadall.length - 1];

  e(end[2]).toFuzzyEqual(expected);
};

describe("dial function", () => {
  it("dials goal with no datapoints", () => {
    setNow(2021, 2, 25);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210225"), null, 1],
      ],
      datapoints: [],
    }));

    expectEndRate(r, 0);
  });

  it("does not adjust goal with less than 30d history", () => {
    setNow(2021, 1, 25);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210201"), null, 1],
      ],
      datapoints: [{daystamp: "20210125", value: 1}],
    }));

    expect(r).toBeFalsy();
  });

  it("dials goal with datapoint after a month", () => {
    setNow(2021, 2, 24);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210124"), 0, null],
        [parseDate("20210224"), null, 1],
      ],
      datapoints: [{daystamp: "20210124", value: 0}, {
        daystamp: "20210125",
        value: 1,
      }],
    }));

    expectFuzzyEndRate(r, 1 / 30);
  });

  // for now we'll expect this to autodial to zero when you've entered no data
  // in a month but eventually we'll want to treat that as a bug. autodialer
  // should never give you an infinitely flat road that never makes you do
  // anything ever again.
  it("dials goal with more than a month of data", () => {
    setNow(2021, 3, 1);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [{daystamp: "20210125", value: 1}],
    }));

    expectEndRate(r, 0);
  });

  it("dials goal with datapoint after a week with runits=weekly", () => {
    setNow(2021, 2, 25);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "w",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210325"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210126", value: 30 / 7},
      ],
    }));

    expectFuzzyEndRate(r, 1);
  });

  it("dials goal with min option", () => {
    setNow(2021, 2, 25);

    const r = dial(makeGoal({
      slug: "my_special_slug",
      aggday: "last",
      kyoom: false,
      runits: "w",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210225"), null, 1],
      ],
      datapoints: [{daystamp: "20210126", value: 1}],
    }),
    {min: 2});

    expectEndRate(r, 2);
  });

  it("supports aggday last", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 2},
      ],
    }));

    expectFuzzyEndRate(r, 2 / 30);
  });

  it("supports aggday first", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "first",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 2},
      ],
    }));

    expectFuzzyEndRate(r, 1 / 30);
  });

  it("supports aggday sum", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "sum",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 2},
      ],
    }));

    expectFuzzyEndRate(r, 3 / 30);
  });

  it("supports aggday min", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "min",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 2},
      ],
    }));

    expectFuzzyEndRate(r, 1 / 30);
  });

  it("supports aggday max", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "max",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 2},
        {daystamp: "20210201", value: 1},
      ],
    }));

    expectFuzzyEndRate(r, 2 / 30);
  });

  it("supports aggday count", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "count",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 5},
        {daystamp: "20210201", value: 5},
      ],
    }));

    // because data is not cumulative, initial day aggregates to 1,
    // and additional day aggregates to 2, so difference is 1
    expectFuzzyEndRate(r, 1 / 30);
  });

  it("supports cumulative goals", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "count",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 5},
        {daystamp: "20210201", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 2 / 30);
  });

  it("supports aggday binary", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "binary",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 5},
        {daystamp: "20210201", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 1 / 30);
  });

  it("supports aggday nonzero", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "nonzero",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 0},
        {daystamp: "20210202", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 1 / 30);
  });

  it("supports aggday truemean", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "truemean",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 5},
        {daystamp: "20210201", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 5 / 30);
  });

  it("supports aggday mean", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "mean",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 5},
        {daystamp: "20210201", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 5 / 30);
  });

  it("supports aggday uniquemean", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "uniqmean",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 5},
        {daystamp: "20210201", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 5 / 30);
  });

  it("supports aggday median", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "median",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 4},
        {daystamp: "20210201", value: 5},
      ],
    }));

    expectFuzzyEndRate(r, 4 / 30);
  });

  it("supports aggday cap1", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "cap1",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 1},
      ],
    }));

    expectFuzzyEndRate(r, 1 / 30);
  });

  it("supports aggday square", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "square",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 2},
      ],
    }));

    expectFuzzyEndRate(r, 9 / 30);
  });

  it("supports aggday triangle", () => {
    setNow(2021, 2, 29);

    const r = dial(makeGoal({
      aggday: "triangle",
      kyoom: true,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210301"), null, 1],
      ],
      datapoints: [
        {daystamp: "20210125", value: 0},
        {daystamp: "20210201", value: 1},
        {daystamp: "20210201", value: 1},
      ],
    }));

    expectFuzzyEndRate(r, 3 / 30);
  });

  it("protects akrasia horizon", async () => {
    setNow(2021, 3, 1);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210325"), null, 1],
      ],
      datapoints: [],
    }));

    e(r && r[1]).toEqual([parseDate("20210309"), null, 1]);
  });

  it("does not add row if last segment starts after horizon", async () => {
    setNow(2021, 2, 25);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [parseDate("20210305"), null, 1],
        [parseDate("20210325"), null, 1],
      ],
      datapoints: [],
    }));

    e(r && r.length).toEqual(3);
  });

  it("uses fullroad to decide if akrasia boundary needed", async () => {
    setNow(2021, 2, 25);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        [parseDate("20210125"), 0, null],
        [null, 40, 1],
        [parseDate("20210325"), null, 1],
      ],
      datapoints: [],
    }));

    e(r && r.length).toEqual(3);
  });
});

// TODO:
// does not add akrasia row if end segment does not intersect akrasia horizon
// does not dial goal if end of road is within akrasia horizon
// reject odom goals
