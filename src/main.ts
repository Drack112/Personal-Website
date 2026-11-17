import { createApp } from 'vue'

import { printConsoleEgg } from '@/lib/consoleEgg'
import '@/styles/index.css'

import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
printConsoleEgg()
