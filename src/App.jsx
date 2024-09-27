import React, { useState, useRef, useEffect } from "react"; // Import necessary hooks from React
import Horn from "/horn.mp3"; // Import the horn audio file
import "./App.css"; // Import the CSS for styling

function App() {
  const [listening, setListening] = useState(false); // State to manage listening status
  const [message, setMessage] = useState(""); // State to display messages to the user
  const audioRef = useRef(null); // Reference to play the alarm audio
  const audioContextRef = useRef(null); // Reference to store the AudioContext for mic input
  const micAnalyserRef = useRef(null); // Reference for the mic audio analyser
  const hornAnalyserRef = useRef(null); // Reference for the horn audio analyser
  const [hornBuffer, setHornBuffer] = useState(null); // State to store the car horn audio buffer
  const [isHornDetected, setIsHornDetected] = useState(false); // State to track whether the horn is detected

  useEffect(() => {
    // Load the car horn sound from the public folder on component mount
    fetch("/horn.mp3")
      .then((response) => response.arrayBuffer()) // Convert response to an array buffer
      .then((arrayBuffer) => {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)(); // Create a new AudioContext
        return audioContext.decodeAudioData(arrayBuffer).then((decodedData) => {
          setHornBuffer(decodedData); // Set the decoded horn audio buffer
          // Create an analyser for the horn audio
          hornAnalyserRef.current = audioContext.createAnalyser();
          const hornSource = audioContext.createBufferSource(); // Create a buffer source for the horn audio
          hornSource.buffer = decodedData; // Set the buffer to the decoded horn audio
          hornSource.connect(hornAnalyserRef.current); // Connect the source to the analyser
          hornAnalyserRef.current.fftSize = 2048; // Set FFT size for more frequency data points
          hornSource.start(); // Play the horn sound once for analysis
        });
      })
      .catch((error) => setMessage("Error loading car horn audio")); // Handle errors in loading horn audio
  }, []); // Empty dependency array ensures this runs once on component mount

  const startListening = async () => {
    // Start listening for mic input
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage("Microphone access not supported"); // Show error if mic access is not supported
      return; // Stop execution if there's no mic support
    }

    setMessage("Listening for car horn..."); // Update message to indicate listening has started
    setListening(true); // Set listening state to true

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)(); // Create a new AudioContext for mic input
    micAnalyserRef.current = audioContextRef.current.createAnalyser(); // Create an analyser for mic input
    micAnalyserRef.current.fftSize = 2048; // Set FFT size for better frequency resolution

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      }); // Request microphone access
      const micSource =
        audioContextRef.current.createMediaStreamSource(micStream); // Create a source for mic input
      micSource.connect(micAnalyserRef.current); // Connect the mic source to the analyser
      compareHornAndMic(); // Start comparing the mic input with the car horn sound
    } catch (error) {
      setMessage("Could not access microphone"); // Handle error if mic access fails
      console.error(error); // Log the error for debugging
    }
  };

  const stopListening = () => {
    // Stop listening for mic input
    setListening(false); // Set listening state to false
    setMessage("Stopped listening"); // Update message to indicate listening has stopped
    if (audioContextRef.current) {
      audioContextRef.current.close(); // Close the AudioContext if it exists
    }
  };

  const compareHornAndMic = () => {
    // Function to compare mic input with horn sound
    const micDataArray = new Uint8Array(
      micAnalyserRef.current.frequencyBinCount
    ); // Create an array to store mic frequency data
    const hornDataArray = new Uint8Array(
      hornAnalyserRef.current.frequencyBinCount
    ); // Create an array to store horn frequency data

    const detectHorn = () => {
      micAnalyserRef.current.getByteFrequencyData(micDataArray); // Get the frequency data from the mic
      hornAnalyserRef.current.getByteFrequencyData(hornDataArray); // Get the frequency data from the horn

      // Calculate the difference between mic and horn frequency data
      let difference = 0;
      for (let i = 0; i < micDataArray.length; i++) {
        difference += Math.abs(micDataArray[i] - hornDataArray[i]); // Sum the differences between corresponding frequency bins
      }

      // Threshold for similarity (tune this value for better accuracy)
      const threshold = 5000;

      if (difference < threshold) {
        // If the difference is below the threshold
        if (!isHornDetected) {
          playAlarm(); // Play the alarm if horn is detected
          setMessage("Car horn detected!"); // Update the message to indicate detection
          setIsHornDetected(true); // Set horn detection state to true
        }
      } else {
        setIsHornDetected(false); // Set horn detection state to false if no match
        requestAnimationFrame(detectHorn); // Continue checking for the horn in the next frame
      }
    };

    detectHorn(); // Start the detection loop
  };

  const playAlarm = () => {
    // Play the alarm sound when the horn is detected
    if (audioRef.current) {
      audioRef.current.play(); // Play the alarm using the audio reference
    }
  };

  return (
    <div>
      <h1 id="heading">Car Horn Detector</h1> {/* Title of the app */}
      <p id="error">
        <i>{message}</i> {/* Display messages or errors */}
      </p>
      {!listening ? ( // Conditionally render buttons based on listening state
        <div id="button" onClick={startListening}>
          <p>Start Listening</p> {/* Button to start listening */}
        </div>
      ) : (
        <div id="button" onClick={stopListening}>
          <p>Stop Listening</p> {/* Button to stop listening */}
        </div>
      )}
      <audio ref={audioRef} src="/alarm.mp3" preload="auto"></audio> {/* Audio element for playing the alarm */}
    </div>
  );
}

export default App; // Export the App component as default
