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
scripts:
  - https://unpkg.com/chart.js@2.9.3/dist/Chart.bundle.min.js
  - https://unpkg.com/chartjs-plugin-datalabels@0.7.0/dist/chartjs-plugin-datalabels.js
  - /javascripts/posts/faster-integer-parsing-bar-charts.js
  - /javascripts/render-charts.js
tags:
  - c++
  - simd
  - optimization
---

### The problem

Let's say, theoretically, you have some text-based protocol, or file that
contains nanosecond timestamps. You need to parse these timestamps as quickly
as possible. Maybe it's json, maybe it's a csv file, maybe something else
bespoke. It's 16 characters long, and this could also apply to credit card
numbers.

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

---------

### The native solution

Let's start with what's available, and compare. We have
[`std::atoll`](https://en.cppreference.com/w/cpp/string/byte/atoi) , a function
inherited from C,
[`std::stringstream`](https://en.cppreference.com/w/cpp/io/basic_stringstream)
, and the newer C++17
[`<charconv>`](https://en.cppreference.com/w/cpp/header/charconv) header. I'll
be using [Google Benchmark](https://github.com/google/benchmark) to measure the
performance, and to have a baseline let's compare against loading the final
result into a register - i.e. no actual parsing involved.

Let's run the benchmarks! The code is not important here, it just shows what is being benchmarked.

{% highlight cpp %}
static void BM_mov(benchmark::State& state) {
  for (auto _ : state) {
    benchmark::DoNotOptimize(1585201087123789);
  }
}

static void BM_atoll(benchmark::State& state) {
  for (auto _ : state) {
    benchmark::DoNotOptimize(std::atoll(example_timestamp));
  }
}

static void BM_sstream(benchmark::State& state) {
  std::stringstream s(example_timestamp);
  for (auto _ : state) {
    s.seekg(0);
    std::uint64_t i = 0;
    s >> i;
    benchmark::DoNotOptimize(i);
  }
}
static void BM_charconv(benchmark::State& state) {
  auto s = example_timestamp;
  for (auto _ : state) {
    std::uint64_t result = 0;
    std::from_chars(s.data(), s.data() + s.size(), result);
    benchmark::DoNotOptimize(result);
  }
}
{% endhighlight %}

{% assign canvas-id = "benchmark-canvas-native" %}
{% include canvas.html %}

Wow, `stringstream` is pretty bad. Not that it's a fair comparison but parsing
a single integer using `stringstream` is 391 times slower than just loading our
integer into a register.  `<charconv>` does a lot better by comparison.

Since we know our string contains the number we're trying to parse, and we
don't need to do any whitespace skipping, can we be faster?  Just how much time
is spent in validation?

---------

### The naive solution

Let's write a good old for loop. Read the string character by character, and
build up the result.

{% highlight cpp %}
inline std::uint64_t parse_naive(std::string_view s) noexcept
{
  std::uint64_t result = 0;
  for(char digit : s)
  {
    result *= 10;
    result += digit - '0';
  }
  return result;
}
{% endhighlight %}

{% assign canvas-id = "benchmark-canvas-naive" %}
{% include canvas.html %}

That's actually not bad for a simple for loop. If such a simple solution is
able to beat a standard-library implementation, it means there's quite a lot of
effort that goes into input validation. As a sidenote - if you know your input,
or can do simpler validation you can get some significant speedups.

For further solutions and benchmarks, let's ignore the standard library
functions. We should be able to go much faster than this.

---------

### The brute force solution

If we know it's 16 bytes, why even have a forloop? Let's unroll it!

{% highlight cpp %}
inline std::uint64_t parse_unrolled(std::string_view s) noexcept
{
  std::uint64_t result = 0;

  result += (s[0] - '0') * 1000000000000000ULL;
  result += (s[1] - '0') * 100000000000000ULL;
  result += (s[2] - '0') * 10000000000000ULL;
  result += (s[3] - '0') * 1000000000000ULL;
  result += (s[4] - '0') * 100000000000ULL;
  result += (s[5] - '0') * 10000000000ULL;
  result += (s[6] - '0') * 1000000000ULL;
  result += (s[7] - '0') * 100000000ULL;
  result += (s[8] - '0') * 10000000ULL;
  result += (s[9] - '0') * 1000000ULL;
  result += (s[10] - '0') * 100000ULL;
  result += (s[11] - '0') * 10000ULL;
  result += (s[12] - '0') * 1000ULL;
  result += (s[13] - '0') * 100ULL;
  result += (s[14] - '0') * 10ULL;
  result += (s[15] - '0');

  return result;
}
{% endhighlight %}

{% assign canvas-id = "benchmark-canvas-brute-force" %}
{% include canvas.html %}

Ok, that's slightly better again, but we're still processing a character at a time.

---------

### The byteswap insight

Let's draw out the operations in the unrolled solution as a tree, on a
simplified example of parsing '1234' into a 32-bit integer:

{% assign diagram = "parse-unrolled" %}
{% assign caption = "Unrolled solution graph of operations for '1234'" %}
{% include diagram.html %}

We can see that the amount of multiplications and additions is linear with the
amount of characters. It's hard to see how to improve this, because every
multiplication is by a different factor (so we can't multiply "in one go"), and at
the end of the day we need to add up all the intermediate results.

However, it's still very regular. For one thing, the first character in the
string is multiplied by the largest factor, because it is the most significant
digit.

> On a little-endian machine (like x86), an integer's first byte contains the
> least significant digits, while the first byte in a string contains the most
> significant digit.

{% assign diagram = "parse-byteswap-insight" %}
{% assign caption = "Looking at the string as an integer we can get closer to
the final parsed state in fewer operations - see how the hex representation is
__almost__ what we want" %}
{% include diagram.html %}

Now to reinterpret the bytes of a string as an integer we have to use
`std::memcpy` ([to avoid strict-aliasing
violations](https://blog.regehr.org/archives/1307)), and we have compiler
instrinsic `__builtin_bswap64` to swap the bytes in one instruction. The
`std::memcpy` will get optimized out, so this is a win so far.

{% highlight cpp %}
template <typename T>
inline T get_zeros_string() noexcept;

template <>
inline std::uint64_t get_zeros_string<std::uint64_t>() noexcept
{
  std::uint64_t result = 0;
  constexpr char zeros[] = "00000000";
  std::memcpy(&result, zeros, sizeof(result));
  return result;
}

inline std::uint64_t parse_8_chars(const char* string) noexcept
{
  std::uint64_t chunk = 0;
  std::memcpy(&chunk, string, sizeof(chunk));
  chunk = __builtin_bswap64(chunk - get_zeros_string<std::uint64_t>());

  // ...
}
{% endhighlight %}

But now that we have an integer that kind of, sort of looks like what we want,
how do we get it across the finish line without too much work?

---------

### The divide and conquer insight

From the previous step, we end up with an integer whose bit representation 
has each digit placed in a separate byte. I.e. even though one byte can
represent up to 256 values, we have values 0-9 in each byte of the integer.
They are also in the right little endian order. Now we just need to "smash"
them together somehow.

We know that doing it linearly would be too slow, what's the next possibility?
__O(log(n))__! We need to combine every adjacent digit into a pair in one step,
and then each pair of digits into a group of four, and so on, until we have the
entire integer.

> The key is working on adjacent digits simultaneously. This allows a tree of
> operations, running in O(log(n)) time.

This involves multiplying the odd-index digits by a power of 10 and leaving the
even-index digits alone. This can be done with bitmasks to selectively apply
operations

{% assign diagram = "parse-mask-insight" %}
{% assign caption = "By using bitmasking, we can apply operations to more than one digit at a time, to combine them into a larger group" %}
{% include diagram.html %}

In order to finish the `parse_8_chars` function we started earlier, let's
employ this masking trick:

{% highlight cpp %}
inline std::uint64_t parse_8_chars(const char* string) noexcept
{
  std::uint64_t chunk = 0;
  std::memcpy(&chunk, string, sizeof(chunk));
  chunk = __builtin_bswap64(chunk - get_zeros_string<std::uint64_t>());

  // 1-byte mask trick (works on 4 pairs of single digits)
  std::uint64_t lower_digits = chunk & 0x000f000f000f000f;
  std::uint64_t upper_digits = ((chunk & 0x0f000f000f000f00) >> 8) * 10;
  chunk = lower_digits + upper_digits;

  // 2-byte mask trick (works on 2 pairs of two digits)
  lower_digits = chunk & 0x000000ff000000ff;
  upper_digits = ((chunk & 0x00ff000000ff0000) >> 16) * 100;
  chunk = lower_digits + upper_digits;

  // 4-byte mask trick (works on pair of four digits)
  lower_digits = chunk & 0x000000000000ffff;
  upper_digits = ((chunk & 0x0000ffff00000000) >> 32) * 10000;
  chunk = lower_digits + upper_digits;

  return chunk;
}
{% endhighlight %}

--------- 

### The trick

Putting it all together, to parse our 16-digit integer, we break it up into two
chunks of 8 bytes, run `parse_8_chars` that we have just written, and benchmark it!

{% highlight cpp %}
inline std::uint64_t parse_trick(std::string_view s) noexcept
{
  std::uint64_t upper_digits = parse_8_chars(s.data());
  std::uint64_t lower_digits = parse_8_chars(s.data() + 8);
  return upper_digits * 100000000 + lower_digits;
}

static void BM_trick(benchmark::State& state) {
  for (auto _ : state) {
    benchmark::DoNotOptimize(parse_trick(example_stringview));
  }
}
{% endhighlight %}

{% assign canvas-id = "benchmark-canvas-trick" %}
{% include canvas.html %}

Not too shabby, we shaved almost 45% off of the unrolled loop benchmark! Still,
it feels like we are manually doing a bunch of masking and elementwise
operations. Maybe we can just let the CPU do all the hard work?

---------

### The SIMD trick

We have two insights:

* Reverse order of bytes to get digits in the right order
* Combine groups of digits simultaneously to achieve O(log(n)) time

We also have a 16-character, or 128-bit string to parse - can we use SIMD? Of
course we can! [SIMD stands for Single Instruction Multiple
Data](https://en.wikipedia.org/wiki/SIMD), and is exactly what we are looking
for. SSE and AVX instructions are supported on both Intel and AMD CPUs, and
 they typically work with wider registers.

I used a [great reference
page](https://software.intel.com/sites/landingpage/IntrinsicsGuide/) to find
the right compiler intrinsics for the right SIMD CPU instructions. (The linked
site does not seem to working correctly on 2020-02-25)

To do the byteswap on all 16 bytes we can use `_mm_shuffle_epi8`. The wide
128-bit integer type is another compiler intrinsic, `__m128i`. To do the
byteswap, we'll need to create a mask that reverses the byte order. For this we
can use `_mm_set_epi8`, which will get optimized out and compiled into the
binary as a constant.

{% highlight cpp %}
#include <immintrin.h>

template <>
inline __m128i byteswap(__m128i a) noexcept
{
  const auto mask = _mm_set_epi8(
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
  );
  return _mm_shuffle_epi8(a, mask);
}
{% endhighlight %}

Then we repeat the first part of the trick for all 16 bytes.

{% highlight cpp %}
template <>
inline __m128i get_zeros_string<__m128i>() noexcept
{
  __m128i result = {0, 0};
  constexpr char zeros[] = "0000000000000000";
  std::memcpy(&result, zeros, sizeof(result));
  return result;
}

inline std::uint64_t parse_16_chars(const char* string) noexcept
{
  using T = __m128i;
  T chunk = {0, 0};
  std::memcpy(&chunk, string, sizeof(chunk));
  chunk = byteswap(chunk - get_zeros_string<T>());
  
  // ...
}
{% endhighlight %}

And now, the star of the show are the `madd` functions. These SIMD functions do
exactly what we did with our bitmask tricks - they take a wide register,
interpret it as a vector of smaller integers, multiply each by a given
multiplier, and add neighboring ones together into a vector of wider integers.
All in one instruction!

As an example of taking every byte, multiplying the odd ones by 10 and adding
adjacent pairs together, we can use
[`_mm_maddubs_epi16`](https://www.felixcloutier.com/x86/pmaddubsw)

{% highlight cpp %}
// The 1-byte "trick" in one instruction
const auto mult = _mm_set_epi8(
  10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1
);
chunk = _mm_maddubs_epi16(chunk, mult);
{% endhighlight %}

There is another instruction for the 2-byte trick, but unfortunately I could
not find one for the 4-byte trick - that needed two instructions. Here is the
completed `parse_16_chars`:

{% highlight cpp %}
inline std::uint64_t parse_16_chars(const char* string) noexcept
{
  using T = __m128i;
  T chunk = {0, 0};
  std::memcpy(&chunk, string, sizeof(chunk));
  chunk = byteswap(chunk - get_zeros_string<T>());

  {
    const auto mult = _mm_set_epi8(
      10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1
    );
    chunk = _mm_maddubs_epi16(chunk, mult);
  }
  {
    const auto mult = _mm_set_epi16(100, 1, 100, 1, 100, 1, 100, 1);
    chunk = _mm_madd_epi16(chunk, mult);
  }
  {
    const auto mult = _mm_set_epi32(10000, 1, 10000, 1);
    auto multiplied = _mm_mullo_epi32(chunk, mult);
    const __m128i zero = {0, 0};
    chunk = _mm_hadd_epi32(multiplied, zero);
  }

  return ((chunk[0] >> 32) * 100000000) + (chunk[0] & 0xffffffff);
}
{% endhighlight %}

{% assign canvas-id = "benchmark-canvas-trick-simd" %}
{% include canvas.html %}

__1.14 nanoseconds__! Beautiful. And I'm sure there's ways to improve this further -
perhaps I have missed another SIMD instruction I could use. Even though this
may look like a toy problem - with no input validation - I bet a few more
clever SIMD instructions later and you can have something running under 2
nanoseconds complete with validation and length checking.

---------

### Conclusion

Compilers are absolutely amazing pieces of technology. They regularly surprise
me (or even blow my mind) at how well they can optimize code and see through
what I'm doing. While preparing the benchmarks for this post, I ran into a
problem - if the string I was trying to parse in the benchmarks was visible to
the compiler in the same compilation unit, no matter what I did, gcc and clang
would evaluate my solutions __at compile time__ and put the final result in the
binary. Even the SIMD implementation! All my benchmarks would come out to be
equivalent to a single `mov` instruction. I had to put the integer string in a
separate compilation unit, but I bet if I turned on LTO (Link Time
Optimization) the compiler would optimize that away too.

Having said all that, there is a culture of "optimization is the root of all
evil". That handwritten assembly or hand-optimization has no place anymore.
That we should just blindly rely on our compilers. I think both positions are
complementary - trust your compiler, trust you library vendor, but nothing
beats carefully thought out code when you know your inputs and you've done your
measurements to know it will make a difference.

Imagine your business revolved around parsing a firehose of telemetry data, and
you chose to use `std::stringstream`. Would you buy more servers or spend a
little time optimizing your parsing?

{% assign canvas-id = "benchmark-canvas-all" %}
{% include canvas.html %}

---------

### Post Scriptum

* All benchmarks ran on a 3.8Ghz AMD Ryzen 3900X
* Running on a Mac from 2014 wth an Intel processor and compiling with Clang,
  the non-SIMD trick actually ran slower than the naive loop. The SIMD trick was
  still fastest.
* I left out table-based parsing methods because I believe they would be slower
  than the SIMD method here, as they require more data cache usage, and frankly I
  was lazy to fill out those tables. If people believe the contrary, I can spend
  some time adding that to these benchmarks.
* You can find the [code and the benchmarks here](https://github.com/KholdStare/qnd-integer-parsing-experiments).
* If something is unclear please let me know in the comments - I will try to
  clarify.
