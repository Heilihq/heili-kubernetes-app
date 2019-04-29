///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import moment from 'moment';
import $ from 'jquery';
import _ from 'lodash';

export class DeploymentInfoCtrl {
  pageReady: boolean;
  deployment: any;
  cluster_id: any;
  clusterDS: any;
  datasource: any;

  static templateUrl = 'components/clusters/partials/deployment_info.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private datasourceSrv, private $q, private $location, private alertSrv) {
    document.title = 'Heili Kubernetes App';

    this.pageReady = false;
    this.deployment = {};
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      let deployment_name = $location.search().workload;
      let deployment_namespace = $location.search().namespace;

      this.loadDatasource(this.cluster_id).then(() => {
        this.clusterDS.getDeployment(deployment_name, deployment_namespace).then(deployment => {
          this.deployment = deployment;
          this.clusterDS.getPodsByLabel(this.deployment.metadata.namespace, this.deployment.metadata.labels).then(pods => {
              this.deployment.pods = pods;
          });
          this.pageReady = true;
        });
      });
    }
  }

  loadDatasource(id) {
    return this.backendSrv.get('api/datasources/' + id)
      .then(ds => {
        this.datasource = ds.jsonData.ds;
        return this.datasourceSrv.get(ds.name);
      }).then(clusterDS => {
        this.clusterDS = clusterDS;
        return clusterDS;
      });
  }

  conditionStatus(condition) {
    var status;
    status = condition.status === "True";

    return {
      value: status,
      text: status ? "Ok" : "Error"
    };
  }

  goToWorkloadInfo(workloadType, workload, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;

    var closestElm = _.head($(evt.target).closest('div'));
    var clickTargetClickAttr = _.find(closestElm.attributes, {name: "ng-click"});
    var clickTargetIsNodeDashboard = clickTargetClickAttr ? clickTargetClickAttr.value === "ctrl.goToPodDashboard(pod, $event)" : false;
    if (clickTargetIsLinkOrHasLinkParents === false &&
        clickTargetIsNodeDashboard === false) {
      this.$location.path("plugins/heili-kubernetes-app/page/"+workloadType+"-info")
      .search({
        "cluster": this.cluster_id,
        "namespace": workload.metadata.namespace,
        "workload": workload.metadata.name
      });
    }
  }

  goToDeploymentDashboard(deployment) {
    this.$location.path("dashboard/db/k8s-deployment")
    .search({
      "var-datasource": this.datasource,
      "var-cluster": this.clusterDS.name,
      "var-namespace": deployment.metadata.namespace,
      "var-deployment": deployment.metadata.name
    });
  }
  goToPodDashboard(pod) {
    this.$location.path("dashboard/db/k8s-container")
    .search({
      "var-datasource": this.datasource,
      "var-cluster": this.clusterDS.name,
      "var-node": pod.spec.nodeName,
      "var-namespace": pod.metadata.namespace,
      "var-pod": pod.metadata.name
    });
  }

  isConditionOk(condition) {
    return this.conditionStatus(condition).value;
  }

  formatTime(time) {
    return moment(time).format('YYYY-MM-DD HH:mm:ss');
  }
}
