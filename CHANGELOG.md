## v2.2.3
 * (module-babel) Recurse only through all available unique babelrc files for import
   * Resolves #99
 
## v2.2.2
 * (general) Remove distracting notification
 
## v2.2.1
 * (module-global) Reorder the global list to display dependencies first
 * (utils-lookup-alias) Improve handling of invalid alias conditions
 * (lookups-general) Handle gracefully when lookups fail
 * (export-global) Handle module lookup when cjs is detected 

## v2.2.0
 * (regex) Match prefix in `require` that uses grave accent. Thanks @iofjuupasli!

## v2.1.6
 * (module-local) Handle invalid path imports - gracefully
 * (export-local) Handle invalid imported path - gracefully
 
## v2.1.5
 * (module-babel) Remove prior directory from the prefix to compare to the suggestions
 * (module-local) skip searching local files when current file has no file file path

## v2.1.4
 * (module-local) Massage prefix to remove parent folder or relative formats
 
## v2.1.3
 * Fix issue with not checking from root #99
  * Thank you @remhume for the QA
## v2.1.2
 * Wrap findbabelConfig's lib with bluebird. Thanks @remhume!

## v2.1.1
 * Major Refactor and restructure to improve code maintainability.
 
This should not break any current functionality. **If it does please do report it ASAP**.

Pre-pend your issue with `[Regression]` so that we can triage it quickly.
        
## v2.1.0
 * Include selector for [tree-sitter](https://github.com/tree-sitter/tree-sitter) language scope.

## v2.0.0
 * **Breaking Change!** Removed TypeScript support. [Recommend to use suggested packages](https://github.com/nkt/atom-autocomplete-modules#troubleshooting).

## v1.13.0
 * Support nested .babelrc. Fixed #57.

## v1.12.0
 * Upgrade to [auto-complete v4 API](https://github.com/atom/autocomplete-plus/wiki/Provider-API#api-400)
 * Fixes issue when the search prefix starts with a `{` symbol.

## V1.11.0
 * Upgraded dependency that handles the esm read
 * Handle imports of JS files from node_modules. Fixed #91.

## v1.10.0
 * Added activation support for package [language-typescript](https://atom.io/packages/language-typescript)
 
## v1.9.0
 * Added support for looking up Webpack aliases

## v1.8.0
 * Added support for autocomplete by exports

## v1.6.1
 * Fix babel-plugin-module-alias support. Fixed #43.

## v1.6.0
 * Added support for [Babel Plugin Module Alias](https://github.com/tleunen/babel-plugin-module-alias)

## v1.5.2
 * Allow include extensions to completions (.js, .ts, etc.)
 * Fixed unescaped regexp. Fixed #31, #34, #35.

## v1.5.1
 * Added missing TypeScript extensions

## v1.5.0
 * Added TypeScript support

## v0.3.0
 * Added packages internal files lookup

## v0.3.0
 * Added packages internal files lookup

## v0.2.2
 * Removed local file extensions for js/coffee

## v0.2.0
 * Added local files lookup

## v0.1.0 First Release
 * Added internal modules lookup
 * Added node_modules lookup
