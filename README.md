# Hermes

## Introduction
Hermes is a Node.JS application that ingests data, munges it, and evaluates the munged data against configurable conditions. When conditions are met anouncements can be set to notify users of the event. Kafka is used to distribute the work of munging the data and create transform streams. Redis is used as the backing store for the task queue system responsibe for periodically fetching external data using the Bull task system and publishing the data to Kafka. Munged data is stored in MongoDB with added classifiers. In the future Elastic Search usage may be added if full text search over captured data is needed/desired.

## Installation
Hermes is deployed using a helm chart. You must first add the repo, `helm repo add hermes https://bryopsida.github.io/hermes`, once added you need to pull the latest changes `helm repo update`. You may need to create a pull secret for GHCR, you can do this with `kubectl --namespace $HELM_NAMESPACE create secret docker-registry ghcr-credentials  --docker-server=ghcr.io --docker-username=$GHCR_USERNAME --docker-password=$GHCR_PASSWORD`. You will need to set your values for `$HELM_NAMESPACE`, `$GHCR_USERNAME`, and `$GHCR_PASSWORD`. You can deploy and/or upgrade using the following command: `helm --namespace $HELM_NAMESPACE upgrade --install hermes hermes/hermes --debug --wait`


## Manage a data source
First setup your pandora configuration file, for example:
``` json
{
  "currentContext": "local",
  "contexts": {
    "local": {
      "baseUrl": "http://localhost:3000"
    }
  }
}
```
This should be placed at `~/.pandora/config.json` 

Navigate to the pandora folder under this repo `src/tools/pandora` and install this tool `npm install -g`, at this point the pandora cli interface hermes should be available in your cli, you can confirm by executing `pandora --help`, in the future this process will be simplified to be just a npm install using a published npm package. 

With pandora you can add a new data source like so `pandora data-sources add <name> json <url>`, this data source will now be monitored for changes and on change the new revision will be processed in the hermes pipeline. You can see all of the current data sources with this command `pandora data-sources list`. If you no longer wish to monitor a source you can remove a data source by executing the following command `pandora data-sources remove <id>`.

## Development Environment
For information on setting up a development environment for this project, check out this wiki [page](https://github.com/bryopsida/hermes/wiki/Development-Environment#development-environment).
