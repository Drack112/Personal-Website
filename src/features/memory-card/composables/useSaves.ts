import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useGithub } from '@/composables/useGithub'
import { fallbackIcon, languageIcon } from '@/data/icons'
import { experience, featuredRepos } from '@/data/profile'

import { kb, months, stamp, ym, type Media, type Save, type Slot } from '../saves'

const CAREER_MEDIA: Media[] = ['tape', 'cart', 'disc', 'floppy']

const featuredOrder = Object.keys(featuredRepos)

export function useSaves(slot: MaybeRefOrGetter<Slot>) {
  const { repos } = useGithub()

  const githubSaves = computed<Save[]>(() =>
    [...repos.value]
      .sort((a, b) => {
        const ai = featuredOrder.indexOf(a.name)
        const bi = featuredOrder.indexOf(b.name)

        if (ai !== -1 || bi !== -1) {
          return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
        }

        return b.pushed_at.localeCompare(a.pushed_at)
      })
      .map((repo) => {
        const icon = languageIcon[repo.language ?? ''] || fallbackIcon

        return {
          id: repo.name,
          label: repo.name.replaceAll('-', ' '),
          glyph: icon.glyph,
          color: icon.color,
          badge: repo.stargazers_count ? `★${repo.stargazers_count}` : undefined,
          date: stamp(repo.pushed_at),
          size: kb(repo.size),
          repo,
        }
      }),
  )

  const careerSaves = computed<Save[]>(() =>
    experience.map((job, index) => ({
      id: job.id,
      label: job.company,
      glyph: job.icon,
      color: job.color,
      media: CAREER_MEDIA[index % CAREER_MEDIA.length],
      badge: job.end ? undefined : 'NOW',
      date: `${ym(job.start)} – ${job.end ? ym(job.end) : 'present'}`,
      size: months(job.start, job.end),
      job,
    })),
  )

  const saves = computed(() =>
    toValue(slot) === 'github' ? githubSaves.value : careerSaves.value,
  )

  const used = computed(() =>
    toValue(slot) === 'github'
      ? `${kb(repos.value.reduce((total, repo) => total + repo.size, 0))} used`
      : `${months(experience[experience.length - 1]?.start ?? '', null)} of saves`,
  )

  return { saves, used }
}
