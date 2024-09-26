import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ml5 from 'ml5';

function App() {
    const [listening, setListening] = useState(false);
    const [message, setMessage] = useState('');
    const audioRef = useRef(null);  // Reference to play the alarm
    const classifierRef = useRef(null); // Reference for the sound classifier

    useEffect(() => {
        // Load the sound classification model
        classifierRef.current = ml5.soundClassifier('SpeechCommands18w', modelReady);
    }, []);

    const modelReady = () => {
        console.log('Model Loaded!');
    };

    const startListening = () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMessage('Microphone access not supported');
            return;
        }

        setMessage('Listening for car horn...');
        setListening(true);

        // Start the sound classification
        classifierRef.current.classify(gotResults);
    };

    const stopListening = () => {
        setListening(false);
        setMessage('Stopped listening');
        // Stop the classifier
        classifierRef.current.stop();
    };

    const gotResults = (error, results) => {
        if (error) {
            console.error(error);
            return;
        }

        // Assuming the first result is the most confident
        const label = results[0].label;
        const confidence = results[0].confidence;

        // Check if the detected sound is a car horn (you may need to train the model for specific sounds)
        if (label === 'car horn' && confidence > 0.5) { // Adjust confidence threshold as needed
            playAlarm();
            setMessage('Car horn detected!');
        } else {
            setMessage('Listening for car horn...');
        }
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
