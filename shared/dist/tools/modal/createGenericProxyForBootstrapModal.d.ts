/// <reference types="jquery" />
/// <reference types="bootstrap" />
import { Modal } from "./types";
/**
 * Assert bootstrap modal initialized on jQuery element.
 * bootbox already call .modal().
 * For custom modal .modal() need to be called first.
 *
 *
 * NOTE: For dialog remember to invoke removeFromDom once hidden.
 */
export declare function createGenericProxyForBootstrapModal($initializedModalDiv: JQuery): Modal;
