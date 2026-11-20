import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";

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
    <div className="prose-content space-y-4 leading-8 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:text-neutral-500 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:text-[0.9em] dark:[&_code]:bg-neutral-800 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-10 [&_h2]:scroll-mt-20 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:scroll-mt-20 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-neutral-100 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 dark:[&_pre]:bg-neutral-900 [&_table]:block [&_table]:overflow-x-auto [&_table]:border-collapse [&_td]:border [&_td]:px-3 [&_td]:py-1.5 [&_th]:border [&_th]:bg-neutral-50 [&_th]:px-3 [&_th]:py-1.5 dark:[&_th]:bg-neutral-900 [&_ul]:list-disc [&_ul]:pl-6">
      {/* sanitize 를 먼저 적용해야 rehype-slug 가 만든 id 가 접두어 없이 유지된다 */}
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema], rehypeSlug]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
