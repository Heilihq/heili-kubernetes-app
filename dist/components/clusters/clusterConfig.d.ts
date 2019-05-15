/// <reference path="../../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export declare class ClusterConfigCtrl {
    private backendSrv;
    private $q;
    private contextSrv;
    private $location;
    private $window;
    cluster: any;
    isOrgEditor: boolean;
    pageReady: boolean;
    heiliDeployed: boolean;
    showHelp: boolean;
    showDCHelp: boolean;
    datasources: [any];
    static templateUrl: string;
    /** @ngInject */
    constructor($scope: any, $injector: any, backendSrv: any, $q: any, contextSrv: any, $location: any, $window: any);
    toggleHelp(): void;
    toggleDCHelp(dc: any): void;
    getDatasources(): any;
    getCluster(id: any): any;
    getHeiliDatasources(): any;
    getDeployments(): any;
    reset(): void;
    save(): any;
    saveTelegrafConfigToFile(): void;
    saveTelegrafSecretToFile(): void;
    saveTelegrafDSToFile(): void;
    saveTelegrafDeployToFile(): void;
    saveToFile(filename: any, blob: any): void;
    saveDatasource(): any;
    cancel(): void;
}
