// This file contains the JavaScript logic for handling user input, generating fretboard patterns based on the notes provided, and updating the display with the generated patterns.

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pattern-form');
    const resultDiv = document.getElementById('result');
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const strings = parseInt(document.getElementById('strings').value);
        const notes = [];

        for (let i = 1; i <= strings; i++) {
            const noteInput = document.querySelector(`input[name="string${i}"]`).value;
            notes.push(noteInput.split(',').map(note => note.trim()));
        }

        generateFretboardPattern(title, notes);
    });

    function generateFretboardPattern(title, notes) {
        // Clear previous SVG content
        resultDiv.innerHTML = '';

        const svguitar = new svguitar.SVGuitarChord('#result', {
            title: title,
            strings: notes.length,
            frets: 5,
            position: 1,
            tuning: ['E', 'A', 'D', 'G', 'B', 'E'].slice(0, notes.length)
        });

        notes.forEach((stringNotes, stringIndex) => {
            stringNotes.forEach(note => {
                const fret = getFretFromNote(note);
                if (fret !== null) {
                    svguitar.addFret(stringIndex + 1, fret);
                }
            });
        });

        svguitar.render();
    }

    function getFretFromNote(note) {
        const noteToFret = {
            'E': 0, 'F': 1, 'F#': 2, 'G': 3, 'G#': 4, 'A': 5, 'A#': 6, 'B': 7, 'C': 8, 'C#': 9, 'D': 10, 'D#': 11
        };
        return noteToFret[note] !== undefined ? noteToFret[note] : null;
    }
});