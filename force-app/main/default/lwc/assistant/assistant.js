import { LightningElement, api, wire } from 'lwc';
import getScenarioMessages from '@salesforce/apex/AiAssistantMessageController.getScenarioMessages';
import getConfigs from '@salesforce/apex/EinsteinGPTConfigManager.getConfigs'
import createDefaultConfig from '@salesforce/apex/EinsteinGPTConfigManager.createDefaultConfig'
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

export default class AiAssistant extends NavigationMixin(LightningElement) {
  @api configName = "Default Config";
  loadedConfiguration;
  allconfigs;


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
  - Show datatable, table, grid ( <table class="slds-table slds-table_cell-buffer slds-table_bordered" aria-label="Example default base table"><thead><tr class="slds-line-height_reset"></tr></thead><tbody><tr><td></td></tr></tbody></table>
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
  @api UtilityBar = false;
 

  @wire(getScenarioMessages)
  AiAssistantMessages;

  @wire(getConfigs)
  einsteinGptConfigs;

  @wire(createDefaultConfig)
  createDefaultConfig;

  async generateCompletion(prompt, maxTokens) {
    const apiKey = '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';
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
      if(this.showModal == false) this.chatFocus();
      else this.showAiAssistant();
    }
    if (event.shiftKey && event.code === 'KeyP') {
      console.log(this.scenarioId);
      console.log(this.recordId)
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

      if(this.chatPosition == "left"){
        aiAssistantContainer.style.setProperty('--chat-top', '90px');
        aiAssistantContainer.style.setProperty('--chat-left', '0');
        aiAssistantContainer.style.setProperty('--chat-right', 'auto');
        aiAssistantContainer.style.setProperty('--chat-bottom', '0');
        aiAssistantContainer.style.setProperty('--chat-zindex', '100');
      } else {
        aiAssistantContainer.style.setProperty('--chat-top', '90px');
        aiAssistantContainer.style.setProperty('--chat-left', 'auto');
        aiAssistantContainer.style.setProperty('--chat-right', '0');
        aiAssistantContainer.style.setProperty('--chat-bottom', '0');
        aiAssistantContainer.style.setProperty('--chat-zindex', '100');
        }
        if(this.UtilityBar){
          aiAssistantContainer.style.setProperty('--chat-top', 'auto');
          aiAssistantContainer.style.setProperty('--chat-left', 'auto');
          aiAssistantContainer.style.setProperty('--chat-right', 'auto');
          aiAssistantContainer.style.setProperty('--chat-bottom', 'auto');
          aiAssistantContainer.style.setProperty('--chat-zindex', '100');
          this.template.querySelector('.ai-assistant-body').style.height = 'calc(100vh - 350px)';
          this.template.querySelector('.ai-assistant-body').style.maxHeight = 'calc(100vh - 350px)';
        }

      }

  }


  connectedCallback() {

createDefaultConfig()


try {
  getConfigs()
    .then((configsall) => {
      //console.log("Configs data:", configsall); // Add a log to check the data
      //console.log(this.configName)
      this.allconfigs = configsall;
      const matchingConfig = configsall.find(
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
          this.prompt = this.loadedConfiguration.Prompt__c;

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

  addChatMessage(message, messageClass, avatarSrc) {
    if (message.startsWith("/config ")) {
      const confname = message.split("config ")[1];
      this.updateConfig(confname);
      this.lockInput(false);
      this.chatFocus();
      return true;
    }


    //ICI
    if((!this.responses || !this.responses.length || this.responseCounter >= this.responses.length) && (this.scenarios && this.scenarios.length))
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

  typeMessage(message, messageClass, typingSpeed, userMessage, extraContent, response) {
    message = message.replace(/<ul>/gi, '<ol class="slds-list_dotted">');
    message = message.replace(/<\/ul>/gi, '</ol>');
    const regexOl = /<ol>/gi;
    message = message.replace(regexOl, '<ol class="slds-list_dotted">');

    if (typingSpeed == 0) {
      const messageContent = this.addChatMessage(message, messageClass, this.aiAvatarUrl);
      this.lockInput(false);
      if(!messageContent) return false;
  
      // Set focus on the input element after the AI writes a message
      const inputElement = this.template.querySelector('.message-input');
      inputElement.focus();
  
      if (this.AutoMessage) {
        if (!userMessage) userMessage = "TEST";
        this.addChatMessage(userMessage, 'user-message', this.userAvatarUrl);
        this.lockInput(true);
        setTimeout(() => {
          this.sendNextResponse(userMessage);
        }, 500);
      }
      return true;
    }
  
    const avatarSrc = this.aiAvatarUrl;
    const messageContent = this.addChatMessage('', messageClass, avatarSrc, extraContent);
    if(!messageContent) return false;
    let index = 0;
    const htmlTagRegex = /<\/?[a-z][^>]*>/gi;
  
    const continueTyping = () => {
      const getRandomTypingSpeed = (avgSpeed) => {
        if (!this.aiTypingSpeedRandomize) return avgSpeed;
        const minSpeed = avgSpeed * 0.01;
        const maxSpeed = avgSpeed * 1.5;
        return Math.random() * (maxSpeed - minSpeed) + minSpeed;
      };
  
      const splitMessageWithTags = (message) => {
        const regex = /(<[^>]*>|[^<>]+|\s+)/g;
        return message.match(regex);
      };
  
      const words = splitMessageWithTags(message);
  
      const typeNextWord = () => {
        if (words.length > 0) {
          const nextWord = words.shift();
  
          let nextHtmlTag = '';
          if (nextWord.startsWith('<')) {
            const tagMatch = nextWord.match(htmlTagRegex);
            if (tagMatch && tagMatch[0]) {
              nextHtmlTag = tagMatch[0];
            }
          }
  
          if (nextHtmlTag) {
            messageContent.innerHTML += nextHtmlTag;
            index += nextHtmlTag.length;
          } else {
            messageContent.innerHTML += nextWord;
            index += nextWord.length;
          }
          const chatBody = this.template.querySelector('.ai-assistant-body');
          chatBody.scrollTop = chatBody.scrollHeight;
  
          setTimeout(typeNextWord, getRandomTypingSpeed(typingSpeed));
        } else {
          messageContent.innerHTML = message;
          if (extraContent) {
            messageContent.appendChild(extraContent);
          }
          this.lockInput(false);
  
          // Set focus on the input element after the AI writes a message
          const inputElement = this.template.querySelector('.message-input');
          this.chatFocus();
  
          if (response && response.action && response.action == "Open Email Composer") {
            this.openGlobalAction(response.actionEmail_name, response.actionEmail_subject, response.actionEmail_body, response.actionEmail_to);
          }
          if (response && response.action && response.action == "Execute a flow") {
            this.openFlow(response.flowName);
          }
  
          if (this.AutoMessage && userMessage) {
            if (userMessage)
              this.addChatMessage(userMessage, 'user-message', this.userAvatarUrl);
            this.lockInput(true);
            setTimeout(() => {
              this.sendNextResponse(userMessage);
            }, 500);
          }
        }
      };
  
      typeNextWord();
      this.chatFocus();
    };
  
    let loadingElementFound = false;
  
    // Check for Loading elements
    for (let i in response.elements) {
      if (response.elements[i].recordTypeName == "Loading") {
        messageContent.innerHTML = response.elements[i].loadingText;
        messageContent.innerHTML += `<div role="status" class="slds-spinner slds-spinner_medium">
        <span class="slds-assistive-text">Loading</span>
        <div class="slds-spinner__dot-a"></div>
        <div class="slds-spinner__dot-b"></div>
      </div>`;
  
        // Wait response.elements[i].loadingWait milliseconds
        setTimeout(() => {
          messageContent.innerHTML = response.elements[i].loadingTextAfter;
          continueTyping();
        }, response.elements[i].loadingWait);
  
        loadingElementFound = true;
        break;
     
      }
    }

    // If no loading element is found, continue typing immediately
    if (!loadingElementFound) {
    continueTyping();
    }
    }  
  




    decodeEntities = (function() {
      // this prevents any overhead from creating the object each time
      var element = document.createElement('div');
    
      function decodeHTMLEntities (str) {
        if(str && typeof str === 'string') {
          // strip script/html tags
          str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
          //str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
          element.innerHTML = str;
          //str = element.textContent;
          str = element.innerHTML;
          element.textContent = '';
        }
    
        return str;
      }
    
      return decodeHTMLEntities;
    })();


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
  
    if (recordTypeName == 'Button') { // Button
      elementHTML = `<button href="${element.buttonUrl}" class="slds-button slds-button_${element.buttonStyle}">${element.buttonText}</button>`;
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
        <table class="slds-table slds-table_cell-buffer slds-table_bordered" aria-label="Example default base table">
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
      }
      this.responseCounter++;
      var nextMessage = "";
      if (this.responseCounter < this.responses.length) nextMessage = this.responses[this.responseCounter].userMessage;
      this.typeMessage(response.aiMessage, 'ai-message', this.aiTypingSpeed, nextMessage, elementContent, response);
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
      var realPrompt = 
`${this.prompt}

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
          this.prompt = this.loadedConfiguration.Prompt__c;


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