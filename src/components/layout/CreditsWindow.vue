<script setup lang="ts">
import BevelButton from '@/components/ui/BevelButton.vue'
import RetroWindow from '@/components/ui/RetroWindow.vue'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'
import { playlistUrl, tokusato, videoCategories } from '@/data/tokusato'

const tumblr = [
  ['super-gif-taihen', 'https://super-gif-taihen.tumblr.com/'],
  ['yellowrabbitto', 'https://yellowrabbitto.tumblr.com/'],
  ['totally-addicted-to-twice', 'https://totally-addicted-to-twice.tumblr.com/'],
]

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <RetroWindow class="credits" title="CREDITS & RIGHTS" :icon="nf.bell" accent="var(--gold)" closable @close="emit('close')">
    <p class="lead">This is a non-commercial fan portfolio. Every trademark, character and video below belongs to its owners.</p>

    <section>
      <h3 class="pixel"><span class="nf">{{ nf.cookie }}</span> CHARACTERS &amp; IMAGES</h3>
      <p>Luckyuro &amp; <i>Zyuden Sentai Kyoryuger</i> © TOEI COMPANY, LTD.</p>
      <p class="dim">
        Clips and images (boot screen, TV, “open the cookie”) come from fan posts on Tumblr by
        <template v-for="([name, url], i) in tumblr" :key="name">
          <a :href="url" target="_blank" rel="noopener">{{ name }}</a>{{ i < tumblr.length - 1 ? ', ' : '' }}
        </template>
        and are used as a fan tribute.
      </p>
    </section>

    <section>
      <h3 class="pixel"><span class="nf">{{ nf.tv }}</span> TOKUSATO TV</h3>
      <p>{{ tokusato.rights }}.</p>
      <p class="dim">
        Every category is played with the official YouTube embed from the
        <a :href="tokusato.channelUrl" target="_blank" rel="noopener">{{ tokusato.channel }}</a> channel. Nothing is re-hosted on this
        site; views count for the channel. Playlists:
        <template v-for="(c, i) in videoCategories" :key="c.id">
          <a :href="playlistUrl(c)" target="_blank" rel="noopener">{{ c.title.toLowerCase() }}</a>{{ i < videoCategories.length - 1 ? ', ' : '.' }}
        </template>
      </p>
    </section>

    <section>
      <h3 class="pixel"><span class="nf">{{ nf.shell }}</span> TERMINAL</h3>
      <ul class="dim refs">
        <li>
          <b>gopher</b> — the Go gopher was designed by Renée French and is licensed under
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>
          (<a href="https://go.dev/blog/gopher" target="_blank" rel="noopener">go.dev/blog/gopher</a>). The ASCII is converted from the official
          artwork in <a href="https://github.com/golang/website/tree/master/_content/doc/gopher" target="_blank" rel="noopener">golang/website</a>.
        </li>
      </ul>
    </section>

    <section>
      <h3 class="pixel"><span class="nf">{{ nf.globe }}</span> DATA</h3>
      <p class="dim">
        Profile and repositories from the <a href="https://docs.github.com/rest" target="_blank" rel="noopener">GitHub API</a>; listening
        history from <a :href="profile.links.lastfm" target="_blank" rel="noopener">Last.fm</a>.
      </p>
    </section>

    <section>
      <h3 class="pixel"><span class="nf">{{ nf.code }}</span> FONTS</h3>
      <p class="dim">
        <a href="https://www.nerdfonts.com/" target="_blank" rel="noopener">Hack Nerd Font</a> (MIT / Bitstream Vera license) ·
        <a href="https://fonts.google.com/specimen/Press+Start+2P" target="_blank" rel="noopener">Press Start 2P</a> (SIL OFL) ·
        <a href="https://comicneue.com/" target="_blank" rel="noopener">Comic Neue</a> (SIL OFL).
      </p>
    </section>

    <p class="takedown">
      Own something shown here and want it removed? Reach me on
      <a :href="profile.links.github" target="_blank" rel="noopener">GitHub</a> or
      <a :href="profile.links.linkedin" target="_blank" rel="noopener">LinkedIn</a> and it goes away.
    </p>
    <BevelButton :icon="nf.back" @click="emit('close')">CLOSE</BevelButton>
  </RetroWindow>
</template>

<style scoped>
.credits {
  width: min(680px, 100%);
  max-height: calc(100vh - 2rem);
  overflow: auto;
}

.lead {
  margin: 0 0 1rem;
  color: var(--cream);
}

section {
  margin-bottom: 1rem;
  padding-left: 0.8rem;
  border-left: 3px solid var(--green-hi);
}

h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.4rem;
  font-size: 0.62rem;
  color: var(--gold);
}

h3 .nf {
  font-size: 0.95rem;
  color: var(--orange);
}

section p {
  margin: 0 0 0.3rem;
  font-size: 0.85rem;
}

.dim {
  color: var(--muted);
}

.refs {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.refs b {
  color: var(--cream);
}

.takedown {
  margin: 1.2rem 0 1rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.82rem;
  background: color-mix(in srgb, var(--orange) 12%, transparent);
  border-left: 4px solid var(--orange);
}
</style>
