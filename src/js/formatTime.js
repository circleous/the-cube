// One place for the millisecond -> `m:ss` conversion, shared by the timer and the
// stats renderer. The original had this logic twice, byte for byte.
function formatTime(millis) {
  const seconds = parseInt((millis / 1000) % 60);
  const minutes = parseInt(millis / (1000 * 60));

  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

export { formatTime };
