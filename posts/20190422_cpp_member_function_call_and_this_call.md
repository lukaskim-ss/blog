---
title: C++ 멤버함수 호출과 this call
date: '2019-04-22T23:02:37.121Z'
tags: ['cpp']
---

같은 클래스로 생성된 서로 다른 객체가 멤버함수를 호출할 때 어떻게 서로 다른 객체끼리 구분하고 자신의 멤버변수에 접근할 수 있을까? 코드를 작성하다보면 이미 습관이 되어 그냥 넘어갈 수 있는 부분이라 한 번더 복습하는 마음으로 내용을 정리해보자.

<!-- end -->

# 수식 예제

## 수식 예제 2

### 수식 예제 3

[toc]

$E = mc^2$

블록 수식:

$$
\int_{a}^{b} x^2 \, dx
$$

# **멤버함수 호출과 this call**

아래 코드는 Object라는 클래스를 생성하고 main에서 obj1과 obj2를 선언해 각자의 멤버함수를 호출하는 코드다. Set함수 내부에서는 멤버변수에 접근하고 있는데 this가 생략되어 있다.

```cpp
#include <iostream>

class Ojbect
{
public:
    void Set(int32_t x)
    {
        x_ = x;
    }

private:
    int32_t x_ = 0;
};

int32_t main()
{
    Ojbect obj1, obj2;

    obj1.Set(10);
    obj2.Set(10);

    return 0;
}
```

만약에 this를 생략할 수 없다면? 그렇다면 멤버변수에 접근하기 위해 this를 통해서 접근해야만 할 것이고 어떤 방법에 의해 멤버함수 안으로 스스로를 가리킬 수 있는 this가 넘겨져야 한다.

가장 생각하기 쉬운 방법으로 멤버함수를 호출 할 때 자기 자신의 주소를 매개변수로 넘긴다고 가정해보자. 그 가정을 바탕으로 위의 코드를 살짝 바꿔보자(컴파일은 신경쓰지 말자ㅋ).

```cpp
#include <iostream>

class Ojbect
{
public:
    void Set(Object const * this, int32_t x) //void Set(int32_t x)
    {
        this->x_ = x;
    }

private:
    int32_t x_ = 0;
};

int32_t main()
{
    Ojbect obj1, obj2;

    Set(&obj1, 10); //obj1.Set(10);
    Set(&obj2, 10); //obj2.Set(10);

    return 0;
}
```

실제로 컴파일러가 저런 형태로 코드를 바꾸지는 않는다. 다만! 어셈블리가 만들어질 때 멤버함수를직접 주소를 `lea`와 같은 명령어를 이용해 매개변수와 같이 전달하도록 되어 있다. 원래 코드를 어셈블리고 바꿔서 확인해보면 바로 알 수 있다. DWRD PTR의 형태로 넘기는 것을 확인하자.

```asm
; Line 20
	puss        10					    ; 0000000aH
	lea	ecx,    DWORD PTR _obj1$[ebp]
	call        ?Set@Ojbect@@QAEXH@Z	; Ojbect::Set
; Line 21
	push        10			    		; 0000000aH
	lea	ecx,    DWORD PTR _obj2$[ebp]
	call        ?Set@Ojbect@@QAEXH@Z	; Ojbect::Set
```

즉, 눈에는 보이지 않지만 자기자신을 가리키기 위해 객체 스스로를 넘겨주고 있다는 사실!!! 저런 식으로 호출되는 것을 `this call`이라고 하고 그것을 이용해 여러 객체가 자기 자신의 멤버변수를 사용할 수 있도록 하는 것이다.

이런 이유로 static으로 선언된 멤버함수 안에서는 static으로 선언된 멤버변수만 접근할 수 있다. 왜냐? static 멤버함수는 객체가 없어도 불릴 수 있어서 자기 자신을 넘길 필요가 전혀 없기 때문이다.

```cpp
class Ojbect
{
public:
    static void StaticSet(int32_t x)
    {
        x_ = x;         //error
        this->x_ = x;   //error
    }
    ...
};

Ojbect::StaticSet(10); //객체가 없어 자기 자신의 주소를 넘길 수 없음
```

# **Assembly로 컴파일 하기**

참고로 cl이나 g++을 이용해 어셈블리로 컴파일 할 수 있다.

```asm
cl sample.cpp /FAs
g++ sample.cpp -S
```

# **정리**

- 멤버함수는 객체마다 따로 가지고 있는 것이 아니다.
- 멤버함수가 호출 될 때 컴파일러는 자기 자신의 주소도 같이 넘어간다.
- static 멤버함수는 자기 자신의 주소를 보낼 수 없다. 그래서 비 static 멤버변수에 접근할 수 없다.
