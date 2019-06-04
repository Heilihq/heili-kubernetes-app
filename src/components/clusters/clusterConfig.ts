///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import appEvents from 'app/core/app_events';
import angular from 'angular';

const telegrafImage = 'telegraf:1.10';

let telegrafDeployment = {
  "apiVersion": "apps/v1beta1",
  "kind": "Deployment",
  "metadata": {
    "name": "telegraf",
    "namespace": "heili"
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "k8s-app": "telegraf",
        "heilik8sapp": "true"
      }
    },
    "replicas": 1,
    "template": {
      "metadata": {
        "labels": {
          "k8s-app": "telegraf",
          "heilik8sapp": "true"
        }
      },
      "spec": {
        "serviceAccountName": "telegraf",
        "volumes": [{
          "name": "config",
            "configMap": {
              "name": "heili-telegraf"
            }
          }
        ],
        "containers": [
        {
          "name": "telegraf",
          "image": telegrafImage,
          "args": [
            "--input-filter",
            "kube_inventory",
            "--output-filter",
            "amqp"
          ],
          "resources": {
            "limits": {
              "memory": "100Mi",
              "cpu": "200m",
            },
            "requests": {
              "cpu": "100m",
              "memory": "50Mi"
            }
          },
          "env": [
            {
              "name": "HEILI_COLLECTOR",
              "value": "kube_inventory"
            },
            {
              "name": "HOSTNAME",
              "valueFrom": {
                "fieldRef": {
                  "fieldPath": "spec.nodeName"
                }
              }
            },
            {
              "name": "HEILI_ACCESS_KEY",
              "valueFrom": {
                "secretKeyRef": {
                  "name": "heili-telegraf",
                  "key": "heili.access_key"
                }
              }
            },
            {
              "name": "HEILI_SECRET_KEY",
              "valueFrom": {
                "secretKeyRef": {
                  "name": "heili-telegraf",
                  "key": "heili.secret_key"
                }
              }
            }
          ],
          "volumeMounts": [{
              "name": "config",
              "mountPath": "/etc/telegraf"
          }]
        }]
      }
    }
  }
};

let telegrafDaemonSet = {
  "kind": "DaemonSet",
  "apiVersion": "apps/v1",
  "metadata": {
    "name": "telegraf",
    "namespace": "heili"
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "daemon": "telegraf",
        "heilik8sapp": "true"
      }
    },
    "template": {
      "metadata": {
        "name": "telegraf",
        "labels": {
          "daemon": "telegraf",
          "heilik8sapp": "true"
        }
      },
      "spec": {
        "serviceAccountName": "telegraf",
        "volumes": [
          {
            "name": "proc",
            "hostPath": {
              "path": "/proc"
            }
          },
          {
            "name": "sys",
            "hostPath": {
              "path": "/sys"
            }
          },
          {
            "name": "docker-socket",
            "hostPath": {
              "path": "/var/run/docker.sock"
            }
          },
          {
            "name": "utmp",
            "hostPath": {
              "path": "/var/run/utmp"
            }
          },
          {
            "name": "config",
            "configMap": {
              "name": "heili-telegraf"
            }
          }
        ],
        "containers": [{
          "name": "telegraf",
          "image": telegrafImage,
          "args": [
            "--input-filter",
            "cpu:system:mem:disk:diskio:processes:net:docker:kubernetes",
            "--output-filter",
            "amqp"
          ],
          "resources": {
            "limits": {
              "memory": "200Mi",
              "cpu": "500m",
            },
            "requests": {
              "cpu": "200m",
              "memory": "100Mi"
            }
          },
          "env": [{
              "name": "HOSTNAME",
              "valueFrom": {
                "fieldRef": {
                  "fieldPath": "spec.nodeName"
                }
              }
            },
            {
              "name": "HOST_PROC",
              "value": "/rootfs/proc"
            },
            {
              "name": "HOST_SYS",
              "value": "/rootfs/sys"
            },
            {
              "name": "HEILI_ACCESS_KEY",
              "valueFrom": {
                "secretKeyRef": {
                  "name": "heili-telegraf",
                  "key": "heili.access_key"
                }
              }
            },
            {
              "name": "HEILI_SECRET_KEY",
              "valueFrom": {
                "secretKeyRef": {
                  "name": "heili-telegraf",
                  "key": "heili.secret_key"
                }
              }
            }
          ],
          "volumeMounts": [{
              "name": "sys",
              "readOnly": true,
              "mountPath": "/rootfs/sys"
            },
            {
              "name": "proc",
              "readOnly": true,
              "mountPath": "/rootfs/proc"
            },
            {
              "name": "docker-socket",
              "readOnly": true,
              "mountPath": "/var/run/docker.sock"
            },
            {
              "name": "utmp",
              "readOnly": true,
              "mountPath": "/var/run/utmp"
            },
            {
              "name": "config",
              "mountPath": "/etc/telegraf"
            }
          ],
          "imagePullPolicy": "Always"
        }],
        "terminationGracePeriodSeconds": 30,
        "restartPolicy": "Always",
        "hostNetwork": true,
        "hostPID": true
      }
    }
  }
};
const telegrafRBAC = [
{
  "apiVersion": "rbac.authorization.k8s.io/v1",
  "kind": "ClusterRole",
  "metadata": {
    "name": "heili:cluster:viewer",
    "labels": {
      "rbac.authorization.k8s.io/aggregate-view-telegraf": "true"
    }
  },
  "rules": [{
    "apiGroups": [""],
    "resources": ["persistentvolumes", "nodes"],
    "verbs": ["get","list"]
  }]
},
{
  "apiVersion": "rbac.authorization.k8s.io/v1",
  "kind": "ClusterRole",
  "metadata": {
    "name": "heili:telegraf"
  },
  "aggregationRule": {
    "clusterRoleSelectors": [
      {"matchLabels": {
        "rbac.authorization.k8s.io/aggregate-view-telegraf": "true"
      }},
      {"matchLabels": {
        "rbac.authorization.k8s.io/aggregate-to-view": "true"
      }}
    ]
  },
  "rules": []
},
{
  "apiVersion": "v1",
  "kind": "ServiceAccount",
  "metadata": {
    "name": "telegraf",
    "namespace": "heili"
  }
},
{
  "apiVersion": "rbac.authorization.k8s.io/v1",
  "kind": "ClusterRoleBinding",
  "metadata": {
    "name": "heili:telegraf:viewer"
  },
  "roleRef": {
    "apiGroup": "rbac.authorization.k8s.io",
    "kind": "ClusterRole",
    "name": "heili:telegraf",
  },
  "subjects": [{
    "kind": "ServiceAccount",
    "name": "telegraf",
    "namespace": "heili"
  }]
}]

const telegrafSecret = {
  "apiVersion": "v1",
  "kind": "Secret",
  "metadata": {
    "name": "heili-telegraf",
    "namespace": "heili"
  },
  "type": "Opaque",
  "data": {}
}

const telegrafConfigMap = {
  "apiVersion": "v1",
  "kind": "ConfigMap",
  "metadata": {
    "name": "heili-telegraf",
    "namespace": "heili"
  },
  "data": {
    "telegraf.conf": "[global_tags] \
    \n    customer = \"$HEILI_CUSTOMER\" \
    \n    dc = \"$HEILI_DC\" \
    \n    environment = \"$HEILI_ENVIRONMENT\" \
    \n  [agent] \
    \n    interval = \"1m\" \
    \n    round_interval = false \
    \n    metric_batch_size = 5000 \
    \n    metric_buffer_limit = 10000 \
    \n    collection_jitter = \"5s\" \
    \n    flush_interval = \"40s\" \
    \n    flush_jitter = \"20s\" \
    \n    precision = \"\" \
    \n    debug = false \
    \n    quiet = true \
    \n    logfile = \"\" \
    \n    hostname = \"$HOSTNAME\" \
    \n    omit_hostname = false \
    \n  [[outputs.amqp]] \
    \n    url = \"amqp://$HEILI_ACCESS_KEY:$HEILI_SECRET_KEY@shipper.heilihq.com:5672/$HEILI_CUSTOMER\" \
    \n    exchange = \"telegraf\" \
    \n    auth_method = \"PLAIN\" \
    \n    routing_tag = \"customer\" \
    \n    timeout = \"10s\" \
    \n    data_format = \"json\" \
    \n  [[inputs.cpu]] \
    \n    percpu = false \
    \n    totalcpu = true \
    \n    collect_cpu_time = false \
    \n    report_active = false \
    \n  [[inputs.system]] \
    \n    fieldpass = [\"load1\", \"load5\", \"load15\", \"n_cpus\"] \
    \n  [[inputs.mem]] \
    \n  [[inputs.disk]] \
    \n  [inputs.disk.tagdrop] \
    \n    fstype = [\"tmpfs\", \"sysfs\", \"proc\", \"devtmpfs\", \"devfs\", \"mtmfs\", \"ramfs\", \"rootfs\"] \
    \n  [[inputs.diskio]] \
    \n    devices = [\"sda\", \"sdb\"] \
    \n  [[inputs.processes]] \
    \n  [[inputs.net]] \
    \n    interfaces = [\"eth*\"] \
    \n    ignore_protocol_stats = true \
    \n  [[inputs.docker]] \
    \n    endpoint = \"unix:///var/run/docker.sock\" \
    \n    container_names = [] \
    \n    container_name_include = [] \
    \n    container_name_exclude = [] \
    \n    timeout = \"5s\" \
    \n    perdevice = true \
    \n    total = true \
    \n    docker_label_include = [] \
    \n    docker_label_exclude = [\"statefulset.*\"] \
    \n    tag_env = [] \
    \n  [[inputs.kube_inventory]] \
    \n    url = \"https://kubernetes.default.svc\" \
    \n    namespace = \"\" \
    \n    bearer_token = \"/var/run/secrets/kubernetes.io/serviceaccount/token\" \
    \n    response_timeout = \"5s\" \
    \n    tls_ca = \"/var/run/secrets/kubernetes.io/serviceaccount/ca.crt\" \
    \n  [[inputs.kubernetes]] \
    \n    url = \"http://1.1.1.1:10255\""
  }
};

export class ClusterConfigCtrl {
  cluster: any;
  isOrgEditor: boolean;
  pageReady: boolean;
  heiliDeployed: boolean;
  showHelp: boolean;
  showDCHelp: boolean;
  datasources: [any];

  static templateUrl = 'components/clusters/partials/cluster_config.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private $q, private contextSrv, private $location, private $window) {
    var self = this;
    this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
    this.cluster = {
      type: 'heili-kubernetes-datasource'
    };
    this.pageReady = false;
    this.heiliDeployed = false;
    this.showHelp = false;
    this.showDCHelp = false;
    document.title = 'Heili Kubernetes App';

    if (this.cluster.jsonData === null) {
      this.cluster.jsonData = {};
    }
    if (!this.cluster.secureJsonData) {
      this.cluster.secureJsonData = {};
    }
    this.getDatasources().then(() => {
      self.pageReady = true;
    });
  }

  toggleHelp() {
    this.showHelp = !this.showHelp;
  }

  toggleDCHelp(dc) {
    if (this.showDCHelp == dc){
        this.showDCHelp = false;
    } else {
        this.showDCHelp = dc;
    };
  }

  getDatasources() {
    var self = this;
    var promises = [];
    if ("cluster" in self.$location.search()) {
      promises.push(self.getCluster(this.$location.search().cluster).then(() => {
        return self.getDeployments().then(ds => {
          _.forEach(ds.items, function (deployment) {
            if (deployment.metadata.name === "heili-deployment") {
              self.heiliDeployed = true;
            }
          });
        });
      }));
    }

    promises.push(self.getHeiliDatasources());

    return this.$q.all(promises);
  }

  getCluster(id) {
    var self = this;
    return this.backendSrv.get('/api/datasources/' + id)
      .then((ds) => {
        if (!(ds.jsonData.ds)) {
          ds.jsonData.ds = "";
        }
        self.cluster = ds;
      });
  }

  getHeiliDatasources() {
    var self = this;
    return this.backendSrv.get('/api/datasources')
    .then((result) => {
      self.datasources = _.filter(result, {
        "type": "elasticsearch"
      });
    });
  }

  getDeployments() {
    var self = this;
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + self.cluster.id + '/apis/apps/v1beta1/namespaces/kube-system/deployments',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  reset() {
    this.cluster.jsonData.apiKeySet = false;
    this.cluster.jsonData.accessKey = "";
    this.cluster.jsonData.secretKey = "";
  }

  save() {
    if (!this.cluster.jsonData.apiKeySet &&
        (!this.cluster.jsonData.accessKey) || (!this.cluster.jsonData.secretKey)) {
      appEvents.emit('alert-error', ['Failed', 'Access Key or Secret Key not set.']);
      return this.$q.reject("apiKeys not set.");
    }
    this.cluster.jsonData.apiKeySet = true;

    return this.saveDatasource()
      .then(() => {
        return this.getDatasources();
      })
      .then(() => {
        appEvents.emit('alert-success', ['Saved', 'Saved and successfully connected to ' + this.cluster.name]);
      })
      .catch(err => {
        appEvents.emit('alert-error', ['Saved', 'aved but failed to connect to ' + this.cluster.name + '. Error: ' + err]);
      });
  }

  saveTelegrafRbacToFile() {
    let rbacRules = "";
    telegrafRBAC.forEach(function(rule){
      rbacRules += angular.toJson(rule, true);
    });
    let blob = new Blob([rbacRules], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-telegraf-rbac.json', blob);
  }

  saveTelegrafConfigToFile() {
    let blob = new Blob([angular.toJson(telegrafConfigMap, true)], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-telegraf-configmap.json', blob);
  }

  saveTelegrafSecretToFile() {
    let modifiedtelegrafSecret = telegrafSecret;
    modifiedtelegrafSecret.data["heili.access_key"] = btoa(this.cluster.jsonData.accessKey);
    modifiedtelegrafSecret.data["heili.secret_key"] = btoa(this.cluster.jsonData.secretKey);

    let blob = new Blob([angular.toJson(modifiedtelegrafSecret, true)], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-telegraf-secret.json', blob);
  }

  saveTelegrafDSToFile() {
    let modifiedtelegrafDaemonSet = telegrafDaemonSet;
    modifiedtelegrafDaemonSet.spec.template.spec.containers[0].env.push({
      "name": "HEILI_CUSTOMER",
      "value": this.cluster.jsonData.customer
    },
    {
      "name": "HEILI_DC",
      "value": this.cluster.jsonData.dc
    },
    {
      "name": "HEILI_ENVIRONMENT",
      "value": this.cluster.jsonData.env
    });

    let blob = new Blob([angular.toJson(modifiedtelegrafDaemonSet, true)], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-telegraf-daemonset.json', blob);
  }

  saveTelegrafDeployToFile() {
    let modifiedtelegrafDeployment = telegrafDeployment;
    modifiedtelegrafDeployment.spec.template.spec.containers[0].env.push({
      "name": "HEILI_CUSTOMER",
      "value": this.cluster.jsonData.customer
    },
    {
      "name": "HEILI_DC",
      "value": this.cluster.jsonData.dc
    },
    {
      "name": "HEILI_ENVIRONMENT",
      "value": this.cluster.jsonData.env
    });

    let blob = new Blob([angular.toJson(modifiedtelegrafDeployment, true)], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-telegraf-deployment.json', blob);
  }

  saveToFile(filename, blob) {
    let blobUrl = window.URL.createObjectURL(blob);

    let element = document.createElement('a');
    element.setAttribute('href', blobUrl);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  saveDatasource() {
    if (this.cluster.id) {
      return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster);
    } else {
      return this.backendSrv.post('/api/datasources', this.cluster);
    }
  }

  cancel() {
    this.$window.history.back();
  }
}
