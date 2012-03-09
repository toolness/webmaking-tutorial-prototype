// This is a simple Popcorn plugin that can be used to apply/unapply
// a sequence of undoable commands over a period of time. It's useful for
// automating the use of an application in movies, among other things.
//
// At any point in time through the movie, this plugin makes sure that
// any commands which are supposed to have been applied at that point
// in time are applied, and that any commands which are not supposed
// to have been applied yet are undone. This makes it possible for
// the user to "scrub" to any point in time and see the application
// in a consistent state.

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
