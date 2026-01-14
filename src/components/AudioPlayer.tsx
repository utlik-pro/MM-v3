import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  conversationId: string
  className?: string
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, conversationId, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
      setHasError(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e)
      setIsLoading(false)
      setHasError(true)
      setErrorMessage('Не удалось загрузить аудио. Проверьте соединение.')
    }

    const handleLoadStart = () => {
      console.log('Audio loading started for:', src)
      setIsLoading(true)
      setHasError(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [src])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(duration, audio.currentTime + 10)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Запись разговора</h3>
            <p className="text-sm text-gray-600">Conversation Audio</p>
          </div>
          <a
            href={src}
            download={`conversation_${conversationId}.mp3`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            <span className="text-sm font-medium">Скачать</span>
          </a>
        </div>
      </div>

      {/* Player Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Загрузка аудио...</span>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={skipBackward}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Назад на 10 секунд"
              >
                <SkipBack size={20} className="text-gray-600" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-lg"
                title={isPlaying ? "Пауза" : "Воспроизвести"}
              >
                {isPlaying ? (
                  <Pause size={24} className="text-white" />
                ) : (
                  <Play size={24} className="text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={skipForward}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Вперед на 10 секунд"
              >
                <SkipForward size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-sm text-gray-500 w-8">{Math.round(volume * 100)}</span>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #6b7280;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #6b7280;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
} 