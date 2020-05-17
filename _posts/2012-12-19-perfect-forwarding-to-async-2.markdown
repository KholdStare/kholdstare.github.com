---
layout: post
title: "Perfect Forwarding to Async Lambdas (Part 2)"
description: >
  In Part 1, the "value of rvalues" was discussed, as well as their use in the
  context of <code>std::async</code>. A problem was observed with how lvalues
  are handled, so in this part I will introduce perfect forwarding to deal with
  rvalues and lvalues generically and try to provide an optimal approach in that
  context.

category: technical
testing: false
published: true
tags:
  - c++
  - c++11
  - advanced
---

### Perfect Forwarding

When writing a library, or very generic functions, all bases should be covered,
and you may want to consider the case when a temporary object is passed in. With
C++11, you may now follow a "recipe" that accepts any argument, be it _lvalue_
or _rvalue_, _const_ or _non-const_:

{% highlight cpp %}
template<typename T>
wrapper(T&& arg) {
    foo(std::forward<T>(arg));
}
{% endhighlight %}

This is useful if you want to forward arguments exactly as they were passed in
to another function, which is accomplished using <a
href="https://en.cppreference.com/w/cpp/utility/forward"><code>std::forward</code></a>.

You may be asking, "Wait a minute... Isn't that an rvalue reference? Why does
this recipe work?". Well, without opening a whole can of worms, here is the
summary of an <a
href="https://channel9.msdn.com/Shows/Going+Deep/Cpp-and-Beyond-2012-Scott-Meyers-Universal-References-in-Cpp11">enlighting
talk on universal references by Scott Meyers</a>:

> When automatic type deduction is involved (followed by
> <code>&amp;&amp;</code>), such as <code>auto&amp;&amp;</code> or
> <code>T&amp;&amp;</code> in a function template, it can be interpreted as a
> "universal reference" and binds to everything.

The truth behind why this happens is beyond the scope of this article, and
Scott's talk does a much better job of explaining it than I can. Knowing this
new information, we can look at the different combinations of <code>T</code> and
<code>&amp;&amp;</code> in function templates, and what they imply:

{% highlight cpp %}
// pros: accepts both lvalues and rvalues,
// cons: but makes copies
template <typename T>
void printContents(T val);

// pros: no extra copies
// cons: does not accept const lvalues, or rvalues
template <typename T>
void printContents(T& val);

// pros: no extra copies, also accepts rvalues
// cons: cannot mutate val
template <typename T>
void printContents(T const& val);

// pros: accepts everything!
template <typename T>
void printContents(T&& val);
{% endhighlight %}

As we will see below, the difficulty of writing function templates that forward
the arguments, is that one has to keep track of all the different variations
that <code>T</code> can be.

### Lambdas and perfect forwarding

Before handling perfect forwarding in the context of <code>std::async</code>,
lets consider lambdas. Lambdas allow definitions of anonymous closures, that can
capture anything in lexical scope. Can we capture a forwarded argument?
Unfortunately, the C++11 standard does not include _capture by move_ or _capture
by forwarding_, so we have to manually pass them as arguments:

{% highlight cpp %}
// forward our move_checker to count moves/copies
template <typename T>
int forwardToLambda(T&& checker)
{
    auto lambda =
        // T&& here is the same type
        // as was deduced above
        [](T&& checker) mutable
        {
            return checker.payload[0];
        };

    // forward to the lambda
    return lambda(std::forward<T>(checker));
}
{% endhighlight %}

Taking it for a quick test drive with an lvalue:

{% highlight cpp %}
move_checker checker;

assert( checker.copies() == 0 );
assert( checker.moves() == 0 );

forwardToLambda(checker);

// no copies or moves!
assert( checker.copies() == 0 );
assert( checker.moves() == 0 );
{% endhighlight %}

I'll spare you all the other combinations, but rest assured all of them have the
optimal number of copies/moves. In summary:

> Perfect forwarding to lambdas can be accomplished by explicitly passing the
> forwarded arguments, as they cannot be captured optimally. The type for the
> lambda parameter must match that of the wrapping function template, i.e.
> <code>T&amp;&amp;</code>.

### The Problem

Alright! Phew! We covered rvalues, how <code>std::async</code> snuck an extra
copy in without us noticing, perfect fowarding, and lambdas. Now all concepts
conspire together to create a problem: How do we forward arguments optimally,
_through_ a function template, then _through_ an <code>async</code> call, and
finally _through_ a lambda, and write only one function definition to cover all
cases? Also, why the hell would anyone want to do that?

During the development of my library <a
href="https://github.com/KholdStare/plumbingplusplus">Plumbing++</a> I needed to
apply an arbitrary function to an iterable on a separate thread. It amounted to
the above problem, so here's a rough skeleton for the implementation:

{% highlight cpp %}
template <typename InputIterable, typename Func>
std::future<void> connect(InputIterable&& input, Func func)
{
    // launch async, and apply func to every element in input
    return std::async(std::launch::async,
            // ??? What do we pass to async?
            // Want to forward input, and capture func
            // to use in a for loop:
            //
            // for (auto&& e : input) {
            //     func(e);
            // }
    );
}
{% endhighlight %}

The first part of our requirements is already satisfied: Use
<code>T&amp;&amp;</code> to forward arguments through a function template. Let's
take an initial stab at the whole problem, just by using lambda capture:

{% highlight cpp %}
// SUB-OPTIMAL. lambda makes a copy
template <typename InputIterable, typename Func>
std::future<void> connect(InputIterable&& input, Func func)
{
    return std::async(std::launch::async,
            // input gets copied into lambda
            [func, input]() mutable
            {
                for (auto&& e : input) {
                    func(e);
                }
            }
    );
}
{% endhighlight %}

The above works, but introduces an unnecessary copy.  We cannot capture by
reference, since that would not work with rvalues. Let's use what we learnt from
the lambda section, and try to forward to the lambda. Of course, that would
require forwarding through the async call:

{% highlight cpp %}
// DOES NOT COMPILE for lvalues. see reasoning below.
template <typename InputIterable, typename Func>
std::future<void> connect(InputIterable&& input, Func func)
{
    return std::async(std::launch::async,
            // trying to forward to lambda through async
            [func](InputIterable&& input) mutable
            {
                for (auto&& e : input) {
                    func(e);
                }
            },
            std::forward<InputIterable>(input)
    );
}
{% endhighlight %}

The extra copy made by <code>std::async</code> rears its head. This is <a
href="https://stackoverflow.com/questions/13813838/perfect-forwarding-to-async-lambda">the
problem</a> that got me started on this journey. Here is a breakdown of what
happens to an lvalue that gets passed in:

* The type of <code>input</code> gets deduced correctly as an _lvalue reference_ <code>InputIterable&amp;</code>, and binds to an lvalue 
* We forward input to <code>std::async</code>, passing in an _lvalue reference_. 
* Then, <code>std::async</code> make a copy internally, creating a temporary _rvalue_. 
* Finally, <code>std::async</code> forwards this temporary _rvalue_ to the lambda, and the compilation fails because it cannot be bound to an _lvalue reference_ as we expect. 

So what can we do? If you still remember part one, we have to wrap the value
using <code>std::ref</code> to bypass the extra copy by <code>std::async</code>.
However, <code>std::ref</code> cannot be constructed from an rvalue, and thus cannot be used
to do perfect forwarding.

We need a unified solution, so we write our function template once.

### Solution

The solution I came up with is a thin wrapper, that I can use to forward
arguments through a <code>std::async</code> call, that is a wrapper for the
underlying type, only in some cases it wraps a reference, in other it holds a
full blown value. Let's call this structure <code>async_forwarder</code>

{% highlight cpp %}
/**
 * If T   move it inside forwarder.
 * If T&, just wrap it like std::ref
 */
template <typename T> struct async_forwarder;
{% endhighlight %}

To give you an idea of its use, let's implement the <code>connect</code>
function that we've been struggling with above.

{% highlight cpp %}
template <typename InputIterable, typename Func>
std::future<void> connect(InputIterable&& input, Func func)
{
    return std::async(std::launch::async,
            // the forwarder will automatically convert
            // to the apropriate type.
            [func](InputIterable&& input) mutable
            {
                for (auto&& e : input) {
                    func(e);
                }
            },
            async_forwarder<InputIterable>(std::forward<InputIterable>(input))
    );
}
{% endhighlight %}

Voila! So knowing that we always want to implicitly convert back to what it was
constructed from, let's specialize <code>async_forwarder</code> for _lvalue
references_:

{% highlight cpp %}
// This particular specialization
// is essentially std::ref
template <typename T>
class async_forwarder<T&>
{
    T& val_;

public:
    /**
     * Wrap the reference when passed an lvalue reference,
     * to fool std::async
     */
    async_forwarder(T& t) : val_(t) { }

    // ensure no copies are made
    async_forwarder(async_forwarder const& other) = delete;

    // move constructor
    async_forwarder(async_forwarder&& other)
        : val_(other.val_) { }

    // User-defined conversion that automatically
    // converts to the appropriate type
    operator T&       ()       { return val_; }
    operator T const& () const { return val_; }
};
{% endhighlight %}

This gets rid of the extra copy incurred by <code>std::async</code> by wrapping
the reference just like <code>std::ref</code>! To wrap things up, let's
specialize for rvalues, to complete the solution:

{% highlight cpp %}
template <typename T>
class async_forwarder
{
    // Store value directly
    T val_;

public:
    /**
     * Move an rvalue of T into the wrapper,
     * incurring no copies.
     */
    async_forwarder(T&& t) : val_(std::move(t)) { }

    // ensure no copies are made
    async_forwarder(async_forwarder const& other) = delete;

    // move constructor
    async_forwarder(async_forwarder&& other)
        : val_(std::move(other.val_)) { }

    // Move the value out.
    // Note: can only occur once!
    operator T&& ()       { return std::move(val_); }
    operator T&& () const { return std::move(val_); }
};
{% endhighlight %}

In effect, async_forwarder allows us to forward optimally through a
<code>std::async</code> call while retaining a single interface:

* _Lvalues_ are stored as wrapped references
* _Rvalues_ are moved inside
* The value is automatically converted back 

### Further Work

There might be some savings possible if <code>async_forwarder</code> is
declared <code>constexpr</code>, but I am not well versed in that feature of
C++11, so perhaps others can suggest its effectiveness.

### Conclusion

When trying to optimize performance for a particular problem, the standard
solution is not always the best, requiring one to "open the hood" and muck about
with the internals. In the case where an lvalue is guaranteed or expected to
outlive a thread's lifetime, copying the object into the thread is unnecessary,
and can be wrapped using <code>std::ref</code>. A unified interface in the form
of an <code>async_forwarder</code> is provided to handle perfect forwarding to
these <code>async</code> functions.
