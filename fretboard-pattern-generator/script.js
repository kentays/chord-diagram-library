// Add this at the start of your script.js file
console.log('SVGuitar loaded:', typeof svguitar !== 'undefined');
console.log('SVGuitar methods:', svguitar?.SVGuitarChord?.prototype);
console.log('SVGuitar version:', svguitar?.version);

// Add this after your existing console.log statements
console.log('Available SVGuitar methods:', Object.getOwnPropertyNames(svguitar.SVGuitarChord.prototype));

// Add these constants at the top of your file
const STORAGE_KEY = 'savedPatterns';

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
            [0, 2, 4],    // String 5 (A): A B C#
            [0, 2, 4]     // String 6 (low E): E F# G#
        ]
    };

    function generateFretboardPattern(title, frets) {
        try {
            // Clear previous SVG content
            resultDiv.innerHTML = '';

            // Find the highest fret number, considering both plain numbers and objects
            const maxFret = Math.max(
                5,
                ...frets.flat().map(f => {
                    if (typeof f === 'object' && f.fret !== undefined) {
                        return f.fret;
                    }
                    return f;
                }).filter(f => !isNaN(f))
            ) + 1;

            // Create new SVGuitar instance
            const guitar = new svguitar.SVGuitarChord('#result');

            // Configure the diagram
            guitar.configure({
                title: '',
                strings: 6,
                frets: maxFret,
                position: 1,
                tuning: [],
                fretSize: 1.5,
                fretSpace: 2,
                stringSpace: 2,
                showTuning: false,
                orientation: 'horizontal',
                fontSize: 12,  // Add font size for text
                textColor: '#000000'  // Add text color
            });

            // Convert fret positions to chord positions array with colors and text
            const positions = frets.flatMap((stringFrets, stringIndex) => 
                stringFrets.map(fret => {
                    // Check if fret is an object with properties
                    if (typeof fret === 'object') {
                        const props = {};
                        if (fret.color) props.color = fret.color;
                        if (fret.text) props.text = fret.text;
                        return [stringIndex + 1, fret.fret, props];
                    }
                    // Default to just the fret number if no properties
                    return [stringIndex + 1, fret];
                })
                .filter(([_, fret]) => !isNaN(fret))
            );

            guitar.chord({
                fingers: positions,
                barres: []
            }).draw();

        } catch (error) {
            console.error('Error in generateFretboardPattern:', error);
            resultDiv.innerHTML = `<p style="color: red;">Error generating diagram: ${error.message}</p>`;
        }
    }

    function downloadPattern(title, frets, format = 'svg') {
        const svgElement = document.querySelector('#result svg');
        if (!svgElement) {
            alert('No pattern to download');
            return;
        }

        if (format === 'svg') {
            // SVG download logic
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const downloadLink = document.createElement('a');
            downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}.svg`;
            downloadLink.href = URL.createObjectURL(svgBlob);
            downloadLink.click();
            URL.revokeObjectURL(downloadLink.href);
        } else if (format === 'png') {
            // PNG download logic
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Set canvas size (multiply by 2 for better resolution)
            canvas.width = svgElement.width.baseVal.value * 2;
            canvas.height = svgElement.height.baseVal.value * 2;
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(function(blob) {
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.click();
                    URL.revokeObjectURL(downloadLink.href);
                }, 'image/png');
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
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

    function setupFretInputs() {
        for (let i = 1; i <= 6; i++) {
            const input = document.querySelector(`input[name="string${i}"]`);
            if (input) {
                input.placeholder = "Enter frets (e.g., 0:red 2:blue 4)";
                
                // Add input event listener for real-time updates including colors
                input.addEventListener('input', debounce(function(e) {
                    updateDiagram();
                }, 200)); // Reduced delay for more responsive color updates
            }
        }
    }

    // Add debounce function to prevent too many rapid updates
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to update diagram in real-time
    function updateDiagram() {
        const frets = [];
        // Collect all fret values with colors
        for (let i = 1; i <= 6; i++) {
            const fretInput = document.querySelector(`input[name="string${i}"]`).value;
            const parsedFrets = parseFretInput(fretInput);
            frets.push(parsedFrets);
        }
        
        // Only generate if we have valid fret numbers
        if (frets.some(stringFrets => stringFrets.length > 0)) {
            const title = document.getElementById('title').value || 'Fretboard Pattern';
            generateFretboardPattern(title, frets);
        }
    }

    // Remove the form submit event listener since we're updating in real-time
    // Keep the clear functionality

    // Update the click event listeners
    function setupDownloadButtons() {
        const downloadSvgBtn = document.getElementById('download-svg');
        const downloadPngBtn = document.getElementById('download-png');

        downloadSvgBtn.addEventListener('click', function() {
            const title = document.getElementById('title').value;
            const frets = [];
            for (let i = 1; i <= 6; i++) {
                const fretInput = document.querySelector(`input[name="string${i}"]`).value;
                frets.push(parseFretInput(fretInput));
            }
            downloadPattern(title, frets, 'svg');
        });

        downloadPngBtn.addEventListener('click', function() {
            const title = document.getElementById('title').value;
            const frets = [];
            for (let i = 1; i <= 6; i++) {
                const fretInput = document.querySelector(`input[name="string${i}"]`).value;
                frets.push(parseFretInput(fretInput));
            }
            downloadPattern(title, frets, 'png');
        });
    }

    // Add clear functionality
    document.getElementById('clear-inputs').addEventListener('click', function() {
        // Reset title to default
        document.getElementById('title').value = 'Fretboard Pattern';
        
        // Clear all string inputs
        for (let i = 1; i <= 6; i++) {
            const input = document.querySelector(`input[name="string${i}"]`);
            if (input) {
                input.value = '';
            }
        }
        
        // Generate empty diagram with 5 frets instead of clearing
        generateFretboardPattern('Fretboard Pattern', [[], [], [], [], [], []]);
    });

    // Add these functions inside your DOMContentLoaded event listener
    function setupPatternLibrary() {
        const savePatternBtn = document.getElementById('save-pattern');
        const exportLibraryBtn = document.getElementById('export-library');
        const importLibraryInput = document.getElementById('import-library');

        savePatternBtn.addEventListener('click', saveCurrentPattern);
        exportLibraryBtn.addEventListener('click', exportLibrary);
        importLibraryInput.addEventListener('change', importLibrary);

        // Load saved patterns on startup
        loadSavedPatterns();
    }

    function saveCurrentPattern() {
        const title = document.getElementById('title').value || 'Untitled Pattern';
        const frets = [];
        for (let i = 1; i <= 6; i++) {
            const fretInput = document.querySelector(`input[name="string${i}"]`).value;
            frets.push(parseFretInput(fretInput));
        }

        const pattern = { title, frets };
        const savedPatterns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        savedPatterns.push(pattern);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPatterns));
        loadSavedPatterns(); // Refresh the list
    }

    function loadSavedPatterns() {
        const patternsList = document.getElementById('patterns-list');
        const savedPatterns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        patternsList.innerHTML = savedPatterns.map((pattern, index) => `
            <div class="pattern-item" data-index="${index}">
                <h4>${pattern.title}</h4>
                <div class="pattern-actions">
                    <button class="secondary-button load-pattern">Load</button>
                    <button class="secondary-button delete-pattern">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners for load and delete buttons
        patternsList.querySelectorAll('.load-pattern').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('.pattern-item').dataset.index;
                loadPattern(savedPatterns[index]);
            });
        });

        patternsList.querySelectorAll('.delete-pattern').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('.pattern-item').dataset.index;
                deletePattern(index);
            });
        });
    }

    function loadPattern(pattern) {
        document.getElementById('title').value = pattern.title;
        pattern.frets.forEach((frets, index) => {
            const input = document.querySelector(`input[name="string${index + 1}"]`);
            if (input) {
                // Convert fret objects to properly formatted strings
                const fretStrings = frets.map(fret => {
                    if (typeof fret === 'object') {
                        let result = fret.fret.toString();
                        if (fret.color) result += ':' + fret.color;
                        if (fret.text) result += '::' + fret.text;
                        return result;
                    }
                    return fret.toString();
                });
                input.value = fretStrings.join(', ');
            }
        });
        generateFretboardPattern(pattern.title, pattern.frets);
    }

    function deletePattern(index) {
        const savedPatterns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        savedPatterns.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPatterns));
        loadSavedPatterns(); // Refresh the list
    }

    function exportLibrary() {
        const savedPatterns = localStorage.getItem(STORAGE_KEY) || '[]';
        const blob = new Blob([savedPatterns], { type: 'application/json' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'fretboard-patterns.json';
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
    }

    function importLibrary(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const patterns = JSON.parse(e.target.result);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
                    loadSavedPatterns();
                } catch (error) {
                    console.error('Error importing patterns:', error);
                    alert('Invalid pattern file');
                }
            };
            reader.readAsText(file);
        }
    }

    setupFretInputs();
    setupDownloadButtons();
    // Add this line at the end of your DOMContentLoaded event listener
    setupPatternLibrary();
});

function parseFretInput(input) {
    return input.split(/[,\s]+/)
        .filter(n => n !== '')
        .map(fret => {
            // Split by double colon first to handle text notation (fret::text)
            const [numberPart, text] = fret.split('::');
            
            // Then split the first part by single colon to handle potential color
            const [number, color] = numberPart.split(':');
            
            if (!isNaN(number)) {
                const result = { fret: parseInt(number) };
                
                // Add color if present
                if (color) {
                    result.color = color.trim();
                }
                
                // Add text if present
                if (text) {
                    result.text = text.trim();
                }
                
                return result;
            }
            return parseInt(fret);
        })
        .filter(fret => !isNaN(fret.fret || fret));
}
