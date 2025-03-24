import Link from 'next/link';

const Tags = ({ tags }: { tags: string[] }) => {
  if (!tags.length) {
    return null;
  }

  return (
    <ul className="list-none flex space-x-2">
      {tags.map((tag: string) => (
        <li
          className="flex items-center text-white bg-sky-700 rounded-md px-2 py-0 text-md lg:text-lg"
          key={tag}
        >
          <Link href={`/tags/${tag}/1`}>{tag}</Link>
        </li>
      ))}
    </ul>
  );
};

export default Tags;
