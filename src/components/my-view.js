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
      _loginSub: { type: String}
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
        baseurl="http://tech4comp.dbis.rwth-aachen.de:30014"
        oidcpopupsigninurl="http://127.0.0.1:8081/node_modules/las2peer-frontend-statusbar/callbacks/popup-signin-callback.html"
        oidcpopupsignouturl="http://127.0.0.1:8081/node_modules/las2peer-frontend-statusbar/callbacks/popup-signout-callback.html"
        oidcsilentsigninturl="http://127.0.0.1:8081/node_modules/las2peer-frontend-statusbar/callbacks/silent-callback.html"
        oidcclientid="b63cfd8b-9cd2-4c87-9dce-4e6ed90d2d45"
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
      <a href="${this._email}">${this._email}</a>
      
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
    `
  }

  constructor() {
    super();
    //his._courseId = 3;
    this._data = '[]';
    //this.fetchPersona();
    //this.fetchStatements();
  }

  fetchStatements() {
    //aggregation http interface
    //TODO login with token
    const courseURL_Encoded = this.encode(this._courseURL);
    const uri = `http://137.226.232.175:31016/mentoring/${this._loginSub}/${courseURL_Encoded}/results`;
    fetch(uri, {method: 'GET',
      'Content-Type': 'application/json'
    })
      .then(res => res.json())
      .then(json => this._results = json)
      .catch(() => console.log("Service unavailable"));
  }

  fetchPersona() {
    //aggregation http interface
    //TODO login with token
    const courseURL_Encoded = this.encode(this._courseURL);
    const uri = `http://137.226.232.175:31016/mentoring/${this._loginSub}/${courseURL_Encoded}/students`;
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
            this.setLightsColor(userInfo.averageScore, true);
            this._data = JSON.stringify(userInfo.results.map(r => [r.name, r.score*100]));
            //console.log(temp);
          }
        })
      })
      .catch(() => console.log("Service unavailable"));
  }

  setLightsColor(avgScore, on) {
    if(on && avgScore < 0.5) {
      this.shadowRoot.getElementById('redLight').style.backgroundColor = "red";
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = "#111";
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = "#111";
    } else if(on && avgScore < 0.6) {
      this.shadowRoot.getElementById('redLight').style.backgroundColor = "#111";
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = "yellow";
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = "#111";
    } else if(on) { 
      this.shadowRoot.getElementById('redLight').style.backgroundColor = "#111";
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = "#111";
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = "green";
    } else {
      this.shadowRoot.getElementById('redLight').style.backgroundColor = "#111";
      this.shadowRoot.getElementById('yellowLight').style.backgroundColor = "#111";
      this.shadowRoot.getElementById('greenLight').style.backgroundColor = "#111";
    }
  }

  _updateLearningLocker() {
    fetch(`http://tech4comp.dbis.rwth-aachen.de:31012/mc/moodle-data/${this._courseId}`, {method: 'POST'})
    .catch(() => console.log("Update failed"));
    const combos = this.shadowRoot.querySelectorAll('vaadin-combo-box');
    combos.forEach(comboBox => comboBox.value = '');
    combos[1].items = null;
    this._email = '';
    this.setLightsColor(0, false);
    this._data = '[]';

    this.fetchPersona();
    this.fetchStatements();;
    //location.reload();
  }
  
  handleLogin(event) {
    this._loginSub = event.detail.profile.sub;
    const uri = `http://137.226.232.175:31016/mentoring/${this._loginSub}/courseList`
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
          this.fetchPersona();
          this.fetchStatements();;
        });
      });
  }

  handleLogout() {
    //console.log('test');
    const combos = this.shadowRoot.querySelectorAll('vaadin-combo-box');
    combos.forEach(comboBox => {
      comboBox.value = '';
      comboBox.items = null;
    });
    this._email = '';
    this.setLightsColor(0, false);
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
