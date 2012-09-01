---
layout: post
title: "Objects and Threads in C++ and Qt (Part 1)"
description: >
  When I first started working on a team using Qt (in a C++ environment),
  I would hear co-workers talk about "objects being on threads",
  and then immediately talk about how several threads are accessing the same object.
  It would confuse the hell out of me, with the two ideas completely opposed to each other.
category: technical
tags:
  - c++
  - qt
  - threading
---

Fortunately I eventually saw through the confusion, and will attempt to present this information here, starting from the very basics, and working my way up. I will first talk about what are objects and threads in the "vanilla C++" sense, and then work it into the context of Qt <code>QObjects</code> and <code>QThreads</code>. Many things mentioned here might seem very obvious to many, but, in my experience a lot of developers get by without a firm grasp on these concepts. I was one of them :D.

### What are objects?

When I talk about objects in C++, I refer of course to instances of a class. But what is an instance of a class; how does it really look like? Let's take a very simple example of a class:

{% highlight cpp %}
class Person {

public:
    Person(string const& m_name);
    ~Person();

    int getAge() { return m_age; }

    void haveBirthdayParty()
    {
        ++m_age;
    }

    // imagine other methods here

    private:
    string m_name;
    int m_socialInsuranceNumber;
    int m_age;
};
{% endhighlight %}

Now that we have this <code>Person</code> class, let's see what happens when we instantiate this class:

{% highlight cpp %}
Person stackPerson("John");
Person* heapPerson = new Person("Jack");
{% endhighlight %}

What happens, is we allocate memory (either on the stack or on the heap), for the object's members. So in this case, <code>m_name</code>, <code>m_socialInsuranceNumber</code> and <code>m_age</code>. And nothing else- that is all we need to know about that particular instance of the class. Specifically, we do not care about the method implementations- those are already in memory as part of the executable.

{% assign diagram = "objects-in-memory" %}
{% include diagram.html %}

Well, you might ask, if the methods are seperate from the object, how does this work:

{% highlight cpp %}
int heapPersonAge = heapPerson->age();
{% endhighlight %}

In other words, how does c++ know how to deal with a specific instance method, if there is only one method in memory? The answer is, C++ is sneaky. When you declare/define a method like so:

{% highlight cpp %}
void Person::haveBirthdayParty()
{
    ++this->m_age;
}
{% endhighlight %}

<p>
It actually looks like this in memory:
</p>

{% highlight cpp %}
void Person::haveBirthdayParty(Person* this)
{
    ++this->m_age;
}
{% endhighlight %}

So the method is just like any other function, but it takes an implicit <code>this</code> pointer to an instance of the class! To clarify, what we wrote a few lines above:

{% highlight cpp %}
int heapPersonAge = heapPerson->age();
{% endhighlight %}

Is actually:

{% highlight cpp %}
int heapPersonAge = Person::age(heapPerson);
{% endhighlight %}

Aha! To conclude (barring virtual functions):

> An object is nothing more than a collection of its members sitting somewhere in memory. Methods are not part of an object; methods are just functions that act on objects.

### Threads

One of the first things we learn as programmers, is the notion of control flow through the programs we write; There is an order in which functions are executed by the CPU.

Knowing this, you can think of a thread in a multi-threaded program as one of many control flows through it. All threads share the same program code, heap memory, but have individual stacks and program counters (to keep track of where they are in their control flow). Let's take a look at threads as control flows:

One of the most important things to see in the diagram, is that all code is accessible to any thread. Two threads could be executing the same function at the same time.

In addition, even though the diagram shows the two control flows side-by-side, you cannot make any assumptions on where the two threads are relative to each other. This is the concern of multi-threaded programming and thread synchronization, which is beyond the scope of this article.

In terms of memory, as said before, each thread has its own stack for local variables, but all threads share the heap.

### Threads and Objects

As we saw in the last section, a method is just another function, and thus many threads can call a particular method, on the same object, even at the same time. All a thread needs is a pointer to the location of an object (even if the object is on another thread's stack :S), and it is now free to call any of its methods. The lesson here is:

> A thread is control flow. A single object's method, being a glorified function, can be called by any thread at any time. An object does not belong to any single thread.

Join me in part 2 to see how these notions translate to working with Qt! 
