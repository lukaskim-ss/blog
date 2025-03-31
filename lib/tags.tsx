import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import { convertToEncoded as convertToEncoded } from './common';

export type TagData = {
  tag: string;
  count: number;
};

export function convertToEncodedTags(tags: string[]): string[] {
  return tags.map((tag) => convertToEncoded(tag));
}

export function getTagDatas(): TagData[] {
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

    const encodedTags = convertToEncodedTags(data.tags);

    encodedTags.forEach((tag: string) => {
      if (tagRecord[tag] === undefined) {
        tagRecord[tag] = 1;
      } else {
        tagRecord[tag] = tagRecord[tag] + 1;
      }
    });
  });

  const tagDatas: TagData[] = Object.entries(tagRecord).map(([tag, count]) => ({
    tag,
    count,
  }));

  return tagDatas.sort((a, b) =>
    a.count < b.count ? 1 : a.count > b.count ? -1 : 0
  );
}
