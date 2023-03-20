/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiamFuamFudyIsImEiOiJjbGRtMHNyNDYwMXh3M29rZHlscTNic2tqIn0.GKtLpllzMPD6I4AIRIS7Yw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

//Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', //container id in HTML
    style: 'mapbox://styles/mapbox/streets-v12',  //****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});



/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable
let pedgeojson;
fetch('https://raw.githubusercontent.com/JaniceWg/Lab-4/main/data/pedcyc_collision_06-21.geojson')
.then(response => response.json())
.then(response => {
    console.log(response);   
    pedgeojson = response;
});

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

// Add data source and create a bounding box
map.on('load', () => {
   
let bboxgeojson;
let bbox = turf.envelope(pedgeojson);
let bboxscaled = turf.transformScale(bbox, 1.10); //increase size to 10%

//Convert result envelope in a geojson format to FeatureCollection
bboxgeojson = {
   "type": "FeatureCollection",
    "features": [bboxscaled]
};

map.addSource('collis-bbox', {
    type: 'geojson',
    data: bboxgeojson
});

console.log(bbox)
console.log(bbox.geometry.coordinates)


// create a hex grid
let bboxcoords = [bboxscaled.geometry.coordinates [0][0][0],
bboxscaled.geometry.coordinates [0][0][1],
bboxscaled.geometry.coordinates [0][2][0],
bboxscaled.geometry.coordinates [0][2][1]];
let hexgeojson = turf.hexGrid(bboxcoords, 0.5, {unites: 'kilometers'});



/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

//Collect properties from the point layer to polygons
let collishex = turf.collect(hexgeojson, pedgeojson, '_id', 'values');


//Count the number of features inside of each hexagon and identify max value
let maxcollis = 0;

collishex.features.forEach((feature) => {
    feature.properties.COUNT = feature.properties.values.length
    if (feature.properties.COUNT > maxcollis) {
        console.log(feature);
        maxcollis = feature.properties.COUNT
    }
});

//Add source and layer
map.addSource('colli-hex', {
    type: 'geojson',
    data: hexgeojson 
});

map.addLayer({
    'id': 'collis-hex-fill',
    'type': 'fill',
    'source': 'colli-hex',
    'paint': {
        'fill-color': [
            'step',
            ['get', 'COUNT'],
            '#00FFFF',
            10, '#FF1493',
            25, '#FF6347'
        ],
        'fill-opacity': 0.5,
        'fill-outline-color': "white"
    }
});
});



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


//Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

//Add fullscreen option to the map
map.addControl(new mapboxgl.FullscreenControl());

// //Create geocoder variable 
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
   mapboxgl: mapboxgl,
   countries: "ca"  });

// //Use geocoder div to position geocoder on page
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-105, 58],
       zoom: 3,
       essential: true
   });
});

//Add pop-up on map
map.on('click', 'collis-hex-fill', (e) => {
    new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML("<b>Collision count: </b>" + e.features[0].properties.COUNT)
    .addTo(map);
});

//Declare arrayy variables for labels and colours
const legendlabels = [
    '0-100,000',
    '100,000-500,000',
    '500,000-1,000,000',
    '1,000,000-5,000,000',
    '>5,000,000'
];

const legendcolours = [
    '#fd8d3c',
    '#fc4e2a',
    '#e31a1c',
    '#bd0026',
    '#800026'
];

//Declare legend variable using legend div tag
const legend = document.getElementById('legend');

//For each layer create a block to put the colour and label in
legendlabels.forEach((label, i) => {
    const color = legendcolours[i];

    const item = document.createElement('div'); 
    const key = document.createElement('span'); 

    key.className = 'legend-key'; 
    key.style.backgroundColor = color; 

    const value = document.createElement('span'); 
    value.innerHTML = `${label}`; 

    item.appendChild(key); 
    item.appendChild(value); 

    legend.appendChild(item); 
});

//Change display of legend based on check box
let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});


//Change map layer display based on check box using setlayoutproperty
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'provterr-fill',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});