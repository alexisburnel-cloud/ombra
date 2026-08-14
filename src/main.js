import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles/main.css';

import { App } from './core/App.js';

const app = new App(document.querySelector('#gl'));
window.__OMBRA = app;
