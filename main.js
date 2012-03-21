$(window).ready(function() {
  $(window).bind("hashchange", function() {
    var time = parseFloat(window.location.hash.slice(1));
    if (isNaN(time))
      time = 0;
    tutorial.pop.play(time);
  }).trigger("hashchange");
});
