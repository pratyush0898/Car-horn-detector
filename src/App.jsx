import React, { useState, useRef } from 'react';
import './App.css'

function App() {
    const [listening, setListening] = useState(false);
    const [message, setMessage] = useState('');
    const audioRef = useRef(null);  // Reference to play the alarm
    let audioContext = null;
    let microphoneStream = null;
    let analyser = null;

    const startListening = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMessage('Microphone access not supported*', error);
            return;
        }

        setMessage('Listening for car horn...*');
        setListening(true);

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();

        try {
            microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(microphoneStream);
            source.connect(analyser);

            detectHorn();
        } catch (error) {
            setMessage('Could not access microphone*', error);
            console.error(error);
        }
    };

    const stopListening = () => {
        setListening(false);
        setMessage('Stopped listening');
        if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
    };

    const detectHorn = () => {
        const dataArray = new Float32Array(analyser.fftSize);
        const checkHorn = () => {
            analyser.getFloatTimeDomainData(dataArray);
            // Placeholder logic for detecting car horn. You'll need actual analysis here.
            const maxAmplitude = Math.max(...dataArray);
            if (maxAmplitude > 0.2) {  // Threshold for detection
                playAlarm();
                setMessage('Car horn detected!');
            } else {
                requestAnimationFrame(checkHorn);
            }
        };
        requestAnimationFrame(checkHorn);
    };

    const playAlarm = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    return (
        <div>
            <h1 id='heading'>Car Horn Detector</h1>
            <p id='error'><i>{message}</i></p>
            {!listening ? (
              <div id='button' onClick={startListening}><p>Start Listening</p></div>
            ) : (
                <div id='button' onClick={stopListening}><p>Stop Listening</p></div>
            )}
            <audio ref={audioRef} src="/alarm.mp3" preload="auto"></audio>
        </div>
    );
}

export default App;
