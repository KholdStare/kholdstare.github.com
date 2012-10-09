---
layout: post
title: "Functionality != Semantics"
description: >
  Very rarely, a case comes up where a new function is required even if it is
  functionally identical to another one. In these cases another meaning is
  attached to these functions beyond their interface, and machine instructions;
  reusing it will actually be counterproductive. We examine such a case I
  encountered at my workplace.

category: technical
published: true
tags:
  - c++
  - design
---

### Assertions

I'm sure you're wondering what the heck I'm talking about- reuse is a
cornerstone of programming! Well, consider the case of assertions. Peppered
throughout the codebase of a project, are macro invocations to
<code>FOO_ASSERT</code>, which is defined thus:

{% highlight cpp %}
#ifdef ENABLE_ASSERTIONS
#define FOO_ASSERT( COND, MESSAGE ) \
    if ( !(COND) ) {\
        printf(\
        "===========================================\n"\
        "Failed Assertion at line " __LINE__ " in " __FILE__ "!\n"\
        "Condition: " #COND "\n"\
        "Message: " MESSAGE "\n"\
        "===========================================\n"\
        );\
        exit(1);\
    }\
}
#else
#define FOO_ASSERT( COND, MESSAGE )
#undef
{% endhighlight %}

The assert macro provides information on the failure, including a message, and
all is good. It also allows one to disable the assertion if required, during
compilation. If we consider the interface and functionality of this macro, it
achieves the following:

<ul>
    <li> Check a condition <code>COND</code> </li>
    <li> On failure: </li>
    <ul>
        <li> Print a nice <code>MESSAGE</code> </li>
        <li> Exit the program </li>
    </ul>
</ul>


### Handling errors

As it turns out, given the above functionality, the macro started being used
in smaller applications to do regular error handling.

{% highlight cpp %}
FILE* file = fopen( "somefile.txt", "r");
FOO_ASSERT( file != NULL, "Could not open file!" );
{% endhighlight %}

The macro simplified handling errors such as opening files, while inadvertently
corrupting its original meaning:

> Assertions check invariants which have to hold during normal program
> execution. If a condition is not satisfied, the logic of the program
> broken.

Failing to open a file is not an invariant, and is not under the program's
control. The <code>FOO_ASSERT</code> macro is being abused to handle regular
errors, and as a consequence, _disabling assertions would now break these
applications_- the check has to be there to preserve functionality. 

After doing some profiling on the algorithms used, more than 50% of the time was
spent checking (legitimate) assertions. Without being able to remove their
usage, the code is stuck with the assertions. Granted, speed/efficiency was not
a requirement, but that is a lot of wasted cycles simply due to the misuse of a
macro.

### Conclusion

Handling assertions and regular errors are fundamentally different, even if
functionally they are the same from the perspective of the source code. This
suggests that the usage/semantics of a construct is not only tied to its
functionality, but also to its documentation and project coding style.
