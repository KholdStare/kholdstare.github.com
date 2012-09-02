---
layout: post
title: "Objects and Threads in C++ and Qt (Part 2)"
description: >
  Last time I explained how plain C++ objects and their methods interact with threads.
  This time around, we will look at <code>QObjects</code>, and their "thread affinity".
category: technical
tags:
  - c++
  - qt
  - threading
---

Now that we know objects meothds can be accessed by any thread at any time,
we'll consider the situation fro mthe point of view of Qt.

### What are QObjects?

Qt is a great framework, and its the heart are
<a href="http://qt-project.org/doc/qt-4.8/object.html"><code>QObjects</code></a>.
Through Qt's <a href="http://qt-project.org/doc/qt-4.8/moc.html#moc">moc compiler</a>
extra functionality is seemlessly added to C++ objects.
The two most notable additions are <a href="http://qt-project.org/doc/qt-5.0/signalsandslots.html">signals and slots</a> for inter-object communication, and <a href="http://qt-project.org/doc/qt-5.0/eventsandfilters.html">events</a>.
These allow great flexibility and modularity, but how do they work in the context of threads?

For example, if an event or slot is triggered in a <code>QObject</code> (which
ultimately triggers a function), which thread is calling that function? The
answer lies in _thread affinity_. But let's back up a bit.

### Qt threads and Event loops

Having the ability to asynchronously trigger functions, and raise/handle events
means that Qt must have some kind of an event loop. An event loop will continually
monitor a queue of events to be handled, and dispatch them accordingly.
Indeed, every <code>QThread</code> has a built-in <a href="http://qt-project.org/doc/qt-5.0/qthread.html#exec">event loop</a> that can be entered.

{% highlight cpp %}
class MyThread : public QThread {
    
    Q_OBJECT

public:
    MyThread();
    ~MyThread();

protected:
    virtual void QThread::run() {
        // custom initialization code

        exec(); // start event loop!
    }
};
{% endhighlight %}

In particular the GUI thread (the main thread), also has an event loop which is
launched with by calling <a href="http://qt-project.org/doc/qt-4.8/qcoreapplication.html#exec"><code>QApplication::exec()</code></a>, which only returns after the user has quit the program.

{% highlight cpp %}
int main(int argc, char **argv)
{
    QApplication app(argc, argv);
    QWidget myWidget;
    myWidget.show();

    return app.exec(); // starts main event loop
}
{% endhighlight %}

So far the most important thing to remember is:

> Threads in Qt handle asynchronous events, and thus all have an event-loop.

### QObjects and QThreads

Now we come to the meat of this post- if C++ objects can be accessed by any
thread, then what thread is handling the events of a particular <code>QObject</code>?
The answer is that whenever a <code>QObject</code> is created, it is assigned a parent thread
which handles all of it's events and slot invocations- it has a _thread
affinity_. Whichever thread it was created in, becomes it's parent thread!

This is where the confusion came about for me. On the one hand C++ object
methods can be called from any thread at any time, while <code>QObjects</code> (themselves
C++ objects) have a parent thread which handles its events. As you can hopefully
see, there is no conflict:

> QObject methods can be called from any thread at any time, just like a C++
> object. In addition, a parent thread is assigned to handle any
> asynchronous events and slot invocations.

So there are two ways for a function to be called on a QObject:

* Directly from any thread
* Indirectly by invoking a connected slot or raising an event. This posts an event onto the parent thread's event loop, which eventually calls the function in question.

{% assign diagram = "event-loops" %}
{% assign caption = "Two threads with an object assigned to each thread's event loop. Each event loop handles events by invoking corresponding functions on the object. Notice how another object's methods can still be called from another thread directly. (calling userFunction)" %}
{% include diagram.html %}

I hope you enjoyed this simplified rundown of <code>QObjects</code> and threads! More in-depth documentation can be found on the <a href="http://qt-project.org/doc/qt-4.8/threads-qobject.html">Qt-project website</a>.

