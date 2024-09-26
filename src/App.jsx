import React, { useState, useRef, useEffect } from 'react';
import Horn from '/horn.mp3';
import './App.css';

function App() {
    const [listening, setListening] = useState(false);
    const [message, setMessage] = useState('');
    const audioRef = useRef(null);  // Reference to play the alarm
    const audioContextRef = useRef(null);
    const micAnalyserRef = useRef(null); // Reference for mic audio analysis
    const hornAnalyserRef = useRef(null); // Reference for horn mp3 analysis
    const [hornBuffer, setHornBuffer] = useState(null); // Holds the car horn buffer

    useEffect(() => {
        // Load the car horn sound from the public folder
        fetch('/horn.mp3')
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                return audioContext.decodeAudioData(arrayBuffer).then(decodedData => {
                    setHornBuffer(decodedData);
                    // Create an analyser for the horn audio
                    hornAnalyserRef.current = audioContext.createAnalyser();
                });
            })
            .catch(error => setMessage('Error loading car horn audio'));
    }, []);

    const startListening = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMessage('Microphone access not supported');
            return;
        }

        setMessage('Listening for car horn...');
        setListening(true);

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        micAnalyserRef.current = audioContextRef.current.createAnalyser();

        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const micSource = audioContextRef.current.createMediaStreamSource(micStream);
            micSource.connect(micAnalyserRef.current);
            compareHornAndMic(); // Start comparing mic input to the car horn sound
        } catch (error) {
            setMessage('Could not access microphone');
            console.error(error);
        }
    };

    const stopListening = () => {
        setListening(false);
        setMessage('Stopped listening');
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    const compareHornAndMic = () => {
        const micDataArray = new Float32Array(micAnalyserRef.current.fftSize);
        const hornDataArray = new Float32Array(hornAnalyserRef.current.fftSize); // Ensure this line is correctly placed

        const detectHorn = () => {
            micAnalyserRef.current.getFloatTimeDomainData(micDataArray);
            if (hornAnalyserRef.current) {
                hornAnalyserRef.current.getFloatTimeDomainData(hornDataArray);

                const micMaxAmplitude = Math.max(...micDataArray);
                const hornMaxAmplitude = Math.max(...hornDataArray);

                // You can refine this detection logic further for better accuracy
                if (Math.abs(micMaxAmplitude - hornMaxAmplitude) < 0.1) {
                    playAlarm();
                    setMessage('Car horn detected!');
                } else {
                    requestAnimationFrame(detectHorn);
                }
            }
        };
        detectHorn();
    };

    const playAlarm = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    return (
        <div>
            <h1>Car Horn Detector</h1>
            <p><i>{message}</i></p>
            {!listening ? (
                <div onClick={startListening}><p>Start Listening</p></div>
            ) : (
                <div onClick={stopListening}><p>Stop Listening</p></div>
            )}
        </div>
    );
}

export default App;
