$(document).ready(function() {
    const SAVED_DIAGRAMS_KEY = "savedDiagrams";

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

        console.log('Generating diagrams for string sets:', stringSets); // Log the string sets being processed

        stringSets.forEach((set, index) => {
            const diagramContainer = $("<div>").attr("id", `result-${index}`).css("display", "inline-block");
            resultContainer.append(diagramContainer);

            // Calculate the highest fret used in the chord
            const highestFret = Math.max(...set.fingers.filter(f => f[1] !== 'x').map(f => f[1]), 5);

            // Adjust the settings to set the number of frets based on the highest fret
            const adjustedSettings = { ...settings, frets: Math.max(highestFret, 5), title: '', orientation: 'horizontal' };

            const chart = new svguitar.SVGuitarChord(`#result-${index}`);
            chart.configure(adjustedSettings).chord(set).draw();

            console.log(`Generated diagram for set ${index}:`, set); // Log each generated diagram
        });

        addDownloadButtons(currentSettings); // Add download buttons after generating diagrams
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
        const tuningOffsets = [0, 5, 9, 14, 19, 24]; // Cumulative intervals between strings in semitones (EADGBE tuning)
        const maxString = Math.max(...chord.fingers.filter(f => f[1] !== 'x').map(f => f[0]));
        const minString = Math.min(...chord.fingers.filter(f => f[1] !== 'x').map(f => f[0]));
        const stringRange = maxString - minString + 1;
        const noteCount = chord.fingers.filter(f => f[1] !== 'x').length;
        console.log('String range:', stringRange); // Print the string range for debugging
        const possibleSets = [];

        // Generate string sets by shifting down
        for (let i = 0; i <= 6 - stringRange; i++) {
            const newSet = chord.fingers.map(f => {
                const newString = f[0] + i;
                if (newString > 6 || newString < 1) {
                    return null;
                }
                let fretOffset = tuningOffsets[newString - 1] - tuningOffsets[f[0] - 1];
                // Adjust fret offset only when crossing from 2nd to 3rd string or vice versa
                if ((f[0] === 2 && newString === 3) || (f[0] === 3 && newString === 2)) {
                    fretOffset += (f[0] === 2 && newString === 3) ? 0 : 1;
                }
                const newFret = f[1] === 'x' ? 'x' : f[1] + fretOffset;
                return [newString, newFret, f[2]];
            }).filter(f => f !== null);

            // Ensure no zero frets and shift all fingers so that the lowest fret is on the 1st fret
            const minFret = Math.min(...newSet.filter(f => f[1] !== 'x').map(f => f[1]));
            const adjustedSet = newSet.map(f => {
                if (f[1] === 'x') return f;
                return [f[0], f[1] - minFret + 1, f[2]];
            });

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
                // Adjust fret offset only when crossing from 2nd to 3rd string or vice versa
                if ((f[0] === 2 && newString === 3) || (f[0] === 3 && newString === 2)) {
                    fretOffset += (f[0] === 2 && newString === 3) ? 0 : 0;
                }
                const newFret = f[1] === 'x' ? 'x' : f[1] + fretOffset;
                return [newString, newFret, f[2]];
            }).filter(f => f !== null);

            // Ensure no zero frets and shift all fingers so that the lowest fret is on the 1st fret
            const minFret = Math.min(...newSet.filter(f => f[1] !== 'x').map(f => f[1]));
            const adjustedSet = newSet.map(f => {
                if (f[1] === 'x') return f;
                return [f[0], f[1] - minFret + 1, f[2]];
            });

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

        // Print the strings that the possible string sets will be on
        possibleSets.forEach((set, index) => {
            const strings = set.fingers.map(f => f[0]).sort();
            console.log(`String set ${index + 1}:`, strings);
        });

        console.log('Possible string sets:', possibleSets); // Log the possible string sets
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

        // Add original index to each diagram for correct deletion
        savedDiagrams.forEach((diagram, index) => {
            diagram.originalIndex = index;
        });

        // Sort diagrams by melody note according to the specified order
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

            // Add click handlers
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
        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        savedDiagrams.splice(index, 1);
        localStorage.setItem(SAVED_DIAGRAMS_KEY, JSON.stringify(savedDiagrams));
        displaySavedDiagrams();
    }

    function populateDropdowns() {
        // Fret number dropdowns
        const dropdowns = ['#string1', '#string2', '#string3', '#string4', '#string5', '#string6'];
        dropdowns.forEach(id => {
            const dropdown = $(id);
            dropdown.empty();
            dropdown.append('<option value="x">x</option>');
            for (let i = 0; i <= 9; i++) {
                dropdown.append(`<option value="${i}">${i}</option>`);
            }
        });

        // Scale degrees options
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

        // Add visual feedback for dropdown changes
        $('select').change(function() {
            const stringInput = $(this).closest('.string-input');
            stringInput.addClass('modified');
            setTimeout(() => {
                stringInput.removeClass('modified');
            }, 300);
        });
    }

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

        // Add event listeners to checkboxes
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
        const filteredDiagrams = savedDiagrams.filter(diagram => {
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
        
        // Add headers if they don't exist
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

            // Add click handlers
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

    // generate diagram call
    $("#settings-form").submit(function(event) {
        event.preventDefault();

        // Validate chord name
        const title = $("#title").val().trim();
        if (title === '' || title === 'Chord Name') {
            alert('Please enter a chord name');
            $("#title").focus();
            return false;
        }

        // Check if all frets are 'x'
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

        // Parse fingers input
        const fingers = [
            [1, $("#string1").val(), $("#string1-text").val()],
            [2, $("#string2").val(), $("#string2-text").val()],
            [3, $("#string3").val(), $("#string3-text").val()],
            [4, $("#string4").val(), $("#string4-text").val()],
            [5, $("#string5").val(), $("#string5-text").val()],
            [6, $("#string6").val(), $("#string6-text").val()]
        ].map(([string, fret, text]) => {
            const finger = [string, fret === 'x' ? fret : parseInt(fret)];
            if (text) {
                finger.push({ text });
            }
            return finger;
        });

        // Parse barres input
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

        console.log('Form submission settings:', settings); // Log the settings
        console.log('Form submission chord:', chord); // Log the chord

        generateDiagram(settings, chord);
        saveDiagram(settings, chord);
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

    $("#saved-diagrams").on("click", ".delete-diagram", function() {
        const index = $(this).data("index");
        deleteDiagram(index);
    });

    //download json
    document.getElementById('download-saved-diagrams').addEventListener('click', function() {
        const savedDiagrams = JSON.parse(localStorage.getItem(SAVED_DIAGRAMS_KEY)) || [];
        if (savedDiagrams.length > 0) {
            const fileName = prompt('Enter file name:', 'saved-diagrams.json');
            if (!fileName) return; // User canceled the prompt
            
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
    //load json
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

    // Initial settings and chord
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

    // Initialize the chord diagram with the initial settings and chord
    generateDiagram(initialSettings, initialChord);

    // Make filter sections collapsible
    $(".filter-header").click(function() {
        $(this).next(".filter-content").slideToggle();
    });
});

// Function to download all diagrams as SVG and PNG in a zip file
function downloadAllDiagrams(settings) {
    const zip = new JSZip();
    const svgFolder = zip.folder("SVGs");
    const pngFolder = zip.folder("PNGs");
    const scale = 6; // Increase scale factor for higher resolution

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
                }, 'image/png', 1.0); // Set quality to maximum
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
    });
}

// Add event listener for the download all diagrams button
document.getElementById('download-all-diagrams').addEventListener('click', function() {
    const settings = {
        title: $("#chord-name").text() || "chord"
    };
    downloadAllDiagrams(settings);
});

// Add a separate download PNG button under each diagram
function addDownloadButtons(settings) {
    $("#result > div").each(function(index, element) {
        const downloadPngButton = $('<button>Download PNG</button>');
        downloadPngButton.on('click', function() {
            const svgElement = $(element).find("svg")[0];
            if (svgElement) {
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                const scale = 3; // Increase this value to make the PNG larger

                img.onload = function() {
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.scale(scale, scale);
                    ctx.drawImage(img, 0, 0);
                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = `${settings.title}-set-${index + 1}.png`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            } else {
                alert('No SVG diagram to download.');
            }
        });
        $(element).append(downloadPngButton);
    });
}

// Add input event handlers for the title field
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