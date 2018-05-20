"use babel";
const CompletionProvider = require('../lib/completion-provider');

describe('atom-autocomplete-modules', function () {
  let subject;
  let editor, editorElement;
  beforeEach(() => {
    waitsForPromise(() =>
    Promise.all([
        atom.packages.activatePackage('language-javascript'),
        atom.packages.activatePackage('autocomplete-plus'),
        atom.packages.activatePackage('autocomplete-modules')
      ])
    );
    waitsForPromise(() =>
      atom.workspace.open('testbed.js'));
    runs(() => {
      subject = atom.packages.getActivePackage('autocomplete-modules').mainModule.getCompletionProvider();
      editor = atom.workspace.getActiveTextEditor();
      editorElement = atom.views.getView(editor);
    });
  });

  describe('initalization', () => {
    it('should be an instance of completion-provider', () => {
      expect(subject instanceof CompletionProvider).toBe(true);
    });
  });
});
