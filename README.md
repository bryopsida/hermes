# Hermes
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_hermes&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=bryopsida_hermes)[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_hermes&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=bryopsida_hermes)[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_hermes&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=bryopsida_hermes)[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_hermes&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bryopsida_hermes)![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/bryopsida/hermes)
## Introduction
Hermes is a Node.JS application that ingests data, munges it, and evaluates the munged data against configurable conditions. When conditions are met anouncements can be set to notify users of the event. Kafka is used to distribute the work of munging the data and create transform streams. Redis is used as the backing store for the task queue system responsibe for periodically fetching external data using the Bull task system and publishing the data to Kafka. Munged data is stored in MongoDB with added classifiers. In the future Elastic Search usage may be added if full text search over captured data is needed/desired.

## Installation
Todo
---
- [ ] Add chart publish to gihub pages
- [ ] Add helm deployment example
- [ ] Add examples of configuring chart dependencies and other configuration options
- [ ] Link to helm readme

## Development Environment
For information on setting up a development environment for this project, check out this wiki [page](https://github.com/bryopsida/hermes/wiki/Development-Environment#development-environment).