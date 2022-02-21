# Sidekicks
Sidekicks are interopable drop-ins that add functionality to a service. For example a health status sidecar adds a health endpoint to a service.
The sidekick leverages class interfaces that all services implment to determine health status. Due to the mono and micro support, sidekicks must support
interacting with 1-N services and making rollup decisions.

## Dependencies
Sidekicks should not introduce new dependencies if possible, if they do, the dependencies must be added to the all of the top level service package.json files.
This may be templated in the future to simplify things.