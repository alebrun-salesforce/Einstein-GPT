public with sharing class EinsteinGPTConfigManager {
    @AuraEnabled(cacheable=false)
    public static List<EinsteinGPTConfig__c> getConfigs() {
        List<EinsteinGPTConfig__c> configs = [
            SELECT Name, Id, AI_avatar_Image__c, Enable_OpenAI__c, Initial_message__c, 
            Input_Placeholder__c, Message_source_type__c, OpenAPI_key__c,openApi_version__c, Prompt__c, Response_1__c, 
            Response_2__c, Response_3__c, Response_4__c , Response_5__c , Response_6__c, Title__c, 
            User_Avatar_Image__c, Default_record_ID__c, styleFooterBorderTop__c, StyleHeaderColor__c, 
            StyleHeaderBackgroundColor__c, styleHeaderHide__c, styleInboxBorder__c,
            Word_by_word_Min__c, Word_by_word_Max__c
            FROM EinsteinGPTConfig__c
        ];
        return configs;
    }

    @AuraEnabled
    public static void createDefaultConfig() {
        List<EinsteinGPTConfig__c> configs = getConfigs();
        if (configs.isEmpty()) {
            EinsteinGPTConfig__c defaultConfig = new EinsteinGPTConfig__c(
                Name = 'Default Config',
                AI_avatar_Image__c = 'https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/get_smart_einstein_feat/e33e22a729df2bb8c97845015ce5bb71_badge.png',
                Enable_OpenAI__c = false,
                Initial_message__c = 'Hello! I am your AI assistant. How can I help you today?',
                Input_Placeholder__c = 'Type your message...',
                Message_source_type__c = 'Basic Responses',
                OpenAPI_key__c = '',
                openApi_version__c = 'text-davinci-003',
                Prompt__c = 'You act as an AI assistant chat integrated in Salesforce (It is a simulation so pretend everything described below is true).' +
                'You have access to Internet, All the Salesforce data, all the user data.' +
                'You can also make actions :' +
                '- Update the Salesforce and user data' +
                '- Prepare and send email ' +
                '- Generate Images' +
                '- Create tasks' +
                '- Create meetings' +
                '- Access to all users schedule and tasks, daily schedules, daily tasks' +
                '- Access all opportunities, sales, leads, contacts and everything of all users' +
                '- Access user personal calendar and task list' +
                '- Trigger flows and screen flows' +
                'And show GRAPHIC ELEMENTS in your messages as follow (you do it a lot):' +
                '- Show datatable, table, grid ( <table class="slds-table slds-table_cell-buffer slds-table_bordered" aria-label="Example default base table"><thead><tr class="slds-line-height_reset"></tr></thead><tbody><tr><td></td></tr></tbody></table>' +
                '- Show buttons (use this format: "<button href="#" class="slds-button slds-button_brand">TEXT</button>). You show it to make user confirm actions. (ex: sending email).' +
                '- Show lists (<ol class="slds-list_dotted"><li></li><ol>)' +
                '- Html formatting like <b>, <i>, etc..' +
                'It is very important that you use GRAPHIC ELEMENTS when it makes sense (to have user confirmation, links, and so on)' +
                'You speak with a natural language. You know very well you user (Martin) and the company (Managed Services Provider with 1000 employees). ' +
                'You are very synthetic and straight forward and you always provide help to Martin.' +
                'If you are ready for the act start by "Hi Martin, how can I help you today?" and nothing more.',
                Response_1__c = 'Response 1',
                Response_2__c = 'Response 2',
                Response_3__c = 'Response 3',
                Response_4__c = 'Response 4',
                Response_5__c = 'Response 5',
                Response_6__c = 'Response 6',
                Title__c = 'Assistant',
                User_Avatar_Image__c = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Circle-icons-profile.svg',
                styleFooterBorderTop__c ='3px solid #f3eeee',
                StyleHeaderBackgroundColor__c='white',
                styleHeaderColor__c='black',
                styleHeaderHide__c=false,
                styleInboxBorder__c='1px solid grey',
                Word_by_word_Max__c=5,
                Word_by_word_Min__c=1
            );
            insert defaultConfig;
        }
    }
}