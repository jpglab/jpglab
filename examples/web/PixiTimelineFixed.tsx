import React, { useEffect, useRef, useCallback, useState, useLayoutEffect } from 'react'
import { Application, Container, Graphics, Sprite, Text, TextStyle, Assets, Texture } from 'pixi.js'

export interface CapturedFrame {
    imageBitmap: ImageBitmap
    timestamp: number
    settings: {
        aperture: string
        shutterSpeed: string
        iso: string
        liveViewImageQuality: string
    }
}

export interface AudioSample {
    timestamp: number
    audioBuffer: AudioBuffer
}

interface PixiTimelineProps {
    capturedFrames: CapturedFrame[]
    capturedAudio: AudioSample[]
    realtimeAudioData: Float32Array[]
    isRecording: boolean
    currentFrameIndex: number
    clipTrimStart: number
    clipTrimEnd: number
    timelineZoom: number
    onScrubTimeline: (frameIndex: number) => void
    setClipTrimStart: (value: number) => void
    setClipTrimEnd: (value: number) => void
}

// Viewport class for coordinate transformation with scrolling
class TimelineViewport {
    x: number = 0
    y: number = 0
    width: number = 0
    height: number = 0
    zoom: number = 1
    offsetX: number = 0
    offsetY: number = 0
    
    constructor(width: number, height: number, zoom: number, offsetX: number = 0, offsetY: number = 0) {
        this.width = width
        this.height = height
        this.zoom = zoom
        this.offsetX = offsetX
        this.offsetY = offsetY
        this.x = offsetX
        this.y = offsetY
    }
    
    canvasToUser(canvasX: number, canvasY: number): { x: number; y: number } {
        return {
            x: canvasX + this.offsetX,
            y: canvasY + this.offsetY
        }
    }
    
    userToCanvas(userX: number, userY: number): { x: number; y: number } {
        return {
            x: userX - this.offsetX,
            y: userY - this.offsetY
        }
    }
    
    isVisible(x: number, width: number): boolean {
        const viewportStart = this.offsetX
        const viewportEnd = this.offsetX + this.width
        return x + width >= viewportStart && x <= viewportEnd
    }
    
    getVisibleBounds(x: number, width: number): { x: number; width: number; clipStart: number; clipEnd: number } {
        const viewportStart = this.offsetX
        const viewportEnd = this.offsetX + this.width
        
        const startX = Math.max(x, viewportStart)
        const endX = Math.min(x + width, viewportEnd)
        const visibleWidth = Math.max(0, endX - startX)
        
        return {
            x: startX,
            width: visibleWidth,
            clipStart: Math.max(0, (startX - x) / width),
            clipEnd: Math.min(1, (endX - x) / width)
        }
    }
    
    getMaxScrollX(contentWidth: number): number {
        return Math.max(0, contentWidth - this.width)
    }
}

export const PixiTimeline: React.FC<PixiTimelineProps> = ({
    capturedFrames,
    capturedAudio,
    realtimeAudioData,
    isRecording,
    currentFrameIndex,
    clipTrimStart,
    clipTrimEnd,
    timelineZoom,
    onScrubTimeline,
    setClipTrimStart,
    setClipTrimEnd
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 })
    const [needsScrollbar, setNeedsScrollbar] = useState(false)
    
    // Drag state
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
    const [isDraggingLeftTrim, setIsDraggingLeftTrim] = useState(false)
    const [isDraggingRightTrim, setIsDraggingRightTrim] = useState(false)
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0 })
    
    // Performance caching
    const viewportRef = useRef({ x: 0, y: 0, width: 0, height: 0, offsetX: 0, offsetY: 0 })
    const lastRenderParams = useRef({ 
        capturedFrames: 0, 
        currentFrameIndex: -1, 
        clipTrimStart: -1, 
        clipTrimEnd: -1, 
        timelineZoom: -1, 
        offsetX: -1,
        screenWidth: 0,
        screenHeight: 0
    })
    
    // Caches
    const thumbnailCacheRef = useRef<Map<number, { texture: Texture; timestamp: number }>>(new Map())
    const waveformCacheRef = useRef<{ data: number[] | null; audioLength: number; width: number }>({ data: null, audioLength: 0, width: 0 })
    
    // Timeline dimensions - match canvas implementation exactly
    const TRACK_LABEL_WIDTH = 64
    const VIDEO_TRACK_HEIGHT = 80
    const AUDIO_TRACK_HEIGHT = 80
    const TOTAL_HEIGHT = VIDEO_TRACK_HEIGHT + AUDIO_TRACK_HEIGHT
    const TIMECODE_HEIGHT = 40
    const TOP_PADDING = TIMECODE_HEIGHT
    
    // Calculate timeline duration with constraints (30 seconds minimum, 1 hour maximum)
    const calculateTimelineDuration = (frameCount: number) => {
        const minTimelineDuration = 30
        const maxTimelineDuration = 3600
        const actualDuration = frameCount > 0 ? frameCount / 30 : minTimelineDuration
        return Math.max(minTimelineDuration, Math.min(maxTimelineDuration, actualDuration))
    }
    
    // Main render function - remove useCallback to avoid stale closures
    const renderTimeline = () => {
        const app = appRef.current
        if (!app) return
        
        const rect = { width: app.screen.width, height: app.screen.height }
        
        // Calculate timeline dimensions
        const timelineDuration = calculateTimelineDuration(capturedFrames.length)
        const timelineWidth = timelineDuration * 100 * timelineZoom
        const clipWidth = capturedFrames.length > 0 ? (capturedFrames.length / 30) * 100 * timelineZoom : 0
        
        
        // Create viewport
        const viewport = new TimelineViewport(rect.width, rect.height, timelineZoom, viewportOffset.x, viewportOffset.y)
        
        // Check if we need to re-render (performance optimization)
        const currentParams = {
            capturedFrames: capturedFrames.length,
            currentFrameIndex,
            clipTrimStart,
            clipTrimEnd,
            timelineZoom,
            offsetX: viewportOffset.x,
            screenWidth: rect.width,
            screenHeight: rect.height
        }
        
        // Custom comparison with tolerance for offsetX to prevent micro-scroll re-renders
        const OFFSET_TOLERANCE = 2 // pixels - only re-render if offset changes by more than this
        const paramsChanged = Object.keys(currentParams).some(key => {
            const current = currentParams[key as keyof typeof currentParams]
            const last = lastRenderParams.current[key as keyof typeof currentParams]
            
            // Special handling for offsetX with tolerance
            if (key === 'offsetX') {
                return Math.abs(current - last) > OFFSET_TOLERANCE
            }
            
            // Standard comparison for other parameters
            return current !== last
        })
        
        // Skip render if nothing changed
        if (!paramsChanged) {
            return
        }
        
        
        lastRenderParams.current = currentParams
        
        // Clear stage
        app.stage.removeChildren()
        
        // Create main container
        const mainContainer = new Container()
        app.stage.addChild(mainContainer)
        
        // Draw background tracks
        const trackBg = new Graphics()
        trackBg.rect(0, TOP_PADDING, rect.width, TOTAL_HEIGHT)
        trackBg.fill({ color: 0x000000, alpha: 0.6 })
        mainContainer.addChild(trackBg)
        
        // Draw timecode ruler background
        const rulerBg = new Graphics()
        rulerBg.rect(0, 0, rect.width, TIMECODE_HEIGHT)
        rulerBg.fill({ color: 0x000000, alpha: 0.3 })
        mainContainer.addChild(rulerBg)
        
        // Draw ruler system - major ticks with framerate subdivisions
        const fps = 30
        const pixelsPerSecond = 100 * timelineZoom
        
        // Calculate appropriate major tick interval
        const visibleTimelineWidth = rect.width - TRACK_LABEL_WIDTH
        const visibleDurationSeconds = visibleTimelineWidth / pixelsPerSecond
        const targetMajorTicks = 6
        const rawMajorInterval = visibleDurationSeconds / targetMajorTicks
        
        // Simplified intervals
        const logicalIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600]
        
        let majorIntervalSeconds = logicalIntervals[logicalIntervals.length - 1]
        for (const interval of logicalIntervals) {
            if (interval >= rawMajorInterval) {
                majorIntervalSeconds = interval
                break
            }
        }
        
        // Calculate visible range
        const visibleStartSecond = Math.max(0, (viewport.offsetX - TRACK_LABEL_WIDTH) / pixelsPerSecond)
        const visibleEndSecond = Math.min(timelineDuration, (viewport.offsetX + rect.width - TRACK_LABEL_WIDTH) / pixelsPerSecond)
        
        // Always start from the beginning of the timeline to ensure complete ruler coverage
        const firstMajorTick = 0
        
        const rulerGraphics = new Graphics()
        
        for (let majorSecond = firstMajorTick; majorSecond <= timelineDuration; majorSecond += majorIntervalSeconds) {
            const majorWorldX = TRACK_LABEL_WIDTH + (majorSecond * pixelsPerSecond)
            const majorScreenX = majorWorldX - viewport.offsetX
            
            // Major tick - top aligned, 1px width (always render)
            rulerGraphics.moveTo(majorScreenX, 0)
            rulerGraphics.lineTo(majorScreenX, 16)
            rulerGraphics.stroke({ color: 0x6366f1, alpha: 0.9, width: 1 })
            
            // Only render timecode text if visible on screen
            if (majorScreenX >= -50 && majorScreenX <= rect.width + 50) {
                const totalSeconds = Math.floor(majorSecond)
                const frames = Math.floor((majorSecond - totalSeconds) * 30)
                const hours = Math.floor(totalSeconds / 3600)
                const minutes = Math.floor((totalSeconds % 3600) / 60)
                const secs = totalSeconds % 60
                
                const timecode = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
                
                const timecodeText = new Text({
                    text: timecode,
                    style: new TextStyle({
                        fontFamily: 'monospace',
                        fontSize: 10,
                        fill: 0x6366f1
                    })
                })
                timecodeText.alpha = 0.9
                timecodeText.x = majorScreenX + 4
                timecodeText.y = TIMECODE_HEIGHT - 12
                mainContainer.addChild(timecodeText)
            }
            
            // Draw exactly fps (30) subdivisions between each major tick
            const frameInterval = majorIntervalSeconds / fps // seconds per frame subdivision
            for (let frame = 1; frame < fps; frame++) {
                const frameTime = majorSecond + (frame * frameInterval)
                const frameWorldX = TRACK_LABEL_WIDTH + (frameTime * pixelsPerSecond)
                const frameScreenX = frameWorldX - viewport.offsetX
                
                let tickHeight, alpha
                
                if (frame === fps / 2) {
                    // Minor tick at halfway point - top aligned
                    tickHeight = 10
                    alpha = 0.6
                } else {
                    // Small alternating ticks - top aligned
                    tickHeight = 6
                    alpha = 0.4
                }
                
                rulerGraphics.moveTo(frameScreenX, 0)
                rulerGraphics.lineTo(frameScreenX, tickHeight)
                rulerGraphics.stroke({ color: 0x6366f1, alpha, width: 1 })
            }
        }
        
        mainContainer.addChild(rulerGraphics)
        
        // Draw track labels
        const labelBg = new Graphics()
        labelBg.rect(0, TOP_PADDING, TRACK_LABEL_WIDTH, VIDEO_TRACK_HEIGHT)
        labelBg.fill({ color: 0x000000, alpha: 0.4 })
        mainContainer.addChild(labelBg)
        
        const labelBg2 = new Graphics()
        labelBg2.rect(0, TOP_PADDING + VIDEO_TRACK_HEIGHT, TRACK_LABEL_WIDTH, AUDIO_TRACK_HEIGHT)
        labelBg2.fill({ color: 0x000000, alpha: 0.4 })
        mainContainer.addChild(labelBg2)
        
        // Track separators
        const separator = new Graphics()
        separator.moveTo(TRACK_LABEL_WIDTH, TOP_PADDING)
        separator.lineTo(TRACK_LABEL_WIDTH, TOP_PADDING + TOTAL_HEIGHT)
        separator.moveTo(0, TOP_PADDING + VIDEO_TRACK_HEIGHT)
        separator.lineTo(rect.width, TOP_PADDING + VIDEO_TRACK_HEIGHT)
        separator.stroke({ color: 0x6366f1, alpha: 0.1, width: 1 })
        mainContainer.addChild(separator)
        
        // Track labels text
        const v1Label = new Text({
            text: 'V1',
            style: new TextStyle({ 
                fontFamily: 'monospace',
                fontSize: 12,
                fill: 0x6366f1
            })
        })
        v1Label.alpha = 0.5
        v1Label.x = TRACK_LABEL_WIDTH / 2 - v1Label.width / 2
        v1Label.y = TOP_PADDING + VIDEO_TRACK_HEIGHT / 2 - v1Label.height / 2
        mainContainer.addChild(v1Label)
        
        const a1Label = new Text({
            text: 'A1',
            style: new TextStyle({ 
                fontFamily: 'monospace',
                fontSize: 12,
                fill: 0x6366f1
            })
        })
        a1Label.alpha = 0.5
        a1Label.x = TRACK_LABEL_WIDTH / 2 - a1Label.width / 2
        a1Label.y = TOP_PADDING + VIDEO_TRACK_HEIGHT + AUDIO_TRACK_HEIGHT / 2 - a1Label.height / 2
        mainContainer.addChild(a1Label)
        
        // Draw clips if they exist
        if (capturedFrames.length > 0 && clipWidth > 0) {
            const clipMargin = 2
            // Clip always starts at TRACK_LABEL_WIDTH in world coordinates
            const clipWorldX = TRACK_LABEL_WIDTH
            const clipScreenX = clipWorldX - viewportOffset.x
            
            // Draw clips if any part is visible
            if (clipScreenX + clipWidth >= 0 && clipScreenX <= rect.width) {
                // Create video clip container with clipping mask
                const videoClipContainer = new Container()
                
                // Video clip background
                const videoClip = new Graphics()
                videoClip.roundRect(clipScreenX, TOP_PADDING + clipMargin, clipWidth, VIDEO_TRACK_HEIGHT - (clipMargin * 2), 4)
                videoClip.fill({ color: 0x6366f1, alpha: 0.1 })
                videoClip.stroke({ color: 0x6366f1, alpha: 0.3, width: 1 })
                videoClipContainer.addChild(videoClip)
                
                // Create clipping mask for thumbnails
                const clipMask = new Graphics()
                clipMask.roundRect(clipScreenX, TOP_PADDING + clipMargin, clipWidth, VIDEO_TRACK_HEIGHT - (clipMargin * 2), 4)
                clipMask.fill({ color: 0xffffff })
                
                // Render video thumbnails
                const thumbnailWidth = 60
                const thumbnailHeight = VIDEO_TRACK_HEIGHT - (clipMargin * 2) - 4
                const thumbnailSpacing = thumbnailWidth + 2
                
                // Calculate how many thumbnails can fit in the clip and which ones are visible
                const maxThumbnailsInClip = Math.ceil(clipWidth / thumbnailSpacing)
                const startThumbnailIndex = Math.max(0, Math.floor(-clipScreenX / thumbnailSpacing))
                const endThumbnailIndex = Math.min(maxThumbnailsInClip, capturedFrames.length, Math.ceil((rect.width - clipScreenX) / thumbnailSpacing) + 1)
                
                for (let i = startThumbnailIndex; i < endThumbnailIndex; i++) {
                    const thumbnailX = clipScreenX + (i * thumbnailSpacing) + 2
                    
                    // Only render if thumbnail would be visible
                    if (thumbnailX + thumbnailWidth >= 0 && thumbnailX <= rect.width) {
                        // Calculate which frame should be shown at this position based on timing
                        // Map thumbnail position to time within the clip
                        const thumbnailTimeRatio = i * thumbnailSpacing / clipWidth
                        const frameIndex = Math.min(Math.floor(thumbnailTimeRatio * capturedFrames.length), capturedFrames.length - 1)
                        const frame = capturedFrames[frameIndex]
                        
                        if (frame && frame.imageBitmap) {
                            // Check cache first
                            let thumbnailTexture = thumbnailCacheRef.current.get(frameIndex)?.texture
                            
                            if (!thumbnailTexture) {
                                // Create texture from ImageBitmap
                                try {
                                    thumbnailTexture = Texture.from(frame.imageBitmap)
                                    thumbnailCacheRef.current.set(frameIndex, {
                                        texture: thumbnailTexture,
                                        timestamp: frame.timestamp
                                    })
                                } catch (error) {
                                    console.warn('Failed to create thumbnail texture:', error)
                                    continue
                                }
                            }
                            
                            // Create sprite and add to video clip container
                            const thumbnailSprite = new Sprite(thumbnailTexture)
                            thumbnailSprite.x = thumbnailX
                            thumbnailSprite.y = TOP_PADDING + clipMargin + 2
                            thumbnailSprite.width = thumbnailWidth
                            thumbnailSprite.height = thumbnailHeight
                            videoClipContainer.addChild(thumbnailSprite)
                        }
                    }
                }
                
                // Apply mask to clip thumbnails at boundary
                videoClipContainer.mask = clipMask
                mainContainer.addChild(videoClipContainer)
                mainContainer.addChild(clipMask)
                
                // Audio clip background
                const audioClip = new Graphics()
                audioClip.roundRect(clipScreenX, TOP_PADDING + VIDEO_TRACK_HEIGHT + clipMargin, clipWidth, AUDIO_TRACK_HEIGHT - (clipMargin * 2), 4)
                audioClip.fill({ color: 0x6366f1, alpha: 0.1 })
                audioClip.stroke({ color: 0x6366f1, alpha: 0.3, width: 1 })
                mainContainer.addChild(audioClip)
                
                // Render audio waveform
                // Helper function to get unified audio data from any source
                const getUnifiedAudioData = (): Float32Array | null => {
                    try {
                        // Prioritize captured audio if available and not recording
                        if (capturedAudio.length > 0 && !isRecording) {
                            const firstAudio = capturedAudio[0]
                            if (firstAudio && firstAudio.audioBuffer) {
                                return firstAudio.audioBuffer.getChannelData(0)
                            }
                        }
                        
                        // Use realtime audio during recording or if no captured audio
                        if (realtimeAudioData.length > 0) {
                            // Simple concatenation without spreading to avoid stack overflow
                            let totalLength = 0
                            for (const chunk of realtimeAudioData) {
                                if (chunk && chunk.length > 0) {
                                    totalLength += chunk.length
                                }
                            }
                            
                            if (totalLength > 0) {
                                const result = new Float32Array(totalLength)
                                let offset = 0
                                for (const chunk of realtimeAudioData) {
                                    if (chunk && chunk.length > 0) {
                                        result.set(chunk, offset)
                                        offset += chunk.length
                                    }
                                }
                                return result
                            }
                        }
                        
                        return null
                    } catch (error) {
                        console.error('Error processing audio data:', error)
                        return null
                    }
                }
                
                const flatAudioData = getUnifiedAudioData()
                
                
                if (flatAudioData && flatAudioData.length > 0) {
                    const waveformGraphics = new Graphics()
                    const waveformHeight = AUDIO_TRACK_HEIGHT - (clipMargin * 2) - 8
                    const waveformY = TOP_PADDING + VIDEO_TRACK_HEIGHT + clipMargin + 4
                    const waveformCenterY = waveformY + (waveformHeight / 2)
                    
                    // Sample the audio data to match the clip width
                    const samplesPerPixel = Math.max(1, Math.floor(flatAudioData.length / clipWidth))
                    const visibleStartX = Math.max(0, -clipScreenX)
                    const visibleEndX = Math.min(clipWidth, rect.width - clipScreenX)
                    
                    // Draw waveform as positive-only area chart
                    const waveformPoints: number[] = []
                    
                    // Start from baseline
                    waveformPoints.push(clipScreenX + visibleStartX, waveformCenterY)
                    
                    for (let x = visibleStartX; x < visibleEndX; x += 2) {
                        const sampleIndex = Math.floor((x / clipWidth) * flatAudioData.length)
                        const endSampleIndex = Math.min(sampleIndex + samplesPerPixel, flatAudioData.length)
                        
                        // Find peak amplitude in this sample range
                        let maxAmplitude = 0
                        for (let i = sampleIndex; i < endSampleIndex; i++) {
                            const amplitude = Math.abs(flatAudioData[i] || 0)
                            maxAmplitude = Math.max(maxAmplitude, amplitude)
                        }
                        
                        // Convert amplitude to visual height (only show positive direction)
                        const amplitudeHeight = (maxAmplitude * waveformHeight)
                        const waveformY = waveformCenterY - amplitudeHeight
                        
                        // Add point to waveform path
                        waveformPoints.push(clipScreenX + x, waveformY)
                    }
                    
                    // Close the area back to baseline
                    waveformPoints.push(clipScreenX + visibleEndX - 2, waveformCenterY)
                    
                    // Draw the waveform area
                    if (waveformPoints.length >= 6) { // Need at least 3 points (6 coordinates)
                        waveformGraphics.poly(waveformPoints)
                        waveformGraphics.fill({ color: 0x6366f1, alpha: 0.3 })
                        waveformGraphics.stroke({ color: 0x6366f1, alpha: 0.8, width: 1 })
                    }
                    mainContainer.addChild(waveformGraphics)
                }
            }
        }
        
        // Draw playhead
        const pixelsPerSecondPlayhead = 100 * timelineZoom
        let playheadPosition = 0
        
        if (capturedFrames.length > 0) {
            const currentTime = currentFrameIndex / 30
            playheadPosition = currentTime * pixelsPerSecondPlayhead
        }
        
        const playheadWorldX = TRACK_LABEL_WIDTH + playheadPosition
        const playheadScreenX = playheadWorldX - viewportOffset.x
        
        if (playheadScreenX >= 0 && playheadScreenX <= rect.width) {
            const playheadLine = new Graphics()
            playheadLine.moveTo(playheadScreenX, 8)
            playheadLine.lineTo(playheadScreenX, TOP_PADDING + TOTAL_HEIGHT)
            playheadLine.stroke({ color: 0x6366f1, alpha: 0.8, width: 2 })
            mainContainer.addChild(playheadLine)
            
            const playheadHead = new Graphics()
            playheadHead.circle(playheadScreenX, 8, 6)
            playheadHead.fill({ color: 0x6366f1 })
            playheadHead.stroke({ color: 0xffffff, alpha: 0.3, width: 2 })
            mainContainer.addChild(playheadHead)
        }
        
    }
    
    // Initialize Pixi.js application
    useEffect(() => {
        if (!containerRef.current) return
        
        // Clear any existing content first
        containerRef.current.innerHTML = ''
        
        const app = new Application()
        
        const initPixi = async () => {
            // Get actual container dimensions
            const containerRect = containerRef.current?.getBoundingClientRect()
            const width = containerRect?.width || 800
            const height = 180
            
            await app.init({
                width,
                height,
                backgroundColor: 0x000000,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            })
            
            // Style the canvas
            app.canvas.style.display = 'block'
            
            containerRef.current?.appendChild(app.canvas)
            appRef.current = app
            
            // Initial render
            renderTimeline()
        }
        
        initPixi()
        
        return () => {
            if (appRef.current) {
                appRef.current.destroy(true)
                appRef.current = null
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }
        }
    }, [])
    
    // Render when timeline state changes
    useEffect(() => {
        if (appRef.current) {
            renderTimeline()
        }
    }, [capturedFrames.length, currentFrameIndex, clipTrimStart, clipTrimEnd, timelineZoom, viewportOffset.x, viewportOffset.y, isRecording])
    
    // Auto-scroll to show clips when they first appear
    useEffect(() => {
        if (capturedFrames.length === 1 && viewportOffset.x !== 0) {
            // First frame captured - make sure it's visible
            setViewportOffset({ x: 0, y: 0 })
        }
    }, [capturedFrames.length, viewportOffset.x])
    
    // Update the ticker callback when renderTimeline changes
    useEffect(() => {
        const app = appRef.current
        if (!app || !(app as any).timelineTickerCallback) return
        
        // Remove old callback
        const oldCallback = (app as any).timelineTickerCallback
        app.ticker.remove(oldCallback)
        
        // Add new callback with current renderTimeline
        const newCallback = () => renderTimeline()
        app.ticker.add(newCallback)
        
        // Store new callback
        ;(app as any).timelineTickerCallback = newCallback
        
        return () => {
            if (app.ticker && newCallback) {
                app.ticker.remove(newCallback)
            }
        }
    }, [renderTimeline])
    
    // Resize handling
    useLayoutEffect(() => {
        if (!appRef.current || !containerRef.current) return
        
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                const { width, height } = entry.contentRect
                appRef.current?.renderer.resize(width, height)
                
                // Invalidate render cache on resize and trigger re-render
                lastRenderParams.current = { 
                    capturedFrames: -1, 
                    currentFrameIndex: -1, 
                    clipTrimStart: -1, 
                    clipTrimEnd: -1, 
                    timelineZoom: -1, 
                    offsetX: -1,
                    screenWidth: -1,
                    screenHeight: -1
                }
                
                // Trigger immediate re-render with new dimensions
                renderTimeline()
            }
        })
        
        resizeObserver.observe(containerRef.current)
        
        return () => resizeObserver.disconnect()
    }, [])
    
    // Update scrollbar visibility
    useLayoutEffect(() => {
        if (!appRef.current) {
            setNeedsScrollbar(false)
            return
        }
        
        const rect = { width: appRef.current.screen.width, height: appRef.current.screen.height }
        if (rect.width === 0 || rect.height === 0) {
            setNeedsScrollbar(false)
            return
        }
        
        const timelineDuration = calculateTimelineDuration(capturedFrames.length)
        const timelineWidth = timelineDuration * 100 * timelineZoom
        const contentWidth = TRACK_LABEL_WIDTH + timelineWidth
        const maxScrollX = Math.max(0, contentWidth - rect.width)
        
        setNeedsScrollbar(maxScrollX > 0)
    }, [capturedFrames.length, timelineZoom])
    
    // Mouse event handlers
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!appRef.current) return
        
        const rect = appRef.current.canvas.getBoundingClientRect()
        const canvasX = e.clientX - rect.left
        const canvasY = e.clientY - rect.top
        const worldX = canvasX + viewportOffset.x
        const worldY = canvasY
        
        const timelineX = TRACK_LABEL_WIDTH
        const timelineDurationDown = calculateTimelineDuration(capturedFrames.length)
        const timelineWidthDown = timelineDurationDown * 100 * timelineZoom
        
        // Check if clicking on playhead (with expanded tolerance) - ANYWHERE on the timeline
        const currentTime = capturedFrames.length > 0 ? currentFrameIndex / 30 : 0
        const playheadWorldX = timelineX + (currentTime * 100 * timelineZoom)
        if (Math.abs(worldX - playheadWorldX) < 15) {
            setIsDraggingPlayhead(true)
            return
        }
        
        // Allow scrubbing by clicking anywhere in the timeline area
        if (worldX >= timelineX && worldX <= timelineX + timelineWidthDown) {
            const progress = Math.max(0, Math.min(1, (worldX - timelineX) / timelineWidthDown))
            const timePosition = progress * timelineDurationDown
            const frameIndex = Math.floor(timePosition * 30)
            onScrubTimeline(frameIndex)
            setIsDraggingPlayhead(true)
        } else {
            // Start timeline panning if clicking in empty space
            setIsDraggingTimeline(true)
            dragStartRef.current = { 
                x: canvasX, 
                y: canvasY, 
                offsetX: viewportOffset.x 
            }
        }
    }, [capturedFrames.length, currentFrameIndex, timelineZoom, viewportOffset.x, onScrubTimeline])
    
    // Global mouse events for dragging
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!appRef.current || (!isDraggingPlayhead && !isDraggingTimeline)) return
            
            const rect = appRef.current.canvas.getBoundingClientRect()
            const canvasX = e.clientX - rect.left
            const worldX = canvasX + viewportOffset.x
            
            const timelineDurationGlobal = calculateTimelineDuration(capturedFrames.length)
            const timelineWidthGlobal = timelineDurationGlobal * 100 * timelineZoom
            
            if (isDraggingPlayhead) {
                const progress = Math.max(0, Math.min(1, (worldX - TRACK_LABEL_WIDTH) / timelineWidthGlobal))
                const timePosition = progress * timelineDurationGlobal
                const frameIndex = Math.floor(timePosition * 30)
                onScrubTimeline(frameIndex)
            } else if (isDraggingTimeline) {
                const deltaX = canvasX - dragStartRef.current.x
                const maxScrollX = Math.max(0, TRACK_LABEL_WIDTH + timelineWidthGlobal - rect.width)
                const newOffsetX = Math.max(0, Math.min(maxScrollX, dragStartRef.current.offsetX - deltaX))
                setViewportOffset(prev => ({ ...prev, x: newOffsetX }))
                // Render will be handled automatically by useEffect
            }
        }

        const handleGlobalMouseUp = () => {
            setIsDraggingPlayhead(false)
            setIsDraggingTimeline(false)
        }

        if (isDraggingPlayhead || isDraggingTimeline) {
            document.addEventListener('mousemove', handleGlobalMouseMove)
            document.addEventListener('mouseup', handleGlobalMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
        }
    }, [isDraggingPlayhead, isDraggingTimeline, capturedFrames.length, timelineZoom, onScrubTimeline, viewportOffset.x])
    
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        if (!appRef.current) return
        
        const rect = { width: appRef.current.screen.width, height: appRef.current.screen.height }
        const timelineDuration = calculateTimelineDuration(capturedFrames.length)
        const timelineWidth = timelineDuration * 100 * timelineZoom
        const contentWidth = TRACK_LABEL_WIDTH + timelineWidth
        const maxScrollX = Math.max(0, contentWidth - rect.width)
        
        let deltaX = e.deltaX
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            deltaX = e.deltaY
        }
        
        const scrollSpeed = 1.5
        const newOffsetX = Math.max(0, Math.min(maxScrollX, viewportOffset.x + (deltaX * scrollSpeed)))
        
        setViewportOffset(prev => ({ ...prev, x: newOffsetX }))
        // Render will be handled automatically by ticker
    }, [capturedFrames.length, timelineZoom, viewportOffset.x])
    
    // Render scrollbar
    const renderScrollbar = useCallback(() => {
        const scrollbarHeight = 8
        
        if (!needsScrollbar) {
            return (
                <div 
                    className="w-full bg-black/10 rounded"
                    style={{ height: scrollbarHeight }}
                />
            )
        }
        
        if (!appRef.current) {
            return <div className="w-full bg-black/20 rounded" style={{ height: scrollbarHeight }} />
        }
        
        const rect = { width: appRef.current.screen.width, height: appRef.current.screen.height }
        if (rect.width === 0) {
            return <div className="w-full bg-black/20 rounded" style={{ height: scrollbarHeight }} />
        }
        
        const timelineDuration = calculateTimelineDuration(capturedFrames.length)
        const timelineWidth = timelineDuration * 100 * timelineZoom
        const contentWidth = TRACK_LABEL_WIDTH + timelineWidth
        const maxScrollX = Math.max(0, contentWidth - rect.width)
        
        const scrollbarWidth = rect.width
        const thumbWidth = Math.max(20, (rect.width / contentWidth) * scrollbarWidth)
        
        // Prevent NaN calculations at extreme zoom levels
        let thumbPosition = 0
        if (maxScrollX > 0 && scrollbarWidth > thumbWidth && isFinite(viewportOffset.x)) {
            thumbPosition = (viewportOffset.x / maxScrollX) * (scrollbarWidth - thumbWidth)
            // Clamp to valid range
            thumbPosition = Math.max(0, Math.min(thumbPosition, scrollbarWidth - thumbWidth))
        }
        
        return (
            <div 
                className="relative w-full bg-black/20 rounded"
                style={{ height: scrollbarHeight }}
            >
                <div
                    className="absolute top-0 bg-primary/40 rounded cursor-pointer hover:bg-primary/60 transition-colors"
                    style={{
                        left: thumbPosition,
                        width: thumbWidth,
                        height: scrollbarHeight
                    }}
                />
            </div>
        )
    }, [needsScrollbar, capturedFrames.length, timelineZoom, viewportOffset.x])
    
    return (
        <>
            <div 
                ref={containerRef}
                className="w-full cursor-pointer"
                style={{ height: '180px' }}
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
            />
            {renderScrollbar()}
        </>
    )
}