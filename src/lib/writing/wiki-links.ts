import type { Root, PhrasingContent } from "mdast";
import { visit } from "unist-util-visit";

const wikiLink = /\[\[([^\[\]\n]+)\]\]/g;

export function remarkWikiLinks(targets: Readonly<Record<string, string>>) {
  return (tree: Root) => {
    visit(tree, "text", (node, index, parent) => {
      if (
        index === undefined ||
        !parent ||
        parent.type === "link" ||
        parent.type === "linkReference"
      )
        return;

      const replacements: PhrasingContent[] = [];
      let end = 0;
      for (const match of node.value.matchAll(wikiLink)) {
        const start = match.index;
        if (start > end)
          replacements.push({
            type: "text",
            value: node.value.slice(end, start),
          });

        const [rawTarget, rawLabel] = match[1].split("|", 2);
        const target = rawTarget.trim().replace(/\.md$/i, "");
        const href = targets[target];
        if (!href) throw new Error(`Unpublished wiki link target: ${target}`);

        replacements.push({
          type: "link",
          url: href,
          children: [
            {
              type: "text",
              value: rawLabel?.trim() || target.split("/").at(-1) || target,
            },
          ],
        });
        end = start + match[0].length;
      }

      if (!replacements.length) return;
      if (end < node.value.length)
        replacements.push({ type: "text", value: node.value.slice(end) });
      parent.children.splice(index, 1, ...replacements);
      return index + replacements.length;
    });
  };
}
