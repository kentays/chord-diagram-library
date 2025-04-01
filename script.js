$(document).ready(function() {
    const SAVED_DIAGRAMS_KEY = "savedDiagrams";
    const HOLDSWORTH_DIAGRAMS_URL = "https://kentays.github.io/chord-diagram-library/diagrams/saved-diagrams.json";

    const scales = {
        //major modes
        "Ionian": ["R", "2", "3", "4", "5", "6", "7"],
        "Dorian": ["R", "2", "b3", "4", "5", "6", "b7"],
        "Phrygian": ["R", "b2", "b3", "4", "5", "b6", "b7"],
        "Lydian": ["R", "2", "3", "#4", "5", "6", "7"],
        "Mixolydian": ["R", "2", "3", "4", "5", "6", "b7"],
        "Aeolian": ["R", "2", "b3", "4", "5", "b6", "b7"],
        "Locrian": ["R", "b2", "b3", "4", "b5", "b6", "b7"],
        //melodic minor modes
        "Melodic Minor": ["R", "2", "b3", "4", "5", "6", "7"],
        "Dorian b2": ["R", "b2", "b3", "4", "5", "6", "b7"],
        "Lydian #5": ["R", "2", "3", "#4", "#5", "6", "7"],
        "Lydian b7": ["R", "2", "3", "#4", "5", "6", "b7"],
        "Mixolydian b6": ["R", "2", "3", "4", "5", "b6", "b7"],
        "Locrian Nat2": ["R", "2", "b3", "4", "b5", "b6", "b7"],
        "Altered": ["R", "b2", "#2", "3", "b5", "#5", "b7"],
        //harmonic minor modes
        "Harmonic Minor": ["R", "2", "b3", "4", "5", "b6", "7"],
        "Locrian #6": ["R", "b2", "b3", "4", "b5", "6", "b7"],
        "Ionian #5": ["R", "2", "3", "#4", "#5", "6", "7"],
        "Dorian #4": ["R", "2", "b3", "#4", "5", "6", "b7"],
        "Phrygian Dominant": ["R", "b2", "3", "4", "5", "b6", "b7"],
        "Lydian #2": ["R", "#2", "3", "#4", "5", "6", "7"],
        "Super Locrian": ["R", "b2", "b3", "b4", "b5", "b6", "b7"],
        //harmonic major modes
        "Harmonic Major": ["R", "2", "3", "4", "5", "b6", "7"],
        "Dorian b5": ["R", "2", "b3", "4", "b5", "6", "b7"],
        "Phrygian b4": ["R", "b2", "b3", "b4", "5", "b6", "b7"],
        "Lydian b3": ["R", "2", "b3", "#4", "5", "6", "7"],
        "Mixolydian b2": ["R", "b2", "3", "4", "5", "6", "b7"],
        "Lydian #6": ["R", "2", "3", "#4", "5", "#6", "7"],
        "Locrian bb7": ["R", "b2", "b3", "4", "b5", "b6", "bb7"],
    };

    const chart = new svguitar.SVGuitarChord("#result");

    let currentSettings = {}; // Global variable to store the current settings

    function generateDiagram(settings, chord) {
        currentSettings = settings; // Store the current settings globally
        const stringSets = calculateStringSets(chord);
        const resultContainer = $("#result");
        resultContainer.empty();

        // Set the chord name at the top of the diagram column
        $("#chord-name").text(settings.title);

        stringSets.forEach((set, index) => {
            const diagramContainer = $("<div>").attr("id", `result-${index}`).css("display", "inline-block");
            resultContainer.append(diagramContainer);

            // Calculate the highest fret used in the chord
            const highestFret = Math.max(...set.fingers.filter(f => f[1] !== 'x').map(f => f[1]), 5);

            // Include orientation in adjustedSettings
            const adjustedSettings = {
                ...settings,
                frets: Math.max(highestFret, 5),
                title: '',
                orientation: $('input[name="orientation-mode"]:checked').val() // Get current orientation
            };

            const chart = new svguitar.SVGuitarChord(`#result-${index}`);
            chart.configure(adjustedSettings).chord(set).draw();
        });

        addDownloadButtons(currentSettings);
    }

    function determineScales(degrees) {
        const possibleScales = [];
        for (const [scale, scaleDegrees] of Object.entries(scales)) {
            if (degrees.every(degree => scaleDegrees.includes(degree))) {
                possibleScales.push(scale);
            }
        }
        return possibleScales.length > 0 ? possibleScales : ["Unknown"];
    }

    function calculateStringSets(chord) {
        const allowOpenStrings = $('input[name="position-mode"]:checked').val() === 'open';
        const tuningOffsets = [0, 5, 9, 14, 19, 24];
        const maxString = Math.max(...chord.fingers.filter(f => f[1] !== 'x').map(f => f[0]));
        const minString = Math.min(...chord.fingers.filter(f => f[1] !== 'x').map(f => f[0]));
        const stringRange = maxString - minString + 1;
        const noteCount = chord.fingers.filter(f => f[1] !== 'x').length;
        const possibleSets = [];

        // Generate string sets by shifting down
        for (let i = 0; i <= 6 - stringRange; i++) {
            const newSet = chord.fingers.map(f => {
                const newString = f[0] + i;
                if (newString > 6 || newString < 1) {
                    return null;
                }
                let fretOffset = tuningOffsets[newString - 1] - tuningOffsets[f[0] - 1];
                if ((f[0] === 2 && newString === 3) || (f[0] === 3 && newString === 2)) {
                    fretOffset += (f[0] === 2 && newString === 3) ? 0 : 1;
                }
                const newFret = f[1] === 'x' ? 'x' : f[1] + fretOffset;
                return [newString, newFret, f[2]];
            }).filter(f => f !== null);

            let adjustedSet;
            if (allowOpenStrings) {
                // When allowing open strings, shift everything down so lowest fret becomes 0
                const minFret = Math.min(...newSet.filter(f => f[1] !== 'x').map(f => f[1]));
                adjustedSet = newSet.map(f => {
                    if (f[1] === 'x') return f;
                    return [f[0], f[1] - minFret, f[2]]; // Subtract minFret to make lowest note 0
                });
            } else {
                // Original behavior: shift everything so lowest fret becomes 1
                const minFret = Math.min(...newSet.filter(f => f[1] !== 'x').map(f => f[1]));
                adjustedSet = newSet.map(f => {
                    if (f[1] === 'x') return f;
                    return [f[0], f[1] - minFret + 1, f[2]]; // Add 1 to start at fret 1
                });
            }

            // Mark any unused strings as 'x'
            for (let j = 1; j <= 6; j++) {
                if (!adjustedSet.some(f => f[0] === j)) {
                    adjustedSet.push([j, 'x']);
                }
            }

            // Ensure the new set has at least the same number of notes as the original chord
            if (adjustedSet.filter(f => f[1] !== 'x').length >= noteCount) {
                possibleSets.push({ fingers: adjustedSet, barres: chord.barres });
            }
        }

        // Generate string sets by shifting up
        for (let i = 1; i <= 6 - stringRange; i++) {
            const newSet = chord.fingers.map(f => {
                const newString = f[0] - i;
                if (newString > 6 || newString < 1) {
                    return null;
                }
                let fretOffset = tuningOffsets[newString - 1] - tuningOffsets[f[0] - 1];
                if ((f[0] === 2 && newString === 3) || (f[0] === 3 && newString === 2)) {
                    fretOffset += (f[0] === 2 && newString === 3) ? 0 : 0;
                }
                const newFret = f[1] === 'x' ? 'x' : f[1] + fretOffset;
                return [newString, newFret, f[2]];
            }).filter(f => f !== null);

            let adjustedSet;
            if (allowOpenStrings) {
                const minFret = Math.min(...newSet.filter(f => f[1] !== 'x').map(f => f[1]));
                adjustedSet = newSet.map(f => {
                    if (f[1] === 'x') return f;
                    return [f[0], f[1] - minFret, f[2]];
                });
            } else {
                const minFret = Math.min(...newSet.filter(f => f[1] !== 'x').map(f => f[1]));
                adjustedSet = newSet.map(f => {
                    if (f[1] === 'x') return f;
                    return [f[0], f[1] - minFret + 1, f[2]];
                });
            }

            for (let j = 1; j <= 6; j++) {
                if (!adjustedSet.some(f => f[0] === j)) {
                    adjustedSet.push([j, 'x']);
                }
            }

            if (adjustedSet.filter(f => f[1] !== 'x').length >= noteCount) {
                possibleSets.push({ fingers: adjustedSet, barres: chord.barres });
            }
        }

        possibleSets.forEach((set, index) => {
            const strings = set.fingers.map(f => f[0]).sort();
            console.log(`String set ${index + 1}:`, strings);
        });

        console.log('Possible string sets:', possibleSets);
        return possibleSets;
    }

    function saveDiagram(settings, chord) {
        const degrees = chord.fingers.map(finger => finger[2]?.text).filter(text => text);
        const scales = determineScales(degrees);
        const melody = chord.fingers.filter(finger => finger[1] !== 'x').sort((a, b) => a[0] - b[0])[0]?.[2]?.text || 'Unknown';

        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        savedDiagrams.push({ settings, chord, scales, melody });
        localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(savedDiagrams));
        displaySavedDiagrams();
    }

    function displaySavedDiagrams() {
        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        const savedDiagramsContainer = $("#saved-diagrams");
        savedDiagramsContainer.empty();
        const melodyOrder = ["", "R", "b2", "2", "#2", "b3", "3", "4", "#4", "b5", "5", "#5", "b6", "6", "b7", "7"];

        savedDiagrams.forEach((diagram, index) => {
            diagram.originalIndex = index;
        });

        savedDiagrams.sort((a, b) => {
            const melodyA = a.melody || '';
            const melodyB = b.melody || '';
            return melodyOrder.indexOf(melodyA) - melodyOrder.indexOf(melodyB);
        });

        savedDiagrams.forEach((diagram, sortedIndex) => {
            const diagramElement = $(`
                <div id="diagram-${sortedIndex}" class="saved-diagram-row">
                    <span class="diagram-melody">${diagram.melody || 'N/A'}</span>
                    <span class="diagram-name">${diagram.settings.title}</span>
                    <button class="delete-diagram" data-original-index="${diagram.originalIndex}">Delete</button>
                </div>
            `);

            diagramElement.find(".diagram-melody, .diagram-name").click(function() {
                generateDiagram(diagram.settings, diagram.chord);
            });

            diagramElement.find(".delete-diagram").click(function() {
                const originalIndex = $(this).data("original-index");
                deleteDiagram(originalIndex);
            });

            savedDiagramsContainer.append(diagramElement);
        });
    }
    function deleteDiagram(index) {
        const confirmation = confirm('Are you sure you want to delete this diagram?');
        if (confirmation) {
            const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
            savedDiagrams.splice(index, 1);
            localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(savedDiagrams));
            displaySavedDiagrams();
        }
    }

    function populateDropdowns() {
        const dropdowns = ['#string1', '#string2', '#string3', '#string4', '#string5', '#string6'];
        dropdowns.forEach(id => {
            const dropdown = $(id);
            dropdown.empty();
            dropdown.append('<option value="x">x</option>');
            for (let i = 0; i <= 9; i++) {
                dropdown.append(`<option value="${i}">${i}</option>`);
            }
        });

        const textDropdowns = ['#string1-text', '#string2-text', '#string3-text', '#string4-text', '#string5-text', '#string6-text'];
        const textOptions = [
            { value: "", text: "None" },
            { value: "R", text: "R" },
            { value: "b2", text: "b2" },
            { value: "2", text: "2" },
            { value: "#2", text: "#2" },
            { value: "b3", text: "b3" },
            { value: "3", text: "3" },
            { value: "4", text: "4" },
            { value: "#4", text: "#4" },
            { value: "b5", text: "b5" },
            { value: "5", text: "5" },
            { value: "#5", text: "#5" },
            { value: "b6", text: "b6" },
            { value: "6", text: "6" },
            { value: "b7", text: "b7" },
            { value: "7", text: "7" }
        ];

        textDropdowns.forEach(id => {
            const dropdown = $(id);
            dropdown.empty();
            textOptions.forEach(option => {
                dropdown.append(`<option value="${option.value}">${option.text}</option>`);
            });
        });

        $('select').change(function() {
            const stringInput = $(this).closest('.string-input');
            stringInput.addClass('modified');
            setTimeout(() => {
                stringInput.removeClass('modified');
            }, 300);
        });

        // Add fingering dropdowns
        const fingeringDropdowns = ['#string1-finger', '#string2-finger', '#string3-finger', 
                                '#string4-finger', '#string5-finger', '#string6-finger'];
        const fingeringOptions = [
            { value: "", text: "None" },
            { value: "1", text: "1" },
            { value: "2", text: "2" },
            { value: "3", text: "3" },
            { value: "4", text: "4" }
        ];

        fingeringDropdowns.forEach(id => {
            const dropdown = $(id);
            dropdown.empty();
            fingeringOptions.forEach(option => {
                dropdown.append(`<option value="${option.value}">${option.text}</option>`);
            });
        });
    }
    $("#settings-form").append(`
        <div class="diagram-options">
            <h3>Diagram Options</h3>
            <div class="display-toggle">
                <label>
                    <input type="radio" name="display-mode" value="interval" checked> 
                    &#x2197;&#xFE0F; Intervals
                </label>
                <label>
                    <input type="radio" name="display-mode" value="fingering"> 
                    &#x1F91A;&#xFE0F; Fingerings
                </label>
            </div>
            <div class="position-toggle">
                <label>
                    <input type="radio" name="position-mode" value="moveable" checked> 
                    &#x1F69A; Moveable
                </label>
                <label>
                    <input type="radio" name="position-mode" value="open"> 
                    &#x1F450; Open
                </label>
            </div>
            <div class="orientation-toggle">
                <label>
                    <input type="radio" name="orientation-mode" value="horizontal" checked> 
                    &#x2194;&#xFE0F; Horizontal
                </label>
                <label>
                    <input type="radio" name="orientation-mode" value="vertical"> 
                    &#x2195;&#xFE0F; Vertical
                </label>
            </div>
        </div>
    `);
    
    $('input[name="orientation-mode"]').change(function() {
        const orientation = $(this).val();
        
        if (currentSettings && $("#result svg").length > 0) {
            // Update current settings with new orientation
            currentSettings.orientation = orientation;
            const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
            const currentChord = savedDiagrams.find(d => d.settings.title === currentSettings.title)?.chord;
            
            if (currentChord) {
                // Pass the orientation to the adjusted settings in generateDiagram
                generateDiagram({...currentSettings}, currentChord);
            }
        }
    });

    function retroactivelyAddMelody() {
        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        let updated = false;
        savedDiagrams.forEach(diagram => {
            if (!diagram.melody) {
                const melody = diagram.chord.fingers.filter(finger => finger[1] !== 'x').sort((a, b) => a[0] - b[0])[0]?.[2]?.text || 'Unknown';
                diagram.melody = melody;
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(savedDiagrams));
        }
    }

    function createScaleCheckboxes() {
        const scaleCategories = {
            "major-modes": ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"],
            "melodic-minor-modes": ["Melodic Minor", "Dorian b2", "Lydian #5", "Lydian b7", "Mixolydian b6", "Locrian Nat2", "Altered"],
            "harmonic-minor-modes": ["Harmonic Minor", "Locrian #6", "Ionian #5", "Dorian #4", "Phrygian Dominant", "Lydian #2", "Super Locrian"],
            "harmonic-major-modes": ["Harmonic Major", "Dorian b5", "Phrygian b4", "Lydian b3", "Mixolydian b2", "Lydian #6", "Locrian bb7"]
        };

        for (const [category, scales] of Object.entries(scaleCategories)) {
            const container = $(`#${category}`);
            scales.forEach(scale => {
                const checkbox = $(`
                    <label class="mode-option">
                        <input type="checkbox" name="scale" value="${scale}">
                        ${scale}
                    </label>
                `);
                container.append(checkbox);
            });
        }

        $("input[name='scale']").change(function() {
            $(this).parent().toggleClass("selected", this.checked);
            filterDiagrams();
        });
    }

    function filterDiagrams() {
        const selectedScales = $("input[name='scale']:checked").map(function() {
            return this.value;
        }).get();

        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        
        const filteredDiagrams = selectedScales.length === 0 ? savedDiagrams : savedDiagrams.filter(diagram => {
            return diagram.scales.some(scale => selectedScales.includes(scale));
        });

        const melodyOrder = ["", "R", "b2", "2", "#2", "b3", "3", "4", "#4", "b5", "5", "#5", "b6", "6", "b7", "7"];
        filteredDiagrams.sort((a, b) => {
            const melodyA = a.melody || '';
            const melodyB = b.melody || '';
            return melodyOrder.indexOf(melodyA) - melodyOrder.indexOf(melodyB);
        });

        const savedDiagramsContainer = $("#saved-diagrams");
        savedDiagramsContainer.empty();
        
        if ($('.saved-diagrams-header').length === 0) {
            savedDiagramsContainer.before(`
                <div class="saved-diagrams-header">
                    <div class="header-cell">Top Note</div>
                    <div class="header-cell">Chord Name</div>
                    <div class="header-cell">Delete</div>
                </div>
            `);
        }

        filteredDiagrams.forEach((diagram, index) => {
            const diagramElement = $(`
                <div id="diagram-${index}" class="saved-diagram-row">
                    <span class="diagram-melody">${diagram.melody || 'N/A'}</span>
                    <span class="diagram-name">${diagram.settings.title}</span>
                    <button class="delete-diagram" data-original-index="${diagram.originalIndex}">Delete</button>
                </div>
            `);

            diagramElement.find(".diagram-melody, .diagram-name").click(function() {
                generateDiagram(diagram.settings, diagram.chord);
            });

            diagramElement.find(".delete-diagram").click(function() {
                const originalIndex = $(this).data("original-index");
                deleteDiagram(originalIndex);
            });

            savedDiagramsContainer.append(diagramElement);
        });
    }

    $('input[name="position-mode"]').change(function() {
        const allowOpenStrings = $(this).val() === 'open';
        
        if (currentSettings && $("#result svg").length > 0) {
            const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
            const currentChord = savedDiagrams.find(d => d.settings.title === currentSettings.title)?.chord;
            
            if (currentChord) {
                generateDiagram(currentSettings, currentChord);
            }
        }
    });
    
    $("#settings-form").submit(function(event) {
        event.preventDefault();

        const title = $("#title").val().trim();
        if (title === '' || title === 'Chord Name') {
            alert('Please enter a chord name');
            $("#title").focus();
            return false;
        }

        const fretValues = [
            $("#string1").val(),
            $("#string2").val(),
            $("#string3").val(),
            $("#string4").val(),
            $("#string5").val(),
            $("#string6").val()
        ];

        if (fretValues.every(value => value === 'x')) {
            alert('At least one fret position must be selected');
            return false;
        }

        const strings = $("#strings").val();
        const frets = $("#frets").val();
        const style = $("#style").val();
        const color = $("#color").val();
        const orientation = $("#orientation").val();

        const fingers = [
            [1, $("#string1").val(), $("#string1-text").val(), $("#string1-finger").val()],
            [2, $("#string2").val(), $("#string2-text").val(), $("#string2-finger").val()],
            [3, $("#string3").val(), $("#string3-text").val(), $("#string3-finger").val()],
            [4, $("#string4").val(), $("#string4-text").val(), $("#string4-finger").val()],
            [5, $("#string5").val(), $("#string5-text").val(), $("#string5-finger").val()],
            [6, $("#string6").val(), $("#string6-text").val(), $("#string6-finger").val()]
        ].map(([string, fret, text, finger]) => {
            const fingerData = [string, fret === 'x' ? fret : parseInt(fret)];
            if (text || finger) {
                fingerData.push({ text, finger });
            }
            return fingerData;
        });

        const barresInput = $("#barres").val() || "";
        const barres = barresInput.split(';').map(barre => {
            const [fromString, toString, fret] = barre.split(',');
            if (fromString && toString && fret) {
                return { fromString: parseInt(fromString), toString: parseInt(toString), fret: parseInt(fret) };
            }
            return null;
        }).filter(barre => barre !== null);

        const settings = {
            title,
            strings,
            frets,
            style,
            color,
            orientation
        };

        const chord = {
            fingers,
            barres
        };

        console.log('Form submission settings:', settings);
        console.log('Form submission chord:', chord);

        generateDiagram(settings, chord);
        saveDiagram(settings, chord);
    });

    $('input[name="display-mode"]').change(function() {
        const mode = $(this).val();
        if (currentSettings && $("#result svg").length > 0) {
            const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
            const currentChord = savedDiagrams.find(d => d.settings.title === currentSettings.title)?.chord;
            
            if (currentChord) {
                // Update the displayed text based on mode
                currentChord.fingers = currentChord.fingers.map(f => {
                    if (f[2]) {
                        const newF = [...f];
                        newF[2] = {
                            text: mode === 'interval' ? f[2].text : f[2].finger || ''
                        };
                        return newF;
                    }
                    return f;
                });
                generateDiagram(currentSettings, currentChord);
            }
        }
    });

    displaySavedDiagrams();
    populateDropdowns();
    retroactivelyAddMelody();
    createScaleCheckboxes();

    $("#clear-saved-diagrams").click(function() {
        const confirmation = confirm('Are you sure you want to clear all saved diagrams?');
        if (confirmation) {
            localStorage.removeItem(SAVED_DIAGRAMS_KEY);
            displaySavedDiagrams();
        }
    });

    document.getElementById('download-saved-diagrams').addEventListener('click', function() {
        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        if (savedDiagrams.length > 0) {
            const fileName = prompt('Enter file name:', 'saved-diagrams.json');
            if (!fileName) return;
            
            const jsonBlob = new Blob([JSON.stringify(savedDiagrams, null, 2)], { type: 'application/json' });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = jsonUrl;
            downloadLink.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            alert('No saved diagrams to download.');
        }
    });

    document.getElementById('load-saved-diagrams').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                try {
                    const savedDiagrams = JSON.parse(content);
                    localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(savedDiagrams));
                    displaySavedDiagrams();
                } catch (error) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    });

    const initialSettings = {
        title: 'Major Triad',
        color: '#000000',
        strings: 6,
        frets: 5,
        style: 'normal',
        orientation: 'horizontal'
    };

    const initialChord = {
        fingers: [
            [1, 'x'],
            [2, 1, { text: '5' }],
            [3, 2, { text: '3' }],
            [4, 3, { text: 'R' }],
            [5, 'x'],
            [6, 'x']
        ],
        barres: [
        ]
    };

    generateDiagram(initialSettings, initialChord);

    $(".filter-header").click(function() {
        $(this).next(".filter-content").slideToggle();
    });

    $("#load-holdsworth-voicings").click(function() {
        fetch(HOLDSWORTH_DIAGRAMS_URL)
            .then(response => response.json())
            .then(data => {
                const confirmation = confirm('This will add Holdsworth voicings to your saved diagrams. Continue?');
                if (confirmation) {
                    const currentDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
                    const combinedDiagrams = [...currentDiagrams, ...data];
                    localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(combinedDiagrams));
                    displaySavedDiagrams();
                }
            })
            .catch(error => {
                console.error('Error loading Holdsworth voicings:', error);
                alert('Failed to load Holdsworth voicings. Please try again later.');
            });
    });
});

function downloadAllDiagrams(settings) {
    const zip = new JSZip();
    const svgFolder = zip.folder("SVGs");
    const pngFolder = zip.folder("PNGs");
    const scale = 6;

    $("#result > div").each(function(index, element) {
        const svgElement = $(element).find("svg")[0];
        if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            svgFolder.file(`${settings.title}-set-${index + 1}.svg`, svgBlob);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(function(blob) {
                    pngFolder.file(`${settings.title}-set-${index + 1}.png`, blob);
                    if (index === $("#result > div").length - 1) {
                        zip.generateAsync({ type: "blob" }).then(function(content) {
                            saveAs(content, `${settings.title}-chord-diagrams.zip`);
                        });
                    }
                }, 'image/png', 1.0);
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
    });
}

document.getElementById('download-all-diagrams').addEventListener('click', function() {
    const settings = {
        title: $("#chord-name").text() || "chord"
    };
    downloadAllDiagrams(settings);
});


$("#title").on({
    focus: function() {
        if (this.value === 'Chord Name') {
            this.value = '';
        }
    },
    blur: function() {
        if (this.value.trim() === '') {
            this.value = 'Chord Name';
        }
    }
});

function loadHoldsworthVoicings() {
    fetch(HOLDSWORTH_DIAGRAMS_URL)
        .then(response => response.json())
        .then(data => {
            const confirmation = confirm('This will add Holdsworth voicings to your saved diagrams. Continue?');
            if (confirmation) {
                const currentDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
                const combinedDiagrams = [...currentDiagrams, ...data];
                localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(combinedDiagrams));
                displaySavedDiagrams();
            }
        })
        .catch(error => {
            console.error('Error loading Holdsworth voicings:', error);
            alert('Failed to load Holdsworth voicings. Please try again later.');
        });
}