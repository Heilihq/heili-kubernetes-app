# Heili App for Kubernetes

[Kubernetes](http://kubernetes.io/) is an open-source system for automating deployment, scaling, and management of containerized applications.

The Heili Kubernetes App is based on [Grafana Kubernetes App](https://github.com/grafana/kubernetes-app) but it use Heili depoyment stack to collect Cluster metrics([telegraf](https://github.com/Influxdb/telegraf) and [elasticsearch](https://elastic.com) instead of [prometheus](https://prometheus.io) stack.

The app allows you to monitor your Kubernetes cluster's performance. It includes 5 dashboards, Node, Pod/Container, Deployment, StatefulSet and Jobs.

### Requirements

1. Currently only has support for [**telegraf**](https://github.com/Influxdb/telegraf/) with **[ElasticSearch](https://elastic.co) Datasource**
2. For automatic deployment of the daemonsets, then Kubernetes 1.6 or higher is required.
3. Grafana 5.0.0+
