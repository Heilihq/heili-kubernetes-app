///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['moment', 'jquery', 'lodash'], function(exports_1) {
    var moment_1, jquery_1, lodash_1;
    var DeploymentInfoCtrl;
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
            DeploymentInfoCtrl = (function () {
                /** @ngInject */
                function DeploymentInfoCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
                    var _this = this;
                    this.backendSrv = backendSrv;
                    this.datasourceSrv = datasourceSrv;
                    this.$q = $q;
                    this.$location = $location;
                    this.alertSrv = alertSrv;
                    document.title = 'Heili Kubernetes App';
                    this.pageReady = false;
                    this.deployment = {};
                    if (!("cluster" in $location.search())) {
                        alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
                        return;
                    }
                    else {
                        this.cluster_id = $location.search().cluster;
                        var deployment_name = $location.search().workload;
                        var deployment_namespace = $location.search().namespace;
                        this.loadDatasource(this.cluster_id).then(function () {
                            _this.clusterDS.getDeployment(deployment_name, deployment_namespace).then(function (deployment) {
                                _this.deployment = deployment;
                                _this.clusterDS.getPodsByLabel(_this.deployment.metadata.namespace, _this.deployment.metadata.labels).then(function (pods) {
                                    _this.deployment.pods = pods;
                                });
                                _this.pageReady = true;
                            });
                        });
                    }
                }
                DeploymentInfoCtrl.prototype.loadDatasource = function (id) {
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
                DeploymentInfoCtrl.prototype.conditionStatus = function (condition) {
                    var status;
                    status = condition.status === "True";
                    return {
                        value: status,
                        text: status ? "Ok" : "Error"
                    };
                };
                DeploymentInfoCtrl.prototype.goToWorkloadInfo = function (workloadType, workload, evt) {
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
                DeploymentInfoCtrl.prototype.goToDeploymentDashboard = function (deployment) {
                    this.$location.path("dashboard/db/k8s-deployment")
                        .search({
                        "var-datasource": this.datasource,
                        "var-cluster": this.clusterDS.name,
                        "var-namespace": deployment.metadata.namespace,
                        "var-deployment": deployment.metadata.name
                    });
                };
                DeploymentInfoCtrl.prototype.goToPodDashboard = function (pod) {
                    this.$location.path("dashboard/db/k8s-container")
                        .search({
                        "var-datasource": this.datasource,
                        "var-cluster": this.clusterDS.name,
                        "var-node": pod.spec.nodeName,
                        "var-namespace": pod.metadata.namespace,
                        "var-pod": pod.metadata.name
                    });
                };
                DeploymentInfoCtrl.prototype.isConditionOk = function (condition) {
                    return this.conditionStatus(condition).value;
                };
                DeploymentInfoCtrl.prototype.formatTime = function (time) {
                    return moment_1.default(time).format('YYYY-MM-DD HH:mm:ss');
                };
                DeploymentInfoCtrl.templateUrl = 'components/clusters/partials/deployment_info.html';
                return DeploymentInfoCtrl;
            })();
            exports_1("DeploymentInfoCtrl", DeploymentInfoCtrl);
        }
    }
});
//# sourceMappingURL=deploymentInfo.js.map