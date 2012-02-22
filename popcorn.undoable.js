(function(Popcorn) {
  function applyUndoables() {
    var currentTime = this.media.currentTime;
    var pastEvents = [];
    var futureEvents = [];
    this.data.trackEvents.byStart.forEach(function(event) {
      if (event.start <= currentTime && event.end <= currentTime &&
          event.isUndoable && !event.executed)
        pastEvents.push(event);
      else if (event.start > currentTime && event.end > currentTime &&
               event.isUndoable && event.executed)
        futureEvents.push(event);
    });
    futureEvents.reverse().forEach(function(event) { event.undo(); });
    pastEvents.forEach(function(event) { event.execute(); });
  }
  
  Popcorn.plugin("undoable", function(options) {
    var execute = options.execute;
    var undo = options.undo;

    options.isUndoable = true;
    options.executed = false;
    options.execute = function() {
      if (!this.executed) {
        this.executed = true;
        execute.call(this);
      }
    };
    options.undo = function() {
      if (this.executed) {
        this.executed = false;
        undo.call(this);
      }
    };
    return {
      _setup: function() {
        if (!this.undoableListenerAdded) {
          this.undoableListenerAdded = true;
          this.listen("trackstart", applyUndoables);
        }
      },
      start: function() {},
      end: function() {}
    };
  });
})(Popcorn);
