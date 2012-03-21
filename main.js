function TwoPanedEditor(settings) {
  var nextUpdateIsSilent = false;
  var nextUpdateIsInstant = false;
  var DELAY_MS = 300;
  var delay = null;
  var editor = CodeMirror(function(element) {
    $(settings.editor).append(element);
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
    var previewDocument = $(settings.preview).contents()[0];
    previewDocument.open();
    previewDocument.write(editor.getValue());
    previewDocument.close();
  }
  updatePreview();
  
  return editor;
}

$(window).ready(function() {
  tutorial.ready({
    editor: TwoPanedEditor({
      editor: $("#editor"),
      preview: $("#preview")
    }),
    instructions: $("#dialogue")
  });
  
  $(window).bind("hashchange", function() {
    var time = parseFloat(window.location.hash.slice(1));
    if (isNaN(time))
      time = 0;
    tutorial.pop.play(time);
  }).trigger("hashchange");
});
