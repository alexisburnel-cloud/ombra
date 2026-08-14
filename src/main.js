import '@fontsource/fraunces/300.css';
import '@fontsource/fraunces/300-italic.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/archivo/300.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles/main.css';

import { App } from './core/App.js';

const app = new App(document.querySelector('#gl'));
window.__CARENE = app;
