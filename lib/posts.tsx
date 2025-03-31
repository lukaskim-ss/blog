import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import { convertToEncoded } from './common';
import { convertToEncodedTags } from './tags';

export type PostData = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  content: string;
};

export function getPostDatas(): PostData[] {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fileNames = fs.readdirSync(postsDirectory);

  const postDatas = fileNames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    const slug = convertToEncoded(data.title);

    return {
      slug: slug,
      title: data.title,
      date: data.date,
      tags: convertToEncodedTags(data.tags),
      content: content,
    };
  });

  return postDatas.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );
}

export function getPostDatas2(tag: string): PostData[] {
  const postDatas = getPostDatas();
  return postDatas.filter(
    (postData) => postData.tags !== null && postData.tags.includes(tag)
  );
}

export function getPostDatas3(
  filter: (postData: PostData) => boolean
): PostData[] {
  const postDatas = getPostDatas();
  return postDatas.filter(filter);
}
