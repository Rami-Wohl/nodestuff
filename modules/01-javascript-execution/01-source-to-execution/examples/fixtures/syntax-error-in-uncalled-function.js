console.log('does this line print?');

function neverCalled() {
  // Nobody calls this function. The parser still has to read its body
  // to find out where the function ends.
  return 1 + ;
}
