import { AvatarRenderer } from './AvatarRenderer'
import type { AvatarConfig, PlayerStatus } from '../types'

const EMBER_COUNT = 12

interface ProfileHeroProps {
  nickname: string
  avatarConfig: AvatarConfig
  rankId: string
  status?: PlayerStatus
}

export function ProfileHero({
  nickname,
  avatarConfig,
  rankId,
  status = 'alive',
}: ProfileHeroProps) {
  return (
    <div
      className={`profile-hero ${status === 'fallen' ? 'profile-hero--fallen' : ''}`}
      aria-label={`Personagem ${nickname}`}
    >
      <div className="profile-hero__halo" />
      <div className="profile-hero__embers" aria-hidden="true">
        {Array.from({ length: EMBER_COUNT }, (_, index) => (
          <span
            key={index}
            className={`profile-hero__ember profile-hero__ember--${index + 1}`}
          />
        ))}
      </div>
      <AvatarRenderer
        avatarConfig={avatarConfig}
        rankId={rankId}
        status={status}
        size="xl"
        className="profile-hero__avatar"
      />
      <div className="profile-hero__ground" />
    </div>
  )
}
