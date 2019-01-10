///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import kbn from 'app/core/utils/kbn';
import _ from 'lodash';
import moment from 'moment';

export default class NodeStatsDatasource {
  constructor(private datasourceSrv, private timeSrv) {}

  issueHeiliQuery(heiliDS, query) {
    return this.datasourceSrv.get(heiliDS)
      .then((datasource) => {
        var metricsQuery = {
          range: { from: moment().subtract(5, 'minute'), to: moment() },
          targets: [
              {
                bucketAggs: [
                  {
                    field: query.legend,
                    id: "2",
                    settings: {
                      min_doc_count: 1,
                      order: "desc",
                      orderBy: "_term",
                      size: "0"
                    },
                    type: "terms"
                  },
                  {
                    type: "date_histogram",
                    field: "@timestamp",
                    id: "3",
                    settings: {
                      min_doc_count: 1,
                      interval: "1m"
                    }
                  }
                ],
                timeField: '@timestamp',
                metrics: [
                  {
                    field: query.field,
                    id: "1",
                    meta: {},
                    settings: {},
                    type: query.type
                  }
                ],
                query: query.expr,
                alias: query.legend
              },
            ],
          interval: '60s',
        };
        return datasource.query(metricsQuery);
      }).then((result) => {
        if (result && result.data) {
          return result.data;
        }
        return {};
      });
  }

  getNodeStats(cluster_id, heiliDS) {
    let podsPerNode, cpuPerNode, memoryPerNode;

    const podQuery = {
      expr: 'name: kube_pod_info',
      field: 'tags.pod',
      type: 'cardinality',
      legend: 'tags.node',
    };
    const cpuQuery = {
      expr: 'name: kube_pod_container_resource_requests && tags.resource: cpu',
      field: 'fields.gauge',
      type: 'avg',
      legend: 'tags.node',
    };
    const memoryQuery = {
      expr: 'name: kube_pod_container_resource_requests && tags.resource: memory',
      field: 'fields.gauge',
      type: 'avg',
      legend: 'tags.node',
    };

    return this.issueHeiliQuery(heiliDS, podQuery)
      .then(data => {
        podsPerNode = data;
        return;
      }).then(() => {
        return this.issueHeiliQuery(heiliDS, cpuQuery);
      })
      .then(data => {
        cpuPerNode = data;
        return;
      }).then(() => {
        return this.issueHeiliQuery(heiliDS, memoryQuery);
      })
      .then(data => {
        memoryPerNode = data;
        return {podsPerNode, cpuPerNode, memoryPerNode};
      });
  }

  updateNodeWithStats(node, nodeStats) {
    var formatFunc = kbn.valueFormats['percentunit'];
    const nodeName = node.metadata.name;
    const findFunction = function(o) {return o.props[o.target] === nodeName;};
    const podsUsedData = _.find(nodeStats.podsPerNode, findFunction);
    if (podsUsedData) {
      node.podsUsed = _.last(podsUsedData.datapoints)[0];
      node.podsUsedPerc = formatFunc(node.podsUsed / node.status.capacity.pods, 2, 5);
    }

    const cpuData = _.find(nodeStats.cpuPerNode, findFunction);
    if (cpuData) {
      node.cpuUsage = _.last(cpuData.datapoints)[0];
      node.cpuUsageFormatted = kbn.valueFormats['none'](node.cpuUsage, 2, null);
      node.cpuUsagePerc = formatFunc(node.cpuUsage / node.status.capacity.cpu, 2, 5);
    }

    const memData = _.find(nodeStats.memoryPerNode, findFunction);
    if (memData) {
      node.memoryUsage = _.last(memData.datapoints)[0];
      const memCapacity = node.status.capacity.memory.substring(0, node.status.capacity.memory.length - 2)  * 1000;
      node.memUsageFormatted = kbn.valueFormats['bytes'](node.memoryUsage, 2, null);
      node.memCapacityFormatted = kbn.valueFormats['bytes'](memCapacity, 2, null);
      node.memoryUsagePerc = formatFunc((node.memoryUsage / memCapacity), 2, 5);
    }

    return node;
  }
}
