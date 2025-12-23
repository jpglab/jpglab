'use client'

// credit for base simulation mechanics: https://codepen.io/josev1207/pen/ZEdEmgQ

import {useEffect, useRef} from 'react'
import * as ChriscoursesPerlinNoise from '@chriscourses/perlin-noise'

export default function PerlinNoiseSimulation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Animation state
    const animationRef = useRef<number>(0)
    const inputValuesRef = useRef<any[][]>([])
    const zBoostValuesRef = useRef<any[][]>([])
    const mousePosRef = useRef({x: -99, y: -99})
    const zOffsetRef = useRef(0)
    const noiseMinRef = useRef(100)
    const noiseMaxRef = useRef(0)
    const currentThresholdRef = useRef(0)
    const colsRef = useRef(0)
    const rowsRef = useRef(0)

    // Editable values
    const thresholdIncrement = 6
    const thickLineThresholdMultiple = 3
    const res = 4 // Smaller resolution to fit more of the animation in view
    const baseZOffset = 0.0005
    const lineColor = '#3f3f46'
    const thinLineColor = '#52525b'
    const thickLineWidth = 3 // Thicker lines for pixel art
    const thinLineWidth = 2
    const mouseDown = true
    
    // Pixel art settings
    const pixelScale = 8 // Slightly smaller pixels while keeping retro look

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const setupCanvas = () => {
            const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect()
            // Dramatically reduce resolution for obvious pixelation
            const lowResWidth = Math.floor(rect.width / pixelScale)
            const lowResHeight = Math.floor(rect.height / pixelScale)
            
            canvas.width = lowResWidth
            canvas.height = lowResHeight
            canvas.style.width = rect.width + 'px'
            canvas.style.height = rect.height + 'px'
            
            // Disable anti-aliasing for crisp pixels
            ctx.imageSmoothingEnabled = false
            
            colsRef.current = Math.floor(canvas.width / res) + 1
            rowsRef.current = Math.floor(canvas.height / res) + 1

            // Initialize zBoostValues
            for (let y = 0; y < rowsRef.current; y++) {
                zBoostValuesRef.current[y] = []
                for (let x = 0; x <= colsRef.current; x++) {
                    zBoostValuesRef.current[y][x] = 0
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            // Scale mouse position to match the low-res canvas
            mousePosRef.current = {
                x: e.offsetX / pixelScale, 
                y: e.offsetY / pixelScale
            }
        }

        const handleResize = () => {
            setupCanvas()
        }

        const mouseOffset = () => {
            const mousePos = mousePosRef.current
            const x = Math.floor(mousePos.x / res)
            const y = Math.floor(mousePos.y / res)
            if (inputValuesRef.current[y] === undefined || inputValuesRef.current[y][x] === undefined) return

            const incrementValue = 0.0025
            const radius = 5
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    const distanceSquared = i * i + j * j
                    const radiusSquared = radius * radius

                    if (distanceSquared <= radiusSquared && zBoostValuesRef.current[y + i]?.[x + j] !== undefined) {
                        zBoostValuesRef.current[y + i][x + j] += incrementValue * (1 - distanceSquared / radiusSquared)
                    }
                }
            }
        }

        const generateNoise = () => {
            for (let y = 0; y < rowsRef.current; y++) {
                inputValuesRef.current[y] = []
                for (let x = 0; x <= colsRef.current; x++) {
                    inputValuesRef.current[y][x] =
                        ChriscoursesPerlinNoise.noise(
                            x * 0.08, // Increased scale to fit more noise in smaller canvas
                            y * 0.08, // Increased scale to fit more noise in smaller canvas
                            zOffsetRef.current + zBoostValuesRef.current[y]?.[x]
                        ) * 100
                    if (inputValuesRef.current[y][x] < noiseMinRef.current)
                        noiseMinRef.current = inputValuesRef.current[y][x]
                    if (inputValuesRef.current[y][x] > noiseMaxRef.current)
                        noiseMaxRef.current = inputValuesRef.current[y][x]
                    if (zBoostValuesRef.current[y]?.[x] > 0) {
                        zBoostValuesRef.current[y][x] *= 0.99
                    }
                }
            }
        }

        const line = (from: number[], to: number[]) => {
            ctx.moveTo(from[0], from[1])
            ctx.lineTo(to[0], to[1])
        }

        const linInterpolate = (x0: number, x1: number, y0 = 0, y1 = 1) => {
            if (x0 === x1) {
                return 0
            }
            return y0 + ((y1 - y0) * (currentThresholdRef.current - x0)) / (x1 - x0)
        }

        const binaryToType = (nw: any, ne: any, se: any, sw: any) => {
            let a = [nw, ne, se, sw]
            return a.reduce((res: number, x: number) => (res << 1) | x)
        }

        const placeLines = (gridValue: number, x: number, y: number) => {
            let nw = inputValuesRef.current[y][x]
            let ne = inputValuesRef.current[y][x + 1]
            let se = inputValuesRef.current[y + 1][x + 1]
            let sw = inputValuesRef.current[y + 1][x]
            let a, b, c, d

            switch (gridValue) {
                case 1:
                case 14:
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, c)
                    break
                case 2:
                case 13:
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    line(b, c)
                    break
                case 3:
                case 12:
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, b)
                    break
                case 11:
                case 4:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    line(a, b)
                    break
                case 5:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, a)
                    line(c, b)
                    break
                case 6:
                case 9:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    line(c, a)
                    break
                case 7:
                case 8:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, a)
                    break
                case 10:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(a, b)
                    line(c, d)
                    break
                default:
                    break
            }
        }

        const renderAtThreshold = () => {
            ctx.beginPath()
            const isThickLine = currentThresholdRef.current % (thresholdIncrement * thickLineThresholdMultiple) === 0
            ctx.strokeStyle = isThickLine ? lineColor : thinLineColor
            ctx.lineWidth = isThickLine ? thickLineWidth : thinLineWidth
            
            // Ensure crisp pixel edges
            ctx.lineCap = 'square'
            ctx.lineJoin = 'miter'

            for (let y = 0; y < inputValuesRef.current.length - 1; y++) {
                for (let x = 0; x < inputValuesRef.current[y].length - 1; x++) {
                    if (
                        inputValuesRef.current[y][x] > currentThresholdRef.current &&
                        inputValuesRef.current[y][x + 1] > currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x + 1] > currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x] > currentThresholdRef.current
                    )
                        continue
                    if (
                        inputValuesRef.current[y][x] < currentThresholdRef.current &&
                        inputValuesRef.current[y][x + 1] < currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x + 1] < currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x] < currentThresholdRef.current
                    )
                        continue

                    let gridValue = binaryToType(
                        inputValuesRef.current[y][x] > currentThresholdRef.current ? 1 : 0,
                        inputValuesRef.current[y][x + 1] > currentThresholdRef.current ? 1 : 0,
                        inputValuesRef.current[y + 1][x + 1] > currentThresholdRef.current ? 1 : 0,
                        inputValuesRef.current[y + 1][x] > currentThresholdRef.current ? 1 : 0
                    )

                    placeLines(gridValue, x, y)
                }
            }
            ctx.stroke()
        }

        const animate = () => {
            animationRef.current = requestAnimationFrame(() => animate())

            if (mouseDown) {
                mouseOffset()
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            zOffsetRef.current += baseZOffset
            generateNoise()

            const roundedNoiseMin = Math.floor(noiseMinRef.current / thresholdIncrement) * thresholdIncrement
            const roundedNoiseMax = Math.ceil(noiseMaxRef.current / thresholdIncrement) * thresholdIncrement
            for (let threshold = roundedNoiseMin; threshold < roundedNoiseMax; threshold += thresholdIncrement) {
                currentThresholdRef.current = threshold
                renderAtThreshold()
            }
            noiseMinRef.current = 100
            noiseMaxRef.current = 0
        }

        setupCanvas()
        canvas.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('resize', handleResize)
        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            canvas.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain"
            style={{
                imageRendering: 'pixelated',
                filter: 'contrast(1.2) saturate(1.3)',
                WebkitImageRendering: 'pixelated',
                MozImageRendering: 'crisp-edges',
            } as React.CSSProperties} 
        />
    )
}
