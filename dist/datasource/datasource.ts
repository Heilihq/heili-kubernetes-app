///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';

export class K8sDatasource {
  id: number;
  name: string;
  // dc: string;
  // env: string;
  // customer: string;
  // access_key: string;
  // secret_key: string;
  url: string;
  type: string;
  ds: string;
  static baseApiUrl = '/api/v1/';

  constructor(instanceSettings, private backendSrv, private templateSrv, private $q) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    // this.dc = instanceSettings.jsonData.dc;
    // this.env = instanceSettings.jsonData.env;
    // this.customer = instanceSettings.jsonData.customer;
    // this.access_key = instanceSettings.secureJsonData.access_key;
    // this.secret_key = instanceSettings.secureJsonData.secret_key;
    this.id = instanceSettings.id;
    this.ds = instanceSettings.jsonData.ds;
    this.backendSrv = backendSrv;
    this.$q = $q;
  }

  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
  }

  _get(apiResource) {
    return this.backendSrv.datasourceRequest({
      url: this.url + apiResource,
      method: "GET",
      headers: { 'Content-Type': 'application/json' }
    }).then(
      response => {
        return response.data;
      }, error => {
        return error;
      });
  }

  getNodes() {
    return this._get('/api/v1/nodes')
      .then(result => {
        return result.items;
      });
  }

  getNode(name) {
    return this._get('/api/v1/nodes/' + name);
  }

  getNamespaces() {
    return this._get('/api/v1/namespaces')
      .then(result => {
        return result.items;
      });
  }

  getComponentStatuses() {
    return this._get('/api/v1/componentstatuses')
      .then(result => {
        return result.items;
      });
  }

  getDaemonSets(namespace) {
    return this._get('/apis/apps/v1/' + addNamespace(namespace) + 'daemonsets')
      .then(result => {
        return result.items;
      });
  }

  getDaemonSet(name, namespace) {
    return this._get('/apis/apps/v1/daemonsets/?fieldSelector=metadata.name%3D' + name + ',metadata.namespace%3D' + namespace)
    .then(result => {
      if (result.items && result.items.length === 1) {
        return result.items[0];
      } else {
        return result.items;
      }
    });
  }

  getReplicationControllers(namespace) {
    return this._get('/api/v1/' + addNamespace(namespace) + 'replicationcontrollers')
      .then(result => {
        return result.items;
      });
  }

  getDeployments(namespace) {
    return this._get('/apis/apps/v1/' + addNamespace(namespace) + 'deployments')
      .then(result => {
        return result.items;
      });
  }

  getDeployment(name, namespace) {
    return this._get('/apis/apps/v1/deployments/?fieldSelector=metadata.name%3D' + name + ',metadata.namespace%3D' + namespace)
    .then(result => {
      if (result.items && result.items.length === 1) {
        return result.items[0];
      } else {
        return result.items;
      }
    });
  }

  getStaefulsets(namespace) {
    return this._get('/apis/apps/v1/' + addNamespace(namespace) + 'statefulsets')
      .then(result => {
        return result.items;
      });
  }

  getStatefulSet(name, namespace) {
    return this._get('/apis/apps/v1/statefulsets/?fieldSelector=metadata.name%3D' + name + ',metadata.namespace%3D' + namespace)
    .then(result => {
      if (result.items && result.items.length === 1) {
        return result.items[0];
      } else {
        return result.items;
      }
    });
  }

  getCronJobs(namespace) {
    return this._get('/apis/batch/v1beta1/' + addNamespace(namespace) + 'cronjobs')
      .then(result => {
        return result.items;
      });
  }

  getPods(namespace) {
    return this._get('/api/v1/' + addNamespace(namespace) + 'pods')
      .then(result => {
        return result.items;
      });
  }

  getPodsByLabel(namespace, labels) {
    return this._get('/api/v1/' + addNamespace(namespace) + 'pods?labelSelector=' + addLabels(labels))
      .then(result => {
        return result.items;
      });
  }

  getPod(name) {
    return this._get('/api/v1/pods/?fieldSelector=metadata.name%3D' + name)
    .then(result => {
      if (result.items && result.items.length === 1) {
        return result.items[0];
      } else {
        return result.items;
      }
    });
  }

  getPodsByName(names) {
    const promises = [];
    if (Array.isArray(names)) {
      _.forEach(names, name => {
        promises.push(this.getPod(name));
      });
      return this.$q.all(promises);
    } else {
      return this.getPod(names)
      .then(pod => {
        return [pod];
      });
    }
  }

  query(options) {
    throw new Error("Query Support not implemented yet.");
  }

  annotationQuery(options) {
    throw new Error("Annotation Support not implemented yet.");
  }

  metricFindQuery(query: string) {
    let promises: any[] = [];
    let namespaces: string[];
    if (!query) {
      return Promise.resolve([]);
    }
    let interpolated = this.templateSrv.replace(query, {});
    let query_list = interpolated.split(" ");
    if (query_list.length > 1) {
      namespaces = query_list[1].replace("{", "").replace("}", "").split(",")
    } else {
      namespaces = [""] //Gets all pods/deployments
    }
    switch (query_list[0]) {
      case 'pod':
        for (let ns of namespaces) {
          promises.push(this.getPods(ns))
        }
        return Promise.all(promises).then((res) => {
          let data: any[] = [];
          let pods = _.flatten(res).filter(n => n)
          for (let pod of pods) {
            data.push({
              text: pod.metadata.name,
              value: pod.metadata.name,
            });
          }
          return data
        })
      case 'deployment':
        for (let ns of namespaces) {
          promises.push(this.getDeployments(ns))
        }
        return Promise.all(promises).then((res) => {
          let data: any[] = [];
          let deployments = _.flatten(res).filter(n => n)
          for (let deployment of deployments) {
            data.push({
              text: deployment.metadata.name,
              value: deployment.metadata.name,
            });
          }
          return data
        })
      case 'statefulset':
        for (let ns of namespaces) {
          promises.push(this.getStaefulsets(ns))
        }
        return Promise.all(promises).then((res) => {
          let data: any[] = [];
          let statefulsets = _.flatten(res).filter(n => n)
          for (let statefulset of statefulsets) {
            data.push({
              text: statefulset.metadata.name,
              value: statefulset.metadata.name,
            });
          }
          return data
        })
      case 'daemonset':
        for (let ns of namespaces) {
          promises.push(this.getDaemonSets(ns))
        }
        return Promise.all(promises).then((res) => {
          let data: any[] = [];
          let daemonsets = _.flatten(res).filter(n => n)
          for (let daemonset of daemonsets) {
            data.push({
              text: daemonset.metadata.name,
              value: daemonset.metadata.name,
            });
          }
          return data
        })
      case 'namespace':
        return this.getNamespaces().then(namespaces => {
          let data: any[] = [];
          for (let ns of namespaces) {
            data.push({
              text: ns.metadata.name,
              value: ns.metadata.name,
            });
          };
          return data;
        });
      case 'node':
        return this.getNodes().then(nodes => {
          let data: any[] = [];
          for (let node of nodes) {
            data.push({
              text: node.metadata.name,
              value: node.metadata.name,
            });
          };
          return data;
        });
      case 'datasource': // Returns the elasticsearch datasource associated with the cluster
        return Promise.resolve([{
          text: this.ds,
          value: this.ds,
        }]);
    }
  }
}

function addNamespace(namespace) {
  return namespace ? 'namespaces/' + namespace + '/' : '';
}

function addLabels(labels) {
  let querystring = '';
  _.forEach(labels, (value, label) => {
    querystring += label + '%3D' + value + '%2C';
  });
  return _.trimEnd(querystring, '%2C');
}
