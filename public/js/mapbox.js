export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZG9leHYiLCJhIjoiY2syb3N3a2NwMDdqMzNodGRid20zd2pvcSJ9.sSevBGM-4Pq6irmRze4ySg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/doexv/ckd5iwidq0nod1ir345avzyce',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker to map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extends the map bounds
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
