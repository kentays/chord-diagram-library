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

    const SEVENTH_CHORD_TYPES = {
        'maj7': {
            intervals: [0, 4, 7, 11],
            name: 'Major 7'
        },
        '7': {
            intervals: [0, 4, 7, 10],
            name: 'Dominant 7'
        },
        'min7': {
            intervals: [0, 3, 7, 10],
            name: 'Minor 7'
        },
        'm7b5': {
            intervals: [0, 3, 6, 10],
            name: 'Half Diminished'
        },
        'dim7': {
            intervals: [0, 3, 6, 9],
            name: 'Diminished 7'
        },
        'mM7': {
            intervals: [0, 3, 7, 11],
            name: 'Minor Major 7'
        }
    };

        // First, correct the getIntervalName function
    function getIntervalName(interval) {
        const intervalNames = {
            0: 'R',
            3: 'b3',
            4: '3',
            6: 'b5',
            7: '5',
            9: '6', 
            10: 'b7',
            11: '7'
        };
        return intervalNames[interval] || '';
    }
    function generateArpeggioPositions(quality, inversion = 0) {
        const pattern = SEVENTH_CHORD_TYPES[quality];
        if (!pattern) return null;
    
        const stringOffsets = {
            6: 0,  // Low E
            5: 5,  // A
            4: 10, // D
            3: 15, // G
            2: 19, // B
            1: 24  // E
        };
    
        // Rotate intervals based on inversion
        let intervals = [...pattern.intervals];
        for (let i = 0; i < inversion; i++) {
            const first = intervals.shift();
            intervals.push(first + 12);
        }
    
        let positions = [];
        const startFret = 1;
    
        // Calculate positions for each pair of strings
        // First octave (strings 6 and 5)
        positions.push(
            // String 6 (Low E)
            {
                string: 6,
                fret: startFret,
                text: getIntervalName(intervals[0] % 12),
                color: getIntervalName(intervals[0] % 12) === 'R' ? 'red' : null
            },
            {
                string: 6,
                fret: startFret + (intervals[1] - intervals[0]),
                text: getIntervalName(intervals[1] % 12),
                color: getIntervalName(intervals[1] % 12) === 'R' ? 'red' : null
            },
            // String 5 (A)
            {
                string: 5,
                fret: startFret + ((intervals[2] - intervals[0]) - 5),
                text: getIntervalName(intervals[2] % 12),
                color: getIntervalName(intervals[2] % 12) === 'R' ? 'red' : null
            },
            {
                string: 5,
                fret: startFret + ((intervals[3] - intervals[0]) - 5),
                text: getIntervalName(intervals[3] % 12),
                color: getIntervalName(intervals[3] % 12) === 'R' ? 'red' : null
            }
        );
    
        // Second octave (strings 4 and 3)
        positions.push(
            // String 4 (D)
            {
                string: 4,
                fret: startFret + ((intervals[0] - intervals[0]) + 2),
                text: getIntervalName(intervals[0] % 12),
                color: getIntervalName(intervals[0] % 12) === 'R' ? 'red' : null
            },
            {
                string: 4,
                fret: startFret + ((intervals[1] - intervals[0]) + 2),
                text: getIntervalName(intervals[1] % 12),
                color: getIntervalName(intervals[1] % 12) === 'R' ? 'red' : null
            },
            // String 3 (G)
            {
                string: 3,
                fret: startFret + ((intervals[2] - intervals[0]) - 3),
                text: getIntervalName(intervals[2] % 12),
                color: getIntervalName(intervals[2] % 12) === 'R' ? 'red' : null
            },
            {
                string: 3,
                fret: startFret + ((intervals[3] - intervals[0]) - 3),
                text: getIntervalName(intervals[3] % 12),
                color: getIntervalName(intervals[3] % 12) === 'R' ? 'red' : null
            }
        );
    
        // Third octave (strings 2 and 1)
        positions.push(
            // String 2 (B)
            {
                string: 2,
                fret: startFret + ((intervals[0] - intervals[0]) + 5),
                text: getIntervalName(intervals[0] % 12),
                color: getIntervalName(intervals[0] % 12) === 'R' ? 'red' : null
            },
            {
                string: 2,
                fret: startFret + ((intervals[1] - intervals[0]) + 5),
                text: getIntervalName(intervals[1] % 12),
                color: getIntervalName(intervals[1] % 12) === 'R' ? 'red' : null
            },
            // String 1 (High E)
            {
                string: 1,
                fret: startFret + ((intervals[2] - intervals[0])),
                text: getIntervalName(intervals[2] % 12),
                color: getIntervalName(intervals[2] % 12) === 'R' ? 'red' : null
            },
            {
                string: 1,
                fret: startFret + ((intervals[3] - intervals[0])),
                text: getIntervalName(intervals[3] % 12),
                color: getIntervalName(intervals[3] % 12) === 'R' ? 'red' : null
            }
        );
  
        // Convert positions to fretboard pattern format
        const fretsByString = Array(6).fill().map(() => []);
        positions.forEach(pos => {
            fretsByString[pos.string - 1].push({
                fret: pos.fret,
                text: pos.text,
                color: pos.color
            });
        });
    
        // Update form inputs and generate diagram
        document.getElementById('title').value = `${pattern.name} Arpeggio${inversion > 0 ? ` (${inversion}${getInversionSuffix(inversion)} inv)` : ''}`;
        updateFretboardInputs(fretsByString);
        updateDiagram();
    }
    
    function updateFretboardInputs(fretsByString) {
        fretsByString.forEach((stringFrets, index) => {
            const input = document.querySelector(`input[name="string${index + 1}"]`);
            if (input) {
                const fretNotation = stringFrets.map(pos => {
                    let notation = `${pos.fret}`;
                    if (pos.color) notation += `:${pos.color}`;
                    if (pos.text) notation += `::${pos.text}`;
                    return notation;
                }).join(', ');
                input.value = fretNotation;
            }
        });
    }
    // Helper function for inversion suffix
    function getInversionSuffix(inversion) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        return suffixes[inversion] || 'th';
    }
    // Update the click handler to just call this function
    $('#generate-arpeggio').click(function() {
        const quality = $('#arpeggio-quality').val();
        const inversion = parseInt($('#arpeggio-inversion').val()) || 0;
    
        if (!quality) {
            alert('Please select a chord quality');
            return;
        }
    
        generateArpeggioPositions(quality, inversion);
    });

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
        const tagInput = document.getElementById('pattern-tags');
        const tags = tagInput.value.split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag !== '');
        
        const frets = [];
        for (let i = 1; i <= 6; i++) {
            const fretInput = document.querySelector(`input[name="string${i}"]`).value;
            frets.push(parseFretInput(fretInput));
        }

        const pattern = { title, frets, tags };
        const savedPatterns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        savedPatterns.push(pattern);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPatterns));
        
        // Clear tag input
        tagInput.value = '';
        
        loadSavedPatterns();
    }

    function loadSavedPatterns() {
        const patternsOrganized = document.getElementById('patterns-organized');
        const savedPatterns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // Collect all unique tags
        const allTags = new Set();
        savedPatterns.forEach(pattern => {
            if (pattern.tags) {
                pattern.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // Update available tags
        updateAvailableTags(Array.from(allTags));
        
        // Generate HTML for patterns list
        patternsOrganized.innerHTML = savedPatterns.map((pattern, index) => 
            updatePatternDisplay(pattern, index)
        ).join('');
        
        // Add event listeners for pattern actions
        setupPatternEventListeners(savedPatterns);
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

    function updateAvailableTags(tags) {
        const tagsContainer = document.getElementById('available-tags');
        tagsContainer.innerHTML = tags.map(tag => 
            `<span class="tag-badge" data-tag="${tag}">${tag}</span>`
        ).join('');
        
        // Add click handlers for tag filtering
        document.querySelectorAll('.tag-badge').forEach(badge => {
            badge.addEventListener('click', () => {
                badge.classList.toggle('selected');
                filterPatternsByTags();
            });
        });
    }

    function filterPatternsByTags() {
        const selectedTags = Array.from(document.querySelectorAll('.tag-badge.selected'))
            .map(badge => badge.dataset.tag);
        
        document.querySelectorAll('.pattern-item').forEach(pattern => {
            const patternTags = (pattern.dataset.tags || '').split(',').filter(tag => tag);
            if (selectedTags.length === 0 || selectedTags.some(tag => patternTags.includes(tag))) {
                pattern.style.display = 'block';
            } else {
                pattern.style.display = 'none';
            }
        });
    }

    function updatePatternDisplay(pattern, index) {
        return `
            <div class="pattern-item" data-index="${index}" data-tags="${pattern.tags ? pattern.tags.join(',') : ''}">
                <h4>${pattern.title}</h4>
                <div class="pattern-tags">
                    ${pattern.tags ? pattern.tags.map(tag => 
                        `<span class="tag-badge">${tag}</span>`
                    ).join('') : ''}
                </div>
                <div class="pattern-actions">
                    <button class="secondary-button edit-tags">Edit Tags</button>
                    <button class="secondary-button load-pattern">Load</button>
                    <button class="secondary-button delete-pattern">Delete</button>
                </div>
            </div>
        `;
    }

    function setupPatternEventListeners(savedPatterns) {
        // Load pattern button
        document.querySelectorAll('.load-pattern').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.pattern-item').dataset.index);
                loadPattern(savedPatterns[index]);
            });
        });

        // Delete pattern button
        document.querySelectorAll('.delete-pattern').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.pattern-item').dataset.index);
                deletePattern(index);
            });
        });

        // Edit tags button
        document.querySelectorAll('.edit-tags').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const patternItem = e.target.closest('.pattern-item');
                const index = parseInt(patternItem.dataset.index);
                setupTagEditing(index, savedPatterns[index]);
            });
        });
    }

    function setupTagEditing(index, pattern) {
        // Show tag input with current tags
        const tagInput = document.getElementById('pattern-tags');
        tagInput.value = pattern.tags ? pattern.tags.join(', ') : '';
        tagInput.dataset.editIndex = index;
        tagInput.focus();
        
        // Setup save button handler
        document.getElementById('save-tags').onclick = () => {
            const newTags = tagInput.value.split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag !== '');
            
            const savedPatterns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            savedPatterns[index].tags = newTags;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPatterns));
            
            // Clear editing state
            tagInput.value = '';
            delete tagInput.dataset.editIndex;
            
            loadSavedPatterns();
        };
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
