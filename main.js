var scriptHtmlLoad = jQuery.get("script.html");
var debugVars;

jQuery.fn.extend({
  attrFloat: function(name, defaultValue) {
    var number = parseFloat(this.attr(name));
    if (isNaN(number))
      return defaultValue;
    return number;
  }
});

Popcorn.plugin("simplecode", function(options, f) {
  return {
    start: function(event, options) {
      var myIndex = this.data.trackEvents.byStart.indexOf(options);
      var events = this.data.trackEvents.byStart;
      var futureEvents = events.slice(myIndex+1);
      var pastEvents = events.slice(0, myIndex);
      futureEvents.reverse().forEach(function(event) {
        if (event.isUndoable && event.executed)
          event.undo();
      });
      pastEvents.forEach(function(event) {
        if (event.isUndoable && !event.executed)
          event.onStart();
      });
      if (options.onStart)
        options.onStart();
    },
    end: function(event, options) {
      if (options.onEnd)
        options.onEnd();
    }
  };
});

function undoable(options) {
  var onStart = options.onStart;
  var undo = options.undo;

  options.isUndoable = true;
  options.executed = false;
  options.onStart = function() {
    if (!this.executed) {
      this.executed = true;
      onStart.call(this);
    }
  };
  options.undo = function() {
    if (this.executed) {
      this.executed = false;
      undo.call(this);
    }
  };
  return options;
}

function startPlayingScript(html, commands) {
  function updatePlayerUI() {
    var percentComplete = (media.currentTime / media.duration) * 100;
    $("#player .progress").css({
      width: percentComplete + "%"
    });
    $(".timestamp").text(media.currentTime.toFixed(1).toString() + 's');  
  }

  function parseScript() {
    var div = $("<div></div>");
    div.html(html);
    div.find("section").each(function() {
      var command = commands[$(this).attr("data-role")];
      $(this).data("command", command);
      $(this).attr("data-start", media.duration);
      media.duration += command.duration($(this));
    }).each(function() {
      $(this).data("command").annotate($(this), pop);
    });
  }

  $(window).bind("hashchange", function() {
    var time = parseFloat(window.location.hash.slice(1));
    if (isNaN(time))
      time = 0;
    if (pop)
      pop.play(time);
  });

  $("#player .scrubber").mousedown(function(event) {
    var self = $(this);

    function scrub(event) {
      var baseX = self.offset().left;
      var width = self.width();
      var percentage = (event.pageX - baseX) / width;
      pop.media.currentTime = pop.media.duration * percentage;
      pop.media.dispatchEvent("timeupdate");
    }

    self.bind("mousemove", function(event) {
      scrub(event);
    });
    $(document).one("mouseup", function() {
      self.unbind("mousemove");
      pop.play();
    });

    pop.pause();
    scrub(event);
    return false;
  });
  
  var media = new Popcorn.baseplayer();
  var pop = Popcorn(media);

  media.addEventListener("timeupdate", function() {
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.pause();
    }
    updatePlayerUI();
  });

  parseScript();
  media.readyState = 4;
  $(window).trigger("hashchange");
  
  return pop;
}

function addEditorMovieCommands(commands, editor) {
  commands.moveto = {
    duration: function(section) {
      return 0.1;
    },
    annotate: function(section, pop) {
      var position = section.attr("data-position");
      var search = section.text();
      var start = section.attrFloat("data-start");
      pop.simplecode(undoable({
        start: start,
        end: start + this.duration(section),
        onStart: function() {
          if (search.length) {
            this._oldCursor = editor.getCursor();
            var cursor = editor.getSearchCursor(search);
            cursor.findNext();
            if (position == "beginning") {
              editor.setCursor(cursor.from());
            } else if (position == "end") {
              editor.setCursor(cursor.to());
            }
            return;
          }
          if (position == "beginning") {
            editor.setCursor(0, 0);
          } else if (position == "end") {
            editor.setCursor(9999999999, 999999999999);
          }
        },
        undo: function() {
          editor.setCursor(this._oldCursor);
        }
      }));
    }
  };
  
  commands.typechars = {
    DURATION_PER_CHAR: 0.4,
    duration: function(section) {
      return section.text().length * this.DURATION_PER_CHAR;
    },
    annotate: function(section, pop) {
      var self = this;
      var characters = section.text();
      var array = [];
      var currentTime = section.attrFloat("data-start");
      for (var i = 0; i < characters.length; i++)
        array.push(characters.charAt(i));
      array.forEach(function(character) {
        pop.simplecode(undoable({
          start: currentTime,
          end: currentTime + self.DURATION_PER_CHAR,
          onStart: function() {
            this._oldCursor = editor.getCursor();
            editor.focus();
            editor.replaceRange(character, editor.getCursor());
          },
          undo: function() {
            editor.replaceRange("", this._oldCursor, editor.getCursor());
          }
        }));
        currentTime += self.DURATION_PER_CHAR;
      });
    }
  };
}

function addGeneralMovieCommands(commands) {
  commands.dialogue = {
    TRANSITION_TIME: 0.6,
    duration: function(section) {
      var duration = section.attrFloat("data-duration", 4);
      return duration || 0.05;
    },
    annotate: function(section, pop) {
      var nextDialogue = section.nextAll('section[data-role="dialogue"]');
      var end = pop.media.duration + 1;
      if (nextDialogue.length)
        end = nextDialogue.attrFloat("data-start") - this.TRANSITION_TIME;
      pop.simplecode({
        start: section.attrFloat("data-start"),
        end: end,
        onStart: function() {
          $("#dialogue").html(section.html());
          $("#dialogue").addClass('visible');
        },
        onEnd: function() {
          $("#dialogue").removeClass('visible');
        }
      });
    }
  };
  
  commands.spotlight = {
    TRANSITION_TIME: 0.25,
    duration: function(section) {
      return 3;
    },
    annotate: function(section, pop) {
      var self = this;
      var start = section.attrFloat("data-start");
      pop.simplecode({
        start: start,
        end: start + this.duration(section) - this.TRANSITION_TIME,
        onStart: function() {
          var target = $(section.attr("data-selector"));
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
  };
}

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

$(window).load(function() {
  scriptHtmlLoad.done(function(html) {
    var v = debugVars = {
      editor: initEditor(),
      commands: {}
    };

    addGeneralMovieCommands(v.commands);
    addEditorMovieCommands(v.commands, v.editor);
    v.pop = startPlayingScript(html, v.commands);
  });
});
