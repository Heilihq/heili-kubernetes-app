///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import appEvents from 'app/core/app_events';
import angular from 'angular';

const telegrafImage = 'telegraf:1.9';
const kubestateImage = 'quay.io/coreos/kube-state-metrics:v1.1.0';

let kubestateDeployment = {
  "apiVersion": "apps/v1beta1",
  "kind": "Deployment",
  "metadata": {
    "name": "kube-state-metrics",
    "namespace": "kube-system"
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "k8s-app": "kube-state-metrics",
        "heilik8sapp": "true"
      }
    },
    "replicas": 1,
    "template": {
      "metadata": {
        "labels": {
          "k8s-app": "kube-state-metrics",
          "heilik8sapp": "true"
        }
      },
      "spec": {
        "containers": [{
          "name": "kube-state-metrics",
          "image": kubestateImage,
          "ports": [{
            "name": "http-metrics",
            "containerPort": 8080
          }],
          "readinessProbe": {
            "httpGet": {
              "path": "/healthz",
              "port": 8080
            },
            "initialDelaySeconds": 5,
            "timeoutSeconds": 5
          }
        },
        {
          "name": "telegraf",
          "image": telegrafImage,
          "args": [
            "--input-filter",
            "prometheus",
            "--output-filter",
            "amqp"
          ],
          "resources": {
            "limits": {
              "memory": "100Mi"
            },
            "requests": {
              "cpu": "500m",
              "memory": "50Mi"
            }
          },
          "env": [
            {
              "name": "HOSTNAME",
              "valueFrom": {
                "fieldRef": {
                  "fieldPath": "spec.nodeName"
                }
              }
            },
            {
              "name": "HEILI_CUSTOMER",
              "value": "raycatchltd"
            },
            {
              "name": "HEILI_DC",
              "value": "gcp"
            },
            {
              "name": "HEILI_ENVIRONMENT",
              "value": "production"
            },
            {
              "name": "HEILI_ACCESS_KEY",
              "value": "SEU3RkNGNjlENkRBODI="
            },
            {
              "name": "HEILI_SECRET_KEY",
              "value": "YzUzN2RkMjBiMTg5ZDkxZmQ2ZTJkYjU4YzBmNWMyNGU2NDUwODk4YzU1Njk0MTdj"
            }
          ]
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
    "namespace": "kube-system"
  },
  "spec": {
    "selector": {
      "matchLabels": {
        "daemon": "telegraf",
        "grafanak8sapp": "true"
      }
    },
    "template": {
      "metadata": {
        "name": "telegraf",
        "labels": {
          "daemon": "telegraf",
          "grafanak8sapp": "true"
        }
      },
      "spec": {
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
              "memory": "500Mi"
            },
            "requests": {
              "cpu": "500m",
              "memory": "500Mi"
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
              "name": "docker",
              "readOnly": true,
              "mountPath": "/var/run/docker.sock"
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

const telegrafConfigMap = {
  "apiVersion": "v1",
  "kind": "ConfigMap",
  "metadata": {
    "name": "heili-telegraf"
  },
  "data": {
    "telegraf.conf": `|
      [global_tags]
        customer = "$HEILI_CUSTOMER"
        dc = "$HEILI_DC"
        environment = "$HEILI_ENVIRONMENT"
      [agent]
        interval = "1m"
        round_interval = false
        metric_batch_size = 5000
        metric_buffer_limit = 10000
        collection_jitter = "5s"
        flush_interval = "40s"
        flush_jitter = "20s"
        precision = ""
        debug = false
        quiet = true
        logfile = ""
        hostname = "$HOSTNAME"
        omit_hostname = false
      [[outputs.amqp]]
        url = "amqp://$HEILI_ACCESS_KEY:$HEILI_SECRET_KEY@shipper.heilihq.com:5672/$HEILI_CUSTOMER"
        exchange = "telegraf"
        auth_method = "PLAIN"
        routing_tag = "customer"
        timeout = "10s"
        data_format = "json"
      [[inputs.cpu]]
        percpu = false
        totalcpu = true
        collect_cpu_time = false
        report_active = false
      [[inputs.system]]
        fieldpass = ["load1", "load5", "load15", "n_cpus"]
      [[inputs.mem]]
      [[inputs.disk]]
      [inputs.disk.tagdrop]
        fstype = ["tmpfs", "sysfs", "proc", "devtmpfs", "devfs", "mtmfs", "ramfs", "rootfs"]
      [[inputs.diskio]]
        devices = ["sda", "sdb"]
      [[inputs.processes]]
      [[inputs.net]]
        interfaces = ["eth*"]
        ignore_protocol_stats = true
      [[inputs.docker]]
        endpoint = "unix:///var/run/docker.sock"
        container_names = []
        container_name_include = []
        container_name_exclude = []
        timeout = "5s"
        perdevice = true
        total = true
        docker_label_include = []
        docker_label_exclude = ["statefulset.*"]
        tag_env = []
      [[inputs.prometheus]]
        kubernetes_services = ["http://kube-state-metrics.kube-system:8080/metrics"]
        bearer_token = "/var/run/secrets/kubernetes.io/serviceaccount/token"
        insecure_skip_verify = true
        response_timeout = "30s"
        namepass = ["kube_deployment_status_replicas", "kube_deployment_status_replicas_available", "kube_deployment_status_replicas_updated", "kube_deployment_status_replicas_unavailable", "kube_deployment_status_observed_generation", "kube_job_status_active", "kube_cronjob_status_active", "kube_job_status_failed", "kube_job_status_succeeded", "kube_statefulset_status_replicas", "kube_statefulset_status_replicas_current", "kube_statefulset_status_replicas_updated", "kube_statefulset_status_observed_generation"]
      [[inputs.kubernetes]]
        url = "http://1.1.1.1:10255"`
  }
};

export class ClusterConfigCtrl {
  cluster: any;
  isOrgEditor: boolean;
  pageReady: boolean;
  heiliDeployed: boolean;
  showHelp: boolean;
  datasources: [any];

  static templateUrl = 'components/clusters/partials/cluster_config.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private $q, private contextSrv, private $location, private $window, private alertSrv) {
    var self = this;
    this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
    this.cluster = {
      type: 'heili-kubernetes-datasource'
    };
    this.pageReady = false;
    this.heiliDeployed = false;
    this.showHelp = false;
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
      this.alertSrv.set("Failed", "Access Key or Secret Key not set.", 'error', 5000);
      return this.$q.reject("apiKeys not set.");
    }
    this.cluster.jsonData.apiKeySet = true;

    return this.saveDatasource()
      .then(() => {
        return this.getDatasources();
      })
      .then(() => {
        this.alertSrv.set("Saved", "Saved and successfully connected to " + this.cluster.name, 'success', 3000);
      })
      .catch(err => {
        this.alertSrv.set("Saved", "Saved but failed to connect to " + this.cluster.name + '. Error: ' + err, 'error', 5000);
      });
  }

  saveTelegrafConfigToFile() {
    let blob = new Blob([angular.toJson(telegrafConfigMap, true)], {
      type: "application/yaml"
    });
    this.saveToFile('heilik8s-telegraf-cm.yml', blob);
  }

  saveTelegrafDSToFile() {
    let modifiedtelegrafDaemonSet = telegrafDaemonSet;
    console.log(this.cluster);
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
    },
    {
      "name": "HEILI_ACCESS_KEY",
      "value": this.cluster.jsonData.accessKey
    },
    {
      "name": "HEILI_SECRET_KEY",
      "value": this.cluster.jsonData.secretKey
    });

    let blob = new Blob([angular.toJson(modifiedtelegrafDaemonSet, true)], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-telegraf-ds.json', blob);
  }

  saveKubeStateDeployToFile() {
    let blob = new Blob([angular.toJson(kubestateDeployment, true)], {
      type: "application/json"
    });
    this.saveToFile('heilik8s-kubestate-deploy.json', blob);
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
      console.log('bla');
      console.log(this.cluster);
      return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster);
    } else {
      console.log(this.cluster);
      return this.backendSrv.post('/api/datasources', this.cluster);
    }
  }

  cancel() {
    this.$window.history.back();
  }
}
