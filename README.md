# Hermes

## Introduction
Hermes is a Node.JS application that ingests data, munges it, and evaluates the munged data against configurable conditions. When conditions are met anouncements can be set to notify users of the event. Kafka is used to distribute the work of munging the data and create transform streams. Redis is used as the backing store for the task queue system responsibly for periodically fetching external data using the Bull task system and publishing the data to Kafka. Elastic search is leveraged for search indices of the munged data that are compatibile with GraphQL queries. PostgreSQL is used as the configuration store persisting the data sources that will be ingested, the conditions, the notifications, all of the supporting configuration settings and user and access control data.

## Installation
Todo
---
- [ ] Add chart publish to gihub pages
- [ ] Add helm deployment example
- [ ] Add examples of configuring chart dependencies and other configuration options
- [ ] Link to helm readme

## Development Environment
For information on setting up a development environment for this project, check out this wiki [page](https://github.com/bryopsida/hermes/wiki/Development-Environment#development-environment).