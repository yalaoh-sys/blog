import GithubSlugger from "github-slugger";

interface Heading {
  depth: 2 | 3;
  text: string;
  id: string;
}

export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const out: Heading[] = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[*_`[\]]/g, "");
    out.push({ depth: m[1].length as 2 | 3, text, id: slugger.slug(text) });
  }
  return out;
}

export function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;
  return (
    <nav aria-label="목차" className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
      <p className="mb-2 font-semibold">목차</p>
      <ol className="space-y-1">
        {headings.map((h) => (
          <li key={h.id} className={h.depth === 3 ? "pl-4" : ""}>
            <a href={`#${h.id}`} className="text-neutral-600 hover:text-blue-600 hover:underline dark:text-neutral-400">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
