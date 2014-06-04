---
title: 'VR-Jam Postmortem'
---

# VR-Jam Postmortem

## The Game - "Scalar"

* Scale using an artifact!
* Solve Puzzles!

## The VR-Jam Competition

* 3 Weeks
   * Week 1 - deliver a screenshot
   * Week 2 - deliver a video
   * Week 3 - deliver the game
* Panel of judges pick the winners

## The Team

* 4 members
   * People came and went
   * Full-time jobs - little time
   * No experience making games
   * No skilled artists

# Week 1

## Week 1

* Brainstorming
* Picking tools
* Cost us a week of dev time

## Ideas

* Puzzle/Adventure game for the slower pace
* Manipulation of the small environment
* Inventory items scale with the player

## Scale

* Had to pick scales for player to inhabit
* Affects asset design, puzzle layouts
* Ratio had to be just right
* Settled on `1.0x` and `0.1x`

## Unity

* Picked Unity for the game engine
* Free 30 day Pro trial
* UE3 integration felt unfinished

## Bitbucket

* Private git repository on BitBucket
* Free for 5 members
* Pro version of Unity required for version control
* Diffing Unity projects still a huge PITA

## {data-background="https://dl.dropboxusercontent.com/u/4337781/Blog/VrJamPostMortem/Week1.jpg"}

# Week 2

## Week 2

* Asset Workflow
* Basic Gameplay

## Tiles for rapid prototyping

* Only need few composable assets
* Had to work for normal and small player
* `Edit -> Snap Settings` in Unity for grid resolution

## {data-background="https://dl.dropboxusercontent.com/u/4337781/Blog/VrJamPostMortem/GutterTiles.jpg"}

## Blender

* Free
* Awkward at first
* [Blender 2 Minute Tutorials](https://www.youtube.com/watch?v=wcNukwr3b5w&list=TLN5p_I6OC5yp6oU1IAmp-3M3tN8Pp7j2I) to get started

## {data-background="http://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Ta_Prohm_5.jpg/800px-Ta_Prohm_5.jpg"}

## {data-background="http://upload.wikimedia.org/wikipedia/commons/5/5d/Brihadeeswarar_Temple_02.jpg"}

## [CGTextures](http://www.cgtextures.com/textures.php?t=browse&q=71718)

* Royalty free images
* Great for textures
* Has images from Cambodia!

## Asset Workflow

* Rough cuboid shape for collision mesh
* Create prefab in Unity for prototyping
* Refine model, create UV maps, and texture
* Update prefab in Unity

## Programmable Animation

* Animating programmatically over a number of frames
* Unity coroutines. See C# `yield` keyword
* E.g. Open a big stone slab after a key is inserted

## First Puzzle

<iframe width="640" height="360" src="http://www.youtube.com/embed/z9IpLLNKoWs" frameborder="0"></iframe>

# Week 3

## Week 3

* More assets
* Puzzles
* Final level layout

## Problem: Hierarchical prefabs

* Unity does not have hierarchical prefabs
* Prefab status lost of the smaller pieces of large prefab
* Resorted to constructing a "prototypical wall" and copy pasting it

## {data-background="https://dl.dropboxusercontent.com/u/4337781/Blog/VrJamPostMortem/TemplePrefabs.jpg"}

## Problem: Performance

* Tiles updateable and composable, but small
* A LOT of them on-screen
* Performance left much to be desired.

## Problem: Performance

* Tiles great for prototyping
* Should eventually be "baked"
* A tool or plugin would be ideal

## Problem: Merging Unity Scenes

* Duplicate the current scene
* Create new room in an unoccupied area
* Commit this new scene as a separate file
* Another person finally merges all the rooms into final level

## Crunch time

* Severe crunch-time during the last weekend
* Sunday was a 14 hour long marathon
* Didn't want to look at it any more! :P

# General Advice

## Set the smallest next goal

Do the simplest thing to make a step forward. _It doesn't mean it has to be
done sloppily - just don't be overly ambitious_.

## Know when to limit scope

If implementing something is taking too long and is not critical to getting
your idea across, just drop it.

## Delicate Balance

Managing a team has to be a delicate balance between democracy and dictatorship.

# Oculus/VR advice

## Educate

Make sure everyone on your team is on the same page about the design space for
VR content.

## Anchor

When exploiting new VR phenomena, give the player some anchor so they are not
discomforted/hurt.

## Adapt

Many existing graphics techniques don't work in VR. Adjust your asset creation
accordingly.

## Simplify

Keep assets simple for fast/consistent framerates.
