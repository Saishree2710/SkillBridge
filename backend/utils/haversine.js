// Calculate the great-circle distance between two points on a sphere given their longitudes and latitudes
const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;

  const lat1 = coords1.lat;
  const lon1 = coords1.lng;
  const lat2 = coords2.lat;
  const lon2 = coords2.lng;

  const R = 6371; // km

  const x1 = lat2 - lat1;
  const dLat = toRad(x1);
  const x2 = lon2 - lon1;
  const dLon = toRad(x2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
};

// Convert distance to a proximity score between 0 and 100
// E.g. 0km = 100, 50km = 0
const calculateProximityScore = (distance) => {
  const maxDistance = 50; // max distance to consider
  if (distance > maxDistance) return 0;
  return Math.max(0, 100 - (distance / maxDistance) * 100);
};

module.exports = { haversineDistance, calculateProximityScore };
