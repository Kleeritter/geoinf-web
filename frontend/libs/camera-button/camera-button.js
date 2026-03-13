let input;
let imageContainer;
let image;

function createCameraButton() {
  input = document.createElement("input");
  input.id = "cameraButton";
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";
  input.onchange = onChange;

  const label = document.createElement("label");
  label.for = "cameraButton";
  label.classList = "cameraButton";
  label.appendChild(input);

  const cameraDivElement = document.getElementById("cameraDivElement");
  cameraDivElement.appendChild(label);

  createImageContainer();
}

function createImageContainer() {
  imageContainer = document.getElementById("imageContainer");
  image = document.createElement("img");
  image.classList = "image";

  imageContainer.appendChild(image);
}

function onChange() {
  console.log(input.files);
  const file = input.files[0];

  const reader = new FileReader();

  reader.addEventListener("load", function (event) {
    console.log(event);
    image.src = event.target.result;
  });
  reader.readAsDataURL(file);
}

function getImage(deletediamge) {
  const input = document.getElementById("pp-cameraInput");
  if (deletediamge) {
    return "";
  } else if (!input || !input.files || input.files.length === 0) {
    return null;
  }

  return new Promise((resolve) => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result); // Base64 Data-URL
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
