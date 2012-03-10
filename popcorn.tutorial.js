// This is a basic UI and popcorn player for tutorial playback/scrubbing.

Popcorn.player("tutorial", {
  _setup: function() {
    // By default, the baseplayer won't actually stop the video when
    // the end has been reached, so we'll have to do that ourselves.
    var alreadyTryingToPause = false;
    var media = this;
    var div = $(media);
    var scrubber = div.find(".scrubber");
    
    this.addEventListener("timeupdate", function() {
      if (!alreadyTryingToPause && this.currentTime >= this.duration) {
        alreadyTryingToPause = true;
        this.currentTime = this.duration;
        this.pause();
        alreadyTryingToPause = false;
      }
    });

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
        media.currentTime = media.duration * percentage;
        media.dispatchEvent("timeupdate");
      }

      scrubber.bind("mousemove", function(event) {
        scrub(event);
      });
      $(document).one("mouseup", function() {
        scrubber.unbind("mousemove");
        media.play();
      });

      media.pause();
      scrub(event);
      return false;
    });

    media.addEventListener("timeupdate", function() {
      updatePlayerUI();
    });
  }
});
