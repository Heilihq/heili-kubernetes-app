///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import moment from 'moment';
import $ from 'jquery';
import _ from 'lodash';

export class StatefulSetInfoCtrl {
  pageReady: boolean;
  statefulSet: any;
  cluster_id: any;
  clusterDS: any;
  datasource: any;

  static templateUrl = 'components/clusters/partials/statefulset_info.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private datasourceSrv, private $q, private $location, private alertSrv) {
    document.title = 'Heili Kubernetes App';

    this.pageReady = false;
    this.statefulSet = {};
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      let statefulSet_name = $location.search().workload;
      let statefulSet_namespace = $location.search().namespace;

      this.loadDatasource(this.cluster_id).then(() => {
        this.clusterDS.getStatefulSet(statefulSet_name, statefulSet_namespace).then(statefulSet => {
          this.statefulSet = statefulSet;
          this.updateStatus();
          this.clusterDS.getPodsByLabel(this.statefulSet.metadata.namespace, this.statefulSet.metadata.labels).then(pods => {
              this.statefulSet.pods = pods;
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

  updateStatus() {
    this.statefulSet.status.conditions = new Array();
    // Check collision
    if (this.statefulSet.status.collisionCount > 0) {
        this.statefulSet.status.conditions.push({
            "type": "Replica Collisions",
            "status": "False"
        })
    } else {
        this.statefulSet.status.conditions.push({
            "type": "Replica Collisions",
            "status": "True"
        })
    }
    // Check ready replicas
    if (this.statefulSet.status.readyReplicas !=  this.statefulSet.status.replicas) {
        this.statefulSet.status.conditions.push({
            "type": "Ready Replicas",
            "status": "False"
        })
    } else {
        this.statefulSet.status.conditions.push({
            "type": "Ready Replicas",
            "status": "True"
        })
    }
    // Check updated replicas
    if (this.statefulSet.status.updatedReplicas !=  this.statefulSet.status.replicas) {
        this.statefulSet.status.conditions.push({
            "type": "Updated Replicas",
            "status": "False"
        })
    } else {
        this.statefulSet.status.conditions.push({
            "type": "Updated Replicas",
            "status": "True"
        })
    }
    // Check generation
    if (this.statefulSet.status.observedGeneration !=  this.statefulSet.metadata.generation) {
        this.statefulSet.status.conditions.push({
            "type": "Generation Version",
            "status": "False"
        })
    } else {
        this.statefulSet.status.conditions.push({
            "type": "Generation Version",
            "status": "True"
        })
    }
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

  goToStatefulSetDashboard(statefulSet) {
    this.$location.path("dashboard/db/k8s-statefulset")
    .search({
      "var-datasource": this.datasource,
      "var-cluster": this.clusterDS.name,
      "var-namespace": statefulSet.metadata.namespace,
      "var-statefulset": statefulSet.metadata.name
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
