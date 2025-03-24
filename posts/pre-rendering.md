---
title: 'Two Forms of Pre-rendering'
date: '2020-01-01'
tags: ['가', 'c++', 'c#']
---

Next.js has two forms of pre-rendering: **Static Generation** and **Server-side Rendering**. The difference is in **when** it generates the HTML for a page.

- **Static Generation** is the pre-rendering method that generates the HTML at **build time**. The pre-rendered HTML is then _reused_ on each request.
- **Server-side Rendering** is the pre-rendering method that generates the HTML on **each request**.

Importantly, Next.js let's you **choose** which pre-rendering form to use for each page. You can create a "hybrid" Next.js app by using Static Generation for most pages and using Server-side Rendering for others.

`testtest`

```javascript
export const getStaticProps = async () => {
  const allPostsData: MarkDownData[] = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
};
```

```csharp
var random = new Random();
var rewardItems = new Dictionary<long, RewardItemInfo>();
for (var i = 0; i < 100; i++)
{
    var newRewardItemInfo = new RewardItemInfo(
        random.NextInt64(90000000, 100000000),
        random.NextInt64(1, 99),
        DateTime.Now.AddMinutes(random.NextDouble()),
        random.NextInt64(100000000) % 2 == 0 ? true : false,
        random.NextInt64(100000000) % 2 == 0 ? true : false,
        random.NextInt64(100000000) % 2 == 0 ? true : false);

    rewardItems.TryAdd(newRewardItemInfo.Guid, newRewardItemInfo);
}
```
