import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const YT_ENDED = 0
const YT_PLAYING = 1
const YT_CUED = 5
const HELLO_MS = 500
const MAX_HELLOS = 20

interface PlayerMessage {
  event?: string
  info?: { currentTime?: number; playerState?: number } | number
}

export const withPlayerApi = (url: string) =>
  `${url}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`

export function useYoutubePlayer(frame: Ref<HTMLIFrameElement | undefined>, key: () => string) {
  const playTime = ref<number | null>(null)
  const playing = ref(false)
  let listenTimer = 0

  function listen() {
    window.clearInterval(listenTimer)
    let tries = 0
    const hello = () => {
      frame.value?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: key(), channel: 'widget' }), '*')
      if (++tries > MAX_HELLOS) window.clearInterval(listenTimer)
    }
    hello()
    listenTimer = window.setInterval(hello, HELLO_MS)
  }

  function onMessage(e: MessageEvent) {
    if (!frame.value || e.source !== frame.value.contentWindow || typeof e.data !== 'string') return
    let msg: PlayerMessage
    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }
    window.clearInterval(listenTimer)
    const info = msg.info
    if (msg.event !== 'infoDelivery' && msg.event !== 'initialDelivery') return
    if (typeof info !== 'object' || !info) return
    if (info.playerState !== undefined) playing.value = info.playerState === YT_PLAYING
    if (info.currentTime !== undefined && (info.currentTime > 0 || playing.value)) playTime.value = info.currentTime
    if (info.playerState === YT_ENDED || info.playerState === YT_CUED) playTime.value = null
  }

  function reset() {
    window.clearInterval(listenTimer)
    playTime.value = null
    playing.value = false
  }

  onMounted(() => window.addEventListener('message', onMessage))
  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
    window.clearInterval(listenTimer)
  })

  return { playTime, playing, listen, reset }
}
