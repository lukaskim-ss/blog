---
title: Async/Await - Best Practices in Asynchronous Programming 4편 - Know Your Tools
date: '2021-02-02T13:03:00.000Z'
tags: ['csharp', 'async', 'await']
---

_Async/Await - Best Practices in Asynchronous Programming_ 시리즈의 마지막이다. _Know Your Tools_ 시작해보자.

<!-- end -->

# Know Your Tools

`async/await`는 배워야할 것이 매우 많다. 그렇기에 혼란이 오는 것은 자연스러운 일이다. 아래는 `async/await`의 문제 해결을 위한 방법을 간략하게 제시하고 있다.

| Problem                                         | Solution                                                                          |
| :---------------------------------------------- | :-------------------------------------------------------------------------------- |
| Create a task to execute code                   | `Task.Run` or `TaskFactory.StartNew` (not the `Task` constructor or `Task.Start`) |
| Create a task wrapper for an operation or event | `TaskFactory.FromAsync` or `TaskCompletionSource<T>`                              |
| Support cancellation                            | `CancellationTokenSource` and `CancellationToken`                                 |
| Report progress                                 | `IProgress<T>` and `Progress<T>`                                                  |
| Handle streams of data                          | TPL Dataflow or Reactive Extensions                                               |
| Synchronize access to a shared resource         | `SemaphoreSlim`                                                                   |
| Asynchronously initialize a resource            | `AsyncLazy<T>`                                                                    |
| Async-ready producer/consumer structures        | TPL Dataflow or `AsyncCollection<T>`                                              |

첫 번째는 `Task`를 생성하는 방법이다. 비동기 메소드는 `Task`를 생성할 수 있고 가장 쉬운 선택지이다. 코드가 스레드풀에서 작동하기를 원한다면 `Task.Run`이나 `TaskFactory.StartNew`를 사용하자.

이미 존재하는 비동기 오퍼레이션이나 이벤트를 위한 task wrapper를 생성하려면 `TaskCompletionSource<T>`를 사용하자.

다음은 cancellation과 progress reporting을 다루는 방식이다. Base Class Library (BCL)은 이 문제를 해결하기 위한 특별한 타입들을 제공하고있다. 바로 `CancellationTokenSource/CancellationToken` 그리고 `IProgress<T>/Progress<T>`가 그것이다. 비동기 코드들은 [TAP](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap?redirectedfrom=MSDN)(Task-based Asynchronous Pattern)를 사용하는 것이 좋다. TAP는 task의 생성, 취소(cancellation), 그리고 진행과정 보고(progress reporting)에 대해 자세히 설명하고 있다.

또 다른 문제는 비동기데이터 스트림을 다루는 방식에 대한 것이다. `Task`는 훌륭하지만, 단 하나의 객체만 리턴할 수 있고 단 한 번만 완료가 된다. 비동기스트림을 다루기 위해 TPL Dataflow나 Reactive Extensions(Rx)를 사용할 수 있다. TPL Dataflow는 "mesh"(that has an actor like fill to it<span>뭔 말인지 모르겠다</span>)를 생성하고 Rx는 더 효과적이고 강력하지만 배우기가 어렵다. TPL Dataflow와 Rx 둘 모두 비동기 코드에 잘 어울리는 메소드(async-ready)를 가지고 있다.

당신의 코드가 비동기라는 것이 멀티스레드 환경에서의 안전함을 의미하지는 않는다. 공유된 자원들은 여전히 보호되어야할 필요가 있다. 게다가, `lock`구문 안에서는 `await`를 사용할 수 없기에 더욱 복잡해진다. 아래 예제는 같은 스레드에서 실행이 되더라도 두 번 실행될 경우 공유된 상태가 망가지는 것을 보여준다.

```csharp
int value;

Task<int> GetNextValueAsync(int current);

async Task UpdateValueAsync()

{
  value = await GetNextValueAsync(value);
}
```

문제는 메소드가 `value`를 읽은 후에 `await`로 인해 스스로 잠시 멈추게 되는데, 메소드가 다시 재개될 때 `value`가 변하지 않았을 것이라고 가정하는데 있다. 이 문제를 해결하기 위해, `SemaphoreSlim` 클래스에 비동기 환경을 위한 `WaitAsync`가 추가됐다. 다음 코드는 `SemaphoreSlim.WaitAsync`의 사용예이다.

```csharp
SemaphoreSlim mutex = new SemaphoreSlim(1);

int value;

Task<int> GetNextValueAsync(int current);

async Task UpdateValueAsync()
{
  await mutex.WaitAsync().ConfigureAwait(false);

  try
  {
    value = await GetNextValueAsync(value);
  }
  finally
  {
    mutex.Release();
  }
}
```

비동기 코드는 종종 캐시되고 공유되는 리소스들을 초기화한다. C#에서 자체로 제공하는 기능에는 없지만, Stephen Toub가 `AsyncLazy<T>`(`Task<T>`와 `Lazy<T>`를 합친것 같은)를 개발했다. 오리지널 버전의 자세한 설명은 그의 블로그(<span>아쉽지만 페이지가 더 이상 존재하지 않는다.</span>)에서 확인 가능하다. 그리고 개선된 버전인 [AsyncEx library](https://github.com/StephenCleary/AsyncEx)는 여기서 확인할 수 있다.

마지막으로, 가끔 async-ready 자료구조가 필요할 때가 있다. TPL Dataflow는 `BufferBlock<T>`라는 producer/consumer 큐를 제공한다. AsyncEx는 `AsyncCollection<T>`를 제공하는데, `BlockingCollection<T>`를 대체할 수 있다.
