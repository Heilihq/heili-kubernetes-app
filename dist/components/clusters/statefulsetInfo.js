///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['moment', 'jquery', 'lodash'], function(exports_1) {
    var moment_1, jquery_1, lodash_1;
    var StatefulSetInfoCtrl;
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
            StatefulSetInfoCtrl = (function () {
                /** @ngInject */
                function StatefulSetInfoCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
                    var _this = this;
                    this.backendSrv = backendSrv;
                    this.datasourceSrv = datasourceSrv;
                    this.$q = $q;
                    this.$location = $location;
                    this.alertSrv = alertSrv;
                    document.title = 'Heili Kubernetes App';
                    this.pageReady = false;
                    this.statefulSet = {};
                    if (!("cluster" in $location.search())) {
                        alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
                        return;
                    }
                    else {
                        this.cluster_id = $location.search().cluster;
                        var statefulSet_name = $location.search().workload;
                        var statefulSet_namespace = $location.search().namespace;
                        this.loadDatasource(this.cluster_id).then(function () {
                            _this.clusterDS.getStatefulSet(statefulSet_name, statefulSet_namespace).then(function (statefulSet) {
                                _this.statefulSet = statefulSet;
                                _this.updateStatus();
                                _this.clusterDS.getPodsByLabel(_this.statefulSet.metadata.namespace, _this.statefulSet.metadata.labels).then(function (pods) {
                                    _this.statefulSet.pods = pods;
                                });
                                _this.pageReady = true;
                            });
                        });
                    }
                }
                StatefulSetInfoCtrl.prototype.loadDatasource = function (id) {
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
                StatefulSetInfoCtrl.prototype.updateStatus = function () {
                    this.statefulSet.status.conditions = new Array();
                    // Check collision
                    if (this.statefulSet.status.collisionCount > 0) {
                        this.statefulSet.status.conditions.push({
                            "type": "Replica Collisions",
                            "status": "False"
                        });
                    }
                    else {
                        this.statefulSet.status.conditions.push({
                            "type": "Replica Collisions",
                            "status": "True"
                        });
                    }
                    // Check ready replicas
                    if (this.statefulSet.status.readyReplicas != this.statefulSet.status.replicas) {
                        this.statefulSet.status.conditions.push({
                            "type": "Ready Replicas",
                            "status": "False"
                        });
                    }
                    else {
                        this.statefulSet.status.conditions.push({
                            "type": "Ready Replicas",
                            "status": "True"
                        });
                    }
                    // Check updated replicas
                    if (this.statefulSet.status.updatedReplicas != this.statefulSet.status.replicas) {
                        this.statefulSet.status.conditions.push({
                            "type": "Updated Replicas",
                            "status": "False"
                        });
                    }
                    else {
                        this.statefulSet.status.conditions.push({
                            "type": "Updated Replicas",
                            "status": "True"
                        });
                    }
                    // Check generation
                    if (this.statefulSet.status.observedGeneration != this.statefulSet.metadata.generation) {
                        this.statefulSet.status.conditions.push({
                            "type": "Generation Version",
                            "status": "False"
                        });
                    }
                    else {
                        this.statefulSet.status.conditions.push({
                            "type": "Generation Version",
                            "status": "True"
                        });
                    }
                };
                StatefulSetInfoCtrl.prototype.conditionStatus = function (condition) {
                    var status;
                    status = condition.status === "True";
                    return {
                        value: status,
                        text: status ? "Ok" : "Error"
                    };
                };
                StatefulSetInfoCtrl.prototype.goToWorkloadInfo = function (workloadType, workload, evt) {
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
                StatefulSetInfoCtrl.prototype.goToStatefulSetDashboard = function (statefulSet) {
                    this.$location.path("dashboard/db/k8s-statefulset")
                        .search({
                        "var-datasource": this.datasource,
                        "var-cluster": this.clusterDS.name,
                        "var-namespace": statefulSet.metadata.namespace,
                        "var-statefulset": statefulSet.metadata.name
                    });
                };
                StatefulSetInfoCtrl.prototype.goToPodDashboard = function (pod) {
                    this.$location.path("dashboard/db/k8s-container")
                        .search({
                        "var-datasource": this.datasource,
                        "var-cluster": this.clusterDS.name,
                        "var-node": pod.spec.nodeName,
                        "var-namespace": pod.metadata.namespace,
                        "var-pod": pod.metadata.name
                    });
                };
                StatefulSetInfoCtrl.prototype.isConditionOk = function (condition) {
                    return this.conditionStatus(condition).value;
                };
                StatefulSetInfoCtrl.prototype.formatTime = function (time) {
                    return moment_1.default(time).format('YYYY-MM-DD HH:mm:ss');
                };
                StatefulSetInfoCtrl.templateUrl = 'components/clusters/partials/statefulset_info.html';
                return StatefulSetInfoCtrl;
            })();
            exports_1("StatefulSetInfoCtrl", StatefulSetInfoCtrl);
        }
    }
});
//# sourceMappingURL=statefulsetInfo.js.map