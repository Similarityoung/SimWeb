export type HomeVisit = {
  path: string;
  seenHome: boolean;
  readArticle: boolean;
  sequence: number;
  arrival?: { id: number; kind: "arrival" | "return" };
};
const isArticle = (path: string) => /^\/(notes|thoughts)\/[^/]+\/?$/.test(path);
export function initialVisit(path: string): HomeVisit {
  return {
    path,
    seenHome: path === "/",
    readArticle: isArticle(path),
    sequence: 1,
    arrival: path === "/" ? { id: 1, kind: "arrival" } : undefined,
  };
}
export function nextVisit(previous: HomeVisit, path: string): HomeVisit {
  if (path === previous.path) return previous;
  const home = path === "/";
  const kind = !previous.seenHome
    ? "arrival"
    : previous.readArticle
      ? "return"
      : undefined;
  return {
    path,
    seenHome: previous.seenHome || home,
    readArticle: home ? false : previous.readArticle || isArticle(path),
    sequence: previous.sequence + 1,
    arrival: home && kind ? { id: previous.sequence + 1, kind } : undefined,
  };
}
