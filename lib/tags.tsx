import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

export type TagData = {
  tag: string;
  count: number;
};

export const getTagDatas = (): TagData[] => {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fileNames = fs.readdirSync(postsDirectory);

  const tagRecord: Record<string, number> = {};
  fileNames.forEach((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    if (data.tags === null) {
      return;
    }

    data.tags.forEach((tag: string) => {
      if (tagRecord[tag] === undefined) {
        tagRecord[tag] = 1;
        console.log(`${tag} ${tagRecord[tag]}`);
      } else {
        tagRecord[tag] = tagRecord[tag] + 1;
        console.log(`${tag} ${tagRecord[tag]}`);
      }
    });

    console.log(tagRecord);
  });

  const tagDatas: TagData[] = Object.entries(tagRecord).map(([tag, count]) => ({
    tag,
    count,
  }));

  return tagDatas;
};

export const getTotalCount = (): number =>
  getTagDatas().reduce(
    (sum: number, tagData: TagData) => sum + tagData.count,
    0
  );

export const getShuffledTagDatas = (): TagData[] => {
  const tagDatas = getTagDatas();

  // Fisher-Yates Algorithm
  for (let i = tagDatas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagDatas[i], tagDatas[j]] = [tagDatas[j], tagDatas[i]];
  }

  return tagDatas;
};
