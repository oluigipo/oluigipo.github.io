@@version 1
@@title Writing a simple blog website
@@date 2022-12-22

# Writing a simple blog website
But why? I never liked UI programming, not even talking about webdev, though since I'm done with school and might need to find a job if I'm unable to begin uni, it's good to add more stuff to my portfolio.

Most stuff I do nowadays is to experiment and learn. I haven't done a "real project" for quite some time now. So this will be my place to write down stuff I've been doing -- problems, design decisions, trying to explain concepts, etc.

# My "webstack"
I want to keep it as simple as possible. The need to preprocess HTML -- add a "compilation" stage -- was clear from the very beginning though. I still want to have nice syntax highlighting, write this blog entry in markdown, etc. Just plain HTML5 and CSS would just be too painful.
So, with that, I defined some requirements for my "build system":
* A simple script that will just pick all the needed files and write the finished website in a `build` directory;
* Of course we'll have images. A `included` folder to simply put every raw content that will be simply copied to our `build` directory is enough for that;
* To insert the more "dynamic" stuff into my pages, I'll need a sort of `<PP command arg0="value" arg1="value"/>` custom tag to insert stuff like codeblocks for automatic highlighting;
* A markdown to HTML tags converter.

At the end of the day, all of this was accomplished with a simple 300 line Typescript file. I choose Typescript because I like to have my types strictly defined and also because Deno can run it as-is.
This is not including the `hl.js` thingy I wrote some time ago to highlight C code. Converting it to typescript didn't take even 5 minutes.

So, if you want a "list" of my webstack, it is:
* Deno (compilation);
* nothing else, we just generate plain HTML+CSS files.

# Metadata
I of course want to add some metadata to my blog entries. Since I'm writing my own markdown parser, it was pretty easy. My solution is to just have a bunch of `@@name value` in the beginning of my `.md` files. It goes like this:
```md
@@version 1
@@title Hello, World!
@@date 2022-12-22

# This is a <h1> tag
this is a paragraph.

more stuff.
```

Note the `@@version 1` line: if I go forward with this, I surely will end up making breaking changes to this custom markdown file, so having a simple directive to say which version of the parser to use might save a bit of time in the future.

That's about it. Now I'll implement some other markdown features I have used in this entry.

UPDATE: Implementing codeblocks, inline codeblock, and lists took extra 63 lines of code. A total of 363 lines for `build.ts`! Amazingly few for such a useful tool.
