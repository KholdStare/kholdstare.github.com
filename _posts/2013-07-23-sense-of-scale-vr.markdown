---
layout: post
title: "A Sense of Scale in VR"
description: >
  I recently got my hands on the awesome Oculus Rift VR goggles and am
  extremely excited- the future is here! To create a compelling experience, a
  lot of factors must come together, not the least of which is a sense of
  scale.  In this post I will try to explain how it works in VR, why it's
  crucial, and how to go from there.

category: technical
testing: true
published: true
tags:
  - virtual-reality
  - oculus-rift
---

### The Oculus Rift

For those unfamiliar with the [Oculus Rift](http://www.oculusvr.com/)- it is a Virtual Reality Head-Mounted
Display, currently available in the form of a developer kit. I received mine
last week, and have been having lots of fun experimenting with it!

Image(s)

At this year's GDC, Oculus co-founder Palmer Luckey gave [an overview of what
we can expect from
VR](http://www.youtube.com/watch?feature=player_detailpage&v=29QdErw-7c4#t=1000s),
and he specifically mentioned the unique sense of scale afforded by VR. I was
intrigued and decided to focus on this aspect for my experimentation.

> A sense of scale is the ability to tell the size and distance of an object
> in relation to oneself.

Before we dive into (Virtual) Reality, how do we tell scale in traditional 2D
forms of entertainement? If we lose the stereo vision, what clues can a game
designer or cinematographer use to give scale to objects?

### Sense of Scale in 2D

The simplest way to know the scale of an object, is to already be familiar with
its size in everyday life. If you see a chair or a car in a game or a
movie, you can safely assume what their size is- you don't even think about it.

What about foreign objects? How big is a space ship, an alien, or an aircraft
carrier if you've never seen one before. This one is also fairly obvious- put
familiar objects next to it! Seeing people walking around an air-craft carrier
instantly suggests its huge size.

The biggest hint however, is parallax.

> Parallax is the relative movement of objects as a result of a change in
> point of view

Seeing how objects move relative to each other at different depth, hints at
their size and distance. Without stereo vision, _parallax_ can be achieved
through _movement_- be it panning the camera in a movie, or running around in a
First Person Shooter game. No matter how much you run, that mountain doesn't
seem to budge from its spot, suggesting great distance and size.

![Depth achieved through rapidly alternating between two views](http://i.imgur.com/jrrbDED.gif)

To recap we have (at least) these tools to help convey scale in a
two-dimensional medium:

* __Familiar objects__
* __Relative size__
* __Parallax__

However, as [this paper about visual scale] by _Andrew C. Beall et al_ points
out, a lot of these cues rely on assumptions from the observer

> Aside from accommodation and convergence, all of the other cues to absolute
> scale are subject to assumptions on the part of the observer (absolute motion
> parallax: stationarity of objects; height in the field: the eye is at normal
> eye height; familiar size: the object is its normal size; relative size: each
> element is of the same distal size)

In other words, if creatively you want a chair that is the size of a house, you
will be fighting against the viewer's asumption of its size. If you are trying
to convey the size of a large spaceship, while zooming by at hundreds of miles
an hour, the brain's interpretation of parallax will be relative to every-day
speeds -- that of walking or running -- resulting in underrepresentation of
scale.

Clearly we need to involve as many cues as possible to give a complete idea of
scale. We need stereoscopic vision to go the full distance, and we shall why.

### Interpupilary Distance

Interpupilary distance, or `IPD` for short, is the distance between the pupils 
of your eyes. It turns out this distance is extremely important for several reasons which we will examine:


If we dig deeper there's actually two distances you have to worry about:

* Real IPD - This is the actual distance between the centers of your pupils in
  the real world. The main purpose of this is to determine where to position
  the virtual camera outputs on the screen in front of you, so that it lines up
  with your eyes. This number is _crucial_ to get right in order to avoid eye
  strain.
* Virtual IPD - This is the distance between the cameras (or virtual eyes) in
  the _virtual_ world. We shall see that this distance completely determines
  the sense of scale of objects in relation to you.

Quick recap of Real IPD

> Real IPD is used to line up the projection of virtual cameras with your eyes.
> This ensures correct perspective and vergeance.

### Virtual IPD


Diagram relative to object


Diagram relative to eyes

### Experimenting in Tuscany

Link to code that allows scaling of player with screenshots

{% highlight cpp %}
// sample
{% endhighlight %}

### Other Articles

There are also lots of great talks and blogs that explore and explain
the challenges of VR in great depth- created by these forerunners in the
industry. I'll list a few of them here:

* Valve's Michael Abrash talks about latency, judder and other [problems VR faces with current graphics/display technology](http://blogs.valvesoftware.com/abrash/)
* Tom Forsyth from the Oculus team talks about [challenges with VR sickness](http://www.oculusvr.com/blog/vr-sickness-the-rift-and-how-game-developers-can-help/)
* Robotic Scientist Steve LaValle explores [motion prediction for head tracking](http://www.oculusvr.com/blog/the-latent-power-of-prediction/)

[1]: (www.recveb.ucsb.edu/pdfs/BeallLoomisPhilbeckFikes-95.pdf)

