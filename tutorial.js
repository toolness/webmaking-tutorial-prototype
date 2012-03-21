// This is a layer on top of Popcorn that makes it easy to create
// tutorial-style interactive experiences that "script" a Webmaking
// application's behavior.

var Tutorial = (function() {
  var Tutorial = function(settings) {
    return new Tutorial.prototype.init(settings);
  };

  // Add a plugin to the tutorial; this is reminiscent of Popcorn's
  // plugin functionality. Each plugin adds a new kind of scriptable
  // action or interactive capability to the tutorial movie, such as 
  // highlighting part of the screen, typing text in the editor,
  // or prompting the user for input.
  Tutorial.plugin = function(name, plugin) {
    this.prototype[name] = function() {
      var command = {
        start: this.pop.media.duration,
        plugin: name,
        index: this._commands.length
      };
      jQuery.extend(command, plugin);
      plugin.initialize.apply(command, arguments);
      this.pop.media.duration += command.duration;
      this._commands.push(command);
      return this;
    };
  };

  Tutorial.prototype = {
    init: function(settings) {
      // Internal list of commands/events for the tutorial movie.
      this._commands = [];
      // The Popcorn instance representing the tutorial movie.
      this.pop = Popcorn.tutorial($(settings.controls)[0]);
      // The CodeMirror editor instance that will be manipulated over
      // the course of the movie.
      this.editor = TwoPanedEditor({
        editor: $(settings.editor),
        preview: $(settings.preview)
      });
      this.instructions = $(settings.instructions);
    },
    // This should be called after the tutorial has been fully scripted 
    // through the calling of plugin methods. It readies the tutorial movie
    // for playback.
    end: function() {
      var self = this;
      this._commands.forEach(function(command) {
        command.annotate(self.pop, self._commands, self.editor,
                         self.instructions);
      });
      this.pop.media.readyState = 4;
      return this;
    }
  };
  
  Tutorial.prototype.init.prototype = Tutorial.prototype;
  
  return Tutorial;
})();

// A "code challenge" plugin that waits until the user has typed
// valid code into the editor, then displays a congratulatory message.
Tutorial.plugin("codechallenge", {
  initialize: function(options) {
    this.test = options.test;
    this.win = options.win;
    this.duration = 1.0;
  },
  annotate: function(pop, commands, editor) {
    var test = this.test;
    var winSelector = this.win;
    var interval;

    function checkForWin() {
      if (test(editor))
        $(winSelector).fadeIn();
      else
        $(winSelector).fadeOut();
    }

    pop.undoable({
      start: this.start,
      execute: function() {
        editor.setOption("readOnly", false);
        this.lastCursorPos = editor.getCursor();
        this.lastValue = editor.getValue();
        if (this.lastEditedValue) {
          editor.nextCursorActivityIsAutomated = true;
          editor.setValue(this.lastEditedValue);
          editor.nextCursorActivityIsAutomated = true;
          editor.setCursor(this.lastEditedCursorPos);
        }
        clearInterval(interval);
        interval = setInterval(checkForWin, 500);
        checkForWin();
      },
      undo: function() {
        editor.setOption("readOnly", true);
        this.lastEditedCursorPos = editor.getCursor();
        this.lastEditedValue = editor.getValue();
        editor.nextCursorActivityIsAutomated = true;
        editor.setValue(this.lastValue);
        editor.nextCursorActivityIsAutomated = true;
        editor.setCursor(this.lastCursorPos);
        clearInterval(interval);
        $(winSelector).hide();
      }
    });
  }
});

// Moves the cursor of the editor to a given position relative to a
// search string.

Tutorial.plugin("moveto", {
  initialize: function(options) {
    this.position = options.position;
    this.search = options.search || "";
    this.duration = 0.1;
  },
  annotate: function(pop, commands, editor) {
    var position = this.position;
    var search = this.search;
    pop.undoable({
      start: this.start,
      execute: function() {
        if (search.length) {
          this._oldCursor = editor.getCursor();
          var cursor = editor.getSearchCursor(search);
          cursor.findNext();
          if (position == "beginning") {
            editor.nextCursorActivityIsAutomated = true;
            editor.setCursor(cursor.from());
          } else if (position == "end") {
            editor.nextCursorActivityIsAutomated = true;
            editor.setCursor(cursor.to());
          }
          return;
        }
        if (position == "beginning") {
          editor.nextCursorActivityIsAutomated = true;
          editor.setCursor(0, 0);
        } else if (position == "end") {
          editor.nextCursorActivityIsAutomated = true;
          editor.setCursor(9999999999, 999999999999);
        }
      },
      undo: function() {
        editor.nextCursorActivityIsAutomated = true;
        editor.setCursor(this._oldCursor);
      }
    });
  }
});

// A plugin to type characters into an editor.

Tutorial.plugin("typechars", {
  DURATION_PER_CHAR: 0.4,
  initialize: function(characters) {
    this.characters = characters;
    this.duration = characters.length * this.DURATION_PER_CHAR;
  },
  annotate: function(pop, commands, editor) {
    var self = this;
    var characters = this.characters;
    var array = [];
    var currentTime = this.start;
    for (var i = 0; i < characters.length; i++)
      array.push(characters.charAt(i));
    array.forEach(function(character) {
      pop.undoable({
        start: currentTime,
        execute: function() {
          this._oldCursor = editor.getCursor();
          editor.focus();
          editor.nextCursorActivityIsAutomated = true;
          editor.replaceRange(character, editor.getCursor());
        },
        undo: function() {
          editor.nextCursorActivityIsAutomated = true;
          editor.replaceRange("", this._oldCursor, editor.getCursor());
        }
      });
      currentTime += self.DURATION_PER_CHAR;
    });
  }
});

// A plugin to display instructional text to the user in an informational
// overlay area.

Tutorial.plugin("instruct", {
  TRANSITION_TIME: 0.6,
  initialize: function(html, duration) {
    if (typeof(duration) == "undefined")
      duration = 4;
    if (duration == 0)
      duration = 0.05;
    this.duration = duration;
    this.html = html;
  },
  annotate: function(pop, commands, editor, instructions) {
    var html = this.html;
    var end = pop.media.duration + 1;
    for (var i = this.index+1; i < commands.length; i++)
      if (commands[i].plugin == "instruct") {
        end = commands[i].start - this.TRANSITION_TIME;
        break;
      }
    pop.simplecode({
      start: this.start,
      end: end,
      onStart: function() {
        $(instructions).html(html).addClass('visible');
      },
      onEnd: function() {
        $(instructions).removeClass('visible');
      }
    });
  }
});

// A plugin to highlight part of the page, drawing the user's attention
// to it.

Tutorial.plugin("spotlight", {
  TRANSITION_TIME: 0.25,
  initialize: function(selector) {
    this.selector = selector;
    this.duration = 3;
  },
  annotate: function(pop) {
    var self = this;
    var start = this.start;
    pop.simplecode({
      start: start,
      end: start + this.duration - this.TRANSITION_TIME,
      onStart: function() {
        var target = $(self.selector);
        var bounds = target[0].getBoundingClientRect();
        var spotlight = $('<div class="spotlight"></div>');
        spotlight.css({
          top: bounds.top + 'px',
          left: bounds.left + 'px',
          width: bounds.width + 'px',
          height: bounds.height + 'px'
        });
        $(document.documentElement).append(spotlight);
        setTimeout(function() { spotlight.addClass("visible"); }, 0);
        this._spotlight = spotlight;
      },
      onEnd: function() {
        var spotlight = $(this._spotlight);
        delete this._spotlight;
        spotlight.removeClass("visible");
        setTimeout(function() {
          spotlight.remove();
        }, self.TRANSITION_TIME * 1000);
      }
    });
  }
});
