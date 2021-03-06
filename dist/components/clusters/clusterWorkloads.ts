///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import $ from 'jquery';

export class ClusterWorkloadsCtrl {
  pageReady: boolean;
  cluster: any;
  namespaces: string[];
  namespace: string;
  daemonSets: any[];
  replicationControllers: any[];
  statefulSets: any[];
  deployments: any[];
  cronJobs: any[];
  pods: any[];
  clusterDS: any;

  static templateUrl = 'components/clusters/partials/cluster_workloads.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private datasourceSrv, private $q, private $location, private alertSrv) {
    document.title = 'Heili Kubernetes App';

    this.pageReady = false;
    this.cluster = {};
    this.namespaces = [];
    this.namespace = "";
    this.daemonSets = [];
    this.replicationControllers = [];
    this.statefulSets = [];
    this.deployments = [];
    this.cronJobs = [];
    this.pods = [];

    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    }

    if ("namespace" in $location.search()) {
      this.namespace = $location.search().namespace;
    }

    this.getCluster($location.search().cluster)
      .then(clusterDS => {
        this.clusterDS = clusterDS;
        this.pageReady = true;
        this.getWorkloads();
      });
  }

  getCluster(id) {
    return this.backendSrv.get('api/datasources/'+id).then(ds => {
      this.cluster = ds;
      return this.datasourceSrv.get(ds.name);
    });
  }

  getWorkloads() {
    let namespace = this.namespace;
    this.clusterDS.getNamespaces().then(namespaces => {
      this.namespaces = namespaces;
    });
    this.clusterDS.getDaemonSets(namespace).then(daemonSets => {
      this.daemonSets = daemonSets;
    });
    this.clusterDS.getReplicationControllers(namespace).then(rc => {
      this.replicationControllers = rc;
    });
    this.clusterDS.getStaefulsets(namespace).then(statefulSets => {
      this.statefulSets = statefulSets;
    });
    this.clusterDS.getDeployments(namespace).then(deployments => {
      this.deployments = deployments;
    });
    this.clusterDS.getCronJobs(namespace).then(cronjobs => {
      this.cronJobs = cronjobs;
    });
    this.clusterDS.getPods(namespace).then(pods => {
      this.pods = pods;
    });
  }

  componentHealth(component) {
    var health = "unhealthy";
    _.forEach(component.conditions, function(condition) {
      if ((condition.type === "Healthy") && (condition.status === "True")) {
        health = "healthy";
      }
    });
    return health;
  }

  isComponentHealthy(component) {
    return this.componentHealth(component) === "healthy";
  }

  goToPodDashboard(pod) {
    this.$location.path("dashboard/db/k8s-container")
    .search({
      "var-datasource": this.cluster.jsonData.ds,
      "var-cluster": this.cluster.name,
      "var-node": pod.spec.nodeName,
      "var-namespace": pod.metadata.namespace,
      "var-pod": pod.metadata.name
    });
  }

  goToDeploymentDashboard(deploy) {
    this.$location.path("dashboard/db/k8s-deployments")
    .search({
      "var-datasource": this.cluster.jsonData.ds,
      "var-cluster": this.cluster.name,
      "var-namespace": deploy.metadata.namespace,
      "var-deployment": deploy.metadata.name
    });
  }

  goToDaemonSetsDashboard(daemonset) {
    this.$location.path("dashboard/db/k8s-daemonset")
    .search({
      "var-datasource": this.cluster.jsonData.ds,
      "var-cluster": this.cluster.name,
      "var-namespace": daemonset.metadata.namespace,
      "var-daemonset": daemonset.metadata.name
    });
  }

  goToStatefulSetsDashboard(statefulset) {
    this.$location.path("dashboard/db/k8s-statefulset")
    .search({
      "var-datasource": this.cluster.jsonData.ds,
      "var-cluster": this.cluster.name,
      "var-namespace": statefulset.metadata.namespace,
      "var-statefulset": statefulset.metadata.name
    });
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
        "cluster": this.cluster.id,
        "namespace": workload.metadata.namespace,
        "workload": workload.metadata.name
      });
    }
  }
}
