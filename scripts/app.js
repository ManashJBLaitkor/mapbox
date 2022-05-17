mapboxgl.accessToken =
  "pk.eyJ1IjoibWFuYXNoamIiLCJhIjoiY2wzMzFxc2xqMDNjdzNkcDYzajFmYzkyOCJ9.KCW747Iq5Kgt1pTcMCyyGg";
const map = new mapboxgl.Map({
  container: "map", // Specify the container ID
  style: "mapbox://styles/mapbox/streets-v11", // Specify which map style to use
  center: [-84.5, 38.05], // Specify the starting position [lng, lat]
  zoom: 11, // Specify the starting zoom
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/driving",
  alternatives: false,
  geometries: "geojson",
  controls: { instructions: true },
  flyTo: false,
});

const nav = new mapboxgl.NavigationControl();
map.addControl(nav);

map.addControl(directions, "bottom-left");
map.scrollZoom.enable();

const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");
var layerId;
for (const input of inputs) {
  input.onclick = (layer) => {
    layerId = layer.target.id;
    console.log(layerId);
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      // Select which mapbox-gl-draw control buttons to add to the map.
      controls: {
        polygon: true,
        trash: true,
      },
      // Set mapbox-gl-draw to draw by default.
      // The user does not have to click the polygon control button first.
      defaultMode: "draw_polygon",
    });
    if (layerId === "true") {
      map.removeControl(directions);
      map.addControl(draw);

      map.on("draw.create", updateArea);
      map.on("draw.delete", updateArea);
      map.on("draw.update", updateArea);

      function updateArea(e) {
        const data = draw.getAll();
        const answer = document.getElementById("calculated-area");
        if (data.features.length > 0) {
          const area = turf.area(data);
          // Restrict the area to 2 decimal points.
          const rounded_area = Math.round(area * 100) / 100;
          answer.innerHTML = `<p><strong>${rounded_area}</strong></p><p>square meters</p>`;
        } else {
          answer.innerHTML = "";
          if (e.type !== "draw.delete")
            alert("Click the map to draw a polygon.");
        }
      }
    }
  };
}
