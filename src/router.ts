import { createRouter, createWebHistory } from 'vue-router'
import type { Hint } from '@/components/layout/ControlHints.vue'
import MenuView from '@/views/MenuView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    accent?: string
    hints?: Hint[]
  }
}

const back: Hint = { button: '○', key: 'Esc', label: 'Back' }
const enter: Hint = { button: '✕', key: 'Enter', label: 'Select' }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'boot',
      component: () => import('@/views/BootView.vue'),
      meta: { title: 'BOOT' },
      beforeEnter: () => (sessionStorage.getItem('lk.booted') ? '/menu' : true),
    },
    {
      path: '/menu',
      name: 'menu',
      component: MenuView,
      meta: { title: 'MAIN MENU', accent: '#A9DC88', hints: [{ button: '□', key: '`', label: 'Terminal' }, { button: '△', key: '↑↓', label: 'Move' }, enter] },
    },
    {
      path: '/memory-card/:slot?',
      name: 'memory-card',
      component: () => import('@/views/MemoryCardView.vue'),
      meta: {
        title: 'MEMORY CARD',
        accent: '#A9DC88',
        hints: [{ button: '□', key: 'Tab', label: 'Switch card' }, { button: '△', key: '←↑→↓', label: 'Move' }, { ...enter, label: 'Load save' }, back],
      },
    },
    {
      path: '/system/:tab?',
      name: 'system',
      component: () => import('@/views/SystemView.vue'),
      meta: { title: 'SYSTEM CONFIGURATION', accent: '#FEF274', hints: [{ button: '□', key: '1-4', label: 'Tabs' }, back] },
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('@/views/MusicView.vue'),
      meta: { title: 'MUSIC', accent: '#CB6E1B', hints: [back] },
    },
    {
      path: '/video/:cat?',
      name: 'video',
      component: () => import('@/views/VideoView.vue'),
      meta: {
        title: 'VIDEO',
        accent: '#F3EBD3',
        hints: [{ button: '□', key: '↑↓', label: 'Category' }, { button: '△', key: '←→', label: 'Episode' }, { button: '✕', key: 'P', label: 'Power' }, back],
      },
    },
    { path: '/:pathMatch(.*)*', redirect: '/menu' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
