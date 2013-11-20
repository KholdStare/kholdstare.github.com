---
layout: post
title: "Moves demystified"
description: >
  In this article I will try to explain move semantics in C++11 using a more
  pragmatic approach, by answering specific questions developers may ask. We'll
  start with why moves are needed in the first place, and eventually move onto
  common misconceptions and pitfalls.

category: technical
testing: true
published: true
notfrontpage: false
tags:
  - c++11
  - intermediate
---

The questions we'll cover:
{:toc}

### Why are moves needed?

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

    ~Vector() { delete[] storage; }

    // access
    double& operator[] (size_t i)       { return storage_[i]; }
    double  operator[] (size_t i) const { return storage_[i]; }

    size_t size() const { return size_; }

    // standard iterator fare (begin(), end(), etc...)
    // ...
};
{% endhighlight %}

Even though these vectors have a fixed size throughout their lifetime, they may
be quite large, so copying them would be prohibilitively expensive. In
particular, we'd like to do this without unnecessary copies:

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

### Can I "move" in C++03?

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
the copy for you_! This happens because of Copy Elision (specified in the C++
standard in clause 12.8.31), and more specifically because of NRVO ([Named
Return Value
Optimization](http://en.wikipedia.org/wiki/Return_value_optimization)).
Returning a local variable by value is detected by the compiler, and the
needless copy is elided. This optimization was first developed in 1991, so you
can rest assured your compiler supports it.

> Even in C++03, returning by value usually results in no copies because of
> NRVO.

Now, I say _usually_, because there are corner cases where this optimization
will not trigger. See the [Wikipedia
Article](http://en.wikipedia.org/wiki/Return_value_optimization) for more
details.

In the next section we'll consider another problem where move semantics are needed.

#### Other clever solutions

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

### Why do I _really_ need moves and C++11?

We saw that our previous problem of _transferring values out of a terminating
scope_ is still solvable in C++03, through clever compiler optimization. We
need to cover the converse situation of _transferring values into a scope_, in
situations like:

* Passing subcomponents to a constructor of an aggregate
* Handing off a value to another task or thread.

In all of the above cases, the need to transfer without copying is necessary.
Yet again, pointers are not the answer here. Using pointers for this transfer
requires managing the storage (either the heap, or some shared memory), which
should be unnecessary.

Simply put, our two use cases for moves allow efficient passing of values.

> Moves allow value semantics, without extraneous copies.

To keep a concrete problem in mind, let's look at initializing an aggregate
object from two _Vector_ objects.

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

### What are rvalues and how do they relate to move semantics?

The key feature that we need, is to tell apart regular values, and "temporary"
ones. Once we know that, we can decide whether to copy or move. By looking at a
typical assignment we can see where the terms _lvalue_ and _rvalue_ come from:

{% highlight cpp %}
//     c is an lvalue
//     |
Vector c = a + b;
//         ^^^^^
// the result of the "a + b" expression is an rvalue
{% endhighlight %}

* _Lvalues_ are values that you can freely refer to in their scope because they
  are bound to an identifier- such as variables. _Lvalues_ are also assignable.
* _Rvalues_, cannot be directly referred to because they are temporaries and
  are not bound to an identifier- such as values returned by a function, or the
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
functions/methods/constructors for rvalue arguments:

{% highlight cpp %}
// Move constructor
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

Above we define a proper "Move Constructor" which is called by the compiler
when we try to construct an object from an _rvalue_. Since the _rvalue_ will
soon expire, a simple move intead of a copy will suffice. A move involves:

* A shallow copy
   
   * We take pointers/resources directly from the other object

* Nullify the source

   * Having stolen the pointers/resources, we nullify these fields in the
     source so the destructor doesn't release them.

> Rvalues cannot be used directly, only through rvalue references
> <code>&amp;&amp;</code>.  The two are separate notions.

### How to use `std::move`? Does it perform the move?

This article is about moves, and yet we have yet to use `std::move`. What gives?
We have seen _rvalues_, and _rvalue references_

{% highlight cpp %}
class Ray
{
    Vector origin_;
    Vector direction_;

public:
    // Construct by copying subcomponents
    Ray(Vector origin, Vector direction);
    
    // Construct by moving subcomponents
    Ray(Vector&& origin, Vector&& direction);

    // etc...
};
{% endhighlight %}

> std::move is nothing more than a cast from an lvalue to an rvalue, to allow
> an actual move to happen

Using `std::move` we can tell the compiler that the value is no longer needed
in this scope.  By casting an lvalue to an rvalue, the compiler can now pick
the correct overload that accepts the rvalue argument, such as a move
constructor.

When composing a larger aggregate out of smaller movable objects, we can
delegate the process of moving to the sub-components using `std::move`.

{% highlight cpp %}
// Construct by moving subcomponents
Ray::Ray(Vector&& origin, Vector&& direction)
    // move construct inner objects
    : origin_(std::move(origin))
    , direction_(std::move(direction))
{ }
{% endhighlight %}

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
    return Ray(
        std::move(origin),
        std::move(direction)
    );
}
{% endhighlight %}

### Is there a difference between an _rvalue_ and an _rvalue reference_?

Long story short: Yes! The two notions are very different.  I see this
misconception come up time and time again, but not in the form of this direct
question. The truth is, when learning the new concept of rvalues, the ideas of
_rvalues_ and _rvalue references_ become conflated together.  Many refer to
one or the other interchangeably.  This is a stage I lived through, and was
surprised that this is rarely disambiguated directly.

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
> reference to a local is as bad as returning an lvalue reference.

### Are moves free? Are moves faster than copies?

Are moves free? No. As we have seen:

* Moves are shallow copies
* That also nullify the source of the copy

Both operations have to be performed to move an object. Fortunately, moves are
usually faster than copies,

Are moves faster than copies? This depends. Moves pay off for structures with
indirection, (like vectors), since copying all of the data is not required
(just pointers). However, moves _are_ copies for structures without pointers,
since

* If there is no "depth" to the structure, then there are no performance
  benefits to moves.
* Pointers is general for any type of referral, an actual pointer or just some
  kind of unique id.

> For simple structures with no indirection, moves are copies.

