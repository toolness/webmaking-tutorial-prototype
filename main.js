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
    updatePlayerUI();
  });
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

$(window).ready(function() {
  Tutorial.ready(initEditor());
  makePlayer($("#player"), Tutorial.pop);
  
  $(window).bind("hashchange", function() {
    var time = parseFloat(window.location.hash.slice(1));
    if (isNaN(time))
      time = 0;
    Tutorial.pop.play(time);
  }).trigger("hashchange");
});
