///<reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import {PodNavCtrl} from './podNav';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/heili-kubernetes-app/css/dark.css',
  light: 'plugins/heili-kubernetes-app/css/light.css'
});

export  {
  PodNavCtrl as PanelCtrl
};
