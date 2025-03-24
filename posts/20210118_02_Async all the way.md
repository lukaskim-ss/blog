---
title: Async/Await - Best Practices in Asynchronous Programming 2편 - Async all the way
date: '2021-01-18T13:03:00.000Z'
tags: ['csharp', 'async', 'await']
---

지난 포스트(_Avoid Async Void_)에 이어서 *Async/Await - Best Practices in Asynchronous Programming*의 두 번째 규칙 *Async all the way*를 정리해보자.

<!-- end -->

# Async all the way

동기 코드를 비동기 코드로 바꿀 때 그 코드가 다른 비동기 코드에 의해 호출되거나 혹은 다른 비동기 코드를 호출할 때 가장 잘 작동함을 알 수 있다. 누군가는 비동기 코드가 퍼지는 모습을 보고 "전염성"이 있다거나 좀비 바이러스에 비교한다. 확실한 것은 비동기 코드는 주변의 코드들을 비동기가 되도록 유도한다. 이러한 특징은 `async/await`키워드를 떠나 모든 비동기 프로그래밍에 해당된다.

**"Async all the way"**가 뜻하는 것은 신중한 고려 없이는 <span>**동기와 비동기 코드를 섞지 말라는 것**</span>이다. 특히, `Task.Wait`나 `Task.Result`와 같은 메소드를 호출하여 비동기 코드를 블록하는 것은 좋지 않다. 비동기 프로그래밍을 하는 프로그래머에게 있어, 응용프로그램의 일부분을 동기 `API`로 래핑하고 나머지 부분을 변경된 내용으로부터 격리시킬 때 흔히 겪는 문제이다. 불행하게도, 그런경우 데드락에 걸리게 된다. MSDN forum, StackOverflow 그리고 이메일 등으로 비동기와 관련된 많은 답변을 준 결과, 비동기를 처음 접하는 프로그래머들에 있어 "왜 일부 비동기 코드에서 데드락이 발생하는가?"가 가장 빈번했던 질문이었다.

다음 코드는 어떤 메소드가 비동기 메소드의 결과를 블록시키고 있는 것을 보여준다. 이 코드는 콘솔에서는 문제가 없지만, GUI나 ASP.NET 컨텍스트에서 호출시 데드락이 발생한다. 이런 동작은 혼란스러울 수 있는데, 특히 디버거로 한 단계씩 진행할 때 절대 완료되지 않는 상태를 보여준다. 데드락이 발생하는 이유는 `Task.Wait`가 호출될 때 블록을 시키기 때문이다.

```csharp
public static class DeadlockDemo
{
  private static async Task DelayAsync()
  {
    await Task.Delay(1000);
  }
  // This method causes a deadlock when called in a GUI or ASP.NET context.
  public static void Test()
  {
    // Start the delay.
    var delayTask = DelayAsync();
    // Wait for the delay to complete.
    delayTask.Wait();
  }
}
```

이 데드락의 근본적인 원인은 `await`가 컨텍스트를 다루는 방식이다. 기본적으로, 아직 끝나지 않은 `Task`를 대기 중일 때, 현재의 컨텍스트는 캡처되고 `Task`가 완료되면 다시 메소드를 진행하는데 사용된다. 현재의 `SynchronizationContext`가 `null`이 아니라면 컨텍스트는 `SynchronizationContext`이다. 반면, `SynchronizationContext`가 `null`이라면 컨텍스트는 `TaskScheduler`가 된다. GUI와 ASP.NET 응용 프로그램은 한 번에 하나의 코드만 실행할 수 있는 `SynchronizationContext`를 가진다.

`await`가 끝나게 되면, `async` 메소드의 남아있는 코드를 캡처된 컨텍스트위에서 실행하려 한다. 하지만, 컨텍스트는 이미 동기적으로(synchronously) `async` 메소드가 완료되길 기다리고 있는 스레드를 가지고 있다. 서로 대기하는 상태가 되고 데드락이 발생한다.

위의 코드를 `WinForm`에서 실행된 코드라고 가정해보자. UI 스레드는 `DelayAsync`를 비동기로 실행시킨 후에 `delayTask.Wait`로 동기로 대기한다. 이렇게 UI 스레드는 `delayTask`가 완료되길 기다리면서 블록이 된다. `DealyAsync`에서는 `Task.Delay`가 끝나고 캡처된 컨텍스트가 가지고 있는 스레드(UI스레드)에서 나머지 코드를 실행하려하지만 해당 스레드는 `delayTask.Wait`에 의해 블록이 된 상태라 더 이상 진행하지 못한다.

콘솔 어플리케이션에서는 이런 데드락이 발생하지 발생하지 않는 것을 주목하자. 콘솔 어플리케이션은 한 번에 하나의 코드만 진행할 수 있는 `SynchronizationContext`대신 thread pool `SynchronizationContext`를 가진다. 그로인해 `await`가 종료되면 `async` 메소드의 남은 부분을 thread pool의 thread에 스케줄링한다. 메소드는 완료될 수 있고 `Task`를 반환할 수있고 데드락이 발생하지 않는다.

이러한 다른 작동방식은 혼란을 야기한다. 콘솔로 작성한 프로그램의 비동기 코드가 기대한데로 작동하는 것을 확인하고 그것과 똑같은 코드를 GUI나 ASP.NET으로 옮길 때 데드락이 발생한다.

이 문제를 해결하기 위한 가장 좋은 방법은 비동기 코드가 코드베이스를 통해 자연스럽게 퍼지도록 하는 것이다. 만약 이 해결책을 따르게 되면, 비동기 코드가 이벤트 핸들러나 컨트롤러 액션으로 확장되는 것을 볼 수 있다. ~~콘솔 어플리케이션은 이 해결책을 완전하게 따를 수 없는데, 이유는 `Main` 메소드가 `async`일 수 없기 때문이다. 만일, `Main` 메소드가 비동기라면 메소드가 끝나기 전에 리턴이 될 수 있어 프로그램이 종료가 될 것이다.~~ <span>C# 7.1부터는 `Main`도 `async`가 된다.</span>

다음 코드는 가이드라인에 대한 예외이다. 콘솔 어플리케이션의 `Main` 메소드는 비동기 메소드가 블록이 돼도 괜찮은 몇 안되는 상황중에 하나다.

```csharp
class Program
{
  static void Main()
  {
    MainAsync().Wait();
  }
  static async Task MainAsync()
  {
    try
    {
      // Asynchronous implementation.
      await Task.Delay(1000);
    }
    catch (Exception ex)
    {
      // Handle exceptions.
    }
  }
}
```

비동기 메소드가 코드베이스를 통해서 퍼져나가는 것이 최선이지만, 비동기 코드가 실질적으로 이득이 있는지 미리 자세히 살펴봐야한다. 거대한 코드베이스를 점진적으로 비동기 코드로 바꿔나가는 몇몇 기술들이 있으나, 이 글의 범위를 벗어나기에 여기서 다루지는 않는다. 몇몇의 경우 `Task.Wati`나 `Task.Result`의 사용이 부분적으로 변환하는데 도움은 되지만, 데다락 문제와 에러 핸들링(예외처리)에 대해 인지하고 있어야 한다. 지금부터 에러 처리에 대해 설명하고 다음에 어떻게 데드락 문제를 피할 수 있는지 보여주겠다.

모든 `Task`는 예외 리스트를 저장한다. `Task`를 대기할 때, 첫 번째 예외가 `rethrow`되면, 특별한 예외타입(`InvalidOperationException`)으로 잡을 수 있다. 그러나, `Task.Wait`나 `Task.Result`를 이용해 `Task`를 동기적으로 블록 시키면 모든 예외가 `AggregateException`으로 감싸져 `throw`된다.

위의 코드를 보면 `MainAsync`의 `try/catch`는 특정 예외를 잘 잡겠지만, `try/catch`가 `Main` 메소드에 있다면 `AggregateException`밖에 잡을 수 없게 된다. `AggregateException`가 없어야 예외를 처리하기 쉽기 때문에 `MainAsync` 메소드에 `try/catch`를 넣었다.

여기까지 비동기 코드에서 블락이 걸렸을 때 발생하는 두 가지 문제를 보여줬다. 데드락과 복잡한 예외처리가 그것이다.

비동기 코드에서 블락을 사용했을 때 발생하는 문제가 또 하나 있다. 다음 코드를 보자.

```csharp
public static class NotFullyAsynchronousDemo
{
  // This method synchronously blocks a thread.
  public static async Task TestNotFullyAsync()
  {
    await Task.Yield();
    Thread.Sleep(5000);
  }
}
```

이 메소드는 완전히 비동기적이지는 않다. 이 메소드는 바로 `yeild`할 것이고 완료되지 않은 `Task`를 반환하다. 그러나, 메소드가 다시 재개 될 때 스레드는 동기적으로 블록이 된다. 만약, 이 메소드가 GUI 컨텍스트에서 호출이 됐다면 GUI 스레드를 블락할 것이고, ASP.NET request 컨텍스트에서 호출이 됐다면 ASP.NET request 스레드를 블락할 것이다. 비동기 코드는 동기 블락이 없어야 가장 잘 작동한다. 아래의 표는 동기 오퍼레이션을 대체할 수 있는 비동기 오퍼레이션들이다.

| To Do This ...                           | Instead of This ...      | Use This           |
| :--------------------------------------- | :----------------------- | :----------------- |
| Retrieve the result of a background task | Task.Wait or Task.Result | await              |
| Wait for any task to complete            | Task.WaitAny             | await Task.WhenAny |
| Retrieve the results of multiple tasks   | Task.WaitAll             | await Task.WhenAll |
| Wait a period of time                    | Thread.Sleep             | await Task.Delay   |

두 번째 가이드라인을 요약하자면, <span>**비동기와 블록킹 코드를 섞어 쓰지 말라**</span>는 것이다. 둘을 섞어 쓰게 되면 데드락을 발생시킬 수 있고, 복잡한 예외처리가 필요하며 그리고 예상치 못 한 스레드의 블로킹이 발생한다. ~~이 가이드라인의 예외는 콘솔 어플리케이션의 `Main` 메소드이다.~~ <span>C# 7.1부터는 `Main`도 `async`가 된다.</span> 또는, 숙련된 사용에 한해 부분적인 비동기 코드베이스드를 관리할 수 있을 때이다.

# 정리

이미 두 번째 가이드의 시작과 끝에서 요약을 제대로 해주고 있어서 딱히 크게 정리할 내용은 없긴하지만 그래도 적자면,

- 비동기와 블록킹 코드를 섞어 쓰지 말자
  - 데드락을 발생시킬 수 있다
    - 콘솔은 thread pool을 사용하므로 문제 없다
    - GUI나 ASP.NET에서 문제가 발생한다
  - 복잡한 예외처리가 발생한다
  - 예상치 못 한 블로킹이 발생한다
