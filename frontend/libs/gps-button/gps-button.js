let marker;
let active = false;
let button;
let watchId;
let GPSPosition;

/** 
 * Erstellt den GPS Button und bringt ihn auf die Karte
*/
function createGPSButton() {
    const gpsDivElement = document.getElementById("gpsDivElement");
    button = document.createElement("div");
    button.classList = "gpsButton gps_deactive";
    button.addEventListener("click", onClick);

    gpsDivElement.appendChild(button);
}

/**
 * Wird ausgefuehrt, wenn der GPS Button geklickt wird. Wenn der Button derzeit aktiv ist, dann
 * wird er auf deaktiv gestezt und das Horchen auf die Positionsupdates wird eingestellt. Wenn 
 * der Button deaktiv ist, dann wird er auf akiv gestellt und es wird damit begonnen, auf 
 * Positionsupdates zu horchen.
 */
function onClick() {
    if(active) {
        button.classList.remove("gps_active");
        button.classList.add("gps_deactive");

        endGPSUpdate();
        active = false;
    }else{
        button.classList.remove("gps_deactive");
        button.classList.add("gps_active");

        startGPSUpdate();
        active = true;
    }
}

/**
 * Horcht auf Positionsupdates. Sobald eine neue Position vorhanden ist,
 * wird dies mithilfe eines Markers auf der Karte angezeigt.
 */
function startGPSUpdate() {
    watchId = navigator.geolocation.watchPosition(function(position) {
        console.log(position);
        GPSPosition = position;
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        if(!marker) {
            const icon = L.divIcon({className:"position_marker pulse"});

            marker = L.marker([lat, long], {icon:icon}).addTo(map);
        }else{
            marker.setLatLng([lat,long]);
        }
    })
    console.log(watchId);
}

/**
 * Beendet das Horchen auf Positionsupdates und entfernt den marker
 * aus der Karte.
 */
function endGPSUpdate() {
    if(watchId) {
        navigator.geolocation.clearWatch(watchId);
    }

    if(marker) {
        marker.remove();
        marker = null;
    }
}

function getGPSPosition() {
    return GPSPosition;
}
