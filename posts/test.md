---
title: test
date: '2022-08-24T00:00:00.000Z'
tags: ['cpp', 'std', 'tuple']
---

# Heading level 1

# Heading level 1

Hello, **Markdown**! Hello

**tuple<double, bool>**

**tuple<T, Types...>::\_value**

A paragraph with _emphasis_ and **strong importance**.

`private static async Task DelayAsync`

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

- Lists
- [ ] todo
- [x] done

![멋진 이미지](/resources/202502_report.png)

A table:

| Name              | Description                                       | Exceptions                    |
| :---------------- | :------------------------------------------------ | :---------------------------- |
| Avoid async void  | Prefer async Task methods over async void methods | Event handlers                |
| Async all the way | Don’t mix blocking and async code                 | Console main method           |
| Configure context | Use ConfigureAwait(false) when you can            | Methods that require con­text |

```csharp {1,3-4} showLineNumbers
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

- Foo
- Bar
  - Baz
    - Nope?
  - Hai?

# IOCP를 제어하기

IOCP를 제어하기 위한 핸들러를 생성하는 역할. CreateIoCompletionPort함수를 이용해 생성된 핸들러로 GetQueuedCompletionStatus, PostQueuedcompletionStatus 등의 함수로 CompletionQueue로 이벤트를 받아오거나 이벤트를 날릴 수 있다.

## 처리할 이벤트

처리할 이벤트가 발생할 때 까지 대기하는 함수. 이벤트가 발생하면 GetQueuedCompletionStatus에 의해 thread가 깨어나서 작동하게 된다.

### CreateIoCompletionPort로

CreateIoCompletionPort로 생성된 핸들러에게 처리해야할 이벤트가 있음을 알린다. 해당 함수로 이벤트를 날리면 GetQueuedCompletionStatus로 대기중인 thread중에서 여유가 있는 thread가 꺠어나서 작동하게 된다.

### 생성된 핸들러에

CreateIoCompletionPort로 생성된 핸들러에게 처리해야할 이벤트가 있음을 알린다. 해당 함수로 이벤트를 날리면 GetQueuedCompletionStatus로 대기중인 thread중에서 여유가 있는 thread가 꺠어나서 작동하게 된다.

## AcceptEx, ConnectEx, WSASend

AcceptEx, ConnectEx, WSASend, WSARecv 등의 비동기 함수에 이용된다.

## 네트워크IO 외에도 커스텀 이

네트워크IO 외에도 커스텀 이벤트를 처리할 때에도 유용하게 사용할 수 있다. 예를 들어 실시간으로 생성되는 task를 여러 thread에서 분산처리하도록 할 수 있다.
