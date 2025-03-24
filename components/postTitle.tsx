import Link from 'next/link';
import Tags from './tags';
import { PostData } from '@/lib/posts';

export default function PostTitle({ postData }: { postData: PostData }) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(postData.date));

  return (
    <div className="max-w-[65ch] lg:max-w-3xl mx-auto flex flex-col space-y-2">
      <Link href={`/posts/${postData.slug}`}>
        <h1 className="text-4xl lg:text-6xl font-extrabold">
          {postData.title}
        </h1>
      </Link>
      <p className="text-xl lg:text-2xl text-slate-400 font-extrabold">
        {formattedDate}
      </p>
      <Tags tags={postData.tags} />
    </div>
  );
}
