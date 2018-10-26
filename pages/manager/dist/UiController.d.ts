/// <reference types="jquery" />
/// <reference types="bootstrap" />
/// <reference types="icheck" />
/// <reference types="jquery.validation" />
/// <reference types="jqueryui" />
export declare class UiController {
    readonly structure: JQuery;
    private readonly uiButtonBar;
    private readonly uiShareSim;
    private readonly uiSimRows;
    private setPlaceholder;
    private addUserSim;
    private removeUserSim;
    constructor();
    private getSelectedUiSimRow;
    private initUiButtonBar;
    private initUiShareSim;
}
