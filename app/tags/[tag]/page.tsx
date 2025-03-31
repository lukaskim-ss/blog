import PostTitle from '@/components/postTitle';
import { Metadata } from 'next';
import { getPostDatas3, PostData } from '@/lib/posts';
import { getTagDatas, TagData } from '@/lib/tags';

type Props = {
  params: Promise<{ tag: string }>;
};

export function generateStaticParams() {
  return getTagDatas().map((tagData) => ({
    tag: tagData.tag,
  }));
}

export default async function PostsInTag({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const filter = (postData: PostData) =>
    postData.tags !== null && postData.tags.includes(decodedTag);

  return (
    <main className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16">
      <div className="space-y-16">
        {getPostDatas3(filter).map((postData: PostData) => (
          <PostTitle postData={postData} key={postData.slug} />
        ))}
      </div>
    </main>
  );
}
