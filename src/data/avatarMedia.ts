export interface AvatarMediaConfig {
  posterSrc: string;
  firstVideoSrc: string;
  hoverVideoSrc: string;
  ambientVideoSrcs: string[];
  mediaFilter?: string;
}

export const AVATAR_MEDIA = {
  ludo: {
    posterSrc: '/assets/img/ludo-avatar.webp',
    firstVideoSrc: '/assets/video/avatar/avatar-about-first.mp4',
    hoverVideoSrc: '/assets/video/avatar/avatar-dog-happy-owner.mp4',
    ambientVideoSrcs: [
      '/assets/video/avatar/avatar-dog-angry.mp4',
      '/assets/video/avatar/avatar-dog-curious-ear.mp4',
      '/assets/video/avatar/avatar-wind-hair.mp4',
      '/assets/video/avatar/avatar-dog-look-right-a.mp4',
      '/assets/video/avatar/avatar-dog-look-right-b.mp4',
    ],
  },
  krayorn: {
    posterSrc: '/assets/img/krayorn-avatar.webp',
    firstVideoSrc: '/assets/video/avatar/avatar-krayorn-look-down.mp4',
    hoverVideoSrc: '/assets/video/avatar/avatar-krayorn-laugh.mp4',
    ambientVideoSrcs: [
      '/assets/video/avatar/avatar-krayorn-look-down.mp4',
      '/assets/video/avatar/avatar-krayorn-look-right.mp4',
    ],
    mediaFilter: 'saturate(1.08) contrast(1.02)',
  },
} satisfies Record<'ludo' | 'krayorn', AvatarMediaConfig>;
