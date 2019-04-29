import {KubernetesConfigCtrl} from './components/config/config';
import {ClustersCtrl} from './components/clusters/clusters';
import {ClusterConfigCtrl} from './components/clusters/clusterConfig';
import {ClusterInfoCtrl} from './components/clusters/clusterInfo';
import {ClusterWorkloadsCtrl} from './components/clusters/clusterWorkloads';
import {NodeInfoCtrl} from './components/clusters/nodeInfo';
import {PodInfoCtrl} from './components/clusters/podInfo';
import {StatefulSetInfoCtrl} from './components/clusters/statefulSetInfo';
import {DeploymentInfoCtrl} from './components/clusters/deploymentInfo';
import {DaemonSetInfoCtrl} from './components/clusters/daemonSetInfo';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/heili-kubernetes-app/css/dark.css',
  light: 'plugins/heili-kubernetes-app/css/light.css'
});

export {
  KubernetesConfigCtrl as ConfigCtrl,
  ClustersCtrl,
  ClusterConfigCtrl,
  ClusterInfoCtrl,
  ClusterWorkloadsCtrl,
  NodeInfoCtrl,
  PodInfoCtrl,
  StatefulSetInfoCtrl,
  DeploymentInfoCtrl,
  DaemonSetInfoCtrl
};
