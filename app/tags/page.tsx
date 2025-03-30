import { getShuffledTagDatas, getTotalCount, TagData } from '@/lib/tags';
import Link from 'next/link';

function Tags() {
  const totalCount = getTotalCount();
  const suffledTagDatas = getShuffledTagDatas();

  return (
    <main className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16">
      <div className="max-w-[65ch] lg:max-w-3xl mx-auto flex flex-wrap gap-2 items-center">
        {suffledTagDatas.map((tagData: TagData) => {
          const rawFontSize = (tagData.count / totalCount) * 25 + 1.0;
          const fontSize = Math.round(rawFontSize * 2) / 2;
          const fontSizeStyle = `text-[${fontSize}rem]`;
          console.log(fontSizeStyle);
          return (
            <span
              className={`${fontSizeStyle} font-extrabold rounded-md px-2 py-1 hover:text-sky-700`}
              id={tagData.tag}
            >
              <Link href={`/tags/${tagData.tag}`}>{tagData.tag}</Link>
            </span>
          );
        })}
      </div>
    </main>
  );
}

export default Tags;
