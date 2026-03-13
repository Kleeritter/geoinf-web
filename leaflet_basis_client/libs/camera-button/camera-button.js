let input;
let image;

/**
 * Erstellt einen CameraButton, der auf der Oberfläche an das CameraDivElement angehängt wird.
 * Über das Input Element kann eine Datei ausgewählt werden bzw. es wird die Kamera geöffnet und ein 
 * neues Foto kann erstellt werden. 
 */
function createCameraButton() {

    // Input Element für die Auswahl / Aufnahme eines neuen Fotos
    input = document.createElement("input");
    input.id = "cameraButton";
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", onChange);

    // Input Element im Label Element "verstecken", damit es schöner aussieht
    const label = document.createElement("label");
    label.for = "cameraButton";
    label.classList = "cameraButton";
    label.appendChild(input);

    // Label und Input zur Oberfläche hinzufügen
    const cameraButton = document.getElementById("cameraDivElement");
    cameraButton.appendChild(label);

    // HTML-Element für die Darstellung des ausgewählten Fotos erzeugen
    createImageContainer();
}

/**
 * Erstellt einen CameraButton in einem spezifischen Element (z.B. für Popups)
 * @param {HTMLElement} parentElement - Das Element, in dem der Button eingefügt wird
 * @param {Function} onImageSelect - Callback-Funktion, wenn ein Foto ausgewählt wird
 * @returns {HTMLImageElement} Das Image-Element für die Anzeige des Fotos
 */
function createCameraButtonInElement(parentElement, onImageSelect) {
    // Input Element für die Auswahl / Aufnahme eines neuen Fotos
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = "image/*";
    
    // Image-Element für die Anzeige
    const imageElement = document.createElement("img");
    imageElement.classList = "image";
    imageElement.style.maxWidth = "200px";
    imageElement.style.marginTop = "10px";
    imageElement.style.borderRadius = "4px";
    
    // Event Listener für Dateiauswahl
    inputElement.addEventListener("change", function() {
        const file = inputElement.files[0];
        if(file) {
            const reader = new FileReader();
            reader.addEventListener("load", function(event) {
                imageElement.src = event.target.result;
                // Callback aufrufen, wenn Foto ausgewählt wurde
                if (onImageSelect) {
                    onImageSelect(event.target.result);
                }
            });
            reader.readAsDataURL(file);
        }
    });

    // Input Element im Label Element "verstecken"
    const label = document.createElement("label");
    label.classList = "cameraButton";
    label.style.cursor = "pointer";
    label.append(inputElement);

    // Label und Image-Element zum Parent hinzufügen
    parentElement.appendChild(label);
    parentElement.appendChild(imageElement);
    
    return imageElement;
}

/**
 * Wird aufgerufen, wenn sich die Dateiauswahl des Input-Elements ändert.
 * Das ausgewählte / aufgenommene Foto wird ausgelesen und im Image-Element dargestellt.
 */
function onChange() {
    const file = input.files[0];
    console.log(file);

    if(file) {
        const reader = new FileReader();

        // Event löst aus, wenn die Datei vollständig eingelesen wurde
        reader.addEventListener("load", function(event) {
            console.log(event);
            // Eingelesene Datei als src zum Image-Element hinzufügen
            image.src = event.target.result;
        });

        // Datei einlesen
        reader.readAsDataURL(file);
    }
}

/**
 * Erzeugt ein neues Image-Element und fügt dies in den ImageContaienr ein
 */
function createImageContainer() {
    const imageContainer = document.getElementById("imageContainer");
    image = document.createElement("img");
    image.classList = "image";

    imageContainer.appendChild(image);
}