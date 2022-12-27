@@version 1
@@title Plans for my "please" "game engine"
@@date 2022-12-26

# Basic overview
I began "please" mid-2021 to learn about gamepad inputs from scratch in Windows. It was a great experiment, and got to learn a lot of DirectInput and XInput to support all
kinds of gamepads out there with the help of [SDL_GameControllerDB](https://github.com/gabomdq/SDL_GameControllerDB). And to help visualize if the input conversion was done right,
I had also programmed a simple OpenGL renderer for colored rectangles, and that was about it.

But then, I also ended up doing a bit of sound, some 3D graphics programming (lighting, shadows, normal mapping, all that stuff). At the end, it really seemed like something
I could build any game I wanted with it. Sure I've only made 2D games in the past (TODO: blog entry), but the idea still seemed great. Having my own set of tools for doing my own
series of work and controlling every step of the pipeline...!

# Nowadays
I dreamed too high, I confess. Fortunately this is such a common situation for engine developers enthusiasts that I don't feel bad about it, just a bit silly. But then, if I want to
work on this, what should I aim for?

Before the coaching section comes in, I want to talk a bit about how I ended up *removing* more stuff than adding into "please" during this 1.5 year period.

# Simplicity
Fortunately I seeked a lot of it. Probably must have saved me from a weird timeline where I wrote my own 3D file format, ECS implementation, and all kinds of unecessary features. At the end,
I only have a few systems in it worth talking about:
* The `Engine_` namespace, common code for all platforms: rendering, audio mixing... and that's it?
* The `Platform_` namespace, platform-specific code: windowing, input translating, gamepad translating (probably should go to the `Engine_` namespace?), input/output, virtual memory, etc.;
* The `Game_Main`: this is a function called by the `Engine_` layer in a loop. You don't even need to return from it and just have your game loop in there;
* The `Pls*_` namespaces, common systems for games: the idea was to implement these on-demand, which is a really great idea and I will explain in a moment why.

Surely, this is more than enough to start making games, but I'm still not happy with some stuff, mainly with the audio API and rendering API.

The audio API consists of just three functions in the engine namespace: `Engine_LoadSoundBuffer(path, *out_sound)`, `Engine_FreeSoundBuffer(sound)`, and mainly `Engine_PlayAudios(*audios, *inout_count, volume)`.
The biggest problem with it really is that I extract *all* audio data on load (unecessary memory consumption) and do mixing in the same thread as the game thread. Do you remember when games developed
on Valve's Source Engine started loading while a sound was playing and the sound kept looping until it was done loading? "please" have the same problem. It happens due to the fact that my audio-specific thread
only does a single thing: send bytes from a global buffer to WASAPI (Windows audio API I chose) when woken up by it's event. The mixing is done at the end of the frame in the main thread and then the global
buffer is "swapped" and it's offset is set to 0. That's essentially double-buffering. What I want to do instead is to decode and mix the audios on-demand in the audio thread. This is surely an exercise for
another day (procrastination kicks in).

The rendering API went downhill (as in 'featurelessness') since I've been redesigning it from scratch recently. Essentially just simplifying it, though it started looking like [sokol_gfx](https://github.com/floooh/sokol#sokol_gfxh)
at the lower level, but still doing some high-level work, like text rendering. Maybe I should just use sokol and just not care! I've used it a bit recently and got pretty far by just reading it's API and reading
the OpenGL implementation to understand what each option really did. It's a really great abstraction, for sure.

# Okay, but what is the point now?
Now comes what I'll try to aim for with this project from now on: learning. It just sounds like an excuse really, but that's not all. I plan to begin developing really small games with it and develop the engine
itself as I go with it. That's probably the best advice one can give: make a game, not an engine. I'm surely not doing it now, so there's still more I need to work on myself about that, but that's it in general.

I've read [this article](https://medium.com/geekculture/how-to-make-your-own-game-engine-and-why-ddf0acbc5f3) from Tyler Glaiel some years ago and it got to me again recently. Reading it again felt
like a whole new thing I missed, that I could be far from where I'm now, but it doesn't bother me all that much. Now i'll try to do it better. It's a really great article btw! You should definitely read it!

That's all I had to say for now. Happy Christmas and Happy New Year!
