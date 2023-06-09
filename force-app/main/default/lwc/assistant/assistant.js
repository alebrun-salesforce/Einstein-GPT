import { LightningElement, api, wire } from 'lwc';
import getScenarioMessages from '@salesforce/apex/AiAssistantMessageController.getScenarioMessages';
import getConfigs from '@salesforce/apex/EinsteinGPTConfigManager.getConfigs'
import createDefaultConfig from '@salesforce/apex/EinsteinGPTConfigManager.createDefaultConfig'
import addMessageToConfig from '@salesforce/apex/EinsteinGPTHistoryController.addMessageToConfig'
import loadMessagesFromConfig from '@salesforce/apex/EinsteinGPTHistoryController.loadMessagesFromConfig'
import deleteMessagesFromConfig from '@salesforce/apex/EinsteinGPTHistoryController.deleteMessagesFromConfig'
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { getRecord } from 'lightning/uiRecordApi';

export default class AiAssistant extends NavigationMixin(LightningElement) {
  @api isBuilder = false;
  @api configName = "Default Config";
  loadedConfiguration;
  allconfigs;
  configId = "0";


  aiAssistantMessage = 'Hello! I am your AI assistant. How can I help you today?';
  aiAvatarUrl = 'https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/get_smart_einstein_feat/e33e22a729df2bb8c97845015ce5bb71_badge.png';
  userAvatarUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Circle-icons-profile.svg';
  aiAssistantTitle = 'AI Assistant'; 
  inputPlaceholder = 'Type your message...'; 
  scenarioId = '';
  Response1 = 'Response 1';
  Response2 = 'Response 2';
  Response3 = 'Response 3';
  Response4 = 'Response 4';
  Response5 = 'Response 5';
  Response6 = 'Response 6'; 
  openAiApiKey = '';
  openAiApiVersion = '';
  BasicMessages = false;
  prompt=`You act as an AI assistant chat integrated in Salesforce (It is a simulation so pretend everything described below is true).
  You have access to Internet, All the Salesforce data, all the user data.
  You can also make actions :
  - Update the Salesforce and user data
  - Prepare and send email 
  - Generate Images
  - Create tasks
  - Create meetings
  - Access to all users schedule and tasks, daily schedules, daily tasks
  - Access all opportunities, sales, leads, contacts and everything of all users
  - Access user personal calendar and task list
  - Trigger flows and screen flows
  And show GRAPHIC ELEMENTS in your messages as follow (you do it a lot):
  - Show datatable, table, grid ( <table class="slds-table slds-table_fixed-layout slds-table_cell-buffer slds-table_bordered" aria-label="Example default base table"><thead><tr class="slds-line-height_reset"></tr></thead><tbody><tr><td></td></tr></tbody></table>
  - Show buttons (use this format: "<button href="#" class="slds-button slds-button_brand">TEXT</button>). You show it to make user confirm actions. (ex: sending email).
  - Show lists (<ol class="slds-list_dotted"><li></li><ol>)
  - Html formatting like <b>, <i>, etc..
  It is very important that you use GRAPHIC ELEMENTS when it makes sense (to have user confirmation, links, and so on)
  You speak with a natural language. You know very well you user (Martin) and the company (Managed Services Provider with 1000 employees). 
  You are very synthetic and straight forward and you always provide help to Martin.
  If you are ready for the act start by "Hi Martin, how can I help you today?" and nothing more.
  
  Assistant:
  Hello, what can I do for <b>you</b> ?
  
  Human:
  What are my priorities today ?
  
  Assistant:
  Here are your top priorities for today:
  <ol class="slds-list_dotted">
  <li>Meeting with the <i>Johnson Corporation</i> at <b>10:00</b> AM to discuss their IT infrastructure needs.</li>
  <li>Follow up with the sales team on the status of the XYZ Company opportunity.</li>
  <li>Complete and submit the Q1 financial report by <b>5:00 PM</b>.</li>
  <li>Review and provide feedback on the marketing team's new campaign proposal.</li>
  </ol>
  Let me know if you need any assistance with these tasks or if you have any other priorities to address.
  <button href="#" class="slds-button slds-button_brand">Show more</button>`;

  @api chatWidth = '30%';
  @api chatPosition = "right";
  @api chatOpen = false;
  @api aiTypingSpeed = 50;
  @api aiTypingSpeedRandomize = false;
  @api AutoMessage = false;
  @api recordId;
  @api objectApiName;
  @api UtilityBar = false;
  @api FullHeight = false;

  /** Style **/
  @api styleHeaderHide = false;
  @api styleHeaderBackgroundColor = 'grey';
  @api styleHeaderColor = 'white;';
  
  @api styleFooterBorderTop = '3px solid #f3eeee';
  @api styleInboxBorder = '1px solid #ccc';

  wordByWordMin = 1;
  wordByWordMax = 5;

  /** History */
@api saveHistory = false;
@api loadHistory= false;
@api deleteHistory= false;

  @wire(getScenarioMessages)
  AiAssistantMessages;

  @wire(getConfigs)
  einsteinGptConfigs;

  @wire(createDefaultConfig)
  createDefaultConfig;

  @wire(loadMessagesFromConfig)
  loadMessagesFromConfig;

  @wire(addMessageToConfig)
  addMessageToConfig;
  @wire(deleteMessagesFromConfig)
  deleteMessagesFromConfig;

  record;
  error;
  recordString = 'Loading record data...';
  
  @wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full'] })
  wiredRecord({ error, data }) {
    this.recordString += " Wired record function called...";
    if (data) {
      this.recordString += ' Data found';
      this.record = data;
      this.error = undefined;
  
      let output = '';
      for (let field in data.fields) {
        // Skip fields that have "Id" in the name
        if (field.includes('Id')) {
          continue;
        }
  
        let value = data.fields[field].value;
  
        // If the value is an object, convert it to a string.
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
  
        output += `${field}: ${value}\n`;
      }
      this.recordString = output;  // Update the property directly
    } else if (error) {
      this.error = error;
      this.record = undefined;
      console.error('Error loading record: ', JSON.stringify(error));
      this.recordString = `Error: ${error}`;  // Update the property directly
    } else {
      this.recordString += ' No data or error...';
      //console.error('Unexpected state: No data or error received');
    }
  }
  


  async generateCompletion(prompt, maxTokens) {
    const endpoint = 'https://api.openai.com/v1/completions';
    const requestBody = {
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openAiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    };
  
    try {
      const response = await fetch(endpoint, requestOptions);
      const jsonResponse = await response.json();
      const completionText = jsonResponse.choices[0].text;
      return completionText;
    } catch (error) {
      console.error('Error calling generateCompletion:', error);
      return null;
    }

  }

  
  history = "";
  responseCounter = 0;

  openGlobalAction(actionName, subject, body, to) {
    var pageRef = {
      type: "standard__quickAction",
      attributes: {
          apiName: "Global." + actionName
      },
      state: {
          recordId: this.recordId,
          defaultFieldValues:
          encodeDefaultFieldValues({
              HtmlBody : body, 
              Subject : subject,
              To: to
          })
      }
  };

  this[NavigationMixin.Navigate](pageRef);
  this.chatFocus();
  }

  async handleRedirection(destination) {;
    if (!destination || !destination.type) {
      console.error('Invalid destination object provided');
      return;
    }

    switch (destination.type) {
      case 'recordPage':
        if (destination.recordId) {
          this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
              recordId: destination.recordId,
              objectApiName: destination.apiName || 'Account', // Use default objectApiName if not provided
              actionName: destination.actionName || 'view', // Use default actionName if not provided
            },
          });
        } else {
          console.error('Record ID is required for recordPage redirection');
        }
        break;
      case 'objectPage':
        if (destination.objectApiName) {
          this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
              objectApiName: destination.apiName,
              actionName: destination.actionName || 'list', // Use default actionName if not provided
            },
          });
        } else {
          console.error('Object API Name is required for objectPage redirection');
        }
        break;
      case 'namedPage':
        this[NavigationMixin.Navigate]({
          type: 'standard__namedPage',
          attributes: {
            pageName: destination.pageName,
          },
        });
        break;
      case 'navItemPage':
        if (destination.apiName) {
          this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
              apiName: destination.apiName,
            },
          });
        } else {
          console.error('API Name is required for navItemPage redirection');
        }
        break;
      case 'customPage':
        if (destination.componentName) {
          this[NavigationMixin.Navigate]({
            type: 'standard__component',
            attributes: {
              componentName: destination.componentName,
            },
            state: {
              ...destination.state,
            },
          });
        } else {
          console.error('Component Name is required for customPage redirection');
        }
        break;
      case 'externalUrl':
        if (destination.url) {
          this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
              url: destination.url,
            },
          });
        } else {
          console.error('URL is required for externalUrl redirection');
        }
        break;
      default:
        console.error('Invalid redirection type provided');
    }
  }
  

  openFlow(flowApiName, type) {
    this.flowName = flowApiName;
    this.showModal = true;
    this.chatFocus();
    return true;
  }

  showModal = false;
  flowName = "";

  get inputVariables() {
    return [
        {
            // Match with the input variable name declared in the flow.
            name: 'recordId',
            type: 'String',
            // Initial value to send to the flow input.
            value: this.recordId
        }
    ];
}

handleStatusChange(event) {
    if (event.detail.status === 'FINISHED') {
        this.showModal = false;
        this.chatFocus();
    }
}

  handleKeyDown(event) {
    if (event.shiftKey && event.code === 'KeyL') {
      //event.preventDefault();
      if(this.showModal == false) this.chatFocus();
      else {
        this.showAiAssistant();
      }
    }
    if (event.shiftKey && event.code === 'KeyP') {
      //this.openGlobalAction("2F09D0900000NWsIt");
    }
  }


  chatFocus(){
    this.showAiAssistant(true);
    const chatBody = this.template.querySelector('.ai-assistant-body');
    chatBody.scrollTop = chatBody.scrollHeight;
    const inputElement = this.template.querySelector('.message-input');
    inputElement.focus();
  }


  renderedCallback() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    if(this.chatOpen)
    this.chatFocus();

      //this.addChatMessage(this.aiAssistantMessage, 'ai-message', this.aiAvatarUrl);

    if (!this.hasRendered) {
      this.hasRendered = true;

      const aiAssistantContainer = this.template.querySelector('.ai-assistant-container');
      aiAssistantContainer.style.setProperty('--chat-width', this.chatWidth);
        this.applyConfigStyle();
        if(this.UtilityBar){
          aiAssistantContainer.style.setProperty('--assistant-body-top', "0px");
          aiAssistantContainer.style.setProperty('--chat-top', '45px');
          /*aiAssistantContainer.style.setProperty('--chat-top', 'auto');
          aiAssistantContainer.style.setProperty('--chat-left', 'auto');
          aiAssistantContainer.style.setProperty('--chat-right', 'auto');
          aiAssistantContainer.style.setProperty('--chat-bottom', 'auto');
          aiAssistantContainer.style.setProperty('--chat-zindex', '100');
          /*this.template.querySelector('.ai-assistant-body').style.height = 'calc(100vh - 350px)';
          this.template.querySelector('.ai-assistant-body').style.maxHeight = 'calc(100vh - 350px)';*/
        } else {
          if(this.chatPosition == "left"){
            aiAssistantContainer.style.setProperty('--chat-top', '90px');
            aiAssistantContainer.style.setProperty('--chat-left', '0');
            aiAssistantContainer.style.setProperty('--chat-right', 'auto');
            aiAssistantContainer.style.setProperty('--chat-bottom', '0');
            aiAssistantContainer.style.setProperty('--chat-zindex', '10000');
          } else {
            aiAssistantContainer.style.setProperty('--chat-top', '90px');
            aiAssistantContainer.style.setProperty('--chat-left', 'auto');
            aiAssistantContainer.style.setProperty('--chat-right', '0');
            aiAssistantContainer.style.setProperty('--chat-bottom', '0');
            aiAssistantContainer.style.setProperty('--chat-zindex', '10000');
            if(this.FullHeight){
              aiAssistantContainer.style.setProperty('--chat-bottom', "0px");
              aiAssistantContainer.style.setProperty('--chat-top', "0px");
            }
            }
        }
      }

  }


applyConfigStyle(){
  if (this.hasRendered) {
    const aiAssistantContainer = this.template.querySelector('.ai-assistant-container');

    aiAssistantContainer.style.setProperty('--style-header-background', this.styleHeaderBackgroundColor);
    aiAssistantContainer.style.setProperty('--style-header-color', this.styleHeaderColor);
    aiAssistantContainer.style.setProperty('--assistant-body-bottom', "80px");
    aiAssistantContainer.style.setProperty('--assistant-body-top', "50px");
    aiAssistantContainer.style.setProperty('--message-input-border', this.styleFooterBorderTop);
      if(this.UtilityBar){
        //aiAssistantContainer.style.setProperty('--chat-top', 'auto');
        //this.template.querySelector('.ai-assistant-header').style.display = 'none';
        aiAssistantContainer.style.setProperty('--assistant-body-top', "0px");
        aiAssistantContainer.style.setProperty('--chat-top', '45px');
      } else {

        if(this.styleHeaderHide)
        {
          /*this.template.querySelector('.ai-assistant-header').style.display = 'none';*/
          aiAssistantContainer.style.setProperty('--style-header-color', "grey");
          aiAssistantContainer.style.setProperty('--assistant-body-top', "0px");
          this.aiAssistantTitle = "";
          this.template.querySelector('.ai-assistant-header').style.background = "transparent;"
          
        } else this.template.querySelector('.ai-assistant-header').style.display = '';

        if(this.FullHeight){
          aiAssistantContainer.style.setProperty('--chat-bottom', "0px");
          aiAssistantContainer.style.setProperty('--chat-top', "0px");
        }
      }




    }
}

  connectedCallback() {

createDefaultConfig()


try {
  getConfigs()
    .then((configsall) => {
      this.allconfigs = configsall;
      const matchingConfig = configsall.find(
        (config) => config.Name === this.configName
      );
      if (matchingConfig) {
        this.loadedConfiguration = matchingConfig;
        if (this.loadedConfiguration) {
          this.configId = this.loadedConfiguration.Id;
          this.aiAssistantMessage = this.loadedConfiguration.Initial_message__c;
          this.aiAvatarUrl = this.loadedConfiguration.AI_avatar_Image__c;
          this.userAvatarUrl = this.loadedConfiguration.User_Avatar_Image__c;
          this.aiAssistantTitle = this.loadedConfiguration.Title__c;
          this.inputPlaceholder = this.loadedConfiguration.Input_Placeholder__c;
          if(this.loadedConfiguration.Message_source_type__c == "Basic responses")
            this.BasicMessages = true;
          else this.BasicMessages = false;
          //this.scenarioId = this.config.Scenario_Id__c; // Ensure to add Scenario_Id__c to your SOQL query
          this.Response1 = this.loadedConfiguration.Response_1__c;
          this.Response2 = this.loadedConfiguration.Response_2__c;
          this.Response3 = this.loadedConfiguration.Response_3__c;
          this.Response4 = this.loadedConfiguration.Response_4__c;
          this.Response5 = this.loadedConfiguration.Response_5__c;
          this.Response6 = this.loadedConfiguration.Response_6__c;
          //this.AutoMessage = this.config.Auto_Message__c; // Ensure to add Auto_Message__c to your SOQL query
          this.openAiApiKey = this.loadedConfiguration.OpenAPI_key__c;
          this.openAiApiVersion = this.loadedConfiguration.openApi_version__c;
          this.prompt = this.loadedConfiguration.Prompt__c;


          // Set Style
          this.styleFooterBorderTop = this.loadedConfiguration.styleFooterBorderTop__c;
          this.styleHeaderColor= this.loadedConfiguration.StyleHeaderColor__c;
          this.styleHeaderBackgroundColor= this.loadedConfiguration.StyleHeaderBackgroundColor__c;
          this.styleHeaderHide =this.loadedConfiguration.styleHeaderHide__c;
          this.styleInboxBorder = this.loadedConfiguration.styleInboxBorder__c;
          // End Style

          this.wordByWordMin = this.loadedConfiguration.Word_by_word_Min__c;
          this.wordByWordMax = this.loadedConfiguration.Word_by_word_Max__c;

          if(!this.recordId) this.recordId = this.loadedConfiguration.Default_record_ID__c;




          if (this.BasicMessages) {
            var rep = [
              {
                  userMessage: this.recordId, aiMessage: this.Response1,
                  elements: [
                  ],
              },{
                userMessage: this.recordId, aiMessage: this.Response2,
                elements: [],
            },{
              userMessage: 'Test', aiMessage: this.Response3,
              elements: [],
            },{
              userMessage: 'Test', aiMessage: this.Response4,
              elements: [],
              image: ''
            },{
              userMessage: 'Test', aiMessage: this.Response5,
              elements: [],
              image: ''
            },{
              userMessage: 'Test', aiMessage: this.Response6,
              elements: [],
              image: ''
            }
          ];
          this.responses = rep;
          var nextMessage = "";
          if(this.responses && this.responses.length > 0) nextMessage = this.responses[0].message;
          if(this.loadedConfiguration) this.typeMessage(this.aiAssistantMessage, 'ai-message', 0, nextMessage);
            return true;
          }

          getScenarioMessages()
              .then((data) => {
                  if (data) {
                     const scenariosWithMessages = Object.keys(data).map((key) => {
                          const scenarioData = data[key];
                          const scenario = scenarioData.scenario;
                          const messages = scenarioData.messages;
      
                          const transformedMessages = messages.map((message) => {
                              const elements = message.ScenarioMessageElements__r
                                  ? message.ScenarioMessageElements__r.map((element) => ({
                                    recordType: element.RecordTypeId,
                                    recordTypeName: element.RecordType.Name,
                                    buttonText: element.button_Text__c,
                                    buttonUrl: element.button_Url__c,
                                    buttonFlow: element.button_Flow__c,
                                    buttonStyle: element.Button_Style__c,
                                    tileTitle: element.tile_Title__c,
                                    tileTitleUrl: element.tile_TitleURL__c,
                                    tileSubtitle: element.tile_Subtitle__c,
                                    tileSubtitleUrl: element.tile_SubtitleURL__c,
                                    tileText: element.tile_Text__c,
                                    tileUrl: element.tile_URL__c,
                                    badgeStyle: element.badge_Style__c,
                                    badgeTitle: element.badge_Title__c,
                                    imageUrl: element.image_URL__c,
                                    datatableTable: element.datatable_Table__c,
                                    loadingText: element.loading_Text__c,
                                    loadingWait: element.loading_Wait__c,
                                    loadingTextAfter: element.loading_TextAfter__c,
                                    htmlContent: element.html_Content__c,
                                    redirectionPageName: element.redirection_pageName__c, 
                                    redirectionActionName: element.redirection_actionName__c, 
                                    redirectionApiName: element.redirection_objectApiName__c, 
                                    redirectionRecordId:element.redirection_RecordId__c, 
                                    redirectionType:element.redirection_Type__c,
                                    order: element.Order__c,
                                  })) : [];
      
                              return {
                                userMessage: message.UserMessage__c,
                                aiMessage: message.AiMessage__c,
                                elements: elements,
                                flowName: message.FlowName__c,
                                redirectUrl: message.RedirectURL__c,
                                order: message.Order__c,
                  
                                action: message.ActionAfterAiMessage__c,
                                actionEmail_to: message.Email_Global_Action_To__c,
                                actionEmail_name: message.Email_Global_Action_Name__c,
                                actionEmail_subject: message.Global_Action_Subject__c,
                                actionEmail_body: message.Global_Action_Body__c
                              };


                          });
      
                          return {
                              Name: scenario.Name,
                              keyword: scenario.Keyword__c,
                              messages: transformedMessages,
                          };
                      });
      
                      this.scenarios = scenariosWithMessages;
                      if(this.scenarioId && this.scenarios && this.scenarios[this.scenarioId])
                      {
                          this.responses = this.scenarios[this.scenarioId];
                      }
                  
                      var nextMessage = "";
                      if(this.responses && this.responses.length > 0) nextMessage = this.responses[0].message;
                      if(this.loadedConfiguration) this.typeMessage(this.aiAssistantMessage, 'ai-message', 0, nextMessage);
                  }
                  
                  if(this.loadHistory){
                  loadMessagesFromConfig({ configId: this.configId })
                  .then(result => {
                      // handle successful response
                      // 'result' will be a list of MessageHistory__c objects
                      var messages = result;
                      for(var i in messages){
                        if(!messages[i].UserMessage__c || !messages[i].AiMessage__c) continue;
                          this.addChatMessage(messages[i].UserMessage__c, "user-message", this.userAvatarUrl);
                          this.addChatMessage(messages[i].AiMessage__c, "ai-message", this.aiAvatarUrl);   
                      };
                  })
                  .catch(error => {
                      // handle error
                      console.error('Error in loading messages: ', error);
                  });
                  this.deleteMessages()
                }


              })
              .catch((error) => {
                  console.error('Error fetching Scenario messages:', error.message, JSON.stringify(error));
              });
      }
      } else {
        console.error("No matching configuration found.");
      }
    })
    .catch((error) => {
      console.error("Error retrieving configurations:", error);
    });
} catch (error) {
  console.error("Error in try block:", error);
}
  

    
}

  showAiAssistant(force = false) {
    const container = this.template.querySelector('.ai-assistant-container');
    if(!force && container.style.display == 'block') return this.handleCloseButtonClick();
    if (container) {
      container.style.display = 'block';
    }
    this.applyConfigStyle()
  }

  handleCloseButtonClick() {
    const container = this.template.querySelector('.ai-assistant-container');
    if(container.style.display == 'none') return this.showAiAssistant();
    if (container) {
      container.style.display = 'none';
    }
  }

  handleInputKeyDown(event) {
    if (event.key === 'Enter') {
      const message = event.target.value;
      event.target.value = '';

      this.addChatMessage(message, 'user-message', this.userAvatarUrl);
      this.lockInput(true);

      setTimeout(() => {
        this.sendNextResponse(message);
      }, 500);
    }
  }

  btnClicked(e){
    e.preventDefault();
    if(e.target.getAttribute("href") && e.target.getAttribute("href").match("flow")){
      var flowName = e.target.getAttribute("href").split(/flow\//)[1];
      this.openFlow(flowName)
    }
    else if(e.target.getAttribute("href") && e.target.getAttribute("href") =="#"){
        this.addChatMessage(e.target.innerHTML, "user-message", this.userAvatarUrl);
        this.lockInput(true);
        setTimeout(() => {
          this.sendNextResponse(e.target.innerHTML);
        }, 500);
    } else {
      document.location.href = e.getAttribute("href");
    }
  }

  addChatMessage(message, messageClass, avatarSrc, ignoreScenario) {
    if (message.startsWith("/config ")) {
      const confname = message.split("config ")[1];
      this.updateConfig(confname);
      this.lockInput(false);
      this.chatFocus();
      return true;
    }


    //ICI
    if(!ignoreScenario && messageClass=="user-message" && (!this.responses || !this.responses.length || this.responseCounter >= this.responses.length) && (this.scenarios && this.scenarios.length))
    {
        for(var i in this.scenarios){

            const re = new RegExp(this.scenarios[i].keyword, "i");
            if(message.match(re)){
                this.responses = this.scenarios[i].messages;
                this.responseCounter = 0;
            }
        }


    }


    const chatBody = this.template.querySelector('.ai-assistant-body');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${messageClass}`;
    messageElement.setAttribute("c-assistant_assistant", "");
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = avatarSrc;
    avatar.setAttribute("c-assistant_assistant", "");
    messageElement.appendChild(avatar);
    const messageContent = document.createElement('span');
    messageContent.className = 'message-content';
    messageContent.setAttribute("c-assistant_assistant", "");
    messageContent.style.width = "100%";
    messageContent.innerHTML = message;
    messageElement.appendChild(messageContent);
  
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
    return messageContent;  
  }

  decodeHtmlEntity = (str) => {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
      });
  };


deleteMessages() {
    if(!this.deleteHistory) return true;
    deleteMessagesFromConfig({ configId: this.configId })
        .then(() => {
            // handle successful response
            //console.log('Successfully deleted messages.');
        })
        .catch(error => {
            // handle error
            console.error('Error in deleting messages: ', error);
        });
}


  // method to add message to config
  async saveMessage(usermessage, aimessage) {
    if(!this.saveHistory) return false;
    if(!usermessage && !aimessage) return false;
  addMessageToConfig({ configId: this.configId, usermessage: usermessage, aimessage: aimessage })
      .then(result => {
          // handle successful response
          //console.log('Message added successfully');
      })
      .catch(error => {
          // handle error
          console.error('Error in adding message: ', error);
      });
}
  
  ///// TYPE //////
  async typeMessage(message, messageClass, typingSpeed, userMessage, extraContent, response, userRealMessage) {
    if(!userRealMessage) userRealMessage = "";
    if(!message) message = "";
    message = message.replace(/<ul>/gi, '<ol class="slds-list_dotted">');
    message = message.replace(/<\/ul>/gi, '</ol>');
    message = message.replace(/<ol>/gi, '<ol class="slds-list_dotted">');
    if (typingSpeed === 0) {
      const messageContent = this.directMessage(message, messageClass, userMessage);
      this.saveMessage(userRealMessage, messageContent.innerHTML);
      return true;
    }
    const avatarSrc = this.aiAvatarUrl;
    const messageContent = this.addChatMessage('', messageClass, avatarSrc, extraContent, true);
    if (!messageContent) {
      return false;
    }

    await this.typeWithEffect(messageContent, message, typingSpeed, extraContent, response);
    this.saveMessage(userRealMessage, messageContent.innerHTML);
  
    // Handle additional behaviors
    if (response) {
      this.handleAction(response);
    }
  
    if (this.AutoMessage && userMessage) {
      await this.handleAutoMessage(userMessage);
    }
  }
  
  async typeWithEffect(messageContent, message, typingSpeed, extraContent, response) {
    // If no htmltag in messageContent then convert all breaklines by <br>c/assistant
    const regex = /<[a-z][\s\S]*>/i;
    const tagfound = message.match(regex);
    if(!tagfound || !tagfound.length) {
        // Replace newline characters with HTML breakline tag
        message = message.replace(/\n/g, '<br>');
    }
    

    if(!message) message= " ";
    const words = this.splitMessageWithTags(message, this.wordByWordMin, this.wordByWordMax);
    // Create a span element for the cursor
    const cursor = document.createElement('span');
    cursor.classList.add('blinking-cursor');
    cursor.textContent = '|';
  
    let loadingElementFound = false;
		let allcontent = "";
  
    // Check for Loading elements
    for (let i in response.elements) {
      if (response.elements[i].recordTypeName == "Loading") {
        if(!response.elements[i].loadingText) response.elements[i].loadingText = "";

        messageContent.innerHTML = allcontent + response.elements[i].loadingText;
        messageContent.innerHTML += `<div role="status" class="slds-spinner slds-spinner_medium">
        <span class="slds-assistive-text">Loading</span>
        <div class="slds-spinner__dot-a"></div>
        <div class="slds-spinner__dot-b"></div>
      </div>`;
  
        // Wait response.elements[i].loadingWait milliseconds
        await this.wait(response.elements[i].loadingWait);
        if(!response.elements[i].loadingTextAfter) response.elements[i].loadingTextAfter ="";
        messageContent.innerHTML = allcontent + response.elements[i].loadingTextAfter;
				allcontent += response.elements[i].loadingTextAfter;
        loadingElementFound = true;
      }
    }
  
    loadingElementFound = false;
    // If no loading element is found, continue typing immediately
    if (!loadingElementFound) {

      for (const word of words) {
        allcontent+=word;
    
        if (word.startsWith('<') && word.endsWith('>')) {
          if(!word.match(/<li(\s|>)/i))
            messageContent.insertAdjacentHTML('beforeend', word);
          if(word.match(/<\/[a-zA-Z0-9]+>/i)){ // endtag
            messageContent.innerHTML = allcontent;
          }
          //messageContent.innerHTML += word;
        } else {
           messageContent.insertAdjacentText('beforeend', word);
          //messageContent.innerHTML += word;
        }
        this.scrollChatToBottom();
        // Add a blinking cursor at the end of the message only if there are more words to type
        if (words.length > 0) {
          messageContent.appendChild(cursor);
        }
  
					if (word.startsWith('<') && word.endsWith('>')) {
					} else {
        await this.wait(this.getRandomTypingSpeed(typingSpeed));
							}
  
        // Remove the blinking cursor before the next word
        if (cursor.parentNode) {
          cursor.parentNode.removeChild(cursor);
        }
        
      }
    }
  
    messageContent.innerHTML = allcontent;

    // Append extraContent if it's a DOM element
    if (extraContent instanceof HTMLElement) {
      messageContent.appendChild(extraContent);
  
      // Add event listeners to buttons if any
      const buttons = this.template.querySelectorAll('.btn-assistant-action');
      buttons.forEach(btn =>
        btn.addEventListener("click", (e) => this.btnClicked(e))
      );
    }
  
    this.scrollChatToBottom();

    // Unlock the input after the typing effect is complete
    this.lockInput(false);
    this.chatFocus();
  }
  
  
  
  
  scrollChatToBottom() {
    const chatBody = this.template.querySelector('.ai-assistant-body');
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  
  wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
  
  getRandomTypingSpeed(avgSpeed) {
    if (!this.aiTypingSpeedRandomize) return avgSpeed;
  
    const minSpeed = avgSpeed * 0.01;
    const maxSpeed = avgSpeed * 100;
  
    const power = 5; // Increase this to make smaller times more likely.
    
    const randomNum = Math.random();
    const weightedNum = Math.pow(randomNum, power);
    return weightedNum * (maxSpeed - minSpeed) + minSpeed;
  }
  
  
  async directMessage(message, messageClass, userMessage) {
    const messageContent = this.addChatMessage(message, messageClass, this.aiAvatarUrl, true);
    this.lockInput(false);
  
    if (!messageContent) {
      return false;
    }
  
    this.focusInput();
  
    if (this.AutoMessage) {
      if (!userMessage) userMessage = "TEST";
      this.addChatMessage(userMessage, 'user-message', this.userAvatarUrl);
      this.lockInput(true);
  
      setTimeout(() => {
        this.sendNextResponse(userMessage);
      }, 500);
    }
  
    return messageContent;
  }
  
  focusInput() {
    const inputElement = this.template.querySelector('.message-input');
    inputElement.focus();
  }
  
  async handleAutoMessage(userMessage) {
    this.addChatMessage(userMessage, 'user-message', this.userAvatarUrl);
    this.lockInput(true);
  
    await this.wait(500);
    this.sendNextResponse(userMessage);
  }
  
  async handleAction(response) {
    if (response.action && response.action == "Open Email Composer") {
      this.openGlobalAction(response.actionEmail_name, response.actionEmail_subject, response.actionEmail_body, response.actionEmail_to);
    }
  
    if (response.action && response.action == "Execute a flow") {
      this.openFlow(response.flowName);
    }


    for (let i in response.elements) {
      if (response.elements[i].recordTypeName == "Redirection") {
        var redirection = {
          pageName: response.elements[i].redirectionPageName, 
          actionName: response.elements[i].redirectionActionName, 
          apiName: response.elements[i].redirectionApiName, 
          recordId:response.elements[i].redirectionRecordId,  
          type:response.elements[i].redirectionType,
          url: response.elements[i].buttonUrl
        };
          await this.wait(1500);
          this.handleRedirection(redirection)
      }
    }

  }
  
  splitMessageWithTags(message, minLength, maxLength) {
    if(!minLength) minLength = 5;
    if(!maxLength) maxLength = 10;
    const regex = /(<[^>]*>|[^<>]+)/g;
    const splitMessage = message.match(regex);
    const res = [];
  
    for (const str of splitMessage) {
      if (str.startsWith('<') && str.endsWith('>')) {
        res.push(str);
      } else {
        const strDecoded = this.decodeHtmlEntity(str);
        let i = 0;
        while (i < strDecoded.length) {
          const segmentLength = Math.min(Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength, strDecoded.length - i);
          res.push(strDecoded.slice(i, i + segmentLength));
          i += segmentLength;
        }
      }
    }
  
    return res;
  }

  


  

  decodeEntities = (function() {
    // this prevents any overhead from creating the object each time
    var element = document.createElement('div');

    function decodeHTMLEntities (str) {
      if(str && typeof str === 'string') {
        // strip script/html tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
        element.innerHTML = str;
        str = element.textContent;
        element.textContent = '';
      }

      return str;
    }

    return decodeHTMLEntities;
  })();



  //// END TYPE ////


    UnescapeHtml(text) {
      var map = {
        '&amp;':'&',
        '&quot;': "'",
        '&#039;': '"',
      };
      
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }


  addCustomAttribute(element) {
    if (element) {
      element.setAttribute('c-assistant_assistant', '');
      Array.from(element.children).forEach(child => {
        this.addCustomAttribute(child);
      });
    }
  }
  
  createElementHTML(recordTypeName, element) {
    let elementHTML = '';
    if(recordTypeName == "HTML"){
      elementHTML = "<div>" + element.htmlContent + "</div>";
    }
    else if (recordTypeName == 'Button') { // Button
      var href = element.buttonUrl;
      if(element.buttonFlow && element.buttonFlow !="") href="flow/" + element.buttonFlow;
      elementHTML = `<span style="padding:10px;display:inline-block" class="btn-container"><button href="${href}" class="btn-assistant-action slds-button slds-button_${element.buttonStyle}">${element.buttonText}</button></span>`;
    } else if (recordTypeName == 'Badge') { // badge
      elementHTML = `<span class="slds-badge ${element.badgeStyle}">${element.badgeTitle}</span>`;
    } else if (recordTypeName == 'Image'){ // image
      elementHTML = `<img src="${element.imageUrl}" height="100px"></img>`;
    } else if (recordTypeName == 'Tile') { // Tile
      elementHTML = `
        <article class="slds-card">
          <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
              <div class="slds-media__figure">
                <span class="slds-icon_container slds-icon-standard-opportunity" title="${element.tileTitle}">
                  <svg class="slds-icon slds-icon_small" aria-hidden="true">
                    <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#opportunity"></use>
                  </svg>
                  <span class="slds-assistive-text">${element.tileTitle}</span>
                </span>
              </div>
              <div class="slds-media__body">
                <h2 class="slds-card__header-title">
                  <a href="${element.tileTitleUrl}" class="slds-card__header-link slds-truncate" title="${element.tileTitle}">
                    <span>${element.tileTitle}</span>
                  </a>
                </h2>
              </div>
            </header>
          </div>
          <div class="slds-card__body slds-card__body_inner">
            <div class="primaryField truncate"><a href="${element.tileSubtitleUrl}">${element.tileSubtitle}</a></div>
            ${element.tileText}
          </div>
          <footer class="slds-card__footer">
            <a class="slds-card__footer-action" href="${element.tileUrl}">Voir le détails<span class="slds-assistive-text"></span></a>
          </footer>
        </article>`;
    } else if (recordTypeName === 'Datatable') { // Datatable
      const rows = element.datatableTable.split('\n');
      const headers = rows[0].split(',');
    
      let tableHTML = `
        <table class="slds-table slds-table_cell-buffer slds-table_bordered slds-table_fixed-layout" aria-label="Table">
          <thead>
            <tr class="slds-line-height_reset">`;
    
      for (let i = 0; i < headers.length; i++) {
        tableHTML += `
              <th class="" scope="col">
                <div class="slds-truncate">${headers[i]}</div>
              </th>`;
      }
    
      tableHTML += `
            </tr>
          </thead>
          <tbody>`;
    
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',');
        tableHTML += `
            <tr class="slds-hint-parent">`;
    
        for (let j = 0; j < values.length; j++) {
          tableHTML += `
              <td data-label="${headers[j]}">
                <div class="slds-truncate">${values[j]}</div>
              </td>`;
        }
    
        tableHTML += `
            </tr>`;
      }
    
      tableHTML += `
          </tbody>
        </table>`;
    
      elementHTML = tableHTML;

    } else {
      elementHTML = '<span></span>';
    }
    return elementHTML;

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = elementHTML.trim();
  
    const el = tempContainer.firstChild;
    this.addCustomAttribute(el);
  
    return el;
  }
  


  async sendNextResponse(userMessage) {
    if(!this.responses || !this.responses.length || this.responseCounter >= this.responses.length) {
      if(this.openAiApiKey){
        var airesponse = await this.generateCompletion(this.getPrompt(userMessage), 2000);
          var rep = [
            {
                userMessage: userMessage, aiMessage: airesponse,
            }];
          this.responses = rep;
          this.responseCounter = 0;

          this.history += 
`Human:
${this.userMessage}

Assistant:
${airesponse}

`;
          if(this.history.length > 300){
            this.history = "[TEXT REMOVED TO SAVE SPACE]" + this.history.substring(this.history.length, -300);
          }
        } else return this.lockInput(false);
    }

    if (this.responseCounter < this.responses.length) {
      const response = this.responses[this.responseCounter];

      let elementContent;
      if (response.elements && response.elements.length > 0) {
        elementContent = document.createElement('div');
        elementContent.setAttribute("c-assistant_assistant", "");
        //elementContent.setAttribute("c-assistant_assistant", "");
        elementContent.className = 'message-buttons';
  
        response.elements.forEach(button => {
          if (!button.recordTypeName) next;
          const elementHTML = this.createElementHTML(button.recordTypeName, button);
          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = elementHTML.trim();
          const element = tempContainer.firstChild;
          elementContent.appendChild(element);
        });
      } else response.elements = [];

      this.responseCounter++;
      var nextMessage = "";
      if (this.responseCounter < this.responses.length) nextMessage = this.responses[this.responseCounter].userMessage;
      this.typeMessage(response.aiMessage, 'ai-message', this.aiTypingSpeed, nextMessage, elementContent, response, userMessage);
      this.chatFocus();
    } else {
      this.lockInput(false);
    }
  }
  

  lockInput(locked) {
    const inputElement = this.template.querySelector('.message-input');
    inputElement.disabled = locked;
  }

  // Add https://api.openai.com/ to trusted site


  getPrompt(usermessage){
var recordContext = ``;
if(this.record)
  {
    recordContext = `
      // Current salesforce record page //
      Object: ${this.objectApiName}
      Data:
      ${this.recordString}
      ////////////////////////
    `
  } 


      var realPrompt = `${this.prompt}

${recordContext}


${this.history}

Human: 
${usermessage}

Assistant:`;

return realPrompt;
  
}



  updateConfig(configName){  
    this.configName = configName;
      const matchingConfig = this.allconfigs.find(
        (config) => config.Name === this.configName
      );
      if (matchingConfig) {
        this.loadedConfiguration = matchingConfig;
        if (this.loadedConfiguration) {
          this.aiAssistantMessage = this.loadedConfiguration.Initial_message__c;
          this.aiAvatarUrl = this.loadedConfiguration.AI_avatar_Image__c;
          this.userAvatarUrl = this.loadedConfiguration.User_Avatar_Image__c;
          this.aiAssistantTitle = this.loadedConfiguration.Title__c;
          this.inputPlaceholder = this.loadedConfiguration.Input_Placeholder__c;
          if(this.loadedConfiguration.Message_source_type__c == "Basic responses")
            this.BasicMessages = true;
          else this.BasicMessages = false;
          //this.scenarioId = this.config.Scenario_Id__c; // Ensure to add Scenario_Id__c to your SOQL query
          this.Response1 = this.loadedConfiguration.Response_1__c;
          this.Response2 = this.loadedConfiguration.Response_2__c;
          this.Response3 = this.loadedConfiguration.Response_3__c;
          this.Response4 = this.loadedConfiguration.Response_4__c;
          this.Response5 = this.loadedConfiguration.Response_5__c;
          this.Response6 = this.loadedConfiguration.Response_6__c;
          //this.AutoMessage = this.config.Auto_Message__c; // Ensure to add Auto_Message__c to your SOQL query
          this.openAiApiKey = this.loadedConfiguration.OpenAPI_key__c; 
          this.openAiApiVersion = this.loadedConfiguration.openApi_version__c;
          this.prompt = this.loadedConfiguration.Prompt__c;

          // Set Style
          this.styleFooterBorderTop = this.loadedConfiguration.styleFooterBorderTop__c;
          this.styleHeaderColor= this.loadedConfiguration.styleHeaderColor__c;
          this.styleHeaderBackgroundColor= this.loadedConfiguration.styleHeaderBackgroundColor__c;
          this.styleHeaderHide =this.loadedConfiguration.styleHeaderHide__c;
          this.styleInboxBorder = this.loadedConfiguration.styleInboxBorder__c;
          // End Style

          this.wordByWordMin = this.loadedConfiguration.Word_by_word_Min__c;
          this.wordByWordMax = this.loadedConfiguration.Word_by_word_Max__c;

          this.history = "";
          this.responseCounter = 0;
          if (this.BasicMessages) {
            
            var rep = [
              {
                userMessage: 'Config updated', aiMessage: this.aiAssistantMessage,
              },
              {
                  userMessage: 'Test', aiMessage: this.Response1,
                  elements: [
                  ],
              },{
                userMessage: 'Test', aiMessage: this.Response2,
                elements: [],
            },{
              userMessage: 'Test', aiMessage: this.Response3,
              elements: [],
            },{
              userMessage: 'Test', aiMessage: this.Response4,
              elements: [],
              image: ''
            },{
              userMessage: 'Test', aiMessage: this.Response5,
              elements: [],
              image: ''
            },{
              userMessage: 'Test', aiMessage: this.Response6,
              elements: [],
              image: ''
            }
          ];
          this.responses = rep;
        }

        else this.responses = [
          {
            userMessage: 'Config updated', aiMessage: this.aiAssistantMessage,
          }];

      }
    }
  }
}