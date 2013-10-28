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
---

The questions we'll cover:
{:toc}

### Why are moves needed?

Let's consider a simple fixed-sized vector of numbers:

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

### How do you "move" in C++03?

{% highlight cpp %}
// Copy constructor
Vector::Vector(Vector const& other)
    : storage_(new double[other.size()])
    , size_(other.size())
{
    std::copy(other.begin(), other.end(), storage_);
}
{% endhighlight %}

* Copy Elision - C++ standard
* NRVO - Named Return Value Optimization

{% highlight cpp %}
// Works in C++03 because of NRVO
Vector operator + (Vector const& a, Vector const& b)
{
    assert(a.size() == b.size());
    Vector result(a.size());

    std::transform(
        a.begin(), a.end(),
        b.begin(),
        result.begin(),
        std::plus
    );

    return result;
}
{% endhighlight %}

* Expression Templates - see Eigen
* Faking Rvalues - see Boost

### Why do I _really_ need moves and C++11?

We saw that our previous problem as still solvable in C++03, through clever compiler
optimization, without any first-class support of "moving" in the language.  So
what situations require these mythical "move" operations?

TODO: transferring values into a scope.

TODO: example. function taking a value, or lvalue reference, but we only need to pass a temporary

### What are rvalues and how do they relate to move semantics?

The key feature that we need, is to tell apart regular values, and "temporary" ones. Once we know
that, we can decide whether to copy or move. By looking at a typical assignment we can see where
the terms _lvalue_ and _rvalue_ come from:

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

### How to use `std::move`?

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

    // standard iterator fare (begin(), end(), etc...)
    // ...
};
{% endhighlight %}

### Is there a difference between an _rvalue_ and an _rvalue reference_?

Long story short: Yes! The two notions are very different.  I see this
misconception come up time and time again, but not in the form of this direct
question. The truth is, when learning the new concept of rvalues, the ideas of
_rvalues_ and an _rvalue references_ become conflated together.  Many refer to
one or the other interchangeably.  This is a stage I lived through, and was
surprised that this is rarely disambiguated directly.

This often manifests itself in code like this (which doesn't work):

{% highlight cpp %}
// How NOT to do it
std::string&& func()
    return std::move( std::string( "Hello World!" ) );
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

We all know that returning a reference to a local value 


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

