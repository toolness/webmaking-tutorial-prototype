This is an attempt to prototype an interactive tutorial and challenge platform for the Mozilla Webmaker initiatives like [lovebomb.me][] and [storything][]. It's based off some of the design thinking Jess Klein has done on [instructional overlays][].

## Architecture

The tutorial uses [Popcorn][] to construct a "movie" that automates the user interface of a two-paned HTML editor with an instructional overlay. At the end of the movie, a coding challenge is presented to the user, which they must complete in order to finish the tutorial.

See [tutorial-script.js][] for a high-level picture of how this is scripted.

  [lovebomb.me]: http://lovebomb.me
  [storything]: http://on.toolness.org
  [instructional overlays]: http://jessicaklein.blogspot.com/2012/02/instructional-overlay-for-webmaking-101.html
  [Popcorn]: http://popcornjs.org/
  [tutorial-script.js]: https://github.com/toolness/webmaking-tutorial-prototype/blob/gh-pages/tutorial-script.js
  