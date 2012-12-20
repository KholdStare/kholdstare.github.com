---
layout: post
title: "Perfect Forwarding to Async Lambdas (Part 1)"
description: >
  Perfect forwarding allows template functions to forward the arguments "as is"
  to any other function they call. This helps minimize the number of unnecessary
  copies and conversions when delegating information to other functions. In a
  quest to get rid of copying completely in a <a
  href="https://github.com/KholdStare/plumbingplusplus">library</a> I was
  writing, I came across the problem of perfect forwarding to functions
  launched on a separate thread.

category: technical
testing: false
published: true
tags:
  - c++
  - c++11
  - advanced
---

### Overview

Before tackling the problem of perfect forwarding in the next part, I will
quickly overview _rvalues_, present a way to measure copies/moves, and finally
observe a "problem" with <code>std::async</code>. In the second part of the
article we will cover perfect forwarding, and overview the problem in that
context. Finally a generic solution will be presented.

This article is geared towards library writers and those who write generic
template code in C++11. Most of the code from both parts of the article can be
found in <a href="https://gist.github.com/4313633">this gist</a>.

### Lvalues and Rvalues

Let's start with a quick recap of lvalues and rvalues. ( You can skip this
section if you have a firm grasp of the concept )

With C++11 we have to be able to distinguish _lvalues_ and _rvalues_.
The names hint at the fact that _lvalues_ are values that tend to appear on the
left hand side of an assignment expression, whereas _rvalues_ are those that are
on the right. In other words, _lvalues_ are values that you can freely refer to
in their scope because they are bound to an identifier- such as variables, and
functions.

{% highlight cpp %}
std::vector<int> createVector(std::string param);
// createVector is an lvalue. It can be referred to

std::vector<int> myVec = createVector("hello world");
// myVec is also an lvalue, it is on the left side of the expression
// and can be referred to
{% endhighlight %}

_Rvalues_, cannot be directly referred to because they are temporaries and are
not bound to an identifier- such as values returned by a function, or the direct
result of an inline construction:

{% highlight cpp %}
std::vector<int> createVector(std::string param);

std::vector<int> myVec = createVector("hello world");
//                      ^             ^^^^^^^^^^^^^
//                      |         temporary std::string
//                      |
//            temporary std::vector<int>
// 
// There are two rvalues in the expression above.
{% endhighlight %}

With C++11, one can now create functions that accept _lvalue references_
(<code>T&amp;</code>), as well as _rvalue references_
(<code>T&amp;&amp;</code>). Since _rvalues_ are temporaries, it allows us to
transfer ownership of that temporary, instead of performing a needless copy.

<blockquote>
The new notation allows a function to distinguish between lvalues
<code>T&amp;</code> that already exist in an outer scope, vs rvalues
<code>T&amp;&amp;</code> that are yet to be bound to a scope.
</blockquote>

To facilitate this transfer of ownership, the function <a
href="http://en.cppreference.com/w/cpp/utility/move"><code>std::move</code></a>
is available. Here is a quick example of its usage in the context of
object construction:

{% highlight cpp %}
class vector_holder
{
    std::vector<int> vec_;

public:
    // copy a vector into this object.
    vector_holder(std::vector<int> const& vec)
        : vec_(vec)
    {
        std::cout << "copied!" << std::endl;
    }

    // move a vector into this object.
    // essentially a transfer of ownership
    vector_holder(std::vector<int>&& vec)
        : vec_(std::move(vec))
    {
        std::cout << "moved!" << std::endl;
    }

    // move constructor.
    // instead of copying, we transfer
    // the internals into this object
    vector_holder(vector_holder&& other)
        : vec_(std::move(other.vec_))
    { }
};
{% endhighlight %}

Given this quick overview, it should be apparent that moves help save
unnecessary copies- essential if you want to write an efficient library. This is
the _"value of rvalues"_. For a more focused overview, you could also look at a
<a
href="http://www.cprogramming.com/c++11/rvalue-references-and-move-semantics-in-c++11.html">larger
article by Alex Allain</a> about move semantics.

### Profiling copies/moves

In order to ensure optimal performance I wrote tests to count how many copies or
moves occurred during the invocations of various API calls. To carry out these
tests, I created a simple class that kept a shared count of the amount of moves
and copies that were performed on it:

{% highlight cpp %}
class move_checker
{
    // shared counters of copies and moves
    std::shared_ptr<int> copies_;
    std::shared_ptr<int> moves_;

public:
    // expensive payload
    std::vector<int> payload; 

    typedef std::vector<int>::const_iterator const_iterator;

    // construct a new checker, with counters reset to 0,
    // and a non-empty payload.
    move_checker()
        : copies_(new int(0)),
          moves_(new int(0)),
          payload({1, 2, 3, 4, 5, 6, 7})
    { }

    // copy constructor. counts copy operations
    move_checker(move_checker const& other)
        : copies_(other.copies_),
          moves_(other.moves_),
          payload(other.payload)
    {
        *copies_ += 1;
    }
    // copy assignment is similar to copy constructor

    // move constructor. counts move operations
    move_checker(move_checker&& other)
        : copies_(other.copies_),
          moves_(other.moves_),
          payload(std::move(other.payload))
    {
        *moves_ += 1;
    }
    // move assignment is similar to move constructor

    const_iterator begin() const { return payload.begin(); }
    const_iterator end()   const { return payload.end(); }

    // methods to report on the number of copies/moves
    int copies() const { return *copies_; }
    int moves()  const { return *moves_; }
};
{% endhighlight %}

In case you just skipped the above block of code, the usage is simple:

{% highlight cpp %}
move_checker checker;

assert( checker.copies() == 0 );
assert( checker.moves() == 0 );

move_checker copy(checker);

assert( copy.copies() == 1 ); // increased
assert( copy.moves() == 0 );

move_checker moved(std::move(checker));

assert( moved.copies() == 1 );
assert( moved.moves() == 1 ); // increased
{% endhighlight %}

Armed with the <code>move_checker</code> I was able to profile my code, and make
sure there were no extraneous copies. During the rest of the article, I will
provide asserts with the actual number of copy/move counts a particular piece of
code produces.

### Std::thread and async

The next piece of the puzzle is launching functions on other threads. Thankfully
C++11 comes with its own standard implementation of threads, allowing for easy
execution of functions, and passing of arguments to other threads. Here I run a
function that prints the contents of an iterable on another thread using <a
href="http://en.cppreference.com/w/cpp/thread/async"><code>std::async</code></a>:

{% highlight cpp %}
// prints the contents of an iterable
template <typename Iterable>
void printContents(Iterable const& iterable)
{
    for (auto e : iterable)
    {
        std::cout << e << std::endl;
    }
}

move_checker checker;

assert( checker.copies() == 0 );
assert( checker.moves() == 0 );

// print the contents on another thread
std::future<void> task =
    std::async(
        std::launch::async,
        printContents<move_checker>,
        std::move(checker) // rvalue
    );

// wait for the task to complete
task.wait();

// two moves are performed
assert( checker.copies() == 0 );
assert( checker.moves() == 2 );
{% endhighlight %}

Notice, to run the function on another thread, the arguments have to be
available on the other thread. I can move the <code>checker</code> into another
thread if I don't need it. As expected, no copies are performed. The two moves
are accounted for:

* One move into the <code>std::async</code> function itself
* Another move into the newly created thread.

Since our <code>printContents</code> function takes an object by
<code>const&amp;</code> it is normal to expect that no copies or moves are
performed- we just access the object through a reference from another thread.
Let's try it:

{% highlight cpp %}
move_checker checker;

assert( checker.copies() == 0 );
assert( checker.moves() == 0 );

// (hopefully) pass by reference
std::future<void> task =
    std::async(
        std::launch::async,
        printContents<move_checker>,
        checker // lvalue
    );

// wait for the task to complete
task.wait();

// a copy occured!
assert( checker.copies() == 1 );
assert( checker.moves() == 1 );
{% endhighlight %}

Woops! Where did that copy come from? This manifested as a cryptic compilation
error when I was doing perfect forwarding (we'll get to that shortly). As a
result I posted a <a
href="http://stackoverflow.com/questions/13813838/perfect-forwarding-to-async-lambda">question
on stack overflow</a>, and the answer is relevant here.

> ... async will always make a copy of \[ non-const lvalue references \]
> internally ... to ensure they exist and are valid throughout the running time
> of the thread created.
> <cite>jogojapan</cite>

To ensure users don't shoot themselves in the foot, the async function
preemptively copies an lvalue argument in the event that the lvalue goes out of
scope, and is destroyed before the thread completes its function. The breakdown
of the numbers above is thus:

* A local _copy_ is created in the <code>std::async</code> function
* The copy is then _moved_ into the new thread.

This is the safe route and minimizes unintended errors for the average user of
the async api. However, if you're library writer, you may want to _choose_ not
to make an expensive copy, and in that case you can always pass a pointer.

{% highlight cpp %}
move_checker checker;

assert( checker.copies() == 0 );
assert( checker.moves() == 0 );

// pass by pointer
std::future<void> task =
    std::async(
        std::launch::async,
        [](move_checker* pChecker)
        {
            printContents(*pChecker),
        },
        &checker // pointer
    );

// wait for the task to complete
task.wait();

// no copies or moves!
assert( checker.copies() == 0 );
assert( checker.moves() == 0 );
{% endhighlight %}

I had to add a lambda in there since <code>printContents</code> didn't take its
parameters by pointer. Note, this would not work for rvalues, as creating
pointers to rvalue references will result in undefined behaviour- you'd be
creating pointers to temporaries! To summarize the local solution:

> To avoid an extra copy when forwarding arguments that you know will outlive
> the thread through <code>std::async</code>, you can pass them using a pointer.

### Continued in <a href="/technical/2012/12/19/perfect-forwarding-to-async-2.html">Part 2</a>

Now that we have come upon the problem and seen a simple local solution,  we'll
consider it in a more generic context of perfect forwarding in <a
href="/technical/2012/12/19/perfect-forwarding-to-async-2.html">Part 2 of the article</a>.
