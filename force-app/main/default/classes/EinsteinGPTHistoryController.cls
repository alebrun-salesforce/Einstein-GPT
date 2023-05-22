public with sharing class EinsteinGPTHistoryController {
    @AuraEnabled(cacheable=false)
    public static void addMessageToConfig(Id configId, String usermessage, String aimessage) {
        try {
            MessageHistory__c newMessage = new MessageHistory__c(
                EinsteinGPTConfig__c = configId,
                AiMessage__c = aimessage,
                UserMessage__c = usermessage
            );
            insert newMessage;
        } catch (DmlException e) {
            throw new AuraHandledException('Error while adding the message to config: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=false)
    public static List<MessageHistory__c> loadMessagesFromConfig(Id configId) {
        try {
            List<MessageHistory__c> histories = [
                SELECT AiMessage__c, UserMessage__c
                FROM MessageHistory__c
                WHERE EinsteinGPTConfig__c = :configId
                ORDER BY CreatedDate ASC
            ];
            return histories;
        } catch (QueryException e) {
            throw new AuraHandledException('Error while loading messages from config: ' + e.getMessage());
        }
    }

 @AuraEnabled
    public static void deleteMessagesFromConfig(Id configId) {
        try {
            List<MessageHistory__c> messagesToDelete = [
                SELECT Id
                FROM MessageHistory__c
                WHERE EinsteinGPTConfig__c = :configId
            ];

            if (!messagesToDelete.isEmpty()) {
                delete messagesToDelete;
            }
        } catch (DmlException e) {
            throw new AuraHandledException('Error while deleting messages from config: ' + e.getMessage());
        }
    }
}