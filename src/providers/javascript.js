'use babel';

module.exports = {
  selector: '.source.js .string.quoted, .source.coffee .string.quoted',
  disableForSelector: '.source.js .comment, source.js .keyword',
  inclusionPriority: 1,
  getSuggestions({editor, bufferPosition, prefix}) {

  }
};
