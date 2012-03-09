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
