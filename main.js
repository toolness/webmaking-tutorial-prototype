Popcorn.plugin("simplecode", function(options, f) {
  return {
    start: function(event, options) {
      if (options.onStart)
        options.onStart();
    },
    end: function(event, options) {
      if (options.onEnd)
        options.onEnd();
    }
  };
});

function makePlayer(div, pop) {
  var media = pop.media;
  var scrubber = div.find(".scrubber");

  function updatePlayerUI() {
    var percentComplete = (media.currentTime / media.duration) * 100;
    var timestamp = media.currentTime.toFixed(1).toString() + 's';
    div.find(".progress").css({
      width: percentComplete + "%"
    });
    div.find(".timestamp").text(timestamp);  
  }

  scrubber.mousedown(function(event) {
    function scrub(event) {
      var baseX = scrubber.offset().left;
      var width = scrubber.width();
      var percentage = (event.pageX - baseX) / width;
      pop.media.currentTime = pop.media.duration * percentage;
      pop.media.dispatchEvent("timeupdate");
    }

    scrubber.bind("mousemove", function(event) {
      scrub(event);
    });
    $(document).one("mouseup", function() {
      scrubber.unbind("mousemove");
      pop.play();
    });

    pop.pause();
    scrub(event);
    return false;
  });
  
  media.addEventListener("timeupdate", function() {
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.pause();
    }
    updatePlayerUI();
  });
}

var Tutorial = {
  _commands: [],
  pop: Popcorn(new Popcorn.baseplayer()),
  editor: null,
  plugin: function(name, plugin) {
    var self = this;
    this[name] = function() {
      var command = {
        start: self.pop.media.duration,
        plugin: name,
        index: self._commands.length
      };
      jQuery.extend(command, plugin);
      plugin.initialize.apply(command, arguments);
      self.pop.media.duration += command.duration;
      self._commands.push(command);
      return self;
    };
  },
  end: function() {
    var self = this;
    this._commands.forEach(function(command) {
      command.annotate(self.pop, self._commands, self.editor);
    });
    this.pop.media.readyState = 4;
  }
};

Tutorial.plugin("allowediting", {
  initialize: function(predicate) {
    this.predicate = predicate;
    this.duration = 1.0;
  },
  annotate: function(pop, commands, editor) {
    var start = this.start;
    var predicate = this.predicate;
    var interval;

    function checkForWin() {
      if (predicate(editor))
        $("div.win").fadeIn();
      else
        $("div.win").fadeOut();
    }

    pop.undoable({
      start: start,
      end: start + this.duration,
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
        $("div.win").hide();
      }
    });
  }
});

Tutorial.plugin("moveto", {
  initialize: function(options) {
    this.position = options.position;
    this.search = options.search;
    this.duration = 0.1;
  },
  annotate: function(pop, commands, editor) {
    var position = this.position;
    var search = this.search;
    var start = this.start;
    pop.undoable({
      start: start,
      end: start + this.duration,
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
        end: currentTime + self.DURATION_PER_CHAR,
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

Tutorial.plugin("dialogue", {
  TRANSITION_TIME: 0.6,
  initialize: function(html, duration) {
    if (typeof(duration) == "undefined")
      duration = 4;
    if (duration == 0)
      duration = 0.05;
    this.duration = duration;
    this.html = html;
  },
  annotate: function(pop, commands) {
    var html = this.html;
    var end = pop.media.duration + 1;
    for (var i = this.index+1; i < commands.length; i++)
      if (commands[i].plugin == "dialogue") {
        end = commands[i].start - this.TRANSITION_TIME;
        break;
      }
    pop.simplecode({
      start: this.start,
      end: end,
      onStart: function() {
        $("#dialogue").html(html).addClass('visible');
      },
      onEnd: function() {
        $("#dialogue").removeClass('visible');
      }
    });
  }
});

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

function initEditor() {
  var nextUpdateIsSilent = false;
  var nextUpdateIsInstant = false;
  var DELAY_MS = 300;
  var delay = null;
  var editor = CodeMirror(function(element) {
    $("#editor").append(element);
  }, {
    mode: "text/html",
    theme: "jsbin",
    tabMode: "indent",
    lineWrapping: true,
    lineNumbers: true,
    readOnly: true,
    onCursorActivity: function() {
      if (editor.nextCursorActivityIsAutomated) {
        editor.lastCursorPos = editor.getCursor();
        editor.nextCursorActivityIsAutomated = false;
      } else {
        var canChange = !editor.getOption("readOnly");
        if (!canChange && editor.lastCursorPos) {
          editor.nextCursorActivityIsAutomated = true;
          editor.setCursor(editor.lastCursorPos);
        }
      }
    },
    onChange: function schedulePreviewRefresh() {
      if (nextUpdateIsSilent) {
        nextUpdateIsSilent = false;
      } else {
        clearTimeout(delay);
        if (nextUpdateIsInstant) {
          nextUpdateIsInstant = false;
          updatePreview();
        } else
          delay = setTimeout(updatePreview, DELAY_MS);
      }
    }
  });

  function updatePreview() {
    var previewDocument = $("#preview").contents()[0];
    previewDocument.open();
    previewDocument.write(editor.getValue());
    previewDocument.close();
  }
  updatePreview();
  
  return editor;
}

Tutorial.editor = initEditor();
makePlayer($("#player"), Tutorial.pop);

$(window).ready(function() {
  $(window).bind("hashchange", function() {
    var time = parseFloat(window.location.hash.slice(1));
    if (isNaN(time))
      time = 0;
    Tutorial.pop.play(time);
  }).trigger("hashchange");
});
