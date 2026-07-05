import type React from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--width': '40rem',
          // Radix Dialog/Sheet sets `pointer-events: none` on <body> while a
          // modal is open; without this the toast portal inherits that and
          // becomes unclickable behind an open dialog/sheet.
          pointerEvents: 'auto',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
