mapboxgl.accessToken =
  "pk.eyJ1IjoibWFuYXNoamIiLCJhIjoiY2wzY2tweWJ4MG00bTNpcDR3OHo2OTB5NiJ9.l1tBEOuzvUruvgdQdVvk7w";
var map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/mapbox/streets-v9", //hosted style id
  center: [-122.675246, 45.529431], // starting position
  zoom: 13, // starting zoom
  minZoom: 11, // keep it local
});
/* ---------------------------------------- Polylines/line_string Code start--------------------------------------------------------- */
var styles = [
  // ACTIVE (being drawn)
  // line stroke
  {
    id: "gl-draw-line",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#D20C0C",
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },
  // polygon fill
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    paint: {
      "fill-color": "#D20C0C",
      "fill-outline-color": "#D20C0C",
      "fill-opacity": 0.1,
    },
  },
  // polygon mid points
  {
    id: "gl-draw-polygon-midpoint",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 3,
      "circle-color": "#fbb03b",
    },
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#D20C0C",
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },
  // vertex point halos
  {
    id: "gl-draw-polygon-and-line-vertex-halo-active",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
    ],
    paint: {
      "circle-radius": 5,
      "circle-color": "#FFF",
    },
  },
  // vertex points
  {
    id: "gl-draw-polygon-and-line-vertex-active",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
    ],
    paint: {
      "circle-radius": 3,
      "circle-color": "#D20C0C",
    },
  },

  // INACTIVE (static, already drawn)
  // line stroke
  {
    id: "gl-draw-line-static",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#000",
      "line-width": 3,
    },
  },
  // polygon fill
  {
    id: "gl-draw-polygon-fill-static",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
    paint: {
      "fill-color": "#000",
      "fill-outline-color": "#000",
      "fill-opacity": 0.1,
    },
  },
  // polygon outline
  {
    id: "gl-draw-polygon-stroke-static",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#000",
      "line-width": 3,
    },
  },
];
var draw = new MapboxDraw({
  displayControlsDefault: false,
  userProperties: true,
  controls: {
    line_string: true,
    polygon: true,
    trash: true,
  },
  styles: styles,
});

// add the draw tool to the map
map.addControl(draw);

map.on("draw.create", function (e) {
  var drawMode = draw.getMode();
  var drawnFeature = e.features[0];

  switch (drawMode) {
    case "draw_line_string":
      // Draw linestring here

      map.on("draw.create", updateRoute);
      break;
    case "draw_polygon":
      // Draw polygon here
      map.on("draw.create", updateArea);
      break;
    default:
      break;
  }
});
map.on("draw.update", function (e) {
  var drawMode = draw.getMode();
  var drawnFeature = e.features[0];

  switch (drawMode) {
    case "draw_line_string":
      // Draw linestring here
      map.on("draw.update", updateRoute);
      break;
    case "draw_polygon":
      // Draw polygon here
      map.on("draw.update", updateArea);
      break;
    default:
      // alert("no draw options");
      break;
  }
});

map.on("draw.delete", function (e) {
  var drawMode = draw.getMode();
  var drawnFeature = e.features[0];

  switch (drawMode) {
    case "draw_line_string":
      // Draw linestring here
      map.on("draw.delete", removeRoute);
      break;
    case "draw_polygon":
      // Draw polygon here
      map.on("draw.delete", updateArea);
      break;
    default:
      // alert("no draw options");
      break;
  }
});

// use the coordinates you just drew to make your directions request
function updateRoute() {
  removeRoute(); // overwrite any existing layers
  var data = draw.getAll();
  var answer = document.getElementById("calculated-line");
  var lastFeature = data.features.length - 1;
  var coords = data.features[lastFeature].geometry.coordinates;
  var newCoords = coords.join(";");
  getMatch(newCoords);
}

// make a directions request
function getMatch(e) {
  // https://www.mapbox.com/api-documentation/#directions
  var url =
    "https://api.mapbox.com/directions/v5/mapbox/driving/" +
    e +
    "?geometries=geojson&steps=true&&access_token=" +
    mapboxgl.accessToken;
  var req = new XMLHttpRequest();
  req.responseType = "json";
  req.open("GET", url, true);
  req.onload = function () {
    var jsonResponse = req.response;
    var distance = jsonResponse.routes[0].distance * 0.001; // convert to km
    var duration = jsonResponse.routes[0].duration / 60; // convert to minutes
    // add results to info box
    document.getElementById("calculated-line").innerHTML =
      "Distance: " +
      distance.toFixed(2) +
      " km<br>Duration: " +
      duration.toFixed(2) +
      " minutes";
    var coords = jsonResponse.routes[0].geometry;
    // add the route to the map
    addRoute(coords);
  };
  req.send();
}

// adds the route as a layer on the map
function addRoute(coords) {
  // check if the route is already loaded
  if (map.getSource("route")) {
    map.removeLayer("route");
    map.removeSource("route");
  } else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: coords,
        },
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b9ddd",
        "line-width": 8,
        "line-opacity": 0.8,
      },
    });
  }
}

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
    if (e.type !== "draw.delete") alert("Click the map to draw a polygon.");
  }
}

// remove the layer if it exists
function removeRoute() {
  if (map.getSource("route")) {
    map.removeLayer("route");
    map.removeSource("route");
    document.getElementById("calculated-line").innerHTML = "";
  } else {
    return;
  }
}
