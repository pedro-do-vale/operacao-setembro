import { useEffect, useState } from 'react'
import { useCampaign } from '../contexts/CampaignContext'
import { subscribeToFeed, formatFeedMessage } from '../services/feedService'
import { SupportRequestCard } from '../components/SupportRequestCard'
import { subscribeToSupportRequests } from '../services/supportService'
import type { FeedEvent, SupportRequest } from '../types'
import { formatRelativeTime } from '../utils/dates'

export function FeedPage() {
  const { campaign } = useCampaign()
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])

  useEffect(() => {
    if (!campaign) return
    const unsubFeed = subscribeToFeed(campaign.id, setEvents)
    const unsubSupport = subscribeToSupportRequests(campaign.id, setSupportRequests)
    return () => {
      unsubFeed()
      unsubSupport()
    }
  }, [campaign])

  const supportRequestMap = Object.fromEntries(supportRequests.map((r) => [r.id, r]))

  return (
    <div className="page feed-page">
      <header className="page-header">
        <h1>📜 FEED</h1>
        <p className="page-header__subtitle">Acontecimentos da campanha</p>
      </header>

      <div className="feed-list">
        {events.map((event) => {
          if (event.type === 'SUPPORT_REQUEST') {
            const requestId = event.data.requestId as string
            const request = supportRequestMap[requestId]
            if (request) {
              return <SupportRequestCard key={event.id} request={request} />
            }
          }

          return (
            <div key={event.id} className={`feed-item feed-item--${event.type.toLowerCase()}`}>
              <p className="feed-item__message">{formatFeedMessage(event)}</p>
              <span className="feed-item__time">{formatRelativeTime(event.createdAt)}</span>
            </div>
          )
        })}
      </div>

      {events.length === 0 && (
        <p className="empty-state">Nenhum evento ainda. A batalha está começando...</p>
      )}
    </div>
  )
}
