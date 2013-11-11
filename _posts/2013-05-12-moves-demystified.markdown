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

   * Doesn't compose! Can't chain several additions.

> Need some way to transfer a value out of scope directly, without copying

Copying the value out of a function and then deleting the local seems absurd.
Let's see what we could do already in C++03 to tackle this problem.

### Can I "move" in C++03?

Ideally, given the problem of implementing `operator +` for two vectors, we'd want to write
 this:

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
Optimization](http://en.wikipedia.org/wiki/Return_value_optimization)). This
optimization was first developed in 1991, so you can rest assured your compiler
supports it.

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

We saw that our previous problem as still solvable in C++03, through clever
compiler optimization, without any first-class support of "moving" in the
language. However, this optimization only applied to return values -
transferring them out of a terminating scope. What happens when you need to
transfer an existing value _into_ a scope?


TODO: transferring values into a scope.

TODO: example. function taking a value, or lvalue reference, but we only need to pass a temporary

### What are rvalues and how do they relate to move semantics?

The key feature that we need, is to tell apart regular values, and "temporary"
ones. Once we know that, we can decide whether to copy or move. By looking at a
typical assignment we can see where the terms _lvalue_ and _rvalue_ come from:

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
    // nullify original
    other.storage_ = nullptr;
    other.size_ = 0;
}
{% endhighlight %}

> Rvalues cannot be used directly, only through rvalue references
> <code>&amp;&amp;</code>.  The two are separate notions.

### How to use `std::move`?

This article is about moves, and yet we have yet to use `std::move`. What gives?
We have seen _rvalues_, and _rvalue references_

{% highlight cpp %}
/**
 * Runtime-sized vector, but
 * Size fixed at construction.
 */
class Vector {
    std::vector<double> _storage;

public:
    Vector(size_t numElements) : _storage(numElements) { }

    // access
    double& operator[] (size_t i)       { return _storage[i]; }
    double  operator[] (size_t i) const { return _storage[i]; }

    size_t size() const { return _storage.size(); }
};
{% endhighlight %}



{% highlight cpp %}
// Move constructor
Vector::Vector(Vector&& other)
    // move construct inner std::vector
    : storage_(std::move(other.storage_))
{ }
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

* Moves are not free
   * Moves are shallow copies
   * That also nullify the source of the copy
* Moves _are_ copies for structures without pointers.
   * If there is no "depth" to the structure, then there are no performance benefits to moves.
   * Pointers is general for any type of referral, an actual pointer or just some kind of unique id.

### Rvalues vs Rvalue references

A common mistake I see when people try use rvalues is returning an _rvalue
reference_ from a function

{% highlight cpp %}
// How NOT to do it
std::string&& func()
    return std::move( std::string( "Hello World!" ) );
}
{% endhighlight %}

The trouble is, this is as bad as returning a reference to a local function
variable. The notion of an _rvalue_ and an _rvalue reference_ are conflated together.

Just as lvalue references refer to lvalues, rvalue references can bind to
rvalues.  By definition, rvalues cannot be used directly as there is no
identifier that is bound to them- they are "ethereal".  The only way we can
ever use them is through _rvalue references_ <code>&amp;&amp;</code> - this
gives us an identifier to refer to, and use _rvalues_.

> Rvalues cannot be used directly, only through rvalue references
> <code>&amp;&amp;</code>.  The two are separate notions.

As a little brainteaser, _rvalue references_ are themselves _lvalues_ - we can refer to them
through an identifier

TODO code example and maybe diagram?

