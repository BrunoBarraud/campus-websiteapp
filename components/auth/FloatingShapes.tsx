"use client"

import { useEffect, useState } from "react"

interface Shape {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
}

export function FloatingShapes() {
  const [shapes, setShapes] = useState<Shape[]>([])

  useEffect(() => {
    const generated: Shape[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 150 + 50,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 15,
      opacity: Math.random() * 0.08 + 0.03,
    }))
    setShapes(generated)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute rounded-full"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            opacity: shape.opacity,
            backgroundColor: 'var(--primary)',
            animation: `float ${shape.duration}s ease-in-out infinite`,
            animationDelay: `${shape.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          25% {
            transform: translateY(-30px) translateX(15px) scale(1.05);
          }
          50% {
            transform: translateY(-15px) translateX(-10px) scale(0.95);
          }
          75% {
            transform: translateY(-40px) translateX(5px) scale(1.02);
          }
        }
      `}</style>
    </div>
  )
}
