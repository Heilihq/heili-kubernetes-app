///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import moment from 'moment';
import $ from 'jquery';
import _ from 'lodash';

export class DaemonSetInfoCtrl {
  pageReady: boolean;
  daemonset: any;
  cluster_id: any;
  clusterDS: any;
  datasource: any;

  static templateUrl = 'components/clusters/partials/daemonset_info.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private datasourceSrv, private $q, private $location, private alertSrv) {
    document.title = 'Heili Kubernetes App';

    this.pageReady = false;
    this.daemonset = {};
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      let daemonset_name = $location.search().workload;
      let daemonset_namespace = $location.search().namespace;

      this.loadDatasource(this.cluster_id).then(() => {
        this.clusterDS.getDaemonSet(daemonset_name, daemonset_namespace).then(daemonset => {
          this.daemonset = daemonset;
          this.updateStatus();
          this.clusterDS.getPodsByLabel(this.daemonset.metadata.namespace, this.daemonset.metadata.labels).then(pods => {
              this.daemonset.pods = pods;
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
    this.daemonset.status.conditions = new Array();
    // Check scheduled
    if (this.daemonset.status.currentNumberScheduled != this.daemonset.status.desiredNumberScheduled) {
        this.daemonset.status.conditions.push({
            "type": "Scheduled Daemons",
            "status": "False"
        })
    } else {
        this.daemonset.status.conditions.push({
            "type": "Scheduled Daemons",
            "status": "True"
        })
    }
    // Check available
    if (this.daemonset.status.numberAvailable != this.daemonset.status.desiredNumberScheduled) {
        this.daemonset.status.conditions.push({
            "type": "Available Daemons",
            "status": "False"
        })
    } else {
        this.daemonset.status.conditions.push({
            "type": "Available Daemons",
            "status": "True"
        })
    }
    // Check ready
    if (this.daemonset.status.numberReady != this.daemonset.status.desiredNumberScheduled) {
        this.daemonset.status.conditions.push({
            "type": "Ready Daemons",
            "status": "False"
        })
    } else {
        this.daemonset.status.conditions.push({
            "type": "Ready Daemons",
            "status": "True"
        })
    }
    // Check updated
    if (this.daemonset.status.updatedNumberScheduled != this.daemonset.status.desiredNumberScheduled) {
        this.daemonset.status.conditions.push({
            "type": "Updated Daemons",
            "status": "False"
        })
    } else {
        this.daemonset.status.conditions.push({
            "type": "Updated Daemons",
            "status": "True"
        })
    }
    // Check misscheduled
    if (this.daemonset.status.numberMisscheduled > 0) {
        this.daemonset.status.conditions.push({
            "type": "Misscheduled Daemons",
            "status": "False"
        })
    } else {
        this.daemonset.status.conditions.push({
            "type": "Misscheduled Daemons",
            "status": "True"
        })
    }
    // Check generation
    if (this.daemonset.status.observedGeneration !=  this.daemonset.metadata.generation) {
        this.daemonset.status.conditions.push({
            "type": "Generation Version",
            "status": "False"
        })
    } else {
        this.daemonset.status.conditions.push({
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
