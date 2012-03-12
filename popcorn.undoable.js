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
  function error(msg) {
    if (window.console && window.console.error)
      window.console.error(msg);
  }
  
  Popcorn.plugin("undoable", function(options) {
    var execute = options.execute;
    var undo = options.undo;

    options.end = this.media.duration + 10;
    options.executed = false;
    options.execute = function() {
      if (!this.executed) {
        this.executed = true;
        execute.call(this);
      } else
        error("undoable already executed.");
    };
    options.undo = function() {
      if (this.executed) {
        this.executed = false;
        undo.call(this);
      } else
        error("undoable not yet executed.");
    };
    return {
      start: function() {
        options.execute();
      },
      end: function() {
        options.undo();
      }
    };
  });
})(Popcorn);
