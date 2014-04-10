---
layout: post
title: "A Sense of Scale in VR"
description: >
  The future is here! I recently got my hands on a pair of the awesome Oculus Rift 
  VR goggles, and I am extremely excited. While the demo software is impressive out 
  of the box, a lot of factors must come together to create a compelling experience. 
  In this post I will discuss the mechanisms behind the sense of scale in VR, highlight 
  its importance and propose new ways to explore this effect.

category: technical
published: true
scripts:
  - /javascripts/three.min.js
  - /javascripts/posts/vr-scale.js
tags:
  - virtual-reality
  - oculus-rift
---

### The Oculus Rift

For those unfamiliar with the [Oculus Rift](http://www.oculusvr.com/), it is
a Virtual Reality Head-Mounted Display, currently available in the form of a
developer kit. I received mine last week, and have been having lots of fun
experimenting with it!

At this year's GDC, Oculus co-founder Palmer Luckey gave [an overview of what
we can expect from
VR](http://www.youtube.com/watch?feature=player_detailpage&v=29QdErw-7c4#t=1000s),
and he specifically mentioned the unique sense of scale afforded by VR. I was
intrigued and decided to focus on this aspect for my experimentation.

### Sense of Scale

> A sense of scale is the ability to tell the size and distance of an object
> in relation to oneself, given a visual representation.

As the following animation demonstrates, it can be difficult to tell how big or 
how far away an object is without visual cues:

{% assign canvas-id = "scene-sphere" %}
{% assign caption = "A single scene viewed from the top, and from a perspective camera. From the top view, a sphere changes size and position, but appears stationary in the perspective view. This is because the object always takes up the same area in the field of view (shown by the dotted lines)" %}
{% include canvas.html %}

An object viewed in isolation does not tell us much in 2D -- the area it takes
up in our field of view suggests nothing of its size or distance. It could be
up-close and tiny, or distant and massive.

Before we dive into (Virtual) Reality, how do we tell scale in traditional 2D
forms of entertainment? If we lose the stereo vision, what clues can a game
designer or cinematographer use to give scale to objects?

### Scale in 2D

The simplest way to know the scale of an object, is to already be familiar with
its size in everyday life. If you see a chair or a car in a game or a
movie, you can safely assume what their size is -- you don't even think about it.

What about foreign objects? How big is a space ship, an alien, or an aircraft
carrier if you've never seen one before. This one is also fairly obvious -- put
familiar objects next to it! Seeing people walking around an aircraft carrier
instantly suggests its huge size.

One of the biggest hints however, is parallax.

> Parallax is the relative movement of objects as a result of a change in
> point of view

Seeing how objects move relative to each other at different depth, hints at
their size and distance. Without stereo vision, _parallax_ can be achieved
through _movement_- be it panning the camera in a movie, or running around in a
First Person Shooter game. No matter how much you run, a mountain doesn't
seem to budge from its spot, suggesting great distance and size.

{% assign canvas-id = "scene-parallax" %}
{% assign caption = "In the orthographic view from the top, the camera pans left-to-right (whose field of view is signified by the solid lines). The dotted lines show the area occupied in the field of vision by each sphere. The panning of the camera causes the spheres to come together, or move apart in the perspective view, due to parallax. Parallax thus suggests distance." %}
{% include canvas.html %}

To recap we have, at a minimum, the following tools to help convey scale in a
two-dimensional medium:

* __Familiar objects__
* __Relative size__
* __Parallax__

However, as [this paper about visual scale][1] by _Andrew C. Beall et al_ points
out, a lot of these cues rely on assumptions from the observer:

> Aside from accommodation and convergence, all of the other cues to absolute
> scale are subject to assumptions on the part of the observer (absolute motion
> parallax: stationarity of objects; height in the field: the eye is at normal
> eye height; familiar size: the object is its normal size; relative size: each
> element is of the same distal size)

In other words, if for some _creative_ reason you want a chair that is the size
of a house, you will be fighting against the viewer's assumptions of
familiarity. If you are trying to convey the size of a large spaceship, while
zooming by at hundreds of miles an hour, the brain's interpretation of parallax
will be relative to every-day speeds -- that of walking or running -- resulting
in underrepresentation of scale.

* __Familiar objects__ - assumes normal size
* __Relative size__ - assumes at same distance
* __Parallax__ - assumes objects are stationary

{% assign youtube = "eLU-rEKopTg" %}
{% assign caption = "In this video a man exploits our assumptions about scale to set up a room full of optical illusions" %}
{% include youtube.html %}

Clearly, we need to involve as many cues as possible to give a complete idea of
scale. We need _stereoscopic_ vision to go the full distance.

### Scale in Real Life

Just as we saw in the 2D case, parallax plays a large role in stereoscopic
vision -- only this time, you can take in two separate view-points at the same
time, thanks to the distance between your eyes! When you focus on a particular
object, both pupils line up with the focusing point.  This is called
_vergence_. 

{% assign canvas-id = "scene-convergence" %}
{% assign caption = "From left to right: A view from the top, of two eyes focusing on a resizing sphere. The two stereoscopic views of the left and right eyes respectively. The eyes must rotate inwards to maintain focus as an object gets closer." %}
{% include canvas.html %}

In effect, the amount your eyes rotate informs the brain how far away the
object is.  As soon as you know the distance to the object and how much area it
takes up in your field of view, you can immediately tell its size!

But wait a minute! What about the viewer's assumptions? Just as we saw with
previous scale cues, there must be something assumed here. 

* __Vergence__ - assumes a fixed distance between the eyes

For vergence to be interpreted by the brain properly (giving proper sense of
scale), the distance between your eyes must remain constant. Thankfully, that
is one fact you can trust in real life.  It is the one thing that is intrinsic
to you, and not at the whim of someone else.

What about Virtual Reality?

### Interpupilary Distance

There is a formal name for the distance between your eyes:

> Interpupilary distance, or `IPD` for short, is the distance between the pupils 
> of your eyes.

As we saw in the previous section, this distance is very important in
stereoscopic vision. When dealing with Virtual Reality and the Oculus Rift,
there are actually two sets of `IPD`s to worry about:

* Real `IPD` - This is the actual distance between the centers of your pupils in
  the real world. The main purpose of this for VR, is to determine where to
  position the virtual camera outputs on the screen in front of you, so that it
  lines up with your eyes. This number is _crucial_ to get right in order to
  avoid eye strain.
* Virtual `IPD` - This is the distance between the cameras (or virtual eyes) in
  the _virtual_ world. We shall see that this distance completely determines
  the sense of scale of objects in relation to you.

> Real `IPD` is used to line up the projection of virtual cameras with your eyes
> **on a screen**.  This ensures correct perspective and vergence.

Accounting for Real `IPD` and what it means would probably take another article,
so we won't focus on it here. Let's assume everything in the real world,
between you and the screen, has been calibrated correctly. We are left with
Virtual `IPD`.

### Virtual IPD

This parameter is now back in the hands of the artist. In order to make a
compelling and immersive experience, there is nothing more important to get
right in the virtual world than the `IPD`. Viewers will immediately pick up on 
this cue. 

Another way to look at it, is that designers of virtual worlds can now alter
your sense of scale, just by exploiting your brain's assumption about `IPD`. 

{% assign canvas-id = "scene-scaling" %}
{% assign caption = "In the top view, we are now viewing the previous scene relative to the sphere. Our frame of reference is now fixed on the sphere.  What appears to be happening though is the IPD fluctuates wildly. And that's the point -- from the player's point of view the two are equivalent" %}
{% include canvas.html %}

By merely manipulating the `IPD`, we can make the whole world shrink or grow,
without actually scaling the world directly!

### Experimenting in Tuscany

The day after I got the Rift I decided to experiment with scale, so I
hacked the code from the "Tuscany Demo" to shrink/grow the size of the
player. Just to confirm my intuitions about scale, I tried hacking just the virtual
`IPD` (independent of real `IPD` which *must* be accurate).

Thrilled with the results, I also scaled all the other usual parameters that
influence a player's sense of scale:

* Player height
* Neck model parameters
* Player speed

You can now feel as small as a mouse running around and under furniture, or a giant
looking down at a "dollhouse".

{% assign image-url = "https://dl.dropboxusercontent.com/u/4337781/Blog/VrScale/TinyTuscany.jpg" %}
{% assign caption = "Player scale can be increased/decreased in the demo by pressing F8/F7 respectively. Here the player is scaled to 4.74 times the normal size, where the objects in the scene appear miniaturized." %}
{% include image.html %}

{% assign image-url = "https://dl.dropboxusercontent.com/u/4337781/Blog/VrScale/GiantTuscany.jpg" %}
{% assign caption = "Converesly a player can shrink so that chairs are towering over them" %}
{% include image.html %}

You can play around a [modified Tuscany
Demo](https://dl.dropboxusercontent.com/u/4337781/Blog/VrScale/ScalingTuscany.zip)
for the Oculus Rift that has player scaling built in. (On Windows)

### Warning and Conclusion

As fun as it is to view a scene at different scales, _moving between scales
dynamically causes significant eye strain_. The phenomenon is equivalent to the
third diagram -- the object stays the same size in the field of view but
grows/moves away or shrinks/gets closer at same time. It proves difficult to
focus on objects as they go through this transformation, as the eyes struggle
to maintain vergence -- constantly readjusting. 

I have several ideas on how to mitigate the eye strain, but this is new
territory -- objects don't just grow and shrink in front of your eyes in the
real world. The brain is simply not used to this phenomenon. It's up to us to
explore this new frontier!

### Other Articles

There are also lots of great talks and blogs that explore and explain the
challenges of VR in great depth, created by some forerunners in the industry.
I'll list a few of them here:

* Valve's Michael Abrash talks about latency, judder and other [problems VR faces with current graphics/display technology](http://blogs.valvesoftware.com/abrash/)
* Tom Forsyth from the Oculus team talks about [challenges with VR sickness](http://www.oculusvr.com/blog/vr-sickness-the-rift-and-how-game-developers-can-help/)
* Robotic Scientist Steve LaValle explores [motion prediction for head tracking](http://www.oculusvr.com/blog/the-latent-power-of-prediction/)

### Bonus!

While experimenting with creating content for the Rift I have also done some photography for VR:

{% assign image-url = "https://dl.dropboxusercontent.com/u/4337781/Blog/VrScale/OculusPhotograph.jpg" %}
{% assign caption = "Photo of a landscape from a cliff, taken by two Canon 6D cameras 4 meters apart at the same time. This makes the the world look tiny in comparison to the viewer. This aesthetic would work well with the rapid passing of time in timelapse videos. " %}
{% include image.html %}

[1]: www.recveb.ucsb.edu/pdfs/BeallLoomisPhilbeckFikes-95.pdf

