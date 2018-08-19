/* LookupAPI interface for both modules and export variables
 * Lookup class interface: (? denoting optional)
 *             class LookupAgent {
 *               isNeeded(prefix: string, configs?: ConfigRetrieval): boolean;
 *               getList(prefix: string,
 *                               filePath: string,
 *                               configs: ConfigRetrieval): Promise<Suggestion[]>
 *               lookup() //method to be reused by other agents
 *             }
 * Suggestion: https://github.com/atom/autocomplete-plus/wiki/Provider-API#suggestions
 */
class LookupApi {
  constructor(filePath, lookups, configs, filterLookupsByText) {
    this.filePath = filePath;
    this.lookups = lookups;
    this.configs = configs;
    this.filterByText = filterLookupsByText;
  }

  filterList(agentFilter, lookupFilter, prefix) {
    const relevantLookups = this.lookups.filter((lookup) => lookup.isNeeded(agentFilter, this.configs));

    return relevantLookups.reduce((all, lookup) => {
      return [...all,
        lookup.getList(lookupFilter, this.filePath, this.configs)
        .then(suggestions => this.filterByText(suggestions, lookup.massagePrefix(prefix)))];
    }, []);
  }
}

module.exports = LookupApi;
