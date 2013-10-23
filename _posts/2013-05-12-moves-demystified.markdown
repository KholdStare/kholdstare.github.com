---
layout: post
title: "Moves demystified"
description: >
  Learning to use move semantics is crucial for good C++11 style. Moves are
  cheaper than copies and allow passing around large objects by value-
  something that was a big no-no in C++03. I've noticed that many (including
  me), had trouble with some of the concepts initially.  The article aims to
  crack down on common stumbling points.

category: technical
testing: true
published: false
notfrontpage: true
tags:
  - c++11
---

### Using moves

Before 

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

