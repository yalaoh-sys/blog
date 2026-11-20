import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// 허용 목록 기반 sanitize: script/iframe/on* 차단, 코드 하이라이트용 className 만 허용
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./]],
    input: [...(defaultSchema.attributes?.input ?? []), "checked", "disabled", "type"],
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-content space-y-4 leading-7 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:text-neutral-500 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 dark:[&_code]:bg-neutral-800 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-neutral-100 [&_pre]:p-3 dark:[&_pre]:bg-neutral-900 [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2 [&_ul]:list-disc [&_ul]:pl-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema]]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
