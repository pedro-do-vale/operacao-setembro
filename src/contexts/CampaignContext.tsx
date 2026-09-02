import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getActiveCampaign, subscribeToPlayer, subscribeToPlayers } from '../services/campaignService'
import type { Campaign, CampaignPlayer } from '../types'
import { comparePlayersForRanking } from '../utils/ranks'

interface CampaignContextValue {
  campaign: Campaign | null
  player: CampaignPlayer | null
  players: CampaignPlayer[]
  aliveCount: number
  ranking: CampaignPlayer[]
  playerRank: number
  loading: boolean
  refreshPlayer: () => void
}

const CampaignContext = createContext<CampaignContextValue>({
  campaign: null,
  player: null,
  players: [],
  aliveCount: 0,
  ranking: [],
  playerRank: 0,
  loading: true,
  refreshPlayer: () => {},
})

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [player, setPlayer] = useState<CampaignPlayer | null>(null)
  const [players, setPlayers] = useState<CampaignPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCampaign() {
      const c = await getActiveCampaign()
      if (!cancelled) {
        setCampaign(c)
        if (!c) setLoading(false)
      }
    }

    loadCampaign()
    return () => {
      cancelled = true
    }
  }, [firebaseUser])

  useEffect(() => {
    if (!campaign) return
    const unsub = subscribeToPlayers(campaign.id, setPlayers)
    return unsub
  }, [campaign])

  useEffect(() => {
    if (!campaign || !firebaseUser) {
      setPlayer(null)
      setLoading(false)
      return
    }
    const unsub = subscribeToPlayer(campaign.id, firebaseUser.uid, (p) => {
      setPlayer(p)
      setLoading(false)
    })
    return unsub
  }, [campaign, firebaseUser])

  const alivePlayers = useMemo(
    () => players.filter((p) => p.status === 'alive' || p.status === 'monk'),
    [players]
  )

  const ranking = useMemo(
    () => [...alivePlayers].sort(comparePlayersForRanking),
    [alivePlayers]
  )

  const playerRank = useMemo(() => {
    if (!player || player.status === 'fallen') return 0
    const idx = ranking.findIndex((p) => p.id === player.id)
    return idx >= 0 ? idx + 1 : 0
  }, [player, ranking])

  return (
    <CampaignContext.Provider
      value={{
        campaign,
        player,
        players,
        aliveCount: alivePlayers.length,
        ranking,
        playerRank,
        loading,
        refreshPlayer: () => {},
      }}
    >
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaign() {
  return useContext(CampaignContext)
}
