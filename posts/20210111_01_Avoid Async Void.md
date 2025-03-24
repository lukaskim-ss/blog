---
title: Async/Await - Best Practices in Asynchronous Programming 1편 - Avoid Async Void
date: '2021-01-11T13:03:00.000Z'
tags: ['csharp', 'async', 'await']
---

[Concurrency in C# Cookbook, 2nd Edition](https://www.oreilly.com/library/view/concurrency-in-c/9781492054498/)을 읽어보던 중 강력히 추천하는 글이 있어서 찾아봤다. 내용이 상당히 괜찮아 보여서 공부할겸 정리해봤다. 책보다 내용이 더 어려웠던거는 함정. 원본은 [여기](https://docs.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming#avoid-async-void)서 볼 수 있다.

<!-- end -->

# Async/Await - Best Practices in Asynchronous Programming

이 글에서는 `async/await`를 잘 사용하기 위한 가이드라인과 예제들을 제공하고 있다. 제시하는 가이드라인은 다음과 같다.

| Name              | Description                                       | Exceptions                    |
| :---------------- | :------------------------------------------------ | :---------------------------- |
| Avoid async void  | Prefer async Task methods over async void methods | Event handlers                |
| Async all the way | Don’t mix blocking and async code                 | Console main method           |
| Configure context | Use ConfigureAwait(false) when you can            | Methods that require con­text |

위의 가이드라인이 직역하면 간단해 보이는데 내용은 전혀 그렇지 않았다. 하나씩 정리해보자.

# Avoid Async Void

비동기 메소드는 3가지의 반환타입을 가질 수 있다. `Task`, `Task<T>` 그리고 `void`가 그것이다. 동기 메소드에서 비동기 메소드로 바꿀 때 `void`는 `Task`로 특정 타입`T`는 `Task<T>`로 변환이 된다. 아래는 동일한 동작을 하는 코드다.

```csharp
void MyMethod()
{
  // Do synchronous work.
  Thread.Sleep(1000);
}
async Task MyMethodAsync()
{
  // Do asynchronous work.
  await Task.Delay(1000);
}
```

`void`를 리턴하는 비동기 함수는 특별한 목적을 가진다. 바로 비동기 이벤트 핸들러다. 언어의 문법적으로는 가능하지만 이벤트 핸들러의 개념상 리턴 타입이 있는것은 이상하다. 이벤트 핸들러가 `void`를 리턴하니(이벤트 핸들러는 호출만 할 뿐 리턴을 받아서 뭔가 처리하지 않음) 비동기 이벤트 핸들러는 `async void`가 된다.

`void`를 리턴하는 비동기 메소드는 에러를 처리하는 방식 다르다. `Task`와 `Task<T>`를 리턴하는 비동기 메소드의 경우, 예외가 발생하면 `Task` 객체를 통해서 예외를 캡처할 수 있다. 반면, `Task`가 없는 `void`를 리턴하는 비동기 함수에서 발생하는 모든 예외는 `async void`가 시작할 때 활성화되는 `SynchronizationContext`에서 바로 처리된다.

<span>이 부분이 좀 복잡한데, 일단은 **"`async void` 메소드 에서 발생한 예외는 메소드 밖으로 던져질 수 없다"** 정도로 넘어가자. 그 이유는 뒤에 따로 정리하겠다.</span>

다음 코드가 `async void`메소드 에서 발생한 예외를 메소드 밖에서 `catch`할 수 없는 상황을 보여주는 예제다.

```csharp
private async void ThrowExceptionAsync()
{
  throw new InvalidOperationException();
}
public void AsyncVoidExceptions_CannotBeCaughtByCatch()
{
  try
  {
    ThrowExceptionAsync();
  }
  catch (Exception)
  {
    // The exception is never caught here!
    throw;
  }
}
```

`Task`나 `Task<T>`를 리턴하는 비동기 메소드의 경우 `await`, `Task.WhenAny` 그리고 `Task.WhenAll`을 사용해 쉽게 작업이 완료되기를 대기할 수 있다. 반면, `void`를 리턴하는 비동기 메소드는 메소드가 끝나기를 대기하는 것이 간단하지 않다. `async void`메소드의 시작과 끝을 `SynchronizationContext`에 알리기 때문에 커스텀 `SynchronizationContext`를 만들면 예외처리가 가능할 것이다. 하지만, 일반적으로 그 방법은 너무 복잡하다.

<span>`async void`메소드의 예외를 왜 밖에서 잡기 힘든지에 대한 단서이다. `await`가 있어야 내부적으로 `TaskAwaiter`에 의해 외부에서 예외를 잡을 수 있게 된다. 이 부분도 뒤에서 설명하겠다.</span>

예외처리가 어려운 이유로 `async void`는 테스트도 어렵다. `MSTest asynchronous`테스팅은 `Task` 또는 `Task<T>`를 리턴하는 비동기 함수만 테스트를 지원한다. 커스텀 `SynchronizationContext`를 만들어서 `async void`메소드의 시작, 끝 그리고 예외를 처리할 수 있다. 그래도 `aysnc Task`나 `async Task<T>`를 사용하는 것이 훨씬 쉽다.

아래는 `async void`메소드를 사용하면서 테스트를 가능하게 하는 코드이다.

```csharp
private async void button1_Click(object sender, EventArgs e)
{
  await Button1ClickAsync();
}
public async Task Button1ClickAsync()
{
  // Do asynchronous work.
  await Task.Delay(1000);
}
```

만일 `async void`메소드의 호출자가 호출한 메소드가 `async`인것을 몰랐다면 큰 혼란을 일으킨다. 리턴타입이 `Task`일 때는 호출자는 호출한 메소드가 `future operation`임을 바로 알수 있다, 반면, 리턴타입이 `void`일 경우에 호출자는 메소드가 리턴이 되면 메소드가 완료가 됐다고 생각할 것이다.

이 문제는 예상하지 못 한 다양한 방식으로 발생할 수 있다. 인터페이스나 기본클래스에 `async void`를 구현하거나 오버라이드를 제공하는 것은 옳지 않다. 몇몇 이벤트들 또한 핸들러가 리턴되면 핸들러(`async void`)가 완료됐다고 생각할 것이다.

또 하나의 함정은, 어떤 메소드의 `Action`타입의 매개변수로 `async lambda`를 넘기게 되면 `async lambda`를 `void`를 리턴하게 되고 결국 `async void`가 가진 모든 문제를 그대로 가지게된다. `async lambda`는 `Task`를 반환하는 `delegate`타입(ex: `Func<Task>`)으로 변환되는 경우에만 사용해야한다.

요약하자면, `async Task`나 `async Task<T>`를 사용하는 것이 좋다. `async Task`는 에러 핸들링(예외처리), 조합 그리고 테스트를 하기가 쉽다. 예외적으로 비동기 이벤트 핸들러는 `void`를 리턴해야 한다. 이 예외사항에는 언어의 문법적으로는 이벤트 핸들러가 아니지만 논리적으로는 이벤트 핸들러일 경우도 해당된다(ex: `ICommand.Execute`).

# Aaync Void의 예외처리 문제 분석

이 내용을 정확히 알기 위해서는 `async`와 `await`를 컴파일러가 어떻게 해석하는지를 먼저 알아야 한다. 위의 예제코드를 IL코드로 바꿔보면 `ThrowExceptionAsync`메소드는 다음처럼 된다.

```csharp
class ThrowExceptionAsync_SM : IAsyncStateMachine // SM은 StateMachine 약자
{
    public AsyncTaskMethodBuilder __builder;
    private override MoveNext() // IAsyncStateMachine에서 override
    {
        try
        {
            throw new InvalidOperationException();
        }
        catch (Exception e)
        {
            __builder.SetException(e); // 1. 예외는 캐싱되는데
        }
    }
}

void ThrowExceptionAsync()
{
    ThrowExceptionAsync_SM stateMachine = new ThrowExceptionAsync_SM
    {
        __builder = AsyncTaskMethodBuilder.Create()
    };

    stateMachine.__builder.Start(ref stateMachine);
    // 2. 리턴할게 없다. 즉, 캐싱된 예외를 밖으로 넘길 수 없다
}
```

`MoveNext`메소드를 보자. `InvalidOperationException`예외가 `catch`에서 예외가 무사히 캐싱되는 것도 확인할 수 있다. 문제는 캐싱된 예외가 어떠한 형태로든 리턴될 때 넘어가야 하는데 리턴타입이 `void`라 어떤 것도 넘길 수 없다. 때문에 예외 처리는 여기서 끝나게 된다.

이번엔 `async Task`로 바꿔서 다시 IL코드를 뽑아보자.

```csharp
class ThrowExceptionAsync_SM : IAsyncStateMachine {} // 전과 동일

Task ThrowExceptionAsync()
{
    ThrowExceptionAsync_SM stateMachine = new ThrowExceptionAsync_SM
    {
        __builder = AsyncTaskMethodBuilder.Create()
    };

    stateMachine.__builder.Start(ref stateMachine);
    // 2. 리턴할 Task가 생겼다. Task는 예외를 캐싱하고 있다.
    return stateMachine.__builder.get_Task();
}
```

전과 비교하면 `Task`를 리턴하는 것 외에는 동일히다. `__builder`에 예외가 캐싱될 때 `Task`에도 예외가 전달되고 그 예외를 멤버로 가진 `Task`를 리턴할 수 있게 된다.

이제 예외를 제대로 처리할 수 있을까? 답은 "처리할 수 없다"이다. 예외가 캐싱된 `Task`가 리턴만 된 것이지 `Task`를 리턴할 때 예외가 발생하는 것은 아니기 때문이다.

하지만, `async Task`로 바꿈으로 인해서 <span>**`await`와 조합이 가능**</span>해진다. `await`를 사용하려면 호출자도 `async`가 붙어야 한다. 수정한 후에 다시 IL코드를 뽑아보자.

```csharp
void AsyncVoidExceptions_CannotBeCaughtByCatchAsync_SM.MoveNext()
{
    // 코드가 길어져서 멤버들은 생략
    try
    {
        try
        {
            if (__state == -1)
            {
                // 1. ThrowExceptionAsync실행
                Task task = ThrowExceptionAsync();
                __awaiter = task.GetAwaiter();

                if (__awaiter.get_IsCompleted() == false)
                {
                    __state = 0;
                    __builder.AwaitUnsafeOnCompleted(ref __awaiter, ref this);
                    return;
                }
            }
            // 2. Task의 결과를 가져올 때(GetResult) 예외가 캐싱되어 있음
            //    예외가 캐싱되어 있으면 다시 예외 발생
            __awaiter.GetResult();
        }
        catch
        {
            // 3. 이제 예외를 잡을 수 있다.
            throw;
        }
    }
    catch (Exception e)
    {
        __builder.SetException(e);
    }
    __builder.SetResult();
}
```

이제는 무사히 예외를 처리할 수 있다. 핵심은 `await`로 인해서 처리하는 과정에 `TaskAwaiter`가 생긴다는 것이다. `TaskAwaiter.GetResult`메소드가 실행될 때 `Task`에 예외가 캐싱되어 있다면 다시 예외가 발생하도록 되어 있다. 발생한 예외는 바로 밑의 `catch`에서 문제없이 잡을 수 있다.

즉, <span>**`async Task`와 `await`가 조합이 돼야 예외를 처리할 수 있다.**</span>

# 정리

- `async Task`나 `async Task<T>`를 사용하자
  - `await`와 조합되면 안전하게 예외처리가 가능하다
- `async void`는 위험하다
  - 예외처리가 힘들다
  - 그래서 테스트도 힘들다
  - `await`, `Task.WhenAny` 그리고 `Task.WhenAll` 등과 함께 사용할 수 없다
- 비동기 이벤트 핸들러에는 `async void`를 사용하자
