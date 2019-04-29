///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['moment', 'jquery', 'lodash'], function(exports_1) {
    var moment_1, jquery_1, lodash_1;
    var DaemonSetInfoCtrl;
    return {
        setters:[
            function (moment_1_1) {
                moment_1 = moment_1_1;
            },
            function (jquery_1_1) {
                jquery_1 = jquery_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            DaemonSetInfoCtrl = (function () {
                /** @ngInject */
                function DaemonSetInfoCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
                    var _this = this;
                    this.backendSrv = backendSrv;
                    this.datasourceSrv = datasourceSrv;
                    this.$q = $q;
                    this.$location = $location;
                    this.alertSrv = alertSrv;
                    document.title = 'Heili Kubernetes App';
                    this.pageReady = false;
                    this.daemonset = {};
                    if (!("cluster" in $location.search())) {
                        alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
                        return;
                    }
                    else {
                        this.cluster_id = $location.search().cluster;
                        var daemonset_name = $location.search().workload;
                        var daemonset_namespace = $location.search().namespace;
                        this.loadDatasource(this.cluster_id).then(function () {
                            _this.clusterDS.getDaemonSet(daemonset_name, daemonset_namespace).then(function (daemonset) {
                                _this.daemonset = daemonset;
                                _this.updateStatus();
                                _this.clusterDS.getPodsByLabel(_this.daemonset.metadata.namespace, _this.daemonset.metadata.labels).then(function (pods) {
                                    _this.daemonset.pods = pods;
                                });
                                _this.pageReady = true;
                            });
                        });
                    }
                }
                DaemonSetInfoCtrl.prototype.loadDatasource = function (id) {
                    var _this = this;
                    return this.backendSrv.get('api/datasources/' + id)
                        .then(function (ds) {
                        _this.datasource = ds.jsonData.ds;
                        return _this.datasourceSrv.get(ds.name);
                    }).then(function (clusterDS) {
                        _this.clusterDS = clusterDS;
                        return clusterDS;
                    });
                };
                DaemonSetInfoCtrl.prototype.updateStatus = function () {
                    this.daemonset.status.conditions = new Array();
                    // Check scheduled
                    if (this.daemonset.status.currentNumberScheduled != this.daemonset.status.desiredNumberScheduled) {
                        this.daemonset.status.conditions.push({
                            "type": "Scheduled Daemons",
                            "status": "False"
                        });
                    }
                    else {
                        this.daemonset.status.conditions.push({
                            "type": "Scheduled Daemons",
                            "status": "True"
                        });
                    }
                    // Check available
                    if (this.daemonset.status.numberAvailable != this.daemonset.status.desiredNumberScheduled) {
                        this.daemonset.status.conditions.push({
                            "type": "Available Daemons",
                            "status": "False"
                        });
                    }
                    else {
                        this.daemonset.status.conditions.push({
                            "type": "Available Daemons",
                            "status": "True"
                        });
                    }
                    // Check ready
                    if (this.daemonset.status.numberReady != this.daemonset.status.desiredNumberScheduled) {
                        this.daemonset.status.conditions.push({
                            "type": "Ready Daemons",
                            "status": "False"
                        });
                    }
                    else {
                        this.daemonset.status.conditions.push({
                            "type": "Ready Daemons",
                            "status": "True"
                        });
                    }
                    // Check updated
                    if (this.daemonset.status.updatedNumberScheduled != this.daemonset.status.desiredNumberScheduled) {
                        this.daemonset.status.conditions.push({
                            "type": "Updated Daemons",
                            "status": "False"
                        });
                    }
                    else {
                        this.daemonset.status.conditions.push({
                            "type": "Updated Daemons",
                            "status": "True"
                        });
                    }
                    // Check misscheduled
                    if (this.daemonset.status.numberMisscheduled > 0) {
                        this.daemonset.status.conditions.push({
                            "type": "Misscheduled Daemons",
                            "status": "False"
                        });
                    }
                    else {
                        this.daemonset.status.conditions.push({
                            "type": "Misscheduled Daemons",
                            "status": "True"
                        });
                    }
                    // Check generation
                    if (this.daemonset.status.observedGeneration != this.daemonset.metadata.generation) {
                        this.daemonset.status.conditions.push({
                            "type": "Generation Version",
                            "status": "False"
                        });
                    }
                    else {
                        this.daemonset.status.conditions.push({
                            "type": "Generation Version",
                            "status": "True"
                        });
                    }
                };
                DaemonSetInfoCtrl.prototype.conditionStatus = function (condition) {
                    var status;
                    status = condition.status === "True";
                    return {
                        value: status,
                        text: status ? "Ok" : "Error"
                    };
                };
                DaemonSetInfoCtrl.prototype.goToWorkloadInfo = function (workloadType, workload, evt) {
                    var clickTargetIsLinkOrHasLinkParents = jquery_1.default(evt.target).closest('a').length > 0;
                    var closestElm = lodash_1.default.head(jquery_1.default(evt.target).closest('div'));
                    var clickTargetClickAttr = lodash_1.default.find(closestElm.attributes, { name: "ng-click" });
                    var clickTargetIsNodeDashboard = clickTargetClickAttr ? clickTargetClickAttr.value === "ctrl.goToPodDashboard(pod, $event)" : false;
                    if (clickTargetIsLinkOrHasLinkParents === false &&
                        clickTargetIsNodeDashboard === false) {
                        this.$location.path("plugins/heili-kubernetes-app/page/" + workloadType + "-info")
                            .search({
                            "cluster": this.cluster_id,
                            "namespace": workload.metadata.namespace,
                            "workload": workload.metadata.name
                        });
                    }
                };
                DaemonSetInfoCtrl.prototype.goToPodDashboard = function (pod) {
                    this.$location.path("dashboard/db/k8s-container")
                        .search({
                        "var-datasource": this.datasource,
                        "var-cluster": this.clusterDS.name,
                        "var-node": pod.spec.nodeName,
                        "var-namespace": pod.metadata.namespace,
                        "var-pod": pod.metadata.name
                    });
                };
                DaemonSetInfoCtrl.prototype.isConditionOk = function (condition) {
                    return this.conditionStatus(condition).value;
                };
                DaemonSetInfoCtrl.prototype.formatTime = function (time) {
                    return moment_1.default(time).format('YYYY-MM-DD HH:mm:ss');
                };
                DaemonSetInfoCtrl.templateUrl = 'components/clusters/partials/daemonset_info.html';
                return DaemonSetInfoCtrl;
            })();
            exports_1("DaemonSetInfoCtrl", DaemonSetInfoCtrl);
        }
    }
});
//# sourceMappingURL=daemonSetInfo.js.map