---
layout: post
title: "VR Jam Post Mortem"
description: >
  Many months ago I took part in the Oculus VR-Jam, a 3-week competition to
  create a game prototype exclusively for the Oculus Rift. Our rag-tag team had
  practically no experience making games, so our chances of winning against the
  other 250 teams were non-existent. Regardless, we learnt a lot from the
  process, and I will now share my thoughts on our successes and failures.

category: technical
published: true
testing: true
tags:
  - virtual-reality
  - oculus-rift
---

Disclaimer: This is a very dense "brain-dump" sort of article, so it is mostly
in the form of bullet points to keep it brief.

---------------------------------------

### The Game - "Scalar"

The game revolves around the player being able to scale him/herself up or down
in order to solve puzzles, and progress.  I wanted to focus on scale, as it is
one of the unique sensations in VR (refer to my article "[A Sense of Scale in
VR](/technical/2013/10/06/sense-of-scale-vr.html)" for an explanation).

The central game mechanic involves an artifact that allows the player to scale
up or down at specific locations in a level. It also serves as something stable
for the player to look at during the process of growing/shrinking so as to
avoid eye strain.

### The VR-Jam Competition

* 3 Weeks
   * Week 1 - deliver a screenshot
   * Week 2 - deliver a video
   * Week 3 - deliver the game
* Panel of judges pick the winners

### The Team

* 4 members
   * People came and went
   * Most (including me) had a full-time job and other priorities, so we could
     only dedicate one to two hours per day.
   * Noone had any experience making games
   * Noone was a skilled artist

I was the only one with an Oculus Rift at the time, so it was quite a challenge
to relay the restrictions and change of priorities in the design space.

---------------------------------------

### Week 1

Week 1 was mostly spent on coming up with an idea for a game, brainstorming
gameplay elements, and picking tools that we would use. This should have
ideally been done before the competition, but the team formed at the
last minute, in effect costing us a week of actual development time.

* Discussed ideas
   * Had to be a Puzzle/Adventure game for the slower pace that would be less
     strenuous in VR.
   * Manipulation of the small environment from the normal world, that would open up
     new paths in the small world.
   * Items picked that are picked up by the player, also scale with him. This
     allows items obtained from the small world to affect the normal world, and
     vice versa.
* Had to pick scales for player to inhabit.
   * This would affect asset design, puzzle layouts, so it had to be decided ASAP.
   * Ratio had to be significant enough to have a visual impact, but not too
     large a difference where the details of the "small world" are invisible
     from the "normal scale".
   * Using some back-of-the envelope calculations, and a few tests in Unity we
     settled on 1.0x and 0.1x for the scales in our game.
* Picked Unity for the game engine
   * Free 30 day Pro trial
   * Oculus integration in Unreal Engine 3 was unfinished, and editor interface
     wasn't as easy to get started with. (I think UE4 would do a much better
     job on that front now)
* Private git repository on BitBucket for version control
   * Free for up to 5 members to access the repo.
   * Required Pro version of Unity to be able to check in the project files into version control.
   * Unfortunately diffing projects was still a huge pain in the ass, because
     Unity would rearange the order of the nodes in the project file on every
     save, even if nothing really changed.

{% assign image-url="https://dl.dropboxusercontent.com/u/4337781/Blog/VrJamPostMortem/Week1.jpg" %}
{% assign caption='With nothing concrete actually developed, we ended up fudging a "fake" screenshot of the player standing over some "small world" tunnels.' %}
{% include image.html %}

---------------------------------------

### Week 2

Week 2 was spent honing our asset workflow, and implementing basic elements of
gameplay.

* Had to rapidly prototype levels, and not rely on an artist to produce tons of
  assets.
   * Thought of a tile based approach
   * Tiles had to work for both the full-size player, and the player shrunk 10
     times
   * `Edit -> Snap Settings` in Unity helped set appropriate grid resolution.

{% assign image-url="https://dl.dropboxusercontent.com/u/4337781/Blog/VrJamPostMortem/GutterTiles.jpg" %}
{% assign caption='The very first tiles we made allowed for small gutters to act as tunnels for the small player. We never ended up refining these particular tiles.' %}
{% include image.html %}

* Chose Blender for modelling - free.
   * Controls are a lot more awkward than other modelling programs, but you get
     used to it after an hour or so. (You also promptly forget it afterwards).
   * The fastest way to get started is the [Blender 2 Minute Tutorials](https://www.youtube.com/watch?v=wcNukwr3b5w&list=TLN5p_I6OC5yp6oU1IAmp-3M3tN8Pp7j2I)
     series. It gets straight to the point, and doesn't waste your time.

{% assign image-url="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Ta_Prohm_5.jpg/800px-Ta_Prohm_5.jpg" %}
{% assign caption='We settled on an "ancient temple ruins" theme, inspired by architecture in [Cambodia](https://en.wikipedia.org/wiki/Ta_Prohm) and [India](https://en.wikipedia.org/wiki/Brihadishwara_Temple)' %}
{% include image.html %}

* [CGTextures](https://www.cgtextures.com/textures.php?t=browse&q=71718) was a
  source of great royalty free images that we used to create textures. It even
  has images from Cambodia!
* Established a workflow for assets:
   * In Blender, create an extremely rough cuboid shape for a tile, that can be
     used as a stand-in immediately, and as a collision mesh later.
   * Create prefab in Unity to start prototyping levels with.
   * Refine model, create UV maps, and texture. This can be done in parallel by
     an artist, by sculpting within the collision mesh.
   * Update prefab in Unity - now all instances are updated!
* Created a simple programmable animation system for objects.
   * Used for animating objects programmatically over a number of frames
   * E.g. Open a big stone slab after a key is inserted
   * Used Unity's coroutines to accomplish this. See C# `yield` keyword.

{% assign youtube = "z9IpLLNKoWs" %}
{% assign caption = "For the second milestone we produced a simple video showcasing scaling, and how items in the inventory scale with the player." %}
{% include youtube.html %}

---------------------------------------

### Week 3

Week 3 saw things ramp up quite a bit, with more assets and puzzle ideas coming
together.

* Unity does not have hierarchical prefabs
   * Had lots of small tile prefabs that I assembled into larger constructions-
     such as a temple wall or corner.
   * Discovered that Unity could not create a larger prefab, and retain the
     prefab status of the smaller parts. Updating a tile prefab would not
     affect that piece in the larger temple wall prefab.
   * Had to resort to constructing a "prototypical wall" in the level, and copy
     pasting it around. The smaller pieces retained their prefab status, so
     bulk updates could still be done.

{% assign image-url = "https://dl.dropboxusercontent.com/u/4337781/Blog/VrJamPostMortem/TemplePrefabs.jpg" %}
{% assign caption = "A temple wall, and temple staircase groups next to each other. Each were hierarchically assembled from simpler prefabs. The modularity allowed us to construct larger designs out of "lego bricks" with very few actual assets designed." %}
{% include image.html %}

* Tiles were easily updateable and composable, but since they were so small,
  there were A LOT of them on-screen at any time, even for the simple level we
  had. As a result, when the whole level was put together near the end,
  performance left much to be desired.
   * This suggests that tiles are great for initial prototyping, but as levels
     and "design-patterns" arise, they should be baked into larger prefabs,
     with a lot of redundant internal geometry removed.
   * A tool or plugin that could allow easily switching between baked and tiled
     versions of prefabs would be ideal.
* As said before, merging Unity project files was simply out of the question.
   * To be able to develop pieces of the level concurrently we would:
      * Duplicate the current scene
      * Create a room in an unoccupied area
      * Commit this new scene as a separate file
      * Another person finally merges all the rooms into the final level by
        copy-pasting the pieces from other's scenes.
* Severe crunch-time during the last weekend, to pick up the slack that arose during the week.
   * Sunday was a 14 hour long marathon of coding, modelling, texturing, and
     level design to get everything finished.
   * Got severely burnt out and didn't want to look at the game any more for
     many months :P

TODO: playthrough video
TODO: game download

---------------------------------------

### General Advice

* Set the smallest goal, and do the simplest thing to make a step forward. _It
  doesn't mean it has to be done sloppily - just don't be overly ambitious_.
   * For an example, I'll talk about the second room that involved a block
     puzzle. I asked a team-mate to lay the puzzle out according to the simple
     design we decided upon earlier. He convinced me he could make it more
     interesting, using a more complicated layout. Over time we kept discovering
     ways the player could break the puzzle, get into a dead-end state, or get
     trapped between the blocks. In the end, we scrapped it and went back to
     the initial simple design. As a result, we lost almost an hour during the
     last day. Don't be overly ambitious with your prototype!
* Know when to limit scope, and drop features. If implementing something is
  taking too long and is not critical to getting your idea across, just drop
  it.
   * This is closely related to the previous point.
   * Initially the artifact was going to be carried by the player, and inserted
     into receptacles to start the scaling process. Unfortunately this implied
     a lot of other things, like:
      * Modelling player hands and animating them
      * Figuring out the interface - does the player toggle the artifact with a
        button?  Ideally the player would use something like the Razer Hydra
        and have a one-to-one mapping to the hands in the game and carry the
        artifact all the time.
      * The artifact and arms need to handle collisions with the receptacles.
   * We ended up just placing the artifact in every receptacle, and activating
     them with a mouse click. Cheap, but the important scaling effect is there.
* Managing a team has to be a delicate balance between democracy and dictatorship.
   * Allow too much freedom, and everyone stagnates in indecision or starts
     wandering on unproductive tangents. Set goals and "put your foot down" as
     necessary to make progress. If a teammate has a competing idea to someone
     else's, let them prove it with a prototype.
   * On the other hand, too much micromanagement or little flexibility in the
     plan could decrease team morale and limit their creative input. This can
     be especially difficult when a team is making a prototype of an idea you
     came up with, and are not necessarily as enthusiastic about. Show them
     your enthusiasm, and soon they will start pushing your idea in directions
     you didn't even think of, often leading to cool "eureka" moments.

---------------------------------------

### Oculus/VR advice

Most of the advice is about respecting the VR medium.

* Make sure everyone is on the same page about the design space for VR content.
   * A lot of first suggestions for VR games are very surreal/extreme
     experiences. New players may not be prepared for it, it may be very
     discomforting or even unhealthy.
* When exploiting new VR phenomena, give the player some anchor so they are not
  discomforted/hurt.
   * Dynamically changing the scale of surroundings **really** hurts in VR,
     unless there is something to focus on that stays static relative to you.
* Many existing graphics techniques don't work in VR. Adjust your asset creation
  accordingly.
   * Sprites - flat images oriented towards the viewpoint. (usually used for
     leaves or particle effects)
   * Bump mapping, normal mapping all exploit the single viewpoint. The effect
     is ruined in 3D.
* Keep assets simple for fast/consistent framerates.
