import '@fontsource/press-start-2p'
import '@fontsource/comic-neue/400.css'
import '@fontsource/comic-neue/700.css'
import './styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { printConsoleEgg } from './lib/consoleEgg'

createApp(App).use(router).mount('#app')
printConsoleEgg()
