// This is a basic UI and popcorn player for tutorial playback/scrubbing.

Popcorn.player("tutorial", {
  _setup: function() {
    function button(elements) {
      function attrs(element, attributes) {
        for (var name in attributes)
          element.setAttribute(name, attributes[name].toString());
      }
      
      var SVG_NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(SVG_NS, "svg");
      attrs(svg, {class: "button", viewBox: "0 0 100 100"});
      elements.forEach(function(info) {
        var element = document.createElementNS(SVG_NS, info[0]);
        attrs(element, info[1]);
        svg.appendChild(element);
      });
      return $(svg);
    }

    // By default, the baseplayer won't actually stop the video when
    // the end has been reached, so we'll have to do that ourselves.
    var alreadyTryingToPause = false;
    var media = this;
    var div = $(media);
    var pause = button([
      ["rect", {x: 20, y: 20, width: 20, height: 60}],
      ["rect", {x: 50, y: 20, width: 20, height: 60}]
    ]).appendTo(div).hide();
    var play = button([
      ["polygon", {points: "20 20 70 50 20 80"}]
    ]).appendTo(div).hide();
    var scrubber = $('<div class="scrubber"></div>').appendTo(div);
    var progress = $('<div class="progress"></div>').appendTo(scrubber);
    var timestamp = $('<div class="timestamp"></div>').appendTo(div);
    
    play.click(function() { media.pause(); });
    pause.click(function() { media.play(); });
    
    this.addEventListener("play", function() {
      play.show();
      pause.hide();
    });

    this.addEventListener("pause", function() {
      play.hide();
      pause.show();
    });
    
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
      progress.css({
        width: percentComplete + "%"
      });
      timestamp.text(media.currentTime.toFixed(1).toString() + 's');
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
