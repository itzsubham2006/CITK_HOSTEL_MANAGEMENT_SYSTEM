'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Message {
  text: string
  sender: 'user' | 'bot'
}

export default function ChatbotPage() {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/chatbot')
      }
    })
  }, [router, supabase])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { text: trimmed, sender: 'user' }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { text: data.reply || 'No response', sender: 'bot' }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: '⚠️ AI service is temporarily unavailable.', sender: 'bot' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="container d-flex justify-content-center mt-4"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px' }}
      >
        <div
          className="card shadow"
          style={{
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            borderRadius: '15px',
            overflow: 'hidden',
          }}
        >
          <div
            className="card-header text-white d-flex align-items-center"
            style={{ background: '#68a86b', fontSize: '1.2rem', color: 'white', padding: '15px 20px', fontWeight: 600 }}
          >
            Hostel Assistant
          </div>

          <div
            className="card-body"
            id="chat-box"
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f5fdf6',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', margin: 'auto' }}>
                Start chatting with your hostel assistant...
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={m.sender === 'user' ? 'user-msg' : 'bot-msg'}
                >
                  {m.text}
                </div>
              ))
            )}
            {loading && (
              <div className="bot-msg" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                Typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div
            className="card-footer d-flex gap-2"
            style={{
              background: '#e8f5e9',
              borderRadius: '0 0 15px 15px',
              padding: '12px 15px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              id="msg"
              className="form-control"
              placeholder="Ask about hostel..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #c8e6c9',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
            <button
              className="btn btn-success"
              onClick={handleSend}
              disabled={loading}
              style={{
                backgroundColor: '#2e7d32',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="notice" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '18px', textAlign: 'center', color: '#2e7d32', marginBottom: '50px' }}>
          CITK AI Hostel Assistant
        </h2>
      </div>
    </>
  )
}
