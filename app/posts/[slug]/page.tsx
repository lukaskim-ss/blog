import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeToc from 'rehype-toc';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Metadata } from 'next';
import Image from 'next/image';

import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

import { getPostDatas } from '@/lib/posts';
import PostTitle from '@/components/postTitle';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const postDatas = getPostDatas();
  const postData = postDatas.find((post) => post.slug === decodedSlug);

  return {
    title: postData?.title ?? 'fuck',
  };
}

export function generateStaticParams() {
  return getPostDatas().map((postData) => ({
    slug: postData.slug,
  }));
}

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const postData = getPostDatas().find((post) => post.slug === decodedSlug);

  if (!postData) {
    return <div>Post not found. {decodedSlug}</div>;
  }

  return (
    <main className="w-full md:max-w-4xl mx-auto px-4 md:px-16">
      <PostTitle postData={postData} />
      {/* <article className="prose lg:prose-xl dark:prose-invert"> */}
      <article className="prose lg:prose-xl mx-auto">
        {/* 수식 처리를 위해서 rehypeSanitize다음에 rehypeKatex가 와야 한다 */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            rehypeSanitize,
            rehypeKatex,
            rehypeHighlight,
            rehypeSlug,
            rehypeToc,
          ]}
          components={{
            img: ({ node, ...props }) => (
              <Image
                {...props}
                src={props.src || '/default-image.png'}
                alt={props.alt || 'Markdown Image'}
                width={1024} // Set a default width
                height={1024} // Set a default height
              />
            ),
          }}
        >
          {postData.content}
        </ReactMarkdown>
      </article>
    </main>
  );
}
