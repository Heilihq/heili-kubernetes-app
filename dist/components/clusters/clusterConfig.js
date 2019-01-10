///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash', 'angular'], function(exports_1) {
    var lodash_1, angular_1;
    var telegrafImage, kubestateImage, kubestateDeployment, telegrafDaemonSet, telegrafConfigMap, ClusterConfigCtrl;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (angular_1_1) {
                angular_1 = angular_1_1;
            }],
        execute: function() {
            telegrafImage = 'docker.io/telegraf:1.9';
            kubestateImage = 'quay.io/coreos/kube-state-metrics:v1.1.0';
            kubestateDeployment = {
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
                                }]
                        }
                    }
                }
            };
            telegrafDaemonSet = {
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
            telegrafConfigMap = {
                "apiVersion": "v1",
                "kind": "ConfigMap",
                "metadata": {
                    "name": "heili-telegraf"
                },
                "data": {
                    "telegraf.conf": "|\n      [global_tags]\n        customer = \"$HEILI_CUSTOMER\"\n        dc = \"$HEILI_DC\"\n        environment = \"$HEILI_ENVIRONMENT\"\n      [agent]\n        interval = \"1m\"\n        round_interval = false\n        metric_batch_size = 5000\n        metric_buffer_limit = 10000\n        collection_jitter = \"5s\"\n        flush_interval = \"40s\"\n        flush_jitter = \"20s\"\n        precision = \"\"\n        debug = false\n        quiet = true\n        logfile = \"\"\n        hostname = \"$HOSTNAME\"\n        omit_hostname = false\n      [[outputs.amqp]]\n        url = \"amqp://$HEILI_ACCESS_KEY:$HEILI_SECRET_KEY@shipper.heilihq.com:5672/$HEILI_CUSTOMER\"\n        exchange = \"telegraf\"\n        auth_method = \"PLAIN\"\n        routing_tag = \"customer\"\n        timeout = \"10s\"\n        data_format = \"json\"\n      [[inputs.cpu]]\n        percpu = false\n        totalcpu = true\n        collect_cpu_time = false\n        report_active = false\n      [[inputs.system]]\n        fieldpass = [\"load1\", \"load5\", \"load15\", \"n_cpus\"]\n      [[inputs.mem]]\n      [[inputs.disk]]\n      [inputs.disk.tagdrop]\n        fstype = [\"tmpfs\", \"sysfs\", \"proc\", \"devtmpfs\", \"devfs\", \"mtmfs\", \"ramfs\", \"rootfs\"]\n      [[inputs.diskio]]\n        devices = [\"sda\", \"sdb\"]\n      [[inputs.processes]]\n      [[inputs.net]]\n        interfaces = [\"eth*\"]\n        ignore_protocol_stats = true\n      [[inputs.docker]]\n        endpoint = \"unix:///var/run/docker.sock\"\n        container_names = []\n        container_name_include = []\n        container_name_exclude = []\n        timeout = \"5s\"\n        perdevice = true\n        total = true\n        docker_label_include = []\n        docker_label_exclude = []\n        tag_env = []\n      [[inputs.prometheus]]\n        kubernetes_services = [\"http://kube-state-metrics.kube-system:8080/metrics\"]\n        bearer_token = \"/var/run/secrets/kubernetes.io/serviceaccount/token\"\n        insecure_skip_verify = true\n        response_timeout = \"30s\"\n      [[inputs.kubernetes]]\n        url = \"http://1.1.1.1:10255\""
                }
            };
            ClusterConfigCtrl = (function () {
                /** @ngInject */
                function ClusterConfigCtrl($scope, $injector, backendSrv, $q, contextSrv, $location, $window, alertSrv) {
                    this.backendSrv = backendSrv;
                    this.$q = $q;
                    this.contextSrv = contextSrv;
                    this.$location = $location;
                    this.$window = $window;
                    this.alertSrv = alertSrv;
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
                    this.getDatasources().then(function () {
                        self.pageReady = true;
                    });
                }
                ClusterConfigCtrl.prototype.toggleHelp = function () {
                    this.showHelp = !this.showHelp;
                };
                ClusterConfigCtrl.prototype.getDatasources = function () {
                    var self = this;
                    var promises = [];
                    if ("cluster" in self.$location.search()) {
                        promises.push(self.getCluster(this.$location.search().cluster).then(function () {
                            return self.getDeployments().then(function (ds) {
                                lodash_1.default.forEach(ds.items, function (deployment) {
                                    if (deployment.metadata.name === "heili-deployment") {
                                        self.heiliDeployed = true;
                                    }
                                });
                            });
                        }));
                    }
                    promises.push(self.getHeiliDatasources());
                    return this.$q.all(promises);
                };
                ClusterConfigCtrl.prototype.getCluster = function (id) {
                    var self = this;
                    return this.backendSrv.get('/api/datasources/' + id)
                        .then(function (ds) {
                        if (!(ds.jsonData.ds)) {
                            ds.jsonData.ds = "";
                        }
                        self.cluster = ds;
                    });
                };
                ClusterConfigCtrl.prototype.getHeiliDatasources = function () {
                    var self = this;
                    return this.backendSrv.get('/api/datasources')
                        .then(function (result) {
                        self.datasources = lodash_1.default.filter(result, {
                            "type": "elasticsearch"
                        });
                    });
                };
                ClusterConfigCtrl.prototype.getDeployments = function () {
                    var self = this;
                    return this.backendSrv.request({
                        url: 'api/datasources/proxy/' + self.cluster.id + '/apis/apps/v1beta1/namespaces/kube-system/deployments',
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                };
                ClusterConfigCtrl.prototype.reset = function () {
                    this.cluster.jsonData.apiKeySet = false;
                    this.cluster.jsonData.accessKey = "";
                    this.cluster.jsonData.secretKey = "";
                };
                ClusterConfigCtrl.prototype.save = function () {
                    var _this = this;
                    if (!this.cluster.jsonData.apiKeySet &&
                        (!this.cluster.jsonData.accessKey) || (!this.cluster.jsonData.secretKey)) {
                        this.alertSrv.set("Failed", "Access Key or Secret Key not set.", 'error', 5000);
                        return this.$q.reject("apiKeys not set.");
                    }
                    this.cluster.jsonData.apiKeySet = true;
                    return this.saveDatasource()
                        .then(function () {
                        return _this.getDatasources();
                    })
                        .then(function () {
                        _this.alertSrv.set("Saved", "Saved and successfully connected to " + _this.cluster.name, 'success', 3000);
                    })
                        .catch(function (err) {
                        _this.alertSrv.set("Saved", "Saved but failed to connect to " + _this.cluster.name + '. Error: ' + err, 'error', 5000);
                    });
                };
                ClusterConfigCtrl.prototype.saveTelegrafConfigToFile = function () {
                    var blob = new Blob([angular_1.default.toJson(telegrafConfigMap, true)], {
                        type: "application/yaml"
                    });
                    this.saveToFile('heilik8s-telegraf-cm.yml', blob);
                };
                ClusterConfigCtrl.prototype.saveTelegrafDSToFile = function () {
                    var modifiedtelegrafDaemonSet = telegrafDaemonSet;
                    console.log(this.cluster);
                    modifiedtelegrafDaemonSet.spec.template.spec.containers[0].env.push({
                        "name": "HEILI_CUSTOMER",
                        "value": this.cluster.jsonData.customer
                    }, {
                        "name": "HEILI_DC",
                        "value": this.cluster.jsonData.dc
                    }, {
                        "name": "HEILI_ENVIRONMENT",
                        "value": this.cluster.jsonData.env
                    }, {
                        "name": "HEILI_ACCESS_KEY",
                        "value": this.cluster.jsonData.accessKey
                    }, {
                        "name": "HEILI_SECRET_KEY",
                        "value": this.cluster.jsonData.secretKey
                    });
                    var blob = new Blob([angular_1.default.toJson(modifiedtelegrafDaemonSet, true)], {
                        type: "application/json"
                    });
                    this.saveToFile('heilik8s-telegraf-ds.json', blob);
                };
                ClusterConfigCtrl.prototype.saveKubeStateDeployToFile = function () {
                    var blob = new Blob([angular_1.default.toJson(kubestateDeployment, true)], {
                        type: "application/json"
                    });
                    this.saveToFile('heilik8s-kubestate-deploy.json', blob);
                };
                ClusterConfigCtrl.prototype.saveToFile = function (filename, blob) {
                    var blobUrl = window.URL.createObjectURL(blob);
                    var element = document.createElement('a');
                    element.setAttribute('href', blobUrl);
                    element.setAttribute('download', filename);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                };
                ClusterConfigCtrl.prototype.saveDatasource = function () {
                    if (this.cluster.id) {
                        console.log('bla');
                        console.log(this.cluster);
                        return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster);
                    }
                    else {
                        console.log(this.cluster);
                        return this.backendSrv.post('/api/datasources', this.cluster);
                    }
                };
                ClusterConfigCtrl.prototype.cancel = function () {
                    this.$window.history.back();
                };
                ClusterConfigCtrl.templateUrl = 'components/clusters/partials/cluster_config.html';
                return ClusterConfigCtrl;
            })();
            exports_1("ClusterConfigCtrl", ClusterConfigCtrl);
        }
    }
});
//# sourceMappingURL=clusterConfig.js.map