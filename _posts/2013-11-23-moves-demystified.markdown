---
layout: post
title: "Moves demystified"
description: >
  In this article I will try to explain move semantics in C++11 using a more
  pragmatic approach, by answering specific questions developers may ask. We'll
  start with why moves are needed in the first place, then see how to use them,
  and eventually move onto common misconceptions and pitfalls.

category: technical
published: true
tags:
  - c++11
  - intermediate
---

### Index

The article is quite large so I include a short summary and links to each
section below:

* [Why are moves needed?](#why1)

   * Need some way to return a value out of scope directly, without copying

* [Can I "move" in C++03?](#cpp03)

   * Even in C++03, returning by value usually results in no copies because of
     Copy Elision.

* [Why do I _really_ need moves and C++11?](#why2)

   * Transferring values into a scope.
   * Moves allow value semantics, without extraneous copies.

* [What are rvalues and how do they relate to move semantics?](#rvalues)

   * Rvalues are expiring/temporary values.
   * Rvalues cannot be used directly, only through rvalue references
     <code>&amp;&amp;</code>.
   * Rvalue references allow specifying a function overload for an expiring
     value.

* [How is a move performed?](#move-constructor)

   * Define a _Move Constructor_ that performs 2 steps:

      * Shallow Copy
      * Nullify Source

* [How to use `std::move`? Does it perform the move?](#std-move)

   * `std::move` does not perform the move.
   * It is nothing more than a cast from an lvalue to an rvalue, to allow an
     actual move to happen (e.g. in a move constructor).

* [Why do I need to use `std::move` on rvalue references?](#std-move2)

   * _rvalue references_ are themselves _lvalues_.
   * To move an rvalue down through successive layers, `std::move` has to be
     applied each time, even to rvalue references.

* [Is there a difference between an _rvalue_ and an _rvalue reference_?](#rv-vs-rvref)

   * _rvalue references_ refer to _rvalues_.
   * A value returned from a function is already an rvalue.
   * Returning an rvalue reference to a local is as bad as returning an lvalue
     reference to it.

* [Are moves free? Are moves faster than copies?](#cost)

   * They are not free: still have to perform a shallow copy.
   * For simple structures with no indirection, moves **are** copies.

* [Clever solutions in C++03](#clever)

   * Expression Templates
   * Faking Rvalues

* [Conclusion and other resources](#conclusion)

* [User Comments](#disqus_thread)

---------------------------------------

### Why are moves needed? {#why1}

Let's consider a simple fixed-size vector of numbers:

{% highlight cpp %}
/**
 * Runtime-sized vector, but
 * Size fixed at construction.
 */
class Vector {
    double* storage_;
    size_t  size_;

public:
    Vector(size_t numElements)
        : storage_(new double[numElements])
        , size_(numElements)
    { }

    ~Vector() { delete[] storage_; }

    // element access
    double& operator[] (size_t i)       { return storage_[i]; }
    double  operator[] (size_t i) const { return storage_[i]; }

    size_t size() const { return size_; }

    // standard iterator fare (begin(), end(), etc...)
    // ...
};
{% endhighlight %}

Even though these vectors have a fixed size throughout their lifetime, they may
be quite large, so copying them would be prohibilitively expensive. The whole
underlying array must be replicated.

{% assign diagram = "copying-vector" %}
{% assign caption = "Visualizing a Copy Constructor. Both the members and anything they refer to must be copied." %}
{% include diagram.html %}

We'd like to perform value operations without unnecessary copies:

{% highlight cpp %}
Vector c = a + b;
{% endhighlight %}

Of course that leaves us with the problem of defining `operator +`. What do we
return? Clearly we want to return a value if we want operations to compose, but
that could mean copying a massive vector!

{% highlight cpp %}
??? operator + (Vector const& a, Vector const& b);
{% endhighlight %}

Our instincts say:

* Returning by value is bad! We make a copy!
* If we allocate on the heap and return a pointer, who deletes it?

   * Doesn't compose! Can't chain several additions since we're not working
     with values.

> Need some way to transfer a value out of scope directly, without copying

Copying the value out of a function and then deleting the local seems absurd.
Let's see what we could do already in C++03 to tackle this problem.

---------------------------------------

### Can I "move" in C++03? {#cpp03}

Ideally, given the problem of implementing `operator +` for two vectors, we'd
want to write this:

{% highlight cpp %}
Vector operator + (Vector const& a, Vector const& b)
{
    // create result of same size
    assert(a.size() == b.size());
    Vector result(a.size());

    // compute addition
    std::transform(
        a.begin(), a.end(), // input 1
        b.begin(),          // input 2
        result.begin(),     // result
        std::plus           // binary operation
    );

    return result; // don't want to copy!
}
{% endhighlight %}

And that's exactly what you should write, because _the compiler will get rid of
the copy for you_! This happens because of [Copy
Elision](http://en.cppreference.com/w/cpp/language/copy_elision) (specified in
the [C++ standard](http://isocpp.org/) in clause 12.8.31), and more
specifically because of NRVO (Named Return Value Optimization).  Returning a
local variable by value is detected by the compiler, and the needless copy is
elided. This optimization was first developed in 1991, so you can rest assured
your compiler supports it.

> Even in C++03, returning by value usually results in no copies because of
> Copy Elision.

Now, I say _usually_, because there are corner cases where this optimization
will not trigger. See the [Wikipedia
Article](http://en.wikipedia.org/wiki/Return_value_optimization) for more
details, and consult your favourite compiler manual.

In the next section we'll consider another problem where move semantics are needed.

---------------------------------------

### Why do I _really_ need moves and C++11? {#why2}

We saw that our previous problem of _transferring values out of a terminating
scope_ is still solvable in C++03, through clever compiler optimization. We
need to cover the converse situation of _transferring values into a scope_, in
situations like:

* Passing subcomponents to a constructor of an aggregate
* Handing off a value to another task or thread.
* Transferring ownership of a unique resource (e.g. a file handle, thread, `std::unique_ptr`)

In all of the above cases, the need to transfer without copying is necessary.
Yet again, pointers are not the answer here. Using pointers for this transfer
requires managing the storage (either the heap, or some shared memory), which
should be unnecessary, or defeats the purpose entirely.

Simply put, transferring values in and out of a scope allows efficient passing
of values.

> Moves allow value semantics, without extraneous copies.

To keep a concrete problem in mind, let's look at initializing an aggregate
object from two `Vector` objects. We'll define `Ray` concretely soon.

{% highlight cpp %}
// Example of extraneous copies
Ray computeRay()
{
    Vector origin;
    Vector direction;

    // ...
    // compute vectors
    // ...

    // want to avoid copying
    // the Vectors !
    return Ray(
        origin,   // COPY!
        direction // COPY!
    );
}
{% endhighlight %}

Now that we have a problem, how do we solve it?

---------------------------------------

### What are rvalues and how do they relate to move semantics? {#rvalues}

The key feature that we need, is to tell apart regular values, and "temporary"
ones. Once we know that, we can decide whether to copy or move. By looking at a
typical assignment we can see where the terms _lvalue_ and _rvalue_ come from:

{% highlight cpp %}
Vector a, b, c;
// c is an lvalue. It is on the "left"
// |
   c = a + b;
//     ^^^^^
// the result of the "a + b" expression is an rvalue
// It is on the "right"
{% endhighlight %}

* _Lvalues_ are values that you can freely refer to in their scope because they
  are bound to a name- such as variables. As such, _lvalues_ can be assigned
  to, and used several times in a single scope.
* _Rvalues_, cannot be directly referred to because they are temporaries and
  are not bound to a name- such as values returned by a function, or the
  direct result of an inline construction:

{% highlight cpp %}
// some kind of factory function
Vector createVector(std::string param);

Vector myVec = createVector("hello world");
//            ^             ^^^^^^^^^^^^^
//            |         temporary std::string
//            |
//  temporary Vector
//
// There are two rvalues in the expression above.
{% endhighlight %}

Given that _by definition_ we cannot refer directly to _rvalues_, we need
_rvalue references_ (`&&`) to be able to bind to them. This allows overloading
functions/methods/constructors for rvalue arguments which we know will expire.

> Rvalues cannot be used directly, only through rvalue references
> <code>&amp;&amp;</code>, and are very different notions.  Rvalue references
> allow specifying a function overload for an expiring value, such as a move
> constructor.

---------------------------------------

### How is a move performed? {#move-constructor}

To do a move, we need a cheap way of transferring data from an expiring value.
By providing an overloaded constructor that takes an _rvalue reference_ (`&&`),
we can do that.  Here is  a _Move Constructor_ for our `Vector` that is cheaper
than a copy:

{% highlight cpp %}
// Move constructor.
// "other" will soon expire!
Vector::Vector(Vector&& other)
    // shallow copy
    : storage_(other.storage_)
    , size_(other.size_)
{
    // nullify source
    other.storage_ = nullptr;
    other.size_ = 0;
}
{% endhighlight %}

{% assign diagram = "moving-vector" %}
{% assign caption = "Visualizing a Move Constructor in two steps. The resources are 'stolen' from the source." %}
{% include diagram.html %}

A _Move Constructor_ involves:

* A shallow copy
   
   * We take pointers/resources directly from the other object

* Nullify the source

   * Having stolen the pointers/resources, we nullify these fields in the
     source so the destructor doesn't release them.

---------------------------------------

### How to use `std::move`? Does it perform the move? {#std-move}

This article is about moves, but we have yet to use `std::move`. What gives?

Unfortunately, `std::move` is in some sense a misnomer. Think of `std::move` as
a new type of cast that casts any expression to an _rvalue_. This cast makes
the compiler select the _rvalue reference_ overload (for example a move
constructor), where the _actual_ move is performed.

To be more concrete, and work towards a problem established earlier, let's
define the `Ray` class that has overloaded constructors:

{% highlight cpp %}
class Ray
{
    Vector origin_;
    Vector direction_;

public:
    // Construct by copying subcomponents
    Ray(Vector const& origin, Vector const& direction);
    
    // Construct by moving subcomponents
    Ray(Vector&& origin, Vector&& direction);

    // etc...
};
{% endhighlight %}

Using `std::move` we can tell the compiler that the value is no longer needed
in this scope.  Solving the problem is now within reach. Given local _lvalues_
that we need to move, we can cast them to _rvalues_ using `std::move`:

{% highlight cpp %}
// Example of moving
Ray computeRay()
{
    Vector origin;
    Vector direction;

    // ...
    // compute vectors
    // ...

    // Move vectors into Ray
    // triggering the right constructor
    return Ray(
        std::move(origin),
        std::move(direction)
    );
}
{% endhighlight %}

It bears reiterating:

> std::move does not perform the move. It is nothing more than a cast from an
> lvalue to an rvalue, to allow an actual move to happen (e.g. in a move
> constructor)

---------------------------------------

### Why do I need to use `std::move` on rvalue references? {#std-move2}

We tackled moving lvalues down a layer, using std::move. What happens when we already
have an _rvalue reference_ that we need to move down another layer?

Let's look at a concrete example using our `Ray` class, and its constructor
that takes two `Vectors` by _rvalue reference_.  When composing a larger
aggregate out of smaller movable objects, we can delegate the process of moving
to the sub-components using `std::move`:

{% highlight cpp %}
// Construct by moving subcomponents.
Ray::Ray(Vector&& origin, Vector&& direction)
    // move construct inner objects
    : origin_(std::move(origin))
    , direction_(std::move(direction))
{ }
{% endhighlight %}

> To move down an rvalue through successive layers, `std::move` has to be
> applied each time, even to rvalue references.

Why is that?  A mindnumbing realization is that because _rvalue references_ are
bound to a name, they are themselves _lvalues_.  We need to tell the compiler
that this value is no longer needed in this scope.  Stop, and take a breath.

Let's look at that code again, now with more annotations:

{% highlight cpp %}
// Construct by moving subcomponents.
// "origin" and "direction" refer to rvalues,
// but are themselves lvalues in this scope.
Ray::Ray(Vector&& origin, Vector&& direction)
    // move construct inner objects,
    // by casting inputs to rvalues
    : origin_(std::move(origin))
    , direction_(std::move(direction))
{ }
{% endhighlight %}

There are several important things to notice here:

* The constructor overload is chosen when both inputs are _rvalues_.
* Once the _rvalue references_ are bound, we can refer to them in the scope.

   * **This means that these _rvalue references_ are _lvalues_**!

* We have to use `std::move` to cast these references back to _rvalues_ to pass
  them to the move constructors of the `Vector` objects.

Phew!

> _rvalue references_ bound to a name, can be referred to in their scope and
> are therefore lvalues.

If this last quote makes your head spin, just remember that to move a value
down through successive layers, `std::move` has to be applied each time.

---------------------------------------

### Is there a difference between an _rvalue_ and an _rvalue reference_? {#rv-vs-rvref}

Yes! The two notions are very different.  This misconception comes up time and
time again, but not in the form of this direct question. I noticed that while
learning the new concept of rvalues, the ideas of _rvalues_ and _rvalue
references_ can become conflated together.  Many refer to one or the other
interchangeably.  This is a stage I lived through, and was surprised that this
is rarely disambiguated directly.

This often manifests itself in code like this (which doesn't work):

{% highlight cpp %}
// How NOT to do it
std::string&& func()
    std::string hello("Hello World!");
    return std::move( hello );
}
{% endhighlight %}

To give some perspective, here's the same function but with lvalues:

{% highlight cpp %}
//  Also, how not to do it.
std::string& func()
    std::string hello("Hello World!");
    return hello;
}
{% endhighlight %}

We all know that returning a reference to a local value is bad, since it goes
out of scope- and that's exactly what happens in both cases.  Both references
returned would be referring to already-destroyed objects.

> A value returned from a function is already an rvalue. Returning an rvalue
> reference to a local is as bad as returning an lvalue reference to it.

Just so there is no confusion, here's the simplest and correct way to do it:

{% highlight cpp %}
//  Optimal thanks to Copy Elision
std::string func()
    return "Hello World";
}
{% endhighlight %}

Any temporaries and copies dissapear due to Copy Elision.

---------------------------------------

### Are moves free? Are moves faster than copies? {#cost}

Are moves free? No. As we have seen:

* Moves are shallow copies
* That also nullify the source of the copy

Both operations have to be performed to move an object. It will never be as fast
as not doing anything.

Are moves faster than copies? This depends. Moves are much faster for
structures with indirection, (like vectors), since copying all of the data is
not required (just pointers). However, moves _are_ copies for structures
without pointers or indirection, since we still need to transfer all the member
variables. If there is no "depth" to the structure, then there are no
performance benefits to moves.

> For simple structures with no indirection, moves are copies.

---------------------------------------

### Clever solutions in C++03 {#clever}

There are other clever ways of getting rid of unnecessary copies and operations
from C++03 code. Both go beyond the scope of this article, but you can read up
on these techniques at the links below:

* Expression Templates

   * [Expression templates](http://en.wikipedia.org/wiki/Expression_templates)
     allow encoding a tree of expressions (e.g.  mathematical expressions) and
     performing simplifications and optimizations on them, _all at compile
     time_.
   * The implementations are very complex, but the user API ends up being
     extremely intuitive, while performing extremely efficiently.
   * A great library that uses this concept heavily is [Eigen](http://eigen.tuxfamily.org/).

* Faking Rvalues

   * [Boost Move](http://www.boost.org/doc/libs/1_54_0/doc/html/move.html)
     emulates rvalues and move semantics through very clever C++ tricks,
     allowing the creation of movable objects in C++03.

---------------------------------------

### Conclusion and other resources {#conclusion}

I hope this has helped some of you understand the basics of move semantics.
Please comment below with corrections/suggestions, and if I have missed any
other common questions about moves in C++11/14.

To dive deeper into move semantics and various pitfalls, here are a few more
resources to look at:

* Dave Abrahams -- [Want Speed? Pass by Value](http://cpp-next.com/archive/2009/08/want-speed-pass-by-value/)

* Scott Meyers -- [An Effective C++11/14 Sampler](http://channel9.msdn.com/Events/GoingNative/2013/An-Effective-Cpp11-14-Sampler)

   * This a great and dense talk on best practices and gotchas in C++11/14, that begins with advice on move semantics.

* Scott Meyers -- [Universal References in C++11](http://isocpp.org/blog/2012/11/universal-references-in-c11-scott-meyers)

   * An indepth talk and article on perfect forwarding.

* Thomas Becker -- [C++ Rvalue References Explained](http://thbecker.net/articles/rvalue_references/section_01.html)

   * A thorough article focusing on rvalue references, and how they relate to moves, and perfect forwarding.

You can also follow a discussion about this article [on
reddit](http://www.reddit.com/r/programming/comments/1r9t40/moves_demystified_c11_article_xpost_from_rcpp/).
