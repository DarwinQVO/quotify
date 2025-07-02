import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Tauri API
Object.defineProperty(window, '__TAURI__', {
  value: {
    shell: {
      open: vi.fn()
    },
    invoke: vi.fn()
  }
})

// Mock react-player
vi.mock('react-player', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'react-player' }))
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span'
  },
  AnimatePresence: ({ children }: any) => children
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))