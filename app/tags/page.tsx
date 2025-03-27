import { getTagDatas, TagData } from '@/lib/tags';

function Tags() {
  return (
    <main className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-16">
      <div className="space-y-16">
        {getTagDatas().map((tagData: TagData) => (
          <h2>
            {tagData.tag}:{tagData.count}
          </h2>
        ))}
      </div>
    </main>
  );
}

export default Tags;
