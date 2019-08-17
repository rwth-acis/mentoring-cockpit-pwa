[![Built with pwa–starter–kit](https://img.shields.io/badge/built_with-pwa–starter–kit_-blue.svg)](https://github.com/Polymer/pwa-starter-kit/tree/template-no-redux "Built with pwa–starter–kit")


# Mentoring Cockpit PWA
This is the Mentoring Cockpit app to help tutors personalized feedback to students. It is built using the [PWA Starter Kit](https://github.com/Polymer/pwa-starter-kit/tree/template-no-redux), using the default template as the starting point and the [wiki](https://pwa-starter-kit.polymer-project.org) for configuring and personalizing.
This repository is part of the bachelor thesis 'A Multimodal Mentoring Cockpit for Tutor Support'.

## Features/highlights
- the application state is stored and loaded from `localStorage`, so that the last requested data and the student statistics are persisted across refreshes
- uses the [Mentoring Cockpit Service](https://github.com/rwth-acis/mentoring-cockpit-service) to get relevant student data from [Learning Locker](https://www.ht2labs.com/learning-locker-community/overview)
- the actual student data is loaded from arbitrary `json` files, so the app can be extended to work for any Learning Record Store (LRS)
- the login utilizes the [las2peer-frontend-statusbar](https://github.com/rwth-acis/las2peer-frontend-statusbar) -- therefore, set up the OpenId Connect Functionality properties in the [property](etc/config.properties) file

## Setup

To set up the data and login connection configure the [property](etc/config.properties) file.
```INI
mcService = http://example-mentoring-cockpit-service-address
moodleDataProxy = http://exampleMoodleDataProxyAddress
las2peerBaseURL = http://examplelas2peerBaseURL
oidcclientid = example-client
```

To test the app locally run:
```
npm install
polymer serve
```
To run the tests, you can run `npm run test`.

To build the app for production
```
polymer build
polymer serve build/<your_build_name>
```
Replace *<your_build_name>* with a production-ready build in the generated build folder.

## How to run using Docker

First build the image:
```bash
docker build . -t mentoring-cockpit-pwa
```

Then you can run the image like this:

```bash
docker run -it --rm --name polymer -p 8081:8081 mentoring-cockpit-pwa
```
The app is then accessable on localhost:8081