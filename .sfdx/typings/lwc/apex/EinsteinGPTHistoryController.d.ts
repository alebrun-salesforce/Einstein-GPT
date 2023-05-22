declare module "@salesforce/apex/EinsteinGPTHistoryController.addMessageToConfig" {
  export default function addMessageToConfig(param: {configId: any, usermessage: any, aimessage: any}): Promise<any>;
}
declare module "@salesforce/apex/EinsteinGPTHistoryController.loadMessagesFromConfig" {
  export default function loadMessagesFromConfig(param: {configId: any}): Promise<any>;
}
declare module "@salesforce/apex/EinsteinGPTHistoryController.deleteMessagesFromConfig" {
  export default function deleteMessagesFromConfig(param: {configId: any}): Promise<any>;
}
