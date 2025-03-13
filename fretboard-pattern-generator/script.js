// Add this at the start of your script.js file
console.log('SVGuitar loaded:', typeof svguitar !== 'undefined');
console.log('SVGuitar methods:', svguitar?.SVGuitarChord?.prototype);
console.log('SVGuitar version:', svguitar?.version);

// Add this after your existing console.log statements
console.log('Available SVGuitar methods:', Object.getOwnPropertyNames(svguitar.SVGuitarChord.prototype));

// This file contains the JavaScript logic for handling user input, generating fretboard patterns based on the notes provided, and updating the display with the generated patterns.

document.addEventListener('DOMContentLoaded', function() {
    // Check if SVGuitar is properly loaded with more detailed logging
    console.log('SVGuitar object:', svguitar);
    
    if (typeof svguitar === 'undefined') {
        console.error('SVGuitar library not loaded');
        return;
    }

    if (!svguitar.SVGuitarChord) {
        console.error('SVGuitar.SVGuitarChord is not available');
        return;
    }

    const form = document.getElementById('pattern-form');
    const resultDiv = document.getElementById('result');
    
    // Default pattern data
    const defaultPattern = {
        title: "E Major Scale - Three Notes Per String",
        frets: [
            [0, 2, 4],    // String 1 (high E): E F# G#
            [0, 2, 4],    // String 2 (B): B C# D#
            [1, 2, 4],    // String 3 (G): G# A B
            [1, 2, 4],    // String 4 (D): D# E F#
            [2, 4, 5],    // String 5 (A): B C# D#
            [0, 2, 4]     // String 6 (low E): E F# G#
        ]
    };

    function generateFretboardPattern(title, frets) {
        try {
            // Clear previous SVG content
            resultDiv.innerHTML = '';

            // Find the highest fret number to set diagram size
            const maxFret = Math.max(...frets.flat().filter(f => !isNaN(f))) + 1;

            // Create new SVGuitar instance
            const guitar = new svguitar.SVGuitarChord('#result');

            // Configure the diagram
            guitar.configure({
                title: title,
                strings: 6,
                frets: maxFret,
                position: 1,
                tuning: ['E', 'B', 'G', 'D', 'A', 'E'],
                fretSize: 1.5,
                fretSpace: 2,
                stringSpace: 2,
                showTuning: true,
                orientation: 'horizontal'  // Changed from 'vertical' to 'horizontal'
            });

            // Convert fret positions to chord positions array
            const positions = [];
            frets.forEach((stringFrets, stringIndex) => {
                stringFrets.forEach(fret => {
                    if (!isNaN(fret)) {
                        positions.push([stringIndex + 1, fret]);
                    }
                });
            });

            // Set the chord with all positions
            guitar.chord({
                fingers: positions,
                barres: []
            }).draw();

        } catch (error) {
            console.error('Error in generateFretboardPattern:', error);
            resultDiv.innerHTML = `<p style="color: red;">Error generating diagram: ${error.message}</p>`;
        }
    }

    // Load default pattern on page load
    generateFretboardPattern(defaultPattern.title, defaultPattern.frets);

    // Pre-fill the form with default values
    document.getElementById('title').value = defaultPattern.title;
    defaultPattern.frets.forEach((frets, index) => {
        const input = document.querySelector(`input[name="string${index + 1}"]`);
        if (input) {
            input.value = frets.join(', ');
        }
    });

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const frets = [];

        // Get frets from all 6 strings
        for (let i = 1; i <= 6; i++) {
            const fretInput = document.querySelector(`input[name="string${i}"]`).value;
            frets.push(fretInput.split(',').map(fret => parseInt(fret.trim())));
        }

        generateFretboardPattern(title, frets);
    });
});