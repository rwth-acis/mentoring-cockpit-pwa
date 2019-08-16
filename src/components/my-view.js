import { html, css } from 'lit-element';
import { PageViewElement } from './page-view-element.js';
import '@vaadin/vaadin-combo-box/vaadin-combo-box.js';
import '@google-web-components/google-chart/google-chart.js';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

class MyView extends PageViewElement {  
  static get properties() {
    return {
      _results: { type: Object },
      _email: { type: String },
      _data: { type: Object },
      _courseId: { type: Number },
      _courseURL: { type: String },
      _loginSub: { type: String},
      _greenUser: { type: Number },
      _yellowUser: { type: Number },
      _redUser: { type: Number },
      _redLimit: { type: Number},
      _yellowLimit: { type: Number},
      _avgScore: { type: Number },
      _courseDescription: { type: String },
      _feedback: { type: String },
      mcService: { type: String },
      //If you are using different services add a property and configure _updateLearningLocker function
      moodleDataProxy: { type: String },
      las2peerBaseURL: { type : String },
      oidcclientid: { type: String }
    };
  }

  static get styles() {
    return [
      SharedStyles,
      css`
        #traffic-light {
          height: 225px;
          width: 100px;
          background-color: #333;
          border-radius: 30px;
          margin: auto;
          padding: 15px;
        }
        
        .bulb {
          height: 60px;
          width: 60px;
          background-color: #111;
          border-radius: 50%;
          margin: 12px auto;
        }

        .button {
          background-color: #008CBA;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
        }

        .button2 {
          background-color: white; 
          color: black; 
          border: 2px solid #008CBA;
        }
        
        .button2:hover {
          background-color: #008CBA;
          color: white;
        }
        
      `
    ];
  }

  render() {
    return html`
    
    <div class="vertical-section-container centered" id="widget-container" @signed-in="${this.handleLogin}">
    <las2peer-frontend-statusbar service="Mentoring Cockpit"
        baseurl="${this.las2peerBaseURL}"
        oidcpopupsigninurl="./node_modules/las2peer-frontend-statusbar/callbacks/popup-signin-callback.html"
        oidcpopupsignouturl="./node_modules/las2peer-frontend-statusbar/callbacks/popup-signout-callback.html"
        oidcsilentsigninturl="./node_modules/las2peer-frontend-statusbar/callbacks/silent-callback.html"
        oidcclientid="${this.oidcclientid}"
        autoAppendWidget=true
        @signed-out="${this.handleLogout}"
      ></las2peer-frontend-statusbar>
      </div>
    <section>
      <button class="button button2" @click="${this._updateLearningLocker}" id="updateButton">Update course data</button>
      <br> <br>
      <vaadin-combo-box 
      label="Course" 
      placeholder="Select course" 
      item-value-path="link" 
      item-label-path="name">
      </vaadin-combo-box>

      <vaadin-combo-box 
      label="Student" 
      placeholder="Select student" 
      item-value-path="_id" 
      item-label-path="name">
      </vaadin-combo-box>
      
    </section>

    <section>
      <div id="traffic-light">
        <div id="redLight" class="bulb"></div>
        <div id="yellowLight" class="bulb"></div>
        <div id="greenLight" class="bulb"></div>
      </div>
      <google-chart
        type='column'
        options='{"title": "Course Results",
          "width": "100%",
          "margin": 0,
          "vAxis": {"title": "Percent", "minValue": 0, "maxValue": 100}, 
          "legend": "none"}'
        cols='[{"label":"Assignment", "type":"string"}, {"label":"Score", "type":"number"}]'
        rows='${this._data}'>
      </google-chart>
    </section>
    <section>
    <h2>Course Statistics:</h2>
    <ul style="list-style-type:none;">
      <li>Green Students: ${this._greenUser}</li>
      <li>Yellow Students: ${this._yellowUser}</li>
      <li>Red Students: ${this._redUser}</li>
      <li>Average Score: ${this._avgScore}</li>
    </ul>
    </section>

    <section>
    <h2>Problems:</h2>
    <p>${this._courseDescription}</p>
    <p>${this._feedback}</p>
    <ul id = "feedbackList">
    </ul>
    <p>Contact the student under: <a href="${this._email}">${this._email}</a><p>
    </section>


    `
  }

  constructor() {
    super();
    this._data = '[]';
    this._email = '';
    //this.setEverythingToZero();
    this._redLimit = 0.5;
    this._yellowLimit = 0.6;

    
    //read form properties file
    fetch('etc/config.properties')
      .then(res => res.text())
      .then(text => {
        //get rid of whitespace
        const config = text.trim()
          //split into an array of properties
          .split('\n')
          //get rid of spaces and split each property into an array
          .map(m => m.replace(/\s+/g, '').split('='))
          //transform the array into a dictionary
          .reduce(function(map, obj){
            map[obj[0]] = obj[1];
            return map;
          }, {});
        this.mcService = config['mcService'];
        this.moodleDataProxy =config['moodleDataProxy'];
        this.las2peerBaseURL = config['las2peerBaseURL'];
        this.oidcclientid = config['oidcclientid'];
      });
    
  }


  fetchStatements() {
    //aggregation http interface
    const courseURL_Encoded = this.encode(this._courseURL);
    const uri = `${this.mcService}/${this._loginSub}/${courseURL_Encoded}/results`;
    fetch(uri, {method: 'GET',
      'Content-Type': 'application/json'
    })
      .then(res => res.json())
      .then(json => {
        this._results = json;
        const scores = json.map(e => e.averageScore);
        scores.forEach(score => {
          if (this.getLightsColor(score) === 'red') this._redUser++;
          else if (this.getLightsColor(score) === 'yellow') this._yellowUser++;
          else if (this.getLightsColor(score) === 'green') this._greenUser++;
        });
        this._avgScore = scores.reduce((score1, score2) => score1 + score2)*100/scores.length;
      })
      .catch(() => console.log("Service unavailable"));
  }

  fetchPersona() {
    //aggregation http interface
    const courseURL_Encoded = this.encode(this._courseURL);
    const uri = `${this.mcService}/${this._loginSub}/${courseURL_Encoded}/students`;
    fetch(uri, {method: 'GET',
      'Content-Type': 'application/json'
    })
      .then(res => res.json())
      .then(json => {
        // fill comboBox with items

        const comboBox = this.shadowRoot.querySelectorAll('vaadin-combo-box')[1];
        comboBox.items = json;
        comboBox.addEventListener('change', (e) => {
          if(this._results != null) {
            this._email = e.target.value;
            // filter to only the currently selected user
            // only one can be selected and target.value is the id, so [0] selects the first and only user
            const userInfo = this._results.filter(user => user._id === e.target.value)[0];
            // display results
            this._feedback = this.getProblems(userInfo.averageScore, userInfo.results)
            this.setLightsColor(userInfo.averageScore, true);
            this._data = JSON.stringify(userInfo.results.map(r => [r.name, r.score*100]));
          }
        })
      })
      .catch(() => console.log("Service unavailable"));
  }

  setLightsColor(avgScore, on) {
    if(on && avgScore < this._redLimit) {
      this.shadowRoot.getElementById('redLight').style.backgroundColor = 'red';
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = '#111';
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = '#111';
    } else if(on && avgScore < this._yellowLimit) {
      this.shadowRoot.getElementById('redLight').style.backgroundColor = '#111';
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = 'yellow';
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = '#111';
    } else if(on) { 
      this.shadowRoot.getElementById('redLight').style.backgroundColor = '#111';
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = '#111';
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = "green";
    } else {
      this.shadowRoot.getElementById('redLight').style.backgroundColor = '#111';
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = '#111';
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = '#111';
    }
  }

  getLightsColor(avgScore) {
    if(avgScore < this._redLimit) return 'red';
    else if(avgScore < this._yellowLimit) return 'yellow';
    else return 'green';
  }

  getProblems(avgScore, results) {
    this._courseDescription = results[0].description.split('\n')[0];
    var feedback;
    const feedbackList = this.shadowRoot.getElementById('feedbackList');
    feedbackList.innerText = '';
    if(avgScore < this._redLimit){
      
      results.forEach(r => {
        if(r.score < this._yellowLimit) {
          feedback = r.description.split('\n');
          feedbackList.innerHTML += `<li>${r.name}: ${feedback[1]}</li>\n`;
        }
      });
      //feedbackList.innerHTML = temp;
      return 'The student needs help. He has problems with following assignments:';
    } 
    else if(avgScore < this._yellowLimit){
      results.forEach(r => {
        if(r.score < this._yellowLimit) {
          feedback = r.description.split('\n');
          feedbackList.innerHTML += `<li>${r.name}: ${feedback[1]}</li>\n`;
        }
      });
      return 'The student may need some assisstens with following assignments: \n'.concat(feedback);
    }
    else return 'It seems, that the student doesn\'t need additional help.';
  }

  _updateLearningLocker() {
    fetch(`${this.moodleDataProxy}/${this._courseId}`, {method: 'POST'})
    .catch(() => console.log("Update failed"));
    const combos = this.shadowRoot.querySelectorAll('vaadin-combo-box');
    combos.forEach(comboBox => comboBox.value = '');
    combos[1].items = null;
    this._data = '[]';
    this.setEverythingToZero();
    this.fetchPersona();
    this.fetchStatements();;
    //location.reload();
  }
  
  handleLogin(event) {
    this._loginSub = event.detail.profile.sub;
    const uri = `${this.mcService}/${this._loginSub}/courseList`
    fetch(uri, {method: 'GET',
      'Content-Type': 'application/json'
    })
      .then(res => res.json())
      .then (json => {
        const combos = this.shadowRoot.querySelectorAll('vaadin-combo-box');
        const comboBox = combos[0];
        comboBox.items = json;
        comboBox.addEventListener('change', (e) => {
          this._courseURL = e.target.value;
          this._courseId = this._courseURL.split('id=').pop();
          combos[1].value = '';
          this.setEverythingToZero();
          this.fetchPersona();
          this.fetchStatements();;
        });
      });
  }

  setEverythingToZero() {
    this._greenUser = 0;
    this._yellowUser = 0;
    this._redUser = 0;
    this._avgScore = 0;
    this._email = '';
    this._courseDescription = '';
    this._feedback = '';
    this.setLightsColor(0, false);
    this.shadowRoot.getElementById('feedbackList').innerHTML = '';

  }

  handleLogout() {
    const combos = this.shadowRoot.querySelectorAll('vaadin-combo-box');
    combos.forEach(comboBox => {
      comboBox.value = '';
      comboBox.items = null;
    });
    this.setEverythingToZero();
    this._data = '[]';
  }

  encode(string) {
    var number = '';
    var length = string.length;
    for (var i = 0; i < length; i++)
        number += string.charCodeAt(i).toString(16);
    return number;
  }

}

window.customElements.define('my-view', MyView);
