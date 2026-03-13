function createUploadButton() {
    const uploadDivElement = document.getElementById("uploadDivElement");

    const button = document.createElement("div");
    button.id = "uploadButton";
    button.classList = "uploadButton";
    button.addEventListener("click", onUploadClick);

    uploadDivElement.appendChild(button);
}

function onUploadClick() {
    const position = getGPSPosition();
    const image = getImage();

    if(position && image) {
        const postBody = {
            name: "Baum2",
            geometry: {
                lat: position.coords.latitude,
                long: position.coords.longitude
            },
            image: image
        }

        fetch("http://localhost:5000/tree/", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(postBody)}).then(function(response) {
            console.log(response);
        })
    }
}