public with sharing class AiAssistantMessageController {
    @AuraEnabled(cacheable=false)
    public static List<Map<String, Object>> getScenarioMessages() {
        List<Scenario__c> scenarios = [
            SELECT Name, Id, Keyword__c
            FROM Scenario__c
        ];

        List<Map<String, Object>> data = new List<Map<String, Object>>();

        for (Scenario__c scenario : scenarios) {    
            Id scenarioId = scenario.Id;
            List<ScenarioMessage__c> messages = [
                SELECT Id, UserMessage__c, AiMessage__c, FlowName__c, RedirectURL__c, Order__c, ActionAfterAiMessage__c, Email_Global_Action_Name__c, Global_Action_Body__c, Global_Action_Subject__c, Global_Action_To__c,
                    (SELECT Id, RecordTypeId, RecordType.Name, image_URL__c,
                     button_Text__c, button_Url__c, button_Flow__c, button_Style__c, 
                     tile_Title__c, tile_TitleURL__c, tile_Subtitle__c, tile_SubtitleURL__c, tile_Text__c, tile_URL__c, badge_Style__c, 
                     badge_Title__c, datatable_Table__c, loading_Text__c, loading_Wait__c, loading_TextAfter__c, Order__c, html_Content__c,
                     redirection_pageName__c, redirection_actionName__c, redirection_objectApiName__c, redirection_RecordId__c, redirection_Type__c		
                        FROM ScenarioMessageElements__r
                        ORDER BY Order__c)
                FROM ScenarioMessage__c
                WHERE Scenario__c = :scenarioId
                ORDER BY Order__c ASC
            ];

            Map<String, Object> scenarioData = new Map<String, Object>{
                'scenario' => scenario,
                'messages' => messages
            };

            data.add(scenarioData);
        }
        return data;
    }
}