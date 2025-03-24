---
title: Stuck 개발(삽질)일지 01 - POST로 FormData 전송하기
date: '2020-07-29T00:00:00.000Z'
tags: ['dotnet', 'react', 'csharp', 'javascript']
---

Html의 form으로 작성된 파일과 값들을 백엔드에 POST로 보내서 처리해야하는 상황. 기존에 작성해놨던 API로 그대로 받으려고 했더니... 역시나 안된다. 문제를 해결하는데 있어 주의해야 할 점을 정리해보자.

<!-- end -->

대강 구글링을 해봤더니 stackoverflow에 `multipart/form-data`를 설정하면 된다고 하더라. MS의 메뉴얼에도 역시 관련 내용이 적혀있었고...ㅋ 메뉴얼을 더 읽어보지 않고 `multipart/form-data`를 여기저기 설정하면서 삽질은 길어졌다. 역시 메뉴얼을 제대로 읽어봤어야 했다ㅠ

제대로 작동하게 하기위해 주의해야할 내용을 정리하면 다음과 같다.

1. Html의 input의 name과 FormData에 넣어주는 key를 일치
2. dotnet POST API로 받는 매개변수는 하나만 가능(이건 좀 더 확인해봐야 함)하며 매개변수 이름은 html의 input name과 일치
   - 단일 파일일 경우 : IFormFile
   - 여러 파일일 경우 : IFormFileCollection, IEnumerable\<IFormFile\>, List\<IFormFile\> 중
3. FormData가 여러 타입(ex: 파일 + 문자열)등을 보낼 경우 `[FromForm]` attribute를 사용
   - `[FromForm]` 으로 사용할 클래스를 정의할 때 프로퍼티는 html의 input name과 일치

아래는 정리한 내용을 적용해서 정상적으로 form을 통해 POST로 전송한 데이터를 서버에서 제대로 받아서 처리하는 샘플이다. Test.cs에 선언한 TestForm클래스의 각 프로퍼티 이름과 Test.jsx에서 POST로 전송할 FormData를 생성할 때 넣어주는 key 그리고 form의 각 input에 설정된 name이 모두 동일한 것을 볼 수 있다.

```csharp
// Test.cs
public class TestForm
{
    public string Title { get; set; }
    public string Desc { get; set; }
    public List<IFormFile> Files { get; set; }
}

[HttpPost]
public async Task<IActionResult> PostTest([FromForm] TestForm testForm)
{
    _logger.LogDebug(testForm.Title);
    _logger.LogDebug(testForm.Desc);
    foreach (var formFile in testForm.files)
    {
        if (formFile.Length > 0)
        {
            _logger.LogDebug(name);
        }
    }

    return Ok();
}
```

```jsx
// Test.jsx
import React, { useState, useEffect } from 'react';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

const FormDataPost = () => {
  // ...
  const onPost = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file, i) => {
      formData.append('files', file, file.name);
    });
    formData.append('title', title);
    formData.append('desc', desc);

    const response = await fetch('api/test', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <>
      <form>
        <input
          type="text"
          name="title"
          value={title}
          onChange={onChangeTitle}
        />
        <input type="text" name="desc" value={desc} onChange={onChangeDesc} />
        <input
          type="file"
          name="files"
          accept="image/*"
          onChange={onFileSelect}
          multiple
        />
        <button type="button" onClick={onPost}>
          upload
        </button>
      </form>
    </>
  );
};

export default FormDataPost;
```

깔끔하게 잘 작동한다. 다른 방법도 가능한데 나중에 `Razor`로 작업하게 되면 그 때 해봐야겠다.

# 참고

- https://docs.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads?view=aspnetcore-3.1
