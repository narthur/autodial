import dial from "./dial";
import * as time from "./time";
import {describe, it} from "@jest/globals";
import {e, makeGoal} from "./test/helpers";

const setNow = (yyyy: number, m: number, d: number) => {
  const value: number = Date.UTC(yyyy, m - 1, d, 12) / 1000;
  jest.spyOn(time, "now").mockReturnValue(value);
};

const expectEndRate = (roadall: Roadall, expected: number) => {
  const end = roadall[roadall.length - 1];

  e(end[2]).toEqual(expected);
};

const expectFuzzyEndRate = (roadall: Roadall, expected: number) => {
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
      roadall: [["20210125", 0, null], ["20210225", null, 1]],
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
      roadall: [["20210125", 0, null], ["20210201", null, 1]],
      datapoints: [["20210125", 1, "comment"]],
    }));

    expectEndRate(r, 1);
  });

  it("dials goal with datapoint after a month", () => {
    setNow(2021, 2, 24);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [["20210124", 0, null], ["20210224", null, 1]],
      datapoints: [["20210124", 0, "initial"], ["20210125", 1, "comment"]],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [["20210125", 1, "comment"]],
    }));

    expectEndRate(r, 0);
  });

  it("dials goal with datapoint after a week with runits=weekly", () => {
    setNow(2021, 2, 1);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "w",
      roadall: [["20210125", 0, null], ["20210201", null, 1]],
      datapoints: [["20210125", 1, "comment"]],
    }));

    expectFuzzyEndRate(r, 1);
  });

  it("dials goal with min option", () => {
    setNow(2021, 2, 25);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "w",
      roadall: [["20210125", 0, null], ["20210225", null, 1]],
      datapoints: [["20210126", 1, "comment"]],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 2, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 2, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 2, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 2, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 2, "comment"],
        ["20210201", 1, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 5, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 5, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 5, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 0, "comment"],
        ["20210202", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 5, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 5, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 5, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 4, "comment"],
        ["20210201", 5, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 1, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 2, "comment"],
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
      roadall: [["20210125", 0, null], ["20210301", null, 1]],
      datapoints: [
        ["20210125", 0, "initial"],
        ["20210201", 1, "comment"],
        ["20210201", 1, "comment"],
      ],
    }));

    expectFuzzyEndRate(r, 3 / 30);
  });

  it("protects akrasia horizon", async () => {
    setNow(2021, 2, 20);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [["20210125", 0, null], ["20210325", null, 1]],
      datapoints: [],
    }));

    e(r[1]).toEqual(["20210228", null, 1]);
  });

  it("does not add row if last segment starts after horizon", async () => {
    setNow(2021, 2, 20);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        ["20210125", 0, null],
        ["20210229", null, 1],
        ["20210325", null, 1],
      ],
      datapoints: [],
    }));

    e(r.length).toEqual(3);
  });

  it("uses fullroad to decide if akrasia boundary needed", async () => {
    setNow(2021, 2, 20);

    const r = dial(makeGoal({
      aggday: "last",
      kyoom: false,
      runits: "d",
      roadall: [
        ["20210125", 0, null],
        [null, 36, 1],
        ["20210325", null, 1],
      ],
      datapoints: [],
    }));

    e(r.length).toEqual(3);
  });
});

// TODO:
// does not add akrasia row if end segment does not intersect akrasia horizon
// does not dial goal if end of road is within akrasia horizon
// reject odom goals
