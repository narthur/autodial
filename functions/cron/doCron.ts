import {getUsers} from "./lib/database";
import {getGoal, getGoals, updateGoal} from "./lib/beeminder";
import dial from "./lib/dial";

export default async function doCron(): Promise<void> {
  const users = await getUsers();

  // eslint-disable-next-line camelcase
  await Promise.all(users.map(async ({beeminder_user, beeminder_token}) => {
    const all = await getGoals(beeminder_user, beeminder_token);
    const toDial = all.filter((g: Omit<Goal, "datapoints">) => {
      return g.fineprint?.includes("#autodial");
    });

    await Promise.all(toDial.map(async (g) => {
      const minMatches = g.fineprint?.match(/#autodialMin=(\d+)/);
      const maxMatches = g.fineprint?.match(/#autodialMax=(\d+)/);
      const min = minMatches ? parseInt(minMatches[1]) : undefined;
      const max = maxMatches ? parseInt(maxMatches[1]) : undefined;
      const fullGoal = await getGoal(beeminder_user, beeminder_token, g.slug);

      const roadall = dial(fullGoal, {min, max});

      if (!roadall) return;

      await updateGoal(beeminder_user, beeminder_token, g.slug, {roadall});
    }));
  }));
}
