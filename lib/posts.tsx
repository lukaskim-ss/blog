import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

export type PostData = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  content: string;
};

export function getPostDatas(): PostData[] {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);

  const postDatas = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    const slug = data.title
      .replace(/C\+\+/g, 'Cpp') // Replace 'C++' with 'Cpp'
      .replace(/c\+\+/g, 'cpp') // Replace 'c++' with 'cpp'
      .replace(/C#/g, 'CSharp') // Replace 'C#' with 'CSharp'
      .replace(/c#/g, 'csharp')
      .replace(/[^a-zA-Z0-9가-힣\s\-._~]/g, '')
      .replace(/\s+/g, '+');

    return {
      slug: slug,
      title: data.title,
      date: data.date,
      tags: data.tags,
      content: content,
    };
  });

  return postDatas.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );
}
