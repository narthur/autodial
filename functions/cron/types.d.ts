// TODO: Only have one types.d.ts
// TODO: Verify these types are correct
type Roadall = [number | null, number | null, number | null][]
type Fullroad = [number, number, number][]
type Datapoint = {
  daystamp: string,
  timestamp: number,
  value: number
}
type UnixDatapoint = [number, number]

// https://help.beeminder.com/article/97-custom-goals#aggday
type Aggday =
  "last"
  | "first"
  | "min"
  | "max"
  | "truemean"
  | "mean"
  | "uniqmean"
  | "median"
  | "mode"
  | "trimmean"
  | "sum"
  | "binary"
  | "nonzero"
  | "triangle"
  | "square"
  | "clocky"
  | "count"
  | "skatesum"
  | "cap1"

type Goal = {
  slug: string,
  aggday: Aggday,
  kyoom: boolean,
  runits: "h" | "d" | "w" | "m" | "y",
  roadall: Roadall,
  fullroad: Fullroad
  datapoints: Datapoint[]
  fineprint: string | null
}

type User = {
  "beeminder_token": string,
  "beeminder_user": string
}
