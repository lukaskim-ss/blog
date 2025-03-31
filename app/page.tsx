import PostTitle from '@/components/postTitle';
import { getPostDatas, PostData } from '@/lib/posts';

export default function Home() {
  return (
    <main className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16">
      <div className="space-y-16">
        {getPostDatas().map((postData: PostData) => (
          <PostTitle postData={postData} key={postData.slug} />
        ))}
      </div>
    </main>
  );
}
