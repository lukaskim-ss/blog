---
title: Async/Await - Best Practices in Asynchronous Programming 3편 - Configure Context
date: '2021-01-25T13:03:00.000Z'
tags: ['csharp', 'async', 'await']
---

_Async/Await - Best Practices in Asynchronous Programming_ 시리즈의 세 번째 규칙 *Configure Context*를 정리해보자. 이제 다 끝나간다.

<!-- end -->

# Configure Context

이 글의 초반에, 끝나지 않은 `Task`를 대기중일 때 "컨텍스트(context)"가 어떻게 캡처되고 비동기 메소드를 재개하기 위해 어떻게 사용되는지 살펴봤다. 아래의 코드(지난 포스팅의 코드 재사용)는 동기적으로 블록된 컨택스트의 코드를 재개하려할 때 어떻게 데드락을 발생시키는지 보여준다.

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

이 컨텍스트의 동작은 또 하나의 문제가 있는데 바로 퍼포먼스다. 비동기 GUI 어플리케이션이 커질수록, GUI스레드를 그들의 컨텍스트로 사용하는 많은 비동기 코드들을 볼 수 있다. 그 비동기 코드들은 반응성이 난도질된 것 처럼 느려지게 만든다. (맞는 번역인가? 원문: This can cause sluggishness as responsiveness suffers from “thousands of paper cuts.”).

이런 문제를 완화시키기 위해 `ConfigureAwait`의 결과를 가능한 많이 `await`로 대기하는것이 좋다. 다음 코드는 기본적인 컨텍스트와 `ConfigureAwait`의 동작을 보여준다.

```csharp
async Task MyMethodAsync()
{
  // Code here runs in the original context.
  await Task.Delay(1000);
  // Code here runs in the original context.
  await Task.Delay(1000).ConfigureAwait(
    continueOnCapturedContext: false);
  // Code here runs without the original
  // context (in this case, on the thread pool).
}
```

`ConfigureAwait`를 사용함으로, 작은 양의 병렬처리가 가능해졌다. 몇몇 비동기 코드는 해야할 것들을 지속적으로 강요하는 대신 GUI 스레드와 병렬적으로 수행이 가능하다.

성능적인 측면 외에도, `ConfigureAwait`는 또 다른 중요한 기능을 가지고 있다. 바로 데드락을 피하게 해준다. 지난 코드 중 데드락이 발생하는 코드를 다시 살펴보자. 만약 `DelayAsync` 메소드에서 `ConfigureAwait(false)`를 사용했다면 데드락은 발생하지 않았을 것이다. 이제는 `await`가 끝났을 때 비동기 메소드의 남은 코드들은 thread pool 컨텍스트에서 진행하게 된다. 결국, 데드락이 발생하지 않고 메소드는 끝까지 진행되어 `Task`를 리턴할 수 있게 된다. 이 테크닉은 어플리케이션을 동기에서 비동기로 점차 변경해야하는 상황에 꽤나 유용하다.

만약, `ConfigureAwaiat`를 메소드의 몇몇 부분에서 사용할 수 있다면, `await`가 있는 모든 부분에서 사용할 것을 추천한다. 컨텍스트는 아직 끝나지 않은 `Task`를 `await`할 때 캡처가 된다는 사실을 다시 한 번 기억해내자. 만약 `Task`가 이미 완료된 상황이라면 컨텍스트는 캡처되지 않는다. 몇몇 `Task`들은 하드웨어와 네트워크가 다른 환경에서 예상보다 빨리 끝나기도 한다. 이런 경우에, `await`가 되기 전의 완료된 `Task`들은 매우 섬세하게 다뤄야 한다. 아래는 수정된 코드다.

```csharp
async Task MyMethodAsync()
{
  // Code here runs in the original context.
  await Task.FromResult(1);
  // Code here runs in the original context.
  await Task.FromResult(1).ConfigureAwait(continueOnCapturedContext: false);
  // Code here runs in the original context.
  var random = new Random();
  int delay = random.Next(2); // Delay is either 0 or 1
  await Task.Delay(delay).ConfigureAwait(continueOnCapturedContext: false);
  // Code here might or might not run in the original context.
  // The same is true when you await any Task
  // that might complete very quickly.
}
```

`await`가 끝난 후 컨텍스트가 필요한 경우에 `ConfigureAwait`를 사용해서는 안된다. GUI 어플리케이션의 경우에 GUI요소 처리, 데이터 기반의 프로퍼티에 쓰거나, `Dispatcher/CoreDispatcher`와 같은 GUI에 종속된 타입을 다루는 것들이 해당된다. ASP.NET 어플리케이션의 경우, `HttpContext.Current`사용, ASP.NET response 빌드, controller action의 상태를 반환하는 것들이 해당된다. <span>`ConfigureAwait`를 사용하면 안되는 경우들을 설명하고 있는데 반은 어떤 경우인지 모르겠다. 실전에서 사용해봐야 좀 알거 같으니 나중에 다시 내용을 보강하자.</span>

아래의 코드는 GUI 어플리케이션에서 비동기 이벤트 사용에 대한 전형적인 패턴을 보여준다. 비동기 이벤트 핸들러 초반부에 컨트롤(버튼)을 비활성화 하고 적당히 `await`들을 수행한 후에 다시 컨트롤(버튼)을 활성화 하고 있다. 다시 컨트롤(버튼)을 활성화 시켜야하기에 컨텍스트를 포기할 수 없다. 즉, `ConfigureAwait`를 사용하지 말아야 GUI 스레드에서 컨트롤(버튼)을 활성화 할 수 있다.

각각의 비동기 메소드는 자신만의 컨텍스트를 가지고 있다. 때문에, 어떤 비동기 메소드가 다른 비동기 메소드를 호출할 경우 각각의 컨텍스트는 서로 독립적이다. 다음은 방금 전의 코드를 살짝 수정한 코드이다. <span>`HandleClickAsync`와 `button1_Click`은 서로 다른 비동기 메소드이기에 서로 독립적인 컨텍스트를 가지고 있다. 그러므로 `HandleClickAsync`내에서 `ConfigureAwait`를 사용할 수 있다.</span>

```csharp
private async Task HandleClickAsync()
{
  // Can use ConfigureAwait here.
  await Task.Delay(1000).ConfigureAwait(continueOnCapturedContext: false);
}
private async void button1_Click(object sender, EventArgs e)
{
  button1.Enabled = false;
  try
  {
    // Can't use ConfigureAwait here.
    await HandleClickAsync();
  }
  finally
  {
    // We are back on the original context for this method.
    button1.Enabled = true;
  }
}
```

컨텍스트에 자유로운 코드는 재활용하기가 더 쉽다. 컨텍스트에 민감한 코드와 컨텍스트에 자유로운 코드 사이에 벽을 만들고, 컨텍스트에 민감한 코드를 최소화 하도록 시도해야한다. 위의 코드처럼, 이벤트 핸들러의 핵심 로직들을 테스트가 가능하고 컨텍스트에 자유로운 `async Task`에 구현하고, 이벤트 핸들러에는 컨텍스트에 민감한 코드들을 최소화하는 것을 추천한다. 심지어 ASP.NET 어플리케이션을 작성하는 경우에도, 데스크탑 어플리케이션을 공유할 가능성이 있는 라이브러리를 사용중이라면, 라이브러리 코드에 `ConfigureAwait`를 사용하는 것을 고려해야 한다.

이번 가이드라인을 요약하자면, **"가능하다면 `ConfigureAwait`를 사용하자"**이다. 컨텍스트에 자유로운 코드는 GUI 어플리케이션에서 더 나은 성능을 발휘한다. 또한, 부분적으로 비동기 코드베이스에서 작업할 때 데드락을 피할 수 있는 유용한 기술이기도 하다. 이 가이드라인의 예외는 컨텍스트가 필요한 경우 뿐이다.
