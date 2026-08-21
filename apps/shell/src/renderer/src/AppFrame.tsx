import { useEffect, useState } from 'react'
import { Home } from './Home'
import { Onboarding } from './Onboarding'
import { SettingsModal } from './SettingsModal'
import { TabBar } from './TabBar'

interface AppFrameProps {
  /** resolved before first paint (main.tsx) so home never flashes under the overlay */
  initialOnboardingSeen: boolean
}

const RENDERER_URLS: Record<string, string> = {
  docs: 'http://localhost:5173',
  sheets: 'http://localhost:5174',
  slides: 'http://localhost:5175',
  pdf: 'http://localhost:5176',
  markdown: 'http://localhost:5177',
}

export function AppFrame({ initialOnboardingSeen }: AppFrameProps) {
  const [homeActive, setHomeActive] = useState(true)
  const [activeTabKind, setActiveTabKind] = useState<string>('home')
  const [activeTabTitle, setActiveTabTitle] = useState<string>('Home')
  const [showOnboarding, setShowOnboarding] = useState(!initialOnboardingSeen)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    const applyTabs = (tabs: Awaited<ReturnType<typeof window.aiOfficeTabs.list>>) => {
      const active = tabs.find((tab) => tab.active)
      const kind = active?.kind || 'home'
      setActiveTabKind(kind)
      setActiveTabTitle(active?.title || 'Editor')
      setHomeActive(!active || kind === 'home')
    }
    void window.aiOfficeTabs.list().then(applyTabs)
    return window.aiOfficeTabs.onChanged(applyTabs)
  }, [])

  useEffect(() => {
    const handleOpenSettings = () => setShowSettingsModal(true)
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'open-ai-settings') {
        setShowSettingsModal(true)
      }
    }
    window.addEventListener('open-ai-settings', handleOpenSettings)
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('open-ai-settings', handleOpenSettings)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const finishOnboarding = () => {
    setShowOnboarding(false)
    void window.aiOffice?.setOnboardingSeen?.().catch(() => {})
  }

  const isBrowserMode = !(window as any).electron
  const activeUrl = RENDERER_URLS[activeTabKind] || 'http://localhost:5173'

  return (
    <div className="app-frame" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TabBar />
      <div className="app-frame-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', display: homeActive ? 'block' : 'none' }}>
          <Home />
        </div>
        {isBrowserMode && !homeActive && (
          <iframe
            src={activeUrl}
            title={activeTabTitle}
            style={{ width: '100%', height: '100%', border: 'none', background: '#1e1e1e' }}
          />
        )}
      </div>
      {showOnboarding && homeActive && <Onboarding onDone={finishOnboarding} />}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  )
}
