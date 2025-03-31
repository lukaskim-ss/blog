import { getTagDatas, TagData } from '@/lib/tags';
import Link from 'next/link';

function Tags() {
  const tagDatas = getTagDatas();

  return (
    <main className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16">
      <div className="max-w-[65ch] lg:max-w-3xl mx-auto flex flex-wrap gap-2 items-center">
        {tagDatas.map((tagData: TagData) => (
          <Link
            className="text-2xl lg:text-4xl font-extrabold rounded-md px-2 py-1 hover:text-sky-600"
            href={`/tags/${tagData.tag}`}
            key={tagData.tag}
          >
            {tagData.tag}({tagData.count})
          </Link>
        ))}
      </div>
    </main>
  );
}

export default Tags;
