Tutorial
  .dialogue("Hi! I am Mr. Love Bomb and will teach you how to be a webmaker now.", 0)
  .typechars("you're really cool.")
  .dialogue("Check it out, this is HTML source code&mdash;the language of the Web.", 0)
  .spotlight("#editor")
  .dialogue("And this is what the HTML looks like on the Web.", 0)
  .spotlight("#preview")
  .dialogue("The two look pretty similar right now, don't they?")
  .dialogue("But in HTML, you can use <em>tags</em> to structure and format your Web page. Check this out!")
  .moveto({position: "beginning", search: "really"})
  .typechars("<em>")
  .moveto({position: "end", search: "really"})
  .typechars("</em>")
  .dialogue("We call that an <code>&lt;em&gt;</code> tag. The <em>em</em> stands for <em>emphasis</em>.")
  .dialogue("Notice how the text we want to emphasize is now in italics.", 0)
  .spotlight("#preview")
  .codechallenge({
    test: function hasUserItalicizedWord(editor) {
      var value = editor.getValue();
      return (value.match(/\<em\>\s*you're\s*\<\/em\>\s*really cool\./i));
    },
    win: "div.win"
  })
  .dialogue("Now it's your turn. Can you make the word <em>you're</em> italicized instead of <em>really</em>?", 1);
