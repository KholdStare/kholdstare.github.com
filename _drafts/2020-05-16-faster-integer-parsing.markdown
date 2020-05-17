---
layout: post
title: "Faster Integer Parsing"
description: >
  Back with a post after 6 years of silence. If you had to parse a
  nanosecond-resolution epoch timestamp as quickly as possible, how would you
  do it?  We'll take a look at using compiler intrinsics to do it in log(n)
  time.

category: technical
published: true
testing: true
scripts:
  - https://unpkg.com/chart.js@2.9.3/dist/Chart.bundle.min.js
  - https://unpkg.com/chartjs-chart-box-and-violin-plot@2.3.0/build/Chart.BoxPlot.min.js
tags:
  - c++
  - simd
  - optimization
---

### The problem

Let's say, theoretically, you have some text-based protocol, or file that
contains nanosecond timestamps. You need to parse these timestamps as quickly
as possible. Maybe it's json, maybe it's a csv file, maybe something else
bespoke.

{% highlight csv %}
timestamp,event_id
1585201087123567,a
1585201087123585,b
1585201087123621,c
{% endhighlight %}

In the end you have to implement a function similar to this:

{% highlight cpp %}
std::uint64_t parse_timestamp(std::string_view s)
{
  // ???
}
{% endhighlight %}

### The naive solution

Let's write a good old for loop. Read the string character by character, and
build up the result.

{% highlight cpp %}
std::uint64_t parse_simple(std::string_view s) noexcept
{
  const char* cursor = s.data();
  const char* last = s.data() + s.size();
  std::uint64_t result = 0;
  for(; cursor != last; ++ cursor)
  {
    result *= 10;
    result += *cursor - '0';
  }
  return result;
}
{% endhighlight %}
