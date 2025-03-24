---
title: C# async/await 원리
date: '2021-01-01T13:03:00.000Z'
tags: ['csharp', 'async', 'await']
---

.NET Framework 4.5에 *async*와 `await`가 추가되면서 `Asynchronous Programming`을 보다 쉽게 작성할 수 있게 됐다. 문제는 잘 사용하기에는 쉽지 않다는 것. `.NET`환경에서 `async`와 `await`에 대해 정리해보자.

<!-- end -->

# async/await 사용 예제

`async/await`를 제대로 까보기 위해 간단한 예제를 만들었다. 매개변수로 받은 시간만큼 대기했다가 콘솔로그를 찍는 단순한 메소드다. 이 코드를 이용해서 `async`와 `await`의 원리를 알아보자.

```csharp
class AsyncAwait
{
    async Task DelayAsync(int ms)
    {
        await Task.Delay(ms);
        Console.WriteLine($"DelayAsync End. ms:{ms}");
    }
}
```

# async의 원리

예제 코드의 IL코드를 보면 어떤 형태로 작동하는지 알 수 있다. IL코드를 그대로 보면 너무 길고 복잡해서 알아보기 쉽게 정리를 했다. 먼저 `async Task DelayAsync`메소드는 아래와 같은 형태가 된다.

```csharp
Task DelayAsync(int ms)
{
    DelayAsyncStateMachine stateMachine = new DelayAsyncStateMachine
    {
        __builder = AsyncTaskMethodBuilder.Create(),
        __this = this,
        __ms = ms,
        __state = -1,
    };

    stateMachine.__builder.Start(ref stateMachine);
    return stateMachine.__builder.get_Task();
}
```

`async`키워드를 만나면 컴파일러가 상태관리를 위해 `IAsyncStateMachine`를 상속받은 클래스(`DelayAsyncStateMachine`)를 생성해 메소드가 원래 하려던 작업을 대신하게 한다. `DelayAsyncStateMachine.Start`가 호출 되면 내부적으로 `DelayAsyncStateMachine.MoveNext`가 실행된다. 관련 내용은 아래 코드에 있다.

```csharp
class DelayAsyncStateMachine : IAsyncStateMachine
{
    public int32 __state;
    public AsyncTaskMethodBuilder __builder;
    public int32 __ms; // DelayAsync메소드의 매개변수
    public AsyncAwait __this; // DelayAsync메소드를 가지고 있는 class
    private TaskAwaiter __awaiter;

    private override MoveNext() // IAsyncStateMachine에서 override
    {
        int32 state;
        TaskAwaiter awaiter;
        DelayAsyncStateMachine stateMachine;
        Exception exception;

        state = __state;
        try
        {
            if (state == -1)
            {
                // Task실행후 그것을 대기하는 TaskAwaiter획득
                Task task = Task.Delay(__ms);
                awaiter = task.GetAwaiter();

                if (awaiter.get_IsCompleted() == false)
                {
                    // 스테이트 변경하고 클래스 속성에 TaskAwaiter저장
                    __state = state = 0;
                    __awaiter = awaiter;
                    stateMachine = this;

                    // Task가 종료되면 다시 MoveNext가 호출 되도록 예약
                    __builder.AwaitUnsafeOnCompleted(ref awaiter, ref stateMachine);
                    return;
                }
            }
            else
            {
                awaiter = __awaiter;
                __awaiter = new TaskAwaiter();
                __state = state = -1;
            }
            awaiter.GetResult();
            // 원본 코드의 Task.Delay다음에 발생한 콘솔로그 코드
            Console.WriteLine($"DelayAsync End. ms:{__ms}");
        }
        catch (Exception e)
        {
            exception = e;
            __state = -2;
            __builder.SetException(exception);
        }

        __state = -2;
        __builder.SetResult();
    }
}
```

코드가 길지만 하는 일은 꽤 단순한다. 스테이트로 관리되는 부분의 코드를 살펴보면 원래의 `async Task DelayAsync`메소드 안의 내용이 모두 들어가 있는 것을 확인할 수 있다(주석확인).

먼저, `MoveNext`에 처음 진입할 때는 `Task`를 생성하고 `TaskAwaiter`를 획득한다. 이 때 작업이 빨리끝나면 동기로 한 번에 처리되는 경우도 있다.

이어서, `AwaitUnsafeOnCompleted`를 호출해 작업이 완료되면 다시 `MoveNext`가 호출되도록 예약을 한다. 이 때 매개변수로 `TaskAwaiter`와 `DelayAsyncStateMachine`가 넘어가기 때문에 다시 `MoveNext`가 호출될 수 있게 된다.

작업이 완료되고 다시 `MoveNext`가 호출되면 남은 원본 코드가 실행된다. 이 때에는 다른 스레드에서 진행된다. 위 코드에서는 콘솔로그가 실행됐다. 이 때 발생한 예외는 `try/catch`로 처리 가능하다.

최종적으로 `AsyncTaskMethodBuilder.SetResult`로 `Task`의 결과가 저장되어 비동기 메소드를 호출한 부분에서 결과를 받아 볼 수 있게된다.

# await의 원리

이제 `await`가 무슨 일을 했는지 살펴보자. 원본 코드에서 `await`만 제거하고 다시 dotPeek을 이용해 IL코드를 살펴봤다. 사라진 부분을 통해서 `await`의 원리를 파악할 수 있다.

```csharp
class DelayAsyncStateMachine : IAsyncStateMachine
{
    public int32 __state;
    public AsyncTaskMethodBuilder __builder;
    public int32 __ms; // DelayAsync메소드의 매개변수
    public AsyncAwait __this; // DelayAsync메소드를 가지고 있는 class

    private override MoveNext() // IAsyncStateMachine에서 override
    {
        int32 state;
        Exception exception;

        state = __state; // DelayAsyncStateMachine생성시 -1로 초기화
        try
        {
            // awaiter가 업어서 원본 코드가 그대로 들어감
            Task.Delay(__ms);
            Console.WriteLine($"DelayAsync End. ms:{__ms}");
        }
        catch (Exception e)
        {
            __state = -2;
            __builder.SetException(exception);
            exception = e;
        }

        __state = -2;
        __builder.SetResult();
    }
}
```

`await`가 제거 되기 전의 코드와 비교해보면 `Task`를 대기하기 위한 `TaskAwaiter`와 관련된 내용이 모두 사라진 것을 알 수 있다. `TaskAwaiter`가 없기 때문에 `AwaitUnsafeOnCompleted`도 사용할 수 없어 한 번에 원본 코드의 내용을 모두 처리하게 된다.

즉, `await`키워드는 `Task`를 대기하면서 비동기 코드를 안전하게 처리하기 위한 `TaskAwaiter`를 생성하는 역할을 한다.

# 정리

쓰기에는 단순해 보여도 실제로 `async`와 `await`키워드는 많은 일을 하고 있었다. 간단히 정리해보자.

- `async`는 비동기 처리를 위한 `IAsyncStateMachine`을 상속받는 클래스 생성
- `async`는 각기 다른 스레드에서 실행될 수 있게 상태에 맞게 원본 코드를 분리하고 재배치
- `async`는 예외처리를 캐싱하기 위해 `try/catch`로 원본 코드를 처리
- `await`는 비동기 처리를 대기를 위해 `TaskAwaiter`를 생성
- `await`가 있어야지만 `async`가 안전 비동기로 작동

# IL코드

지금까지 사용했던 코드의 IL코드를 그대로 추가했다. 아래 코드들을 해석하려면 마이크로소프트의 다음 [문서](https://docs.microsoft.com/ko-kr/dotnet/api/system.reflection.emit.opcodes?view=net-5.0)를 참고하면 된다.

<details markdown="1">
<summary>DelayAsync메소드 IL코드</summary>

```csharp
.method private hidebysig instance class [System.Runtime]SystemThreading.Tasks.Task
  DelayAsync(
    int32 ms
  ) cil managed
{
  .custom instance void [System.Runtime]System.RuntimeCompilerServices.AsyncStateMachineAttribute::.ctor(class[System.Runtime]System.Type)
    = (
      01 00 26 41 73 79 6e 63 41 77 61 69 74 2e 41 73 // ..AsyncAwait.As
      79 6e 63 41 77 61 69 74 2b 3c 44 65 6c 61 79 41 //yncAwait+<DelayA
      73 79 6e 63 3e 64 5f 5f 30 00 00                //sync>d__0..
    )
    // type(class AsyncAwait.AsyncAwait/'<DelayAsync>d__0')
  .custom instance void [System.Diagnostics.Debug]SystemDiagnostics.DebuggerStepThroughAttribute::.ctor()
    = (01 00 00 00 )
  .maxstack 2
  .locals init (
    [0] class AsyncAwait.AsyncAwait/'<DelayAsync>d__0' V_0
  )
  IL_0000: newobj       instance void AsyncAwait.AsyncAwait'<DelayAsync>d__0'::.ctor()
  IL_0005: stloc.0      // V_0
  IL_0006: ldloc.0      // V_0
  IL_0007: call         valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilder[System.Threading.Tasks]System.Runtime.CompilerServicesAsyncTaskMethodBuilder::Create()
  IL_000c: stfld        valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilderAsyncAwait.AsyncAwait/'<DelayAsync>d__0'::'<>t__builder'
  IL_0011: ldloc.0      // V_0
  IL_0012: ldarg.0      // this
  IL_0013: stfld        class AsyncAwait.AsyncAwait AsyncAwaitAsyncAwait/'<DelayAsync>d__0'::'<>4__this'
  IL_0018: ldloc.0      // V_0
  IL_0019: ldarg.1      // ms
  IL_001a: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::ms
  IL_001f: ldloc.0      // V_0
  IL_0020: ldc.i4.m1
  IL_0021: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
  IL_0026: ldloc.0      // V_0
  IL_0027: ldflda       valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilderAsyncAwait.AsyncAwait/'<DelayAsync>d__0'::'<>t__builder'
  IL_002c: ldloca.s     V_0
  IL_002e: call         instance void [System.Threading.TasksSystem.Runtime.CompilerServicesAsyncTaskMethodBuilder::Start<class AsyncAwait.AsyncAwait'<DelayAsync>d__0'>(!!0/*class AsyncAwait.AsyncAwait'<DelayAsync>d__0'*/&)
  IL_0033: ldloc.0      // V_0
  IL_0034: ldflda       valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilderAsyncAwait.AsyncAwait/'<DelayAsync>d__0'::'<>t__builder'
  IL_0039: call         instance class [System.Runtime]SystemThreading.Tasks.Task [System.Threading.Tasks]System.RuntimeCompilerServices.AsyncTaskMethodBuilder::get_Task()
  IL_003e: ret
} // end of method AsyncAwait::DelayAsync
```

</details>

<details markdown="1">
<summary>async/await를 모두 사용한 DelayAsyncStateMachine클래스 IL코드</summary>

```csharp
.class nested private sealed auto ansi beforefieldinit
  '<DelayAsync>d__0'
    extends [System.Runtime]System.Object
    implements [System.Runtime]System.Runtime.CompilerServicesIAsyncStateMachine
{
  .custom instance void [System.Runtime]System.RuntimeCompilerServices.CompilerGeneratedAttribute::.ctor()
    = (01 00 00 00 )
  .field public int32 '<>1__state'
  .field public valuetype [System.Threading.Tasks]SystemRuntime.CompilerServices.AsyncTaskMethodBuilder '<>t__builder'
  .field public int32 ms
  .field public class AsyncAwait.AsyncAwait '<>4__this'
  .field private valuetype [System.Runtime]System.RuntimeCompilerServices.TaskAwaiter '<>u__1'
  .method public hidebysig specialname rtspecialname instancevoid
    .ctor() cil managed
  {
    .maxstack 8
    IL_0000: ldarg.0      // this
    IL_0001: call         instance void [System.Runtime]SystemObject::.ctor()
    IL_0006: nop
    IL_0007: ret
  } // end of method '<DelayAsync>d__0'::.ctor
  .method private final hidebysig virtual newslot instance void
    MoveNext() cil managed
  {
    .override method instance void [System.Runtime]SystemRuntime.CompilerServices.IAsyncStateMachine::MoveNext()
    .maxstack 3
    .locals init (
      [0] int32 V_0,
      [1] valuetype [System.Runtime]System.RuntimeCompilerServices.TaskAwaiter V_1,
      [2] class AsyncAwait.AsyncAwait/'<DelayAsync>d__0' V_2,
      [3] class [System.Runtime]System.Exception V_3
    )
    IL_0000: ldarg.0      // this
    IL_0001: ldfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
    IL_0006: stloc.0      // V_0
    .try
    {
      IL_0007: ldloc.0      // V_0
      IL_0008: brfalse.s    IL_000c
      IL_000a: br.s         IL_000e
      IL_000c: br.s         IL_004d
      // [11 9 - 11 10]
      IL_000e: nop
      // [12 13 - 12 34]
      IL_000f: ldarg.0      // this
      IL_0010: ldfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::ms
      IL_0015: call         class [System.Runtime]SystemThreading.Tasks.Task [System.Runtime]System.ThreadingTasks.Task::Delay(int32)
      IL_001a: callvirt     instance valuetype [System.RuntimeSystem.Runtime.CompilerServices.TaskAwaiter [SystemRuntime]System.Threading.Tasks.Task::GetAwaiter()
      IL_001f: stloc.1      // V_1
      IL_0020: ldloca.s     V_1
      IL_0022: call         instance bool [System.RuntimeSystem.Runtime.CompilerServicesTaskAwaiter::get_IsCompleted()
      IL_0027: brtrue.s     IL_0069
      IL_0029: ldarg.0      // this
      IL_002a: ldc.i4.0
      IL_002b: dup
      IL_002c: stloc.0      // V_0
      IL_002d: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
      IL_0032: ldarg.0      // this
      IL_0033: ldloc.1      // V_1
      IL_0034: stfld        valuetype [System.Runtime]SystemRuntime.CompilerServices.TaskAwaiter AsyncAwaitAsyncAwait/'<DelayAsync>d__0'::'<>u__1'
      IL_0039: ldarg.0      // this
      IL_003a: stloc.2      // V_2
      IL_003b: ldarg.0      // this
      IL_003c: ldflda       valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilderAsyncAwait.AsyncAwait/'<DelayAsync>d__0'::'<>t__builder'
      IL_0041: ldloca.s     V_1
      IL_0043: ldloca.s     V_2
      IL_0045: call         instance void [System.ThreadingTasks]System.Runtime.CompilerServicesAsyncTaskMethodBuilder::AwaitUnsafeOnCompleted<valuetype[System.Runtime]System.Runtime.CompilerServicesTaskAwaiter, class AsyncAwait.AsyncAwait'<DelayAsync>d__0'>(!!0/*valuetype [System.Runtime]SystemRuntime.CompilerServices.TaskAwaiter*/&, !!1/*classAsyncAwait.AsyncAwait/'<DelayAsync>d__0'*/&)
      IL_004a: nop
      IL_004b: leave.s      IL_00ba
      IL_004d: ldarg.0      // this
      IL_004e: ldfld        valuetype [System.Runtime]SystemRuntime.CompilerServices.TaskAwaiter AsyncAwaitAsyncAwait/'<DelayAsync>d__0'::'<>u__1'
      IL_0053: stloc.1      // V_1
      IL_0054: ldarg.0      // this
      IL_0055: ldflda       valuetype [System.Runtime]SystemRuntime.CompilerServices.TaskAwaiter AsyncAwaitAsyncAwait/'<DelayAsync>d__0'::'<>u__1'
      IL_005a: initobj      [System.Runtime]System.RuntimeCompilerServices.TaskAwaiter
      IL_0060: ldarg.0      // this
      IL_0061: ldc.i4.m1
      IL_0062: dup
      IL_0063: stloc.0      // V_0
      IL_0064: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
      IL_0069: ldloca.s     V_1
      IL_006b: call         instance void [System.RuntimeSystem.Runtime.CompilerServices.TaskAwaiter::GetResult()
      IL_0070: nop
      // [13 13 - 13 59]
      IL_0071: ldstr        "DelayAsync End. ms:{0}"
      IL_0076: ldarg.0      // this
      IL_0077: ldfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::ms
      IL_007c: box          [System.Runtime]System.Int32
      IL_0081: call         string [System.Runtime]SystemString::Format(string, object)
      IL_0086: call         void [System.Console]SystemConsole::WriteLine(string)
      IL_008b: nop
      IL_008c: leave.s      IL_00a6
    } // end of .try
    catch [System.Runtime]System.Exception
    {
      IL_008e: stloc.3      // V_3
      IL_008f: ldarg.0      // this
      IL_0090: ldc.i4.s     -2 // 0xfe
      IL_0092: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
      IL_0097: ldarg.0      // this
      IL_0098: ldflda       valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilderAsyncAwait.AsyncAwait/'<DelayAsync>d__0'::'<>t__builder'
      IL_009d: ldloc.3      // V_3
      IL_009e: call         instance void [System.ThreadingTasks]System.Runtime.CompilerServicesAsyncTaskMethodBuilder::SetException(class [SystemRuntime]System.Exception)
      IL_00a3: nop
      IL_00a4: leave.s      IL_00ba
    } // end of catch
    // [14 9 - 14 10]
    IL_00a6: ldarg.0      // this
    IL_00a7: ldc.i4.s     -2 // 0xfe
    IL_00a9: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
    IL_00ae: ldarg.0      // this
    IL_00af: ldflda       valuetype [System.Threading.TasksSystem.Runtime.CompilerServices.AsyncTaskMethodBuilderAsyncAwait.AsyncAwait/'<DelayAsync>d__0'::'<>t__builder'
    IL_00b4: call         instance void [System.Threading.TasksSystem.Runtime.CompilerServicesAsyncTaskMethodBuilder::SetResult()
    IL_00b9: nop
    IL_00ba: ret
  } // end of method '<DelayAsync>d__0'::MoveNext
  .method private final hidebysig virtual newslot instance void
    SetStateMachine(
      class [System.Runtime]System.Runtime.CompilerServicesIAsyncStateMachine stateMachine
    ) cil managed
  {
    .custom instance void [System.Diagnostics.Debug]SystemDiagnostics.DebuggerHiddenAttribute::.ctor()
      = (01 00 00 00 )
    .override method instance void [System.Runtime]SystemRuntime.CompilerServices.IAsyncStateMachine::SetStateMachin(class [System.Runtime]System.Runtime.CompilerServicesIAsyncStateMachine)
    .maxstack 8
    IL_0000: ret
  } // end of method '<DelayAsync>d__0'::SetStateMachine
} // end of class '<DelayAsync>d__0'
```

</details>

<details markdown="1">
<summary>await가 빠진 DelayAsyncStateMachine클래스 IL코드</summary>

```csharp
.class nested private sealed auto ansi beforefieldinit
  '<DelayAsync>d__0'
    extends [System.Runtime]System.Object
    implements [System.Runtime]System.Runtime.CompilerServicesIAsyncStateMachine
{
  .custom instance void [System.Runtime]System.Runtime.CompilerServicesCompilerGeneratedAttribute::.ctor()
    = (01 00 00 00 )
  .field public int32 '<>1__state'
  .field public valuetype [System.Threading.Tasks]System.RuntimeCompilerServices.AsyncTaskMethodBuilder '<>t__builder'
  .field public int32 ms
  .field public class AsyncAwait.AsyncAwait '<>4__this'
  .method public hidebysig specialname rtspecialname instance void
    .ctor() cil managed
  {
    .maxstack 8
    IL_0000: ldarg.0      // this
    IL_0001: call         instance void [System.Runtime]System.Object::.ctor()
    IL_0006: nop
    IL_0007: ret
  } // end of method '<DelayAsync>d__0'::.ctor
  .method private final hidebysig virtual newslot instance void
    MoveNext() cil managed
  {
    .override method instance void [System.Runtime]System.RuntimeCompilerServices.IAsyncStateMachine::MoveNext()
    .maxstack 2
    .locals init (
      [0] int32 V_0,
      [1] class [System.Runtime]System.Exception V_1
    )
    IL_0000: ldarg.0      // this
    IL_0001: ldfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
    IL_0006: stloc.0      // V_0
    .try
    {
      // [11 9 - 11 10]
      IL_0007: nop
      // [12 13 - 12 28]
      IL_0008: ldarg.0      // this
      IL_0009: ldfld        int32 AsyncAwait.AsyncAwait/'<DelayAsync>d__0'::ms
      IL_000e: call         class [System.Runtime]System.Threading.Tasks.Task[System.Runtime]System.Threading.Tasks.Task::Delay(int32)
      IL_0013: pop
      // [13 13 - 13 59]
      IL_0014: ldstr        "DelayAsync End. ms:{0}"
      IL_0019: ldarg.0      // this
      IL_001a: ldfld        int32 AsyncAwait.AsyncAwait/'<DelayAsync>d__0'::ms
      IL_001f: box          [System.Runtime]System.Int32
      IL_0024: call         string [System.Runtime]System.String::Forma(string, object)
      IL_0029: call         void [System.Console]System.Console::WriteLin(string)
      IL_002e: nop
      IL_002f: leave.s      IL_0049
    } // end of .try
    catch [System.Runtime]System.Exception
    {
      IL_0031: stloc.1      // V_1
      IL_0032: ldarg.0      // this
      IL_0033: ldc.i4.s     -2 // 0xfe
      IL_0035: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
      IL_003a: ldarg.0      // this
      IL_003b: ldflda       valuetype [System.Threading.Tasks]System.RuntimeCompilerServices.AsyncTaskMethodBuilder AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>t__builder'
      IL_0040: ldloc.1      // V_1
      IL_0041: call         instance void [System.Threading.Tasks]SystemRuntime.CompilerServices.AsyncTaskMethodBuilder::SetException(class[System.Runtime]System.Exception)
      IL_0046: nop
      IL_0047: leave.s      IL_005d
    } // end of catch
    // [14 9 - 14 10]
    IL_0049: ldarg.0      // this
    IL_004a: ldc.i4.s     -2 // 0xfe
    IL_004c: stfld        int32 AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>1__state'
    IL_0051: ldarg.0      // this
    IL_0052: ldflda       valuetype [System.Threading.Tasks]System.RuntimeCompilerServices.AsyncTaskMethodBuilder AsyncAwait.AsyncAwait'<DelayAsync>d__0'::'<>t__builder'
    IL_0057: call         instance void [System.Threading.Tasks]System.RuntimeCompilerServices.AsyncTaskMethodBuilder::SetResult()
    IL_005c: nop
    IL_005d: ret
  } // end of method '<DelayAsync>d__0'::MoveNext
  .method private final hidebysig virtual newslot instance void
    SetStateMachine(
      class [System.Runtime]System.Runtime.CompilerServices.IAsyncStateMachinestateMachine
    ) cil managed
  {
    .custom instance void [System.Diagnostics.Debug]System.DiagnosticsDebuggerHiddenAttribute::.ctor()
      = (01 00 00 00 )
    .override method instance void [System.Runtime]System.RuntimeCompilerServices.IAsyncStateMachine::SetStateMachine(class [System.RuntimeSystem.Runtime.CompilerServices.IAsyncStateMachine)
    .maxstack 8
    IL_0000: ret
  } // end of method '<DelayAsync>d__0'::SetStateMachine
} // end of class '<DelayAsync>d__0'
```

</details>
