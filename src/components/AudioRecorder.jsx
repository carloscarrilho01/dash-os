import { useState, useRef, useEffect } from 'react'
import './AudioRecorder.css'

function AudioRecorder({ onSendAudio }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        setAudioBlob(blob)
        setIsPreviewing(true)

        // Para o stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording()
    }

    if (audioURL) {
      URL.revokeObjectURL(audioURL)
    }

    setAudioURL(null)
    setAudioBlob(null)
    setRecordingTime(0)
    setIsPreviewing(false)
  }

  const sendAudio = async () => {
    if (!audioBlob) return

    try {
      // Converte o blob para base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = () => {
        const base64Audio = reader.result
        onSendAudio(base64Audio, recordingTime)

        // Limpa
        cancelRecording()
      }
    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      alert('Erro ao enviar áudio')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isPreviewing) {
    return (
      <div className="audio-preview">
        <audio src={audioURL} controls className="audio-player" />
        <span className="audio-duration">{formatTime(recordingTime)}</span>
        <div className="audio-preview-actions">
          <button onClick={cancelRecording} className="btn-cancel" title="Cancelar">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
          <button onClick={sendAudio} className="btn-send-audio" title="Enviar áudio">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="audio-recording">
        <div className="recording-indicator">
          <span className="pulse-dot"></span>
          <span className="recording-time">{formatTime(recordingTime)}</span>
        </div>
        <button onClick={stopRecording} className="btn-stop-recording" title="Parar gravação">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M6,6H18V18H6V6Z" />
          </svg>
        </button>
        <button onClick={cancelRecording} className="btn-cancel-recording" title="Cancelar">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button onClick={startRecording} className="btn-record-audio" title="Gravar áudio">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
      </svg>
    </button>
  )
}

export default AudioRecorder
